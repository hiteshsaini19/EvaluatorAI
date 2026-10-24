'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail } from 'lucide-react';

interface CandidateInfoFormProps {
    onSubmit: (data: { name: string; email: string }) => void;
    loading: boolean;
    testName?: string;
}

export function CandidateInfoForm({ onSubmit, loading, testName }: CandidateInfoFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        onSubmit({ name, email });
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-2xl border-t-4 border-t-blue-600 transition-all hover:shadow-blue-100">
            <CardHeader className="text-center space-y-1">
                <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">
                    Welcome to the Test
                </CardTitle>
                <CardDescription className="text-blue-600 font-medium text-lg">
                    {testName || 'Candidate Evaluation'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="pl-10 h-12 border-gray-200 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 h-12 border-gray-200 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg active:scale-95 transition-all"
                        disabled={loading}
                    >
                        {loading ? 'Entering...' : 'Start Evaluation'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
