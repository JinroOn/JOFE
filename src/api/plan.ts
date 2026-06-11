import api from './axios';
import type { MajorWeeklyPlan, MajorWeeklyPlanItem, MajorWeeklyPlanRiskNote } from '../types/plan';

export const getPlan = (planId: number) =>
  api.get<MajorWeeklyPlan>(`/plans/${planId}`).then((r) => r.data);

export const getPlansByResult = (resultId: number) =>
  api.get<MajorWeeklyPlan[]>(`/plans/results/${resultId}`).then((r) => r.data);

export const getPlanItems = (planId: number) =>
  api.get<MajorWeeklyPlanItem[]>(`/plans/${planId}/items`).then((r) => r.data);

export const getPlanRiskNotes = (planId: number) =>
  api.get<MajorWeeklyPlanRiskNote[]>(`/plans/${planId}/risk-notes`).then((r) => r.data);

export const createPlan = (data: {
  diagnosisResultId: number;
  resultMajorScoreId: number;
  overview?: string;
  planId?: string;
  versionNo?: number;
  parentPlanId?: number;
  fallback?: boolean;
  activeVersion?: boolean;
}) => api.post<MajorWeeklyPlan>('/plans', data).then((r) => r.data);

export const updatePlan = (
  planId: number,
  data: {
    overview?: string;
    fallback?: boolean;
    activeVersion?: boolean;
  },
) => api.patch<MajorWeeklyPlan>(`/plans/${planId}`, data).then((r) => r.data);

export const createPlanItem = (data: {
  weeklyPlanId: number;
  weekNo: number;
  goal: string;
  tasksJson?: string;
  resourcesJson?: string;
  checkpoint?: string;
}) => api.post<MajorWeeklyPlanItem>('/plans/items', data).then((r) => r.data);

export const completePlanItem = (itemId: number) =>
  api.patch<void>(`/plans/items/${itemId}/complete`);

export const createRiskNote = (data: {
  weeklyPlanId: number;
  note: string;
}) => api.post<MajorWeeklyPlanRiskNote>('/plans/risk-notes', data).then((r) => r.data);
