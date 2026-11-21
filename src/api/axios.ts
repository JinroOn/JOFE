import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types/auth';
import useAuthStore from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://52-78-58-82.sslip.io/api';

const instance = axios.create({ baseURL: BASE_URL, timeout: 60000 });
export const publicApi = axios.create({ baseURL: BASE_URL, timeout: 60000 });

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _authSessionVersion?: number;
}

// 같은 로그인 세션에서 발생한 401만 하나의 갱신 요청을 공유한다.
let refreshRequest: { sessionVersion: number; promise: Promise<string> } | null = null;

const isAuthRequest = (url?: string) => [
  '/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout',
  '/auth/email-verifications', '/auth/password-resets', '/auth/password',
].some((path) => url?.includes(path));

const expireSession = (sessionVersion: number, refreshToken: string | null) => {
  const auth = useAuthStore.getState();
  if (!auth.isLoggedIn || auth.sessionVersion !== sessionVersion || auth.refreshToken !== refreshToken) return;

  // 서버 응답을 기다리지 않고 만료된 로컬 세션을 먼저 종료한다.
  auth.logout();
  auth.setSessionExpired(true);
  if (refreshToken) {
    void publicApi.post('/auth/logout', { refreshToken }).catch(() => undefined);
  }
};

instance.interceptors.request.use((config: RetryRequestConfig) => {
  const auth = useAuthStore.getState();
  if (config._authSessionVersion !== undefined && config._authSessionVersion !== auth.sessionVersion) {
    throw new Error('로그인 상태가 변경되었습니다.');
  }
  config._authSessionVersion = auth.sessionVersion;
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`;
  else delete config.headers.Authorization;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryRequestConfig | undefined;
    if (error.response?.status !== 401 || !request || isAuthRequest(request.url)) {
      return Promise.reject(error);
    }

    const auth = useAuthStore.getState();
    const sessionVersion = auth.sessionVersion;
    if (!auth.isLoggedIn || request._authSessionVersion !== sessionVersion) return Promise.reject(error);

    if (request._retry) {
      if (request.headers.Authorization === `Bearer ${auth.accessToken}`) {
        expireSession(sessionVersion, auth.refreshToken);
      }
      return Promise.reject(error);
    }
    request._retry = true;

    // 먼저 끝난 다른 요청이 이미 갱신했다면 새 refresh token을 다시 소모하지 않는다.
    if (auth.accessToken && request.headers.Authorization !== `Bearer ${auth.accessToken}`) {
      return instance(request);
    }

    const refreshToken = auth.refreshToken;
    if (!refreshToken) {
      expireSession(sessionVersion, null);
      return Promise.reject(error);
    }

    if (!refreshRequest || refreshRequest.sessionVersion !== sessionVersion) {
      const promise: Promise<string> = publicApi.post<AuthResponse>('/auth/refresh', { refreshToken })
        .then(({ data }) => {
          const current = useAuthStore.getState();
          if (!current.isLoggedIn || current.sessionVersion !== sessionVersion || current.refreshToken !== refreshToken) {
            throw new Error('로그인 상태가 변경되었습니다.');
          }
          current.setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        })
        .catch((refreshError: unknown) => {
          if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
            expireSession(sessionVersion, refreshToken);
          }
          throw refreshError;
        })
        .finally(() => {
          // 이전 로그인 세션의 완료가 새 세션의 갱신 요청을 지우지 않게 한다.
          if (refreshRequest?.promise === promise) refreshRequest = null;
        });
      refreshRequest = { sessionVersion, promise };
    }

    const accessToken = await refreshRequest.promise;
    const current = useAuthStore.getState();
    if (!current.isLoggedIn || current.sessionVersion !== sessionVersion) {
      return Promise.reject(new Error('로그인 상태가 변경되었습니다.'));
    }
    request.headers.Authorization = `Bearer ${accessToken}`;
    return instance(request);
  },
);

export default instance;
