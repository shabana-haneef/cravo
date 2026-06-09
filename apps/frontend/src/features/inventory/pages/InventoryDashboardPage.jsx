import React, { useState, useMemo } from 'react';
import { useMyProducts } from '../../products/hooks/useSellerProductQueries.js';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal.jsx';
import { Link } from 'react-router-dom';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { 
  Package, Search, Filter, AlertTriangle, Box, 
  History, Settings2, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

export const InventoryDashboardPage = () => {
  const [page, setPage] = useState(1);
  const { data: productsData, isLoading, isError } = useMyProducts(page, 10);
  const products = productsData?.products || [];
  const meta = productsData?.meta;
  const { data: categoryData } = useCategories();
  const categories = categoryData?.data?.categories || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modal state
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Flatten products into an inventory list of variants
  const inventoryItems = useMemo(() => {
    const items = [];
    products.forEach(product => {
      product.variants?.forEach(variant => {
        // Fallback to variant.stock if inventory relation is somehow missing
        const availableStock = variant.inventory?.availableStock ?? variant.stock ?? 0;
        const reservedStock = variant.inventory?.reservedStock ?? 0;
        const threshold = variant.inventory?.lowStockThreshold ?? 5;
        
        let status = 'IN_STOCK';
        if (availableStock === 0) status = 'OUT_OF_STOCK';
        else if (availableStock <= threshold) status = 'LOW_STOCK';

        items.push({
          id: variant.id,
          productName: product.name,
          productImage: product.images?.[0]?.url || 'https://via.placeholder.com/150',
          categoryId: product.categoryId,
          categoryName: product.category?.name || 'Uncategorized',
          variantName: variant.variantName,
          sku: variant.sku,
          availableStock,
          reservedStock,
          threshold,
          status,
          stock: availableStock // map availableStock to `stock` for modal compatibility
        });
      });
    });
    return items;
  }, [products]);

  // Derived Stats
  const totalSkus = inventoryItems.length;
  const totalAvailableStock = inventoryItems.reduce((acc, item) => acc + item.availableStock, 0);
  const lowStockCount = inventoryItems.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStockCount = inventoryItems.filter(i => i.status === 'OUT_OF_STOCK').length;

  // Filters
  const filteredItems = inventoryItems.filter(item => {
    const productNameMatch = item.productName ? item.productName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const skuMatch = item.sku ? item.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = productNameMatch || skuMatch;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' || item.categoryId === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_STOCK': return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md"><CheckCircle2 size={12}/> In Stock</span>;
      case 'LOW_STOCK': return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md animate-pulse"><AlertTriangle size={12}/> Low Stock</span>;
      case 'OUT_OF_STOCK': return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md"><AlertCircle size={12}/> Out of Stock</span>;
      default: return <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A2B]" />
        <p className="text-gray-500 font-medium">Loading inventory data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Failed to Load Inventory</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Box size={24} className="text-[#1E3A2B]" />
          Inventory Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">Track stock levels, configure thresholds, and view history.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: totalSkus, icon: <Package size={20} className="text-blue-500"/>, bg: 'bg-blue-50' },
          { label: 'Total Available', value: totalAvailableStock, icon: <CheckCircle2 size={20} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
          { label: 'Low Stock', value: lowStockCount, icon: <AlertTriangle size={20} className="text-amber-500"/>, bg: 'bg-amber-50', textClasses: lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'Out of Stock', value: outOfStockCount, icon: <AlertCircle size={20} className="text-red-500"/>, bg: 'bg-red-50', textClasses: outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textClasses || 'text-gray-900'}`}>{stat.value}</p>
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
            placeholder="Search by product name or SKU..."
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
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
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

      {/* Inventory Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Box size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No inventory items found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Variant & SKU</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-[200px]">{item.productName}</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">{item.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{item.variantName}</span>
                        <span className="text-xs text-gray-400 mt-0.5 font-mono">{item.sku || 'No SKU'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between min-w-[120px]">
                          <span className="text-xs text-gray-500 font-medium">Available:</span>
                          <span className={`font-bold ${item.status === 'IN_STOCK' ? 'text-emerald-600' : item.status === 'LOW_STOCK' ? 'text-amber-600' : 'text-red-600'}`}>
                            {item.availableStock}
                          </span>
                        </div>
                        <div className="flex items-center justify-between min-w-[120px]">
                          <span className="text-xs text-gray-400 font-medium">Reserved:</span>
                          <span className="font-semibold text-gray-600">{item.reservedStock}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedVariant(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1E3A2B] bg-[#F0F8F3] hover:bg-[#E0F0E6] rounded-lg transition-colors"
                        >
                          <Settings2 size={14} /> Adjust
                        </button>
                        <Link
                          to={`/seller/inventory/${item.id}/history`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <History size={14} /> History
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={meta.totalPages} 
          onPageChange={setPage} 
        />
      )}

      <StockAdjustmentModal 
        isOpen={!!selectedVariant} 
        onClose={() => setSelectedVariant(null)} 
        variantData={selectedVariant}
        productName={selectedVariant?.productName}
      />
    </div>
  );
};
