import api from './axios';
import type {
  CompetencyResult,
  DiagnosisSession,
  EssayAnswer,
  ExamAnswer,
  ExamAnswerPayload,
  ExamQuestion,
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

// 전체 시험 문항 조회
export const getQuestions = () =>
  api.get<ExamQuestion[]>('/diagnoses/questions').then((r) => r.data);

// 객관식 답변 등록
export const createExamAnswer = (data: ExamAnswerPayload) =>
  api.post<ExamAnswer>('/diagnoses/exam-answers', data).then((r) => r.data);

// 역량 점수 자동 산출
export const scoreSession = (sessionId: number) =>
  api.post<CompetencyResult>(`/diagnoses/sessions/${sessionId}/score`).then((r) => r.data);

// 진단 세션 삭제 (관련 답변/결과 포함)
export const deleteSession = (sessionId: number) =>
  api.delete(`/diagnoses/sessions/${sessionId}`);

// 내 진단 세션 목록 조회
export const getDiagnosisSessions = () =>
  api.get<DiagnosisSession[]>('/diagnoses/sessions/me').then((r) => r.data);
