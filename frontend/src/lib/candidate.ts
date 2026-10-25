// Candidate attempt types and the locally saved attempt token (so a refresh resumes the test).

export interface AttemptQuestion {
  id: string;
  subject: string;
  difficulty: string;
  question: string;
  options: Record<string, string>;
}

export interface AttemptState {
  attempt_token: string;
  test_name: string | null;
  test_code: string;
  candidate_name: string;
  candidate_email: string;
  status: 'in_progress' | 'submitted' | 'timed_out';
  questions: AttemptQuestion[];
  answers: Record<string, string>;
  question_count: number;
  answered_count: number;
  duration_minutes: number;
  started_at: string;
  deadline: string;
  submitted_at: string | null;
  server_time: string;
}

export interface PublicTestInfo {
  test_name: string | null;
  test_code: string;
  subjects: string[];
  question_count: number;
  duration_minutes: number;
  expires_at: string;
  is_expired: boolean;
  server_time: string;
}

const tokenKey = (testCode: string) => `evaluatorai_attempt_${testCode}`;

export const getAttemptToken = (testCode: string): string | null => {
  try {
    return localStorage.getItem(tokenKey(testCode));
  } catch {
    return null;
  }
};

export const saveAttemptToken = (testCode: string, token: string) => {
  try {
    localStorage.setItem(tokenKey(testCode), token);
  } catch {
    // Storage blocked (e.g. private mode): the candidate can still resume by entering their email again
  }
};

export const clearAttemptToken = (testCode: string) => {
  try {
    localStorage.removeItem(tokenKey(testCode));
  } catch {
    // Ignore
  }
};

export const formatClock = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
