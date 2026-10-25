'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicTestInfo } from '@/lib/candidate';
import { formatDateTime, formatMinutes } from '@/lib/tests';
import { User, Mail, Clock, ListChecks, CalendarClock } from 'lucide-react';

interface CandidateInfoFormProps {
    test: PublicTestInfo;
    onSubmit: (data: { name: string; email: string }) => void;
    loading: boolean;
    error?: string;
    // Shown instead of the normal title when the link has expired but someone may still resume
    resumeOnly?: boolean;
}

export function CandidateInfoForm({ test, onSubmit, loading, error, resumeOnly }: CandidateInfoFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        onSubmit({ name: name.trim(), email: email.trim() });
    };

    return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-t-4 border-t-blue-600">
            <CardHeader className="text-center space-y-1 px-5 sm:px-6">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    {resumeOnly ? 'Continue your test' : 'Welcome to the Test'}
                </CardTitle>
                <CardDescription className="text-blue-600 font-medium text-lg">
                    {test.test_name || 'Assessment'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-5 sm:px-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                        <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
                        <span><span className="font-bold">{test.question_count}</span> questions</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span><span className="font-bold">{formatMinutes(test.duration_minutes)}</span></span>
                    </div>
                    {test.subjects.length > 0 && (
                        <div className="col-span-2 bg-gray-50 rounded-lg p-3 text-gray-700">
                            <span className="font-semibold">Subjects:</span> {test.subjects.join(', ')}
                        </div>
                    )}
                    {!test.is_expired && (
                        <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500">
                            <CalendarClock className="w-4 h-4 shrink-0" />
                            This link can be started until {formatDateTime(test.expires_at)}.
                        </div>
                    )}
                </div>

                {!resumeOnly && (
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                        <li>The timer starts when you press Start and keeps running if you close the page.</li>
                        <li>Your answers are saved as you go. Reopen this link to continue.</li>
                        <li>The test submits automatically when time runs out. Unanswered questions count as wrong.</li>
                        <li>You can take this test only once.</li>
                    </ul>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                maxLength={150}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="pl-10 h-12"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 h-12"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                        disabled={loading}
                    >
                        {loading ? 'Starting...' : resumeOnly ? 'Continue' : 'Start Test'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
