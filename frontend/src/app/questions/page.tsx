'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserRole } from '@/lib/auth';
import { getQuestions, getCategories, deleteQuestion, createQuestion, updateQuestion } from '@/lib/api';
import TopNav from '@/components/TopNav';
import { BulkUpload } from '@/components/BulkUpload';
import QuestionModal from '@/components/QuestionModal';
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
import { Search, Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Question {
  id: number;
  question_text: string;
  category_name: string;
  subcategory_name: string | null;
  difficulty: string;
  correct_option: string;
}

interface Category {
  id: number;
  name: string;
  parent_category: string | null;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);
  // Search removed
  const [difficulty, setDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    // 1. Strict Auth Check
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUserRole(getUserRole());

    // 2. Fetch Data
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, currentPage, perPage, difficulty, selectedCategory, selectedSubcategory]);
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      let catId: number | undefined;
      let parentCat: string | undefined;
      if (selectedSubcategory !== 'all') {
        const sub = categories.find(c => c.name === selectedSubcategory);
        if (sub) catId = sub.id;
      } else if (selectedCategory !== 'all') {
        // Check if it is a root category (Main Category)
        const root = categories.find(c => c.name === selectedCategory && (!c.parent_category || c.parent_category === 'Main Category'));
        if (root) {
          catId = root.id;
        } else {
          // Assume it defines a Parent Category Group
          parentCat = selectedCategory;
        }
      }
      const filters = {
        category_id: catId,
        parent_category: parentCat,
        difficulty: difficulty !== 'all' ? difficulty : undefined
      };
      const res = await getQuestions(currentPage, perPage, filters);

      setQuestions(res.data.items);
      setTotalPages(Math.ceil(res.data.total / perPage));
      setTotalItems(res.data.total);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

const handleDelete = async (id: number) => {
  if (!confirm('Delete this question?')) return;
  try {
    await deleteQuestion(id);
    toast.success('Question deleted successfully!'); // Add this
    fetchData();
  } catch (e) { 
    toast.error('Failed to delete question'); // Add this
  }
};

  const handleSaveQuestion = async (data: any) => {
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, data);
      } else {
        await createQuestion(data);
      }
      fetchData(); // Refresh list
      setIsModalOpen(false);
      setEditingQuestion(null);
    } catch (e) {
      alert('Failed to save question');
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };
  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  const derivedParents = useMemo(() => {
    return Array.from(new Set([
      ...categories.filter(c => !c.parent_category || c.parent_category === 'Main Category').map(c => c.name),
      ...categories.map(c => c.parent_category).filter((p): p is string => !!p && p !== 'Main Category')
    ])).sort();
  }, [categories]);

  const subCategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    // Show categories that have selectedCategory as parent OR are the category itself (if it's a root)
    return categories.filter(c => {
      if (c.parent_category === selectedCategory) return true;
      if (c.name === selectedCategory && (!c.parent_category || c.parent_category === 'Main Category')) return true;
      return false;
    });
  }, [categories, selectedCategory]);

  const isCreator = userRole === 'Creator';

  if (loading && questions.length === 0) return (
    <>
      <TopNav title="Questions" subtitle="Manage your question bank" />
      <div className="p-8 text-center text-gray-500">Loading questions...</div>
    </>
  );

  return (
    <>
      <TopNav title="Questions" subtitle="Manage your question bank" />
      <Toaster position="top-right" />
      <div className="p-8">

        {/* Bulk Import Section */}
        {!isCreator && (
          <div className="mb-6">
            <BulkUpload
              categories={categories}
              onUploadComplete={() => fetchData()}
            />
          </div>
        )}
        {/* Filters & Actions Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          {/* Filters Group */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-100 outline-none"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('all'); }}
              >
                <option value="all">All Categories</option>
                {derivedParents.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory</label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={selectedCategory === 'all' || subCategories.length === 0}
              >
                <option value="all">All Subcategories</option>
                {subCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-100 outline-none"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          {!isCreator && (
            <div className="flex items-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700 h-[38px]" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                New Question
              </Button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No questions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q) => {
                    // Find actual category object to determine Parent
                    const catObj = categories.find(c => c.name === q.category_name);
                    const parentName = catObj?.parent_category && catObj.parent_category !== 'Main Category'
                      ? catObj.parent_category
                      : null;

                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">
                          <div className="line-clamp-2 text-gray-800" title={q.question_text}>
                            {q.question_text}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            {/* Parent Category Card/Pill */}
                            {parentName && (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-100/80 rounded border border-gray-200 mb-0.5">
                                {parentName}
                              </span>
                            )}

                            {/* Main Category/Subcategory Pill */}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${parentName ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                              {q.category_name}
                            </span>
                          </div>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(q)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {!isCreator && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                onClick={() => handleDelete(q.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed Pagination */}
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * perPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> questions
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
            {/* Better Pagination Logic */}
            {(() => {
              const pages = [];
              // Always show 1
              if (totalPages > 0) { // Only add page 1 if there are any pages
                pages.push(1);
              }
              let start = Math.max(2, currentPage - 1);
              let end = Math.min(totalPages - 1, currentPage + 1);
              // Adjust window if close to boundaries
              if (currentPage <= 3) {
                end = Math.min(totalPages - 1, 4);
              }
              if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
              }
              if (start > 2) {
                pages.push('...');
              }
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
              if (end < totalPages - 1) {
                pages.push('...');
              }
              if (totalPages > 1 && !pages.includes(totalPages)) { // Add totalPages if not already included and totalPages > 1
                pages.push(totalPages);
              }
              return pages.map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="flex items-center justify-center w-9 h-9 text-gray-400">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    className={`w-9 h-9 p-0 ${currentPage === p ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setCurrentPage(Number(p))}
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

        {/* Create Modal */}
        <QuestionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveQuestion}
          categories={categories}
          initialData={editingQuestion}
        />
      </div>
    </>
  );
}