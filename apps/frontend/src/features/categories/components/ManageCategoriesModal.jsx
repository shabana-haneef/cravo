import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategoryQueries.js';
import { X, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ManageCategoriesModal = ({ isOpen, onClose }) => {
  const { data, isLoading } = useCategories();
  const categories = data?.data?.categories || [];

  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', isActive: true });

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (!formData.name) return toast.error('Name is required');
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: formData });
        toast.success('Category updated');
      } else {
        await createMut.mutateAsync(formData);
        toast.success('Category created');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', slug: '', isActive: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    toast('Delete this category? This action cannot be undone.', {
      duration: 8000,
      action: {
        label: 'Yes, Delete',
        onClick: async () => {
          try {
            await deleteMut.mutateAsync(id);
            toast.success('Category deleted');
          } catch (err) {
            toast.error('Failed to delete');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!isAdding && !editingId && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => {
                  setFormData({ name: '', slug: '', isActive: true });
                  setIsAdding(true);
                }}
                className="inline-flex items-center gap-2 bg-[#1E3A2B] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#162A1F] transition-colors"
              >
                <Plus size={16} /> Add Category
              </button>
            </div>
          )}

          {(isAdding || editingId) && (
            <div className="bg-gray-50 p-4 rounded-lg border mb-6 space-y-4">
              <h3 className="font-bold text-gray-800">{editingId ? 'Edit Category' : 'New Category'}</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#1E3A2B] outline-none"
                    placeholder="e.g. Electronics"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => { setIsAdding(false); setEditingId(null); }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#1E3A2B] rounded-lg hover:bg-[#162A1F] flex items-center gap-2"
                >
                  {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setFormData({ name: cat.name, slug: cat.slug, isActive: cat.isActive });
                              setEditingId(cat.id);
                              setIsAdding(false);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500">No categories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
