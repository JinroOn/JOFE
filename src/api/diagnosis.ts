import api from './axios';
import type {
  DiagnosisSession,
  EssayAnswer,
  InProgressSession,
  SessionPayload,
} from '../types/diagnosis';

// 진행 중인 내 진단 세션 조회 (없으면 null)
export const getInProgressSession = () =>
  api
    .get<InProgressSession>('/diagnoses/sessions/me/in-progress')
    .then((r) => (r.data?.session ? r.data : null))
    .catch(() => null);

// 진단 세션 생성
export const createSession = (data: SessionPayload) =>
  api.post<DiagnosisSession>('/diagnoses/sessions', data).then((r) => r.data);

// 진단 세션 수정
export const updateSession = (sessionId: number, data: SessionPayload) =>
  api.patch<DiagnosisSession>(`/diagnoses/sessions/${sessionId}`, data).then((r) => r.data);

// 서술형 답변 등록
export const createEssayAnswer = (data: {
  diagnosisSessionId: number;
  questionNo: number;
  answerText: string;
}) => api.post<EssayAnswer>('/diagnoses/essay-answers', data).then((r) => r.data);
