'use client';

import { Card, CardContent } from '@/components/ui/card';

interface QuestionCardProps {
    questionText: string;
    categoryName: string;
    options: Record<string, string>;
    selectedOption: string | null;
    onSelect: (option: string) => void;
}

export function QuestionCard({
    questionText,
    categoryName,
    options,
    selectedOption,
    onSelect
}: QuestionCardProps) {
    return (
        <Card className="w-full border shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-10">
                <div className="mb-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {categoryName}
                    </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-10 leading-snug">
                    {questionText}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(options).map(([key, value]) => {
                        const isSelected = selectedOption?.toUpperCase() === key.toUpperCase();
                        return (
                            <button
                                key={key}
                                onClick={() => onSelect(key)}
                                className={`flex items-center p-5 rounded-xl border-2 text-left transition-all duration-200 group ${isSelected
                                        ? 'bg-blue-50 border-blue-600 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-blue-50/10'
                                    }`}
                            >
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-4 border-2 transition-colors ${isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-200 text-gray-400 group-hover:border-blue-200 group-hover:text-blue-500'
                                    }`}>
                                    {key.toUpperCase()}
                                </span>
                                <span className={`text-base font-medium ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                                    {value}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
