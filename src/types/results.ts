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
  failed: boolean;

  strengths: string | null;
  weaknesses: string | null;
  recommendationReason: string | null;
}