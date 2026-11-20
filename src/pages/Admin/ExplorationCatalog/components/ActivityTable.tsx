import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getExplorationCatalogActivities } from '../../../../api/explorationAdmin';

import type { CatalogActivitySummary } from '../../../../types/explorationAdmin';

import {
  ACTIVITY_KIND_LABEL,
  ACTIVITY_REVIEW_STATE_LABEL,
  activityReviewState,
  reviewStatusLabel,
  type ActivityReviewState,
} from './adminLabels';
import StatusBadge from './StatusBadge';

type LoadState =
  | { key: string; status: 'success'; activities: CatalogActivitySummary[] }
  | { key: string; status: 'error' };

const selectCls =
  'min-h-[40px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm';

const STATE_CLS: Record<ActivityReviewState, string> = {
  APPROVED: 'text-secondary',
  REJECTED: 'text-error',
  PENDING: 'text-on-surface-variant',
};

// 활동 카탈로그 상세에 붙는 활동 목록. 활동 한 건의 검토는 활동 상세 화면에서 한다
const ActivityTable = ({ catalogId }: { catalogId: number }) => {
  const [loaded, setLoaded] = useState<LoadState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [kind, setKind] = useState('ALL');
  const [state, setState] = useState<'ALL' | ActivityReviewState>('ALL');
  const [scope, setScope] = useState<'ALL' | 'MAJOR' | 'GENERAL'>('ALL');
  const [query, setQuery] = useState('');

  const key = `${catalogId}:${attempt}`;

  useEffect(() => {
    let alive = true;
    getExplorationCatalogActivities(catalogId)
      .then((activities) => {
        if (alive) setLoaded({ key, status: 'success', activities });
      })
      .catch(() => {
        if (alive) setLoaded({ key, status: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [catalogId, key]);

  const current = loaded?.key === key ? loaded : null;
  const activities = useMemo(() => (current?.status === 'success' ? current.activities : []), [current]);

  const counts = useMemo(() => {
    const result: Record<ActivityReviewState, number> = { APPROVED: 0, REJECTED: 0, PENDING: 0 };
    activities.forEach((activity) => {
      result[activityReviewState(activity)] += 1;
    });
    return result;
  }, [activities]);

  const kinds = useMemo(
    () => [...new Set(activities.map((activity) => activity.kind ?? ''))].filter(Boolean).sort(),
    [activities],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return activities.filter(
      (activity) =>
        (kind === 'ALL' || activity.kind === kind) &&
        (state === 'ALL' || activityReviewState(activity) === state) &&
        (scope === 'ALL' || (scope === 'GENERAL' ? activity.majorCode === null : activity.majorCode !== null)) &&
        (!search ||
          activity.activityCode.toLowerCase().includes(search) ||
          (activity.title ?? '').toLowerCase().includes(search) ||
          (activity.majorCode ?? '').toLowerCase().includes(search)),
    );
  }, [activities, kind, state, scope, query]);

  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold text-primary mb-2">활동 목록</h3>

      <p className="mb-4 text-sm leading-6 text-on-surface-variant">
        결과 화면의 탐색 활동에 보이려면 <strong>이 활동 카탈로그와 해당 활동 모두</strong> 구현 검토·내용 검토(DEV) 승인이
        현재 버전으로 남아 있어야 합니다. 승인은 활동 본문과 출처를 직접 확인한 뒤 활동 상세에서 기록합니다.
      </p>

      {!current && (
        <p role="status" className="text-sm text-on-surface-variant">
          활동을 불러오는 중...
        </p>
      )}

      {current?.status === 'error' && (
        <div role="alert" className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container">
          활동 목록을 불러오지 못했습니다.{' '}
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="font-bold underline">
            다시 시도
          </button>
        </div>
      )}

      {current?.status === 'success' && (
        <>
          <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1">
              <dt className="text-on-surface-variant">전체</dt>
              <dd className="font-bold text-primary">{activities.length}</dd>
            </div>
            {(Object.keys(counts) as ActivityReviewState[]).map((item) => (
              <div key={item} className="flex gap-1">
                <dt className="text-on-surface-variant">{ACTIVITY_REVIEW_STATE_LABEL[item]}</dt>
                <dd className={`font-bold ${STATE_CLS[item]}`}>{counts[item]}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <label className="sr-only" htmlFor="activity-kind-filter">
              활동 종류
            </label>
            <select id="activity-kind-filter" value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
              <option value="ALL">모든 종류</option>
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {ACTIVITY_KIND_LABEL[item] ?? item}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="activity-state-filter">
              검토 상태
            </label>
            <select
              id="activity-state-filter"
              value={state}
              onChange={(e) => setState(e.target.value as 'ALL' | ActivityReviewState)}
              className={selectCls}
            >
              <option value="ALL">모든 검토 상태</option>
              {(Object.keys(ACTIVITY_REVIEW_STATE_LABEL) as ActivityReviewState[]).map((item) => (
                <option key={item} value={item}>
                  {ACTIVITY_REVIEW_STATE_LABEL[item]}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="activity-scope-filter">
              전공 구분
            </label>
            <select
              id="activity-scope-filter"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'ALL' | 'MAJOR' | 'GENERAL')}
              className={selectCls}
            >
              <option value="ALL">전공·공통 전체</option>
              <option value="MAJOR">전공 활동</option>
              <option value="GENERAL">공통 활동</option>
            </select>

            <label className="sr-only" htmlFor="activity-search">
              활동 검색
            </label>
            <input
              id="activity-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="활동 코드, 제목, 전공 코드로 검색"
              className={`${selectCls} flex-1 min-w-[200px]`}
            />

            <span className="text-sm text-on-surface-variant" aria-live="polite">
              {filtered.length}개
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[860px] text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/10 text-xs text-on-surface-variant">
                    <th className="px-5 py-3 text-left font-bold">활동 코드·버전</th>
                    <th className="px-5 py-3 text-left font-bold">제목</th>
                    <th className="px-5 py-3 text-left font-bold">종류</th>
                    <th className="px-5 py-3 text-left font-bold">전공</th>
                    <th className="px-5 py-3 text-left font-bold">검토 상태</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/10">
                  {filtered.map((activity) => {
                    const reviewState = activityReviewState(activity);
                    return (
                      <tr key={activity.targetId} className="align-top hover:bg-surface-container-low/60">
                        <td className="px-5 py-3 font-mono text-xs">
                          <Link
                            to={`/admin/exploration-catalogs/${catalogId}/activities/${activity.targetId}`}
                            className="font-semibold text-secondary underline-offset-2 hover:underline"
                          >
                            {activity.activityCode}
                          </Link>
                          <span className="block text-on-surface-variant">v{activity.version}</span>
                        </td>
                        <td className="px-5 py-3 text-on-surface">{activity.title ?? '-'}</td>
                        <td className="px-5 py-3 text-on-surface-variant">
                          {activity.kind ? (ACTIVITY_KIND_LABEL[activity.kind] ?? activity.kind) : '-'}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">
                          {activity.majorCode ?? '공통'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <p className="mb-1">
                            <StatusBadge status={activity.contentStatus} />
                          </p>
                          <p className={`font-bold ${STATE_CLS[reviewState]}`}>{ACTIVITY_REVIEW_STATE_LABEL[reviewState]}</p>
                          <p className="mt-1 text-on-surface-variant">
                            구현 {reviewStatusLabel(activity.implementationReviewStatus)} · 내용{' '}
                            {reviewStatusLabel(activity.domainReviewStatus)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-on-surface-variant">
                        {activities.length === 0 ? '이 카탈로그에 등록된 활동이 없습니다.' : '조건에 맞는 활동이 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ActivityTable;
