import axios from 'axios';
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

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && useAuthStore.getState().isLoggedIn) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setSessionExpired(true);
    }
    return Promise.reject(error);
  }
);

export default instance;
