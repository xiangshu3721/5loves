import { motion, useReducedMotion } from "motion/react";
import { LoveCluster } from "./LoveCluster";

type Props = {
  onStart: () => void;
  canResume: boolean;
  onResume: () => void;
};

export function Intro({ onStart, canResume, onResume }: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.main
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="pt-2">
        <h1 className="font-display text-[clamp(2.6rem,12vw,3.6rem)] leading-[1.15] text-ink">
          爱的5种语言
        </h1>
        <p className="mt-2 max-w-[28ch] text-[1.05rem] leading-relaxed text-muted">
          你们表达爱的方式，真的对了吗？
        </p>
      </header>

      <LoveCluster />

      <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">
        共 30 题。每一题有两句话，选出更接近「这样我会觉得被爱」的一句。两句都想选时，仍只选一句。
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-full bg-rose py-3.5 text-base font-medium text-paper shadow-rose transition active:scale-[0.98]"
        >
          开始测试
        </button>
        {canResume ? (
          <button
            type="button"
            onClick={onResume}
            className="w-full rounded-full border border-rose/30 bg-paper/70 py-3.5 text-base font-medium text-rose transition active:scale-[0.98]"
          >
            继续上次
          </button>
        ) : null}
      </div>
    </motion.main>
  );
}
