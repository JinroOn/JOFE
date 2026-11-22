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
    'import.meta.env.VITE_API_BASE_URL',
    "'http://localhost/api'",
  );

  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const exports = {};

  vm.runInNewContext(code, {
    exports,
    require: (name) =>
      Object.hasOwn(dependencies, name)
        ? dependencies[name]
        : require(name),
    console: { ...console, warn() {} },
    ...globals,
  }, { filename });

  return exports;
}

function deferred() {
  let resolve;
  let reject;

  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });

  return { promise, resolve, reject };
}

const tick = () => new Promise(setImmediate);

const reply = (config, data = {}) => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
});

function unauthorized(config) {
  const response = {
    ...reply(config),
    status: 401,
    statusText: 'Unauthorized',
  };

  return new axios.AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    null,
    response,
  );
}

function setup() {
  const { persist } = require('zustand/middleware');

  const auth = compile('src/store/useAuthStore.ts', {
    'zustand/middleware': {
      persist: (creator, options) =>
        persist(creator, {
          ...options,
          storage: {
            getItem: () => null,
            setItem() {},
            removeItem() {},
          },
        }),
    },
  }).default;

  auth.getState().login(
    {
      id: 1,
      email: 'a@example.com',
      nickname: 'A',
    },
    'access-a',
    'refresh-a',
  );

  const { default: api, publicApi } = compile(
    'src/api/axios.ts',
    {
      '../store/useAuthStore': {
        __esModule: true,
        default: auth,
      },
    },
  );

  let refreshCount = 0;
  let logoutCount = 0;
  let refreshConfig;

  const refresh = deferred();

  publicApi.defaults.adapter = (config) => {
    if (config.url === '/auth/refresh') {
      refreshCount++;
      refreshConfig = config;

      return refresh.promise.then((data) =>
        reply(config, data),
      );
    }

    logoutCount++;
    return Promise.resolve(reply(config));
  };

  const requests = [];

  api.defaults.adapter = async (config) => {
    requests.push({
      url: config.url,
      token: config.headers.Authorization,
    });

    if (!config._retry) {
      throw unauthorized(config);
    }

    return reply(config, { ok: true });
  };

  return {
    auth,
    api,
    publicApi,
    refresh,
    requests,
    counts: () => ({
      refresh: refreshCount,
      logout: logoutCount,
    }),
    failRefresh: () =>
      refresh.reject(unauthorized(refreshConfig)),
  };
}

test(
  'concurrent 401 requests share one refresh and retry with rotated tokens',
  async () => {
    const h = setup();

    const results = Promise.all([
      h.api.get('/users/me'),
      h.api.get('/results'),
    ]);

    await tick();

    assert.equal(h.counts().refresh, 1);

    h.refresh.resolve({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
    });

    await results;

    assert.equal(
      h.auth.getState().refreshToken,
      'refresh-new',
    );

    assert.equal(
      h.requests.filter(
        (r) => r.token === 'Bearer access-new',
      ).length,
      2,
    );
  },
);

test(
  'late refresh failure cannot log out a newly signed-in account',
  async () => {
    const h = setup();

    const request = h.api.get('/users/me');
    const result = assert.rejects(request);

    await tick();

    h.auth.getState().login(
      {
        id: 2,
        email: 'b@example.com',
        nickname: 'B',
      },
      'access-b',
      'refresh-b',
    );

    h.failRefresh();
    await result;

    assert.equal(h.auth.getState().isLoggedIn, true);
    assert.equal(
      h.auth.getState().refreshToken,
      'refresh-b',
    );
    assert.equal(h.counts().logout, 0);
  },
);

test(
  'late refresh success cannot overwrite a new login or replay the old request',
  async () => {
    const h = setup();

    const result = assert.rejects(
      h.api.get('/users/me'),
    );

    await tick();

    h.auth.getState().login(
      {
        id: 2,
        email: 'b@example.com',
        nickname: 'B',
      },
      'access-b',
      'refresh-b',
    );

    h.refresh.resolve({
      accessToken: 'old-rotated',
      refreshToken: 'old-refresh-rotated',
    });

    await result;

    assert.equal(
      h.auth.getState().accessToken,
      'access-b',
    );
    assert.equal(h.requests.length, 1);
  },
);

test(
  'an old request returning 401 after another login is never retried as the new user',
  async () => {
    const h = setup();
    const response = deferred();

    h.api.defaults.adapter = (config) =>
      response.promise.then(() => {
        throw unauthorized(config);
      });

    const result = assert.rejects(
      h.api.get('/users/me'),
    );

    await tick();

    h.auth.getState().login(
      {
        id: 2,
        email: 'b@example.com',
        nickname: 'B',
      },
      'access-b',
      'refresh-b',
    );

    response.resolve();
    await tick();

    if (h.counts().refresh > 0) {
      h.failRefresh();
    }

    await result;

    assert.equal(h.counts().refresh, 0);
    assert.equal(
      h.auth.getState().accessToken,
      'access-b',
    );
  },
);

test(
  'a delayed old-token 401 reuses the already rotated access token',
  async () => {
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

    h.refresh.resolve({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
    });

    await fast;
    delayed.resolve();
    await slow;

    assert.equal(h.counts().refresh, 1);
  },
);

test(
  'invalid refresh expires local auth before server logout completes',
  async () => {
    const h = setup();
    const revoke = deferred();
    const adapter = h.publicApi.defaults.adapter;

    h.publicApi.defaults.adapter = (config) =>
      config.url === '/auth/logout'
        ? revoke.promise.then(() => reply(config))
        : adapter(config);

    const result = assert.rejects(
      h.api.get('/users/me'),
    );

    await tick();
    h.failRefresh();
    await tick();

    const loggedOut = !h.auth.getState().isLoggedIn;

    revoke.resolve();
    await result;

    assert.equal(loggedOut, true);
    assert.equal(
      h.auth.getState().sessionExpired,
      true,
    );
  },
);

test(
  'a transient refresh failure preserves the session',
  async () => {
    const h = setup();

    const result = assert.rejects(
      h.api.get('/users/me'),
    );

    await tick();

    h.refresh.reject(
      new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
      ),
    );

    await result;

    assert.equal(h.auth.getState().isLoggedIn, true);
    assert.equal(h.counts().logout, 0);
  },
);

test(
  'a retried 401 expires the session without another refresh',
  async () => {
    const h = setup();

    h.api.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    const result = assert.rejects(
      h.api.get('/users/me'),
    );

    await tick();

    h.refresh.resolve({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
    });

    await result;

    assert.equal(h.counts().refresh, 1);
    assert.equal(h.auth.getState().isLoggedIn, false);
  },
);

test('login failures never trigger refresh', async () => {
  const h = setup();

  await assert.rejects(
    h.api.post('/auth/login', {}),
  );

  assert.equal(h.counts().refresh, 0);
  assert.equal(h.auth.getState().isLoggedIn, true);
});

test(
  'exploration maps both domain and common backend error codes',
  () => {
    const { toExplorationErrorCode } = compile(
      'src/api/exploration.ts',
      {
        './axios': {
          __esModule: true,
          default: {},
          publicApi: {},
        },
        '../config/features': {
          isExplorationMock: false,
        },
        './explorationMock': {},
      },
    );

    const error = (code) => ({
      response: { data: { code } },
    });

    assert.equal(
      toExplorationErrorCode(error('INVALID_REQUEST')),
      'INVALID_INPUT',
    );

    assert.equal(
      toExplorationErrorCode(error('RESOURCE_NOT_FOUND')),
      'NOT_FOUND',
    );

    assert.equal(
      toExplorationErrorCode(error('STALE_REVISION')),
      'STALE_REVISION',
    );

    assert.equal(
      toExplorationErrorCode(error('INVALID_INPUT')),
      'INVALID_INPUT',
    );

    assert.equal(
      toExplorationErrorCode(error('NOT_FOUND')),
      'NOT_FOUND',
    );
  },
);

const comparisonFixture = require(
  './fixtures/exploration-comparison.cjs',
);

function comparisonApi(get, mock) {
  return compile('src/api/exploration.ts', {
    './axios': {
      __esModule: true,
      default: { get },
      publicApi: {},
    },
    '../config/features': {
      isExplorationMock: Boolean(mock),
    },
    './explorationMock': mock ?? {},
  });
}

test(
  'comparison overview omits query parameters and includes candidates beyond the first seven',
  async () => {
    let request;

    const api = comparisonApi(async (url, config) => {
      request = { url, config };
      return { data: comparisonFixture.overview };
    });

    const data = await api.getExplorationComparison(34);

    assert.equal(
      request.url,
      '/exploration/v1/results/34/comparison',
    );
    assert.equal(request.config.params, undefined);
    assert.equal(data.candidateChoices.length, 9);
    assert.equal(
      data.candidateChoices[8].name,
      '문화인류학과',
    );
    assert.equal(
      data.candidateChoices[0].groupName,
      '',
    );
  },
);

test(
  'pair comparison sends exactly left/right keys and preserves the requested side order',
  async () => {
    let params;

    const api = comparisonApi(async (_url, config) => {
      params = config.params;

      return {
        data: comparisonFixture.pair(
          params.leftMajorCode,
          params.rightMajorCode,
        ),
      };
    });

    const data = await api.getExplorationComparison(
      34,
      ['MAJOR_ROW_3', 'MAJOR_ROW_2'],
    );

    assert.equal(
      JSON.stringify(params),
      JSON.stringify({
        leftMajorCode: 'MAJOR_ROW_3',
        rightMajorCode: 'MAJOR_ROW_2',
      }),
    );

    assert.equal(data.majors[0].name, '사학과');
    assert.equal(data.majors[1].name, '고고학과');

    assert.equal(
      data.comparisonSets[0].left[0].descriptions[0],
      '유적과 유물을 직접 조사하는 활동',
    );

    assert.equal(
      data.comparisonSets[0].focusResponses[0].answerText,
      '아직 잘 모르겠어요',
    );
  },
);

test(
  'same-direction and missing-shared-set responses preserve backend states and structured skips',
  () => {
    const api = comparisonApi();

    const same = api.toExplorationComparison(
      comparisonFixture.pair(
        'MAJOR_ROW_3',
        'MAJOR_ROW_9',
        'SAME_DIRECTIONS',
      ),
      34,
    );

    assert.equal(
      same.comparisonState,
      'SAME_DIRECTIONS',
    );

    assert.equal(
      same.skippedComparisonSets[0].declaredSkipPair,
      true,
    );

    assert.equal(
      same.skippedComparisonSets[0].reasonCode,
      'SAME_DIRECTION_MEMBERSHIP',
    );

    assert.equal(same.comparisonSets.length, 0);

    const separate = api.toExplorationComparison(
      comparisonFixture.pair(
        'MAJOR_ROW_2',
        'MAJOR_ROW_3',
        'NO_SHARED_COMPARISON_SET',
      ),
      34,
    );

    assert.equal(
      separate.comparisonState,
      'NO_SHARED_COMPARISON_SET',
    );
  },
);

test(
  'no-candidate overview produces an unavailable comparison without missing-field failures',
  () => {
    const data = comparisonApi().toExplorationComparison(
      comparisonFixture.unavailable,
      34,
    );

    assert.equal(data.available, false);
    assert.equal(data.majors.length, 0);
    assert.equal(data.candidateChoices.length, 0);
    assert.equal(data.sourceNote, '');
  },
);

test(
  'comparison renders descriptions and saved responses without exposing mapping codes or invented careers',
  () => {
    const React = require('react');
    const {
      renderToStaticMarkup,
    } = require('react-dom/server');

    const Details = compile(
      'src/pages/Analysis/ExplorationCompare/components/ComparisonDetails.tsx',
    ).default;

    const dto = comparisonFixture.pair(
      'MAJOR_ROW_2',
      'MAJOR_ROW_3',
    );

    const data = comparisonApi().toExplorationComparison(
      dto,
      34,
    );

    const html = renderToStaticMarkup(
      React.createElement(Details, {
        data,
        result: { groups: [] },
      }),
    );

    assert.match(
      html,
      /유적과 유물을 직접 조사하는 활동/,
    );

    assert.match(
      html,
      /문헌과 기록을 읽고 비교하는 활동/,
    );

    assert.match(html, /아직 잘 모르겠어요/);

    assert.doesNotMatch(
      html,
      /INT_HUM|ACT_RES|LEARN_HUM|CMP-HISTORY|ARCHAEOLOGY_FIELD|NOT_PROVIDED|>HUM</,
    );

    assert.doesNotMatch(
      html,
      /이어지는 진로 방향|아직 정리된 정보가 없어요/,
    );
  },
);

test(
  'same-direction and no-shared-set states have distinct user explanations',
  () => {
    const React = require('react');
    const {
      renderToStaticMarkup,
    } = require('react-dom/server');

    const Details = compile(
      'src/pages/Analysis/ExplorationCompare/components/ComparisonDetails.tsx',
    ).default;

    const api = comparisonApi();

    const render = (state) =>
      renderToStaticMarkup(
        React.createElement(Details, {
          data: api.toExplorationComparison(
            comparisonFixture.pair(
              'MAJOR_ROW_2',
              'MAJOR_ROW_3',
              state,
            ),
            34,
          ),
          result: { groups: [] },
        }),
      );

    assert.match(
      render('SAME_DIRECTIONS'),
      /두 전공의 탐색 방향이 같아요/,
    );

    assert.match(
      render('NO_SHARED_COMPARISON_SET'),
      /비교 항목이 아직 없어요/,
    );
  },
);

function comparisonMock(positive = true) {
  const db = {
    seq: 100,
    issuedSeq: 500,
    sessions: {
      21: {
        session: {
          sessionId: 21,
          resultId: 34,
          status: 'completed',
        },
        issued: [
          {
            stage: 1,
            effective: true,
            answerCode: positive
              ? 'AGREE'
              : 'UNKNOWN',
          },
        ],
        completedAt: Date.parse(
          '2026-11-16T07:00:00Z',
        ),
      },
    },
  };

  const stored = JSON.stringify(db);

  return compile(
    'src/api/explorationMock.ts',
    {
      './explorationMockMajors': compile(
        'src/api/explorationMockMajors.ts',
      ),
    },
    {
      localStorage: {
        getItem: () => stored,
      },
      setTimeout: (fn) => {
        fn();
        return 0;
      },
    },
  );
}

test(
  'mock comparison uses the same overview/pair DTO mapper and rejects duplicate/outside candidates',
  async () => {
    const mock = comparisonMock();
    const api = comparisonApi(undefined, mock);

    const overview =
      await api.getExplorationComparison(34);

    assert.equal(overview.available, true);
    assert.equal(overview.candidateChoices.length, 7);

    const data = await api.getExplorationComparison(
      34,
      ['MOCK-M-BIO', 'MOCK-M-DS'],
    );

    assert.equal(
      data.majors[0].name,
      '생명과학과',
    );

    assert.equal(
      data.majors[1].name,
      '데이터사이언스학과',
    );

    assert.equal(
      data.comparisonState,
      'DISTINCT_DIRECTIONS',
    );

    assert.ok(
      data.comparisonSets[0].left[0].descriptions.length > 0,
    );

    await assert.rejects(
      mock.getComparison(
        34,
        ['MOCK-M-BIO', 'MOCK-M-BIO'],
      ),
      (error) => error.response.status === 400,
    );

    await assert.rejects(
      mock.getComparison(
        34,
        ['MOCK-M-BIO', 'OUTSIDE'],
      ),
      (error) =>
        error.response.data.code ===
        'MAJOR_NOT_IN_RESULT',
    );
  },
);

test(
  'mock comparison has no candidates for a result without positive evidence',
  async () => {
    const data = await comparisonApi(
      undefined,
      comparisonMock(false),
    ).getExplorationComparison(34);

    assert.equal(data.available, false);
    assert.equal(data.candidateChoices.length, 0);
  },
);

test(
  'result display maps server labels, evidence, explanations and recheck labels without reranking',
  () => {
    const api = comparisonApi();
    const dto = comparisonFixture.displayResult;
    const before = JSON.stringify(dto);
    const result = api.toExplorationResult(dto);

    assert.equal(result.groups[0].name, '인문');
    assert.equal(
      result.groups[0].summary,
      dto.groups[0].summary,
    );

    assert.equal(
      result.groups[0].evidenceLevel,
      'LOW_EVIDENCE',
    );

    assert.equal(
      JSON.stringify(
        result.groups[0].majors.map(
          (major) => major.majorCode,
        ),
      ),
      JSON.stringify(dto.groups[0].majorCodes),
    );

    assert.equal(
      result.groups[0].majors[0].reasons.length,
      3,
    );

    assert.equal(
      result.groups[0].majors[0].evidenceLevel,
      'LOW_EVIDENCE',
    );

    assert.equal(
      result.groups[0].majors[0].collapsed,
      false,
    );

    assert.equal(
      result.recheckAxes[0].name,
      '인문·언어·역사',
    );

    assert.equal(result.displayTextMissing, false);
    assert.equal(
      result.displaySource,
      'COMPLETION_SNAPSHOT',
    );
    assert.equal(JSON.stringify(dto), before);
  },
);

test(
  'approved caution guidance and saved preparation responses remain separate',
  () => {
    const result =
      comparisonApi().toExplorationResult(
        comparisonFixture.displayResult,
      );

    assert.equal(
      result.cautions[0].tagCode,
      'CAUTION_MATH',
    );

    assert.match(
      result.cautions[0].checkAction,
      /공식 교육과정/,
    );

    assert.equal(
      result.preparationResponses[0].questionId,
      'PREP-1',
    );

    assert.equal(
      result.preparationResponses[0].answerText,
      '아직 경험이 없어요',
    );

    assert.equal(
      result.cautionAvailability,
      'EVALUATED',
    );

    assert.equal(
      result.cautions.some(
        (c) => c.text.includes('실험 수업'),
      ),
      false,
    );
  },
);

test(
  'older backend preparation-only cautions never become approved guidance',
  () => {
    const dto = {
      ...comparisonFixture.result,
      cautions: [
        comparisonFixture.preparationResponse,
      ],
    };

    const result =
      comparisonApi().toExplorationResult(dto);

    assert.equal(result.cautions.length, 0);
    assert.equal(
      result.preparationResponses[0].questionId,
      'PREP-1',
    );
    assert.equal(
      result.groups[0].name,
      '',
    );
    assert.equal(
      result.groups[0].majors[0].name,
      '고고학과',
    );
    assert.equal(
      result.displayTextMissing,
      true,
    );
  },
);

test(
  'historical result projection preserves unavailable guidance and omits unnamed recheck codes',
  () => {
    const dto = {
      ...comparisonFixture.displayResult,
      displaySource: 'SEALED_RESULT_PROJECTION',
      cautions: [],
      cautionAvailability: 'UNAVAILABLE',
      cautionUnavailableReason:
        'APPROVAL_SNAPSHOT_NOT_AVAILABLE',
      recheckAxes: [
        {
          metricCode: 'INT_UNKNOWN',
          name: null,
        },
      ],
    };

    const result =
      comparisonApi().toExplorationResult(dto);

    assert.equal(result.groups[0].name, '인문');
    assert.equal(result.cautions.length, 0);
    assert.equal(
      result.displaySource,
      'SEALED_RESULT_PROJECTION',
    );
    assert.equal(
      result.cautionUnavailableReason,
      'APPROVAL_SNAPSHOT_NOT_AVAILABLE',
    );
    assert.equal(
      result.recheckAxes.length,
      0,
    );
  },
);

test(
  'preparation responses render as the original answers without becoming confirmation actions',
  () => {
    const React = require('react');
    const {
      renderToStaticMarkup,
    } = require('react-dom/server');

    const Responses = compile(
      'src/pages/Analysis/ExplorationResult/components/PreparationResponses.tsx',
    ).default;

    const html = renderToStaticMarkup(
      React.createElement(Responses, {
        responses: [
          comparisonFixture.preparationResponse,
        ],
      }),
    );

    assert.match(
      html,
      /내가 답한 준비 상황 보기/,
    );
    assert.match(
      html,
      /아직 경험이 없어요/,
    );

    assert.doesNotMatch(
      html,
      /이렇게 확인해보세요|CAUTION_MATH|PREP-1/,
    );

    assert.equal(
      renderToStaticMarkup(
        React.createElement(Responses, {
          responses: [],
        }),
      ),
      '',
    );
  },
);

// 탐색 진단만 사용하는 정책에 맞춘 이력 테스트
const historyFixture = require(
  './fixtures/diagnosis-history.cjs',
);

function historyApi(get, legacy, mock) {
  return compile('src/api/history.ts', {
    './axios': {
      __esModule: true,
      default: { get },
    },
    // 이전 진단 API가 호출되지 않는지 확인하기 위한 주입
    './diagnosis': {
      getDiagnosisSessions: legacy,
    },
    '../config/features': {
      isExplorationMock: Boolean(mock),
    },
    './explorationMock': mock ?? {},
  });
}

test(
  'history API requests only exploration sessions',
  async () => {
    let request;

    const api = historyApi(
      async (url, config) => {
        request = {
          url,
          params: config.params,
        };

        return {
          data: historyFixture.page(
            historyFixture.items,
          ),
        };
      },
    );

    const result =
      await api.getDiagnosisHistorySessions({
        type: 'ALL',
        status: 'completed',
        limit: 5,
        cursor: historyFixture.cursor,
        userId: 999,
        offset: 5,
      });

    assert.equal(
      request.url,
      '/exploration/v1/history/sessions',
    );

    assert.equal(
      Object.keys(request.params).sort().join(','),
      'cursor,limit,status,type',
    );

    assert.equal(
      request.params.type,
      'EXPLORATION_V1',
    );

    assert.equal(
      request.params.cursor,
      historyFixture.cursor,
    );

    assert.ok(
      result.items.every(
        (item) =>
          item.type === 'EXPLORATION_V1',
      ),
    );
  },
);

test(
  'unified history preserves exploration order without legacy fallback',
  async () => {
    let legacyCalls = 0;

    const api = historyApi(
      async () => ({
        data: historyFixture.page(
          historyFixture.items,
        ),
      }),
      async () => {
        legacyCalls++;
        return [];
      },
    );

    const result =
      await api.loadInitialDiagnosisHistory(
        true,
        5,
      );

    const expected = historyFixture.items
      .filter(
        (item) =>
          item.type === 'EXPLORATION_V1',
      )
      .map((item) => item.key);

    assert.equal(
      result.source,
      'unified',
    );

    assert.equal(
      JSON.stringify(
        result.items.map(
          (item) => item.key,
        ),
      ),
      JSON.stringify(expected),
    );

    assert.equal(legacyCalls, 0);
  },
);

test(
  'disabled or unavailable exploration never loads legacy history',
  async () => {
    let legacyCalls = 0;
    let unifiedCalls = 0;

    const disabled = historyApi(
      async () => {
        unifiedCalls++;
      },
      async () => {
        legacyCalls++;
        return [];
      },
    );

    await assert.rejects(
      disabled.loadInitialDiagnosisHistory(
        false,
        5,
      ),
      /전공 탐색 진단을 이용할 수 없어/,
    );

    assert.equal(unifiedCalls, 0);
    assert.equal(legacyCalls, 0);

    for (const failure of [
      {
        response: {
          status: 404,
        },
      },
      {
        response: {
          status: 503,
          data: {
            code: 'NO_ACTIVE_CATALOG',
          },
        },
      },
    ]) {
      const api = historyApi(
        async () => {
          unifiedCalls++;
          throw failure;
        },
        async () => {
          legacyCalls++;
          return [];
        },
      );

      await assert.rejects(
        api.loadInitialDiagnosisHistory(
          true,
          5,
        ),
        (error) => error === failure,
      );
    }

    assert.equal(unifiedCalls, 2);
    assert.equal(legacyCalls, 0);
  },
);

test(
  'network, authentication and integrity errors never silently erase exploration history',
  async () => {
    const failures = [
      new Error('Network Error'),
      {
        response: {
          status: 401,
        },
      },
      {
        response: {
          status: 500,
        },
      },
      {
        response: {
          status: 503,
          data: {
            code: 'CATALOG_INTEGRITY_ERROR',
          },
        },
      },
    ];

    for (const failure of failures) {
      let legacyCalls = 0;

      const api = historyApi(
        async () => {
          throw failure;
        },
        async () => {
          legacyCalls++;
          return [];
        },
      );

      await assert.rejects(
        api.loadInitialDiagnosisHistory(
          true,
          5,
        ),
        (error) => error === failure,
      );

      assert.equal(legacyCalls, 0);
    }
  },
);

test(
  'history navigation allows only exploration sessions and results',
  () => {
    const {
      historyActionPath,
      historyUnavailableMessage,
    } = compile(
      'src/utils/diagnosisHistory.ts',
    );

    // 탐색 진단 완료 결과
    assert.equal(
      historyActionPath(
        historyFixture.items[0],
      ),
      '/analysis/exploration/11',
    );

    // 완료한 이전 방식 진단도 더 이상 열지 않음
    assert.equal(
      historyActionPath(
        historyFixture.items[1],
      ),
      null,
    );

    // 진행 중인 이전 방식 진단도 이어하기 불가
    assert.equal(
      historyActionPath(
        historyFixture.items[5],
      ),
      null,
    );

    // 탐색 진단 이어하기는 유지
    assert.equal(
      historyActionPath(
        historyFixture.items[6],
      ),
      '/diagnosis/exploration/session/16',
    );

    assert.equal(
      historyActionPath({
        ...historyFixture.items[0],
        nextAction: 'NONE',
      }),
      null,
    );

    // 이전 진단의 결과 안내도 화면에 표시하지 않음
    assert.equal(
      historyUnavailableMessage(
        historyFixture.items[1],
      ),
      null,
    );

    assert.equal(
      historyUnavailableMessage(
        historyFixture.items[2],
      ),
      null,
    );

    // 탐색형의 결과 이용 불가 안내는 유지
    assert.match(
      historyUnavailableMessage(
        historyFixture.items[4],
      ),
      /결과 자료를 확인할 수 없어/,
    );
  },
);

test(
  'history panel renders exploration only without legacy rows or delete buttons',
  () => {
    const React = require('react');
    const {
      renderToStaticMarkup,
    } = require('react-dom/server');

    const Panel = compile(
      'src/pages/MyPage/components/DiagnosisHistoryPanel.tsx',
      {
        'react-router-dom': {
          useNavigate: () => () => undefined,
        },
        '../../../config/features': {
          diagnosisEntryPath: '/diagnosis/exploration',
        },
        '../../../utils/diagnosisHistory':
          compile(
            'src/utils/diagnosisHistory.ts',
          ),
      },
    ).default;

    const html = renderToStaticMarkup(
      React.createElement(Panel, {
        history: {
          items: historyFixture.items,
          phase: 'READY',
          hasMore: false,
          source: 'unified',
        },
      }),
    );

    assert.match(
      html,
      /전공 탐색 진단 #11/,
    );

    assert.match(
      html,
      /전공 탐색 진단 #14/,
    );

    // 이전 방식의 완료 및 진행 중인 진단은 미표시
    assert.doesNotMatch(
      html,
      /이전 방식 진단 #11|이전 방식 진단 #12|이전 방식 진단 #15/,
    );

    // 이전 진단 삭제 버튼과 종료 문구 미표시
    assert.doesNotMatch(
      html,
      /진단 삭제|서비스 종료/,
    );

    // 탐색 진단 결과 오류 안내는 유지
    assert.match(
      html,
      /결과 자료를 확인할 수 없어/,
    );

    // 결과 보기 버튼은 탐색형 완료 결과에만 표시
    assert.equal(
      (
        html.match(
          />결과 보기</g,
        ) ?? []
      ).length,
      1,
    );

    // API 주소를 라우팅 경로로 사용하지 않음
    assert.doesNotMatch(
      html,
      /DO_NOT_NAVIGATE/,
    );
  },
);

function pagedHistoryMock() {
  const sessions = {};

  const put = (
    id,
    startedAt,
    status = 'completed',
  ) => {
    sessions[id] = {
      session: {
        sessionId: id,
        resultId:
          status === 'completed'
            ? id + 100
            : null,
        status,
        stage: 2,
        startedAt,
      },
      completedAt: Date.parse(startedAt),
      issued: [],
    };
  };

  put(1, '2026-11-17T10:00:00Z');
  put(2, '2026-11-17T12:00:00Z');
  put(3, '2026-11-17T12:00:00Z');
  put(
    4,
    '2026-11-16T10:00:00Z',
    'in_progress',
  );

  const mock = compile(
    'src/api/explorationMock.ts',
    {
      './explorationMockMajors':
        compile(
          'src/api/explorationMockMajors.ts',
        ),
    },
    {
      localStorage: {
        getItem: () =>
          JSON.stringify({ sessions }),
      },
      setTimeout: (fn) => {
        fn();
        return 0;
      },
    },
  );

  return { mock, put };
}

test(
  'mock history preserves time/id order and cursor fences exclude new and backdated insertions',
  async () => {
    const { mock, put } = pagedHistoryMock();

    const first =
      await mock.historySessions({
        limit: 2,
      });

    assert.equal(
      first.items.map(
        (row) => row.sessionId,
      ).join(','),
      '3,2',
    );

    assert.equal(first.hasMore, true);

    put(
      5,
      '2026-11-17T13:00:00Z',
    );

    put(
      6,
      '2026-11-15T10:00:00Z',
    );

    const second =
      await mock.historySessions({
        limit: 2,
        cursor: first.nextCursor,
      });

    assert.equal(
      second.items.map(
        (row) => row.sessionId,
      ).join(','),
      '1,4',
    );

    assert.equal(second.hasMore, false);
    assert.equal(second.nextCursor, null);
    assert.equal(
      second.items[1].nextAction,
      'RESUME',
    );
  },
);

test(
  'mock history rejects invalid and cross-filter cursors and keeps legacy filtering empty',
  async () => {
    const { mock } = pagedHistoryMock();

    const page =
      await mock.historySessions({
        limit: 2,
      });

    for (const query of [
      { limit: 0 },
      { limit: 101 },
      { cursor: 'invalid' },
      {
        limit: 1,
        cursor: page.nextCursor,
      },
      {
        type: 'LEGACY',
        limit: 2,
        cursor: page.nextCursor,
      },
    ]) {
      await assert.rejects(
        mock.historySessions(query),
        (error) =>
          error.response.status === 400,
      );
    }

    assert.equal(
      (
        await mock.historySessions({
          type: 'LEGACY',
        })
      ).items.length,
      0,
    );

    const pending =
      await mock.historySessions({
        status: 'in_progress',
      });

    assert.equal(
      pending.items.length,
      1,
    );

    assert.equal(
      pending.items[0].resultAvailability,
      'NOT_COMPLETED',
    );
  },
);