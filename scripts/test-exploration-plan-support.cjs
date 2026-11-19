// 12주 계획·AI 상담 API 계약 (JinroOn/JOFE#148, 백엔드 JOBE 5fe7fab 기준)
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function compile(file, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name) }, { filename });
  return exports;
}

const failure = (status, code) => ({ response: { status, data: { code } } });

// 실제 백엔드 모드로 api/exploration.ts 를 불러오고 호출을 기록한다
function client(handlers) {
  const calls = [];
  const record = method => async (url, body, config) => {
    calls.push({ method, url, body, config });
    return handlers[method](url, body, config, calls);
  };
  const api = { get: record('get'), post: record('post'), delete: record('delete') };
  const mod = compile('src/api/exploration.ts', {
    './axios': { __esModule: true, default: api, publicApi: {} },
    '../config/features': { isExplorationMock: false }, './explorationMock': {},
  });
  return { mod, calls };
}

const supportView = (over = {}) => ({ resultId: 3, initialized: false, supportRevision: 0, allowedPurposes: ['PLAN', 'ACTIVITY', 'BOTH'], ...over });

test('no support yet: selects PLAN with the target and expectedSupportRevision before the plan', async () => {
  const { mod, calls } = client({
    get: async () => ({ data: supportView() }),
    post: async () => ({ data: supportView({ initialized: true, supportRevision: 1, purpose: 'PLAN', targetMajorCode: 'M1' }) }),
  });
  const support = await mod.ensurePlanSupport(3, 'M1');
  assert.equal(support.supportRevision, 1);
  assert.equal(calls[0].url, '/exploration/v1/results/3/support');
  assert.equal(calls[1].url, '/exploration/v1/results/3/support');
  assert.equal(JSON.stringify(calls[1].body), '{"purpose":"PLAN","targetMajorCode":"M1","expectedSupportRevision":0}');
  assert.ok(calls[1].config.headers['Idempotency-Key']);
});

test('existing ACTIVITY support becomes BOTH so activity answers are kept', async () => {
  const { mod, calls } = client({
    get: async () => ({ data: supportView({ initialized: true, supportRevision: 4, purpose: 'ACTIVITY', targetMajorCode: null }) }),
    post: async () => ({ data: supportView({ initialized: true, supportRevision: 5, purpose: 'BOTH', targetMajorCode: 'M1' }) }),
  });
  await mod.ensurePlanSupport(3, 'M1');
  assert.equal(calls[1].body.purpose, 'BOTH');
  assert.equal(calls[1].body.expectedSupportRevision, 4);
});

test('matching PLAN support is reused without a write', async () => {
  const { mod, calls } = client({
    get: async () => ({ data: supportView({ initialized: true, supportRevision: 2, purpose: 'PLAN', targetMajorCode: 'M1' }) }),
    post: async () => assert.fail('must not write'),
  });
  assert.equal((await mod.ensurePlanSupport(3, 'M1')).supportRevision, 2);
  assert.equal(calls.length, 1);
});

test('STALE_REVISION re-reads once and retries with the new revision, then gives up', async () => {
  let reads = 0;
  const { mod, calls } = client({
    get: async () => ({ data: supportView({ initialized: true, supportRevision: ++reads, purpose: 'PLAN', targetMajorCode: 'OTHER' }) }),
    post: async () => { throw failure(409, 'STALE_REVISION'); },
  });
  await assert.rejects(mod.ensurePlanSupport(3, 'M1'), e => e.response.data.code === 'STALE_REVISION');
  const writes = calls.filter(c => c.method === 'post');
  assert.deepEqual(writes.map(w => w.body.expectedSupportRevision), [1, 2]);
});

test('plan create sends exactly majorCode and supportRevision; retry and cancel hit the backend paths', async () => {
  const { mod, calls } = client({
    post: async () => ({ data: { planId: 9, status: 'GENERATING' } }),
    delete: async () => ({ data: { status: 'CANCELLED' } }),
  });
  await mod.createExplorationPlan(3, 'M1', 1);
  await mod.retryExplorationPlan(9);
  await mod.cancelExplorationPlan(9);
  assert.equal(calls[0].url, '/exploration/v1/results/3/plans');
  assert.deepEqual(Object.keys(calls[0].body).sort(), ['majorCode', 'supportRevision']);
  assert.equal(calls[1].url, '/exploration/v1/plans/9/retry');
  assert.equal(JSON.stringify(calls[1].body), '{}');
  assert.equal(calls[2].method, 'delete');
  assert.equal(calls[2].url, '/exploration/v1/plans/9/generation');
});

test('pending consultation question is cancelled by its retry key', async () => {
  const { mod, calls } = client({ delete: async () => ({ data: { status: 'CANCELLED' } }) });
  await mod.cancelExplorationConsultationMessage(1, 'chat_0f0e3a52-8d1b-4a39-9a64-1c9a3f1b2c3d');
  assert.equal(calls[0].url, '/exploration/v1/consultations/1/messages/chat_0f0e3a52-8d1b-4a39-9a64-1c9a3f1b2c3d');
});

test('generation and support errors keep their backend codes', () => {
  const { mod } = client({});
  for (const code of ['PLAN_SUPPORT_REQUIRED', 'SUPPORT_TARGET_MISMATCH', 'PLAN_GENERATION_UNAVAILABLE', 'CONSULTATION_BUSY', 'CONSULTATION_GENERATION_UNAVAILABLE']) {
    assert.equal(mod.toExplorationErrorCode(failure(409, code)), code);
  }
  assert.equal(mod.toExplorationErrorCode(failure(400, 'INVALID_REQUEST')), 'INVALID_INPUT');
});
