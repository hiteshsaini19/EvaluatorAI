'use client';

import { useEffect, useState, useMemo } from 'react';
import { getQuestions, getSubjects, deleteQuestion, createQuestion, updateQuestion } from '@/lib/api';
import { Subject, groupSubjects } from '@/lib/subjects';
import { useAdminGuard } from '@/lib/useAdminGuard';
import TopNav from '@/components/TopNav';
import { BulkUpload } from '@/components/BulkUpload';
import QuestionModal, { BankQuestion } from '@/components/QuestionModal';
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
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const UNASSIGNED = '__unassigned__';

const selectClass = "border rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-indigo-100 outline-none";

export default function QuestionsPage() {
  const isAdmin = useAdminGuard();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [difficulty, setDifficulty] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersReady, setFiltersReady] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);

  // Load subjects, and apply ?subject=<id> (linked from the Subjects page) before the first fetch
  useEffect(() => {
    if (!isAdmin) return;
    getSubjects()
      .then(res => {
        const list: Subject[] = res.data;
        setSubjects(list);
        const fromUrl = new URLSearchParams(window.location.search).get('subject');
        const linked = list.find(s => String(s.id) === fromUrl);
        if (linked) {
          setGroupFilter(linked.group_name);
          setSubjectFilter(String(linked.id));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setFiltersReady(true));
  }, [isAdmin]);

  // Debounce the search box
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!isAdmin || !filtersReady) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filtersReady, currentPage, perPage, difficulty, groupFilter, subjectFilter, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters = {
        unassigned: groupFilter === UNASSIGNED ? true : undefined,
        subject_id: groupFilter !== UNASSIGNED && subjectFilter !== 'all' ? Number(subjectFilter) : undefined,
        group: groupFilter !== UNASSIGNED && groupFilter !== 'all' && subjectFilter === 'all' ? groupFilter : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
        search: search || undefined,
      };
      const res = await getQuestions(currentPage, perPage, filters);

      setQuestions(res.data.items);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / perPage)));
      setTotalItems(res.data.total);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchData();
    // Question counts per subject changed
    getSubjects().then(res => setSubjects(res.data)).catch(() => {});
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      toast.success('Question deleted successfully!');
      refreshAll();
    } catch (e) {
      toast.error('Failed to delete question');
    }
  };

  // Errors propagate to QuestionModal, which shows the message and stays open
  const handleSaveQuestion = async (data: any) => {
    if (editingQuestion) {
      await updateQuestion(editingQuestion.id, data);
      toast.success('Question updated');
    } else {
      await createQuestion(data);
      toast.success('Question created');
    }
    refreshAll();
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };
  const openEditModal = (q: BankQuestion) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  const groups = useMemo(() => groupSubjects(subjects), [subjects]);
  const subjectsInGroup = useMemo(
    () => groupFilter === 'all' ? subjects : subjects.filter(s => s.group_name === groupFilter),
    [subjects, groupFilter]
  );

  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  if (!isAdmin) {
    return <div className="flex justify-center items-center h-64 text-gray-600">Loading...</div>;
  }

  return (
    <>
      <TopNav title="Questions" subtitle="Manage the example question bank" />
      <Toaster position="top-right" />
      <div className="p-8">

        {/* Bulk Import Section */}
        <div className="mb-6">
          <BulkUpload
            subjects={subjects}
            onUploadComplete={refreshAll}
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Group</label>
              <select
                className={selectClass}
                value={groupFilter}
                onChange={(e) => { changeFilter(setGroupFilter)(e.target.value); setSubjectFilter('all'); }}
              >
                <option value="all">All Groups</option>
                {groups.map(g => <option key={g.group} value={g.group}>{g.group}</option>)}
                <option value={UNASSIGNED}>Unassigned (no subject)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
              <select
                className={selectClass}
                value={subjectFilter}
                onChange={(e) => changeFilter(setSubjectFilter)(e.target.value)}
                disabled={groupFilter === UNASSIGNED}
              >
                <option value="all">All Subjects</option>
                {subjectsInGroup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</label>
              <select
                className={selectClass}
                value={difficulty}
                onChange={(e) => changeFilter(setDifficulty)(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search question text"
                  className="pl-9 h-[38px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-[38px]" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              New Question
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading questions...</TableCell>
                  </TableRow>
                ) : questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No questions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q) => (
                    <TableRow key={q.id} className={loading ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        <div className="line-clamp-2 text-gray-800" title={q.question_text}>
                          {q.question_text}
                        </div>
                      </TableCell>
                      <TableCell>
                        {q.subject_id === null ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded border bg-amber-50 text-amber-700 border-amber-200">
                            Unassigned
                          </span>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-100/80 rounded border border-gray-200">
                              {q.subject_group}
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded border bg-blue-50 text-blue-700 border-blue-100">
                              {q.subject_name}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                          q.difficulty === 'Hard' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                          {q.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border">
                          {q.correct_option.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(q)} aria-label="Edit question">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(q.id)}
                            aria-label="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * perPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> questions
            <span className="ml-4 text-gray-400">|</span>
            <span className="ml-4">Per page:
              <select
                className="ml-2 border rounded px-2 py-1 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </span>
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 mr-2"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {(() => {
              const pages: (number | '...')[] = [];
              if (totalPages > 0) pages.push(1);
              let start = Math.max(2, currentPage - 1);
              let end = Math.min(totalPages - 1, currentPage + 1);
              if (currentPage <= 3) end = Math.min(totalPages - 1, 4);
              if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 3);
              if (start > 2) pages.push('...');
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages - 1) pages.push('...');
              if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
              return pages.map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="flex items-center justify-center w-9 h-9 text-gray-400">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    className={`w-9 h-9 p-0 ${currentPage === p ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                )
              ));
            })()}
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ml-2"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        <QuestionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveQuestion}
          subjects={subjects}
          initialData={editingQuestion}
        />
      </div>
    </>
  );
}
