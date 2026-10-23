import { Check, LinkSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { LangCode } from "../data/languages";
import { kit } from "../lib/records";
import type { Scores } from "../lib/score";
import { activateLoves5Share, loves5ShareKey, retryLoves5Share, watchLoves5Share, type ShareView } from "../lib/cloud-share";

function readLoves5Nickname() {
  try {
    const fromKit = kit()?.nick?.get?.();
    if (fromKit) return fromKit;
  } catch {
    /* 没有结果工具时仍显示本地结果。 */
  }
  try {
    return globalThis.localStorage?.getItem("rk.v1.nickname") || "";
  } catch {
    return "";
  }
}

export function ShareResult({ scores, picks }: { scores: Scores; picks: LangCode[] }) {
  const nickname = readLoves5Nickname();
  const key = loves5ShareKey(nickname, picks, scores);
  const [view, setView] = useState<ShareView>({ saving: false, note: "", url: "", failed: false });
  useEffect(() => watchLoves5Share({ nickname, picks, scores }, setView).stop, [key, nickname, picks, scores]);
  const busy = view.saving && !view.url;
  const copied = view.note === "链接已复制";
  const warn = Boolean(view.note && view.note !== "链接已复制" && view.note !== "链接生成中");
  return (
    <>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void activateLoves5Share(key)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rose py-3.5 text-base font-medium text-paper shadow-rose transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 disabled:active:scale-100"
      >
        {copied ? <Check size={20} weight="bold" /> : <LinkSimple size={20} weight="bold" />}
        {busy ? "分享结果 · 生成中" : "分享结果"}
      </button>
      {view.failed && !busy ? (
        <button type="button" onClick={() => retryLoves5Share(key)} className="min-h-11 self-center text-sm font-medium text-rose underline underline-offset-4">
          重试
        </button>
      ) : null}
      {view.note ? (
        <p role="status" className={`text-center text-xs leading-relaxed ${warn ? "text-rose" : "text-muted"}`}>
          {view.note}
        </p>
      ) : null}
    </>
  );
}
