'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories, getQuestions, createTest } from '@/lib/api';
import { Loader2, Trash2, Save, ArrowLeft, ChevronDown, ChevronRight, Database, RefreshCw } from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    category_name: string;
    difficulty: string;
    options: any;
    correct_option: string;
    category_id: number;
}

interface Category {
    id: number;
    name: string;
    parent_category: string | null;
}

interface TestBuilderProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function TestBuilder({ onCancel, onSuccess }: TestBuilderProps) {
    const [categories, setCategories] = useState<Category[]>([]);
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
            const [catRes, qRes] = await Promise.all([
                getCategories(),
                getQuestions(1, 1000)
            ]);
            setCategories(catRes.data);
            setQuestions(qRes.data.items);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const derivedParents = useMemo(() => {
        const parents = new Set<string>();
        // 1. Explicit parents
        categories.filter(c => !c.parent_category || c.parent_category === 'Main Category').forEach(c => parents.add(c.name));
        // 2. Implicit parents from children
        categories.forEach(c => {
            if (c.parent_category && c.parent_category !== 'Main Category') {
                parents.add(c.parent_category);
            }
        });
        return Array.from(parents).sort();
    }, [categories]);

    // Helper to find parent for a question
    const getParentName = (q: Question) => {
        const catObj = categories.find(c => c.name === q.category_name);
        if (catObj?.parent_category && catObj.parent_category !== 'Main Category') {
            return catObj.parent_category;
        }
        // It is a root category itself
        return q.category_name;
    };

    // Group Questions by Parent -> Subcategory (or Direct)
    const groupedData = useMemo(() => {
        const data: Record<string, {
            total: number,
            subcats: Record<string, Question[]>,
            direct: Question[]
        }> = {};

        derivedParents.forEach(p => {
            data[p] = { total: 0, subcats: {}, direct: [] };
        });

        questions.forEach(q => {
            const parent = getParentName(q);
            if (!data[parent]) {
                // Should be in derivedParents, but just in case
                data[parent] = { total: 0, subcats: {}, direct: [] };
            }

            data[parent].total++;

            // Is it in a subcategory?
            // If category_name != parent, then category_name is the subcategory
            if (q.category_name !== parent) {
                if (!data[parent].subcats[q.category_name]) {
                    data[parent].subcats[q.category_name] = [];
                }
                data[parent].subcats[q.category_name].push(q);
            } else {
                data[parent].direct.push(q);
            }
        });

        return data;
    }, [questions, derivedParents, categories]);

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
                        category: { id: q.category_id, name: q.category_name },
                        question: q.question_text,
                        difficulty: q.difficulty,
                        user_id: 1 // Default fallback
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

                                        {/* Subcategories */}
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

                                        {/* Direct Questions AND Difficulty Filter (Apply to whole parent block really, but shown here) */}
                                        <div className="mt-4 mb-2">
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

                                            {/* Direct Questions List */}
                                            <div className="space-y-2">
                                                {group.direct.filter(q => currentDifficulty === 'ALL' || q.difficulty === currentDifficulty).map(q => (
                                                    <QuestionItem
                                                        key={q.id}
                                                        q={q}
                                                        selected={!!selectedQuestions.find(sq => sq.id === q.id)}
                                                        onToggle={() => toggleQuestion(q)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

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
                                            <div className="font-semibold text-gray-800 mb-1">{q.category_name}</div>
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
