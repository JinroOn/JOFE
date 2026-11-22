import api, { publicApi } from './axios';
import type {
  DiagnosisResult,
  DiagnosisResultRequest,
  ResultMajorScore,
  ResultMajorScoreRequest,
  SharedDiagnosisResult,
  SharedResultMajorScore,
} from '../types/results';

export const getDiagnosisResults = () =>
  api.get<DiagnosisResult[]>('/results').then((response) => response.data);

export const createDiagnosisResult = (data: DiagnosisResultRequest) =>
  api.post<DiagnosisResult>('/results', data).then((response) => response.data);

export const getDiagnosisResult = (resultId: number) =>
  api.get<DiagnosisResult>(`/results/${resultId}`).then((response) => response.data);

export const updateDiagnosisResult = (
  resultId: number,
  data: DiagnosisResultRequest,
) =>
  api.patch<DiagnosisResult>(`/results/${resultId}`, data).then((response) => response.data);

export const generateAiComment = (resultId: number) =>
  api.post<DiagnosisResult>(`/results/${resultId}/ai-comment`).then((response) => response.data);

export const completeDiagnosisResult = (sessionId: number) =>
  api.post<DiagnosisResult>(`/results/diagnosis-sessions/${sessionId}/complete`)
    .then((response) => response.data);

export const createResultMajorScore = (data: ResultMajorScoreRequest) =>
  api.post<ResultMajorScore>('/results/major-scores', data).then((response) => response.data);

// 개인 결과: 점수 행 id를 포함합니다.
export const getResultMajorScores = (resultId: number) =>
  api.get<ResultMajorScore[]>(`/results/${resultId}/major-scores`)
    .then((response) => response.data);

export const getSharedDiagnosisResult = (shareToken: string) =>
  publicApi.get<SharedDiagnosisResult>(`/results/share/${shareToken}`)
    .then((response) => response.data);

// 공유 결과: 점수 행 id는 반환하지 않습니다.
export const getSharedResultMajorScores = (shareToken: string) =>
  publicApi.get<SharedResultMajorScore[]>(`/results/share/${shareToken}/major-scores`)
    .then((response) => response.data);
