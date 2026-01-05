'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { createQuestion } from '@/lib/api';
import { AlertCircle, Upload, FileDown, CheckCircle } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    parent_category: string | null;
}

interface BulkUploadProps {
    categories: Category[];
    onUploadComplete: () => void;
}

export function BulkUpload({ categories, onUploadComplete }: BulkUploadProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const headers = ['question_text', 'category_name', 'subcategory_name', 'difficulty_level', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
        const sampleRow = ['What is SQL?', 'Database', 'SQL', 'Easy', 'Structured Query Language', 'Strong Question Language', 'Structured Question List', 'None', 'a'];
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sampleRow.join(',')].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "questions_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];

        // Simple CSV parser that handles basic quotes
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const row: string[] = [];
            let inQuote = false;
            let p = 0;
            let start = 0;

            for (let j = 0; j < line.length; j++) {
                if (line[j] === '"') {
                    inQuote = !inQuote;
                } else if (line[j] === ',' && !inQuote) {
                    row.push(line.substring(start, j).replace(/^"|"$/g, '').trim());
                    start = j + 1;
                }
            }
            row.push(line.substring(start).replace(/^"|"$/g, '').trim()); // Last column

            // Basic validation of row length against headers
            if (row.length < 1) continue;

            const obj: any = {};
            headers.forEach((h, index) => {
                if (row[index] !== undefined) obj[h] = row[index];
            });
            result.push(obj);
        }
        return result;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'info', message: 'Parsing CSV...' });
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSV(text);

                if (data.length === 0) {
                    setStatus({ type: 'error', message: 'No valid data found in CSV.' });
                    setLoading(false);
                    return;
                }

                setStatus({ type: 'info', message: `Uploading ${data.length} questions...` });

                let successCount = 0;
                let failCount = 0;

                for (const item of data) {
                    try {
                        // Logic: Find ID. item.subcategory_name takes precedence if exists.
                        let targetId = -1;

                        // 1. Try to find Exact Subcategory match
                        if (item.subcategory_name) {
                            const sub = categories.find(c =>
                                c.name.toLowerCase() === item.subcategory_name.trim().toLowerCase() &&
                                c.parent_category?.toLowerCase() === item.category_name.trim().toLowerCase()
                            );
                            if (sub) targetId = sub.id;
                        }

                        // 2. If failure, try finding Main Category
                        if (targetId === -1 && item.category_name) {
                            const main = categories.find(c => c.name.toLowerCase() === item.category_name.trim().toLowerCase());
                            if (main) targetId = main.id;
                        }

                        if (targetId === -1) {
                            console.warn(`Category not found for: ${item.category_name} / ${item.subcategory_name}`);
                            failCount++;
                            continue; // Skip execution for this item
                        }

                        // Construct payload
                        const payload = {
                            category_id: targetId,
                            question_text: item.question_text,
                            options: {
                                a: item.option_a,
                                b: item.option_b,
                                c: item.option_c,
                                d: item.option_d
                            },
                            correct_option: item.correct_answer.toLowerCase(),
                            difficulty: item.difficulty_level || 'Medium' // Default to Medium if missing
                        };

                        await createQuestion(payload);
                        successCount++;
                    } catch (err) {
                        console.error(err);
                        failCount++;
                    }
                }

                if (successCount > 0) {
                    setStatus({
                        type: successCount === data.length ? 'success' : 'info',
                        message: `Uploaded ${successCount}/${data.length} questions.` + (failCount > 0 ? ` (${failCount} failed)` : '')
                    });
                    onUploadComplete();
                } else {
                    setStatus({ type: 'error', message: `Failed to upload questions. All ${failCount} failed.` });
                }

            } catch (err) {
                console.error(err);
                setStatus({ type: 'error', message: 'Failed to process CSV' });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Bulk Import Questions</h3>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-white">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Template
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {loading ? 'Uploading...' : 'Upload CSV'}
                    <Upload className="w-4 h-4 ml-2" />
                </Button>

                {status && (
                    <div className={`flex items-center text-sm ${status.type === 'success' ? 'text-green-700' :
                            status.type === 'error' ? 'text-red-700' : 'text-blue-700'
                        }`}>
                        {status.type === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                        {status.type === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}
