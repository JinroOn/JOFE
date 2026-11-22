import { useState } from 'react';
import type { RecommendedMajor } from '../types';

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

const RecommendedMajors = ({
  majors,
}: RecommendedMajorsProps) => {
  // 진단 회차에 따라 추천 순서나 점수가 바뀌면
  // 다시 상위 10개부터 표시합니다.
  const resultSignature = majors
    .map(
      (major) =>
        `${major.majorId}:${major.rank}:${major.suitability}`,
    )
    .join('|');

  const [displayState, setDisplayState] = useState({
    signature: '',
    count: INITIAL_COUNT,
  });

  const visibleCount =
    displayState.signature === resultSignature
      ? displayState.count
      : INITIAL_COUNT;

  const visibleMajors = majors.slice(0, visibleCount);
  const hasMore = visibleCount < majors.length;
  const expanded = visibleCount > INITIAL_COUNT;

  if (majors.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-[14px] shadow-sm text-on-surface-variant font-bold">
        추천 전공 점수 데이터가 없습니다.
      </div>
    );
  }

  const [top1, ...rest] = visibleMajors;

  const showMore = () => {
    setDisplayState({
      signature: resultSignature,
      count: Math.min(
        majors.length,
        visibleCount + LOAD_MORE_COUNT,
      ),
    });
  };

  const collapse = () => {
    setDisplayState({
      signature: resultSignature,
      count: INITIAL_COUNT,
    });
  };

  return (
    <div className="space-y-4">
      <p
        role="status"
        className="text-sm text-on-surface-variant"
      >
        총 {majors.length}개 전공 중 상위{' '}
        {visibleMajors.length}개를 표시하고 있습니다.
      </p>

      {/* 기존 1위 전공 카드 */}
      <div className="bg-surface-container-lowest p-6 rounded-[14px] shadow-sm border-l-4 border-[#FFAB00] hover:translate-x-1 transition-transform">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-[#FFAB00] bg-[#FFAB00]/10 px-2 py-0.5 rounded">
                #1 RECOMMENDED
              </span>

              {top1.category && (
                <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                  {top1.category}
                </span>
              )}

              {top1.difficulty && (
                <span className="text-[10px] font-black text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                  {difficultyLabelMap[top1.difficulty] ??
                    top1.difficulty}
                </span>
              )}
            </div>

            <h4 className="text-2xl font-bold text-primary-container mt-1">
              {top1.name}
            </h4>
          </div>

          <div className="text-right shrink-0">
            <span className="text-3xl font-black text-[#FFAB00]">
              {top1.suitability}
              <span className="text-sm">%</span>
            </span>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Suitability
            </p>
          </div>
        </div>

        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[#FFAB00] rounded-full"
            style={{ width: `${top1.suitability}%` }}
          />
        </div>

        <p className="text-on-surface-variant text-sm flex items-start gap-2 leading-relaxed">
          <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">
            info
          </span>
          {top1.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="rounded-[12px] bg-surface-container-low p-3">
            <p className="text-[11px] font-black text-on-surface-variant mb-1">
              성향 적합도
            </p>
            <p className="text-lg font-black text-primary-container">
              {Math.round(top1.tendencyScore)}점
            </p>
          </div>

          <div className="rounded-[12px] bg-surface-container-low p-3">
            <p className="text-[11px] font-black text-on-surface-variant mb-1">
              역량 적합도
            </p>
            <p className="text-lg font-black text-primary-container">
              {Math.round(top1.competencyScore)}점
            </p>
          </div>
        </div>

        {top1.careerPaths && (
          <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-primary-container">
              진출 분야:{' '}
            </span>
            {top1.careerPaths}
          </p>
        )}

        {top1.failed && (
          <p className="mt-3 text-xs font-bold text-red-500">
            일부 기준에서 과락이 감지된 추천 결과입니다.
          </p>
        )}
      </div>

      {/* 2위부터 현재 표시 개수까지 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rest.map((major) => (
          <div
            key={`${major.rank}-${major.majorId}`}
            className="bg-surface-container-lowest p-5 rounded-[14px] shadow-sm hover:translate-x-1 transition-transform"
          >
            <div className="flex justify-between items-start gap-4 mb-3">
              <div>
                <h5 className="font-bold text-primary-container">
                  {major.name}
                </h5>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {major.category && (
                    <span className="text-[10px] font-bold text-secondary">
                      {major.category}
                    </span>
                  )}

                  {major.failed && (
                    <span className="text-[10px] font-bold text-red-500">
                      과락 포함
                    </span>
                  )}
                </div>
              </div>

              <span className="text-secondary font-black tabular-nums shrink-0">
                {major.suitability}%
              </span>
            </div>

            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${major.suitability}%` }}
              />
            </div>

            <p className="text-xs text-on-surface-variant leading-snug">
              {major.description}
            </p>
          </div>
        ))}
      </div>

      {/* 추가 보기 및 접기 */}
      {(hasMore || expanded) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {hasMore && (
            <button
              type="button"
              onClick={showMore}
              className="w-full sm:w-auto min-h-[44px] rounded-xl border border-secondary/40 bg-surface-container-lowest px-8 py-3 text-sm font-bold text-secondary hover:bg-secondary/5"
            >
              {Math.min(
                LOAD_MORE_COUNT,
                majors.length - visibleCount,
              )}
              개 더 보기
            </button>
          )}

          {expanded && (
            <button
              type="button"
              onClick={collapse}
              className="w-full sm:w-auto min-h-[44px] rounded-xl border border-outline-variant/30 px-8 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              상위 {INITIAL_COUNT}개만 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendedMajors;