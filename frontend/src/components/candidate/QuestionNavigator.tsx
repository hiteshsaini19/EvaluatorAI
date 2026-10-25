'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentIdx: number;
    answered: boolean[];
    onSelect: (idx: number) => void;
    // Compact horizontal strip for phones instead of the side card
    compact?: boolean;
}

export function QuestionNavigator({ totalQuestions, currentIdx, answered, onSelect, compact }: QuestionNavigatorProps) {
    const answeredCount = answered.filter(Boolean).length;

    const buttonClass = (idx: number) => {
        const base = answered[idx]
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-gray-100 text-gray-500 border-gray-100';
        return idx === currentIdx ? `${base} ring-2 ring-blue-500 ring-offset-1` : base;
    };

    const buttons = [...Array(totalQuestions)].map((_, i) => (
        <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Question ${i + 1}${answered[i] ? ', answered' : ''}`}
            className={`w-10 h-10 shrink-0 rounded-lg border-2 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${buttonClass(i)}`}
        >
            {i + 1}
        </button>
    ));

    if (compact) {
        return <div className="flex gap-2 overflow-x-auto pb-2 px-1 pt-1">{buttons}</div>;
    }

    return (
        <Card className="w-72 shadow-md border-gray-100 h-fit sticky top-24">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
                <CardTitle className="text-sm font-bold text-gray-700">Questions</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
                <div className="flex flex-col gap-2 mb-5 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" /> Answered ({answeredCount})
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-200" /> Not answered ({totalQuestions - answeredCount})
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto p-1">{buttons}</div>
            </CardContent>
        </Card>
    );
}
