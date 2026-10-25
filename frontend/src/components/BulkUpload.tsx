'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { createQuestion } from '@/lib/api';
import { Subject } from '@/lib/subjects';
import { AlertCircle, Upload, FileDown, CheckCircle } from 'lucide-react';

interface BulkUploadProps {
    subjects: Subject[];
    onUploadComplete: () => void;
}

const HEADERS = ['question_text', 'subject', 'difficulty', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const MAX_LISTED_ERRORS = 5;

export function BulkUpload({ subjects, onUploadComplete }: BulkUploadProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [rowErrors, setRowErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const sampleRow = ['What does SQL stand for?', 'SQL', 'Easy', 'Structured Query Language', 'Simple Question Language', 'Sequential Query Logic', 'Standard Query List', 'a'];
        const csvContent = "data:text/csv;charset=utf-8," + [HEADERS.join(','), sampleRow.join(',')].join('\n');
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "questions_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const result: { line: number; data: Record<string, string> }[] = [];

        // Simple CSV parser that handles basic quotes
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const row: string[] = [];
            let inQuote = false;
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

            const obj: Record<string, string> = {};
            headers.forEach((h, index) => {
                if (row[index] !== undefined) obj[h] = row[index];
            });
            result.push({ line: i + 1, data: obj });
        }
        return result;
    };

    const findSubject = (value: string | undefined) => {
        const key = (value || '').trim().toLowerCase();
        if (!key) return undefined;
        return subjects.find(s => s.name.toLowerCase() === key || s.slug === key);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'info', message: 'Parsing CSV...' });
        setRowErrors([]);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const errors: string[] = [];
            try {
                const text = e.target?.result as string;
                const rows = parseCSV(text);

                if (rows.length === 0) {
                    setStatus({ type: 'error', message: 'No valid data found in CSV.' });
                    setLoading(false);
                    return;
                }

                setStatus({ type: 'info', message: `Uploading ${rows.length} questions...` });

                let successCount = 0;

                for (const { line, data: item } of rows) {
                    const subject = findSubject(item.subject);
                    if (!subject) {
                        errors.push(`Row ${line}: unknown subject "${item.subject || ''}"`);
                        continue;
                    }

                    const difficulty = DIFFICULTIES.find(d => d.toLowerCase() === (item.difficulty || 'medium').toLowerCase());
                    if (!difficulty) {
                        errors.push(`Row ${line}: difficulty must be Easy, Medium or Hard`);
                        continue;
                    }

                    // Only send filled options (blank C/D columns are allowed)
                    const options: Record<string, string> = {};
                    (['a', 'b', 'c', 'd'] as const).forEach(key => {
                        const value = item[`option_${key}`];
                        if (value && value.trim()) options[key] = value.trim();
                    });

                    try {
                        await createQuestion({
                            subject_id: subject.id,
                            question_text: item.question_text,
                            options,
                            correct_option: (item.correct_answer || '').trim().toLowerCase(),
                            difficulty
                        });
                        successCount++;
                    } catch (err: any) {
                        errors.push(`Row ${line}: ${err.response?.data?.error || 'failed to save'}`);
                    }
                }

                const failCount = rows.length - successCount;
                setRowErrors(errors);
                if (successCount > 0) {
                    setStatus({
                        type: failCount === 0 ? 'success' : 'info',
                        message: `Uploaded ${successCount}/${rows.length} questions.` + (failCount > 0 ? ` (${failCount} failed)` : '')
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-blue-900">Bulk Import Questions</h3>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-white">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Template
                </Button>
            </div>
            <p className="text-xs text-blue-800/80 mb-4">
                Columns: {HEADERS.join(', ')}. The subject must match a subject name from the catalogue (case doesn&apos;t matter).
                Options C and D are optional.
            </p>

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
                    disabled={loading || subjects.length === 0}
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

            {rowErrors.length > 0 && (
                <ul className="mt-3 text-xs text-red-700 space-y-0.5 list-disc pl-5">
                    {rowErrors.slice(0, MAX_LISTED_ERRORS).map(err => <li key={err}>{err}</li>)}
                    {rowErrors.length > MAX_LISTED_ERRORS && (
                        <li>...and {rowErrors.length - MAX_LISTED_ERRORS} more</li>
                    )}
                </ul>
            )}
        </div>
    );
}
