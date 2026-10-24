'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api';

import TopNav from '@/components/TopNav';
import CategoryModal from '@/components/CategoryModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description: string;
  parent_category: string | null;
  question_count: number;
  created_at: string;
}

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredData, setFilteredData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Initial load + auth check
  useEffect(() => {
    setMounted(true);

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  // Fetch categories
const fetchData = async () => {
  try {
    const res = await getCategories();
    setCategories(res.data);
    setFilteredData(res.data);
    setLoading(false);
  } catch (err: any) {
    if (err.response?.status === 401) {
      router.push('/login');
      return;
    }
    setError(err.message || 'Failed to fetch categories');
    setLoading(false);
    console.error(err);
  }
};


  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(categories);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredData(
        categories.filter(
          (cat) =>
            cat.name.toLowerCase().includes(q) ||
            (cat.parent_category?.toLowerCase().includes(q) ?? false)
        )
      );
    }
  }, [searchQuery, categories]);

  const handleCreate = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditData({
      id: category.id,
      name: category.name,
      description: category.description,
      parent_category: category.parent_category,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editData) {
        await updateCategory(editData.id, data);
        toast.success('Category updated successfully!'); // Add this
      } else {
        await createCategory(data);
        toast.success('Category created successfully!'); // Add this
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save category'); // Add this
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCategory(deleteTarget.id);
      toast.success('Category deleted successfully!'); // Add this
      await fetchData();
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete category'); // Replace alert with toast
    }
  };

  // Prevent hydration issues
  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <TopNav title="Categories" subtitle="Manage your interview platform" />
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading categories...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNav title="Categories" subtitle="Manage your interview platform" />
        <div className="p-8">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="font-bold text-red-700">Error!</p>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav
        title="Categories"
        subtitle="Manage question categories for test creation"
      />
    <Toaster position="top-right" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            onClick={handleCreate}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-700">
                {searchQuery
                  ? 'No categories match your search.'
                  : 'No categories found. Create one first.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>PARENT CATEGORY</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead className="text-center">QUESTIONS</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">
                        {item.name}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            item.parent_category
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.parent_category ?? 'Main Category'}
                        </span>
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {item.description || '-'}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                          {item.question_count} questions
                        </span>
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        editData={editData}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        categoryName={deleteTarget?.name || ''}
      />
    </>
  );
}
