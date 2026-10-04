// 历史记录 / 导出图片：用 public/result-kit.js（共用小工具，纯前端，只存本机）。
import { LANGUAGE_MAP } from "../data/languages";
import { primaries, ranked, type Scores } from "./score";

type Kit = {
  configure: (o: { id: string; title: string; capture?: () => unknown; start?: unknown }) => void;
  save: (s: unknown) => { ok: boolean };
  list: () => unknown[];
  exportImage: (s: unknown, t?: number, extra?: { nick?: string }) => void;
  showHistory: () => void;
  lastSave: () => { ok: boolean } | null;
  ensureNick: (cb: () => void, o?: { onCancel?: () => void }) => void;
  guard: (answering: boolean, onCancel?: () => void) => void;
  nickReset: () => void;
  capture: (root: Element | null, o?: { skip?: string }) => unknown;
};

export function kit(): Kit | undefined {
  return (window as unknown as { ResultKit?: Kit }).ResultKit;
}

export function setupKit() {
  const k = kit();
  // capture：导出图片时把结果页上展示的全部内容（含各语言的解读）抓下来画进长图
  k?.configure({ id: "5loves", title: "爱的 5 种语言", start: [{ sel: "button", text: "^\\s*(开始测试|继续上次)\\s*$" }], capture: () => k.capture(document.querySelector("main")) });
}

export function summaryOf(scores: Scores) {
  const winners = primaries(scores);
  const order = ranked(scores);
  const title = winners.map((code) => LANGUAGE_MAP[code].name).join(" 与 ");
  return {
    headline: `我的主爱语：${title}`,
    sub: winners.length > 1 ? "两种语言同分，都算主爱语。" : LANGUAGE_MAP[winners[0]].meaning,
    metrics: order.map((code) => ({
      label: LANGUAGE_MAP[code].name,
      value: `${scores[code]} / 12`,
      frac: scores[code] / 12,
      tone: winners.includes(code) ? "ok" : "mid",
    })),
    notes: winners.map((code) => `可以这样表达：${LANGUAGE_MAP[code].how}`),
  };
}

/** 交卷时保存一条记录。失败（无痕模式、空间满）时返回 false，结果页照常能看。 */
export function saveResult(scores: Scores): boolean {
  const k = kit();
  if (!k) return false;
  try {
    return k.save(summaryOf(scores)).ok;
  } catch {
    return false;
  }
}

export function historyCount(): number {
  try {
    return kit()?.list().length ?? 0;
  } catch {
    return 0;
  }
}
