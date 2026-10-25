import axios from 'axios';
import { getToken } from './auth';

// IMPORTANT: Remove the fallback localhost URL for production
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global Interceptor for 401 Unauthorized (Session Expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip the login call itself, so a wrong password shows its error instead of reloading the page
    const isLoginRequest = error.config?.url === '/auth/login';
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API calls remain the same...
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const signup = (data: { name: string; email: string; password: string }) =>
  api.post('/auth/signup', data);

export const getMe = () => api.get('/auth/me');

export const getSubjects = () => api.get('/subjects/');

export const getQuestions = (
  page: number = 1,
  per_page: number = 10,
  filters: { subject_id?: number; group?: string; unassigned?: boolean; difficulty?: string; search?: string } = {}
) =>
  api.get('/questions/', { params: { page, per_page, ...filters } });

export const createQuestion = (data: any) =>
  api.post('/questions/', data);

export const updateQuestion = (id: number, data: any) =>
  api.put(`/questions/${id}`, data);

export const deleteQuestion = (id: number) =>
  api.delete(`/questions/${id}`);

export const getTests = () => api.get('/tests/my-tests');

export const getTest = (testCode: string) => api.get(`/tests/${testCode}`);

export interface GenerateTestPayload {
  test_name: string;
  subject_ids: number[];
  difficulties: string[];
  num_questions: number;
  duration_minutes: number;
  valid_hours?: number;
  expires_at?: string;
}

export const generateTest = (data: GenerateTestPayload) =>
  api.post('/tests/generate', data);

export const getGenerationQuota = () => api.get('/tests/generation-quota');

export const removeTestQuestion = (testId: number, questionId: string) =>
  api.delete(`/tests/${testId}/questions/${encodeURIComponent(questionId)}`);

export const deleteTest = (id: number) =>
  api.delete(`/tests/${id}`);

export const getResults = (testCode?: string) =>
  api.get('/candidates/results', { params: testCode ? { test_code: testCode } : {} });

export const getResultDetail = (id: number) =>
  api.get(`/candidates/result/${id}`);

export const deleteResult = (id: number) =>
  api.delete(`/candidates/response/${id}`);

// Candidate (public) endpoints: no login. An attempt is addressed by its random token.
export const getPublicTest = (testCode: string) =>
  api.get(`/public/tests/${testCode}`);

export const startAttempt = (testCode: string, data: { name: string; email: string }) =>
  api.post(`/public/tests/${testCode}/start`, data);

export const getAttempt = (token: string) =>
  api.get(`/public/attempts/${token}`);

export const saveAttemptAnswers = (token: string, answers: Record<string, string>) =>
  api.put(`/public/attempts/${token}/answers`, { answers });

export const submitAttempt = (token: string, answers: Record<string, string>) =>
  api.post(`/public/attempts/${token}/submit`, { answers });

export default api;
