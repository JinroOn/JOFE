// 관리자 활동 목록·상세·활동별 검토 (JinroOn/JOFE#152, 백엔드 JOBE #125 9d6593a 기준)
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
  vm.runInNewContext(
    code,
    { exports, require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), ...globals },
    { filename },
  );
  return exports;
}

function client() {
  const calls = [];
  const record = method => async (url, body) => {
    calls.push({ method, url, body });
    return { data: method === 'get' ? [] : {} };
  };
  const api = { get: record('get'), post: record('post') };
  const mod = compile('src/api/explorationAdmin.ts', {
    './axios': { __esModule: true, default: api },
    '../config/features': { isExplorationMock: false },
    './explorationAdminMock': {},
  });
  return { mod, calls };
}

function mockAdapter() {
  const store = new Map();
  return compile('src/api/explorationAdminMock.ts', {}, {
    setTimeout: fn => fn(),
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
  });
}

test('activity list and detail use the ACTIVITY_CATALOG admin paths', async () => {
  const { mod, calls } = client();
  await mod.getExplorationCatalogActivities(1);
  await mod.getExplorationCatalogActivity(1, 154);
  assert.equal(calls[0].url, '/admin/exploration/catalogs/ACTIVITY_CATALOG/1/activities');
  assert.equal(calls[1].url, '/admin/exploration/catalogs/ACTIVITY_CATALOG/1/activities/154');
});

test('a single activity is reviewed through the shared review endpoint with targetType ACTIVITY', async () => {
  const { mod, calls } = client();
  await mod.reviewExplorationCatalog({
    targetType: 'ACTIVITY', targetId: 154, reviewKind: 'DOMAIN', decision: 'APPROVED', evidenceReference: 'REVIEW-DOC-1',
  });
  assert.equal(calls[0].method, 'post');
  assert.equal(calls[0].url, '/admin/exploration/reviews');
  assert.deepEqual(Object.keys(calls[0].body).sort(), ['decision', 'evidenceReference', 'reviewKind', 'targetId', 'targetType']);
  assert.equal(calls[0].body.targetType, 'ACTIVITY');
});

test('activity review state needs both implementation and domain approval, and any rejection wins', () => {
  const labels = compile('src/pages/Admin/ExplorationCatalog/components/adminLabels.ts');
  const row = (implementationReviewStatus, domainReviewStatus) => ({ implementationReviewStatus, domainReviewStatus });
  assert.equal(labels.activityReviewState(row('APPROVED_FOR_IMPLEMENTATION', 'APPROVED')), 'APPROVED');
  assert.equal(labels.activityReviewState(row('APPROVED_FOR_IMPLEMENTATION', 'PENDING')), 'PENDING');
  assert.equal(labels.activityReviewState(row('PENDING', 'APPROVED')), 'PENDING');
  assert.equal(labels.activityReviewState(row('APPROVED_FOR_IMPLEMENTATION', 'REJECTED')), 'REJECTED');
  assert.equal(labels.reviewStatusLabel('PENDING'), '미검토');
});

test('mock lists activities in activity_code order and keeps each catalog to its own activities', async () => {
  const mock = mockAdapter();
  const list = await mock.listActivities(2);
  // vm 안에서 만든 배열이라 deepEqual 대신 JSON으로 비교한다
  const codes = list.map(item => item.activityCode);
  assert.equal(JSON.stringify(codes), JSON.stringify([...codes].sort()));
  assert.ok(list.every(item => item.targetType === 'ACTIVITY'));
  const other = (await mock.listActivities(1))[0];
  await assert.rejects(mock.getActivity(2, other.targetId), e => e.response.status === 404);
});

test('mock activity review moves DRAFT to REVIEWED only after both approvals and records the history', async () => {
  const mock = mockAdapter();
  const [first] = await mock.listActivities(2);
  assert.equal(first.contentStatus, 'DRAFT');
  const review = kind => mock.review({
    targetType: 'ACTIVITY', targetId: first.targetId, reviewKind: kind, decision: 'APPROVED', evidenceReference: 'MOCK-DOC',
  });
  await review('IMPLEMENTATION');
  assert.equal((await mock.getActivity(2, first.targetId)).activity.contentStatus, 'DRAFT');
  await review('DOMAIN');
  const detail = await mock.getActivity(2, first.targetId);
  assert.equal(detail.activity.contentStatus, 'REVIEWED');
  assert.equal(detail.activity.domainReviewStatus, 'APPROVED');
  assert.equal(detail.reviews.length, 2);
  // 활동 검토는 카탈로그 상태를 바꾸지 않는다
  assert.equal((await mock.getCatalog('ACTIVITY_CATALOG', 2)).catalog.contentStatus, 'DRAFT');
});
