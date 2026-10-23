import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
  };
}

function loadShare(hooks) {
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
      setTimeout,
      clearTimeout,
      location: { hostname: "xiangshu3721.github.io", origin: "https://xiangshu3721.github.io" },
      navigator: { clipboard: { writeText: async () => {} } },
      fetch: (...args) => hooks.fetch(...args),
      localStorage: hooks.storage,
    };
    sandbox.globalThis = sandbox;
    sandbox.require = (id) => {
      if (!id.startsWith(".")) throw new Error(id);
      return loadTS(resolve(dirname(filename), id.endsWith(".ts") ? id : `${id}.ts`));
    };
    cache.set(filename, module);
    runInNewContext(compiled, sandbox, { filename });
    return module.exports;
  }
  return loadTS("../src/lib/cloud-share.ts");
}

const picks = "ABCDEBAECBCBCBEBCAEDEBCBBEDACB".split("");
const scores = { A: 4, B: 10, C: 7, D: 3, E: 6 };

function flush() {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
}

test("结果页挂上后只提交一次，正文只有标准化结果", async () => {
  const calls = [];
  const storage = memoryStorage();
  const share = loadShare({
    storage,
    fetch: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { status: 200, json: async () => ({ reportId: calls[0].body.result.reportId }) };
    },
  });
  const views = [];
  const input = { nickname: "林深", picks, scores };
  share.watchLoves5Share(input, (view) => views.push(view), storage);
  await flush();
  share.watchLoves5Share(input, () => {}, storage);
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.endsWith("/assessment-report-dev/v1/results"), true);
  assert.equal(calls[0].body.result.assessmentId, "loves5");
  assert.equal(calls[0].body.result.assessmentVersion, "loves5-h5-v1");
  assert.equal(calls[0].body.result.nickname, "林深");
  assert.deepEqual(calls[0].body.result.extensionData.answers, picks);
  assert.deepEqual(calls[0].body.result.extensionData.score.scores, scores);
  assert.deepEqual(calls[0].body.result.extensionData.score.primaries, ["B"]);
  assert.equal(calls[0].body.result.result.code, "B");
  assert.equal(calls[0].body.result.extensionData.picks, undefined);
  assert.equal(calls[0].body.result.extensionData.scores, undefined);
  assert.equal(calls[0].body.result.linkSecret, undefined);
  assert.equal(typeof calls[0].body.linkSecret, "string");
  assert.equal(typeof calls[0].body.ownerToken, "string");
  assert.notEqual(calls[0].body.linkSecret, calls[0].body.ownerToken);
  const ready = views.at(-1);
  assert.match(ready.url, /^https:\/\/xiangshu3721\.github\.io\/mindtest-web\/r\/#/);
  assert.equal(ready.url.length, 75);
  assert.equal(ready.failed, false);
});

test("服务端拒绝时停在失败，不连着重试", async () => {
  const calls = [];
  const storage = memoryStorage();
  const share = loadShare({
    storage,
    fetch: async (_url, init) => {
      calls.push(JSON.parse(init.body));
      return { status: 422, json: async () => ({ error: "invalid", issues: ["测评不在可保存范围内"] }) };
    },
  });
  let view = null;
  share.watchLoves5Share({ nickname: "阿宁", picks, scores }, (next) => { view = next; }, storage);
  await flush();
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(view.failed, true);
  assert.equal(view.url, "");
  assert.equal(view.note, "这次没生成链接");
  assert.equal(JSON.stringify(calls[0].result).includes("微信"), false);
});

test("已记下的旧正文在提交前改成 vendor 形状，提交号不变", async () => {
  const calls = [];
  const storage = memoryStorage();
  const share = loadShare({
    storage,
    fetch: async (_url, init) => {
      calls.push(JSON.parse(init.body));
      return { status: 200, json: async () => ({ reportId: calls[0].result.reportId }) };
    },
  });
  const key = share.loves5ShareKey("林深", picks, scores);
  storage.setItem("rk.cloud.pending.v1", JSON.stringify({
    v: 1,
    items: [{
      reportId: "rpt_abcdefghijk",
      clientSubmissionId: "sub_abcdefghijklmnop",
      linkSecret: "a".repeat(16),
      ownerToken: "b".repeat(16),
      orderKey: key,
      payload: {
        reportId: "rpt_abcdefghijk",
        completedAt: "2026-10-23T15:04:05+08:00",
        extensionData: { picks, scores, primaries: ["B"], ranked: ["B"] },
        result: { code: "tied" },
      },
      attempts: 0,
      nextAt: 0,
      lastError: "",
    }],
  }));
  share.watchLoves5Share({ nickname: "林深", picks, scores }, () => {}, storage);
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].result.reportId, "rpt_abcdefghijk");
  assert.equal(calls[0].result.completedAt, "2026-10-23T15:04:05+08:00");
  assert.deepEqual(calls[0].result.extensionData.answers, picks);
  assert.equal(calls[0].result.extensionData.picks, undefined);
  assert.equal(calls[0].result.result.code, "B");
});

test("没有称呼时不提交", async () => {
  let called = 0;
  const share = loadShare({
    storage: memoryStorage(),
    fetch: async () => { called += 1; return { status: 200, json: async () => ({}) }; },
  });
  let view = null;
  share.watchLoves5Share({ nickname: " ", picks, scores }, (next) => { view = next; }, memoryStorage());
  await flush();
  assert.equal(called, 0);
  assert.equal(view.note, "先写一个称呼，才能分享");
});
