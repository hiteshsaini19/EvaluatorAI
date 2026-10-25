'use client';

import { Clock, CloudOff, Check, Loader2 } from 'lucide-react';
import { formatClock } from '@/lib/candidate';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface TestHeaderProps {
    testName: string;
    remainingSeconds: number;
    totalQuestions: number;
    answeredCount: number;
    saveState: SaveState;
}

export function TestHeader({ testName, remainingSeconds, totalQuestions, answeredCount, saveState }: TestHeaderProps) {
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const timerClass = remainingSeconds <= 60
        ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
        : remainingSeconds <= 300
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-blue-50 border-blue-100 text-blue-700';

    return (
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-bold text-gray-800 leading-tight truncate">{testName}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-24 sm:w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{answeredCount}/{totalQuestions} answered</span>
                        <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                            {saveState === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
                            {saveState === 'saved' && <><Check className="w-3 h-3" /> Saved</>}
                            {saveState === 'error' && <span className="flex items-center gap-1 text-red-600"><CloudOff className="w-3 h-3" /> Not saved, retrying...</span>}
                        </span>
                    </div>
                    {saveState === 'error' && (
                        <div className="sm:hidden text-[11px] text-red-600 mt-1">Not saved, retrying...</div>
                    )}
                </div>

                <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border shrink-0 ${timerClass}`} title="Time remaining">
                    <Clock className="w-4 h-4" />
                    <span className="text-base sm:text-lg font-mono font-bold tabular-nums">{formatClock(remainingSeconds)}</span>
                </div>
            </div>
        </div>
    );
}
