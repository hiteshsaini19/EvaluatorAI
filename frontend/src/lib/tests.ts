export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export interface TestSummary {
  id: number;
  test_name: string | null;
  test_code: string;
  subjects: string[];
  difficulties: string[];
  num_questions: number;
  question_count: number;
  duration_minutes: number;
  expires_at: string;
  is_expired: boolean;
  attempt_count: number;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  subject: string;
  difficulty: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
}

export interface TestDetail extends TestSummary {
  questions: TestQuestion[];
  is_locked: boolean;
}

export const candidateLink = (testCode: string) =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/candidate/${testCode}`;

// "3d 4h left", "5h 10m left", "12m left"
export const formatTimeLeft = (expiresAt: string, now: number = Date.now()): string => {
  const minutes = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${Math.max(1, mins)}m left`;
};

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export const difficultyBadgeClass = (difficulty: string) =>
  difficulty === 'Easy'
    ? 'bg-green-100 text-green-700'
    : difficulty === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

export type AttemptStatus = 'in_progress' | 'submitted' | 'timed_out';

export const STATUS_LABELS: Record<AttemptStatus, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  timed_out: { label: 'Timed out', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  in_progress: { label: 'In progress', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
};
