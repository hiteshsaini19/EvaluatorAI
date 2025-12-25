'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type QuestionStatus = 'answered' | 'skipped' | 'not-visited';

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentIdx: number;
    questionStatuses: Record<number, QuestionStatus>;
    onSelect: (idx: number) => void;
}

export function QuestionNavigator({
    totalQuestions,
    currentIdx,
    questionStatuses,
    onSelect
}: QuestionNavigatorProps) {
    const getStatusColor = (idx: number) => {
        if (idx === currentIdx) return 'border-blue-600 bg-white ring-2 ring-blue-100 shadow-sm';

        const status = questionStatuses[idx];
        switch (status) {
            case 'answered': return 'bg-green-500 text-white border-green-500';
            case 'skipped': return 'bg-amber-400 text-white border-amber-400';
            default: return 'bg-gray-100 text-gray-400 border-gray-100';
        }
    };

    const answeredCount = Object.values(questionStatuses).filter(s => s === 'answered').length;
    const skippedCount = Object.values(questionStatuses).filter(s => s === 'skipped').length;
    const notVisitedCount = totalQuestions - answeredCount - skippedCount;

    return (
        <Card className="w-80 shadow-md border-gray-100 h-fit sticky top-24">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
                <CardTitle className="text-sm font-bold text-gray-700">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Legend */}
                <div className="flex flex-col gap-3 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xs font-semibold text-gray-500">Answered ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-gray-500">Skipped ({skippedCount})</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                        <span className="text-xs font-semibold text-gray-500">Not visited ({notVisitedCount})</span>
                    </div>
                </div>

                {/* Navigator Grid */}
                <div className="grid grid-cols-5 gap-3">
                    {[...Array(totalQuestions)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(i)}
                            className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${getStatusColor(i)} ${i === currentIdx ? 'text-blue-600' : ''
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
