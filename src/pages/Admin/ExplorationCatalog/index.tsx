import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getExplorationCatalogs } from '../../../api/explorationAdmin';

import type { CatalogSummary } from '../../../types/explorationAdmin';

import CatalogActions from './components/CatalogActions';
import StatusBadge from './components/StatusBadge';

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

const formatDate = (value: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}.${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const reviewStatusLabel = (value: string | null) => {
  if (!value) return '미검토';

  const labels: Record<string, string> = {
    APPROVED_FOR_IMPLEMENTATION: '구현 승인',
    APPROVED: '승인',
    REJECTED: '반려',
    NOT_APPLICABLE: '해당 없음',
  };

  return labels[value] ?? value;
};

const ExplorationCatalog = () => {
  const [catalogs, setCatalogs] =
    useState<CatalogSummary[] | null>(null);

  const [error, setError] = useState(false);

  const [version, setVersion] = useState(0);

  const load = () => setVersion((value) => value + 1);

  useEffect(() => {
    let alive = true;

    getExplorationCatalogs()
      .then((response) => {
        if (!alive) return;

        setCatalogs(response);
        setError(false);
      })
      .catch(() => {
        if (alive) setError(true);
      });

    return () => {
      alive = false;
    };
  }, [version]);

  const sortedCatalogs = useMemo(() => {
    return [...(catalogs ?? [])].sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [catalogs]);

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-primary font-headline tracking-tight mb-1">
          진단 카탈로그
        </h2>

        <p className="text-on-primary-container text-sm">
          탐색형 진단의 카탈로그, 실행 규칙, 활동 자료를
          버전 단위로 관리합니다.
        </p>
      </div>

      <div className="rounded-[14px] bg-surface-container-low px-5 py-4 mb-8 text-sm text-on-surface-variant leading-relaxed">
        <p className="font-semibold text-primary mb-1">
          카탈로그 관리 안내
        </p>

        <p>
          자료를 직접 수정하는 화면이 아닙니다.
          검토 기록과 활성화 및 보관 이력을 관리합니다.
          보관된 자료는 다시 활성화할 수 없으며,
          다른 검토 완료 버전을 활성화해야 합니다.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container mb-6"
        >
          카탈로그 목록을 불러오지 못했습니다.{' '}

          <button
            type="button"
            onClick={load}
            className="font-bold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {!error && !catalogs && (
        <p role="status" className="text-sm text-on-surface-variant">
          카탈로그를 불러오는 중...
        </p>
      )}

      {catalogs && (
        <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px] text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10 text-xs text-on-surface-variant">
                  <th className="px-5 py-3 text-left font-bold">
                    자료 유형
                  </th>

                  <th className="px-5 py-3 text-left font-bold">
                    버전
                  </th>

                  <th className="px-5 py-3 text-center font-bold">
                    상태
                  </th>

                  <th className="px-5 py-3 text-left font-bold">
                    검토 상태
                  </th>

                  <th className="px-5 py-3 text-left font-bold">
                    항목 및 실행 정보
                  </th>

                  <th className="px-5 py-3 text-left font-bold">
                    생성일
                  </th>

                  <th className="px-5 py-3 text-left font-bold w-[280px]">
                    관리
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10">
                {sortedCatalogs.map((catalog) => (
                  <tr
                    key={`${catalog.targetType}:${catalog.targetId}`}
                    className="align-top"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-primary">
                        {TARGET_LABEL[catalog.targetType] ??
                          catalog.targetType}
                      </p>

                      <p className="text-xs text-on-surface-variant mt-1">
                        {TYPE_LABEL[catalog.catalogType] ??
                          catalog.catalogType}
                      </p>

                      <p className="text-[11px] text-on-surface-variant mt-1">
                        {catalog.targetType} / {catalog.targetId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/exploration-catalogs/${catalog.targetId}?targetType=${catalog.targetType}`}
                        className="font-semibold text-secondary hover:underline break-all"
                      >
                        {catalog.version}
                      </Link>

                      <p className="text-xs text-on-surface-variant mt-1">
                        해시{' '}
                        <code>
                          {catalog.contentHash.slice(0, 8)}
                        </code>
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge
                        status={catalog.contentStatus}
                      />
                    </td>

                    <td className="px-5 py-4 text-on-surface-variant">
                      <p>
                        구현:{' '}
                        {reviewStatusLabel(
                          catalog.implementationReviewStatus,
                        )}
                      </p>

                      <p className="mt-1">
                        내용:{' '}
                        {reviewStatusLabel(
                          catalog.domainReviewStatus,
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-on-surface-variant">
                      <p>
                        항목 수:{' '}
                        {catalog.itemCount ?? '미제공'}
                      </p>

                      <p className="mt-1">
                        {catalog.usedByRuntime
                          ? '현재 실행 설정에서 사용 중'
                          : '현재 실행 설정에서 미사용'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-on-surface-variant">
                      {formatDate(catalog.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <CatalogActions
                        catalog={catalog}
                        onChanged={load}
                      />
                    </td>
                  </tr>
                ))}

                {sortedCatalogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-on-surface-variant"
                    >
                      등록된 카탈로그가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorationCatalog;
