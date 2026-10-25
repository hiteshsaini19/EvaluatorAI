'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getResults, deleteResult } from '@/lib/api';
import { AttemptStatus, STATUS_LABELS, formatDateTime } from '@/lib/tests';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Result {
  id: number;
  name: string;
  email: string;
  test_code: string;
  test_name: string | null;
  status: AttemptStatus;
  score: string | null;
  score_percentage: number | null;
  unanswered_count: number;
  time_used_formatted: string;
  started_at: string;
  submitted_at: string | null;
}

export default function ResultsPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading results...</div>}>
      <ResultsList />
    </Suspense>
  );
}

function ResultsList() {
  const searchParams = useSearchParams();
  const testCode = searchParams.get('test') || undefined;

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // The backend only returns results for the user's own tests (Admin: all), and owners may delete them
  useEffect(() => {
    getResults(testCode)
      .then(response => { setResults(response.data); setError(''); })
      .catch((err: any) => setError(err.response?.data?.error || err.message || 'Failed to fetch results'))
      .finally(() => setLoading(false));
  }, [testCode]);

  const handleDelete = async (result: Result) => {
    const note = result.status === 'in_progress' ? ' This candidate is still taking the test; deleting lets them start again.' : '';
    if (!confirm(`Delete ${result.name}'s result?${note}`)) return;
    try {
      await deleteResult(result.id);
      setResults(prev => prev.filter(r => r.id !== result.id));
    } catch (err: any) {
      alert('Failed to delete result: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600 font-medium">Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <p className="font-bold text-red-700">Error</p>
            <p className="text-red-600 mt-1">{error}</p>
            {testCode && <Link href="/results" className="inline-block mt-4 text-blue-600 font-medium">Show all results</Link>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredName = testCode ? (results[0]?.test_name || testCode) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Results</h1>
        {testCode ? (
          <p className="text-gray-500 text-sm">
            Showing results for <span className="font-semibold text-gray-700">{filteredName}</span>
            {' · '}<Link href="/results" className="text-blue-600 hover:underline">Show all</Link>
          </p>
        ) : (
          <p className="text-gray-500 text-sm">Scores and status for every candidate who has taken your tests</p>
        )}
      </div>

      <Card className="border-gray-200 shadow-xl overflow-hidden rounded-xl bg-white">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Candidate</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Test</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Status</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Score</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Unanswered</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Time used</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Finished</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <p className="text-lg font-medium">No results yet</p>
                      <p className="text-sm">Share a test link; results appear here as candidates take it.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r) => {
                  const status = STATUS_LABELS[r.status];
                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight">{r.name}</span>
                          <span className="text-sm text-gray-500">{r.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-sm text-gray-700">
                        {testCode ? (r.test_name || r.test_code) : (
                          <Link href={`/results?test=${r.test_code}`} className="hover:text-blue-700 hover:underline">
                            {r.test_name || r.test_code}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full ring-1 ring-inset whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center whitespace-nowrap">
                        {r.score === null ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-gray-900">{r.score}</span>
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full ring-1 ring-inset ${(r.score_percentage ?? 0) >= 70 ? 'bg-green-50 text-green-700 ring-green-600/20' :
                              (r.score_percentage ?? 0) >= 40 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                'bg-red-50 text-red-700 ring-red-600/20'
                              }`}>
                              {r.score_percentage}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center text-sm font-semibold text-gray-800">{r.unanswered_count}</TableCell>
                      <TableCell className="py-4 px-6 text-center text-sm font-semibold text-gray-800">{r.time_used_formatted}</TableCell>
                      <TableCell className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                        {r.submitted_at ? formatDateTime(r.submitted_at) : <span className="text-gray-400">Started {formatDateTime(r.started_at)}</span>}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-4 text-[13px] font-bold">
                          <Link href={`/results/${r.id}`} className="text-blue-600 hover:text-blue-800">View</Link>
                          <button onClick={() => handleDelete(r)} className="text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
