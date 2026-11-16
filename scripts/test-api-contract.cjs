const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const axios = require('axios');
const ts = require('typescript');

function compile(relativePath, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = readFileSync(filename, 'utf8').replace(
    'import.meta.env.VITE_API_BASE_URL', "'http://localhost/api'",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    console: { ...console, warn() {} },
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
