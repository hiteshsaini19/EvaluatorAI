'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicTest } from '@/lib/api';
import { CandidateInfoForm } from '@/components/candidate/CandidateInfoForm';
import { Loader2, AlertCircle } from 'lucide-react';

export default function CandidateEntryPage() {
    const params = useParams();
    const router = useRouter();
    const testCode = params.candidateEvaluation as string;
    const [testName, setTestName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (testCode) {
            fetchTestInfo();
        }
    }, [testCode]);

    const fetchTestInfo = async () => {
        try {
            const response = await getPublicTest(testCode);
            setTestName(response.data.test_name);
            setLoading(false);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to load test information. Please check the link.');
            setLoading(false);
        }
    };

    const handleStart = (data: { name: string; email: string }) => {
        sessionStorage.setItem('candidate_name', data.name);
        sessionStorage.setItem('candidate_email', data.email);
        router.push(`/candidate/${testCode}/start`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Preparing your assessment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Oops! Test Not Found</h1>
                    <p className="text-gray-600 leading-relaxed font-medium">
                        {error}
                    </p>
                    <div className="pt-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 selection:bg-blue-100">
            <div className="w-full">
                <CandidateInfoForm
                    onSubmit={handleStart}
                    loading={false}
                    testName={testName}
                />
            </div>
        </div>
    );
}
