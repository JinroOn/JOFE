const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function compile(file, dependencies = {}, globals = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), ...globals }, { filename });
  return exports;
}

const failure = code => ({ response: { status: 409, data: { code } } });
const session = (status = 'in_progress') => ({ sessionId: 42, status, revision: 0, stage: 1, startedAt: '2026-11-17T10:00:00Z', resultId: null });
const detail = status => ({ session: session(status), issued: [], progress: { stage: 1, answered: 0, issued: 0, stageMax: 39, remainingMax: 39 }, nextAction: 'NEXT' });
const api = post => compile('src/api/exploration.ts', {
  './axios': { __esModule: true, default: { post }, publicApi: {} },
  '../config/features': { isExplorationMock: false }, './explorationMock': {},
});

test('abandon uses POST with revision zero and caller key; response-loss retry preserves both', async () => {
  const calls = [];
  const client = api(async (url, body, config) => {
    calls.push({ url, body, config });
    if (calls.length === 1) throw new Error('response lost');
    return { data: { ...session(), status: 'abandoned', revision: 1 } };
  });
  await assert.rejects(client.abandonExplorationSession(42, 0, 'same-request'), /response lost/);
  assert.equal((await client.abandonExplorationSession(42, 0, 'same-request')).status, 'abandoned');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, '/exploration/v1/sessions/42/abandon');
  assert.equal(JSON.stringify(calls[0]), JSON.stringify(calls[1]));
  assert.equal(JSON.stringify(calls[0].body), '{"expectedRevision":0}');
  assert.equal(calls[0].config.headers['Idempotency-Key'], 'same-request');
});

test('abandon conflict is surfaced without automatic mutation retry', async () => {
  let calls = 0;
  const client = api(async () => { calls++; throw failure('STALE_REVISION'); });
  await assert.rejects(client.abandonExplorationSession(42, 2, 'stale'), e => e.response.data.code === 'STALE_REVISION');
  assert.equal(calls, 1);
});

function mockSession(status = 'in_progress') {
  let stored = JSON.stringify({ seq: 100, issuedSeq: 500, sessions: { 42: { session: session(status), issued: [], queue: [], adjustPending: false, mutations: {} } } });
  const mock = compile('src/api/explorationMock.ts', {
    './explorationMockMajors': compile('src/api/explorationMockMajors.ts'),
  }, { localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value; } }, setTimeout: fn => { fn(); return 0; } });
  return { mock, stored: () => JSON.parse(stored) };
}

test('mock abandon replays success after terminal state, rejects changed payload and blocks further writes', async () => {
  const { mock, stored } = mockSession();
  const response = await mock.abandonSession(42, 0, 'one');
  assert.equal(response.status, 'abandoned');
  assert.equal(response.revision, 1);
  assert.equal(JSON.stringify(await mock.abandonSession(42, 0, 'one')), JSON.stringify(response));
  assert.equal(stored().sessions[42].session.revision, 1);
  await assert.rejects(mock.abandonSession(42, 1, 'one'), e => e.response.data.code === 'IDEMPOTENCY_CONFLICT');
  for (const operation of [() => mock.next(42, 1), () => mock.advance(42, 1), () => mock.complete(42, 1), () => mock.abandonSession(42, 1, 'two')]) {
    await assert.rejects(operation(), e => e.response.data.code === 'SESSION_ABANDONED');
  }
});

test('mock preserves completed results and requires a current revision to abandon', async () => {
  const completed = mockSession('completed');
  await assert.rejects(completed.mock.abandonSession(42, 0, 'no'), e => e.response.data.code === 'SESSION_ALREADY_COMPLETED');
  assert.equal(completed.stored().sessions[42].session.status, 'completed');
  const running = mockSession();
  await assert.rejects(running.mock.abandonSession(42, 1, 'stale'), e => e.response.data.code === 'STALE_REVISION');
  assert.equal(running.stored().sessions[42].session.status, 'in_progress');
});

test('mock allows a new session after abandon, and history marks the old one as non-resumable', async () => {
  const { mock } = mockSession();
  await assert.rejects(mock.startSession(), e => e.response.data.code === 'EXPLORATION_IN_PROGRESS' && e.response.data.existingSessionId === 42);
  await mock.abandonSession(42, 0, 'abandon');
  const next = await mock.startSession();
  assert.notEqual(next.sessionId, 42);
  const history = await mock.historySessions({ status: 'abandoned' });
  assert.equal(history.items.length, 1);
  assert.equal(history.items[0].status, 'abandoned');
  assert.equal(history.items[0].nextAction, 'NONE');
  assert.equal(history.items[0].links.resume, null);
});

test('loading an abandoned session never issues questions or offers completion', async () => {
  let mutations = 0;
  const store = compile('src/store/useExplorationStore.ts', { '../api/exploration': {
    getExplorationSession: async () => detail('abandoned'),
    requestNextQuestions: async () => { mutations++; },
  } }).default;
  await store.getState().load(42);
  assert.equal(store.getState().phase, 'LOAD_FAILED');
  assert.equal(store.getState().errorCode, 'SESSION_ABANDONED');
  assert.equal(mutations, 0);
});

test('abandon from another window stops answer retries and clears the pending answer', async () => {
  let writes = 0;
  const data = detail('in_progress');
  data.nextAction = 'ANSWER';
  data.issued = [{ question: { issuedId: 9 }, stage: 1, effective: true, answerCode: null }];
  const store = compile('src/store/useExplorationStore.ts', { '../api/exploration': {
    getExplorationSession: async () => data,
    createMutationId: () => 'answer-key',
    saveExplorationAnswer: async () => { writes++; throw failure('SESSION_ABANDONED'); },
    toExplorationErrorCode: e => e.response.data.code,
  } }).default;
  await store.getState().load(42);
  await store.getState().select('A');
  assert.equal(store.getState().phase, 'LOAD_FAILED');
  assert.equal(store.getState().pending, null);
  assert.equal(store.getState().failedOp, null);
  await store.getState().retry();
  await store.getState().select('B');
  assert.equal(writes, 1);
});
