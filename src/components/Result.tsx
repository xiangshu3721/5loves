import { Check, LinkSimple } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { LANGUAGE_MAP, type LangCode } from "../data/languages";
import {
  primaries,
  ranked,
  resultUrl,
  type Scores,
} from "../lib/score";

type Props = {
  scores: Scores;
  onRetake: () => void;
};

export function Result({ scores, onRetake }: Props) {
  const reduce = useReducedMotion();
  const winners = primaries(scores);
  const order = ranked(scores);
  const [copied, setCopied] = useState(false);
  const [shownUrl, setShownUrl] = useState("");

  async function share() {
    const url = resultUrl(scores);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "我的爱的语言",
          url,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShownUrl(url);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShownUrl(url);
    }
  }

  const title =
    winners.length === 1
      ? LANGUAGE_MAP[winners[0]].name
      : winners.map((code) => LANGUAGE_MAP[code].name).join(" 与 ");

  return (
    <motion.main
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="font-display text-[clamp(2.2rem,10vw,3rem)] leading-[1.15] text-ink">
        {title}
      </h1>
      {winners.length > 1 ? (
        <p className="mt-2 text-sm text-muted">两种语言同分，都算主爱语。</p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {order.map((code) => (
          <ScoreRow key={code} code={code} value={scores[code]} max={12} />
        ))}
      </ul>

      <div className="sticky bottom-0 z-10 mt-8 flex flex-col gap-3 bg-blush/95 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <button
          type="button"
          onClick={share}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-rose py-3.5 text-base font-medium text-paper shadow-rose transition active:scale-[0.98]"
        >
          {copied ? <Check size={20} weight="bold" /> : <LinkSimple size={20} weight="bold" />}
          {copied ? "链接已复制" : "复制结果链接"}
        </button>
        {shownUrl ? (
          <p className="break-all rounded-[20px] bg-paper/80 px-4 py-3 text-xs leading-relaxed text-muted">
            {shownUrl}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRetake}
          className="w-full rounded-full border border-rose/30 bg-paper/70 py-3.5 text-base font-medium text-rose transition active:scale-[0.98]"
        >
          再测一次
        </button>
      </div>

      <section className="mt-8 space-y-8 pb-8">
        {order.map((code) => {
          const lang = LANGUAGE_MAP[code];
          return (
            <article key={code}>
              <h2 className="text-lg font-medium text-ink">
                {lang.name}{" "}
                <span className="text-sm font-normal text-muted">{lang.english}</span>
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/90">
                {lang.meaning}
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                可以这样表达：{lang.how}
              </p>
            </article>
          );
        })}
      </section>
    </motion.main>
  );
}

function ScoreRow({
  code,
  value,
  max,
}: {
  code: LangCode;
  value: number;
  max: number;
}) {
  const lang = LANGUAGE_MAP[code];
  const width = `${(value / max) * 100}%`;
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{lang.name}</span>
        <span className="tabular-nums text-sm text-muted">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-paper/80">
        <div className="h-full rounded-full bg-coral-ink" style={{ width }} />
      </div>
    </li>
  );
}
