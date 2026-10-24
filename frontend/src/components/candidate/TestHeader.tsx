'use client';

import { Clock, CheckCircle2 } from 'lucide-react';

interface TestHeaderProps {
    testName: string;
    timeTaken: number;
    totalQuestions: number;
    answeredCount: number;
}

export function TestHeader({ testName, timeTaken, totalQuestions, answeredCount }: TestHeaderProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center bg-white">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-800 leading-tight">Question {answeredCount} of {totalQuestions}</h1>
          <div className="flex items-center gap-4 mt-1">
             <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                  style={{ width: `${ progress }% ` }}
                />
             </div>
             <span className="text-xs font-bold text-gray-400">{progress}% Complete</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50/50 border border-blue-100">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-mono font-bold text-blue-700">
            {formatTime(timeTaken)}
          </span>
        </div>
      </div>
    </div>
  );
}
