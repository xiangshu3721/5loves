import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "./data/questions";
import type { LangCode } from "./data/languages";
import { Intro } from "./components/Intro";
import { Quiz } from "./components/Quiz";
import { Result } from "./components/Result";
import { decodeScores, tally, type Scores } from "./lib/score";
import { clearProgress, loadProgress, saveProgress } from "./lib/storage";
import { kit, saveResult, setupKit } from "./lib/records";

setupKit();

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
  // null = 这次没有交卷（打开的是分享链接）；true / false = 本次交卷后保存成功 / 失败
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => {
    if (shared) return;
    const saved = loadProgress();
    setCanResume(Boolean(saved && saved.picks.length > 0 && saved.index < QUESTIONS.length));
  }, [shared]);

  // 昵称门槛：开始 / 继续 / 再测一次，都要先录好昵称并点「开始测评」
  function startFresh() {
    const k = kit();
    if (k) k.ensureNick(doStart);
    else doStart();
  }

  function doStart() {
    clearProgress();
    setPicks([]);
    setIndex(0);
    setScores(null);
    setSaved(null);
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
    const go = () => {
      setPicks(saved.picks as LangCode[]);
      setIndex(saved.index);
      setScreen("quiz");
    };
    const k = kit();
    if (k) k.ensureNick(go);
    else go();
  }

  // 保险：不管从哪条路进到答题页，没确认过昵称就先补录，点「返回」回首页
  useEffect(() => {
    if (screen === "quiz") kit()?.guard(true, () => setScreen("intro"));
  }, [screen]);

  function pick(side: "left" | "right") {
    const item = QUESTIONS[index];
    const code = side === "left" ? item.left.code : item.right.code;
    const nextPicks = [...picks.slice(0, index), code];
    const nextIndex = index + 1;
    setPicks(nextPicks);
    if (nextIndex >= QUESTIONS.length) {
      const nextScores = tally(nextPicks);
      setScores(nextScores);
      setSaved(saveResult(nextScores));
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
    return (
      <Result
        scores={scores}
        onRetake={() => {
          kit()?.nickReset();
          startFresh();
        }}
        saved={saved}
      />
    );
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
