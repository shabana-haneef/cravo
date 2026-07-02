import React, { useState, useMemo } from 'react';
import { useMyProducts } from '../../products/hooks/useSellerProductQueries.js';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal.jsx';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search, AlertTriangle, Box, Download,
  History, Settings2, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Plus,
  ArrowUpDown
} from 'lucide-react';

export const InventoryDashboardPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
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
  const [showAdjustDropdown, setShowAdjustDropdown] = useState(false);

  // Flatten products into an inventory list of variants
  const inventoryItems = useMemo(() => {
    const items = [];
    products.forEach(product => {
      product.variants?.forEach(variant => {
        // Fallback to variant.stock if inventory relation is somehow missing
        const availableStock = variant.inventory?.availableStock ?? variant.stock ?? 0;
        const reservedStock = variant.inventory?.reservedStock ?? 0;
        const threshold = variant.inventory?.lowStockThreshold ?? 5;
        const lastUpdated = variant.inventory?.updatedAt || variant.updatedAt || new Date().toISOString();
        
        let status = 'IN_STOCK';
        if (availableStock === 0) status = 'OUT_OF_STOCK';
        else if (availableStock <= threshold) status = 'LOW_STOCK';

        items.push({
          id: variant.id,
          productName: product.name,
          productImage: product.images?.[0]?.imageUrl || 'https://via.placeholder.com/150',
          categoryId: product.categoryId,
          categoryName: product.category?.name || 'Uncategorized',
          variantName: variant.variantName,
          sku: variant.sku,
          availableStock,
          reservedStock,
          threshold,
          status,
          lastUpdated,
          stock: availableStock // map availableStock to `stock` for modal compatibility
        });
      });
    });
    return items;
  }, [products]);

  const handleExport = () => {
    try {
      if (filteredItems.length === 0) {
        toast.error("No items to export");
        return;
      }
      
      const headers = ['Product', 'Category', 'Variant', 'SKU', 'Available', 'Reserved', 'Status', 'Last Updated'];
      const csvRows = filteredItems.map(item => [
        `"${(item.productName || '').replace(/"/g, '""')}"`,
        `"${(item.categoryName || '').replace(/"/g, '""')}"`,
        `"${(item.variantName || '').replace(/"/g, '""')}"`,
        item.sku || '',
        item.availableStock || 0,
        item.reservedStock || 0,
        item.status || '',
        item.lastUpdated || ''
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

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  const getStatusDot = (status) => {
    switch (status) {
      case 'IN_STOCK': return (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          In Stock
        </span>
      );
      case 'LOW_STOCK': return (
        <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          Low Stock
        </span>
      );
      case 'OUT_OF_STOCK': return (
        <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
          Out of Stock
        </span>
      );
      default: return <span className="text-sm text-gray-500">{status}</span>;
    }
  };

  const formatLastUpdated = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (isToday) return `Today, ${timeStr}`;
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
    } catch {
      return '—';
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
    <div className="space-y-6">
      {/* Header Row */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Inventory</h1>
      </header>

      {/* Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <nav className="flex items-center gap-2 text-sm font-semibold text-gray-600 flex-wrap">
          <span>SKUs: <strong className="text-gray-900">{totalSkus}</strong></span>
          <span className="text-gray-300">•</span>
          <span>Available: <strong className="text-emerald-600">{totalAvailableStock}</strong></span>
          <span className="text-gray-300">•</span>
          <span>Low Stock: <strong className={lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}>{lowStockCount}</strong></span>
          <span className="text-gray-300">•</span>
          <span>Out of Stock: <strong className={outOfStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}>{outOfStockCount}</strong></span>
        </nav>

        <div className="relative">
          <button
            onClick={() => setShowAdjustDropdown(!showAdjustDropdown)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A2B] text-white font-bold rounded-lg text-sm hover:bg-[#162A1F] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Adjust Stock
            <ChevronDown size={14} />
          </button>
          {showAdjustDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAdjustDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease' }}>
                {inventoryItems.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {inventoryItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedVariant(item);
                          setShowAdjustDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantName} · {item.availableStock} available</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No variants found</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-[#1E3A2B]" />
          </div>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/20 transition-all bg-white"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="relative flex items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-white font-semibold text-gray-700 min-w-[160px] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative flex items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] appearance-none bg-white font-semibold text-gray-700 min-w-[150px] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 text-gray-500 pointer-events-none" />
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 bg-white transition-colors ml-auto shrink-0 cursor-pointer"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Inventory Table */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Box size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No inventory items found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Product <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Variant / SKU <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Available <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Reserved <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Status <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">Last Updated <ArrowUpDown size={12} className="text-gray-400" /></span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img src={item.productImage} alt={item.productName} className="w-11 h-11 rounded-lg object-cover border border-gray-100" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{item.variantName}</span>
                        <span className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">SKU: {item.sku || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`font-bold text-base ${item.status === 'IN_STOCK' ? 'text-emerald-600' : item.status === 'LOW_STOCK' ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.availableStock}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-semibold text-gray-700">{item.reservedStock}</span>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusDot(item.status)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-600">{formatLastUpdated(item.lastUpdated)}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => setSelectedVariant(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredItems.length > 0 && (
          <footer className="border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * perPage + 1, filteredItems.length)} to {Math.min(page * perPage, filteredItems.length)} of {filteredItems.length} results
            </p>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm outline-none appearance-none bg-white font-bold text-gray-700 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 text-gray-500 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                      page === p
                        ? 'bg-[#1E3A2B] text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </footer>
        )}
      </section>

      <StockAdjustmentModal 
        isOpen={!!selectedVariant} 
        onClose={() => setSelectedVariant(null)} 
        variantData={selectedVariant}
        productName={selectedVariant?.productName}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
