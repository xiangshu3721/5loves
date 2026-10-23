import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";
// tests/vendor 是 mindtest-web cursor/sefs-allow-assessment-75bb 上
// cloud/assessment-report/vendor/loves5-*.mjs 的原样副本，用来锁定正文。
import { buildLoves5Result as vendorBuild } from "./vendor/loves5-payload.mjs";
import {
  LANGUAGES as VENDOR_LANGUAGES,
  LOVES5_READER_GAP as VENDOR_GAP,
  LOVES5_SCREEN as VENDOR_SCREEN,
  PAIRS,
  loves5BodyParts,
} from "./vendor/loves5-score.mjs";

const cache = new Map();

function loadTS(path) {
  const filename = resolve(fileURLToPath(new URL(".", import.meta.url)), path);
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    Date,
    Set,
    Map,
    Array,
    Math,
    Number,
    String,
    Object,
    JSON,
    Intl,
    Uint8Array,
    btoa: globalThis.btoa,
    crypto: globalThis.crypto,
    console,
  };
  sandbox.globalThis = sandbox;
  sandbox.require = (id) => {
    if (id.startsWith(".")) return loadTS(resolve(dirname(filename), id.endsWith(".ts") ? id : `${id}.ts`));
    return createRequire(import.meta.url)(id);
  };
  cache.set(filename, module);
  runInNewContext(compiled, sandbox, { filename });
  return module.exports;
}

const payload = loadTS("../src/lib/cloud-payload.ts");
const client = loadTS("../src/lib/cloud-client.ts");
const score = loadTS("../src/lib/score.ts");
const questions = loadTS("../src/data/questions.ts");
const languages = loadTS("../src/data/languages.ts");

const {
  buildLoves5Result,
  loves5Nickname,
  ASSESSMENT_ID,
  ASSESSMENT_NAME,
  LOVES5_VERSION,
  SCHEMA_VERSION,
  LOVES5_SCREEN,
  LOVES5_READER_GAP,
} = payload;
const { tally, primaries, ranked } = score;
const { buildShareUrl, parseShareLink, createSubmissionIds, ASSESSMENT_CLOUD_CONFIG } = client;
const { QUESTIONS } = questions;
const { LANGUAGES } = languages;

function base(extra) {
  return {
    nickname: "林深",
    reportId: "rpt_abcdefghijk",
    clientSubmissionId: "sub_abcdefghijklmnop",
    completedAt: "2026-10-23T15:04:05+08:00",
    ...extra,
  };
}

function sidePicks(side) {
  return QUESTIONS.map((item) => item[side].code);
}

const TIED_PICKS = "EBBDECDEABCDCECBDBCAEDCCDEEDCE".split("");

function same(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

test("称呼取前 12 个字，空称呼、手机号和坏答案不上传", () => {
  assert.equal(loves5Nickname(" 林深 "), "林深");
  assert.equal(loves5Nickname(`${"林深".repeat(6)}尾`), "林深".repeat(6));
  assert.equal(loves5Nickname(" "), "");
  const picks = sidePicks("left");
  const scores = tally(picks);
  assert.equal(buildLoves5Result(base({ nickname: " ", picks, scores })), null);
  assert.equal(buildLoves5Result(base({ nickname: "13800000000", picks, scores })), null);
  assert.equal(buildLoves5Result(base({ picks: picks.slice(0, 29), scores })), null);
  assert.equal(buildLoves5Result(base({ picks: picks.map((code, index) => (index === 0 ? "Z" : code)), scores })), null);
  assert.equal(buildLoves5Result(base({ picks: picks.map((code, index) => (index === 0 ? "B" : code)), scores })), null);
  assert.equal(buildLoves5Result(base({ picks, scores, reportId: "" })), null);
  assert.equal(buildLoves5Result(base({ picks, scores, clientSubmissionId: "nope" })), null);
  assert.equal(buildLoves5Result(base({ picks, scores, completedAt: "昨天" })), null);
  assert.equal(buildLoves5Result(base({ scores: { A: 13, B: 8, C: 5, D: 4, E: 0 } })), null);
  assert.equal(buildLoves5Result(base({ scores: { A: 8, B: 8, C: 8, D: 0, E: 0 } })), null);
  assert.equal(buildLoves5Result(base({ scores: { A: 6.5, B: 6, C: 6, D: 6, E: 5.5 } })), null);
  assert.equal(buildLoves5Result(base({ picks, scores: { A: 10, B: 8, C: 6, D: 4, E: 2 } })), null);
  assert.equal(buildLoves5Result(base({})), null);
});

test("30 个题侧选项生成协议，分数在 extensionData.score，不含题目和私人字段", () => {
  const picks = sidePicks("left");
  const scores = tally(picks);
  const winners = primaries(scores);
  const report = buildLoves5Result(base({
    nickname: `${"林深".repeat(6)}多余`,
    picks,
    scores,
    phone: "13800000000",
    wechat: "secret-wechat",
    wechatQr: "secret-qr",
    linkSecret: "secret-link",
    ownerToken: "secret-owner",
    profile: { name: "张三", phone: "13800000000" },
  }));
  const packed = JSON.stringify(report);
  assert.equal(report.assessmentId, "loves5");
  assert.equal(report.assessmentId, ASSESSMENT_ID);
  assert.equal(report.assessmentName, "爱的 5 种语言");
  assert.equal(report.assessmentName, ASSESSMENT_NAME);
  assert.equal(report.assessmentVersion, "loves5-h5-v1");
  assert.equal(report.assessmentVersion, LOVES5_VERSION);
  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.schemaVersion, SCHEMA_VERSION);
  assert.equal(report.nickname, "林深".repeat(6));
  same(report.extensionData.answers, picks);
  same(report.reportContent.viewModel.picks, picks);
  same(report.extensionData.score.scores, scores);
  same(report.reportContent.viewModel.scores, scores);
  same(report.extensionData.score.primaries, winners);
  same(report.extensionData.score.ranked, ranked(scores));
  assert.equal(report.extensionData.score.total, 30);
  same(report.reportContent.viewModel.primaries, winners);
  same(report.reportContent.viewModel.ranked, ranked(scores));
  assert.equal(report.extensionData.picks, undefined);
  assert.equal(report.extensionData.scores, undefined);
  assert.equal(report.extensionData.primaries, undefined);
  assert.equal(report.extensionData.ranked, undefined);
  for (const code of ["A", "B", "C", "D", "E"]) {
    assert.equal(report.extensionData.score.scores[code] >= 0 && report.extensionData.score.scores[code] <= 12, true);
  }
  same(report.dimensions.map((item) => item.id), ["A", "B", "C", "D", "E"]);
  same(report.dimensions.map((item) => item.score), ["A", "B", "C", "D", "E"].map((code) => scores[code]));
  same(report.dimensions.map((item) => item.raw), ["A", "B", "C", "D", "E"].map((code) => scores[code]));
  same(report.dimensions.map((item) => item.name), LANGUAGES.map((item) => item.name));
  same(report.dimensions.map((item) => item.narrative), LANGUAGES.map((item) => item.meaning));
  assert.equal(report.result.code, winners.join(""));
  assert.equal(report.result.code === "tied", false);
  assert.equal(report.result.headline, LANGUAGES.find((item) => item.code === winners[0]).name);
  assert.equal(report.result.label, "主爱语");
  assert.equal(report.result.flags.length, 0);
  assert.equal(report.result.summary.includes(LOVES5_SCREEN), true);
  assert.equal(report.extensionData.quality.rushed, false);
  assert.equal(report.reportContent.viewModel.rushed, false);
  assert.equal(report.extensionData.consent.version, "consent-assessment-loves5-1");
  same(report.extensionData.consent.scopes, ["store", "share_link", "mentor_read"]);
  assert.equal(report.extensionData.compat.level, "partial");
  assert.equal(report.extensionData.compat.gaps[0], LOVES5_READER_GAP);
  assert.equal(LOVES5_SCREEN, VENDOR_SCREEN);
  assert.equal(LOVES5_READER_GAP, VENDOR_GAP);
  assert.equal(report.source.site, "爱的 5 种语言");
  assert.equal(report.source.repo, "5loves");
  assert.equal(report.source.origin, "external-repo");
  assert.equal(report.source.path, "index.html");
  assert.equal(report.source.pageUrl, "https://xiangshu3721.github.io/5loves/");
  assert.equal(report.source.resultKitId, "loves5");
  assert.equal(report.source.localKey, "loves5-session");
  assert.equal(report.reportContent.format, "view-model+sections");
  assert.equal(report.reportContent.textFallback, report.reportContent.sections.map((section) => section.x).join(""));
  assert.equal(report.recommendations[0].title, null);
  assert.equal(report.recommendations[0].text, LOVES5_SCREEN);
  assert.equal(report.recommendations[1].text, LOVES5_READER_GAP);
  assert.equal(packed.includes("13800000000"), false);
  assert.equal(packed.includes("secret-wechat"), false);
  assert.equal(packed.includes("secret-qr"), false);
  assert.equal(packed.includes("secret-link"), false);
  assert.equal(packed.includes("secret-owner"), false);
  assert.equal(packed.includes("张三"), false);
  assert.equal(packed.includes(QUESTIONS[0].left.text), false);
  assert.equal(packed.includes("微信"), false);
  assert.equal(packed.includes("二维码"), false);
  for (const key of ["phone", "wechat", "wechatQr", "profile", "linkSecret", "ownerToken", "picks", "scores", "primaries", "ranked"]) {
    assert.equal(Object.keys(report.extensionData).includes(key), false, key);
  }
  same(Object.keys(report).sort(), [
    "assessmentId", "assessmentName", "assessmentVersion", "completedAt", "dimensions",
    "extensionData", "interpretation", "nickname", "recommendations", "reportContent",
    "reportId", "result", "schemaVersion", "source",
  ].sort());
  same(Object.keys(report.extensionData).sort(), ["answers", "compat", "consent", "quality", "score"]);
  same(Object.keys(report.extensionData.score).sort(), ["primaries", "ranked", "scores", "total"]);
});

test("没有 30 道题侧选项时不生成；并列主爱语的 code 是字母连写", () => {
  assert.equal(buildLoves5Result(base({ scores: { A: 10, B: 10, C: 4, D: 3, E: 3 } })), null);
  const picks = TIED_PICKS;
  const scores = tally(picks);
  const report = buildLoves5Result(base({ picks, scores }));
  same(report.extensionData.answers, picks);
  same(report.extensionData.score.scores, scores);
  same(report.extensionData.score.primaries, ["C", "E"]);
  assert.equal(report.result.code, "CE");
  same(report.result.flags, ["tied"]);
  assert.equal(report.result.label, "并列主爱语");
  assert.equal(report.result.headline, "接受礼物 与 身体的接触");
  const primary = report.dimensions.filter((item) => item.level === "primary");
  assert.equal(primary.map((item) => item.id).join(""), "CE");
  assert.equal(primary.every((item) => item.levelLabel === "并列主爱语"), true);
  assert.equal(report.dimensions.filter((item) => item.level === "other").every((item) => item.levelLabel === null), true);
});

test("按题目左右选项作答时五种分数都在 0 到 12 且合计 30", () => {
  for (const picks of [sidePicks("left"), sidePicks("right")]) {
    const scores = tally(picks);
    const report = buildLoves5Result(base({ picks, scores }));
    const values = ["A", "B", "C", "D", "E"].map((code) => report.extensionData.score.scores[code]);
    assert.equal(values.reduce((sum, n) => sum + n, 0), 30);
    assert.equal(values.every((n) => n >= 0 && n <= 12), true);
    same(report.extensionData.score.primaries, primaries(scores));
    same(report.extensionData.score.ranked, ranked(scores));
  }
});

test("同一份作答与 vendor loves5BodyParts、buildLoves5Result 逐字相同", () => {
  assert.equal(JSON.stringify(QUESTIONS.map((item) => `${item.left.code}${item.right.code}`)), JSON.stringify(PAIRS));
  LANGUAGES.forEach((item, index) => {
    const vendor = VENDOR_LANGUAGES[index];
    assert.equal(item.code, vendor.id);
    assert.equal(item.name, vendor.name);
    assert.equal(item.english, vendor.english);
    assert.equal(item.meaning, vendor.meaning);
    assert.equal(item.how, vendor.how);
  });
  for (const picks of [sidePicks("left"), sidePicks("right"), TIED_PICKS]) {
    for (const rushed of [false, true]) {
      const input = base({ picks, rushed });
      const report = buildLoves5Result(input);
      const expected = vendorBuild(input);
      assert.equal(JSON.stringify(report), JSON.stringify(expected));
      const parts = loves5BodyParts(picks, rushed);
      assert.equal(JSON.stringify(report.dimensions), JSON.stringify(parts.dimensions));
      assert.equal(JSON.stringify(report.result), JSON.stringify(parts.result));
      assert.equal(JSON.stringify(report.interpretation), JSON.stringify(parts.interpretation));
      assert.equal(JSON.stringify(report.recommendations), JSON.stringify(parts.recommendations));
      assert.equal(JSON.stringify(report.reportContent), JSON.stringify(parts.reportContent));
      assert.equal(JSON.stringify(report.extensionData.score), JSON.stringify(parts.score));
      assert.equal(JSON.stringify(report.extensionData.answers), JSON.stringify(picks));
      const withScores = buildLoves5Result(base({ picks, scores: tally(picks), rushed }));
      assert.equal(JSON.stringify(withScores), JSON.stringify(expected));
    }
  }
});

test("分享链接约 75 字，提交体不带密钥，结果页只有一个分享结果主按钮", () => {
  const ids = createSubmissionIds();
  const url = buildShareUrl(ASSESSMENT_CLOUD_CONFIG.reportPageBase, ids.reportId, ids.linkSecret);
  assert.match(url, /^https:\/\/xiangshu3721\.github\.io\/mindtest-web\/r\/#[A-Za-z0-9_-]{11}\.[A-Za-z0-9_-]{16}$/);
  assert.equal(url.length, 75);
  assert.equal(url.includes("rpt_"), false);
  assert.equal(parseShareLink(url).reportId, ids.reportId);
  assert.equal(parseShareLink(url).linkSecret, ids.linkSecret);
  assert.equal(ASSESSMENT_CLOUD_CONFIG.endpoint.endsWith("/assessment-report-dev"), true);
  const share = readFileSync(new URL("../src/lib/cloud-share.ts", import.meta.url), "utf8");
  const button = readFileSync(new URL("../src/components/ShareResult.tsx", import.meta.url), "utf8");
  const result = readFileSync(new URL("../src/components/Result.tsx", import.meta.url), "utf8");
  assert.equal(share.includes("/v1/results"), true);
  assert.equal(share.includes("loves5SubmitBody"), true);
  assert.equal(share.includes("authorization"), false);
  assert.equal(share.includes("apiKey"), false);
  assert.equal(share.includes("api-key"), false);
  assert.equal(share.includes("微信"), false);
  assert.equal(share.includes("二维码"), false);
  assert.equal(button.includes("分享结果"), true);
  assert.equal(button.includes("disabled={busy}"), true);
  assert.equal(button.includes("重试"), true);
  assert.equal(button.includes("微信"), false);
  assert.equal(button.includes("二维码"), false);
  assert.equal(result.includes("<ShareResult"), true);
  assert.equal(result.includes("复制结果链接"), false);
  assert.equal(result.includes("导出图片"), true);
  assert.equal(result.includes("历史记录"), true);
  assert.equal(LOVES5_SCREEN.includes("诊断"), true);
});
