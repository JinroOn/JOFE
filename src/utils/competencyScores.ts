import type { Major } from '../types/major';
import { normalizeScoreToHundred } from './score';

// 두 레거시 결과 화면에서 동일한 9개 축과 점수 처리 규칙을 사용합니다.
export const COMPETENCY_AXES = [
  '수리·논리', '문제해결', '정보기술', '구현력', '시스템이해',
  '데이터분석', '의사소통', '협업·윤리', '자기관리',
];

const COMPETENCY_KEYS = [
  'mathLogic', 'problemSolving', 'infoTech', 'implementation', 'systemUnderstanding',
  'dataAnalysis', 'communication', 'collaboration', 'selfManagement',
] as const;

const MAJOR_REQUIRED_KEYS = [
  'reqMathLogic', 'reqProblemSolving', 'reqInfoTech', 'reqImplementation', 'reqSystemUnderstanding',
  'reqDataAnalysis', 'reqCommunication', 'reqCollaboration', 'reqSelfManagement',
] as const;

export type NullableScore = number | null;

// null/undefined/빈 문자열은 실제 0점과 다르게 '미제공'으로 처리합니다.
export const toNullableScore = (value: unknown): NullableScore => {
  if (
    value == null ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value !== 'number' && typeof value !== 'string')
  ) return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return normalizeScoreToHundred(numberValue, numberValue);
};

export const parseCompetencyScores = (
  vector?: string | null,
): NullableScore[] | null => {
  if (!vector?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(vector);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const data = parsed as Record<string, unknown>;
    const scores = COMPETENCY_KEYS.map((key) => toNullableScore(data[key]));
    return scores.some((value) => value !== null) ? scores : null;
  } catch {
    return null;
  }
};

export const parseMajorRequiredScores = (major?: Major): NullableScore[] =>
  MAJOR_REQUIRED_KEYS.map((key) => toNullableScore(major?.[key]));

export const hasCompleteScores = (
  scores: NullableScore[] | null,
): scores is number[] =>
  scores !== null &&
  scores.length === COMPETENCY_AXES.length &&
  scores.every((score) => score !== null);

export const scoreText = (score: NullableScore): string =>
  score === null ? '-' : `${Math.round(score)}점`;
