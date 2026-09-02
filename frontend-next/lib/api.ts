import axios from 'axios';

export const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${getBaseURL()}/api/token/refresh/`, {
                refresh: refreshToken,
              });
              const newToken = response.data.access;
              localStorage.setItem('access_token', newToken);
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              processQueue(null, newToken);
              resolve(api(originalRequest));
              return;
            }
          }
          throw new Error('No refresh token available');
        } catch (refreshError) {
          processQueue(refreshError, null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_type');
            localStorage.removeItem('is_superuser');
            localStorage.removeItem('user_id');
            window.location.href = '/login';
          }
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
