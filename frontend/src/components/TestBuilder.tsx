'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubjects, getQuestions, createTest } from '@/lib/api';
import { Subject } from '@/lib/subjects';
import { Loader2, ChevronRight, RefreshCw } from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    subject_id: number | null;
    subject_name: string;
    subject_group: string | null;
    difficulty: string;
    options: any;
    correct_option: string;
}

interface TestBuilderProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function TestBuilder({ onCancel, onSuccess }: TestBuilderProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [testName, setTestName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State for Accordions
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
    const [expandedSubcats, setExpandedSubcats] = useState<Set<string>>(new Set());

    // Difficulty filters per Parent Category (parentName -> difficulty)
    // 'ALL' | 'Easy' | 'Medium' | 'Hard'
    const [difficultyFilters, setDifficultyFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            setLoading(true);
            const [subjectRes, qRes] = await Promise.all([
                getSubjects(),
                getQuestions(1, 1000)
            ]);
            setSubjects(subjectRes.data);
            // Unassigned questions (no subject) can't go into a test
            setQuestions(qRes.data.items.filter((q: Question) => q.subject_id !== null));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Subject groups in catalogue order (e.g. Aptitude, CS Fundamentals, ...)
    const derivedParents = useMemo(
        () => Array.from(new Set(subjects.map(s => s.group_name))),
        [subjects]
    );

    // Group Questions by Subject group -> Subject, keeping catalogue order
    const groupedData = useMemo(() => {
        const data: Record<string, {
            total: number,
            subcats: Record<string, Question[]>,
        }> = {};

        derivedParents.forEach(group => {
            data[group] = { total: 0, subcats: {} };
            subjects.filter(s => s.group_name === group).forEach(s => {
                data[group].subcats[s.name] = [];
            });
        });

        questions.forEach(q => {
            const group = q.subject_group as string;
            if (!data[group]) return;
            data[group].total++;
            (data[group].subcats[q.subject_name] ??= []).push(q);
        });

        // Hide subjects that have no questions
        Object.values(data).forEach(group => {
            Object.keys(group.subcats).forEach(name => {
                if (group.subcats[name].length === 0) delete group.subcats[name];
            });
        });

        return data;
    }, [questions, derivedParents, subjects]);

    const toggleQuestion = (q: Question) => {
        if (selectedQuestions.find(sq => sq.id === q.id)) {
            setSelectedQuestions(prev => prev.filter(sq => sq.id !== q.id));
        } else {
            setSelectedQuestions(prev => [...prev, q]);
        }
    };

    const toggleParent = (name: string) => {
        const newSet = new Set(expandedParents);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setExpandedParents(newSet);
    };

    const toggleSubcat = (name: string) => {
        const newSet = new Set(expandedSubcats);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setExpandedSubcats(newSet);
    };

    const setDifficulty = (parent: string, diff: string) => {
        setDifficultyFilters(prev => ({ ...prev, [parent]: diff }));
    };

    const handleCreate = async () => {
        if (!testName.trim()) {
            alert('Please enter a test name');
            return;
        }
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                test_name: testName,
                questions: selectedQuestions.map(q => {
                    return {
                        question_id: q.id,
                        answer: q.correct_option,
                        options: q.options,
                        // Snapshot keeps the "category" key; it now holds the subject
                        category: { id: q.subject_id as number, name: q.subject_name },
                        question: q.question_text,
                        difficulty: q.difficulty,
                        user_id: 1 // Not used by the backend; the test owner comes from the login token
                    };
                })

            };

            await createTest(payload);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create test');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Database & Selection */}
            <div className="flex-1 flex flex-col min-w-0 bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Select Questions</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        <Button variant="outline" size="sm" onClick={init} className="h-7 text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">


                    {/* Parents List */}
                    {derivedParents.map(parent => {
                        const group = groupedData[parent];
                        if (group.total === 0) return null; // Skip empty parents

                        const isExpanded = expandedParents.has(parent);
                        const currentDifficulty = difficultyFilters[parent] || 'ALL';

                        return (
                            <div key={parent} className="border rounded-md overflow-hidden">
                                {/* Parent Header */}
                                <div
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 bg-white transition-colors"
                                    onClick={() => toggleParent(parent)}
                                >
                                    <div className="flex items-center font-semibold text-gray-800">
                                        <span className={`transform transition-transform mr-2 ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
                                        {parent}
                                    </div>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{group.total} questions</span>
                                </div>

                                {/* Content */}
                                {isExpanded && (
                                    <div className="border-t bg-gray-50/30 p-3">

                                        {/* Difficulty filter (applies to every subject in this group) */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Difficulty:</span>
                                            {['ALL', 'Easy', 'Medium', 'Hard'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={(e) => { e.stopPropagation(); setDifficulty(parent, d); }}
                                                    className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors ${
                                                        currentDifficulty === d
                                                            ? d === 'ALL'
                                                                ? 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-300'
                                                                : d === 'Easy'
                                                                ? 'bg-green-100 text-green-800 border-green-300 ring-1 ring-green-300'
                                                                : d === 'Medium'
                                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-1 ring-yellow-300'
                                                                : 'bg-red-100 text-red-800 border-red-300 ring-1 ring-red-300'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {d.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Subjects */}
                                        {Object.keys(group.subcats).map(subcat => {
                                            const subQs = group.subcats[subcat].filter(q => currentDifficulty === 'ALL' || q.difficulty === currentDifficulty);
                                            const subExpanded = expandedSubcats.has(subcat);

                                            return (
                                                <div key={subcat} className="mb-2 ml-2 border-l-2 border-gray-200 pl-2">
                                                    <div
                                                        className="flex items-center justify-between py-2 cursor-pointer hover:text-blue-600 text-sm font-medium text-gray-700"
                                                        onClick={() => toggleSubcat(subcat)}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className={`transform transition-transform mr-1 ${subExpanded ? 'rotate-90' : ''}`}>
                                                                <ChevronRight className="w-3 h-3" />
                                                            </span>
                                                            {subcat}
                                                        </div>
                                                        <span className="text-xs text-gray-400">{subQs.length} questions</span>
                                                    </div>

                                                    {subExpanded && (
                                                        <div className="space-y-2 mt-1 pl-4">
                                                            {subQs.map(q => (
                                                                <QuestionItem
                                                                    key={q.id}
                                                                    q={q}
                                                                    selected={!!selectedQuestions.find(sq => sq.id === q.id)}
                                                                    onToggle={() => toggleQuestion(q)}
                                                                />
                                                            ))}
                                                            {subQs.length === 0 && <div className="text-xs text-gray-400 italic">No questions match filters</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Column: Sticky Summary */}
            <div className="w-[350px] shrink-0">
                <div className="sticky top-6">
                    <Card className="shadow-lg border-t-4 border-t-blue-600">
                        <CardHeader className="pb-4 border-b bg-gray-50/50">
                            <CardTitle className="text-lg text-gray-800">Test Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            {/* Test Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Test Name (Optional)</label>
                                <Input
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    placeholder="e.g., JavaScript Basics Test"
                                    className="h-10"
                                />
                            </div>

                            {/* Count Banner */}
                            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-center">
                                <div className="text-blue-700 font-bold text-lg">{selectedQuestions.length} Questions Selected</div>
                            </div>

                            {/* Selected Questions List */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Selected Questions:</label>
                                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scroll">
                                    {selectedQuestions.map(q => (
                                        <div key={q.id} className="group relative bg-white p-2 rounded border hover:shadow-sm transition-shadow text-xs">
                                            <div className="font-semibold text-gray-800 mb-1">{q.subject_name}</div>
                                            <div className="text-gray-600 line-clamp-2 pr-6" title={q.question_text}>{q.question_text}</div>
                                            <button
                                                onClick={() => toggleQuestion(q)}
                                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    {selectedQuestions.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded border border-dashed">
                                            No questions selected
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 pt-2">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 font-semibold h-11"
                                    onClick={handleCreate}
                                    disabled={isSubmitting || selectedQuestions.length === 0}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Create Test
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 hover:bg-gray-50"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function QuestionItem({ q, selected, onToggle }: { q: Question, selected: boolean, onToggle: () => void }) {
    return (
        <div
            onClick={onToggle}
            className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${selected
                ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
        >
            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}>
                {selected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 leading-relaxed font-medium">
                    {q.question_text}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Answer: {q.correct_option}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                        }`}>
                        {q.difficulty}
                    </span>
                </div>
            </div>
        </div>
    );
}
