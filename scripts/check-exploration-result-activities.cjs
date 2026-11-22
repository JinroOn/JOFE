const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fixture = require('./fixtures/exploration-comparison.cjs');

const base =
  process.env.EXPLORATION_RESULT_UI_BASE_URL ||
  'http://127.0.0.1:5175';

if (
  !['localhost', '127.0.0.1'].includes(
    new URL(base).hostname,
  )
) {
  throw new Error(
    '로컬 테스트 서버에서만 실행할 수 있습니다.',
  );
}

const sessionId = 21;
const resultId = 34;

const backendActivities = [
  {
    activity_id: 'TEST-INFORMATION',
    version: 'V1',
    major_code: null,
    title: '학과 교육과정 살펴보기',
    kind: 'INFORMATION',
    body_markdown:
      '관심 있는 학과의 교육과정을 확인합니다.',
    steps: [
      '학과 홈페이지 찾기',
      '교육과정 확인하기',
    ],
    artifacts: ['관심 과목 목록'],
    example_output: '관심 과목 3개',
    worksheet_markdown: '',
    alternative: '',
    duration_minutes_proposal: 20,
    requirements: {},
    sources: [],
  },
  {
    activity_id: 'TEST-SMALL-TASK',
    version: 'V1',
    major_code: null,
    title: '작은 전공 체험 활동',
    kind: 'SMALL_TASK',
    body_markdown:
      '전공 관련 활동을 간단히 체험합니다.',
    steps: [
      '자료 준비하기',
      '활동 진행하기',
    ],
    artifacts: ['활동 기록'],
    example_output: '활동 결과 메모',
    worksheet_markdown: '',
    alternative: '',
    duration_minutes_proposal: 30,
    requirements: {},
    sources: [],
  },
  {
    activity_id: 'TEST-REFLECTION',
    version: 'V1',
    major_code: null,
    title: '활동을 돌아보고 다음 단계 정하기',
    kind: 'REFLECTION_AND_NEXT_STEP',
    body_markdown:
      '활동 경험을 정리하고 다음 단계를 정합니다.',
    steps: [
      '경험 정리하기',
      '다음 활동 정하기',
    ],
    artifacts: ['다음 활동 계획'],
    example_output: '다음 주 활동 계획',
    worksheet_markdown: '',
    alternative: '',
    duration_minutes_proposal: null,
    requirements: {},
    sources: [],
  },
];

const legacyActivities = [
  {
    activityCode: 'MOCK-INFO',
    kind: 'INFO_CHECK',
    title: '기존 모의 정보 확인 활동',
    description: '학과 정보를 찾아봅니다.',
    duration: '15~30분',
    outcome: '학과 소개 정리',
    exampleOutput: '',
    tags: [],
  },
  {
    activityCode: 'MOCK-HANDS',
    kind: 'HANDS_ON',
    title: '기존 모의 체험 활동',
    description: '간단한 활동을 진행합니다.',
    duration: '1~2시간',
    outcome: '활동 기록',
    exampleOutput: '',
    tags: [],
  },
  {
    activityCode: 'MOCK-COMPARE',
    kind: 'COMPARE_ASK',
    title: '기존 모의 비교 활동',
    description: '두 학과의 차이를 비교합니다.',
    duration: '30분',
    outcome: '비교 기록',
    exampleOutput: '',
    tags: [],
  },
];

const createResult = (
  majorName,
  activities,
) => ({
  ...fixture.displayResult,

  majors: fixture.displayResult.majors.map(
    (major, index) =>
      index === 0
        ? {
            ...major,
            name: majorName,
            majorName,
          }
        : major,
  ),

  nextActivities: activities,
  activityAvailability: 'AVAILABLE',
  activityMessage: '',

  capabilities: {
    ...fixture.displayResult.capabilities,
    sharingAvailable: false,
    consultationAvailable: false,
  },
});

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

  const pageErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  // 기존 인증 테스트 상태 유지
  await page.addInitScript(() => {
    localStorage.setItem(
      'auth',
      JSON.stringify({
        state: {
          user: {
            id: 1,
            email: 'result-test@example.test',
            nickname: '결과 화면 테스트',
            role: 'member',
          },
          accessToken: 'ui-test-token',
          refreshToken: 'ui-test-refresh',
          isLoggedIn: true,
        },
        version: 0,
      }),
    );
  });

  let currentResult = createResult(
    '소프트웨어학과',
    backendActivities,
  );

  // 수정:
  // /api/로 시작하는 요청만 테스트 응답으로 가로챕니다.
  // /src/api/*.ts 모듈 요청은 가로채지 않습니다.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const url = new URL(
        route.request().url(),
      );

      if (
        url.pathname ===
        `/api/exploration/v1/sessions/${sessionId}/result`
      ) {
        return route.fulfill({
          json: currentResult,
        });
      }

      if (
        url.pathname ===
        `/api/exploration/v1/results/${resultId}/activities`
      ) {
        return route.fulfill({
          json: {
            resultId,
            supportRevision: null,
            activityAvailability: 'AVAILABLE',
            activityMessage: '',
            nextActivities:
              currentResult.nextActivities.filter(
                (activity) =>
                  typeof activity.activity_id ===
                  'string',
              ),
          },
        });
      }

      if (
        url.pathname ===
        `/api/exploration/v1/results/${resultId}/candidates`
      ) {
        return route.fulfill({
          json: {
            resultId,
            additionalCount: 0,
            groups: [],
            items: [],
            basisGroups: [],
          },
        });
      }

      if (
        url.pathname ===
        `/api/exploration/v1/results/${resultId}/support`
      ) {
        return route.fulfill({
          json: {
            resultId,
            initialized: false,
            supportRevision: 0,
            purpose: null,
            targetMajorCode: null,
            allowedPurposes: [
              'ACTIVITY',
              'PLAN',
              'BOTH',
            ],
            issued: [],
          },
        });
      }

      return route.fulfill({
        status: 404,
        json: {
          code: 'NOT_FOUND',
        },
      });
    },
  );

  const resultUrl =
    `${base}/analysis/exploration/${sessionId}`;

  const openResult = async () => {
    await page.goto(resultUrl);

    await page
      .getByRole('heading', {
        name: '먼저 탐색해볼 수 있는 전공이에요',
      })
      .waitFor();

    return page.locator(
      'section[aria-labelledby="activity-title"]',
    );
  };

  try {
    // 실제 백엔드 활동 형식으로 세 전공 테스트
    for (const majorName of [
      '문예창작학과',
      '소프트웨어학과',
      '물리학과',
    ]) {
      currentResult = createResult(
        majorName,
        backendActivities,
      );

      const section = await openResult();

      await page
        .getByText(majorName, {
          exact: true,
        })
        .first()
        .waitFor();

      assert.equal(
        await section.locator('li').count(),
        3,
      );

      const activityText =
        await section.innerText();

      assert.match(
        activityText,
        /정보 확인/,
      );

      assert.match(
        activityText,
        /작은 활동/,
      );

      assert.match(
        activityText,
        /돌아보기·다음 단계/,
      );

      assert.match(
        activityText,
        /약 20분/,
      );

      assert.match(
        activityText,
        /약 30분/,
      );

      // 마지막 활동의 소요 시간이 null이면 생략
      const thirdCard =
        await section
          .locator('li')
          .nth(2)
          .innerText();

      assert.doesNotMatch(
        thirdCard,
        /약 \d+분|null|undefined/,
      );

      await section
        .getByRole('button', {
          name: /활동 더 보기/,
        })
        .click();

      await page
        .getByRole('heading', {
          name: '탐색 활동',
          exact: true,
        })
        .waitFor();

      await page
        .getByRole('heading', {
          name: '학과 교육과정 살펴보기',
        })
        .waitFor();

      console.log(
        `PASS: ${majorName} / 후보 / 활동 3개 / 상세 이동`,
      );
    }

    // 기존 MOCK 활동 형식 호환성
    currentResult = createResult(
      '소프트웨어학과',
      legacyActivities,
    );

    let section = await openResult();
    let content = await section.innerText();

    assert.match(
      content,
      /기존 모의 정보 확인 활동/,
    );

    assert.match(
      content,
      /기존 모의 체험 활동/,
    );

    assert.match(
      content,
      /기존 모의 비교 활동/,
    );

    assert.match(
      content,
      /15~30분/,
    );

    assert.match(
      content,
      /1~2시간/,
    );

    console.log(
      'PASS: 기존 모의 응답 형식',
    );

    // 낯선 활동 유형과 소요 시간 없음
    currentResult = createResult(
      '물리학과',
      [
        {
          ...backendActivities[0],
          activity_id: 'UNKNOWN-KIND',
          kind: 'NEW_ACTIVITY_KIND',
          title: '새로운 유형의 탐색 활동',
          duration_minutes_proposal: null,
        },
      ],
    );

    section = await openResult();
    content = await section.innerText();

    assert.match(
      content,
      /탐색 활동/,
    );

    assert.match(
      content,
      /새로운 유형의 탐색 활동/,
    );

    assert.doesNotMatch(
      content,
      /약 \d+분/,
    );

    console.log(
      'PASS: 낯선 유형 및 시간 없음',
    );

    // 빈 활동 목록
    currentResult = createResult(
      '문예창작학과',
      [],
    );

    section = await openResult();

    await section
      .getByText(
        /지금 표시할 추천 활동이 없습니다/,
      )
      .waitFor();

    assert.equal(
      await section.locator('li').count(),
      0,
    );

    await section
      .getByRole('button', {
        name: /활동 더 보기/,
      })
      .click();

    await page
      .getByText(
        /현재 표시할 탐색 활동이 없습니다/,
      )
      .waitFor();

    console.log(
      'PASS: 빈 활동 목록 및 상세 이동',
    );

    // 브라우저 런타임 오류
    assert.deepEqual(
      pageErrors,
      [],
      `브라우저 오류: ${pageErrors.join(', ')}`,
    );

    console.log(
      'PASS: 브라우저 런타임 오류 없음',
    );

    console.log(
      '탐색 활동 결과 화면 테스트 완료',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});