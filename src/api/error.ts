import type { ApiErrorResponse } from '../types/api';

export const getApiErrorResponse = (error: unknown): ApiErrorResponse | null => {
  if (typeof error !== 'object' || error === null) return null;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data !== 'object' || data === null) return null;

  return data as ApiErrorResponse;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const response = getApiErrorResponse(error);

  if (response?.message) return response.message;
  if (error instanceof Error) return error.message;

  return fallback;
};