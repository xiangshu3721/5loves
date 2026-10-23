import { LANGUAGE_MAP, LANGUAGES, type LangCode } from "../data/languages";
import { QUESTIONS } from "../data/questions";
import { primaries, ranked, tally, type Scores } from "./score";

/** 云端正文与 mindtest-web `loves5-payload.mjs` / `loves5BodyParts` 对齐。
 * 30 个题侧语言码、计分、维度、结论、解释、建议和 sections 都按那份合成。
 * 不放题目原文、手机号或微信。
 */
export const LOVES5_VERSION = "loves5-h5-v1";
export const CONSENT_VERSION = "consent-assessment-loves5-1";
export const SCHEMA_VERSION = "1.0.0";
export const ASSESSMENT_ID = "loves5";
export const ASSESSMENT_NAME = "爱的 5 种语言";
export const LOVES5_SCREEN = "这是一份爱的语言整理，不是性格诊断，也不说明哪种语言更好。";
export const LOVES5_READER_GAP = "阅读页若尚未重绘爱的 5 种语言，五种语言的分数在 dimensions、viewModel.scores 与 textFallback。";

const REPORT_RE = /^rpt_[A-Za-z0-9_-]{11,64}$/;
const SUBMISSION_RE = /^sub_[A-Za-z0-9_-]{8,64}$/;
const SCORE_MAX = 12;

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

export function loves5PicksOk(list: unknown): list is LangCode[] {
  return Array.isArray(list)
    && list.length === QUESTIONS.length
    && list.every((value, index) => {
      const item = QUESTIONS[index];
      return typeof value === "string"
        && value.length === 1
        && `${item.left.code}${item.right.code}`.includes(value);
    });
}

function readScores(value: unknown): Scores | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<LangCode, unknown>>;
  const scores = {} as Scores;
  for (const item of LANGUAGES) {
    const n = source[item.code];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > SCORE_MAX) return null;
    scores[item.code] = n;
  }
  const total = LANGUAGES.reduce((sum, item) => sum + scores[item.code], 0);
  if (total !== QUESTIONS.length) return null;
  return scores;
}

function sameScores(left: Scores, right: Scores) {
  return LANGUAGES.every((item) => left[item.code] === right[item.code]);
}

type Scored = {
  scores: Scores;
  primaries: LangCode[];
  ranked: LangCode[];
  total: number;
};

function loves5Dimensions(scored: Scored) {
  const tied = scored.primaries.length > 1;
  return LANGUAGES.map((item) => ({
    id: item.code,
    name: item.name,
    kind: "score" as const,
    score: scored.scores[item.code],
    raw: scored.scores[item.code],
    max: SCORE_MAX,
    level: scored.primaries.includes(item.code) ? ("primary" as const) : ("other" as const),
    levelLabel: scored.primaries.includes(item.code) ? (tied ? "并列主爱语" : "主爱语") : null,
    narrative: item.meaning,
    labels: [] as string[],
  }));
}

function loves5Outcome(scored: Scored) {
  const title = scored.primaries.map((id) => LANGUAGE_MAP[id].name).join(" 与 ");
  const order = scored.ranked
    .map((id) => `${LANGUAGE_MAP[id].name} ${scored.scores[id]}`)
    .join(" · ");
  return {
    headline: title,
    code: scored.primaries.join(""),
    label: scored.primaries.length > 1 ? "并列主爱语" : "主爱语",
    summary: `${title}。从高到低：${order}。${LOVES5_SCREEN}`,
    flags: scored.primaries.length > 1 ? ["tied"] : [],
  };
}

function loves5Interpretation(scored: Scored) {
  const outcome = loves5Outcome(scored);
  const blocks = [
    { id: "verdict", title: outcome.headline, text: outcome.summary },
    { id: "screen", title: "不是诊断", text: LOVES5_SCREEN },
  ];
  for (const id of scored.ranked) {
    const item = LANGUAGE_MAP[id];
    blocks.push({
      id,
      title: item.name,
      text: `${scored.scores[id]} / ${SCORE_MAX}。${item.meaning}可以这样表达：${item.how}`,
    });
  }
  return blocks;
}

function loves5Recommendations() {
  return [
    { id: "screen", title: null, text: LOVES5_SCREEN },
    { id: "reader", title: null, text: LOVES5_READER_GAP },
  ];
}

function loves5Sections(scored: Scored) {
  const outcome = loves5Outcome(scored);
  return [
    { t: "h" as const, l: 2, x: outcome.headline },
    { t: "p" as const, x: outcome.summary },
    { t: "p" as const, x: LOVES5_SCREEN },
  ];
}

/** 与 vendor `loves5BodyParts` 同一份正文。作答不合法时返回 null。 */
export function loves5BodyParts(picks: LangCode[], rushed: boolean) {
  if (!loves5PicksOk(picks)) return null;
  const scores = tally(picks);
  const total = LANGUAGES.reduce((sum, item) => sum + scores[item.code], 0);
  if (total !== picks.length || LANGUAGES.some((item) => scores[item.code] > SCORE_MAX)) return null;
  const scored: Scored = {
    scores,
    primaries: primaries(scores),
    ranked: ranked(scores),
    total,
  };
  const sections = loves5Sections(scored);
  return {
    dimensions: loves5Dimensions(scored),
    result: loves5Outcome(scored),
    interpretation: loves5Interpretation(scored),
    recommendations: loves5Recommendations(),
    reportContent: {
      format: "view-model+sections" as const,
      viewModel: {
        picks: picks.slice(),
        scores: { ...scores },
        primaries: scored.primaries.slice(),
        ranked: scored.ranked.slice(),
        rushed: Boolean(rushed),
      },
      sections,
      textFallback: sections.map((section) => section.x).join(""),
    },
    score: {
      scores: { ...scores },
      primaries: scored.primaries.slice(),
      ranked: scored.ranked.slice(),
      total: scored.total,
    },
  };
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
  if (!input) return null;
  const nickname = loves5Nickname(input.nickname);
  const picks = input.picks;
  if (!nickname || phoneNickname(nickname) || !loves5PicksOk(picks)) return null;
  if (!input.reportId || !REPORT_RE.test(input.reportId)) return null;
  if (!input.clientSubmissionId || !SUBMISSION_RE.test(input.clientSubmissionId)) return null;
  if (!input.completedAt || !Number.isFinite(Date.parse(input.completedAt))) return null;

  if (input.scores != null) {
    const given = readScores(input.scores);
    if (!given || !sameScores(given, tally(picks))) return null;
  }

  const rushed = Boolean(input.rushed);
  const parts = loves5BodyParts(picks, rushed);
  if (!parts) return null;

  return {
    reportId: input.reportId,
    assessmentId: ASSESSMENT_ID,
    assessmentName: ASSESSMENT_NAME,
    assessmentVersion: LOVES5_VERSION,
    nickname,
    completedAt: input.completedAt,
    dimensions: parts.dimensions,
    result: parts.result,
    interpretation: parts.interpretation,
    recommendations: parts.recommendations,
    reportContent: parts.reportContent,
    extensionData: {
      answers: picks.slice(),
      score: parts.score,
      quality: { rushed },
      consent: {
        agreed: true as const,
        version: CONSENT_VERSION,
        at: input.completedAt,
        scopes: ["store", "share_link", "mentor_read"] as const,
      },
      compat: {
        level: "partial" as const,
        gaps: [LOVES5_READER_GAP],
      },
    },
    source: {
      site: ASSESSMENT_NAME,
      path: "index.html",
      repo: "5loves",
      origin: "external-repo",
      pageUrl: "https://xiangshu3721.github.io/5loves/",
      clientSubmissionId: input.clientSubmissionId,
      resultKitId: "loves5",
      localKey: "loves5-session",
    },
    schemaVersion: SCHEMA_VERSION,
  };
}
