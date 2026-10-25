'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getTest, removeTestQuestion, getErrorMessage, getErrorStatus } from '@/lib/api';
import {
  TestDetail, candidateLink, difficultyBadgeClass, formatDateTime, formatMinutes, formatTimeLeft,
} from '@/lib/tests';
import TopNav from '@/components/TopNav';
import { FormattedText } from '@/components/FormattedText';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronLeft, Copy, Loader2, Lock, Trash2 } from 'lucide-react';

export default function TestViewPage() {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    getTest(code)
      .then(res => setTest(res.data))
      .catch(err => setError(getErrorMessage(err, 'Failed to load the test')))
      .finally(() => setLoading(false));
  }, [code, router]);

  const copyLink = () => {
    if (!test) return;
    navigator.clipboard.writeText(candidateLink(test.test_code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = async (questionId: string, position: number) => {
    if (!test) return;
    if (!confirm(`Remove question ${position} from this test? This can't be undone.`)) return;

    setRemovingId(questionId);
    try {
      await removeTestQuestion(test.id, questionId);
      setTest({
        ...test,
        questions: test.questions.filter(q => q.id !== questionId),
        question_count: test.question_count - 1,
      });
    } catch (err) {
      if (getErrorStatus(err) === 409) {
        // A candidate started in the meantime
        setTest({ ...test, is_locked: true });
      }
      alert(getErrorMessage(err, 'Failed to remove the question'));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading test...
      </div>
    );
  }

  if (error || !test) {
    return (
      <>
        <TopNav title="Tests" subtitle="View test" pageTitle={test?.test_name || "View test"} />
        <div className="p-4 sm:p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-700">
              {error || 'Test not found'}
              <div className="mt-4"><Link href="/tests" className="text-blue-600 font-medium">Back to my tests</Link></div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const onlyOneLeft = test.questions.length <= 1;

  return (
    <div className="pb-12">
      <TopNav title="Tests" subtitle="View test" pageTitle={test?.test_name || "View test"} />

      <div className="max-w-5xl mx-auto p-4 sm:px-8 sm:py-6 space-y-6">
        <Link href="/tests" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          <ChevronLeft className="w-4 h-4" /> Back to my tests
        </Link>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{test.test_name || 'Untitled test'}</h1>
                <p className="text-sm text-gray-500 mt-1">{test.subjects.join(', ')}</p>
              </div>
              {test.is_expired ? (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">Expired</span>
              ) : (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100">
                  Active · {formatTimeLeft(test.expires_at)}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Candidate link</label>
              <div className="flex gap-2">
                <Input readOnly value={candidateLink(test.test_code)} className="bg-gray-50 text-gray-600" />
                <Button onClick={copyLink} className={`min-w-[110px] ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Share</>}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
              <Stat label="Questions" value={
                test.question_count === test.num_questions
                  ? String(test.question_count)
                  : `${test.question_count} (of ${test.num_questions} requested)`
              } />
              <Stat label="Difficulty" value={test.difficulties.join(', ')} />
              <Stat label="Duration" value={formatMinutes(test.duration_minutes)} />
              <Stat label={test.is_expired ? 'Expired on' : 'Link expires'} value={formatDateTime(test.expires_at)} />
              <Stat label="Attempts" value={
                <Link href={`/results?test=${test.test_code}`} className="text-blue-600 hover:underline">{test.attempt_count}</Link>
              } />
            </div>
          </CardContent>
        </Card>

        {test.is_locked && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            Questions can no longer be removed because a candidate has started this test.
          </div>
        )}

        <div className="space-y-4">
          {test.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-bold">Q{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">{q.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${difficultyBadgeClass(q.difficulty)}`}>{q.difficulty}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={test.is_locked || onlyOneLeft || removingId !== null}
                    title={
                      test.is_locked ? 'Locked: a candidate has started this test'
                        : onlyOneLeft ? 'A test needs at least one question'
                          : 'Remove this question'
                    }
                    onClick={() => handleRemove(q.id, idx + 1)}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    {removingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Remove
                  </Button>
                </div>

                <FormattedText text={q.question} className="text-base font-semibold text-gray-900 mb-4" />

                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(q.options).map(([key, value]) => {
                    const isCorrect = key === q.answer;
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-400' : 'bg-gray-50/50 border-gray-200'}`}
                      >
                        <span className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {key}
                        </span>
                        <FormattedText text={value} className={`flex-1 text-sm pt-1 ${isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`} />
                        {isCorrect && <span className="text-green-600 text-xs font-bold uppercase pt-1.5 shrink-0">Correct</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="mt-3 text-sm text-gray-600"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}
