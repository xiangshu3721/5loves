import type { LangCode } from "../data/languages";
import { LANGUAGES } from "../data/languages";
import { QUESTIONS } from "../data/questions";

export type Scores = Record<LangCode, number>;

export const EMPTY_SCORES: Scores = { A: 0, B: 0, C: 0, D: 0, E: 0 };

export function tally(picks: LangCode[]): Scores {
  const scores = { ...EMPTY_SCORES };
  for (const code of picks) scores[code] += 1;
  return scores;
}

export function primaries(scores: Scores): LangCode[] {
  const max = Math.max(...LANGUAGES.map((item) => scores[item.code]));
  return LANGUAGES.filter((item) => scores[item.code] === max).map(
    (item) => item.code,
  );
}

export function ranked(scores: Scores): LangCode[] {
  return [...LANGUAGES]
    .sort((a, b) => scores[b.code] - scores[a.code] || a.code.localeCompare(b.code))
    .map((item) => item.code);
}

export function encodeScores(scores: Scores): string {
  return LANGUAGES.map((item) => scores[item.code]).join("-");
}

export function decodeScores(raw: string | null): Scores | null {
  if (!raw) return null;
  const parts = raw.split("-").map((n) => Number(n));
  if (parts.length !== 5 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 12)) {
    return null;
  }
  const scores: Scores = {
    A: parts[0],
    B: parts[1],
    C: parts[2],
    D: parts[3],
    E: parts[4],
  };
  const total = parts.reduce((sum, n) => sum + n, 0);
  if (total !== QUESTIONS.length) return null;
  return scores;
}

export function resultUrl(scores: Scores): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("r", encodeScores(scores));
  return url.toString();
}
