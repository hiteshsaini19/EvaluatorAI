'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getTests, deleteTest } from '@/lib/api';
import { TestSummary, candidateLink, formatDateTime, formatMinutes, formatTimeLeft } from '@/lib/tests';
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
import { Copy, Check, Plus } from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchTests();
  }, [router]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await getTests();
      setTests(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (test: TestSummary) => {
    if (!confirm(`Delete "${test.test_name || 'Untitled test'}"? All candidate results for this test will also be deleted.`)) return;
    try {
      await deleteTest(test.id);
      setTests(prev => prev.filter(t => t.id !== test.id));
    } catch (e: any) {
      alert(e.response?.data?.detail || e.response?.data?.error || 'Failed to delete test');
    }
  };

  const copyLink = (testCode: string) => {
    navigator.clipboard.writeText(candidateLink(testCode));
    setCopiedCode(testCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <TopNav title="Tests" subtitle="Generate tests and share links with candidates" />

      <div className="p-8">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Tests</h1>
            <p className="text-sm text-gray-500">Share a test link with candidates, then follow their results.</p>
          </div>

          <Link href="/tests/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
              <Plus className="w-4 h-4" /> Create Test
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading tests...</div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-700">{error}</CardContent>
          </Card>
        ) : tests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-gray-700 font-medium mb-1">You haven&apos;t created any tests yet.</p>
              <p className="text-sm text-gray-500 mb-6">Pick subjects, difficulty and a time limit, and get a link to share.</p>
              <Link href="/tests/new">
                <Button className="bg-blue-600 hover:bg-blue-700">Create your first test</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 pl-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Test</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Questions</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Duration</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Attempts</TableHead>
                  <TableHead className="py-4 pr-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id} className="hover:bg-gray-50/50">
                    <TableCell className="pl-6 py-4 max-w-xs">
                      <div className="font-bold text-gray-900 text-sm">{test.test_name || 'Untitled test'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate" title={test.subjects.join(', ')}>
                        {test.subjects.join(', ') || 'No subjects'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Created {formatDateTime(test.created_at)}</div>
                    </TableCell>

                    <TableCell className="text-center text-sm font-semibold text-gray-800">
                      {test.question_count}
                    </TableCell>

                    <TableCell className="text-center text-sm text-gray-700 whitespace-nowrap">
                      {formatMinutes(test.duration_minutes)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {test.is_expired ? (
                        <span className="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600">Expired</span>
                      ) : (
                        <div>
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100">Active</span>
                          <div className="text-[11px] text-gray-500 mt-1" title={`Link expires ${formatDateTime(test.expires_at)}`}>
                            {formatTimeLeft(test.expires_at)}
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center text-sm font-semibold text-gray-800">
                      {test.attempt_count}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end items-center gap-4 text-sm font-bold">
                        <button
                          onClick={() => copyLink(test.test_code)}
                          className={`flex items-center gap-1 transition-colors ${copiedCode === test.test_code ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'}`}
                          title="Copy the candidate link"
                        >
                          {copiedCode === test.test_code
                            ? <><Check className="w-3.5 h-3.5" /> Copied</>
                            : <><Copy className="w-3.5 h-3.5" /> Share</>}
                        </button>
                        <Link href={`/tests/${test.test_code}`} className="text-blue-700 hover:text-blue-900">View</Link>
                        <Link href={`/results?test=${test.test_code}`} className="text-blue-700 hover:text-blue-900">Results</Link>
                        <button onClick={() => handleDelete(test)} className="text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="bg-gray-50 px-6 py-3 border-t">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total: {tests.length} {tests.length === 1 ? 'test' : 'tests'}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
