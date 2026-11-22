const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = require('./fixtures/diagnosis-history.cjs');
const comparison = require('./fixtures/exploration-comparison.cjs');

const base = process.env.HISTORY_UI_BASE_URL || 'http://127.0.0.1:5176';
const backend = process.env.HISTORY_DEV_BACKEND || 'http://127.0.0.1:18080';
const dev = process.argv.includes('--dev');
for (const url of [base, backend]) if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('로컬 검증 주소만 사용할 수 있습니다.');
const output = path.resolve(__dirname, '../output/playwright');
fs.mkdirSync(output, { recursive: true });

(async () => {
  let auth = { user: { id: 1, email: 'history@example.test', nickname: '이력 검증', role: 'member' }, accessToken: 'history-test', refreshToken: 'history-refresh' };
  const results = [];
  let actualRows = [];
  let actualPages = 0;
  if (dev) {
    if (!process.env.HISTORY_DEV_EMAIL || !process.env.HISTORY_DEV_PASSWORD) throw new Error('로컬 테스트 계정 환경변수가 필요합니다.');
    const response = await fetch(`${backend}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.HISTORY_DEV_EMAIL, password: process.env.HISTORY_DEV_PASSWORD }), signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, 'DEV 로그인');
    auth = await response.json();
    let cursor;
    do {
      const query = new URLSearchParams({ limit: '2' });
      if (cursor) query.set('cursor', cursor);
      const response = await fetch(`${backend}/api/exploration/v1/history/sessions?${query}`, { headers: { Authorization: `Bearer ${auth.accessToken}` }, signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, 'DEV 이력 커서 조회');
      const data = await response.json();
      actualRows.push(...data.items);
      actualPages++;
      cursor = data.hasMore ? data.nextCursor : null;
      assert.ok(actualPages < 25, 'DEV 테스트 계정의 이력이 예상보다 많습니다.');
    } while (cursor);
    assert.equal(new Set(actualRows.map((row) => row.key)).size, actualRows.length);
    assert.ok(actualRows.some((row) => row.type === 'LEGACY' && row.status === 'in_progress'));
    assert.ok(actualRows.some((row) => row.type === 'EXPLORATION_V1' && row.status === 'completed'));
    assert.ok(actualRows.every((row) => typeof row.stage === 'number'));
    results.push({ name: '실제 DEV 혼합 이력·서명 커서·숫자 단계 확인', passed: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 980 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  const requests = [];
  let mode = 'normal';
  let deleted = false;
  let failMore = false;
  let failDelete = false;
  let pending;
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((login) => localStorage.setItem('auth', JSON.stringify({ state: { ...login, isLoggedIn: true }, version: 0 })), auth);
  const rows = () => fixture.items.filter((item) => !(deleted && item.type === 'LEGACY' && item.sessionId === 11));
  await page.route(`${base}/api/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: url.pathname, cursor: url.searchParams.get('cursor'), keys: [...url.searchParams.keys()] });
    if (dev) return route.fulfill({ response: await route.fetch({ url: `${backend}${url.pathname}${url.search}` }) });
    if (url.pathname === '/api/exploration/v1/history/sessions') {
      assert.deepEqual([...url.searchParams.keys()].sort(), url.searchParams.has('cursor') ? ['cursor', 'limit'] : ['limit']);
      assert.equal(url.searchParams.get('limit'), '5');
      if (mode === 'error') return route.fulfill({ status: 500, json: { code: 'INTERNAL_SERVER_ERROR' } });
      if (mode === 'fallback') return route.fulfill({ status: 503, json: { code: 'NO_ACTIVE_CATALOG' } });
      const cursor = url.searchParams.get('cursor');
      if (cursor) {
        assert.equal(cursor, deleted ? 'after-delete-cursor' : fixture.cursor);
        if (failMore) { failMore = false; return route.fulfill({ status: 503, json: { code: 'TEMPORARY_FAILURE' } }); }
        if (mode === 'delayed') await new Promise((resolve) => { pending = resolve; });
        return route.fulfill({ json: fixture.page(rows().slice(5)) });
      }
      const first = mode === 'empty' ? [] : rows().slice(0, 5).map((item, index) => mode === 'none' && index === 0 ? { ...item, nextAction: 'NONE' } : item);
      return route.fulfill({ json: fixture.page(first, first.length > 0, deleted ? 'after-delete-cursor' : fixture.cursor) });
    }
    if (request.method() === 'DELETE' && url.pathname === '/api/diagnoses/sessions/11') {
      if (failDelete) { failDelete = false; return route.fulfill({ status: 503, json: { code: 'TEMPORARY_FAILURE' } }); }
      deleted = true;
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/diagnoses/sessions/me') return route.fulfill({ json: [fixture.legacySession(41), fixture.legacySession(42, 'in_progress')] });
    if (url.pathname === '/api/dashboard/summary') return route.fulfill({ json: { latestResult: { type: 'LEGACY', resultId: 202, sessionId: 22, completedAt: '2026-11-17T12:00:00' }, latestByType: {}, exploration: 'AVAILABLE' } });
    if (url.pathname === '/api/results') return route.fulfill({ json: [
      { id: 202, createdAt: '2026-11-17T12:00:00', competencyVector: '{}', tendencyVector: '{}' },
      { id: 101, createdAt: '2026-11-16T12:00:00', competencyVector: '{}', tendencyVector: '{}' },
    ] });
    if (url.pathname === '/api/exploration/v1/sessions/11/result') return route.fulfill({ json: { ...comparison.displayResult, sessionId: 11, resultId: 501 } });
    if (url.pathname === '/api/majors' || url.pathname.endsWith('/major-scores') || url.pathname.endsWith('/favorites') || url.pathname.endsWith('/consents')) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
  });

  const panel = page.locator('section[aria-labelledby="diagnosis-history-title"]');
  const row = (name) => panel.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) });
  const load = async () => { await page.goto(`${base}/mypage`); await panel.getByRole('listitem').first().waitFor(); };
  const check = async (name, run) => { await run(); results.push({ name, passed: true }); };
  try {
    if (dev) {
      await check('실제 DEV 응답을 그대로 받는 마이페이지 혼합 이력', async () => {
        await load();
        const shown = await panel.getByRole('listitem').locator('p.font-semibold').allTextContents();
        assert.deepEqual(shown, actualRows.slice(0, 5).map((item) => `${item.type === 'LEGACY' ? '이전 방식' : '전공 탐색'} 진단 #${item.sessionId}`));
        assert.equal(requests.filter((r) => r.path === '/api/diagnoses/sessions/me').length, 0);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: path.join(output, 'history-dev-desktop.png'), fullPage: true });
      });
      await check('실제 DEV 완료 결과 열기와 이전 방식 이어하기 제거', async () => {
        const complete = actualRows.find((item) => item.type === 'EXPLORATION_V1' && item.nextAction === 'VIEW_RESULT');
        await row(`전공 탐색 진단 #${complete.sessionId}`).getByRole('button', { name: '결과 보기' }).click();
        await page.waitForURL(`**/analysis/exploration/${complete.sessionId}`);
        await page.getByRole('heading', { name: /먼저 탐색해볼 수 있는 전공이에요|탐색을 시작할 작은 활동/ }).waitFor();
        await load();
        const resume = actualRows.find((item) => item.type === 'LEGACY' && item.nextAction === 'RESUME');
        const archived = row(`이전 방식 진단 #${resume.sessionId}`);
        await archived.getByText('이전 방식의 진단이 종료됐어요.').waitFor();
        assert.equal(await archived.getByRole('button', { name: '이어하기' }).count(), 0);
      });
    } else {
      await check('혼합 ID·서버 순서·결과 가용성 5종', async () => {
        await load();
        const titles = await panel.getByRole('listitem').locator('p.font-semibold').allTextContents();
        assert.deepEqual(titles, ['전공 탐색 진단 #11', '이전 방식 진단 #11', '이전 방식 진단 #12', '이전 방식 진단 #13', '전공 탐색 진단 #14']);
        assert.equal(await panel.getByRole('button', { name: '결과 보기', exact: true }).count(), 2);
        await panel.getByText('완료된 진단이지만 저장된 결과가 없어요.').waitFor();
        await panel.getByText('결과가 여러 개 있어 확인이 필요해요.').waitFor();
        await panel.getByText('결과 자료를 확인할 수 없어 열 수 없어요.').waitFor();
        assert.equal(requests.filter((r) => ['/api/diagnoses/sessions/me', '/api/results', '/api/exploration/v1/sessions'].includes(r.path)).length, 0);
      });
      await check('커서 더 보기 실패·재시도·중복 없는 이어붙이기', async () => {
        failMore = true;
        await panel.getByRole('button', { name: '이력 더 보기' }).click();
        await panel.getByRole('alert').waitFor();
        assert.equal(await panel.getByRole('listitem').count(), 5);
        await panel.getByRole('button', { name: '더 보기 다시 시도' }).click();
        await row('전공 탐색 진단 #17').waitFor();
        assert.equal(await panel.getByRole('listitem').count(), 8);
        assert.equal(await row('전공 탐색 진단 #17').getByRole('button').count(), 0);
        assert.equal(await row('전공 탐색 진단 #16').getByRole('button', { name: '이어하기' }).count(), 1);
        await row('이전 방식 진단 #15').getByText('이전 방식의 진단이 종료됐어요.').waitFor();
        assert.equal(await row('이전 방식 진단 #15').getByRole('button', { name: '이어하기' }).count(), 0);
      });
      await check('프론트 경로로 이동하고 선택한 레거시 결과 ID 유지', async () => {
        await row('전공 탐색 진단 #11').getByRole('button', { name: '결과 보기' }).click();
        await page.waitForURL('**/analysis/exploration/11');
        await load();
        const scores = page.waitForRequest((request) => request.url().includes('/api/results/101/major-scores'));
        await row('이전 방식 진단 #11').getByRole('button', { name: '결과 보기' }).click();
        await scores;
        assert.equal(new URL(page.url()).searchParams.get('resultId'), '101');
        assert.equal(requests.some((r) => r.path.includes('DO_NOT_NAVIGATE')), false);
      });
      await check('삭제 실패 보존·재시도 후 첫 페이지 재조회', async () => {
        await load();
        failDelete = true;
        await row('이전 방식 진단 #11').getByRole('button', { name: /진단 삭제/ }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: '삭제', exact: true }).click();
        await dialog.getByRole('alert').waitFor();
        assert.equal(await row('이전 방식 진단 #11').count(), 1);
        await dialog.getByRole('button', { name: '삭제', exact: true }).click();
        await row('이전 방식 진단 #15').waitFor();
        assert.equal(await row('이전 방식 진단 #11').count(), 0);
        assert.equal(await row('전공 탐색 진단 #11').count(), 1);
        assert.equal(requests.filter((r) => r.path.endsWith('/history/sessions')).at(-1).cursor, null);
      });
      await check('새로고침 후 늦은 이전 페이지 응답을 버림', async () => {
        mode = 'delayed';
        await panel.getByRole('button', { name: '이력 더 보기' }).click();
        await panel.getByRole('button', { name: '불러오는 중…' }).waitFor();
        await panel.getByRole('button', { name: '이력 새로고침' }).click();
        await row('이전 방식 진단 #15').waitFor();
        const response = page.waitForResponse((response) => response.url().includes('cursor=after-delete-cursor'));
        assert.ok(pending); pending(); await response;
        assert.equal(await panel.getByRole('listitem').count(), 5);
      });
      await check('초기 오류는 숨기지 않고 재시도·서버 NONE 행동 준수', async () => {
        mode = 'error';
        await page.goto(`${base}/mypage`);
        await panel.getByRole('alert').waitFor();
        assert.equal(requests.filter((r) => r.path === '/api/diagnoses/sessions/me').length, 0);
        mode = 'none';
        await panel.getByRole('button', { name: '다시 불러오기' }).click();
        await row('전공 탐색 진단 #11').waitFor();
        assert.equal(await row('전공 탐색 진단 #11').getByRole('button').count(), 0);
      });
      await check('실행 범위 밖은 레거시 대체, 정상 빈 목록은 빈 상태', async () => {
        mode = 'fallback';
        await load();
        await panel.getByText('현재 이전 방식 진단 이력만 표시하고 있어요.').waitFor();
        await row('이전 방식 진단 #41').waitFor();
        assert.equal(await panel.getByRole('listitem').count(), 2);
        mode = 'empty';
        await page.goto(`${base}/mypage`);
        await panel.getByText('진단 기록이 없습니다.').waitFor();
      });
      await check('없는 레거시 결과 ID를 최신 결과로 바꾸지 않음', async () => {
        await page.goto(`${base}/analysis/dashboard?view=legacy&resultId=99999`);
        await page.getByText('요청한 진단 결과를 찾을 수 없습니다. 진단 이력에서 다시 확인해주세요.').waitFor();
        assert.equal(requests.filter((r) => r.path === '/api/results/202/major-scores').length, 0);
      });
    }
    await check('데스크톱·모바일 이력 레이아웃', async () => {
      mode = 'normal'; await load();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, dev ? 'history-dev-desktop.png' : 'history-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, dev ? 'history-dev-mobile.png' : 'history-mobile.png'), fullPage: true });
    });
    assert.deepEqual(errors, []);
    const report = { backend: dev ? 'actual-dev' : 'contract-fixtures', actualPages: dev ? actualPages : undefined,
      actualRows: dev ? actualRows.map((item) => ({ type: item.type, status: item.status, availability: item.resultAvailability })) : undefined, results };
    fs.writeFileSync(path.join(output, dev ? 'history-dev-report.json' : 'history-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: results.length, backend: report.backend, results }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'history-failure.png'), fullPage: true });
    fs.writeFileSync(path.join(output, 'history-failure.txt'), await page.locator('body').ariaSnapshot());
    console.error(JSON.stringify({ url: page.url(), errors, completed: results.map((item) => item.name) }));
    throw error;
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
