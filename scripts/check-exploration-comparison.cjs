// 실행 중인 로컬 Vite 서버 필요: 탐색형 true / mock false / API 주소는 같은 서버의 /api.
// 실제 계정·백엔드를 사용하지 않고 현재 백엔드 DTO를 브라우저 요청 경계에 제공한다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = require('./fixtures/exploration-comparison.cjs');

const base = process.env.COMPARISON_UI_BASE_URL || 'http://127.0.0.1:5175';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('로컬 검증 서버만 사용할 수 있습니다.');
const output = path.resolve(__dirname, '../output/playwright');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 980 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  const networkFailures = [];
  const requests = [];
  const results = [];
  let state = 'DISTINCT_DIRECTIONS';
  let resultResponse = fixture.result;
  let pending;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => networkFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('console', (message) => { if (message.type() === 'error') networkFailures.push({ console: message.text() }); });
  await page.addInitScript(() => localStorage.setItem('auth', JSON.stringify({
    state: { user: { id: 1, email: 'ui@example.test', nickname: '화면검증', role: 'member' }, accessToken: 'ui-test', refreshToken: 'ui-refresh', isLoggedIn: true }, version: 0,
  })));
  await page.route(`${base}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/exploration/v1/sessions/21/result') return route.fulfill({ json: resultResponse });
    if (url.pathname !== '/api/exploration/v1/results/34/comparison') return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
    requests.push(url);
    const left = url.searchParams.get('leftMajorCode');
    const right = url.searchParams.get('rightMajorCode');
    if (!left && !right) return route.fulfill({ json: state === 'UNAVAILABLE' ? fixture.unavailable : fixture.overview });
    assert.deepEqual([...url.searchParams.keys()].sort(), ['leftMajorCode', 'rightMajorCode']);
    if (![left, right].every((code) => fixture.candidates.some((m) => m.majorCode === code))) {
      return route.fulfill({ status: 422, json: { code: 'MAJOR_NOT_IN_RESULT' } });
    }
    if (state === 'DELAYED') await new Promise((resolve) => { pending = resolve; });
    return route.fulfill({ json: fixture.pair(left, right, state === 'DELAYED' ? 'DISTINCT_DIRECTIONS' : state) });
  });
  const check = async (name, run) => { await run(); results.push({ name, passed: true }); };
  const comparePath = '/analysis/exploration/21/compare';
  const pairPath = `${comparePath}?majors=MAJOR_ROW_2,MAJOR_ROW_3`;
  try {
    await check('결과에서 2개 선택 후 실제 left/right 요청으로 비교', async () => {
      await page.goto(`${base}/analysis/exploration/21`);
      await page.getByRole('button', { name: /비교에 담기.*고고학과/ }).click();
      await page.getByRole('button', { name: /비교에 담기.*사학과/ }).click();
      assert.equal(await page.getByRole('button', { name: /비교는 최대 2개.*역사문화학과/ }).isDisabled(), true);
      await page.getByRole('button', { name: /후보 전공 비교하기/ }).click();
      await page.getByText('유적과 유물을 직접 조사하는 활동', { exact: true }).waitFor();
      assert.equal(requests.at(-1).searchParams.get('leftMajorCode'), 'MAJOR_ROW_2');
      assert.equal(requests.at(-1).searchParams.get('rightMajorCode'), 'MAJOR_ROW_3');
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      assert.doesNotMatch(await page.locator('body').innerText(), /INT_HUM|ACT_RES|LEARN_HUM|CMP-HISTORY|ARCHAEOLOGY_FIELD|\bHUM\b/);
      await page.screenshot({ path: path.join(output, 'comparison-desktop.png'), fullPage: true });
    });
    await check('모바일 가로 넘침 없이 비교 문구 표시', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.getByText('문헌과 기록을 읽고 비교하는 활동', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, 'comparison-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1365, height: 980 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    });
    await check('파라미터 없는 후보 목록에서 첫 7개 밖의 전공도 선택', async () => {
      await page.getByRole('button', { name: '다른 전공 고르기' }).click();
      await page.getByRole('heading', { name: '비교할 전공을 2개 골라주세요' }).waitFor();
      assert.equal(requests.at(-1).search, '');
      await page.getByRole('button', { name: '문화인류학과', exact: true }).click();
      await page.getByRole('button', { name: '사학과', exact: true }).click();
      await page.getByRole('button', { name: '두 전공 비교하기', exact: true }).click();
      await page.getByRole('heading', { name: '문화인류학과', exact: true }).first().waitFor();
      assert.equal(requests.at(-1).searchParams.get('leftMajorCode'), 'MAJOR_ROW_16');
    });
    await check('후보를 바꾸면 이전 요청의 늦은 결과를 표시하지 않음', async () => {
      await page.getByRole('button', { name: '다른 전공 고르기' }).click();
      await page.getByRole('heading', { name: '비교할 전공을 2개 골라주세요' }).waitFor();
      state = 'DELAYED';
      await page.getByRole('button', { name: '고고학과', exact: true }).click();
      await page.getByRole('button', { name: '사학과', exact: true }).click();
      await page.getByRole('button', { name: '두 전공 비교하기', exact: true }).click();
      await page.getByRole('status').filter({ hasText: '비교 정보를 불러오는 중이에요' }).waitFor();
      assert.equal(await page.getByText('유적과 유물을 직접 조사하는 활동', { exact: true }).count(), 0);
      await page.goBack();
      await page.getByRole('heading', { name: '비교할 전공을 2개 골라주세요' }).waitFor();
      const response = page.waitForResponse((r) => r.url().includes('leftMajorCode=MAJOR_ROW_2'));
      assert.ok(pending);
      pending();
      await response;
      assert.equal(await page.getByText('유적과 유물을 직접 조사하는 활동', { exact: true }).count(), 0);
    });
    await check('한 개만 선택한 직접 링크에서 선택을 이어감', async () => {
      state = 'DISTINCT_DIRECTIONS';
      await page.goto(`${base}${comparePath}?majors=MAJOR_ROW_2`);
      const selected = page.getByRole('button', { name: /고고학과.*선택됨/ });
      await selected.waitFor();
      assert.equal(await selected.getAttribute('aria-pressed'), 'true');
      assert.equal(requests.at(-1).search, '');
    });
    await check('같은 방향과 공통 비교 항목 없음 안내', async () => {
      state = 'SAME_DIRECTIONS';
      await page.goto(`${base}${pairPath}`);
      await page.getByText(/비교 항목에서 두 전공의 탐색 방향이 같아요/).waitFor();
      state = 'NO_SHARED_COMPARISON_SET';
      await page.goto(`${base}${pairPath}`);
      await page.getByText(/비교 항목이 아직 없어요/).waitFor();
    });
    await check('비교할 후보 없음과 결과 밖 후보 오류 안내', async () => {
      state = 'UNAVAILABLE';
      await page.goto(`${base}${comparePath}`);
      await page.getByRole('heading', { name: '아직 비교할 전공이 충분하지 않아요' }).waitFor();
      state = 'DISTINCT_DIRECTIONS';
      await page.goto(`${base}${comparePath}?majors=MAJOR_ROW_2,OUTSIDE`);
      await page.getByRole('heading', { name: '이 결과에 있는 전공만 비교할 수 있어요' }).waitFor();
      await page.getByRole('button', { name: '전공 다시 고르기' }).click();
      await page.getByRole('heading', { name: '비교할 전공을 2개 골라주세요' }).waitFor();
    });
    await check('세 전공과 잘못된 회차 링크는 비교 요청 없이 안내', async () => {
      const before = requests.length;
      await page.goto(`${base}${comparePath}?majors=MAJOR_ROW_2,MAJOR_ROW_3,MAJOR_ROW_9`);
      await page.getByRole('heading', { name: '비교할 전공을 2개 골라주세요' }).waitFor();
      assert.equal(requests.length, before);
      await page.goto(`${base}/analysis/exploration/NaN/compare`);
      await page.getByRole('heading', { name: '검사 정보를 확인해주세요' }).waitFor();
      assert.equal(requests.length, before);
    });
    await check('새 결과 표시 계약의 이름·근거·확인 안내와 준비 응답을 구분', async () => {
      resultResponse = fixture.displayResult;
      await page.goto(`${base}/analysis/exploration/21`);
      await page.getByText(fixture.displayResult.groups[0].summary, { exact: true }).waitFor();
      await page.getByText(fixture.displayResult.majors[0].reasons[0].text, { exact: true }).first().waitFor();
      await page.getByText('일부 응답에서 확인').first().waitFor();
      await page.getByText(fixture.displayResult.cautions[0].checkAction, { exact: false }).waitFor();
      const guidance = await page.locator('section[aria-labelledby="caution-title"]').innerText();
      assert.doesNotMatch(guidance, /실험 수업|아직 경험이 없어요/);
      await page.getByText('내가 답한 준비 상황 보기', { exact: true }).click();
      await page.getByText('아직 경험이 없어요', { exact: true }).waitFor();
      assert.doesNotMatch(await page.locator('body').innerText(), /INT_HUM|CAUTION_MATH|PREP-1|\bHUM\b/);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, 'result-display-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.screenshot({ path: path.join(output, 'result-display-mobile.png') });
    });
    await check('과거 결과의 확인 안내 불가 상태를 유지', async () => {
      resultResponse = { ...fixture.displayResult, displaySource: 'SEALED_RESULT_PROJECTION', cautions: [],
        cautionAvailability: 'UNAVAILABLE', cautionUnavailableReason: 'APPROVAL_SNAPSHOT_NOT_AVAILABLE' };
      await page.goto(`${base}/analysis/exploration/21`);
      await page.getByText('이 결과에는 당시 확인된 안내 자료가 없어 전공별 확인 안내를 제공하지 않아요.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('heading', { name: '탐색하면서 확인해볼 점', exact: true }).count(), 0);
      await page.getByText(fixture.displayResult.groups[0].summary, { exact: true }).waitFor();
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'comparison-report.json'), JSON.stringify({ backend: 'contract-fixtures', results }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'comparison-failure.png'), fullPage: true });
    fs.writeFileSync(path.join(output, 'comparison-failure.txt'), await page.locator('body').ariaSnapshot());
    console.error(JSON.stringify({ url: page.url(), errors, networkFailures, requests: requests.map(String), text: (await page.locator('body').innerText()).slice(0, 1800) }, null, 2));
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
