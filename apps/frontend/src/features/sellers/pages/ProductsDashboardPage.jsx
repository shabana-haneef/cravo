import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyProducts, useDeleteProduct } from '../../products/hooks/useSellerProductQueries.js';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { toast } from 'sonner';
import { 
  Package, Search, Plus, Filter, Edit2, 
  Trash2, Eye, MoreVertical, Loader2, AlertCircle,
  CheckCircle2, XCircle, Clock
} from 'lucide-react';

export const ProductsDashboardPage = () => {
  const { data: products = [], isLoading, isError } = useMyProducts();
  const { data: categoryData } = useCategories();
  const categories = categoryData?.data?.categories || [];
  
  const deleteProductMut = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Stats
  const total = products.length;
  const approved = products.filter(p => p.status === 'APPROVED').length;
  const pending = products.filter(p => p.status === 'PENDING').length;
  const rejected = products.filter(p => p.status === 'REJECTED').length;

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' || p.categoryId === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProductMut.mutateAsync(id);
        toast.success('Product deleted successfully');
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md"><CheckCircle2 size={12}/> Approved</span>;
      case 'PENDING': return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md"><Clock size={12}/> Pending</span>;
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
        <Link
          to="/seller/products/new"
          className="inline-flex items-center gap-2 bg-[#1E3A2B] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#162A1F] transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: total, icon: <Package size={20} className="text-blue-500"/>, bg: 'bg-blue-50' },
          { label: 'Approved', value: approved, icon: <CheckCircle2 size={20} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
          { label: 'Pending Review', value: pending, icon: <Clock size={20} className="text-amber-500"/>, bg: 'bg-amber-50' },
          { label: 'Rejected', value: rejected, icon: <XCircle size={20} className="text-red-500"/>, bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/20"
          />
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex items-center">
            <Filter size={16} className="absolute left-3 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-white font-medium text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-white font-medium text-gray-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Package size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Variants</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Stock (Total)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(product => {
                  const coverImage = product.images?.[0]?.url || 'https://via.placeholder.com/150';
                  const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={coverImage} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">₹{product.variants?.[0]?.price || '0.00'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-semibold">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-medium">{product.variants?.length || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${totalStock > 10 ? 'text-emerald-600' : totalStock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                          {totalStock} {totalStock === 0 && '(Out of stock)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-[#B88645] hover:bg-amber-50 rounded-lg transition-colors"
                            title="View in Store"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
