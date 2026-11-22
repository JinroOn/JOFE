export type AiCommentStatus =
  | 'NOT_REQUESTED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED';

export interface DiagnosisResultRequest {
  diagnosisSessionId?: number;
  userId?: number;
  competencyVector?: string;
  tendencyVector?: string;
  shareToken?: string;
  topMajorsJson?: string;
}

export interface DiagnosisResult {
  id: number;
  createdAt: string;
  updatedAt: string;
  diagnosisSessionId: number;
  userId: number;
  competencyVector: string | null;
  tendencyVector: string | null;
  topMajorsJson: string | null;
  shareToken: string | null;
  aiComment: string | null;
  weaknessFocus: string | null;
  aiCommentStatus: AiCommentStatus | null;
  aiCommentErrorMessage: string | null;
  aiCommentRequestedAt: string | null;
  aiCommentCompletedAt: string | null;
}

export interface SharedDiagnosisResult extends DiagnosisResult {
  ownerNickname: string;
}

export interface ResultMajorScoreRequest {
  diagnosisResultId?: number;
  majorId?: number;
  tendencyScore?: number;
  competencyScore?: number;
  finalScore?: number;
  rank?: number;
  failed?: boolean;
}

export interface ResultMajorScore {
  id: number;
  createdAt: string;
  updatedAt: string;
  diagnosisResultId: number;
  majorId: number;
  tendencyScore: number;
  competencyScore: number;
  finalScore: number;
  rank: number;
  /** 백엔드 공동 순위를 반영한 실제 표시 순위 */
  displayRank?: number | null;
  /** 해당 표시 순위에 속한 전공 수 */
  tieCount?: number | null;
  failed: boolean;
  strengths: string | null;
  weaknesses: string | null;
  recommendationReason: string | null;
}

// 공유 API에는 점수 행 ID나 소유자의 내부 결과 ID가 포함되지 않습니다.
export type SharedResultMajorScore = Pick<
  ResultMajorScore,
  | 'majorId'
  | 'rank'
  | 'displayRank'
  | 'tieCount'
  | 'finalScore'
  | 'tendencyScore'
  | 'competencyScore'
  | 'failed'
  | 'strengths'
  | 'weaknesses'
  | 'recommendationReason'
>;