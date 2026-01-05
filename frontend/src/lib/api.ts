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
    if (error.response && error.response.status === 401) {
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

export const getCategories = () =>
  api.get('/categories/');

export const createCategory = (data: {
  name: string;
  description?: string;
  parent_category?: string | null;
}) =>
  api.post('/categories/', data);

export const updateCategory = (
  id: number,
  data: {
    name?: string;
    description?: string;
    parent_category?: string | null;
  }
) =>
  api.put(`/categories/${id}`, data);

export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}`);

export const getQuestions = (
  page: number = 1,
  per_page: number = 10,
  filters: { category_id?: number; parent_category?: string; difficulty?: string; search?: string } = {}
) =>
  api.get('/questions/', { params: { page, per_page, ...filters } });

export const createQuestion = (data: any) =>
  api.post('/questions/', data);

export const updateQuestion = (id: number, data: any) =>
  api.put(`/questions/${id}`, data);

export const deleteQuestion = (id: number) =>
  api.delete(`/questions/${id}`);

export const getTests = () => api.get('/tests/my-tests');

export const createTest = (data: { questions: any[] }) =>
  api.post('/tests/create', data);

export const deleteTest = (id: number) =>
  api.delete(`/tests/${id}`);

export const getResults = () => api.get('/candidates/results');

export const getCandidates = (testId?: number) =>
  api.get('/candidates/', { params: { test_id: testId } });

export const getResultDetail = (id: number) =>
  api.get(`/candidates/result/${id}`);

export const deleteResult = (id: number) =>
  api.delete(`/candidates/response/${id}`);

// Candidate Public Endpoints
export const getPublicTest = (testCode: string) =>
  api.get(`/candidates/test/${testCode}`);

export const submitTestResult = (data: {
  testId: string;
  name: string;
  email: string;
  timeTaken: number;
  answers: { questionId: string; selected: string }[];
}) => api.post('/candidates/submit', data);

export default api;