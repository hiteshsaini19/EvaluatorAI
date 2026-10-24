'use client';


import { useEffect, useState } from 'react';
import { getResults, deleteResult } from '@/lib/api';
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
import Link from 'next/link';
import { Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Result {
  id: number;
  name: string;
  email: string;
  test_code: string;
  score: string;
  score_percentage: number;
  time_taken_formatted: string;
  created_at: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await getResults();
      setResults(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    try {
      await deleteResult(id);
      setResults(results.filter(r => r.id !== id));
    } catch (err: any) {
      alert('Failed to delete result: ' + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
      <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <span className="font-bold text-lg">Error!</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Results</h1>
        <p className="text-gray-500 font-medium pb-2 text-sm">Manage your Interview platform</p>
      </div>

      <Card className="border-gray-200 shadow-xl overflow-hidden rounded-xl bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">CANDIDATE</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">SCORE</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">TIME TAKEN</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">TEST ID</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">SUBMITTED</TableHead>
                <TableHead className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <p className="text-lg font-medium">No test results found</p>
                      <p className="text-sm">Wait for candidates to complete tests</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r) => (
                  <TableRow key={r.id} className="group hover:bg-gray-50 transition-all duration-200 border-b border-gray-50">
                    <TableCell className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-tight">{r.name}</span>
                        <span className="text-sm text-gray-500 font-medium">{r.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">{r.score}</span>
                          <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full ring-1 ring-inset ${r.score_percentage >= 70 ? 'bg-green-50 text-green-700 ring-green-600/20' :
                              r.score_percentage >= 40 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                'bg-red-50 text-red-700 ring-red-600/20'
                            }`}>
                            {r.score_percentage}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <span className="text-gray-900 font-bold text-sm">{r.time_taken_formatted}</span>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <code className="bg-gray-100/80 px-2 py-1 rounded border border-gray-200 text-gray-600 font-mono text-[12px] shadow-sm select-all">
                        {r.test_code.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <span className="text-gray-600 font-medium text-sm whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end items-center gap-4">
                        <Link
                          href={`/results/${r.id}`}
                          className="text-blue-600 hover:text-blue-800 text-[13px] font-bold transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-red-500 hover:text-red-700 text-[13px] font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900 font-bold">{results.length > 0 ? 1 : 0}</span> to <span className="text-gray-900 font-bold">{results.length}</span> of <span className="text-gray-900 font-bold">{results.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 py-0 px-3 border-gray-200 text-gray-400 cursor-not-allowed">
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm text-gray-500 font-medium">Page</span>
                <span className="text-sm text-gray-900 font-bold">1 of 1</span>
              </div>
              <Button variant="outline" size="sm" className="h-8 py-0 px-3 border-gray-200 text-gray-400 cursor-not-allowed">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}