import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types/auth';
import useAuthStore from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://52.79.202.196:8080/api';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 동시에 발생한 401 요청들이 하나의 refresh 요청을 공유한다.
let refreshPromise: Promise<string> | null = null;

// 로그인, 회원가입, 비밀번호 관련 요청은 자동 갱신 대상에서 제외한다.
const isAuthRequest = (url?: string) => {
  if (!url) return false;

  const excludedPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/refresh',
    '/auth/logout',
    '/auth/email-verifications',
    '/auth/password-resets',
    '/auth/password',
  ];

  return excludedPaths.some((path) => url.includes(path));
};

// refresh 실패 시 서버 세션 정리 후 로컬 로그아웃한다.
const expireSession = async (refreshToken: string | null) => {
  if (refreshToken) {
    await publicApi
      .post('/auth/logout', { refreshToken })
      .catch(() => undefined);
  }

  const auth = useAuthStore.getState();

  auth.logout();
  auth.setSessionExpired(true);
};

// 요청마다 현재 Access Token을 헤더에 넣는다.
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    // 401이 아니거나 원래 요청 정보가 없으면 그대로 반환한다.
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // 인증 관련 요청은 자동 갱신하지 않는다.
    if (isAuthRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    const auth = useAuthStore.getState();

    if (!auth.isLoggedIn) {
      return Promise.reject(error);
    }

    // 새 Access Token으로 재요청했는데도 401이면 세션을 종료한다.
    if (originalRequest._retry) {
      await expireSession(auth.refreshToken);
      return Promise.reject(error);
    }

    const refreshToken = auth.refreshToken;

    if (!refreshToken) {
      await expireSession(null);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // 이미 갱신 중인 요청이 있으면 해당 요청의 결과를 기다린다.
      if (!refreshPromise) {
        refreshPromise = publicApi
          .post<AuthResponse>('/auth/refresh', { refreshToken })
          .then(({ data }) => {
            const currentAuth = useAuthStore.getState();

            // 갱신 중 로그아웃 또는 계정 변경이 발생했다면 토큰을 덮어쓰지 않는다.
            if (
              !currentAuth.isLoggedIn ||
              currentAuth.refreshToken !== refreshToken
            ) {
              throw new Error('로그인 상태가 변경되었습니다.');
            }

            // 새 Access Token과 Refresh Token 저장
            currentAuth.setTokens(
              data.accessToken,
              data.refreshToken
            );

            return data.accessToken;
          })
          .catch(async (refreshError) => {
            // Refresh Token 자체가 401이면 서버 로그아웃 및 로컬 로그아웃
            if (
              axios.isAxiosError(refreshError) &&
              refreshError.response?.status === 401
            ) {
              const latestRefreshToken =
                useAuthStore.getState().refreshToken ?? refreshToken;

              await expireSession(latestRefreshToken);
            }

            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      // 갱신 결과를 기다린다.
      const newAccessToken = await refreshPromise;

      // 기존 요청에 새로운 Access Token 적용
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      // 실패했던 원래 요청을 딱 한 번 다시 실행
      return instance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default instance;