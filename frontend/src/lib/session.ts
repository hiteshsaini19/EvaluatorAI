import { getMe } from './api';
import { getToken, saveUser } from './auth';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: { id: number; role_name: string };
}

// Returns the logged-in user. Uses the copy saved at login, or fetches it from /auth/me
// (e.g. for sessions that started before the user was saved). Returns null when logged out.
export const getCurrentUser = async (): Promise<SessionUser | null> => {
  if (typeof window === 'undefined' || !getToken()) return null;

  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      return JSON.parse(stored) as SessionUser;
    } catch {
      // Fall through and refetch
    }
  }

  try {
    const res = await getMe();
    saveUser(res.data);
    return res.data as SessionUser;
  } catch {
    return null;
  }
};

export const isAdminUser = (user: SessionUser | null) => user?.role?.role_name === 'Admin';
