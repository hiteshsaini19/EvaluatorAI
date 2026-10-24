'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    parent_category: string | null;
}

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    categories: Category[];
    initialData?: any;
}

export default function QuestionModal({
    isOpen,
    onClose,
    onSubmit,
    categories,
    initialData,
}: QuestionModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionText, setQuestionText] = useState('');

    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [optionC, setOptionC] = useState('');
    const [optionD, setOptionD] = useState('');
    const [correctOption, setCorrectOption] = useState('a');

    // Reset or Populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Formatting for Edit Mode
                setQuestionText(initialData.question_text || '');
                setDifficulty(initialData.difficulty || 'Medium');
                setCorrectOption(initialData.correct_option || 'a');
                // Options
                const opts = initialData.options || {};
                setOptionA(opts.a || '');
                setOptionB(opts.b || '');
                setOptionC(opts.c || '');
                setOptionD(opts.d || '');
                // Category Logic
                // We need to find the category object to determine if it's a parent or child
                // initialData.category_name is what we have.
                // We need to map this back to categoryId and subcategoryId state
                const catName = initialData.category_name;
                const catObj = categories.find(c => c.name === catName);
                if (catObj) {
                    if (catObj.parent_category && catObj.parent_category !== 'Main Category') {
                        // It's a subcategory
                        setCategoryId(catObj.parent_category);
                        setSubcategoryId(catObj.id.toString());
                    } else {
                        // It's a main category
                        setCategoryId(catObj.name);
                        setSubcategoryId('');
                    }
                } else {
                     // Fallback if not found
                    setCategoryId('');
                    setSubcategoryId('');
                }
            } else {
                // Reset for Create Mode
                setCategoryId('');
                setSubcategoryId('');
                setDifficulty('Medium');
                setQuestionText('');
                setOptionA('');
                setOptionB('');
                setOptionC('');
                setOptionD('');
                setCorrectOption('a');
            }
        }
    }, [isOpen, initialData, categories]);

    if (!isOpen) return null;

    // Filter Logic
    // Derive unique parent categories from both explicit parent rows and the text values in parent_category column
    const derivedParents = Array.from(new Set([
        ...categories.filter(c => !c.parent_category || c.parent_category === 'Main Category').map(c => c.name),
        ...categories.map(c => c.parent_category).filter((p): p is string => !!p && p !== 'Main Category')
    ])).sort();

    const subCategories = categoryId
        ? categories.filter(c => {
            // If the selected categoryId is a Parent Name (string), show children
            if (c.parent_category === categoryId) return true;
            // Also include the Parent itself if it exists as a row
            if (c.name === categoryId && (!c.parent_category || c.parent_category === 'Main Category')) return true;
            return false;
        })
        : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !questionText || !optionA || !optionB) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {

            let finalId = -1;

            if (subcategoryId) {
                // subcategoryId contains the ID from the value={c.id} below
                finalId = parseInt(subcategoryId);
            } else {
                // User only picked Parent. Try to find a root category with this name.
                const root = categories.find(c => c.name === categoryId && (!c.parent_category || c.parent_category === 'Main Category'));
                if (root) finalId = root.id;
            }

            if (finalId === -1) {
                alert("Invalid Category Selection. Please select a specific subcategory or a valid main category.");
                setLoading(false);
                return;
            }

            const payload = {
                category_id: finalId,
                question_text: questionText,
                options: {
                    a: optionA,
                    b: optionB,
                    c: optionC,
                    d: optionD
                },
                correct_option: correctOption,
                difficulty: difficulty
            };
            await onSubmit(payload);
            onClose();
            // Don't close here, let parent handle it if needed, but usually we close.
            // Actually the prop says Promise<void>, so we can wait.
             onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">{initialData ? 'Edit Question' : 'New Question'}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Classification */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category *</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        setSubcategoryId(''); // Reset subcategory
                                    }}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {derivedParents.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subcategory</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={subcategoryId}
                                    onChange={(e) => setSubcategoryId(e.target.value)}
                                    // Disable if no parent selected OR if parent has no children (and is not itself a category?)
                                    disabled={!categoryId || subCategories.length === 0}
                                >
                                    <option value="">Select Subcategory</option>
                                    {subCategories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {(!c.parent_category || c.parent_category === 'Main Category') ? '(Main)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Difficulty</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    <label className="text-xs font-medium uppercase text-gray-500">Option A</label>
                                    <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Option B</label>
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
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
