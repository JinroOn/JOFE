// 관리자 카탈로그 화면 개발용 mock. 버전·문항은 임시 샘플이며 실제 187문항 카탈로그가 아니다.
// 현재 관리자를 'admin-a'로 가정해 본인이 작성한 DRAFT는 검토할 수 없게 흉내 낸다.
import type {
  CatalogAction,
  CatalogDetail,
  CatalogQuestion,
  CatalogStatus,
  CatalogSummary,
  CatalogType,
} from '../types/explorationAdmin';

const STORAGE_KEY = 'jinroon.exploration.adminMock.v1';
const CURRENT_ADMIN = 'admin-a';

interface MockCatalog {
  catalogId: number;
  catalogType: CatalogType;
  version: string;
  status: CatalogStatus;
  contentHash: string;
  author: string;
  reviewer: string | null;
  externalReviewStatus: CatalogSummary['externalReviewStatus'];
  createdAt: string;
  activatedAt: string | null;
  // 한 번이라도 ACTIVE였던 버전만 롤백 대상이 된다
  wasActive: boolean;
}

const QUESTIONS: CatalogQuestion[] = [
  { questionId: 'MOCK-S1-01', questionVersion: '1.0', stage: 'STAGE_1', moduleCode: 'INTEREST_SCREEN', metricCode: 'INT_BIO', text: '생물이 자라고 변하는 과정을 알아보는 일에 관심이 간다.', optionCount: 7 },
  { questionId: 'MOCK-S1-02', questionVersion: '1.0', stage: 'STAGE_1', moduleCode: 'INTEREST_SCREEN', metricCode: 'INT_DAT', text: '숫자나 자료에서 규칙을 찾아보는 일이 흥미롭다.', optionCount: 7 },
  { questionId: 'MOCK-S1-03', questionVersion: '1.0', stage: 'STAGE_1', moduleCode: 'INTEREST_SCREEN', metricCode: 'INT_SOC', text: '사람들이 왜 그렇게 행동하는지 이야기 나누는 것이 재미있다.', optionCount: 7 },
  { questionId: 'MOCK-S1-04', questionVersion: '1.0', stage: 'STAGE_1', moduleCode: 'INTEREST_CONFIRM', metricCode: 'INT_VISUAL', text: '그림·영상·디자인처럼 눈에 보이는 결과물을 만드는 일에 끌린다.', optionCount: 7 },
  { questionId: 'MOCK-S1-05', questionVersion: '1.0', stage: 'STAGE_1', moduleCode: 'ACTIVITY_BASE', metricCode: null, text: '직접 무언가를 만들거나 고쳐본 경험이 있다면, 그 과정이 즐거웠다.', optionCount: 7 },
  { questionId: 'MOCK-S1-06', questionVersion: '1.1', stage: 'STAGE_1', moduleCode: 'ACTIVITY_BASE', metricCode: null, text: '다른 사람에게 무언가를 설명하거나 가르쳐 본 시간이 즐거웠다.', optionCount: 7 },
  { questionId: 'MOCK-S2-01', questionVersion: '1.0', stage: 'STAGE_2', moduleCode: 'ACTIVITY_EXTEND', metricCode: null, text: '자료를 모아 정리하고 그 안에서 의미를 찾는 활동을 더 해보고 싶다.', optionCount: 7 },
  { questionId: 'MOCK-S2-02', questionVersion: '1.0', stage: 'STAGE_2', moduleCode: 'MAJOR_COMPARISON', metricCode: null, text: '다음 중 더 해보고 싶은 공부 방식에 가까운 것을 골라주세요.', optionCount: 4 },
  { questionId: 'MOCK-S2-03', questionVersion: '1.0', stage: 'STAGE_2', moduleCode: 'ACTIVITY_ENVIRONMENT_STYLE', metricCode: null, text: '혼자 깊이 파고드는 시간보다 여럿이 함께 만드는 시간이 더 잘 맞는다.', optionCount: 7 },
  { questionId: 'MOCK-S3-01', questionVersion: '1.0', stage: 'STAGE_3', moduleCode: 'CAUTION_CHECK', metricCode: null, text: '실험·실습 수업이 많은 환경도 괜찮을 것 같다.', optionCount: 7 },
  { questionId: 'MOCK-S3-02', questionVersion: '1.0', stage: 'STAGE_3', moduleCode: 'EXPLORATION_CONSTRAINT', metricCode: null, text: '탐색 활동에 쓸 수 있는 시간이 일주일에 2시간 이상 있다.', optionCount: 7 },
  { questionId: 'MOCK-PR-TIME', questionVersion: '1.0', stage: 'POST_RESULT', moduleCode: 'EXPLORATION_ACTIVITY', metricCode: null, text: '탐색 활동에 일주일에 쓸 수 있는 시간은 어느 정도인가요?', optionCount: 4 },
];

const SEED: MockCatalog[] = [
  { catalogId: 1, catalogType: 'QUESTION_CATALOG', version: 'MOCK_QUESTION_CATALOG_V1_0', status: 'ARCHIVED', contentHash: 'a1f3c9e2b7d4', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'APPROVED_FOR_IMPLEMENTATION', createdAt: '2026-10-01T03:00:00.000Z', activatedAt: '2026-10-05T03:00:00.000Z', wasActive: true },
  { catalogId: 2, catalogType: 'QUESTION_CATALOG', version: 'MOCK_QUESTION_CATALOG_V1_1', status: 'ACTIVE', contentHash: 'b2e4d8f1a6c3', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'APPROVED_FOR_IMPLEMENTATION', createdAt: '2026-10-20T03:00:00.000Z', activatedAt: '2026-10-25T03:00:00.000Z', wasActive: true },
  { catalogId: 3, catalogType: 'QUESTION_CATALOG', version: 'MOCK_QUESTION_CATALOG_V1_2', status: 'DRAFT', contentHash: 'c3a7e1b9d2f5', author: 'admin-a', reviewer: null, externalReviewStatus: 'DOMAIN_REVIEW_PENDING', createdAt: '2026-11-10T03:00:00.000Z', activatedAt: null, wasActive: false },
  { catalogId: 4, catalogType: 'OPTION_CATALOG', version: 'MOCK_OPTION_CATALOG_V1_0', status: 'ACTIVE', contentHash: 'd4b8f2c6e1a9', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'APPROVED_FOR_IMPLEMENTATION', createdAt: '2026-10-01T03:00:00.000Z', activatedAt: '2026-10-05T03:00:00.000Z', wasActive: true },
  { catalogId: 5, catalogType: 'MAJOR_MAPPING', version: 'MOCK_MAJOR_MAPPING_V1_0', status: 'ACTIVE', contentHash: 'e5c9a3d7f2b6', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'DOMAIN_REVIEW_PENDING', createdAt: '2026-10-01T03:00:00.000Z', activatedAt: '2026-10-05T03:00:00.000Z', wasActive: true },
  { catalogId: 6, catalogType: 'RULESET', version: 'MOCK_RULESET_V1_1', status: 'ACTIVE', contentHash: 'f6d1b4e8a3c7', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'APPROVED_FOR_IMPLEMENTATION', createdAt: '2026-10-01T03:00:00.000Z', activatedAt: '2026-10-05T03:00:00.000Z', wasActive: true },
  { catalogId: 7, catalogType: 'RULESET', version: 'MOCK_RULESET_V1_2', status: 'REVIEWED', contentHash: 'a7e2c5f9b1d4', author: 'admin-b', reviewer: 'admin-a', externalReviewStatus: 'APPROVED_FOR_IMPLEMENTATION', createdAt: '2026-11-08T03:00:00.000Z', activatedAt: null, wasActive: false },
];

const ITEM_COUNT: Record<CatalogType, number> = {
  QUESTION_CATALOG: QUESTIONS.length,
  OPTION_CATALOG: 62,
  MAJOR_MAPPING: 7,
  RULESET: 1,
};

const load = (): MockCatalog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockCatalog[];
  } catch { /* 저장소 접근 불가 시 기본값 */ }
  return SEED.map((c) => ({ ...c }));
};

const save = (list: MockCatalog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* mock이라 무시 */ }
};

const fail = (status: number, code: string) => ({ response: { status, data: { code } } });

const delay = <T,>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 250);
  });

const actionsOf = (c: MockCatalog): { allowedActions: CatalogAction[]; blockedReason: string | null } => {
  if (c.status === 'DRAFT') {
    return c.author === CURRENT_ADMIN
      ? { allowedActions: [], blockedReason: '직접 작성한 카탈로그는 다른 관리자가 검토해야 해요.' }
      : { allowedActions: ['REVIEW'], blockedReason: null };
  }
  if (c.status === 'REVIEWED') return { allowedActions: ['ACTIVATE'], blockedReason: null };
  if (c.status === 'ARCHIVED' && c.wasActive) return { allowedActions: ['ROLLBACK'], blockedReason: null };
  return { allowedActions: [], blockedReason: null };
};

const summary = (c: MockCatalog): CatalogSummary => ({
  catalogId: c.catalogId,
  catalogType: c.catalogType,
  version: c.version,
  status: c.status,
  contentHash: c.contentHash,
  itemCount: ITEM_COUNT[c.catalogType],
  author: c.author,
  reviewer: c.reviewer,
  externalReviewStatus: c.externalReviewStatus,
  createdAt: c.createdAt,
  activatedAt: c.activatedAt,
  ...actionsOf(c),
});

export const listCatalogs = () =>
  delay((): CatalogSummary[] => load().map(summary));

export const getCatalog = (catalogId: number) =>
  delay((): CatalogDetail => {
    const c = load().find((x) => x.catalogId === catalogId);
    if (!c) throw fail(404, 'RESOURCE_NOT_FOUND');
    return { ...summary(c), questions: c.catalogType === 'QUESTION_CATALOG' ? QUESTIONS : [] };
  });

export const review = (catalogId: number, expectedStatus: CatalogStatus) =>
  delay((): CatalogSummary => {
    const list = load();
    const c = list.find((x) => x.catalogId === catalogId);
    if (!c) throw fail(404, 'RESOURCE_NOT_FOUND');
    if (c.status !== expectedStatus) throw fail(409, 'STALE_REVISION');
    if (c.status !== 'DRAFT') throw fail(422, 'INVALID_REQUEST');
    if (c.author === CURRENT_ADMIN) throw fail(403, 'SELF_REVIEW');
    c.status = 'REVIEWED';
    c.reviewer = CURRENT_ADMIN;
    save(list);
    return summary(c);
  });

export const activate = (catalogId: number, expectedStatus: CatalogStatus) =>
  delay((): CatalogSummary => {
    const list = load();
    const c = list.find((x) => x.catalogId === catalogId);
    if (!c) throw fail(404, 'RESOURCE_NOT_FOUND');
    if (c.status !== expectedStatus) throw fail(409, 'STALE_REVISION');
    const allowed = c.status === 'REVIEWED' || (c.status === 'ARCHIVED' && c.wasActive);
    if (!allowed) throw fail(422, 'INVALID_REQUEST');
    list
      .filter((x) => x.catalogType === c.catalogType && x.status === 'ACTIVE')
      .forEach((x) => {
        x.status = 'ARCHIVED';
      });
    c.status = 'ACTIVE';
    c.wasActive = true;
    c.activatedAt = new Date().toISOString();
    save(list);
    return summary(c);
  });
