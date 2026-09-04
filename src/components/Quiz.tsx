import { CaretLeft } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { Item } from "../data/questions";
import { QUESTIONS } from "../data/questions";

type Props = {
  index: number;
  item: Item;
  onPick: (side: "left" | "right") => void;
  onBack: () => void;
};

export function Quiz({ index, item, onPick, onBack }: Props) {
  const reduce = useReducedMotion();
  const total = QUESTIONS.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full bg-paper/80 text-ink transition active:scale-[0.96]"
          aria-label={index === 0 ? "返回首页" : "上一题"}
        >
          <CaretLeft size={22} weight="bold" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-paper/80">
            <div
              className="h-full rounded-full bg-coral-ink transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="tabular-nums text-sm font-medium text-muted">
          {index + 1}/{total}
        </p>
      </div>

      <p className="mt-8 text-sm text-muted">选出更让你觉得被爱的一句</p>

      <motion.div
        key={item.id}
        className="mt-4 flex flex-1 flex-col gap-4"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <ChoiceButton text={item.left.text} onClick={() => onPick("left")} />
        <p className="text-center text-sm text-muted">或</p>
        <ChoiceButton text={item.right.text} onClick={() => onPick("right")} />
      </motion.div>
    </main>
  );
}

function ChoiceButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-32 rounded-[28px] bg-paper bg-[url('/art/wash-card.png')] bg-cover bg-center px-5 py-6 text-left text-[1.05rem] leading-relaxed text-ink shadow-rose transition active:scale-[0.985]"
    >
      {text}
    </button>
  );
}
