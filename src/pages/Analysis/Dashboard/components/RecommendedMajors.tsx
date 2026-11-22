import { useState } from 'react';
import type { RecommendedMajor } from '../types';
import {
  extendThroughSameRank,
  getDisplayRank,
  getRankLabel,
} from '../../../../utils/majorRank';

interface RecommendedMajorsProps {
  majors: RecommendedMajor[];
}

const INITIAL_COUNT = 10;
const LOAD_MORE_COUNT = 10;

const difficultyLabelMap: Record<string, string> = {
  low: '난이도 낮음',
  mid: '난이도 보통',
  high: '난이도 높음',
};

const RecommendedMajors = ({ majors }: RecommendedMajorsProps) => {
  // #172에서 구현한 더 보기 상태를 유지하되 결과가 바뀌면 초기화합니다.
  const signature = majors
    .map((major) =>
      `${major.majorId}:${major.rank}:${major.displayRank ?? ''}:${major.tieCount ?? ''}:${major.suitability}`,
    )
    .join('|');

  const [displayState, setDisplayState] = useState({
    signature: '',
    count: INITIAL_COUNT,
  });

  const sortedMajors = [...majors].sort((a, b) => a.rank - b.rank);
  const requestedCount = displayState.signature === signature
    ? displayState.count
    : INITIAL_COUNT;
  const visibleCount = extendThroughSameRank(sortedMajors, requestedCount);
  const visible = sortedMajors.slice(0, visibleCount);
  const canShowMore = visibleCount < sortedMajors.length;
  const nextRequestedCount = Math.min(sortedMajors.length, visibleCount + LOAD_MORE_COUNT);
  const nextVisibleCount = extendThroughSameRank(sortedMajors, nextRequestedCount);
  const canCollapse = requestedCount > INITIAL_COUNT;

  if (sortedMajors.length === 0) {
    return (
      <div className="rounded-[14px] bg-surface-container-lowest p-6 font-bold text-on-surface-variant shadow-sm">
        추천 전공 점수 데이터가 없습니다.
      </div>
    );
  }

  const firstRank = getDisplayRank(sortedMajors[0]);
  const leaders = visible.filter((major) => getDisplayRank(major) === firstRank);
  const others = visible.filter((major) => getDisplayRank(major) !== firstRank);
  const singleLeader = leaders.length === 1;

  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-on-surface-variant">
        총 {sortedMajors.length}개 전공 중 {visibleCount}개를 표시하고 있습니다.
        {visibleCount > requestedCount && (
          <span className="ml-1">공동 순위는 한 번에 모두 표시합니다.</span>
        )}
      </p>

      {leaders.length > 1 && (
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-on-surface-variant">
          {getRankLabel(leaders[0])} 전공이 {leaders.length}개입니다.
          모두 같은 표시 순위이며, 저장 순서가 먼저인 전공을 별도의 단독 1위로 판단하지 않습니다.
        </div>
      )}

      {/* 단독 1위는 기존의 상세 강조 카드 유지 */}
      {singleLeader && leaders.map((major) => (
        <div
          key={major.majorId}
          className="rounded-[14px] border-l-4 border-[#FFAB00] bg-surface-container-lowest p-6 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#FFAB00]/10 px-2 py-0.5 text-xs font-black text-[#b77900]">
                  {getRankLabel(major)} 추천 전공
                </span>
                {major.category && (
                  <span className="rounded bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">
                    {major.category}
                  </span>
                )}
                {major.difficulty && (
                  <span className="rounded bg-surface-container-high px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                    {difficultyLabelMap[major.difficulty] ?? major.difficulty}
                  </span>
                )}
              </div>
              <h4 className="text-2xl font-bold text-primary-container">{major.name}</h4>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-3xl font-black text-[#b77900]">
                {major.suitability}<span className="text-sm">%</span>
              </span>
              <p className="text-[10px] font-bold text-on-surface-variant">적합도</p>
            </div>
          </div>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-[#FFAB00]" style={{ width: `${major.suitability}%` }} />
          </div>
          <p className="break-words text-sm leading-relaxed text-on-surface-variant">
            {major.description}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="mb-1 text-xs font-bold text-on-surface-variant">성향 적합도</p>
              <p className="text-lg font-black text-primary-container">{Math.round(major.tendencyScore)}점</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="mb-1 text-xs font-bold text-on-surface-variant">역량 적합도</p>
              <p className="text-lg font-black text-primary-container">{Math.round(major.competencyScore)}점</p>
            </div>
          </div>
          {major.careerPaths && (
            <p className="mt-4 text-xs text-on-surface-variant">
              <span className="font-bold">진출 분야: </span>{major.careerPaths}
            </p>
          )}
          {major.failed && (
            <p className="mt-3 text-xs font-bold text-error">일부 기준에서 과락이 감지된 추천 결과입니다.</p>
          )}
        </div>
      ))}

      {/* 공동 1위는 모든 후보를 동등한 스타일로 강조합니다. */}
      {!singleLeader && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {leaders.map((major) => (
            <div
              key={major.majorId}
              className="rounded-[14px] border-l-4 border-[#FFAB00] bg-surface-container-lowest p-5 shadow-sm"
            >
              <span className="mb-2 inline-block rounded bg-[#FFAB00]/10 px-2 py-0.5 text-xs font-black text-[#b77900]">
                {getRankLabel(major)}
              </span>
              <div className="mb-3 flex items-start justify-between gap-3">
                <h4 className="font-bold text-primary-container">{major.name}</h4>
                <span className="shrink-0 font-black text-secondary">{major.suitability}%</span>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{major.description}</p>
              <p className="mt-3 text-xs text-on-surface-variant">
                성향 {Math.round(major.tendencyScore)}점 · 역량 {Math.round(major.competencyScore)}점
              </p>
              {major.failed && <p className="mt-2 text-xs font-bold text-error">과락 포함</p>}
            </div>
          ))}
        </div>
      )}

      {/* 나머지 전공도 백엔드의 실제 표시 순위를 사용합니다. */}
      {others.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {others.map((major) => (
            <div
              key={`${major.rank}-${major.majorId}`}
              className="rounded-[14px] bg-surface-container-lowest p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="mb-2 block text-xs font-bold text-secondary">
                    {getRankLabel(major)}
                  </span>
                  <h5 className="font-bold text-primary-container">{major.name}</h5>
                  {major.category && (
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">{major.category}</p>
                  )}
                  {major.failed && (
                    <p className="mt-1 text-xs font-bold text-error">과락 포함</p>
                  )}
                </div>
                <span className="shrink-0 font-black tabular-nums text-secondary">{major.suitability}%</span>
              </div>
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${major.suitability}%` }} />
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">{major.description}</p>
            </div>
          ))}
        </div>
      )}

      {(canShowMore || canCollapse) && (
        <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
          {canShowMore && (
            <button
              type="button"
              onClick={() => setDisplayState({
                signature,
                count: nextRequestedCount,
              })}
              className="min-h-[44px] w-full rounded-xl border border-secondary/40 bg-surface-container-lowest px-8 py-3 text-sm font-bold text-secondary sm:w-auto"
            >
              {nextVisibleCount - visibleCount}개 더 보기
            </button>
          )}
          {canCollapse && (
            <button
              type="button"
              onClick={() => setDisplayState({ signature, count: INITIAL_COUNT })}
              className="min-h-[44px] w-full rounded-xl border border-outline-variant/30 px-8 py-3 text-sm font-semibold text-on-surface-variant sm:w-auto"
            >
              상위 순위만 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendedMajors;