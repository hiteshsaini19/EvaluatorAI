'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserRole } from '@/lib/auth';
import { getTests, deleteTest } from '@/lib/api';
import { TestBuilder } from '@/components/TestBuilder';
import TopNav from '@/components/TopNav';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Trash2, ExternalLink } from 'lucide-react';

interface Test {
  id: number;
  test_name?: string;
  test_code: string;
  questions_data: any[];
  candidate_count?: number;
  created_at: string;
}

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Strict Auth Check
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUserRole(getUserRole());
    if (view === 'list') {
      fetchTests();
    }
  }, [view, router]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await getTests();
      setTests(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteTest(id);
      fetchTests();
    } catch (e) { alert('Failed to delete'); }
  };

  const copyLink = (testCode: string) => {
  const link = `${window.location.origin}/candidate/${testCode}`;
  navigator.clipboard.writeText(link);
  
  // Set the copied state
  setCopiedCode(testCode);
  
  // Reset after 2 seconds
  setTimeout(() => {
    setCopiedCode(null);
  }, 2000);
};

  const isCreator = userRole === 'Creator';

  if (view === 'create') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <TopNav title="Tests" subtitle="Create New Test" />
        <div className="p-8">
          <TestBuilder onCancel={() => setView('list')} onSuccess={() => setView('list')} />
        </div>
      </div>
    );
  }

  if (view === 'preview' && selectedTest) {
    return (
      <div className="bg-gray-50 min-h-screen pb-12">
        <TopNav title="Tests" subtitle="Manage your interview platform" />

        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => setView('list')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
          >
            ← Back to Tests
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Preview</h1>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 border-b pb-3">Test Information</h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Test Link</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/test/${selectedTest.test_code}`}
                      className="bg-gray-50 border-gray-200 text-gray-600"
                    />
                    <Button
                      onClick={() => copyLink(selectedTest.test_code)}
                      className={`min-w-[100px] transition-colors ${
                        copiedCode === selectedTest.test_code
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                    >
                      {copiedCode === selectedTest.test_code ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Total Questions</label>
                    <div className="text-xl font-bold text-gray-900">{selectedTest.questions_data.length}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Results</label>
                    <div className="text-xl font-bold text-gray-900">{selectedTest.candidate_count} candidates</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Created</label>
                    <div className="text-gray-900 font-medium">
                      {new Date(selectedTest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(selectedTest.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Header */}
          <div className="bg-blue-600 rounded-t-lg p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h2 className="text-xl font-bold">{selectedTest.test_name || 'Test Details'}</h2>
              <p className="text-blue-100 text-sm mt-0.5">{selectedTest.questions_data.length} questions</p>
            </div>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-b-lg border border-t-0 shadow-sm">
            {selectedTest.questions_data.map((q: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold mt-1">
                    Q{idx + 1}
                  </span>
                  <h4 className="text-lg font-bold text-gray-800 leading-tight pt-1">
                    {q.question}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-2 pl-11">
                  {Object.entries(q.options).map(([key, value]: [string, any]) => {
                    const isCorrect = key.toUpperCase() === q.answer.toUpperCase();
                    return (
                      <div
                        key={key}
                        className={`flex items-center p-3 rounded-lg border transition-all ${isCorrect ? 'bg-green-50/50 border-green-500 ring-1 ring-green-100' : 'bg-gray-50/50 border-gray-200'}`}
                      >
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mr-3 border ${isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                          {key.toUpperCase()}
                        </span>
                        <span className={`text-sm ${isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                          {value}
                        </span>
                        {isCorrect && (
                          <div className="ml-auto flex items-center gap-1.5 text-green-600 text-xs font-bold uppercase tracking-wide px-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Correct Answer
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav title="Tests" subtitle="Manage your interview platform" />

      <div className="p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Tests</h1>
            <p className="text-base text-gray-500 font-medium tracking-tight">Manage generated tests and share links with candidates</p>
          </div>

          <Button
            onClick={() => setView('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md active:scale-95"
          >
            + Create New Test
          </Button>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading tests...</div>
        ) : tests.length === 0 ? (
          <Card className="border-yellow-100 bg-yellow-50/50">
            <CardContent className="pt-6">
              <p className="text-yellow-700 font-medium">No tests found. Create your first test!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest pl-6">NAME</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest pl-10">TEST LINK</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">QUESTIONS</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">RESULTS</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">CREATED</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-10">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id} className="hover:bg-gray-50/50 h-16 border-b transition-colors">
                    <TableCell className="font-bold text-gray-900 text-sm pl-6">{test.test_name || 'Untitled Test'}</TableCell>

                    <TableCell className="pl-10">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{test.test_code.substring(0, 10)}...</span>
                        <button
                          onClick={() => copyLink(test.test_code)}
                          className={`text-sm font-bold transition-colors flex items-center gap-1 ${
                            copiedCode === test.test_code
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {copiedCode === test.test_code ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-gray-800 font-semibold text-sm">
                        {test.questions_data.length} questions
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-full">
                        {test.candidate_count || 0} candidates
                      </span>
                    </TableCell>

                    <TableCell className="text-gray-500 text-sm font-medium">
                      {new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(test.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>

                    <TableCell className="text-right pr-10">
                      <button
                        onClick={() => { setSelectedTest(test); setView('preview'); }}
                        className="text-blue-700 hover:text-blue-900 text-sm font-bold transition-colors"
                      >
                        Preview
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total: {tests.length} {tests.length === 1 ? 'test' : 'tests'}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}