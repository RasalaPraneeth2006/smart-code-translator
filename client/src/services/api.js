import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sct_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sct_token');
      localStorage.removeItem('sct_user');
    }
    return Promise.reject(error);
  }
);

export const codeService = {
  translate: (payload) => api.post('/code/translate', payload),
  analyze: (payload) => api.post('/code/analyze', payload),
  optimize: (payload) => api.post('/code/optimize', payload),
  runCode: (payload) => api.post('/code/run', payload),
  explainError: (payload) => api.post('/code/explain-error', payload),
  getHistory: () => api.get('/history'),
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: (googlePayload) => api.post('/auth/google', googlePayload),
};

export default api;
