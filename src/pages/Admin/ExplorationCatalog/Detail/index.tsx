import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { getExplorationCatalog } from '../../../../api/explorationAdmin';

import type {
  CatalogDetail,
  CatalogQuestion,
  CatalogTargetType,
} from '../../../../types/explorationAdmin';

import ActivityTable from '../components/ActivityTable';
import CatalogActions from '../components/CatalogActions';
import ReviewHistory from '../components/ReviewHistory';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, reviewStatusLabel } from '../components/adminLabels';

const STAGE_LABEL: Record<string, string> = {
  STAGE_1: '1단계',
  STAGE_2: '2단계',
  STAGE_3: '3단계',
  POST_RESULT: '결과 후',
};

const TARGET_LABEL: Record<string, string> = {
  CATALOG: '탐색형 카탈로그',
  RULESET: '실행 규칙',
  ACTIVITY_CATALOG: '활동 카탈로그',
};

const TYPE_LABEL: Record<string, string> = {
  QUESTION_CATALOG: '문항',
  OPTION_CATALOG: '선택지',
  MAJOR_MAPPING: '전공 매핑',
  OPTION_VARIANT: '비교 선택지',
  SEMANTIC_CONTRACT: '의미 계약',
  RULESET: '실행 규칙',
  ACTIVITY_CATALOG: '활동 자료',
};

const ACTION_LABEL: Record<string, string> = {
  ACTIVATE: '사용 시작',
  ARCHIVE: '보관',
};

const isCatalogTargetType = (
  value: string | null,
): value is CatalogTargetType =>
  value === 'CATALOG' ||
  value === 'RULESET' ||
  value === 'ACTIVITY_CATALOG';

// 상세 조회 결과 상태
type DetailRequestState =
  | {
      requestKey: string;
      status: 'success';
      detail: CatalogDetail;
    }
  | {
      requestKey: string;
      status: 'error';
      message: string;
    };

const ExplorationCatalogDetail = () => {
  const { catalogId } = useParams();
  const [searchParams] = useSearchParams();

  const targetTypeValue = searchParams.get('targetType');

  const targetType = isCatalogTargetType(targetTypeValue)
    ? targetTypeValue
    : null;

  const id = Number(catalogId);

  const [requestState, setRequestState] =
    useState<DetailRequestState | null>(null);

  const [stage, setStage] = useState('ALL');
  const [moduleCode, setModuleCode] = useState('ALL');
  const [query, setQuery] = useState('');

  const [version, setVersion] = useState(0);

  const load = () => {
    setVersion((value) => value + 1);
  };

  // 요청에 필요한 식별자 검증
  const invalidParams =
    !targetType ||
    !Number.isSafeInteger(id) ||
    id <= 0;

  const invalidMessage =
    '카탈로그 종류 또는 식별자 정보가 올바르지 않습니다.';

  // 현재 요청을 구분하는 고유 키
  const requestKey = invalidParams
    ? 'invalid'
    : `${targetType}:${id}:${version}`;

  // 현재 화면에 해당하는 요청 결과만 사용
  const currentRequest =
    requestState?.requestKey === requestKey
      ? requestState
      : null;

  const detail =
    currentRequest?.status === 'success'
      ? currentRequest.detail
      : null;

  // 요청 중인지 여부는 상태를 직접 변경하지 않고 계산
  const loading =
    !invalidParams && currentRequest === null;

  // 오류 메시지도 현재 요청 상태를 기준으로 계산
  const error = invalidParams
    ? invalidMessage
    : currentRequest?.status === 'error'
      ? currentRequest.message
      : null;

  // 카탈로그 상세 조회
  useEffect(() => {
    if (
      !targetType ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      return;
    }

    let alive = true;

    const currentKey = `${targetType}:${id}:${version}`;

    Promise.resolve()
      .then(() => getExplorationCatalog(targetType, id))
      .then((response) => {
        if (!alive) return;

        setRequestState({
          requestKey: currentKey,
          status: 'success',
          detail: response,
        });
      })
      .catch(() => {
        if (!alive) return;

        setRequestState({
          requestKey: currentKey,
          status: 'error',
          message:
            '카탈로그 상세 정보를 불러오지 못했습니다.',
        });
      });

    return () => {
      alive = false;
    };
  }, [id, targetType, version]);

  const catalog = detail?.catalog;

  // 문항 모듈 목록
  const modules = useMemo(
    () =>
      [
        ...new Set(
          (detail?.questions ?? []).map(
            (question) => question.moduleCode,
          ),
        ),
      ].sort(),
    [detail],
  );

  // 문항 검색 및 필터링
  const filteredQuestions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return (detail?.questions ?? []).filter(
      (question: CatalogQuestion) =>
        (stage === 'ALL' || question.stage === stage) &&
        (moduleCode === 'ALL' ||
          question.moduleCode === moduleCode) &&
        (!search ||
          question.questionId.toLowerCase().includes(search) ||
          (question.text ?? '').toLowerCase().includes(search)),
    );
  }, [detail, stage, moduleCode, query]);

  const selectCls =
    'min-h-[40px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm';

  const isQuestionCatalog =
    catalog?.targetType === 'CATALOG' &&
    catalog.catalogType === 'QUESTION_CATALOG';

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <Link
        to="/admin/exploration-catalogs"
        className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-secondary mb-5"
      >
        <span
          className="material-symbols-outlined text-[18px]"
          aria-hidden="true"
        >
          arrow_back
        </span>

        카탈로그 목록
      </Link>

      {/* 로딩 */}
      {loading && (
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          카탈로그를 불러오는 중...
        </p>
      )}

      {/* 오류 */}
      {error && (
        <div
          role="alert"
          className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container"
        >
          {error}{' '}

          {!invalidParams && (
            <button
              type="button"
              onClick={load}
              className="font-bold underline"
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* 상세 데이터 */}
      {catalog && detail && (
        <>
          {/* 카탈로그 기본 정보 */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-headline tracking-tight break-all">
                {catalog.version}
              </h2>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <StatusBadge status={catalog.contentStatus} />

                <span>
                  {TARGET_LABEL[catalog.targetType] ??
                    catalog.targetType}
                </span>

                <span>·</span>

                <span>
                  {TYPE_LABEL[catalog.catalogType] ??
                    catalog.catalogType}
                </span>
              </p>

              <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                <p>
                  대상 ID: {catalog.targetType} / {catalog.targetId}
                </p>

                <p>
                  항목 수: {catalog.itemCount ?? '미제공'}
                </p>

                <p className="break-all">
                  내용 해시: <code>{catalog.contentHash}</code>
                </p>

                <p>
                  생성일: {formatDateTime(catalog.createdAt)}
                </p>

                <p>
                  실행 설정 사용 여부:{' '}
                  {catalog.usedByRuntime ? '사용 중' : '미사용'}
                </p>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <p>
                  구현 검토:{' '}
                  {reviewStatusLabel(
                    catalog.implementationReviewStatus,
                  )}
                </p>

                <p>
                  내용 검토:{' '}
                  {reviewStatusLabel(
                    catalog.domainReviewStatus,
                  )}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-[340px]">
              <CatalogActions
                catalog={catalog}
                onChanged={load}
              />
            </div>
          </div>

          {/* 문항 상세 */}
          {isQuestionCatalog && (
            <section className="mb-10">
              <h3 className="text-lg font-bold text-primary mb-4">
                문항 목록
              </h3>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <label
                  className="sr-only"
                  htmlFor="stage-filter"
                >
                  단계
                </label>

                <select
                  id="stage-filter"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className={selectCls}
                >
                  <option value="ALL">모든 단계</option>

                  {Object.entries(STAGE_LABEL).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ),
                  )}
                </select>

                <label
                  className="sr-only"
                  htmlFor="module-filter"
                >
                  모듈
                </label>

                <select
                  id="module-filter"
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value)}
                  className={selectCls}
                >
                  <option value="ALL">모든 모듈</option>

                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>

                <label
                  className="sr-only"
                  htmlFor="question-search"
                >
                  문항 검색
                </label>

                <input
                  id="question-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="문항 ID나 문구로 검색"
                  className={`${selectCls} flex-1 min-w-[200px]`}
                />

                <span
                  className="text-sm text-on-surface-variant"
                  aria-live="polite"
                >
                  {filteredQuestions.length}개
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[900px] text-sm">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/10 text-xs text-on-surface-variant">
                        <th className="px-5 py-3 text-left font-bold">
                          문항 ID·버전
                        </th>

                        <th className="px-5 py-3 text-left font-bold">
                          단계·모듈
                        </th>

                        <th className="px-5 py-3 text-left font-bold">
                          지표
                        </th>

                        <th className="px-5 py-3 text-left font-bold">
                          문항 내용
                        </th>

                        <th className="px-5 py-3 text-left font-bold">
                          검토 상태
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant/10">
                      {filteredQuestions.map((question) => (
                        <tr
                          key={question.questionId}
                          className="align-top"
                        >
                          <td className="px-5 py-3 font-mono text-xs">
                            {question.questionId}

                            <span className="block text-on-surface-variant">
                              v{question.questionVersion}
                            </span>
                          </td>

                          <td className="px-5 py-3 text-on-surface-variant">
                            {STAGE_LABEL[question.stage] ??
                              question.stage}

                            <span className="block text-xs">
                              {question.moduleCode}
                            </span>
                          </td>

                          <td className="px-5 py-3 text-on-surface-variant">
                            {question.metricCode ?? '-'}
                          </td>

                          <td className="px-5 py-3 text-on-surface">
                            {question.text ?? '-'}
                          </td>

                          <td className="px-5 py-3 text-xs text-on-surface-variant">
                            <p>
                              콘텐츠:{' '}
                              {reviewStatusLabel(
                                question.contentStatus,
                              )}
                            </p>

                            <p className="mt-1">
                              구현:{' '}
                              {reviewStatusLabel(
                                question.implementationReviewStatus,
                              )}
                            </p>

                            <p className="mt-1">
                              내용:{' '}
                              {reviewStatusLabel(
                                question.domainReviewStatus,
                              )}
                            </p>
                          </td>
                        </tr>
                      ))}

                      {filteredQuestions.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-on-surface-variant"
                          >
                            조건에 맞는 문항이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {catalog.targetType === 'ACTIVITY_CATALOG' && (
            <ActivityTable catalogId={catalog.targetId} />
          )}

          {!isQuestionCatalog && catalog.targetType !== 'ACTIVITY_CATALOG' && (
            <div className="mb-10 rounded-[14px] bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
              이 자료 유형에는 별도의 문항 목록이 없습니다.
              검토 및 활성화 이력을 확인할 수 있습니다.
            </div>
          )}

          <ReviewHistory reviews={detail.reviews} />

          {/* 활성화 및 보관 이력 */}
          <section className="mb-10">
            <h3 className="text-lg font-bold text-primary mb-4">
              활성화 및 보관 이력
              <span className="ml-2 text-sm font-normal text-on-surface-variant">
                {detail.activations.length}건
              </span>
            </h3>

            <div className="space-y-3">
              {detail.activations.map((activation) => (
                <div
                  key={activation.activationId}
                  className="rounded-[14px] border border-outline-variant/20 bg-surface-container-lowest p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-primary">
                      {ACTION_LABEL[activation.action] ??
                        activation.action}
                    </strong>

                    <span className="text-xs text-on-surface-variant">
                      {formatDateTime(activation.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                    <p>실행자 ID: {activation.actorId}</p>

                    <p>
                      적용 범위: {activation.scope ?? '-'}
                    </p>

                    <p>
                      대상 버전: {activation.targetVersion}
                    </p>

                    <p>
                      관련 대상 ID: {activation.relatedTargetId ?? '-'}
                    </p>

                    <p>
                      검토 이력 ID:{' '}
                      {activation.reviewIds.length > 0
                        ? activation.reviewIds.join(', ')
                        : '-'}
                    </p>

                    <p>처리 사유: {activation.reason}</p>
                  </div>
                </div>
              ))}

              {detail.activations.length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  아직 활성화 및 보관 이력이 없습니다.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ExplorationCatalogDetail;
