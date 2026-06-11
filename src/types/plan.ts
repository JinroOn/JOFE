import type { AiGenerationStatus } from './result';

export interface MajorWeeklyPlan {
  id: number;
  diagnosisResultId: number;
  resultMajorScoreId: number;
  planId: string | null;
  versionNo: number;
  parentPlanId: number | null;
  overview: string | null;
  fallback: boolean;
  activeVersion: boolean;
  aiPlanStatus: AiGenerationStatus;
  aiPlanErrorMessage: string | null;
  aiPlanRequestedAt: string | null;
  aiPlanCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MajorWeeklyPlanItem {
  id: number;
  weeklyPlanId: number;
  weekNo: number;
  goal: string;
  tasksJson: string | null;
  resourcesJson: string | null;
  checkpoint: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MajorWeeklyPlanRiskNote {
  id: number;
  weeklyPlanId: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}
