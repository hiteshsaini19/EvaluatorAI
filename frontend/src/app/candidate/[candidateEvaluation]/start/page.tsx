'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicTest, submitTestResult } from '@/lib/api';
import { TestHeader } from '@/components/candidate/TestHeader';
import { QuestionCard } from '@/components/candidate/QuestionCard';
import { QuestionNavigator, QuestionStatus } from '@/components/candidate/QuestionNavigator';
import { SubmitPreview } from '@/components/candidate/SubmitPreview';
import { SuccessScreen } from '@/components/candidate/SuccessScreen';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Question {
    question_id: number;
    question: string;
    options: Record<string, string>;
    difficulty: string;
    category_name: string;
}

type ViewState = 'testing' | 'preview' | 'success';

export default function CandidateTestPage() {
    const params = useParams();
    const router = useRouter();
    const testCode = params.candidateEvaluation as string;

    const [test, setTest] = useState<{ test_name: string; questions: Question[] } | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [view, setView] = useState<ViewState>('testing');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0);

    const candidateName = useRef<string | null>(null);
    const candidateEmail = useRef<string | null>(null);

    useEffect(() => {
        candidateName.current = sessionStorage.getItem('candidate_name');
        candidateEmail.current = sessionStorage.getItem('candidate_email');

        if (!candidateName.current || !candidateEmail.current) {
            router.push(`/candidate/${testCode}`);
            return;
        }

        fetchTest();
    }, [testCode, router]);

    useEffect(() => {
        if (view === 'testing') {
            const timer = setInterval(() => {
                setTimeTaken(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [view]);

    const fetchTest = async () => {
        try {
            const response = await getPublicTest(testCode);
            setTest(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            router.push(`/candidate/${testCode}`);
        }
    };

    const handleSelect = (option: string) => {
        const questionId = test!.questions[currentIdx].question_id;
        setAnswers(prev => ({ ...prev, [questionId]: option }));
        setQuestionStatuses(prev => ({ ...prev, [currentIdx]: 'answered' }));
    };

    const handleSkip = () => {
        if (!questionStatuses[currentIdx]) {
            setQuestionStatuses(prev => ({ ...prev, [currentIdx]: 'skipped' }));
        }
        if (currentIdx < test!.questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            setView('preview');
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                testId: testCode,
                name: candidateName.current!,
                email: candidateEmail.current!,
                timeTaken: timeTaken,
                answers: test!.questions.map(q => ({
                    questionId: q.question_id.toString(),
                    selected: answers[q.question_id] || ''
                }))
            };

            await submitTestResult(payload);
            setView('success');
            // Cleanup happens in SuccessScreen use effect or here
            sessionStorage.removeItem('candidate_name');
            sessionStorage.removeItem('candidate_email');
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to submit test.');
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

  if (loading || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (view === 'success') {
    return (
      <SuccessScreen 
        candidateName={candidateName.current!}
        candidateEmail={candidateEmail.current!}
        timeTakenFormatted={formatTime(timeTaken)}
      />
    );
  }

  if (view === 'preview') {
    return (
      <SubmitPreview 
        candidateName={candidateName.current!}
        candidateEmail={candidateEmail.current!}
        answeredCount={Object.keys(answers).length}
        totalQuestions={test.questions.length}
        onReview={() => {
           setCurrentIdx(0);
           setView('testing');
        }}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    );
  }

  const currentQuestion = test.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <TestHeader 
        testName={test.test_name} 
        timeTaken={timeTaken} 
        totalQuestions={test.questions.length}
        answeredCount={answeredCount}
      />

      <main className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Left: Navigator */}
        <div className="hidden lg:block">
          <QuestionNavigator 
            totalQuestions={test.questions.length}
            currentIdx={currentIdx}
            questionStatuses={questionStatuses}
            onSelect={(idx) => {
               if (!questionStatuses[currentIdx] && !answers[test.questions[currentIdx].question_id]) {
                  setQuestionStatuses(prev => ({ ...prev, [currentIdx]: 'not-visited' }));
               }
               setCurrentIdx(idx);
            }}
          />
        </div>

        {/* Center: Question */}
        <div className="flex-1 max-w-3xl">
          <QuestionCard
            categoryName={currentQuestion.category_name}
            questionText={currentQuestion.question}
            options={currentQuestion.options}
            selectedOption={answers[currentQuestion.question_id] || null}
            onSelect={handleSelect}
          />

          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="h-11 px-8 rounded-xl border bg-white font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              ← Previous
            </Button>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="h-11 px-8 rounded-xl border border-amber-200 text-amber-600 font-bold hover:bg-amber-50"
              >
                Skip
              </Button>
              
              <Button
                onClick={() => {
                  if (currentIdx < test.questions.length - 1) {
                    setCurrentIdx(prev => prev + 1);
                  } else {
                    setView('preview');
                  }
                }}
                className="h-11 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100"
              >
                {currentIdx === test.questions.length - 1 ? 'Review Answers' : 'Next Question'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
