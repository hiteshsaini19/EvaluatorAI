import axios, { AxiosError } from 'axios';
import { getToken, removeToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

declare module 'axios' {
  interface AxiosRequestConfig {
    // Requests that are slow by nature (AI generation) don't trigger the "waking up" notice
    skipWakeNotice?: boolean;
    wakeTimer?: ReturnType<typeof setTimeout>;
    wakeCounted?: boolean;
  }
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- "Waking up the server" notice ----
// The free backend sleeps when idle and takes up to a minute to wake. Any request still
// pending after WAKE_NOTICE_MS counts as slow, and the notice shows while one is pending.
const WAKE_NOTICE_MS = 5000;
let slowRequests = 0;
const wakeListeners = new Set<() => void>();

const setSlowRequests = (change: number) => {
  slowRequests = Math.max(0, slowRequests + change);
  wakeListeners.forEach(listener => listener());
};

export const subscribeServerWaking = (listener: () => void) => {
  wakeListeners.add(listener);
  return () => { wakeListeners.delete(listener); };
};

export const isServerWaking = () => slowRequests > 0;

const finishRequest = (config?: { wakeTimer?: ReturnType<typeof setTimeout>; wakeCounted?: boolean }) => {
  if (!config) return;
  clearTimeout(config.wakeTimer);
  if (config.wakeCounted) {
    config.wakeCounted = false;
    setSlowRequests(-1);
  }
};

// Add the token to all requests, and start the slow-request timer
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.skipWakeNotice && typeof window !== 'undefined') {
    config.wakeTimer = setTimeout(() => {
      config.wakeCounted = true;
      setSlowRequests(1);
    }, WAKE_NOTICE_MS);
  }
  return config;
});

// Session expiry: a 401 anywhere except the login call itself logs the user out
api.interceptors.response.use(
  (response) => {
    finishRequest(response.config);
    return response;
  },
  (error: AxiosError) => {
    finishRequest(error.config);
    const isLoginRequest = error.config?.url === '/auth/login';
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Error helpers ----
interface ApiErrorBody {
  error?: string;
  code?: string;
  detail?: string | { error?: string };
  retry_at?: string;
}

export const getErrorBody = (err: unknown): ApiErrorBody | undefined =>
  axios.isAxiosError(err) ? (err.response?.data as ApiErrorBody | undefined) : undefined;

export const getErrorStatus = (err: unknown): number | undefined =>
  axios.isAxiosError(err) ? err.response?.status : undefined;

export const getErrorCode = (err: unknown): string | undefined => getErrorBody(err)?.code;

// The message to show for a failed request: the API's own message, a network message, or the fallback
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err) && !err.response) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const body = getErrorBody(err);
  if (body?.error) return body.error;
  if (typeof body?.detail === 'string') return body.detail;
  if (body?.detail && typeof body.detail === 'object' && body.detail.error) return body.detail.error;
  return fallback;
};

export interface QuestionPayload {
  subject_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  difficulty: string;
}

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

export const createQuestion = (data: QuestionPayload) =>
  api.post('/questions/', data);

export const updateQuestion = (id: number, data: QuestionPayload) =>
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
  api.post('/tests/generate', data, { skipWakeNotice: true });

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
