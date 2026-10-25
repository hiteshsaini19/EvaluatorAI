'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSubjects } from '@/lib/api';
import { Subject, groupSubjects } from '@/lib/subjects';
import { useAdminGuard } from '@/lib/useAdminGuard';
import TopNav from '@/components/TopNav';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function SubjectsPage() {
  const isAdmin = useAdminGuard();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;
    getSubjects()
      .then(res => setSubjects(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load subjects'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const groups = useMemo(() => groupSubjects(subjects), [subjects]);
  const totalQuestions = subjects.reduce((sum, s) => sum + s.question_count, 0);

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdmin) {
    return <div className="flex justify-center items-center h-64 text-gray-600">Loading...</div>;
  }

  return (
    <>
      <TopNav title="Subjects" subtitle="The fixed subject catalogue test creators choose from" />
      <div className="p-8 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading subjects...</div>
        ) : error ? (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6 text-red-700">{error}</CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              {subjects.length} subjects in {groups.length} groups, with {totalQuestions} example questions.
              Scopes and difficulty rubrics guide question generation; they are edited in{' '}
              <code className="bg-gray-100 px-1 rounded">backend/app/data/subjects.py</code> and applied by re-running the seed.
            </p>

            {groups.map(({ group, subjects: groupItems }) => (
              <div key={group}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{group}</h2>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {groupItems.map(subject => {
                      const isOpen = expanded.has(subject.id);
                      return (
                        <div key={subject.id}>
                          <div className="flex items-center justify-between pr-5 hover:bg-gray-50 transition-colors">
                            <button
                              onClick={() => toggle(subject.id)}
                              aria-expanded={isOpen}
                              className="flex-1 flex items-center gap-2 px-5 py-3 text-left font-semibold text-gray-800"
                            >
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                              {subject.name}
                            </button>
                            <Link
                              href={`/questions?subject=${subject.id}`}
                              className="text-xs font-medium px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            >
                              {subject.question_count} questions
                            </Link>
                          </div>

                          {isOpen && (
                            <div className="px-11 pb-4 space-y-3 text-sm">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Scope</div>
                                <p className="text-gray-700">{subject.scope}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                  { label: 'Easy', text: subject.easy_rubric, style: 'border-green-200 bg-green-50/50 text-green-800' },
                                  { label: 'Medium', text: subject.medium_rubric, style: 'border-yellow-200 bg-yellow-50/50 text-yellow-800' },
                                  { label: 'Hard', text: subject.hard_rubric, style: 'border-red-200 bg-red-50/50 text-red-800' },
                                ].map(level => (
                                  <div key={level.label} className={`rounded-md border p-3 ${level.style}`}>
                                    <div className="text-xs font-bold uppercase tracking-wider mb-1">{level.label}</div>
                                    <p className="text-gray-700">{level.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
