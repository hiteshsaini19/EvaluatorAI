'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';

interface SuccessScreenProps {
    candidateName: string;
    candidateEmail: string;
    timeTakenFormatted: string;
}

export function SuccessScreen({
    candidateName,
    candidateEmail,
    timeTakenFormatted
}: SuccessScreenProps) {
    return (
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-lg shadow-2xl border-none rounded-[2.5rem] overflow-hidden text-center transition-all animate-in fade-in zoom-in duration-500">
                <div className="pt-16 pb-8">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce duration-1000">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <CardTitle className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Test Submitted Successfully!</CardTitle>
                    <CardDescription className="text-gray-500 font-bold text-lg">
                        Thank you for completing the test, {candidateName}
                    </CardDescription>
                </div>

                <CardContent className="px-12 pb-16 space-y-10">
                    <div className="bg-blue-50/30 rounded-3xl p-8 border border-blue-100/50 text-left space-y-8">
                        <div className="text-center border-b border-blue-100 pb-4">
                            <span className="text-lg font-black text-blue-900">Submission Confirmed</span>
                            <p className="text-sm text-blue-600/70 font-medium mt-1 px-4">Your answers have been recorded and will be reviewed by our team.</p>
                        </div>

                        <div className="flex items-center justify-center gap-3 py-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <span className="text-base font-bold text-gray-400 uppercase tracking-widest">Time Taken: </span>
                            <span className="text-base font-black text-gray-900">{timeTakenFormatted}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-400">A confirmation email has been sent to <span className="text-gray-900">{candidateEmail}</span></p>
                            <p className="text-xs text-gray-400 font-medium">The administrator has been notified of your submission and will review your results.</p>
                        </div>
                        <p className="text-gray-900 font-black text-sm uppercase tracking-widest">You may now close this window.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
