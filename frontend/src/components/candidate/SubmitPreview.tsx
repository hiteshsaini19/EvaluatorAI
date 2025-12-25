'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SubmitPreviewProps {
    candidateName: string;
    candidateEmail: string;
    answeredCount: number;
    totalQuestions: number;
    onReview: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function SubmitPreview({
    candidateName,
    candidateEmail,
    answeredCount,
    totalQuestions,
    onReview,
    onSubmit,
    isSubmitting
}: SubmitPreviewProps) {
    return (
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-md shadow-2xl border-none rounded-[2rem] overflow-hidden text-center">
                <div className="pt-12 pb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 mb-2">Ready to Submit?</CardTitle>
                    <CardDescription className="text-gray-500 font-medium px-8">
                        Please review your answers before submitting
                    </CardDescription>
                </div>

                <CardContent className="px-10 pb-12 space-y-8">
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 text-left space-y-4">
                        <div className="border-b border-blue-100/30 pb-3 flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">Summary</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-bold text-gray-400">Candidate:</span>
                            <span className="text-sm font-black text-gray-800">{candidateName}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-bold text-gray-400">Email:</span>
                            <span className="text-sm font-black text-gray-800">{candidateEmail}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-bold text-gray-400">Questions Answered:</span>
                            <span className="text-sm font-black text-green-600">{answeredCount}/{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={onReview}
                            className="h-12 rounded-xl border-gray-200 font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                        >
                            Review Answers
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all active:scale-95 shadow-lg shadow-green-100"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Test'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
