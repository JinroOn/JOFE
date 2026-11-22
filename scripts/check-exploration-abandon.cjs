const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.ABANDON_UI_BASE_URL || 'http://127.0.0.1:5178';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('로컬 검증 주소만 사용할 수 있습니다.');
const output = path.resolve(__dirname, '../output/playwright');
fs.mkdirSync(output, { recursive: true });
const makeSession = (status = 'in_progress') => ({ sessionId: 42, diagnosisType: 'EXPLORATION_V1', status, stage: 1, revision: 7,
  versions: { questionCatalog: 'test', optionCatalog: 'test', majorMapping: 'test', ruleset: 'test' }, startedAt: '2026-11-17T10:00:00', resultId: null });
const detail = session => ({ session, issued: [{ stage: 1, effective: true, answerCode: null, question: {
  issuedId: 101, questionId: 'QA_1', questionVersion: 'test', comparisonSet: null, optionVariantVersion: null,
  text: '브라우저 검증용 질문', required: true, options: [{ code: 'A', text: '첫 번째 답', order: 1 }, { code: 'B', text: '두 번째 답', order: 2 }],
} }], progress: { stage: 1, answered: 0, issued: 1, stageMax: 39, remainingMax: 38 }, nextAction: 'ANSWER' });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 980 } });
  page.setDefaultTimeout(10000);
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('auth', JSON.stringify({ state: {
    user: { id: 1, nickname: '중단 검증', email: 'abandon@example.test', role: 'member' },
    accessToken: 'fixture-access', refreshToken: 'fixture-refresh', isLoggedIn: true,
  }, version: 0 })));
  let session;
  let listFailure;
  let loadMode;
  let postMode;
  let release;
  let posts;
  let gets;
  let otherWrites;
  let replays;
  const reset = () => { session = makeSession(); listFailure = false; loadMode = 'normal'; postMode = 'normal'; release = null; posts = []; gets = []; otherWrites = []; replays = new Map(); };
  reset();
  await page.route(`${base}/api/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const p = url.pathname;
    const method = request.method();
    if (method === 'GET') gets.push(p);
    else if (!p.endsWith('/abandon')) otherWrites.push(p);
    if (p === '/api/exploration/v1/sessions' && method === 'GET') {
      assert.equal(url.searchParams.get('type'), 'EXPLORATION_V1');
      if (listFailure) return route.fulfill({ status: 500, json: { code: 'INTERNAL_SERVER_ERROR' } });
      return route.fulfill({ json: [{ ...session, type: 'EXPLORATION_V1' },
        { ...makeSession('completed'), sessionId: 43, type: 'EXPLORATION_V1' },
        { ...makeSession(), sessionId: 80, type: 'LEGACY' }] });
    }
    if (p === '/api/diagnoses/sessions/me/in-progress') return route.fulfill({ json: { session: { id: 80, startedAt: '2026-11-16T10:00:00' } } });
    if (/\/sessions\/\d+$/.test(p) && method === 'GET') {
      if (loadMode === 'delay') await new Promise(resolve => { release = resolve; });
      if (loadMode === 'error') return route.fulfill({ status: 500, json: { code: 'INTERNAL_SERVER_ERROR' } });
      if (loadMode === 'missing') return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
      if (loadMode === 'completed' || loadMode === 'abandoned') session = { ...session, status: loadMode };
      return route.fulfill({ json: detail(session) });
    }
    if (p === '/api/exploration/v1/sessions/42/abandon' && method === 'POST') {
      const body = request.postDataJSON();
      const key = request.headers()['idempotency-key'];
      assert.deepEqual(Object.keys(body), ['expectedRevision']);
      assert.ok(key);
      posts.push({ body, key });
      if (postMode === 'delay') await new Promise(resolve => { release = resolve; });
      if (postMode === 'stale') {
        session.revision++;
        return route.fulfill({ status: 409, json: { code: 'STALE_REVISION' } });
      }
      if (postMode === 'completed') { session.status = 'completed'; return route.fulfill({ status: 409, json: { code: 'SESSION_ALREADY_COMPLETED' } }); }
      if (replays.has(key)) return route.fulfill({ json: replays.get(key) });
      assert.equal(body.expectedRevision, session.revision);
      session = { ...session, status: 'abandoned', revision: session.revision + 1 };
      replays.set(key, session);
      if (postMode === 'lost') return route.abort('failed');
      return route.fulfill({ json: session });
    }
    if (p === '/api/exploration/v1/sessions' && method === 'POST') {
      session = { ...makeSession(), sessionId: 99 };
      return route.fulfill({ json: session });
    }
    if (p === '/api/auth/logout') return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
  });
  const dialog = page.getByRole('dialog', { name: '이 검사를 중단할까요?' });
  const open = async () => { await page.getByRole('button', { name: '전공 탐색 진단 #42 중단', exact: true }).click(); await dialog.waitFor(); };
  const confirm = () => dialog.getByRole('button', { name: '검사 중단하기', exact: true });
  const visit = async () => { await page.goto(`${base}/diagnosis/exploration`); await page.getByRole('button', { name: /전공 탐색 진단 #42 이어하기/ }).waitFor(); };
  const check = async (name, run) => { reset(); await run(); assert.deepEqual(errors, []); results.push({ name, passed: true }); console.log('PASS', name); };
  try {
    await check('목록 실패를 숨기지 않고 시작 차단·재조회', async () => {
      listFailure = true;
      await page.goto(`${base}/diagnosis/exploration`);
      await page.getByRole('alert').filter({ hasText: '진행 중인 검사를 불러오지 못했어요.' }).waitFor();
      assert.equal(await page.getByRole('button', { name: /새로 시작하기|검사 시작하기/ }).isDisabled(), true);
      listFailure = false;
      await page.getByRole('button', { name: '다시 시도', exact: true }).click();
      await page.getByRole('button', { name: '전공 탐색 진단 #42 중단', exact: true }).waitFor();
    });
    await check('진행 중 탐색형에만 중단 제공·완료/레거시 보호·취소/ESC는 POST 없음', async () => {
      await visit();
      assert.equal(await page.getByRole('button', { name: /전공 탐색 진단 #\d+ 중단/ }).count(), 1);
      assert.equal(await page.getByRole('button', { name: /이전 방식 진단 이어하기/ }).count(), 0);
      assert.equal(gets.includes('/api/diagnoses/sessions/me/in-progress'), false);
      await open();
      await confirm().waitFor();
      await dialog.getByText('전공 탐색 진단 #42', { exact: true }).waitFor();
      await dialog.getByRole('button', { name: '취소', exact: true }).click();
      await open();
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(posts.length, 0);
    });
    await check('최신 상태 확인 전 변경 불가·읽기 실패 재시도', async () => {
      await visit(); loadMode = 'delay'; await open();
      await dialog.getByRole('status').waitFor();
      assert.equal(await confirm().count(), 0);
      loadMode = 'error'; release();
      await dialog.getByRole('alert').filter({ hasText: '중단 요청은 보내지 않았어요.' }).waitFor();
      assert.equal(posts.length, 0);
      loadMode = 'normal';
      await dialog.getByRole('button', { name: '최신 상태 확인' }).click();
      await confirm().waitFor();
    });
    await check('중복 클릭·처리 중 취소 차단·성공 후 캐시 정리·명시적 새 검사 시작', async () => {
      await visit(); await page.evaluate(async () => { const store = (await import('/src/store/useExplorationStore.ts')).default; store.setState({ session: { sessionId: 42 }, phase: 'ANSWERING' }); });
      await open(); await confirm().waitFor(); postMode = 'delay';
      await confirm().evaluate(button => { button.click(); button.click(); });
      await dialog.getByRole('button', { name: '중단하는 중…' }).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(), true);
      assert.equal(await dialog.getByRole('button', { name: '취소' }).isDisabled(), true);
      assert.equal(posts.length, 1);
      assert.equal(posts[0].body.expectedRevision, 7);
      postMode = 'normal'; release();
      await page.getByRole('status').filter({ hasText: '전공 탐색 진단 #42을 중단했어요.' }).waitFor();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(async () => (await import('/src/store/useExplorationStore.ts')).default.getState().session), null);
      assert.equal(otherWrites.length, 0);
      await page.getByRole('button', { name: '검사 시작하기', exact: true }).click();
      await page.waitForURL('**/diagnosis/exploration/session/99');
      assert.deepEqual(otherWrites, ['/api/exploration/v1/sessions']);
    });
    await check('응답 유실 재시도는 같은 키·본문으로 완료 응답 재생', async () => {
      await visit(); await open(); await confirm().waitFor(); postMode = 'lost';
      await confirm().click();
      await dialog.getByRole('button', { name: '중단 요청 다시 확인' }).waitFor();
      assert.equal(session.status, 'abandoned');
      postMode = 'normal';
      await dialog.getByRole('button', { name: '중단 요청 다시 확인' }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(posts.length, 2);
      assert.deepEqual(posts[0], posts[1]);
      assert.equal(await page.getByRole('button', { name: '전공 탐색 진단 #42 중단', exact: true }).count(), 0);
    });
    await check('동시 수정은 자동 재적용 없이 최신 조회·재확인 후 새 revision 사용', async () => {
      await visit(); await open(); await confirm().waitFor(); postMode = 'stale';
      await confirm().click();
      await dialog.getByRole('alert').filter({ hasText: '다른 창에서 검사가 바뀌었어요.' }).waitFor();
      assert.equal(await confirm().count(), 0);
      assert.equal(posts.length, 1);
      postMode = 'normal';
      await dialog.getByRole('button', { name: '최신 상태 확인' }).click();
      await confirm().waitFor();
      assert.equal(posts.length, 1);
      await confirm().click(); await dialog.waitFor({ state: 'hidden' });
      assert.equal(posts.length, 2);
      assert.equal(posts[1].body.expectedRevision, 8);
      assert.notEqual(posts[0].key, posts[1].key);
    });
    await check('이미 완료·중단·없는 회차는 변경 없이 목록 확인', async () => {
      for (const mode of ['completed', 'abandoned', 'missing']) {
        session = makeSession(); loadMode = 'normal'; await visit(); loadMode = mode; await open();
        await page.evaluate(async () => (await import('/src/store/useExplorationStore.ts')).default.setState({ session: { sessionId: 42 }, phase: 'ANSWERING' }));
        await dialog.getByRole('button', { name: '목록 새로고침' }).waitFor();
        assert.equal(await confirm().count(), 0);
        await dialog.getByRole('button', { name: '목록 새로고침' }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(async () => (await import('/src/store/useExplorationStore.ts')).default.getState().session), null);
      }
      assert.equal(posts.length, 0);
    });
    await check('확인 이후 다른 창에서 완료되면 재시도 없이 목록으로 복귀', async () => {
      await visit(); await open(); await confirm().waitFor(); postMode = 'completed';
      await confirm().click();
      await dialog.getByRole('button', { name: '목록 새로고침' }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(posts.length, 1);
      assert.equal(session.status, 'completed');
    });
    await check('중단된 검사 직접 접근은 질문 발급·완료 요청 없이 안내', async () => {
      session.status = 'abandoned';
      await page.goto(`${base}/diagnosis/exploration/session/42`);
      await page.getByRole('alert').filter({ hasText: '중단된 검사예요.' }).waitFor();
      assert.equal(await page.getByRole('button', { name: '다시 시도', exact: true }).count(), 0);
      assert.equal(otherWrites.length, 0);
      await page.getByRole('button', { name: '검사 안내로', exact: true }).click();
      await page.waitForURL(`${base}/diagnosis/exploration`);
      assert.equal(await page.getByRole('alert').filter({ hasText: '검사를 시작하지 못했어요.' }).count(), 0);
    });
    await check('늦은 상세 응답은 닫힌 확인창을 복원하지 않음', async () => {
      await visit(); loadMode = 'delay'; await open(); await dialog.getByRole('status').waitFor();
      await dialog.getByRole('button', { name: '취소', exact: true }).click();
      loadMode = 'normal'; release();
      await page.getByRole('button', { name: '전공 탐색 진단 #42 중단', exact: true }).waitFor();
      await open(); await confirm().waitFor();
      assert.equal(posts.length, 0);
    });
    await check('모바일 390px·320px 확인창 범위·키보드 포커스·ESC 취소', async () => {
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 }); await visit(); await open(); await confirm().waitFor();
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true); }
        await page.screenshot({ path: path.join(output, `abandon-mobile-${width}.png`) });
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
      }
      assert.equal(posts.length, 0);
    });
    await page.setViewportSize({ width: 1365, height: 980 }); await visit(); await open(); await confirm().waitFor();
    await page.screenshot({ path: path.join(output, 'abandon-desktop.png') });
  } finally {
    fs.writeFileSync(path.join(output, 'abandon-report.json'), JSON.stringify({ mode: 'contract-fixtures', results, pageErrors: errors }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
