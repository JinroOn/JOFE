const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const axios = require('axios');
const ts = require('typescript');

function compile(relativePath, dependencies = {}, globals = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = readFileSync(filename, 'utf8').replace(
    'import.meta.env.VITE_API_BASE_URL', "'http://localhost/api'",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    console: { ...console, warn() {} },
    ...globals,
  }, { filename });
  return exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tick = () => new Promise(setImmediate);
const reply = (config, data = {}) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
function unauthorized(config) {
  const response = { ...reply(config), status: 401, statusText: 'Unauthorized' };
  return new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response);
}

function setup() {
  const { persist } = require('zustand/middleware');
  const auth = compile('src/store/useAuthStore.ts', {
    'zustand/middleware': {
      persist: (creator, options) => persist(creator, {
        ...options,
        storage: { getItem: () => null, setItem() {}, removeItem() {} },
      }),
    },
  }).default;
  auth.getState().login({ id: 1, email: 'a@example.com', nickname: 'A' }, 'access-a', 'refresh-a');
  const { default: api, publicApi } = compile('src/api/axios.ts', {
    '../store/useAuthStore': { __esModule: true, default: auth },
  });
  let refreshCount = 0;
  let logoutCount = 0;
  let refreshConfig;
  const refresh = deferred();
  publicApi.defaults.adapter = (config) => {
    if (config.url === '/auth/refresh') {
      refreshCount++;
      refreshConfig = config;
      return refresh.promise.then((data) => reply(config, data));
    }
    logoutCount++;
    return Promise.resolve(reply(config));
  };
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push({ url: config.url, token: config.headers.Authorization });
    if (!config._retry) throw unauthorized(config);
    return reply(config, { ok: true });
  };
  return {
    auth, api, publicApi, refresh, requests,
    counts: () => ({ refresh: refreshCount, logout: logoutCount }),
    failRefresh: () => refresh.reject(unauthorized(refreshConfig)),
  };
}

test('concurrent 401 requests share one refresh and retry with rotated tokens', async () => {
  const h = setup();
  const results = Promise.all([h.api.get('/users/me'), h.api.get('/results')]);
  await tick();
  assert.equal(h.counts().refresh, 1);
  h.refresh.resolve({ accessToken: 'access-new', refreshToken: 'refresh-new' });
  await results;
  assert.equal(h.auth.getState().refreshToken, 'refresh-new');
  assert.equal(h.requests.filter((r) => r.token === 'Bearer access-new').length, 2);
});

test('late refresh failure cannot log out a newly signed-in account', async () => {
  const h = setup();
  const request = h.api.get('/users/me');
  const result = assert.rejects(request);
  await tick();
  h.auth.getState().login({ id: 2, email: 'b@example.com', nickname: 'B' }, 'access-b', 'refresh-b');
  h.failRefresh();
  await result;
  assert.equal(h.auth.getState().isLoggedIn, true);
  assert.equal(h.auth.getState().refreshToken, 'refresh-b');
  assert.equal(h.counts().logout, 0);
});

test('late refresh success cannot overwrite a new login or replay the old request', async () => {
  const h = setup();
  const result = assert.rejects(h.api.get('/users/me'));
  await tick();
  h.auth.getState().login({ id: 2, email: 'b@example.com', nickname: 'B' }, 'access-b', 'refresh-b');
  h.refresh.resolve({ accessToken: 'old-rotated', refreshToken: 'old-refresh-rotated' });
  await result;
  assert.equal(h.auth.getState().accessToken, 'access-b');
  assert.equal(h.requests.length, 1);
});

test('an old request returning 401 after another login is never retried as the new user', async () => {
  const h = setup();
  const response = deferred();
  h.api.defaults.adapter = (config) => response.promise.then(() => { throw unauthorized(config); });
  const result = assert.rejects(h.api.get('/users/me'));
  await tick();
  h.auth.getState().login({ id: 2, email: 'b@example.com', nickname: 'B' }, 'access-b', 'refresh-b');
  response.resolve();
  await tick();
  // Release an incorrectly started refresh so a regression fails instead of hanging.
  if (h.counts().refresh > 0) h.failRefresh();
  await result;
  assert.equal(h.counts().refresh, 0);
  assert.equal(h.auth.getState().accessToken, 'access-b');
});

test('a delayed old-token 401 reuses the already rotated access token', async () => {
  const h = setup();
  const delayed = deferred();
  h.api.defaults.adapter = async (config) => {
    if (config._retry) return reply(config);
    if (config.url === '/slow') await delayed.promise;
    throw unauthorized(config);
  };
  const fast = h.api.get('/fast');
  const slow = h.api.get('/slow');
  await tick();
  h.refresh.resolve({ accessToken: 'access-new', refreshToken: 'refresh-new' });
  await fast;
  delayed.resolve();
  await slow;
  assert.equal(h.counts().refresh, 1);
});

test('invalid refresh expires local auth before server logout completes', async () => {
  const h = setup();
  const revoke = deferred();
  const adapter = h.publicApi.defaults.adapter;
  h.publicApi.defaults.adapter = (config) => config.url === '/auth/logout'
    ? revoke.promise.then(() => reply(config)) : adapter(config);
  const result = assert.rejects(h.api.get('/users/me'));
  await tick();
  h.failRefresh();
  await tick();
  const loggedOut = !h.auth.getState().isLoggedIn;
  revoke.resolve();
  await result;
  assert.equal(loggedOut, true);
  assert.equal(h.auth.getState().sessionExpired, true);
});

test('a transient refresh failure preserves the session', async () => {
  const h = setup();
  const result = assert.rejects(h.api.get('/users/me'));
  await tick();
  h.refresh.reject(new axios.AxiosError('Network Error', 'ERR_NETWORK'));
  await result;
  assert.equal(h.auth.getState().isLoggedIn, true);
  assert.equal(h.counts().logout, 0);
});

test('a retried 401 expires the session without another refresh', async () => {
  const h = setup();
  h.api.defaults.adapter = async (config) => { throw unauthorized(config); };
  const result = assert.rejects(h.api.get('/users/me'));
  await tick();
  h.refresh.resolve({ accessToken: 'access-new', refreshToken: 'refresh-new' });
  await result;
  assert.equal(h.counts().refresh, 1);
  assert.equal(h.auth.getState().isLoggedIn, false);
});

test('login failures never trigger refresh', async () => {
  const h = setup();
  await assert.rejects(h.api.post('/auth/login', {}));
  assert.equal(h.counts().refresh, 0);
  assert.equal(h.auth.getState().isLoggedIn, true);
});

test('exploration maps both domain and common backend error codes', () => {
  const { toExplorationErrorCode } = compile('src/api/exploration.ts', {
    './axios': { __esModule: true, default: {}, publicApi: {} },
    '../config/features': { isExplorationMock: false },
    './explorationMock': {},
  });
  const error = (code) => ({ response: { data: { code } } });
  assert.equal(toExplorationErrorCode(error('INVALID_REQUEST')), 'INVALID_INPUT');
  assert.equal(toExplorationErrorCode(error('RESOURCE_NOT_FOUND')), 'NOT_FOUND');
  assert.equal(toExplorationErrorCode(error('STALE_REVISION')), 'STALE_REVISION');
  assert.equal(toExplorationErrorCode(error('INVALID_INPUT')), 'INVALID_INPUT');
  assert.equal(toExplorationErrorCode(error('NOT_FOUND')), 'NOT_FOUND');
});

const comparisonFixture = require('./fixtures/exploration-comparison.cjs');
function comparisonApi(get, mock) {
  return compile('src/api/exploration.ts', {
    './axios': { __esModule: true, default: { get }, publicApi: {} },
    '../config/features': { isExplorationMock: Boolean(mock) },
    './explorationMock': mock ?? {},
  });
}

test('comparison overview omits query parameters and includes candidates beyond the first seven', async () => {
  let request;
  const api = comparisonApi(async (url, config) => {
    request = { url, config };
    return { data: comparisonFixture.overview };
  });
  const data = await api.getExplorationComparison(34);
  assert.equal(request.url, '/exploration/v1/results/34/comparison');
  assert.equal(request.config.params, undefined);
  assert.equal(data.candidateChoices.length, 9);
  assert.equal(data.candidateChoices[8].name, '문화인류학과');
  assert.equal(data.candidateChoices[0].groupName, '');
});

test('pair comparison sends exactly left/right keys and preserves the requested side order', async () => {
  let params;
  const api = comparisonApi(async (_url, config) => {
    params = config.params;
    return { data: comparisonFixture.pair(params.leftMajorCode, params.rightMajorCode) };
  });
  const data = await api.getExplorationComparison(34, ['MAJOR_ROW_3', 'MAJOR_ROW_2']);
  assert.equal(JSON.stringify(params), JSON.stringify({ leftMajorCode: 'MAJOR_ROW_3', rightMajorCode: 'MAJOR_ROW_2' }));
  assert.equal(data.majors[0].name, '사학과');
  assert.equal(data.majors[1].name, '고고학과');
  assert.equal(data.comparisonSets[0].left[0].descriptions[0], '유적과 유물을 직접 조사하는 활동');
  assert.equal(data.comparisonSets[0].focusResponses[0].answerText, '아직 잘 모르겠어요');
});

test('same-direction and missing-shared-set responses preserve backend states and structured skips', () => {
  const api = comparisonApi();
  const same = api.toExplorationComparison(comparisonFixture.pair('MAJOR_ROW_3', 'MAJOR_ROW_9', 'SAME_DIRECTIONS'), 34);
  assert.equal(same.comparisonState, 'SAME_DIRECTIONS');
  assert.equal(same.skippedComparisonSets[0].declaredSkipPair, true);
  assert.equal(same.skippedComparisonSets[0].reasonCode, 'SAME_DIRECTION_MEMBERSHIP');
  assert.equal(same.comparisonSets.length, 0);
  const separate = api.toExplorationComparison(comparisonFixture.pair('MAJOR_ROW_2', 'MAJOR_ROW_3', 'NO_SHARED_COMPARISON_SET'), 34);
  assert.equal(separate.comparisonState, 'NO_SHARED_COMPARISON_SET');
});

test('no-candidate overview produces an unavailable comparison without missing-field failures', () => {
  const data = comparisonApi().toExplorationComparison(comparisonFixture.unavailable, 34);
  assert.equal(data.available, false);
  assert.equal(data.majors.length, 0);
  assert.equal(data.candidateChoices.length, 0);
  assert.equal(data.sourceNote, '');
});

test('comparison renders descriptions and saved responses without exposing mapping codes or invented careers', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Details = compile('src/pages/Analysis/ExplorationCompare/components/ComparisonDetails.tsx').default;
  const dto = comparisonFixture.pair('MAJOR_ROW_2', 'MAJOR_ROW_3');
  const data = comparisonApi().toExplorationComparison(dto, 34);
  const html = renderToStaticMarkup(React.createElement(Details, { data, result: { groups: [] } }));
  assert.match(html, /유적과 유물을 직접 조사하는 활동/);
  assert.match(html, /문헌과 기록을 읽고 비교하는 활동/);
  assert.match(html, /아직 잘 모르겠어요/);
  assert.doesNotMatch(html, /INT_HUM|ACT_RES|LEARN_HUM|CMP-HISTORY|ARCHAEOLOGY_FIELD|NOT_PROVIDED|>HUM</);
  assert.doesNotMatch(html, /이어지는 진로 방향|아직 정리된 정보가 없어요/);
});

test('same-direction and no-shared-set states have distinct user explanations', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Details = compile('src/pages/Analysis/ExplorationCompare/components/ComparisonDetails.tsx').default;
  const api = comparisonApi();
  const render = (state) => renderToStaticMarkup(React.createElement(Details, {
    data: api.toExplorationComparison(comparisonFixture.pair('MAJOR_ROW_2', 'MAJOR_ROW_3', state), 34), result: { groups: [] },
  }));
  assert.match(render('SAME_DIRECTIONS'), /두 전공의 탐색 방향이 같아요/);
  assert.match(render('NO_SHARED_COMPARISON_SET'), /비교 항목이 아직 없어요/);
});

function comparisonMock(positive = true) {
  const db = { seq: 100, issuedSeq: 500, sessions: { 21: {
    session: { sessionId: 21, resultId: 34, status: 'completed' },
    issued: [{ stage: 1, effective: true, answerCode: positive ? 'AGREE' : 'UNKNOWN' }],
    completedAt: Date.parse('2026-11-16T07:00:00Z'),
  } } };
  const stored = JSON.stringify(db);
  return compile('src/api/explorationMock.ts', {
    './explorationMockMajors': compile('src/api/explorationMockMajors.ts'),
  }, { localStorage: { getItem: () => stored }, setTimeout: (fn) => { fn(); return 0; } });
}

test('mock comparison uses the same overview/pair DTO mapper and rejects duplicate/outside candidates', async () => {
  const mock = comparisonMock();
  const api = comparisonApi(undefined, mock);
  const overview = await api.getExplorationComparison(34);
  assert.equal(overview.available, true);
  assert.equal(overview.candidateChoices.length, 7);
  const data = await api.getExplorationComparison(34, ['MOCK-M-BIO', 'MOCK-M-DS']);
  assert.equal(data.majors[0].name, '생명과학과');
  assert.equal(data.majors[1].name, '데이터사이언스학과');
  assert.equal(data.comparisonState, 'DISTINCT_DIRECTIONS');
  assert.ok(data.comparisonSets[0].left[0].descriptions.length > 0);
  await assert.rejects(mock.getComparison(34, ['MOCK-M-BIO', 'MOCK-M-BIO']), (error) => error.response.status === 400);
  await assert.rejects(mock.getComparison(34, ['MOCK-M-BIO', 'OUTSIDE']), (error) => error.response.data.code === 'MAJOR_NOT_IN_RESULT');
});

test('mock comparison has no candidates for a result without positive evidence', async () => {
  const data = await comparisonApi(undefined, comparisonMock(false)).getExplorationComparison(34);
  assert.equal(data.available, false);
  assert.equal(data.candidateChoices.length, 0);
});
