import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://52.79.202.196:8080/api',
  timeout: 5000,
});

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
