/**
 * rank는 저장된 정렬 순서입니다. 화면에는 백엔드의 displayRank를 사용합니다.
 * 필드가 없는 오래된 API는 기존 rank로만 표시합니다(동점 재계산 금지).
 */
export interface RankFields {
  rank: number;
  displayRank?: number | null;
  tieCount?: number | null;
}

export const getDisplayRank = (score: RankFields): number =>
  typeof score.displayRank === 'number' &&
  Number.isInteger(score.displayRank) &&
  score.displayRank > 0
    ? score.displayRank
    : score.rank;

export const getRankLabel = (score: RankFields): string =>
  `${(score.tieCount ?? 1) > 1 ? '공동 ' : ''}${getDisplayRank(score)}위`;

export const getTopRankedScores = <T extends RankFields>(
  scores: readonly T[],
): T[] => {
  if (scores.length === 0) return [];
  const topRank = Math.min(...scores.map(getDisplayRank));
  return scores
    .filter((score) => getDisplayRank(score) === topRank)
    .sort((a, b) => a.rank - b.rank);
};

/**
 * 더보기 경계가 공동 순위의 중간에 있으면 그 그룹 전체까지 표시.
 * 점수를 반올림해 공동 순위를 새로 만들지 않습니다.
 */
export const extendThroughSameRank = <T extends RankFields>(
  scores: readonly T[],
  requestedCount: number,
): number => {
  const start = Math.min(Math.max(requestedCount, 0), scores.length);
  if (start === 0 || start === scores.length) return start;
  const boundary = getDisplayRank(scores[start - 1]);
  let end = start;
  while (end < scores.length && getDisplayRank(scores[end]) === boundary) {
    end += 1;
  }
  return end;
};
