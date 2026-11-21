import api from './axios';
import type { Major, MajorRequest } from '../types/major';

// GET /api/majors - 전공 목록 조회
export const getMajors = () =>
  api.get<Major[]>('/majors').then((response) => response.data);

// POST /api/majors - 전공 생성
export const createMajor = (data: MajorRequest) =>
  api.post<Major>('/majors', data).then((response) => response.data);

// GET /api/majors/{majorId} - 전공 단건 조회
export const getMajor = (majorId: number) =>
  api.get<Major>(`/majors/${majorId}`).then((response) => response.data);

// PATCH /api/majors/{majorId} - 전공 수정
export const updateMajor = (majorId: number, data: MajorRequest) =>
  api.patch<Major>(`/majors/${majorId}`, data).then((response) => response.data);

// DELETE /api/majors/{majorId} - 전공 삭제
export const deleteMajor = (majorId: number) =>
  api.delete<void>(`/majors/${majorId}`).then((response) => response.data);