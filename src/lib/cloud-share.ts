import type { LangCode } from "../data/languages";
import type { Scores } from "./score";
import {
  ASSESSMENT_CLOUD_CONFIG,
  backoffMs,
  buildShareUrl,
  createCloudStore,
  createSubmissionIds,
  gateSubmit,
  isoShanghai,
  loves5OrderKey,
  resolveEndpoint,
  resolveReportBase,
  type KeyValueStorage,
} from "./cloud-client";
import { buildLoves5Result, loves5Nickname, phoneNickname } from "./cloud-payload";

export type ShareView = { saving: boolean; note: string; url: string; failed: boolean };

type PendingItem = {
  reportId: string;
  clientSubmissionId: string;
  linkSecret: string;
  ownerToken: string;
  orderKey: string;
  payload: ReturnType<typeof buildLoves5Result>;
  attempts: number;
  nextAt: number;
  lastError: string;
};

type Room = {
  key: string;
  nickname: string;
  picks: LangCode[];
  scores: Scores;
  storage: KeyValueStorage;
  listeners: Set<(view: ShareView) => void>;
  view: ShareView;
  generation: object | null;
  timer: ReturnType<typeof setTimeout> | 0;
  copyTimer: ReturnType<typeof setTimeout> | 0;
  running: boolean;
};

const rooms = new Map<string, Room>();

export function loves5ShareKey(nickname: string, picks: readonly LangCode[], scores: Scores) {
  return loves5OrderKey(loves5Nickname(nickname), picks, scores);
}

export function loves5SubmitBody(item: { payload: unknown; linkSecret: string; ownerToken: string }) {
  return { result: item.payload, linkSecret: item.linkSecret, ownerToken: item.ownerToken };
}

function storageOf(): KeyValueStorage {
  return globalThis.localStorage;
}

function emit(room: Room, view: ShareView) {
  room.view = view;
  room.listeners.forEach((listener) => listener(view));
}

function pendingItem(storage: KeyValueStorage, key: string) {
  return createCloudStore(storage).pending().find((entry) => entry && typeof entry === "object" && (entry as PendingItem).orderKey === key) as PendingItem | undefined;
}

function activeUrl(storage: KeyValueStorage, key: string) {
  const saved = createCloudStore(storage).links()[key];
  if (!saved || saved.status !== "active" || !saved.reportUrl) return "";
  return saved.reportUrl;
}

function initialView(storage: KeyValueStorage, key: string): ShareView {
  const url = activeUrl(storage, key);
  if (url) return { saving: false, note: "", url, failed: false };
  const pending = pendingItem(storage, key);
  const failed = Boolean(pending && pending.attempts > 0 && pending.lastError);
  return { saving: false, note: failed ? pending?.lastError || "这次没生成链接" : "", url: "", failed };
}

function resultPayload(
  room: Room,
  ids: { reportId: string; clientSubmissionId: string; completedAt: string },
) {
  return buildLoves5Result({
    nickname: room.nickname,
    picks: room.picks,
    scores: room.scores,
    reportId: ids.reportId,
    clientSubmissionId: ids.clientSubmissionId,
    completedAt: ids.completedAt,
    rushed: false,
  });
}

function ensurePending(room: Room) {
  const cloud = createCloudStore(room.storage);
  const found = pendingItem(room.storage, room.key);
  if (found) {
    const previous = found.payload;
    const completedAt = previous && previous.completedAt ? previous.completedAt : isoShanghai(new Date());
    const payload = resultPayload(room, {
      reportId: found.reportId,
      clientSubmissionId: found.clientSubmissionId,
      completedAt,
    });
    if (!payload) return null;
    found.payload = payload;
    cloud.upsertPending(found);
    return found;
  }
  const ids = createSubmissionIds();
  if (ids.linkSecret === ids.ownerToken) ids.ownerToken = createSubmissionIds().ownerToken;
  const payload = resultPayload(room, {
    reportId: ids.reportId,
    clientSubmissionId: ids.clientSubmissionId,
    completedAt: isoShanghai(new Date()),
  });
  if (!payload) return null;
  const item: PendingItem = { ...ids, orderKey: room.key, payload, attempts: 0, nextAt: 0, lastError: "" };
  cloud.upsertPending(item);
  cloud.saveOwner(ids.reportId, ids.ownerToken);
  return item;
}

function rememberLink(room: Room, item: PendingItem) {
  const reportUrl = buildShareUrl(resolveReportBase(globalThis.location, ASSESSMENT_CLOUD_CONFIG), item.reportId, item.linkSecret);
  const cloud = createCloudStore(room.storage);
  cloud.removePending(item.reportId);
  cloud.saveLink(room.key, { reportId: item.reportId, reportUrl, status: "active", byteSize: 0 });
  emit(room, { saving: false, note: "", url: reportUrl, failed: false });
}

function failPending(room: Room, item: PendingItem, message: string, generation: object) {
  const cloud = createCloudStore(room.storage);
  item.attempts += 1;
  item.lastError = message;
  item.nextAt = Date.now() + backoffMs(item.attempts);
  cloud.upsertPending(item);
  if (room.generation !== generation) return;
  emit(room, { saving: false, note: message, url: "", failed: true });
  if (item.attempts < 8) {
    clearTimeout(room.timer);
    room.timer = setTimeout(() => {
      if (room.generation === generation) void run(room);
    }, backoffMs(item.attempts));
  }
}

async function run(room: Room) {
  if (room.running) return;
  room.running = true;
  const generation = {};
  room.generation = generation;
  clearTimeout(room.timer);
  room.timer = 0;
  let item: PendingItem | null = null;
  try {
    const saved = activeUrl(room.storage, room.key);
    if (saved) {
      emit(room, { saving: false, note: room.view.note === "链接已复制" ? room.view.note : "", url: saved, failed: false });
      return;
    }
    const nickname = loves5Nickname(room.nickname);
    const endpoint = resolveEndpoint(globalThis.location, ASSESSMENT_CLOUD_CONFIG);
    const gate = gateSubmit({ agreed: true, endpoint, nickname });
    if (!gate.ok) {
      emit(room, { saving: false, note: gate.reason === "nickname" ? "先写一个称呼，才能分享" : "现在没法生成链接", url: "", failed: true });
      return;
    }
    if (phoneNickname(nickname)) {
      emit(room, { saving: false, note: "称呼不能是手机号", url: "", failed: true });
      return;
    }
    emit(room, { saving: true, note: "链接生成中", url: "", failed: false });
    item = ensurePending(room);
    if (room.generation !== generation) return;
    if (!item) {
      emit(room, { saving: false, note: "这一次结果不完整，没法分享", url: "", failed: true });
      return;
    }
    const response = await fetch(`${endpoint}/v1/results`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(loves5SubmitBody(item)),
    });
    if (room.generation !== generation) return;
    const body = await response.json().catch(() => ({})) as { reportId?: string };
    if (room.generation !== generation) return;
    if (response.status === 200 && body.reportId) {
      rememberLink(room, item);
      return;
    }
    if (response.status === 409) {
      const savedResponse = await fetch(`${endpoint}/v1/results/read`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId: item.reportId, linkSecret: item.linkSecret }),
      });
      if (room.generation !== generation) return;
      if (savedResponse.status === 200) {
        rememberLink(room, item);
        return;
      }
      item.lastError = "这次没生成链接";
      item.attempts = 8;
      createCloudStore(room.storage).upsertPending(item);
      emit(room, { saving: false, note: item.lastError, url: "", failed: true });
      return;
    }
    if (response.status === 422) {
      item.lastError = "这次没生成链接";
      item.attempts = 8;
      createCloudStore(room.storage).upsertPending(item);
      emit(room, { saving: false, note: item.lastError, url: "", failed: true });
      return;
    }
    failPending(room, item, response.status === 429 ? "刚才点得太快了，稍后再试" : "这次没生成链接", generation);
  } catch {
    if (room.generation !== generation) return;
    if (item) failPending(room, item, "这次没生成链接", generation);
    else emit(room, { saving: false, note: "这次没生成链接", url: "", failed: true });
  } finally {
    room.running = false;
  }
}

export function watchLoves5Share(
  input: { nickname: string; picks: LangCode[]; scores: Scores },
  onView: (view: ShareView) => void,
  storage = storageOf(),
) {
  const nickname = loves5Nickname(input.nickname);
  const key = loves5OrderKey(nickname, input.picks, input.scores);
  let room = rooms.get(key);
  if (!room || room.storage !== storage) {
    room = {
      key,
      nickname,
      picks: input.picks,
      scores: input.scores,
      storage,
      listeners: new Set(),
      view: initialView(storage, key),
      generation: null,
      timer: 0,
      copyTimer: 0,
      running: false,
    };
    rooms.set(key, room);
  } else {
    room.nickname = nickname;
    room.picks = input.picks;
    room.scores = input.scores;
  }
  room.listeners.add(onView);
  onView(room.view);
  if (!room.view.url && !room.running && !room.timer) {
    const pending = pendingItem(storage, key);
    if (pending && pending.attempts > 0 && pending.attempts < 8) {
      const wait = Math.max(0, (pending.nextAt || 0) - Date.now());
      room.timer = setTimeout(() => { void run(room); }, wait);
    } else if (!room.view.failed) {
      void run(room);
    }
  }
  return { key, stop() { room.listeners.delete(onView); } };
}

export function retryLoves5Share(key: string) {
  const room = rooms.get(key);
  if (!room || room.running) return;
  clearTimeout(room.timer);
  room.timer = 0;
  const pending = pendingItem(room.storage, key);
  if (pending) {
    pending.attempts = 0;
    pending.lastError = "";
    pending.nextAt = 0;
    createCloudStore(room.storage).upsertPending(pending);
  }
  room.generation = {};
  void run(room);
}

async function writeClipboard(text: string) {
  const nav = globalThis.navigator;
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(text);
      return;
    } catch {
      /* 下面再试一次系统复制。 */
    }
  }
  const doc = globalThis.document;
  if (!doc) throw new Error("copy");
  const area = doc.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  doc.body.appendChild(area);
  area.select();
  const ok = doc.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy");
}

export async function activateLoves5Share(key: string) {
  const room = rooms.get(key);
  if (!room) return;
  if (room.view.url) {
    try {
      await writeClipboard(room.view.url);
      emit(room, { ...room.view, note: "链接已复制", failed: false });
      clearTimeout(room.copyTimer);
      room.copyTimer = setTimeout(() => {
        if (room.view.note === "链接已复制") emit(room, { ...room.view, note: "" });
      }, 2500);
    } catch {
      emit(room, { ...room.view, note: "没复制上，再点一次" });
    }
    return;
  }
  if (room.running || room.view.saving) {
    emit(room, { ...room.view, note: "链接生成中，稍后再试" });
    return;
  }
  retryLoves5Share(key);
}
