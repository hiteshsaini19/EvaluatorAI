'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FormattedText } from '@/components/FormattedText';

interface QuestionCardProps {
    number: number;
    total: number;
    questionText: string;
    subjectName: string;
    options: Record<string, string>;
    selectedOption: string | null;
    onSelect: (option: string) => void;
    onClear: () => void;
    disabled?: boolean;
}

export function QuestionCard({
    number,
    total,
    questionText,
    subjectName,
    options,
    selectedOption,
    onSelect,
    onClear,
    disabled,
}: QuestionCardProps) {
    return (
        <Card className="w-full border shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-5 sm:p-10">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {subjectName}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">Question {number} of {total}</span>
                </div>

                <FormattedText text={questionText} className="text-lg sm:text-xl font-bold text-gray-900 mb-8 leading-snug" />

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {Object.entries(options).map(([key, value]) => {
                        const isSelected = selectedOption === key;
                        return (
                            <button
                                key={key}
                                onClick={() => onSelect(key)}
                                disabled={disabled}
                                className={`flex items-start p-4 sm:p-5 rounded-xl border-2 text-left transition-all duration-200 group disabled:cursor-not-allowed ${isSelected
                                    ? 'bg-blue-50 border-blue-600 shadow-sm'
                                    : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-blue-50/10'
                                    }`}
                            >
                                <span className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-full text-sm font-bold mr-4 border-2 transition-colors ${isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-400 group-hover:border-blue-200 group-hover:text-blue-500'
                                    }`}>
                                    {key}
                                </span>
                                <FormattedText
                                    text={value}
                                    className={`flex-1 min-w-0 pt-1 text-base ${isSelected ? 'text-blue-900 font-semibold' : 'text-gray-700 font-medium'}`}
                                />
                            </button>
                        );
                    })}
                </div>

                {selectedOption && !disabled && (
                    <button onClick={onClear} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
                        Clear my answer
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
