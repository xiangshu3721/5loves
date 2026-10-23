import { LANGUAGES } from "../data/languages";
import { QUESTIONS } from "../data/questions";
import { primaries, ranked, tally, type Scores } from "./score";
import type { LangCode } from "../data/languages";

/** 云端协议与 ECR、寻根之旅同一条统一结果。
 * 只放 30 个选项字母、A–E 分数、主爱语和排序。不放题目原文、表达建议、手机号或微信。
 */
export const LOVES5_VERSION = "loves5-h5-v1";
export const CONSENT_VERSION = "consent-assessment-loves5-1";
export const SCHEMA_VERSION = "1.0.0";
export const ASSESSMENT_ID = "loves5";
export const ASSESSMENT_NAME = "爱的 5 种语言";
export const LOVES5_SCREEN_TEXT = "这是这一次更觉得被爱的方式，不是性格诊断。";
export const LOVES5_READER_GAP = "阅读页若尚未重绘爱的 5 种语言，五种分数、主爱语和排序在 interpretation、sections 与 textFallback。";

const REPORT_RE = /^rpt_[A-Za-z0-9_-]{11,64}$/;
const SUBMISSION_RE = /^sub_[A-Za-z0-9_-]{8,64}$/;
const CODES = new Set<string>(LANGUAGES.map((item) => item.code));

function chars(value: string) {
  return Array.from(String(value || ""));
}

/** 云端昵称沿用结果页已确认的称呼，去掉首尾空白后最多 12 个字。 */
export function loves5Nickname(value: unknown) {
  return chars(String(value || "").trim()).slice(0, 12).join("");
}

export function phoneNickname(value: string) {
  return /(?:^|[^\d])1[3-9]\d{9}(?:$|[^\d])/.test(value);
}

function readScores(value: unknown): Scores | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<LangCode, unknown>>;
  const scores = {} as Scores;
  for (const item of LANGUAGES) {
    const n = source[item.code];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 12) return null;
    scores[item.code] = n;
  }
  const total = LANGUAGES.reduce((sum, item) => sum + scores[item.code], 0);
  if (total !== QUESTIONS.length) return null;
  return scores;
}

function sameScores(left: Scores, right: Scores) {
  return LANGUAGES.every((item) => left[item.code] === right[item.code]);
}

function readPicks(value: unknown): LangCode[] | null {
  if (!Array.isArray(value) || value.length !== QUESTIONS.length) return null;
  if (!value.every((item) => typeof item === "string" && CODES.has(item))) return null;
  return value.slice() as LangCode[];
}

function scoreLine(scores: Scores) {
  return LANGUAGES.map((item) => `${item.name} ${scores[item.code]} / 12`).join("，");
}

export type Loves5ReportInput = {
  nickname?: unknown;
  reportId?: string;
  clientSubmissionId?: string;
  completedAt?: string;
  picks?: readonly string[] | null;
  scores?: Scores | null;
  rushed?: boolean;
};

export function buildLoves5Result(input?: Loves5ReportInput | null) {
  const nickname = loves5Nickname(input && input.nickname);
  if (!nickname || phoneNickname(nickname)) return null;
  if (!input?.reportId || !REPORT_RE.test(input.reportId)) return null;
  if (!input.clientSubmissionId || !SUBMISSION_RE.test(input.clientSubmissionId)) return null;
  if (!input.completedAt || !Number.isFinite(Date.parse(input.completedAt))) return null;

  const picksInput = input.picks;
  const hasPicks = Array.isArray(picksInput) && picksInput.length > 0;
  const picks = hasPicks ? readPicks(picksInput) : null;
  if (hasPicks && !picks) return null;

  const givenScores = input.scores == null ? null : readScores(input.scores);
  if (input.scores != null && !givenScores) return null;

  let scores: Scores;
  if (picks) {
    const computed = tally(picks);
    if (!readScores(computed)) return null;
    if (givenScores && !sameScores(computed, givenScores)) return null;
    scores = computed;
  } else if (givenScores) {
    scores = givenScores;
  } else {
    return null;
  }

  const winners = primaries(scores);
  const order = ranked(scores);
  const label = winners.map((code) => LANGUAGES.find((item) => item.code === code)?.name || code).join(" 与 ");
  const tied = winners.length > 1;
  const headline = `主爱语：${label}`;
  const summary = scoreLine(scores);
  const rushed = Boolean(input.rushed);
  const sections = [
    { t: "h" as const, l: 2, x: headline },
    { t: "p" as const, x: summary },
    { t: "p" as const, x: `排序：${order.map((code) => LANGUAGES.find((item) => item.code === code)?.name || code).join("、")}` },
    { t: "p" as const, x: LOVES5_SCREEN_TEXT },
  ];
  const scoreCopy: Scores = { A: scores.A, B: scores.B, C: scores.C, D: scores.D, E: scores.E };
  const pickCopy = picks ? picks.slice() : undefined;

  return {
    reportId: input.reportId,
    assessmentId: ASSESSMENT_ID,
    assessmentName: ASSESSMENT_NAME,
    assessmentVersion: LOVES5_VERSION,
    nickname,
    completedAt: input.completedAt,
    dimensions: LANGUAGES.map((item) => ({
      id: item.code,
      name: item.name,
      kind: "score" as const,
      score: scoreCopy[item.code],
      max: 12,
      level: winners.includes(item.code) ? "primary" : "scored",
      levelLabel: winners.includes(item.code) ? "主爱语" : "得分",
      narrative: `${scoreCopy[item.code]} / 12`,
      labels: [] as string[],
    })),
    result: {
      headline,
      code: tied ? "tied" : winners[0],
      label,
      summary,
      flags: tied ? ["tied"] : [],
    },
    interpretation: [
      { id: "verdict", title: headline, text: summary },
      { id: "screen", title: "不是诊断", text: LOVES5_SCREEN_TEXT },
      ...LANGUAGES.map((item) => ({
        id: item.code,
        title: item.name,
        text: `${scoreCopy[item.code]} / 12${winners.includes(item.code) ? "，主爱语" : ""}`,
      })),
      { id: "ranked", title: "排序", text: order.join("") },
    ],
    recommendations: [
      { id: "screen", title: null, text: LOVES5_SCREEN_TEXT },
      { id: "reader", title: null, text: LOVES5_READER_GAP },
    ],
    reportContent: {
      format: "view-model+sections" as const,
      viewModel: {
        ...(pickCopy ? { picks: pickCopy.slice() } : {}),
        scores: { ...scoreCopy },
        primaries: winners.slice(),
        ranked: order.slice(),
        rushed,
      },
      sections,
      textFallback: sections.map((section) => section.x).join(""),
    },
    extensionData: {
      ...(pickCopy ? { picks: pickCopy.slice() } : {}),
      scores: { ...scoreCopy },
      primaries: winners.slice(),
      ranked: order.slice(),
      quality: { rushed },
      consent: {
        agreed: true as const,
        version: CONSENT_VERSION,
        at: input.completedAt,
        scopes: ["store", "share_link", "mentor_read"] as const,
      },
      compat: { level: "partial" as const, gaps: [LOVES5_READER_GAP] },
    },
    source: {
      site: "ASVA 常用心理测试",
      path: "index.html",
      repo: "5loves",
      origin: "external-repo",
      pageUrl: "https://xiangshu3721.github.io/5loves/",
      clientSubmissionId: input.clientSubmissionId,
      resultKitId: "loves5",
      localKey: "5loves",
    },
    schemaVersion: SCHEMA_VERSION,
  };
}
