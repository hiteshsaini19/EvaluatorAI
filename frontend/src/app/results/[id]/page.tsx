'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getResultDetail } from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Mail, User, FileText, Calendar, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { FormattedText } from '@/components/FormattedText';
import { AttemptStatus, STATUS_LABELS, difficultyBadgeClass, formatMinutes } from '@/lib/tests';

interface QuestionBreakdown {
    question_id: string;
    question_text: string;
    selected_option: string | null;
    correct_option: string;
    is_correct: boolean;
    options: Record<string, string>;
    difficulty: string;
    subject_name: string;
    explanation: string;
}

interface CandidateDetail {
    id: number;
    name: string;
    email: string;
    test_id: number;
    test_code: string;
    test_name: string;
    status: AttemptStatus;
    time_used: number;
    time_used_formatted: string;
    duration_minutes: number;
    total_questions: number;
    correct_answers: number;
    unanswered_count: number;
    score: number;
    started_at: string;
    submitted_at: string | null;
}

interface ResultData {
    candidate: CandidateDetail;
    responses: QuestionBreakdown[];
}

export default function ResultDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);

    const fetchDetail = async () => {
        try {
            const response = await getResultDetail(Number(id));
            setData(response.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch result details');
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50/30">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <span className="mt-4 text-gray-600 font-medium animate-pulse">Analyzing results...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-800">Error Loading Details</h2>
                        <p className="text-red-600 mt-2">{error || "Could not find the requested result."}</p>
                        <Button className="mt-6 bg-red-600 hover:bg-red-700" onClick={() => router.push('/results')}>
                            Go Back to Results
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { candidate, responses } = data;

    const status = STATUS_LABELS[candidate.status];
    const inProgress = candidate.status === 'in_progress';

    // Group responses by subject, keeping the question numbers from the test
    const groupedResponses = responses.reduce((acc, curr, idx) => {
        if (!acc[curr.subject_name]) {
            acc[curr.subject_name] = [];
        }
        acc[curr.subject_name].push({ ...curr, number: idx + 1 });
        return acc;
    }, {} as Record<string, (QuestionBreakdown & { number: number })[]>);

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'bg-green-50 text-green-700 border-green-200';
        if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    const getStatusText = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Average';
        return 'Poor';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4">
                <Link
                    href="/results"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold text-sm transition-all group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Back to Results
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Result Details</h1>
            </div>

            {/* Candidate Information & Score Summary */}
            <Card className="border-gray-200 shadow-xl overflow-hidden rounded-2xl bg-white">
                <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0">
                        {/* Left: Info */}
                        <div className="md:col-span-2 p-8 space-y-8">
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    Candidate Information
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                                        <p className="text-base font-bold text-gray-900">{candidate.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                        <p className="text-base font-medium text-gray-600 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {candidate.email}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ring-1 ring-inset ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Unanswered</p>
                                        <p className="text-base font-bold text-gray-900">
                                            {candidate.unanswered_count} of {candidate.total_questions}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Started At</p>
                                        <p className="text-base font-medium text-gray-600 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {formatDate(candidate.started_at)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Finished At</p>
                                        <p className="text-base font-medium text-gray-600 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {candidate.submitted_at ? formatDate(candidate.submitted_at) : 'Not yet'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Time Used</p>
                                        <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {candidate.time_used_formatted}
                                            <span className="text-sm font-medium text-gray-500">of {formatMinutes(candidate.duration_minutes)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-8 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Test ID:</span>
                                    <code className="bg-gray-50 px-3 py-1 rounded border border-gray-100 text-gray-500 font-mono text-[13px] shadow-sm">
                                        {candidate.test_code}
                                    </code>
                                </div>
                                {candidate.test_name && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Test:</span>
                                        <span className="text-sm font-medium text-gray-600">{candidate.test_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Score Card */}
                        <div className="bg-gray-50/50 p-8 flex items-center justify-center border-l border-gray-100">
                            <div className={`w-full max-w-[280px] aspect-square rounded-3xl border-2 flex flex-col items-center justify-center shadow-lg transition-all hover:scale-[1.02] ${getScoreColor(candidate.score)}`}>
                                <span className="text-[13px] font-bold uppercase tracking-[0.2em] mb-2">{inProgress ? 'Score so far' : 'Final Score'}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-6xl font-black">{candidate.correct_answers}</span>
                                    <span className="text-3xl font-bold opacity-40">/ {candidate.total_questions}</span>
                                </div>
                                <span className="text-4xl font-black mt-2">{candidate.score}%</span>
                                <div className="mt-6 px-6 py-1.5 rounded-full bg-white/50 backdrop-blur-sm shadow-sm border border-white/40">
                                    <span className="text-sm font-extrabold uppercase tracking-widest">{inProgress ? 'In progress' : getStatusText(candidate.score)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Sections */}
            <div className="space-y-12">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                    <FileText className="w-7 h-7 text-blue-500" />
                    Question-by-Question Analysis
                </h2>

                {Object.entries(groupedResponses).map(([category, qs]) => (
                    <div key={category} className="space-y-6">
                        <div className="bg-blue-600 rounded-t-xl px-6 py-4 flex justify-between items-center shadow-md">
                            <h3 className="text-white font-black text-xl tracking-tight">{category}</h3>
                            <span className="bg-white/20 text-white text-[12px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                {qs.length} questions
                            </span>
                        </div>

                        <div className="space-y-4">
                            {qs.map((q) => (
                                <Card key={q.question_id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden bg-white">
                                    <CardContent className="p-0">
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-4">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500">
                                                        Q{q.number}
                                                    </span>
                                                    <div className="min-w-0 space-y-2">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${difficultyBadgeClass(q.difficulty)}`}>{q.difficulty}</span>
                                                        <FormattedText text={q.question_text} className="text-lg font-bold text-gray-900 leading-snug" />
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 ${q.is_correct ? 'bg-green-50 text-green-700' : q.selected_option ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {q.is_correct ? <CheckCircle2 className="w-4 h-4" /> : q.selected_option ? <XCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                                                    {q.is_correct ? 'Correct' : q.selected_option ? 'Incorrect' : 'Not answered'}
                                                </div>
                                            </div>

                                            {/* Selected vs Correct Summary */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Candidate Selected</p>
                                                    {q.selected_option ? (
                                                        <p className="text-sm font-bold text-gray-900">
                                                            <span className={`inline-flex w-5 h-5 items-center justify-center rounded-sm mr-2 ${q.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>{q.selected_option}</span>
                                                            {q.options[q.selected_option]}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-500 italic">Not answered</p>
                                                    )}
                                                </div>
                                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correct Answer</p>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        <span className="inline-flex w-5 h-5 items-center justify-center rounded-sm bg-green-100 text-green-700 mr-2">{q.correct_option}</span>
                                                        {q.options[q.correct_option]}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Options List */}
                                            <div className="space-y-2 pt-2">
                                                {Object.entries(q.options).map(([key, value]) => {
                                                    const isSelected = q.selected_option === key;
                                                    const isCorrect = q.correct_option === key;

                                                    let bgColor = 'bg-gray-50/50 border-transparent';
                                                    let textColor = 'text-gray-600';

                                                    if (isCorrect) {
                                                        bgColor = 'bg-green-50 border-green-200 ring-1 ring-green-100';
                                                        textColor = 'text-green-900';
                                                    } else if (isSelected && !isCorrect) {
                                                        bgColor = 'bg-red-50 border-red-200 ring-1 ring-red-100';
                                                        textColor = 'text-red-900';
                                                    }

                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`p-3 rounded-xl border transition-all flex items-center gap-4 ${bgColor}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isCorrect ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                                                                (isSelected && !isCorrect) ? 'bg-red-500 text-white shadow-lg shadow-red-200' :
                                                                    'bg-white text-gray-400 shadow-sm'
                                                                }`}>
                                                                {key}
                                                            </div>
                                                            <div className="flex-grow min-w-0">
                                                                <FormattedText text={value} className={`text-sm font-bold ${textColor}`} />
                                                                <div className="flex gap-2.5 mt-0.5">
                                                                    {isCorrect && (
                                                                        <span className="text-[10px] font-black text-green-600 flex items-center gap-1 uppercase tracking-wider">
                                                                            <CheckCircle2 className="w-3 h-3" /> Correct Answer
                                                                        </span>
                                                                    )}
                                                                    {isSelected && (
                                                                        <span className={`text-[10px] font-black flex items-center gap-1 uppercase tracking-wider ${isCorrect ? 'text-green-600' : 'text-red-600'
                                                                            }`}>
                                                                            <User className="w-3 h-3" /> Candidate's Answer
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {q.explanation && (
                                                <p className="text-sm text-gray-600"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
