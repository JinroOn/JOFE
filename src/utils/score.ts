/**
 * 백엔드 역량 점수는 이미 0~100 범위의 값입니다.
 * 별도의 배율 변환 없이 유효 범위로만 제한합니다.
 *
 * @param value 백엔드에서 전달된 점수
 * @param fallback 숫자로 변환할 수 없을 때 사용할 값
 */
export const normalizeScoreToHundred = (
  value: unknown,
  fallback: number,
): number => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(Math.max(numeric, 0), 100);
};
