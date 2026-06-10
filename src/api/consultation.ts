import api from './axios';
import type { ConsultationSession, ConsultationLog } from '../types/consultation';

export const getSessions = () =>
  api.get<ConsultationSession[]>('/consultations/sessions/me').then((r) => r.data);

export const createSession = (data?: { title?: string; diagnosisResultId?: number }) =>
  api.post<ConsultationSession>('/consultations/sessions', data ?? {}).then((r) => r.data);

export const getSessionLogs = (sessionId: number) =>
  api.get<ConsultationLog[]>(`/consultations/sessions/${sessionId}/logs`).then((r) => r.data);

export const createLog = (data: { consultationSessionId: number; role: 'user' | 'assistant'; content: string }) =>
  api.post<ConsultationLog>('/consultations/logs', data).then((r) => r.data);

export const endSession = (sessionId: number) =>
  api.post<ConsultationSession>(`/consultations/sessions/${sessionId}/end`).then((r) => r.data);
