'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAttempt, getPublicTest, startAttempt } from '@/lib/api';
import { PublicTestInfo, clearAttemptToken, getAttemptToken, saveAttemptToken } from '@/lib/candidate';
import { CandidateInfoForm } from '@/components/candidate/CandidateInfoForm';
import { StatusScreen } from '@/components/candidate/StatusScreen';
import { Loader2 } from 'lucide-react';

type Screen = 'loading' | 'form' | 'invalid' | 'expired' | 'already_attempted' | 'error';

export default function CandidateEntryPage() {
    const params = useParams();
    const router = useRouter();
    const testCode = params.candidateEvaluation as string;

    const [screen, setScreen] = useState<Screen>('loading');
    const [test, setTest] = useState<PublicTestInfo | null>(null);
    const [message, setMessage] = useState('');
    const [formError, setFormError] = useState('');
    const [starting, setStarting] = useState(false);
    // On an expired link, someone who already started can still continue with their email
    const [resumeOnExpired, setResumeOnExpired] = useState(false);

    useEffect(() => {
        if (!testCode) return;

        const load = async () => {
            // A test already started on this device: go straight back to it
            const token = getAttemptToken(testCode);
            if (token) {
                try {
                    const res = await getAttempt(token);
                    if (res.data.status === 'in_progress') {
                        router.replace(`/candidate/${testCode}/start`);
                        return;
                    }
                    // Finished: forget it and show the form; the same email is told it already took the test
                    clearAttemptToken(testCode);
                } catch (err: any) {
                    // Unknown token (e.g. the result was deleted): start fresh. Otherwise keep it and
                    // fall through; entering the same email resumes the attempt anyway.
                    if (err.response?.status === 404) clearAttemptToken(testCode);
                }
            }

            try {
                const res = await getPublicTest(testCode);
                setTest(res.data);
                setScreen(res.data.is_expired ? 'expired' : 'form');
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setScreen('invalid');
                } else {
                    setMessage('We couldn\'t load this test. Check your connection and try again.');
                    setScreen('error');
                }
            }
        };
        load();
    }, [testCode, router]);

    const handleStart = async (data: { name: string; email: string }) => {
        setStarting(true);
        setFormError('');
        try {
            const res = await startAttempt(testCode, data);
            saveAttemptToken(testCode, res.data.attempt_token);
            router.push(`/candidate/${testCode}/start`);
        } catch (err: any) {
            const code = err.response?.data?.code;
            if (code === 'already_attempted') setScreen('already_attempted');
            else if (code === 'expired') {
                setResumeOnExpired(false);
                setScreen('expired');
                if (resumeOnExpired) setMessage('No test in progress was found for this email.');
            } else if (code === 'not_found') setScreen('invalid');
            else setFormError(err.response?.data?.error || 'Could not start the test. Check your connection and try again.');
            setStarting(false);
        }
    };

    if (screen === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Preparing your test...</p>
                </div>
            </div>
        );
    }

    if (screen === 'invalid') {
        return (
            <StatusScreen
                tone="error"
                title="Test not found"
                message="This test link is invalid. Please check the link you were sent, or ask the person who sent it."
            />
        );
    }

    if (screen === 'already_attempted') {
        return (
            <StatusScreen
                tone="success"
                title="You've already taken this test"
                message="Each test can be taken only once, and your answers have been recorded. You can close this window."
            />
        );
    }

    if (screen === 'error') {
        return (
            <StatusScreen tone="error" title="Something went wrong" message={message}>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black"
                >
                    Try Again
                </button>
            </StatusScreen>
        );
    }

    if (screen === 'expired' && !resumeOnExpired) {
        return (
            <StatusScreen
                tone="warning"
                title="This link has expired"
                message={message || 'This test no longer accepts new candidates. Please contact the person who sent you the link.'}
            >
                <button
                    onClick={() => { setMessage(''); setResumeOnExpired(true); }}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                >
                    Already started this test? Continue with your email
                </button>
            </StatusScreen>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
            <CandidateInfoForm
                test={test!}
                onSubmit={handleStart}
                loading={starting}
                error={formError}
                resumeOnly={screen === 'expired'}
            />
        </div>
    );
}
