import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Package, Search, Plus, Filter, Edit2, X,
  Trash2, Eye, Loader2, AlertCircle,
  CheckCircle2, XCircle, Clock, RotateCcw, MoreVertical,
  ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Download
} from 'lucide-react';

import { ProductForm } from '../components/ProductForm.jsx';
import { useMyProducts, useDeleteProduct } from '../../products/hooks/useSellerProductQueries.js';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';

export const ProductsDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit] = useState(100);

  const { data: prodData, isLoading, isError } = useMyProducts(page, limit);
  const { data: catData } = useCategories();
  const { mutate: deleteProductMutate } = useDeleteProduct();

  const categoriesList = catData?.data?.categories || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAllRows, setShowAllRows] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('add');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Map backend products
  const products = (prodData?.products || []).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.variants?.[0]?.sku || 'N/A',
    category: p.category || { name: 'Uncategorized' },
    status: p.status,
    variants: p.variants || [],
    totalStock: p.variants?.reduce((sum, v) => sum + (v.inventory?.availableStock || 0), 0) || 0,
    price: p.variants?.[0]?.price || 0,
    image: p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&q=80&w=150'
  }));

  const total = products.length;
  const approved = products.filter(p => p.status === 'APPROVED').length;
  const pending = products.filter(p => p.status === 'PENDING' || p.status === 'PENDING_APPROVAL').length;
  const rejected = products.filter(p => p.status === 'REJECTED').length;

  const filteredProducts = products.filter(p => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(term);
      const skuMatch = p.sku.toLowerCase().includes(term);
      if (!nameMatch && !skuMatch) return false;
    }
    if (filterCategory !== 'ALL') {
      if (p.category?.id !== filterCategory && p.category?.slug !== filterCategory) return false;
    }
    if (filterStatus !== 'ALL') {
      if (p.status !== filterStatus) return false;
    }
    return true;
  });

  const visibleProducts = showAllRows ? filteredProducts : filteredProducts.slice(0, 4);

  const handleExport = () => {
    try {
      if (filteredProducts.length === 0) {
        toast.error("No products to export");
        return;
      }
      
      const headers = ['Product ID', 'Name', 'SKU', 'Category', 'Status', 'Variants', 'Total Stock', 'Price'];
      const csvRows = filteredProducts.map(p => [
        p.id || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.sku || '',
        `"${(p.category?.name || '').replace(/"/g, '""')}"`,
        p.status || '',
        p.variants?.length || 0,
        p.totalStock || 0,
        p.price || 0
      ].join(','));
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Inventory exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export inventory. Check console.");
    }
  };

  const handleDeleteClick = (id) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    deleteProductMutate(productToDelete, {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        setProductToDelete(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to delete product');
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md"><CheckCircle2 size={12}/> Approved</span>;
      case 'PENDING':
      case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md"><Clock size={12}/> Pending</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md"><XCircle size={12}/> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A2B]" />
        <p className="text-gray-500 font-medium">Loading your products...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Failed to Load Products</h2>
        <p className="text-gray-500">There was a problem communicating with the server.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-[#1E3A2B]" />
            Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your catalog, variants, and stock.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={18} className="text-gray-500" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#1E3A2B] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#162A1F] transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50">
            <Package size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Products</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{total}</p>
          </div>
        </div>

        <div className="bg-white border-b-2 border-b-emerald-500 border-x border-t border-gray-100 rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-50">
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Approved</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{approved}</p>
          </div>
        </div>

        <div className="bg-white border-b-2 border-b-amber-500 border-x border-t border-gray-100 rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-50">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Pending Review</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{pending}</p>
          </div>
        </div>

        <div className="bg-white border-b-2 border-b-red-500 border-x border-t border-gray-100 rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-red-50">
            <XCircle size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Rejected</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-[#1E3A2B]" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/20 transition-all bg-gray-50/50"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              ⌘K
            </kbd>
          </div>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-gray-50/50 font-semibold text-gray-700 min-w-[160px] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-gray-50/50 font-semibold text-gray-700 min-w-[150px] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 text-gray-500 pointer-events-none" />
          </div>

          <button className="hidden md:flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shrink-0">
            <RotateCcw size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">Product <MoreVertical size={12} className="text-gray-300" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category <MoreVertical size={12} className="text-gray-300 inline" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status <MoreVertical size={12} className="text-gray-300 inline" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Variants <MoreVertical size={12} className="text-gray-300 inline" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stock (Total) <MoreVertical size={12} className="text-gray-300 inline" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Price <MoreVertical size={12} className="text-gray-300 inline" /></th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleProducts.map(product => {
                const totalStock = product.totalStock;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="w-[50px] h-[50px] rounded object-cover border border-gray-100" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 bg-gray-100/80 px-2.5 py-1.5 rounded-md text-xs font-semibold">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-900 font-bold">{product.variants.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${totalStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-semibold">₹{product.price}</span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* View More / Show Less */}
        {filteredProducts.length > 4 && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400">
              Showing {visibleProducts.length} of {filteredProducts.length} products
            </p>
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A2B] hover:text-[#162A1F] transition-colors"
            >
              {showAllRows ? 'Show Less' : `View All ${filteredProducts.length}`}
              <ChevronRight size={14} className={`transition-transform ${showAllRows ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
            style={{ animation: 'modalSlideIn 0.25s ease' }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="p-6 overflow-y-auto max-h-[85vh]">
              <ProductForm isEditing={false} onClose={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}


      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setProductToDelete(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            style={{ animation: 'modalSlideIn 0.2s ease' }}
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Product?</h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                Are you sure you want to delete this product? This action cannot be undone and will remove it from your store entirely.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={false}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};
