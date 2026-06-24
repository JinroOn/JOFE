import api, { publicApi } from './axios';
import type {
  DiagnosisResult,
  DiagnosisResultRequest,
  ResultMajorScore,
  ResultMajorScoreRequest,
  SharedDiagnosisResult,
} from '../types/results';

// GET /api/results - 내 진단 결과 목록 조회
export const getDiagnosisResults = () =>
  api.get<DiagnosisResult[]>('/results').then((response) => response.data);

// POST /api/results - 진단 결과 생성
export const createDiagnosisResult = (data: DiagnosisResultRequest) =>
  api.post<DiagnosisResult>('/results', data).then((response) => response.data);

// GET /api/results/{resultId} - 진단 결과 단건 조회
export const getDiagnosisResult = (resultId: number) =>
  api.get<DiagnosisResult>(`/results/${resultId}`).then((response) => response.data);

// PATCH /api/results/{resultId} - 진단 결과 수정
export const updateDiagnosisResult = (
  resultId: number,
  data: DiagnosisResultRequest
) =>
  api
    .patch<DiagnosisResult>(`/results/${resultId}`, data)
    .then((response) => response.data);

// POST /api/results/{resultId}/ai-comment - AI 추천 설명 생성
export const generateAiComment = (resultId: number) =>
  api
    .post<DiagnosisResult>(`/results/${resultId}/ai-comment`)
    .then((response) => response.data);

// POST /api/results/diagnosis-sessions/{sessionId}/complete - 백엔드 소유 진단 결과 생성/갱신
export const completeDiagnosisResult = (sessionId: number) =>
  api
    .post<DiagnosisResult>(`/results/diagnosis-sessions/${sessionId}/complete`)
    .then((response) => response.data);

// POST /api/results/major-scores - 전공별 점수 생성
export const createResultMajorScore = (data: ResultMajorScoreRequest) =>
  api
    .post<ResultMajorScore>('/results/major-scores', data)
    .then((response) => response.data);

// GET /api/results/{resultId}/major-scores - 전공별 점수 목록 조회
export const getResultMajorScores = (resultId: number) =>
  api
    .get<ResultMajorScore[]>(`/results/${resultId}/major-scores`)
    .then((response) => response.data);

// GET /api/results/share/{shareToken} - 공유 토큰으로 진단 결과 조회 (인증 불필요)
export const getSharedDiagnosisResult = (shareToken: string) =>
  publicApi
    .get<SharedDiagnosisResult>(`/results/share/${shareToken}`)
    .then((response) => response.data);

// GET /api/results/share/{shareToken}/major-scores - 공유 토큰으로 전공별 점수 조회 (인증 불필요)
export const getSharedResultMajorScores = (shareToken: string) =>
  publicApi
    .get<ResultMajorScore[]>(`/results/share/${shareToken}/major-scores`)
    .then((response) => response.data);
