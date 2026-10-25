'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { getAttempt, saveAttemptAnswers, submitAttempt } from '@/lib/api';
import { AttemptState, clearAttemptToken, getAttemptToken } from '@/lib/candidate';
import { TestHeader, SaveState } from '@/components/candidate/TestHeader';
import { QuestionCard } from '@/components/candidate/QuestionCard';
import { QuestionNavigator } from '@/components/candidate/QuestionNavigator';
import { SubmitPreview } from '@/components/candidate/SubmitPreview';
import { SuccessScreen } from '@/components/candidate/SuccessScreen';
import { StatusScreen } from '@/components/candidate/StatusScreen';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewState = 'loading' | 'testing' | 'review' | 'finished' | 'error';

const SAVE_RETRY_MS = 3000;
const SUBMIT_RETRIES = 4;

export default function CandidateTestPage() {
    const params = useParams();
    const router = useRouter();
    const testCode = params.candidateEvaluation as string;

    const [attempt, setAttempt] = useState<AttemptState | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [view, setView] = useState<ViewState>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [remaining, setRemaining] = useState(0);
    const [finished, setFinished] = useState<{ status: 'submitted' | 'timed_out' | 'pending'; answered: number; total: number } | null>(null);

    const tokenRef = useRef<string | null>(null);
    const answersRef = useRef<Record<string, string>>({});
    // Countdown from the server's deadline, measured with the monotonic performance clock,
    // so changing the computer's clock has no effect
    const timerRef = useRef<{ remainingAtSync: number; syncedAt: number } | null>(null);
    const saveRef = useRef({ inFlight: false, dirty: false, retry: null as ReturnType<typeof setTimeout> | null });
    const submittingRef = useRef(false);
    const warnedRef = useRef({ five: false, one: false });

    const showFinished = useCallback((state: AttemptState) => {
        // Forget the finished attempt on this device, so someone else on a shared computer can
        // start fresh. The server still blocks a second attempt with the same email.
        clearAttemptToken(testCode);
        setFinished({
            status: state.status === 'submitted' ? 'submitted' : 'timed_out',
            answered: state.answered_count,
            total: state.question_count,
        });
        setView('finished');
    }, [testCode]);

    const syncTimer = (state: { deadline: string; server_time: string }) => {
        timerRef.current = {
            remainingAtSync: (Date.parse(state.deadline) - Date.parse(state.server_time)) / 1000,
            syncedAt: performance.now(),
        };
        setRemaining(Math.max(0, timerRef.current.remainingAtSync));
    };

    const loadAttempt = useCallback(async (isResync = false) => {
        const token = tokenRef.current;
        if (!token) return;
        try {
            const res = await getAttempt(token);
            const state: AttemptState = res.data;
            if (state.status !== 'in_progress') {
                showFinished(state);
                return;
            }
            syncTimer(state);
            if (!isResync) {
                setAttempt(state);
                answersRef.current = state.answers;
                setAnswers(state.answers);
                // Resume at the first unanswered question
                const firstOpen = state.questions.findIndex(q => !state.answers[q.id]);
                setCurrentIdx(firstOpen === -1 ? 0 : firstOpen);
                setView('testing');
            }
        } catch (err: any) {
            if (isResync) return;  // Keep the local countdown; the next resync will try again
            if (err.response?.status === 404) {
                clearAttemptToken(testCode);
                router.replace(`/candidate/${testCode}`);
                return;
            }
            setErrorMessage('We couldn\'t load your test. Check your connection and try again. Your time is still running.');
            setView('error');
        }
    }, [router, testCode, showFinished]);

    // Load (or resume) the attempt
    useEffect(() => {
        tokenRef.current = getAttemptToken(testCode);
        if (!tokenRef.current) {
            router.replace(`/candidate/${testCode}`);
            return;
        }
        loadAttempt();
    }, [testCode, router, loadAttempt]);

    // Re-sync the countdown when the tab comes back (timers can pause while a laptop sleeps)
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && timerRef.current) loadAttempt(true);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [loadAttempt]);

    const doSubmit = useCallback(async () => {
        const token = tokenRef.current;
        if (!token || submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        if (saveRef.current.retry) clearTimeout(saveRef.current.retry);

        for (let tries = 0; tries <= SUBMIT_RETRIES; tries++) {
            try {
                const res = await submitAttempt(token, answersRef.current);
                showFinished(res.data);
                return;
            } catch (err: any) {
                const status = err.response?.status;
                if (status === 404) {
                    clearAttemptToken(testCode);
                    router.replace(`/candidate/${testCode}`);
                    return;
                }
                if (status && status < 500) {
                    toast.error(err.response?.data?.error || 'Could not submit your test.');
                    break;
                }
                // Network or server error: wait and try again
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const timeIsUp = timerRef.current
            ? timerRef.current.remainingAtSync - (performance.now() - timerRef.current.syncedAt) / 1000 <= 0
            : false;
        if (timeIsUp) {
            // The server closes the attempt with the saved answers on its own
            const total = attempt?.question_count ?? 0;
            setFinished({ status: 'pending', answered: Object.keys(answersRef.current).length, total });
            setView('finished');
        } else {
            toast.error('Could not submit your test. Check your connection and try again.');
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [attempt, router, testCode, showFinished]);

    // Countdown tick, time warnings and auto-submit at zero
    useEffect(() => {
        if (view !== 'testing' && view !== 'review') return;
        const tick = () => {
            const t = timerRef.current;
            if (!t) return;
            const left = Math.max(0, t.remainingAtSync - (performance.now() - t.syncedAt) / 1000);
            setRemaining(left);

            if (left <= 60 && !warnedRef.current.one) {
                warnedRef.current = { five: true, one: true };
                toast('1 minute left. Your test will submit automatically.', { icon: '⏰', duration: 6000 });
            } else if (left <= 300 && !warnedRef.current.five) {
                warnedRef.current.five = true;
                toast('5 minutes left.', { icon: '⏳', duration: 5000 });
            }
            if (left <= 0) doSubmit();
        };
        tick();
        const timer = setInterval(tick, 500);
        return () => clearInterval(timer);
    }, [view, doSubmit]);

    // Saves the latest answers. One request at a time; changes made meanwhile are sent right after.
    const saveAnswers = useCallback(async () => {
        const token = tokenRef.current;
        const s = saveRef.current;
        if (!token || submittingRef.current) return;
        if (s.inFlight) {
            s.dirty = true;
            return;
        }
        if (s.retry) {
            clearTimeout(s.retry);
            s.retry = null;
        }

        s.inFlight = true;
        setSaveState('saving');
        try {
            await saveAttemptAnswers(token, answersRef.current);
            setSaveState('saved');
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 409) {
                // Time is up or already submitted: finish with what the server has
                s.inFlight = false;
                doSubmit();
                return;
            }
            setSaveState('error');
            s.retry = setTimeout(() => saveAnswers(), SAVE_RETRY_MS);
        } finally {
            s.inFlight = false;
        }
        if (s.dirty) {
            s.dirty = false;
            saveAnswers();
        }
    }, [doSubmit]);

    const updateAnswer = (questionId: string, option: string | null) => {
        const next = { ...answersRef.current };
        if (option) next[questionId] = option; else delete next[questionId];
        answersRef.current = next;
        setAnswers(next);
        saveAnswers();
    };

    if (view === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (view === 'error') {
        return (
            <StatusScreen tone="error" title="Connection problem" message={errorMessage}>
                <button
                    onClick={() => { setView('loading'); loadAttempt(); }}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black"
                >
                    Try Again
                </button>
            </StatusScreen>
        );
    }

    if (view === 'finished' && finished) {
        return (
            <SuccessScreen
                candidateName={attempt?.candidate_name || 'there'}
                status={finished.status}
                answeredCount={finished.answered}
                totalQuestions={finished.total}
            />
        );
    }

    if (!attempt) return null;

    const questions = attempt.questions;
    const answeredCount = questions.filter(q => answers[q.id]).length;
    const timeUp = remaining <= 0;

    if (view === 'review') {
        return (
            <div className="min-h-screen bg-slate-50/50">
                <Toaster position="top-center" />
                <TestHeader
                    testName={attempt.test_name || 'Test'}
                    remainingSeconds={remaining}
                    totalQuestions={questions.length}
                    answeredCount={answeredCount}
                    saveState={saveState}
                />
                <SubmitPreview
                    candidateName={attempt.candidate_name}
                    candidateEmail={attempt.candidate_email}
                    answeredCount={answeredCount}
                    totalQuestions={questions.length}
                    remainingSeconds={remaining}
                    onReview={() => {
                        const firstOpen = questions.findIndex(q => !answers[q.id]);
                        setCurrentIdx(firstOpen === -1 ? 0 : firstOpen);
                        setView('testing');
                    }}
                    onSubmit={doSubmit}
                    isSubmitting={submitting}
                />
            </div>
        );
    }

    const currentQuestion = questions[currentIdx];
    const answeredFlags = questions.map(q => !!answers[q.id]);
    const isLast = currentIdx === questions.length - 1;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Toaster position="top-center" />
            <TestHeader
                testName={attempt.test_name || 'Test'}
                remainingSeconds={remaining}
                totalQuestions={questions.length}
                answeredCount={answeredCount}
                saveState={saveState}
            />

            {timeUp && (
                <div className="bg-red-600 text-white text-center text-sm font-semibold py-2">
                    Time is up. Submitting your answers...
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex gap-8">
                <div className="hidden lg:block">
                    <QuestionNavigator
                        totalQuestions={questions.length}
                        currentIdx={currentIdx}
                        answered={answeredFlags}
                        onSelect={setCurrentIdx}
                    />
                </div>

                <div className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
                    <div className="lg:hidden mb-4">
                        <QuestionNavigator
                            compact
                            totalQuestions={questions.length}
                            currentIdx={currentIdx}
                            answered={answeredFlags}
                            onSelect={setCurrentIdx}
                        />
                    </div>

                    <QuestionCard
                        number={currentIdx + 1}
                        total={questions.length}
                        subjectName={currentQuestion.subject}
                        questionText={currentQuestion.question}
                        options={currentQuestion.options}
                        selectedOption={answers[currentQuestion.id] || null}
                        onSelect={(option) => updateAnswer(currentQuestion.id, option)}
                        onClear={() => updateAnswer(currentQuestion.id, null)}
                        disabled={timeUp || submitting}
                    />

                    <div className="flex justify-between items-center gap-3 mt-6 sm:mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentIdx === 0}
                            className="h-11 px-4 sm:px-8 rounded-xl bg-white font-bold text-gray-500"
                        >
                            ← Previous
                        </Button>

                        <div className="flex gap-3">
                            {!isLast && (
                                <Button
                                    variant="outline"
                                    onClick={() => setView('review')}
                                    className="hidden sm:inline-flex h-11 px-6 rounded-xl font-bold text-gray-600"
                                >
                                    Finish
                                </Button>
                            )}
                            <Button
                                onClick={() => (isLast ? setView('review') : setCurrentIdx(prev => prev + 1))}
                                className="h-11 px-5 sm:px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                {isLast ? 'Review & Submit' : 'Next →'}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
