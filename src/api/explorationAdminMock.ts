import type {
  CatalogAction,
  CatalogActivation,
  CatalogActivityContent,
  CatalogActivityDetail,
  CatalogActivitySummary,
  CatalogActivationRequest,
  CatalogArchiveRequest,
  CatalogContentStatus,
  CatalogDetail,
  CatalogQuestion,
  CatalogReview,
  CatalogReviewKind,
  CatalogReviewRequest,
  CatalogReviewTargetType,
  CatalogSummary,
  CatalogTargetType,
} from '../types/explorationAdmin';

// v3: 활동 카탈로그에 활동 목록이 생겼다. 이전 저장본에는 활동이 없어 키를 올린다
const STORAGE_KEY = 'jinroon.exploration.adminMock.v3';
const CURRENT_ADMIN_ID = 1;

interface MockCatalog extends Omit<
  CatalogSummary,
  'allowedActions' | 'blockedReasons'
> {
  reviews: CatalogReview[];
  activations: CatalogActivation[];
  questions: CatalogQuestion[];
  activities?: MockActivity[];
}

interface MockActivity extends Omit<CatalogActivitySummary, 'contentStatus' | 'implementationReviewStatus' | 'domainReviewStatus'> {
  contentStatus: CatalogContentStatus;
  implementationReviewStatus: string | null;
  domainReviewStatus: string | null;
  content: CatalogActivityContent;
  reviews: CatalogReview[];
}

// 검토 기록을 받을 수 있는 대상(카탈로그 또는 활동 한 건)의 공통 모양
type Reviewable = Pick<
  MockCatalog,
  'version' | 'contentHash' | 'contentStatus' | 'implementationReviewStatus' | 'domainReviewStatus' | 'reviews'
>;

const QUESTIONS: CatalogQuestion[] = [
  {
    questionId: 'MOCK-S1-01',
    questionVersion: '1.0',
    stage: 'STAGE_1',
    moduleCode: 'INTEREST_SCREEN',
    metricCode: 'INT_BIO',
    text: '생물이 자라고 변하는 과정을 알아보는 일에 관심이 간다.',
    contentStatus: 'ACTIVE',
    implementationReviewStatus: 'APPROVED_FOR_IMPLEMENTATION',
    domainReviewStatus: 'APPROVED',
  },
  {
    questionId: 'MOCK-S1-02',
    questionVersion: '1.0',
    stage: 'STAGE_1',
    moduleCode: 'INTEREST_SCREEN',
    metricCode: 'INT_DAT',
    text: '숫자나 자료에서 규칙을 찾아보는 일이 흥미롭다.',
    contentStatus: 'ACTIVE',
    implementationReviewStatus: 'APPROVED_FOR_IMPLEMENTATION',
    domainReviewStatus: 'APPROVED',
  },
  {
    questionId: 'MOCK-S1-03',
    questionVersion: '1.0',
    stage: 'STAGE_1',
    moduleCode: 'INTEREST_SCREEN',
    metricCode: 'INT_SOC',
    text: '사람들이 왜 그렇게 행동하는지 이야기 나누는 것이 재미있다.',
    contentStatus: 'ACTIVE',
    implementationReviewStatus: 'APPROVED_FOR_IMPLEMENTATION',
    domainReviewStatus: 'APPROVED',
  },
  {
    questionId: 'MOCK-S1-04',
    questionVersion: '1.0',
    stage: 'STAGE_1',
    moduleCode: 'INTEREST_CONFIRM',
    metricCode: 'INT_VISUAL',
    text: '그림이나 영상처럼 눈에 보이는 결과물을 만드는 일에 끌린다.',
    contentStatus: 'ACTIVE',
    implementationReviewStatus: 'APPROVED_FOR_IMPLEMENTATION',
    domainReviewStatus: 'APPROVED',
  },
];

let nextReviewId = 1000;
let nextActivationId = 1000;

const makeReview = (
  reviewId: number,
  version: string,
  hash: string,
  reviewKind: CatalogReviewKind,
  decision: string,
): CatalogReview => ({
  reviewId,
  reviewKind,
  decision,
  scope:
    reviewKind === 'RELEASE'
      ? 'PUBLIC'
      : reviewKind === 'PILOT'
        ? 'PILOT'
        : 'DEV',
  reviewerId: 2,
  reviewedAt: '2026-11-10T03:00:00',
  targetVersion: version,
  targetHash: hash,
  matchesCurrentContent: true,
  evidenceReference: 'MOCK_REVIEW_REFERENCE',
});

const makeActivation = (
  activationId: number,
  targetType: CatalogTargetType,
  targetId: number,
  version: string,
  hash: string,
  action: string,
  scope: string | null,
  relatedTargetId: number | null,
  reason: string,
): CatalogActivation => ({
  activationId,
  action,
  targetType,
  targetId,
  targetVersion: version,
  targetHash: hash,
  scope,
  actorId: 2,
  relatedTargetId,
  reviewIds: [],
  reason,
  createdAt: '2026-11-10T03:00:00',
});

const makeMockCatalog = (
  targetType: CatalogTargetType,
  targetId: number,
  catalogType: string,
  version: string,
  contentStatus: CatalogContentStatus,
  contentHash: string,
  itemCount: number | null,
  createdAt: string,
  usedByRuntime: boolean,
): MockCatalog => {
  const approved = contentStatus !== 'DRAFT';

  const implementationReviewStatus = approved
    ? 'APPROVED_FOR_IMPLEMENTATION'
    : null;

  const domainReviewStatus = approved
    ? targetType === 'ACTIVITY_CATALOG'
      ? 'NOT_APPLICABLE'
      : 'APPROVED'
    : null;

  const reviews: CatalogReview[] = [];

  if (approved) {
    reviews.push(
      makeReview(
        targetId * 100 + 1,
        version,
        contentHash,
        'IMPLEMENTATION',
        'APPROVED_FOR_IMPLEMENTATION',
      ),
    );

    if (domainReviewStatus === 'APPROVED') {
      reviews.push(
        makeReview(
          targetId * 100 + 2,
          version,
          contentHash,
          'DOMAIN',
          'APPROVED',
        ),
      );
    }
  }

  const activations: CatalogActivation[] = [];

  if (contentStatus === 'ACTIVE') {
    activations.push(
      makeActivation(
        nextActivationId++,
        targetType,
        targetId,
        version,
        contentHash,
        'ACTIVATE',
        'DEV',
        null,
        'MOCK_ACTIVATION',
      ),
    );
  }

  if (contentStatus === 'ARCHIVED') {
    activations.push(
      makeActivation(
        nextActivationId++,
        targetType,
        targetId,
        version,
        contentHash,
        'ACTIVATE',
        'DEV',
        null,
        'MOCK_ACTIVATION',
      ),
      makeActivation(
        nextActivationId++,
        targetType,
        targetId,
        version,
        contentHash,
        'ARCHIVE',
        null,
        null,
        'MOCK_ARCHIVE',
      ),
    );
  }

  return {
    targetType,
    targetId,
    catalogType,
    version,
    contentStatus,
    implementationReviewStatus,
    domainReviewStatus,
    contentHash,
    itemCount,
    createdAt,
    usedByRuntime,
    reviews,
    activations,
    questions:
      targetType === 'CATALOG' &&
      catalogType === 'QUESTION_CATALOG'
        ? QUESTIONS
        : [],
  };
};

const makeMockActivity = (
  targetId: number,
  activityCode: string,
  majorCode: string | null,
  majorName: string | null,
  title: string,
  kind: string,
  approved: boolean,
): MockActivity => {
  const version = '0.2.0';
  const contentHash = `mock${targetId.toString(16).padStart(8, '0')}`;
  return {
    targetType: 'ACTIVITY',
    targetId,
    activityCode,
    version,
    majorCode,
    title,
    kind,
    contentHash,
    contentStatus: approved ? 'REVIEWED' : 'DRAFT',
    implementationReviewStatus: approved ? 'APPROVED_FOR_IMPLEMENTATION' : 'PENDING',
    domainReviewStatus: approved ? 'APPROVED' : 'PENDING',
    content: {
      activity_id: activityCode,
      version,
      title,
      kind,
      major_code: majorCode,
      major_name: majorName ?? undefined,
      steps: ['공식 소개 자료 확인', '확인한 사실과 궁금한 점 나누기', '더 알아볼 질문 2개 적기'],
      artifacts: ['확인표', '질문 2개'],
      alternative: '인터넷이 어려우면 활동지의 자료로 질문만 작성한다.',
      allowed_use: 'AUTHORING_REVIEW_ONLY',
      score_effect: 'NONE',
      requirements: { materials: ['종이 또는 메모 도구'], paid_tools: false, external_account: false, coding_experience: false },
      sources: [
        {
          source_id: 'SRC-MOCK-01',
          title: 'Mock 공식 교과과정',
          url: 'https://example.com/courses',
          publisher: 'Mock 대학교',
          role: 'MAJOR_CONNECTION_EVIDENCE',
          checked_on: '2026-11-14',
          verified_claim: '관련 과목이 공식 목록에 있음',
        },
      ],
      body_markdown: `## ${activityCode} — ${title}\n\nMock 활동 본문입니다. 실제 본문은 백엔드 활동 카탈로그에서 옵니다.`,
    },
    reviews: approved
      ? [
          makeReview(targetId * 100 + 1, version, contentHash, 'IMPLEMENTATION', 'APPROVED_FOR_IMPLEMENTATION'),
          makeReview(targetId * 100 + 2, version, contentHash, 'DOMAIN', 'APPROVED'),
        ]
      : [],
  };
};

const MOCK_ACTIVITY_ROWS: [string, string | null, string | null, string, string][] = [
  ['DRAFT-CS-01', 'MAJOR_ROW_133', '컴퓨터공학과', '학과에서 배우는 세 가지 주제 확인하기', 'INFORMATION'],
  ['DRAFT-CS-02', 'MAJOR_ROW_133', '컴퓨터공학과', '도서 예약 규칙을 작은 시스템으로 설계하기', 'SMALL_TASK'],
  ['DRAFT-BIO-01', 'MAJOR_ROW_045', '생명과학과', '관찰 기록을 돌아보고 다음 활동 정하기', 'REFLECTION_AND_NEXT_STEP'],
  ['GENERAL-01', null, null, '관심 전공의 공식 소개 글 비교하기', 'INFORMATION'],
];

const mockActivities = (catalogId: number, approved: boolean) =>
  MOCK_ACTIVITY_ROWS.map(([code, majorCode, majorName, title, kind], index) =>
    makeMockActivity(catalogId * 100 + index + 1, code, majorCode, majorName, title, kind, approved && index !== 2),
  );

const SEED: MockCatalog[] = [
  makeMockCatalog(
    'CATALOG',
    1,
    'QUESTION_CATALOG',
    'MOCK_QUESTION_CATALOG_V1_0',
    'ARCHIVED',
    'a1f3c9e2b7d4',
    12,
    '2026-10-01T03:00:00',
    false,
  ),
  makeMockCatalog(
    'CATALOG',
    2,
    'QUESTION_CATALOG',
    'MOCK_QUESTION_CATALOG_V1_1',
    'ACTIVE',
    'b2e4d8f1a6c3',
    12,
    '2026-10-20T03:00:00',
    true,
  ),
  makeMockCatalog(
    'CATALOG',
    3,
    'QUESTION_CATALOG',
    'MOCK_QUESTION_CATALOG_V1_2',
    'DRAFT',
    'c3a7e1b9d2f5',
    12,
    '2026-11-10T03:00:00',
    false,
  ),
  makeMockCatalog(
    'CATALOG',
    4,
    'OPTION_CATALOG',
    'MOCK_OPTION_CATALOG_V1_0',
    'ACTIVE',
    'd4b8f2c6e1a9',
    62,
    '2026-10-01T03:00:00',
    true,
  ),
  makeMockCatalog(
    'CATALOG',
    5,
    'MAJOR_MAPPING',
    'MOCK_MAJOR_MAPPING_V1_0',
    'ACTIVE',
    'e5c9a3d7f2b6',
    94,
    '2026-10-01T03:00:00',
    true,
  ),
  makeMockCatalog(
    'RULESET',
    1,
    'RULESET',
    'MOCK_RULESET_V1_1',
    'ACTIVE',
    'f6d1b4e8a3c7',
    null,
    '2026-10-01T03:00:00',
    true,
  ),
  makeMockCatalog(
    'RULESET',
    2,
    'RULESET',
    'MOCK_RULESET_V1_2',
    'REVIEWED',
    'a7e2c5f9b1d4',
    null,
    '2026-11-08T03:00:00',
    false,
  ),
  {
    ...makeMockCatalog(
      'ACTIVITY_CATALOG',
      1,
      'ACTIVITY_CATALOG',
      'MOCK_ACTIVITY_V1_0',
      'ACTIVE',
      'b8f3d6a1c4e9',
      MOCK_ACTIVITY_ROWS.length,
      '2026-10-01T03:00:00',
      true,
    ),
    activities: mockActivities(1, true),
  },
  {
    ...makeMockCatalog(
      'ACTIVITY_CATALOG',
      2,
      'ACTIVITY_CATALOG',
      'MOCK_ACTIVITY_V1_1',
      'DRAFT',
      'c9a4e7b2d5f8',
      MOCK_ACTIVITY_ROWS.length,
      '2026-11-10T03:00:00',
      false,
    ),
    activities: mockActivities(2, false),
  },
];

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const load = (): MockCatalog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed as MockCatalog[];
      }
    }
  } catch {
    // 저장소 접근이 불가능하면 기본 샘플 사용
  }

  return clone(SEED);
};

const save = (list: MockCatalog[]) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list),
    );
  } catch {
    // Mock 환경의 저장 실패는 무시
  }
};

const fail = (status: number, code: string) => ({
  response: {
    status,
    data: { code },
  },
});

const delay = <T,>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    }, 250);
  });

const findCatalog = (
  list: MockCatalog[],
  targetType: CatalogTargetType,
  targetId: number,
) => {
  const catalog = list.find(
    (item) =>
      item.targetType === targetType &&
      item.targetId === targetId,
  );

  if (!catalog) {
    throw fail(404, 'NOT_FOUND');
  }

  return catalog;
};

const latestReview = (
  catalog: Reviewable,
  kind: CatalogReviewKind,
) =>
  [...catalog.reviews]
    .filter((review) => review.reviewKind === kind)
    .sort(
      (a, b) =>
        new Date(b.reviewedAt).getTime() -
        new Date(a.reviewedAt).getTime(),
    )[0];

// 개발 단계 승인 여부 확인
const developmentApproved = (
  catalog: Reviewable,
) =>
  catalog.implementationReviewStatus ===
    'APPROVED_FOR_IMPLEMENTATION' &&
  ['APPROVED', 'NOT_APPLICABLE'].includes(
    catalog.domainReviewStatus ?? '',
  );

const requiredKinds = (
  catalog: MockCatalog,
  scope: string,
): CatalogReviewKind[] => {
  const kinds: CatalogReviewKind[] = [
    'IMPLEMENTATION',
  ];

  if (
    catalog.domainReviewStatus !== 'NOT_APPLICABLE'
  ) {
    kinds.push('DOMAIN');
  }

  if (scope === 'PILOT' || scope === 'PUBLIC') {
    kinds.push('PILOT');
  }

  if (scope === 'PUBLIC') {
    kinds.push('RELEASE');
  }

  return kinds;
};

const approvalBlocker = (
  catalog: MockCatalog,
  scope: string,
): string | null => {
  for (const kind of requiredKinds(catalog, scope)) {
    const review = latestReview(catalog, kind);

    const expectedDecision =
      kind === 'IMPLEMENTATION'
        ? 'APPROVED_FOR_IMPLEMENTATION'
        : 'APPROVED';

    if (
      !review ||
      review.decision !== expectedDecision ||
      !review.matchesCurrentContent
    ) {
      return 'CATALOG_APPROVAL_MISSING';
    }

    if (review.reviewerId === CURRENT_ADMIN_ID) {
      return 'CATALOG_SELF_APPROVAL';
    }
  }

  return null;
};

const sameSlot = (
  a: MockCatalog,
  b: MockCatalog,
) =>
  a.targetType === b.targetType &&
  (
    a.targetType !== 'CATALOG' ||
    a.catalogType === b.catalogType
  );

const activationBlocker = (
  catalog: MockCatalog,
  list: MockCatalog[],
  scope: string,
): string | null => {
  if (catalog.contentStatus !== 'REVIEWED') {
    return 'CATALOG_ACTIVATION_NOT_ALLOWED';
  }

  const approvalError = approvalBlocker(
    catalog,
    scope,
  );

  if (approvalError) return approvalError;

  const previousActive = list.filter(
    (item) =>
      item.targetType === catalog.targetType &&
      item.contentStatus === 'ACTIVE' &&
      sameSlot(item, catalog),
  );

  if (
    previousActive.some(
      (item) => item.usedByRuntime,
    )
  ) {
    return 'CATALOG_IN_USE';
  }

  return null;
};

const archiveBlocker = (
  catalog: MockCatalog,
): string | null => {
  if (catalog.contentStatus === 'ARCHIVED') {
    return 'CATALOG_ALREADY_ARCHIVED';
  }

  if (
    catalog.targetType !== 'ACTIVITY_CATALOG' &&
    catalog.usedByRuntime
  ) {
    return 'CATALOG_IN_USE';
  }

  return null;
};

const toSummary = (
  catalog: MockCatalog,
  list: MockCatalog[],
): CatalogSummary => {
  const allowedActions: CatalogAction[] = [];

  const blockedReasons: CatalogSummary['blockedReasons'] = {};

  if (catalog.contentStatus === 'ARCHIVED') {
    blockedReasons.REVIEW =
      'CATALOG_REVIEW_ARCHIVED';
  } else {
    allowedActions.push('REVIEW');
  }

  const activateError = activationBlocker(
    catalog,
    list,
    'DEV',
  );

  if (activateError) {
    blockedReasons.ACTIVATE = activateError;
  } else {
    allowedActions.push('ACTIVATE');
  }

  const archiveError = archiveBlocker(catalog);

  if (archiveError) {
    blockedReasons.ARCHIVE = archiveError;
  } else {
    allowedActions.push('ARCHIVE');
  }

  return {
    targetType: catalog.targetType,
    targetId: catalog.targetId,
    catalogType: catalog.catalogType,
    version: catalog.version,
    contentStatus: catalog.contentStatus,
    implementationReviewStatus:
      catalog.implementationReviewStatus,
    domainReviewStatus:
      catalog.domainReviewStatus,
    contentHash: catalog.contentHash,
    itemCount: catalog.itemCount,
    createdAt: catalog.createdAt,
    usedByRuntime: catalog.usedByRuntime,
    allowedActions,
    blockedReasons,
  };
};

const toTarget = (catalog: Reviewable & { targetType: CatalogReviewTargetType; targetId: number }) => ({
  targetType: catalog.targetType,
  targetId: catalog.targetId,
  version: catalog.version,
  contentHash: catalog.contentHash,
  contentStatus: catalog.contentStatus,
  implementationReviewStatus:
    catalog.implementationReviewStatus,
  domainReviewStatus:
    catalog.domainReviewStatus,
});

const createActivation = (
  catalog: MockCatalog,
  action: string,
  scope: string | null,
  relatedTargetId: number | null,
  reason: string,
): CatalogActivation => ({
  activationId: nextActivationId++,
  action,
  targetType: catalog.targetType,
  targetId: catalog.targetId,
  targetVersion: catalog.version,
  targetHash: catalog.contentHash,
  scope,
  actorId: CURRENT_ADMIN_ID,
  relatedTargetId,
  reviewIds: [],
  reason,
  createdAt: new Date().toISOString(),
});

// 목록 조회
export const listCatalogs = () =>
  delay((): CatalogSummary[] => {
    const list = load();

    return list.map((catalog) =>
      toSummary(catalog, list),
    );
  });

// 상세 조회
export const getCatalog = (
  targetType: CatalogTargetType,
  targetId: number,
) =>
  delay((): CatalogDetail => {
    const list = load();

    const catalog = findCatalog(
      list,
      targetType,
      targetId,
    );

    return {
      catalog: toSummary(catalog, list),
      reviews: catalog.reviews,
      activations: catalog.activations,
      questions: catalog.questions,
    };
  });

const findActivity = (list: MockCatalog[], activityId: number) => {
  for (const catalog of list) {
    const activity = catalog.activities?.find((item) => item.targetId === activityId);
    if (activity) return { catalog, activity };
  }
  throw fail(404, 'NOT_FOUND');
};

const toActivitySummary = (activity: MockActivity): CatalogActivitySummary => ({
  targetType: 'ACTIVITY',
  targetId: activity.targetId,
  activityCode: activity.activityCode,
  version: activity.version,
  majorCode: activity.majorCode,
  title: activity.title,
  kind: activity.kind,
  contentHash: activity.contentHash,
  contentStatus: activity.contentStatus,
  implementationReviewStatus: activity.implementationReviewStatus ?? 'PENDING',
  domainReviewStatus: activity.domainReviewStatus ?? 'PENDING',
});

// 활동 목록 (백엔드처럼 activity_code 순)
export const listActivities = (catalogId: number) =>
  delay((): CatalogActivitySummary[] => {
    const catalog = findCatalog(load(), 'ACTIVITY_CATALOG', catalogId);
    return [...(catalog.activities ?? [])]
      .sort((a, b) => a.activityCode.localeCompare(b.activityCode) || a.targetId - b.targetId)
      .map(toActivitySummary);
  });

// 활동 상세
export const getActivity = (catalogId: number, activityId: number) =>
  delay((): CatalogActivityDetail => {
    const catalog = findCatalog(load(), 'ACTIVITY_CATALOG', catalogId);
    const activity = catalog.activities?.find((item) => item.targetId === activityId);
    if (!activity) throw fail(404, 'NOT_FOUND');
    return { activity: toActivitySummary(activity), content: activity.content, reviews: activity.reviews };
  });

// 검토 기록 (카탈로그 또는 활동 한 건)
export const review = (
  request: CatalogReviewRequest,
) =>
  delay(() => {
    const list = load();

    const catalog: Reviewable & { targetType: CatalogReviewTargetType; targetId: number } =
      request.targetType === 'ACTIVITY'
        ? findActivity(list, request.targetId).activity
        : findCatalog(list, request.targetType, request.targetId);

    if (!request.evidenceReference.trim()) {
      throw fail(400, 'INVALID_INPUT');
    }

    if (catalog.contentStatus === 'ARCHIVED') {
      throw fail(422, 'CATALOG_REVIEW_ARCHIVED');
    }

    // PILOT / RELEASE 검토는
    // 개발 단계 승인이 완료된 자료만 허용
    if (
      request.reviewKind !== 'IMPLEMENTATION' &&
      request.reviewKind !== 'DOMAIN'
    ) {
      if (
        !['REVIEWED', 'ACTIVE'].includes(
          catalog.contentStatus,
        ) ||
        !developmentApproved(catalog)
      ) {
        throw fail(
          422,
          'CATALOG_REVIEW_PREREQUISITE',
        );
      }
    }

    const scope =
      request.reviewKind === 'RELEASE'
        ? 'PUBLIC'
        : request.reviewKind === 'PILOT'
          ? 'PILOT'
          : 'DEV';

    const decisionValue =
      request.reviewKind === 'IMPLEMENTATION' &&
      request.decision === 'APPROVED'
        ? 'APPROVED_FOR_IMPLEMENTATION'
        : request.decision;

    const reviewRecord: CatalogReview = {
      reviewId: nextReviewId++,
      reviewKind: request.reviewKind,
      decision: decisionValue,
      scope,
      reviewerId: CURRENT_ADMIN_ID,
      reviewedAt: new Date().toISOString(),
      targetVersion: catalog.version,
      targetHash: catalog.contentHash,
      matchesCurrentContent: true,
      evidenceReference:
        request.evidenceReference.trim(),
    };

    catalog.reviews.unshift(reviewRecord);

    if (request.reviewKind === 'IMPLEMENTATION') {
      catalog.implementationReviewStatus =
        decisionValue;
    }

    if (request.reviewKind === 'DOMAIN') {
      catalog.domainReviewStatus =
        decisionValue;
    }

    const developmentIsApproved =
      developmentApproved(catalog);

    if (
      catalog.contentStatus === 'DRAFT' &&
      developmentIsApproved
    ) {
      catalog.contentStatus = 'REVIEWED';
    } else if (
      catalog.contentStatus === 'REVIEWED' &&
      (
        catalog.implementationReviewStatus ===
          'REJECTED' ||
        catalog.domainReviewStatus === 'REJECTED'
      )
    ) {
      catalog.contentStatus = 'DRAFT';
    }

    save(list);

    return {
      review: reviewRecord,
      target: toTarget(catalog),
    };
  });

// 활성화
export const activate = (
  request: CatalogActivationRequest,
) =>
  delay(() => {
    const list = load();

    const catalog = findCatalog(
      list,
      request.targetType,
      request.targetId,
    );

    if (!request.reason.trim()) {
      throw fail(400, 'INVALID_INPUT');
    }

    const blocker = activationBlocker(
      catalog,
      list,
      request.scope,
    );

    if (blocker) {
      throw fail(422, blocker);
    }

    const archived: ReturnType<typeof toTarget>[] = [];

    const previousActive = list.filter(
      (item) =>
        item.targetType === catalog.targetType &&
        item.contentStatus === 'ACTIVE' &&
        sameSlot(item, catalog),
    );

    previousActive.forEach((item) => {
      item.contentStatus = 'ARCHIVED';

      item.activations.unshift(
        createActivation(
          item,
          'ARCHIVE',
          null,
          catalog.targetId,
          `새 활성 대상으로 교체: ${request.reason}`,
        ),
      );

      archived.push(toTarget(item));
    });

    catalog.contentStatus = 'ACTIVE';

    const activation = createActivation(
      catalog,
      'ACTIVATE',
      request.scope,
      previousActive[0]?.targetId ?? null,
      request.reason.trim(),
    );

    catalog.activations.unshift(activation);

    save(list);

    return {
      activation,
      target: toTarget(catalog),
      archived,
    };
  });

// 보관
export const archive = (
  request: CatalogArchiveRequest,
) =>
  delay(() => {
    const list = load();

    const catalog = findCatalog(
      list,
      request.targetType,
      request.targetId,
    );

    if (!request.reason.trim()) {
      throw fail(400, 'INVALID_INPUT');
    }

    const blocker = archiveBlocker(catalog);

    if (blocker) {
      throw fail(422, blocker);
    }

    catalog.contentStatus = 'ARCHIVED';

    const activation = createActivation(
      catalog,
      'ARCHIVE',
      null,
      null,
      request.reason.trim(),
    );

    catalog.activations.unshift(activation);

    save(list);

    return {
      activation,
      target: toTarget(catalog),
      archived: [],
    };
  });
