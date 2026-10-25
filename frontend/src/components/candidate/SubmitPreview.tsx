'use client';

import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { formatClock } from '@/lib/candidate';

interface SubmitPreviewProps {
    candidateName: string;
    candidateEmail: string;
    answeredCount: number;
    totalQuestions: number;
    remainingSeconds: number;
    onReview: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function SubmitPreview({
    candidateName,
    candidateEmail,
    answeredCount,
    totalQuestions,
    remainingSeconds,
    onReview,
    onSubmit,
    isSubmitting
}: SubmitPreviewProps) {
    const unansweredCount = totalQuestions - answeredCount;

    return (
        <div className="flex items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden text-center">
                <div className="pt-10 pb-4 px-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Ready to Submit?</CardTitle>
                    <CardDescription className="text-gray-500 font-medium">
                        You can&apos;t change your answers after submitting.
                    </CardDescription>
                </div>

                <CardContent className="px-6 sm:px-10 pb-10 space-y-6">
                    <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 text-left space-y-3 text-sm">
                        <Row label="Candidate" value={candidateName} />
                        <Row label="Email" value={candidateEmail} />
                        <Row label="Answered" value={`${answeredCount}/${totalQuestions}`} />
                        <Row label="Time left" value={formatClock(remainingSeconds)} />
                    </div>

                    {unansweredCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-medium text-amber-700">
                            You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}.
                            Unanswered questions count as wrong.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={onReview}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl font-bold text-gray-600"
                        >
                            Back to questions
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Test'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-gray-400">{label}</span>
            <span className="font-black text-gray-800 truncate">{value}</span>
        </div>
    );
}
