'use client';

import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage, QuestionPayload } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X } from 'lucide-react';
import { Subject, groupSubjects } from '@/lib/subjects';

export interface BankQuestion {
    id: number;
    question_text: string;
    subject_id: number | null;
    subject_name: string;
    subject_group: string | null;
    difficulty: string;
    options: Record<string, string>;
    correct_option: string;
}

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: QuestionPayload) => Promise<void>;
    subjects: Subject[];
    initialData?: BankQuestion | null;
}

const selectClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function QuestionModal({
    isOpen,
    onClose,
    onSubmit,
    subjects,
    initialData,
}: QuestionModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [subjectId, setSubjectId] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionText, setQuestionText] = useState('');

    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [optionC, setOptionC] = useState('');
    const [optionD, setOptionD] = useState('');
    const [correctOption, setCorrectOption] = useState('a');

    // Reset or Populate form when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const opts = initialData?.options || {};
        setSubjectId(initialData?.subject_id ? String(initialData.subject_id) : '');
        setQuestionText(initialData?.question_text || '');
        setDifficulty(initialData?.difficulty || 'Medium');
        setCorrectOption(initialData?.correct_option || 'a');
        setOptionA(opts.a || '');
        setOptionB(opts.b || '');
        setOptionC(opts.c || '');
        setOptionD(opts.d || '');
    }, [isOpen, initialData]);

    const groups = useMemo(() => groupSubjects(subjects), [subjects]);

    if (!isOpen) return null;

    const isUnassigned = !!initialData && initialData.subject_id === null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !questionText.trim() || !optionA.trim() || !optionB.trim()) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            // Only send filled options (C and D are optional; backend rejects empty ones)
            const options: Record<string, string> = {};
            ([['a', optionA], ['b', optionB], ['c', optionC], ['d', optionD]] as const).forEach(([key, value]) => {
                if (value.trim()) options[key] = value.trim();
            });

            if (!options[correctOption]) {
                alert(`Correct answer is Option ${correctOption.toUpperCase()}, but that option is empty.`);
                setLoading(false);
                return;
            }

            const payload = {
                subject_id: Number(subjectId),
                question_text: questionText,
                options,
                correct_option: correctOption,
                difficulty: difficulty
            };
            await onSubmit(payload);
            onClose();
        } catch (err) {
            console.error(err);
            alert(getErrorMessage(err, 'Failed to save question'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">{initialData ? 'Edit Question' : 'New Question'}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {isUnassigned && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md px-4 py-3">
                                This question has no subject yet. Choose one to save it.
                            </div>
                        )}

                        {/* Classification */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Subject *</label>
                                <select
                                    className={selectClass}
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    {groups.map(g => (
                                        <optgroup key={g.group} label={g.group}>
                                            {g.subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Difficulty</label>
                                <select
                                    className={selectClass}
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Question Text *</label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Enter the question here..."
                                required
                            />
                        </div>

                        {/* Options */}
                        <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
                            <h3 className="text-sm font-semibold text-gray-700">Answer Options</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Option A *</label>
                                    <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Option B *</label>
                                    <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Option C</label>
                                    <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Option D</label>
                                    <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Correct Answer *</label>
                            <select
                                className={`${selectClass} md:w-1/3`}
                                value={correctOption}
                                onChange={(e) => setCorrectOption(e.target.value)}
                            >
                                <option value="a">Option A</option>
                                <option value="b">Option B</option>
                                <option value="c">Option C</option>
                                <option value="d">Option D</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                {loading ? 'Saving...' : (initialData ? 'Update Question' : 'Create Question')}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
