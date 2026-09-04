import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "./data/questions";
import type { LangCode } from "./data/languages";
import { Intro } from "./components/Intro";
import { Quiz } from "./components/Quiz";
import { Result } from "./components/Result";
import { decodeScores, tally, type Scores } from "./lib/score";
import { clearProgress, loadProgress, saveProgress } from "./lib/storage";

type Screen = "intro" | "quiz" | "result";

export function App() {
  const shared = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return decodeScores(params.get("r"));
  }, []);

  const [screen, setScreen] = useState<Screen>(shared ? "result" : "intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<LangCode[]>([]);
  const [scores, setScores] = useState<Scores | null>(shared);
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    if (shared) return;
    const saved = loadProgress();
    setCanResume(Boolean(saved && saved.picks.length > 0 && saved.index < QUESTIONS.length));
  }, [shared]);

  function startFresh() {
    clearProgress();
    setPicks([]);
    setIndex(0);
    setScores(null);
    setCanResume(false);
    if (window.location.search) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url);
    }
    setScreen("quiz");
  }

  function resume() {
    const saved = loadProgress();
    if (!saved) {
      startFresh();
      return;
    }
    setPicks(saved.picks as LangCode[]);
    setIndex(saved.index);
    setScreen("quiz");
  }

  function pick(side: "left" | "right") {
    const item = QUESTIONS[index];
    const code = side === "left" ? item.left.code : item.right.code;
    const nextPicks = [...picks.slice(0, index), code];
    const nextIndex = index + 1;
    setPicks(nextPicks);
    if (nextIndex >= QUESTIONS.length) {
      const nextScores = tally(nextPicks);
      setScores(nextScores);
      clearProgress();
      setScreen("result");
      return;
    }
    setIndex(nextIndex);
    saveProgress(nextPicks, nextIndex);
  }

  function back() {
    if (index === 0) {
      setScreen("intro");
      return;
    }
    const nextIndex = index - 1;
    const nextPicks = picks.slice(0, nextIndex);
    setIndex(nextIndex);
    setPicks(nextPicks);
    saveProgress(nextPicks, nextIndex);
  }

  if (screen === "result" && scores) {
    return <Result scores={scores} onRetake={startFresh} />;
  }

  if (screen === "quiz") {
    return (
      <Quiz
        index={index}
        item={QUESTIONS[index]}
        onPick={pick}
        onBack={back}
      />
    );
  }

  return (
    <Intro onStart={startFresh} canResume={canResume} onResume={resume} />
  );
}
