'use client';

import { StatusScreen } from './StatusScreen';

interface SuccessScreenProps {
    candidateName: string;
    status: 'submitted' | 'timed_out' | 'pending';
    answeredCount: number;
    totalQuestions: number;
}

// Shown once the attempt is finished. 'pending' = time ran out but the final submit couldn't
// reach the server; the server closes the attempt with the saved answers on its own.
export function SuccessScreen({ candidateName, status, answeredCount, totalQuestions }: SuccessScreenProps) {
    const title = status === 'submitted' ? 'Test submitted' : 'Time is up';
    const intro = status === 'submitted'
        ? `Thank you for completing the test, ${candidateName}.`
        : status === 'timed_out'
            ? `Your time ran out, ${candidateName}, so your test was submitted automatically.`
            : `Your time ran out, ${candidateName}. We couldn't reach the server just now, but your saved answers will be submitted automatically.`;

    return (
        <StatusScreen
            tone={status === 'submitted' ? 'success' : 'warning'}
            title={title}
            message={
                <div className="space-y-3">
                    <p>{intro}</p>
                    {status !== 'pending' && (
                        <p className="font-semibold text-gray-800">You answered {answeredCount} of {totalQuestions} questions.</p>
                    )}
                    <p className="text-sm">Your answers have been recorded and shared with the person who sent you this test. You can close this window.</p>
                </div>
            }
        />
    );
}
