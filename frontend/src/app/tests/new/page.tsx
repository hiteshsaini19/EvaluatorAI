'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSubjects, generateTest, getGenerationQuota, GenerateTestPayload } from '@/lib/api';
import { Subject, groupSubjects } from '@/lib/subjects';
import { DIFFICULTIES, candidateLink, formatDateTime } from '@/lib/tests';
import TopNav from '@/components/TopNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, Copy, Info, Loader2, Sparkles } from 'lucide-react';

const VALIDITY_OPTIONS = [
  { value: '24', label: '1 day' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
  { value: 'custom', label: 'Custom date' },
];

interface Shortfall {
  subject: string;
  difficulty: string;
  requested: number;
  generated: number;
}

interface GeneratedTest {
  test_id: number;
  test_name: string;
  test_code: string;
  requested_questions: number;
  question_count: number;
  shortfalls: Shortfall[];
  source: 'ai' | 'bank';
}

interface GenerationQuota {
  ai_enabled: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resets_at: string | null;
  blocked_message: string | null;
}

const formatLocalTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const clampQuestions = (n: number) => Math.min(100, Math.max(5, n));

// Value for <input type="datetime-local"> (local time, no seconds)
const toLocalInputValue = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function CreateTestPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [testName, setTestName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set(DIFFICULTIES));
  const [duration, setDuration] = useState('30');
  const [numQuestions, setNumQuestions] = useState('30');
  // The question count follows the duration (one per minute) until the creator edits it
  const [numEdited, setNumEdited] = useState(false);
  const [validity, setValidity] = useState('72');
  const [customExpiry, setCustomExpiry] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [created, setCreated] = useState<GeneratedTest | null>(null);
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState<GenerationQuota | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    getSubjects()
      .then(res => setSubjects(res.data))
      .catch(() => setServerError('Failed to load subjects. Please refresh the page.'))
      .finally(() => setLoadingSubjects(false));
    getGenerationQuota()
      .then(res => setQuota(res.data))
      .catch(() => setQuota(null));  // The banner is optional; generating still works
  }, [router]);

  const groups = useMemo(() => groupSubjects(subjects), [subjects]);

  const handleDurationChange = (value: string) => {
    setDuration(value);
    const minutes = parseInt(value, 10);
    if (!numEdited && !Number.isNaN(minutes)) {
      setNumQuestions(String(clampQuestions(minutes)));
    }
  };

  const matchDurationAgain = () => {
    setNumEdited(false);
    const minutes = parseInt(duration, 10);
    if (!Number.isNaN(minutes)) setNumQuestions(String(clampQuestions(minutes)));
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupSubjectIds: number[]) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev);
      const allSelected = groupSubjectIds.every(id => next.has(id));
      groupSubjectIds.forEach(id => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleDifficulty = (difficulty: string) => {
    setDifficulties(prev => {
      const next = new Set(prev);
      if (next.has(difficulty)) next.delete(difficulty); else next.add(difficulty);
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};
    const count = Number(numQuestions);
    const minutes = Number(duration);

    if (!testName.trim()) found.testName = 'Enter a test name';
    if (selectedSubjects.size === 0) found.subjects = 'Choose at least one subject';
    if (difficulties.size === 0) found.difficulties = 'Choose at least one difficulty';

    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) {
      found.duration = 'Duration must be between 5 and 180 minutes';
    }
    if (!Number.isInteger(count) || count < 5 || count > 100) {
      found.numQuestions = 'Number of questions must be between 5 and 100';
    } else if (count < selectedSubjects.size) {
      found.numQuestions = `Choose at least ${selectedSubjects.size} questions, one for each subject`;
    }

    if (validity === 'custom') {
      const expiry = new Date(customExpiry);
      if (!customExpiry || Number.isNaN(expiry.getTime())) found.validity = 'Pick the date and time the link expires';
      else if (expiry.getTime() <= Date.now()) found.validity = 'The expiry must be in the future';
    }
    return found;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;

    const found = validate();
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;

    const payload: GenerateTestPayload = {
      test_name: testName.trim(),
      // Send in catalogue order
      subject_ids: subjects.filter(s => selectedSubjects.has(s.id)).map(s => s.id),
      difficulties: DIFFICULTIES.filter(d => difficulties.has(d)),
      num_questions: Number(numQuestions),
      duration_minutes: Number(duration),
      ...(validity === 'custom'
        ? { expires_at: new Date(customExpiry).toISOString() }
        : { valid_hours: Number(validity) }),
    };

    setGenerating(true);
    try {
      const res = await generateTest(payload);
      setCreated(res.data);
      getGenerationQuota().then(r => setQuota(r.data)).catch(() => {});
    } catch (err: any) {
      const data = err.response?.data;
      let message = data?.error || 'Failed to generate the test. Check your connection and try again.';
      if (data?.code === 'quota' && data?.retry_at) {
        message += ` (That's ${formatLocalTime(data.retry_at)} your time.)`;
        getGenerationQuota().then(r => setQuota(r.data)).catch(() => {});
      }
      setServerError(message);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard.writeText(candidateLink(created.test_code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    const short = created.question_count < created.requested_questions;
    return (
      <>
        <TopNav title="Tests" subtitle="Create Test" />
        <div className="p-8 max-w-3xl">
          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your test is ready</h2>
                  <p className="text-gray-600 mt-1">
                    <span className="font-semibold">{created.test_name}</span> has {created.question_count} questions.
                    Share the link below with your candidates.
                  </p>
                </div>
              </div>

              {short && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Only {created.question_count} of {created.requested_questions} questions could be added
                  </div>
                  <p className="mb-2">
                    {created.source === 'ai'
                      ? "The AI couldn't write enough valid questions for:"
                      : "The example question bank doesn't have enough questions for:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {created.shortfalls.map(s => (
                      <li key={`${s.subject}-${s.difficulty}`}>
                        {s.subject} ({s.difficulty}): {s.generated} of {s.requested}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate link</Label>
                <div className="flex gap-2 mt-2">
                  <Input readOnly value={candidateLink(created.test_code)} className="bg-gray-50 text-gray-600" />
                  <Button onClick={copyLink} className={`min-w-[110px] ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Share</>}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/tests/${created.test_code}`}>
                  <Button variant="outline">View questions</Button>
                </Link>
                <Link href="/tests">
                  <Button variant="ghost">Back to my tests</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav title="Tests" subtitle="Create Test" />

      <form onSubmit={handleGenerate} className="p-8 max-w-5xl space-y-6">
        <Link href="/tests" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          <ChevronLeft className="w-4 h-4" /> Back to my tests
        </Link>

        {/* Name */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <Label htmlFor="test-name" className="font-semibold">Test name</Label>
            <Input
              id="test-name"
              value={testName}
              maxLength={200}
              onChange={e => setTestName(e.target.value)}
              placeholder="e.g. Frontend Developer Screening"
            />
            {errors.testName && <p className="text-sm text-red-600">{errors.testName}</p>}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-900">Subjects</h2>
                <p className="text-sm text-gray-500">Questions are split evenly across the subjects you pick.</p>
              </div>
              <span className="text-sm text-gray-500">{selectedSubjects.size} selected</span>
            </div>

            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading subjects...</div>
            ) : (
              <div className="space-y-4">
                {groups.map(({ group, subjects: groupSubjects }) => {
                  const ids = groupSubjects.map(s => s.id);
                  const allSelected = ids.every(id => selectedSubjects.has(id));
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{group}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(ids)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {allSelected ? 'Clear' : 'Select all'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupSubjects.map(subject => {
                          const selected = selectedSubjects.has(subject.id);
                          return (
                            <button
                              key={subject.id}
                              type="button"
                              onClick={() => toggleSubject(subject.id)}
                              aria-pressed={selected}
                              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                                selected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {selected && <Check className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                              {subject.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.subjects && <p className="text-sm text-red-600">{errors.subjects}</p>}
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900">Difficulty</h2>
              <p className="text-sm text-gray-500">
                Easy questions test theory; Medium and Hard use code, queries and debugging. Pick one or more.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {DIFFICULTIES.map(d => (
                <label
                  key={d}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-colors ${
                    difficulties.has(d) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={difficulties.has(d)}
                    onChange={() => toggleDifficulty(d)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-800">{d}</span>
                </label>
              ))}
            </div>
            {errors.difficulties && <p className="text-sm text-red-600">{errors.difficulties}</p>}
          </CardContent>
        </Card>

        {/* Time and size */}
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="font-semibold">Test duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={e => handleDurationChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">How long each candidate has once they press Start (5–180).</p>
              {errors.duration && <p className="text-sm text-red-600">{errors.duration}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-questions" className="font-semibold">Number of questions</Label>
              <Input
                id="num-questions"
                type="number"
                min={5}
                max={100}
                value={numQuestions}
                onChange={e => { setNumQuestions(e.target.value); setNumEdited(true); }}
              />
              <p className="text-xs text-gray-500">
                5–100. {numEdited
                  ? <button type="button" className="text-blue-600 hover:underline" onClick={matchDurationAgain}>Match the duration again</button>
                  : 'Follows the duration (about one per minute) until you change it.'}
              </p>
              {errors.numQuestions && <p className="text-sm text-red-600">{errors.numQuestions}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold">Link validity</Label>
              <div className="flex flex-wrap gap-2">
                {VALIDITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValidity(option.value);
                      if (option.value === 'custom' && !customExpiry) {
                        setCustomExpiry(toLocalInputValue(new Date(Date.now() + 14 * 24 * 3600 * 1000)));
                      }
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      validity === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {validity === 'custom' && (
                <Input
                  type="datetime-local"
                  value={customExpiry}
                  min={toLocalInputValue(new Date())}
                  onChange={e => setCustomExpiry(e.target.value)}
                  className="max-w-xs"
                />
              )}
              <p className="text-xs text-gray-500">
                {validity === 'custom'
                  ? (customExpiry && !Number.isNaN(new Date(customExpiry).getTime())
                    ? `New candidates can start until ${formatDateTime(new Date(customExpiry).toISOString())}.`
                    : 'Pick when the link stops accepting new candidates.')
                  : 'New candidates can start until the link expires. Anyone already taking the test can still finish.'}
              </p>
              {errors.validity && <p className="text-sm text-red-600">{errors.validity}</p>}
            </div>
          </CardContent>
        </Card>

        {quota && (
          <div className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${
            quota.blocked_message ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'
          }`}>
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {!quota.ai_enabled
                ? "AI generation isn't switched on yet, so questions are picked from the example question bank."
                : quota.blocked_message
                  ? `${quota.blocked_message} You can generate more after ${quota.resets_at ? formatLocalTime(quota.resets_at) : 'midnight UTC'}.`
                  : quota.limit === null
                    ? 'Questions are written by AI. Admin accounts have no daily limit.'
                    : `Questions are written by AI. You can generate ${quota.remaining} more ${quota.remaining === 1 ? 'test' : 'tests'} today (${quota.limit} per day).`}
            </span>
          </div>
        )}

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{serverError}</div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={generating || loadingSubjects || !!quota?.blocked_message}
            className="bg-blue-600 hover:bg-blue-700 h-11 px-8 font-semibold"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {quota?.ai_enabled ? 'Generating your test… this can take up to a minute' : 'Generating your test...'}</>
              : <><Sparkles className="w-4 h-4" /> Generate Test</>}
          </Button>
          <Link href="/tests">
            <Button type="button" variant="outline" className="h-11" disabled={generating}>Cancel</Button>
          </Link>
        </div>
      </form>
    </>
  );
}
