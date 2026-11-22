const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const fixture = require(
  './fixtures/diagnosis-history.cjs',
);

const comparison = require(
  './fixtures/exploration-comparison.cjs',
);

const base =
  process.env.HISTORY_UI_BASE_URL ||
  'http://127.0.0.1:5176';

if (
  !['localhost', '127.0.0.1'].includes(
    new URL(base).hostname,
  )
) {
  throw new Error(
    '로컬 검증 주소만 사용할 수 있습니다.',
  );
}

const output = path.resolve(
  __dirname,
  '../output/playwright',
);

fs.mkdirSync(output, { recursive: true });

const auth = {
  user: {
    id: 1,
    email: 'history@example.test',
    nickname: '이력 검증',
    role: 'member',
  },
  accessToken: 'history-test',
  refreshToken: 'history-refresh',
};

const explorationRows = fixture.items.filter(
  (item) => item.type === 'EXPLORATION_V1',
);

const makeCompletedRow = (id) => ({
  ...explorationRows[0],
  key: `EXPLORATION_V1:SESSION:${id}`,
  sessionKey: `EXPLORATION_V1:SESSION:${id}`,
  sessionId: id,
  resultId: 500 + id,
  resultKey: `EXPLORATION_V1:RESULT:${500 + id}`,
  occurredAt: `2026-11-08T${String(
    id % 24,
  ).padStart(2, '0')}:00:00`,
  status: 'completed',
  resultAvailability: 'AVAILABLE',
  nextAction: 'VIEW_RESULT',
});

const rows = [
  ...explorationRows,
  makeCompletedRow(18),
  makeCompletedRow(19),
  makeCompletedRow(20),
];

const nextCursor = 'exploration-next-page';

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: {
      width: 1365,
      height: 980,
    },
  });

  page.setDefaultTimeout(10000);

  let mode = 'normal';
  let failMore = false;

  const requests = [];
  const results = [];

  await page.addInitScript((login) => {
    localStorage.setItem(
      'auth',
      JSON.stringify({
        state: {
          ...login,
          isLoggedIn: true,
        },
        version: 0,
      }),
    );
  }, auth);

  await page.route(`${base}/api/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    requests.push({
      method: request.method(),
      path: url.pathname,
      search: url.search,
    });

    if (
      url.pathname ===
      '/api/exploration/v1/history/sessions'
    ) {
      assert.equal(
        url.searchParams.get('type'),
        'EXPLORATION_V1',
      );

      assert.equal(
        url.searchParams.get('limit'),
        '5',
      );

      if (mode === 'error') {
        return route.fulfill({
          status: 500,
          json: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }

      if (mode === 'unavailable') {
        return route.fulfill({
          status: 503,
          json: {
            code: 'NO_ACTIVE_CATALOG',
          },
        });
      }

      if (mode === 'not-found') {
        return route.fulfill({
          status: 404,
          json: {
            code: 'RESOURCE_NOT_FOUND',
          },
        });
      }

      if (mode === 'empty') {
        return route.fulfill({
          json: fixture.page(
            [],
            false,
            null,
          ),
        });
      }

      const cursor =
        url.searchParams.get('cursor');

      if (cursor !== null) {
        assert.equal(cursor, nextCursor);

        if (failMore) {
          failMore = false;

          return route.fulfill({
            status: 503,
            json: {
              code: 'TEMPORARY_FAILURE',
            },
          });
        }
      }

      const pageRows = cursor
        ? rows.slice(5)
        : rows.slice(0, 5);

      return route.fulfill({
        json: fixture.page(
          pageRows,
          !cursor && rows.length > 5,
          !cursor && rows.length > 5
            ? nextCursor
            : null,
        ),
      });
    }

    if (
      url.pathname === '/api/dashboard/summary'
    ) {
      const latest = {
        type: 'EXPLORATION_V1',
        sessionId: 11,
        resultId: 501,
        completedAt: '2026-11-15T10:00:00',
      };

      return route.fulfill({
        json: {
          latestResult: latest,
          latestByType: {
            EXPLORATION_V1: latest,
          },
          exploration: 'AVAILABLE',
        },
      });
    }

    if (
      url.pathname ===
      '/api/exploration/v1/sessions/11/result'
    ) {
      return route.fulfill({
        json: {
          ...comparison.displayResult,
          sessionId: 11,
          resultId: 501,
        },
      });
    }

    if (
      url.pathname === '/api/majors' ||
      url.pathname.endsWith('/favorites') ||
      url.pathname.endsWith('/consents')
    ) {
      return route.fulfill({
        json: [],
      });
    }

    return route.fulfill({
      status: 404,
      json: { code: 'NOT_FOUND' },
    });
  });

  const panel = page.locator(
    'section[aria-labelledby="diagnosis-history-title"]',
  );

  const row = (id) =>
    panel.getByRole('listitem').filter({
      has: page.getByText(
        `전공 탐색 진단 #${id}`,
        { exact: true },
      ),
    });

  const visitMyPage = async () => {
    await page.goto(`${base}/mypage`);

    await panel
      .getByRole('heading', {
        name: '전공 탐색 진단 이력',
      })
      .waitFor();
  };

  const check = async (name, callback) => {
    await callback();

    results.push({
      name,
      passed: true,
    });

    console.log('PASS', name);
  };

  try {
    await check(
      '탐색 진단 이력만 표시',
      async () => {
        await visitMyPage();
        await row(11).waitFor();

        assert.equal(
          await panel.getByRole('listitem').count(),
          5,
        );

        assert.equal(
          await panel.getByText(/이전 방식 진단/).count(),
          0,
        );

        assert.equal(
          await panel.getByRole('button', {
            name: /진단 삭제/,
          }).count(),
          0,
        );
      },
    );

    await check(
      '이력 페이지네이션에서도 탐색형 필터 유지',
      async () => {
        await panel.getByRole('button', {
          name: '이력 더 보기',
        }).click();

        await row(19).waitFor();

        assert.equal(
          await panel.getByRole('listitem').count(),
          7,
        );

        assert.equal(
          await panel.getByText(/이전 방식 진단/).count(),
          0,
        );
      },
    );

    await check(
      '더 보기 오류 후 재시도',
      async () => {
        await visitMyPage();
        await row(11).waitFor();

        failMore = true;

        await panel.getByRole('button', {
          name: '이력 더 보기',
        }).click();

        await panel.getByRole('alert').waitFor();

        await panel.getByRole('button', {
          name: '더 보기 다시 시도',
        }).click();

        await row(20).waitFor();

        assert.equal(
          await panel.getByRole('listitem').count(),
          7,
        );
      },
    );

    await check(
      '탐색 진단 결과 보기 유지',
      async () => {
        await row(11).getByRole('button', {
          name: '결과 보기',
        }).click();

        await page.waitForURL(
          '**/analysis/exploration/11',
        );
      },
    );

    await check(
      '기존 결과 주소는 탐색 결과로 이동',
      async () => {
        await page.goto(
          `${base}/analysis/dashboard?view=legacy&resultId=99999`,
        );

        await page.waitForURL(
          '**/analysis/exploration/11',
        );

        assert.equal(
          requests.some((item) =>
            item.path.startsWith('/api/results'),
          ),
          false,
        );
      },
    );

    await check(
      '기존 공유 링크는 제공 종료 안내',
      async () => {
        await page.goto(
          `${base}/results/share/old-share-token`,
        );

        await page.getByRole('heading', {
          name: /공유 결과는 더 이상 제공하지 않습니다/,
        }).waitFor();

        assert.equal(
          requests.some((item) =>
            item.path.includes('/api/results/share/'),
          ),
          false,
        );
      },
    );

    for (const failureMode of [
      'error',
      'unavailable',
      'not-found',
    ]) {
      await check(
        `${failureMode} 오류에서 기존 이력으로 대체하지 않음`,
        async () => {
          mode = failureMode;
          const before = requests.length;

          await visitMyPage();

          await panel.getByRole('alert').waitFor();

          const newRequests = requests.slice(before);

          assert.equal(
            newRequests.some((item) =>
              item.path.startsWith(
                '/api/diagnoses/sessions',
              ),
            ),
            false,
          );

          assert.equal(
            await panel.getByRole('listitem').count(),
            0,
          );
        },
      );
    }

    await check(
      '이력 조회 실패에서 정상 복구',
      async () => {
        mode = 'normal';

        await panel.getByRole('button', {
          name: '다시 불러오기',
        }).click();

        await row(11).waitFor();
      },
    );

    await check(
      '탐색 이력이 없으면 새 진단 안내',
      async () => {
        mode = 'empty';

        await visitMyPage();

        await panel.getByText(
          '탐색 진단 기록이 없습니다.',
        ).waitFor();

        await panel.getByRole('button', {
          name: '탐색 진단 시작하기',
        }).waitFor();
      },
    );

    await check(
      '데스크톱 및 모바일 화면 확인',
      async () => {
        mode = 'normal';

        for (const width of [1365, 390, 320]) {
          await page.setViewportSize({
            width,
            height: 844,
          });

          await visitMyPage();
          await row(11).waitFor();

          assert.equal(
            await page.evaluate(() =>
              document.documentElement.scrollWidth <=
              window.innerWidth,
            ),
            true,
          );

          await page.screenshot({
            path: path.join(
              output,
              `exploration-history-${width}.png`,
            ),
            fullPage: true,
          });
        }
      },
    );

    fs.writeFileSync(
      path.join(output, 'history-report.json'),
      JSON.stringify(
        { results, requests },
        null,
        2,
      ),
    );

    console.log(
      JSON.stringify(
        {
          passed: results.length,
          results,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await page.screenshot({
      path: path.join(
        output,
        'history-failure.png',
      ),
      fullPage: true,
    });

    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});