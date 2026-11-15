import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send the httpOnly refresh token cookie on every request
});

// ── Request interceptor: attach the in-memory / localStorage access token ──

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: on 401, attempt a silent token refresh once ──

let isRefreshing = false;
let pendingQueue = []; // requests that arrived while a refresh was in-flight

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 responses, and never retry the refresh call itself.
    const isAuthEndpoint =
      originalRequest.url.endsWith('/auth/refresh') ||
      originalRequest.url.endsWith('/auth/login') ||
      originalRequest.url.endsWith('/auth/register') ||
      originalRequest.url.endsWith('/auth/anonymous') ||
      originalRequest.url.endsWith('/auth/google');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh resolves.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // withCredentials is set globally, so the httpOnly cookie is sent automatically.
        const { data } = await api.post('/auth/refresh');
        const newToken = data.token;

        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear local state and let the app handle the redirect.
        localStorage.removeItem('token');
        delete api.defaults.headers.common.Authorization;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
