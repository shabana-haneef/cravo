import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../products/hooks/useProductQueries.js';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { DebouncedSearch } from '../../../components/shared/DebouncedSearch.jsx';
import { ProductSkeleton } from '../../../components/shared/Skeletons.jsx';
import { EmptyState } from '../../../components/shared/EmptyState.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Filter, Store, ChevronDown, Leaf } from 'lucide-react';
import { ScrollReveal, StaggerReveal, StaggerItem, fadeUp } from '../../../components/shared/Motion.jsx';

export const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Queries
  const { data: catData } = useCategories();
  const categories = catData?.data?.categories || [];

  const { data: prodData, isLoading, isError, refetch, isFetching } = useProducts({
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    page,
    limit: 12
  });

  const products = prodData?.data?.products || [];
  const totalPages = prodData?.data?.pagination?.totalPages || 1;

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort !== 'latest') params.set('sort', sort);
    if (page > 1) params.set('page', page);
    setSearchParams(params, { replace: true });
  }, [search, category, minPrice, maxPrice, sort, page, setSearchParams]);

  const handleSearch = (term) => {
    setSearch(term);
    setPage(1); // Reset page on new search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <ScrollReveal variant={fadeUp} className="mb-12 text-center mt-6">
        <div className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-[#154D21] mb-3">
          <Leaf size={16} className="stroke-[2.5]" />
          Premium. Organic. Local.
        </div>
        <h1 className="text-[40px] font-extrabold text-[#111827] mb-3 tracking-tight">Shop Our Collection</h1>
        <p className="text-[#5B6B79] max-w-lg mx-auto text-[14px]">Discover our range of premium, organic, and handcrafted products directly from trusted local sellers.</p>
      </ScrollReveal>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] z-10 custom-scrollbar overflow-y-auto rounded-2xl">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#154D21]" />
                <h2 className="text-[17px] font-bold text-[#111827]">Filters</h2>
              </div>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setPage(1); }}
                className="text-[12px] font-bold text-[#154D21] hover:text-[#103B19] transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-8">
              {/* Categories */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Categories</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-3 cursor-pointer group py-1">
                    <div className={`w-[18px] h-[18px] shrink-0 rounded-full border-[2px] flex items-center justify-center transition-all duration-200 ${category === '' ? 'border-[#154D21]' : 'border-gray-300 group-hover:border-[#154D21]'}`}>
                      {category === '' && <div className="w-2.5 h-2.5 bg-[#154D21] rounded-full scale-in" />}
                    </div>
                    <span className={`text-[14px] transition-colors ${category === '' ? 'text-[#111827] font-bold' : 'text-gray-600 font-medium group-hover:text-gray-900'}`}>All Categories</span>
                    <input 
                      type="radio" 
                      name="category" 
                      className="hidden" 
                      checked={category === ''}
                      onChange={() => { setCategory(''); setPage(1); }}
                    />
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group py-1">
                      <div className={`w-[18px] h-[18px] shrink-0 rounded-full border-[2px] flex items-center justify-center transition-all duration-200 ${category === cat.slug ? 'border-[#154D21]' : 'border-gray-300 group-hover:border-[#154D21]'}`}>
                        {category === cat.slug && <div className="w-2.5 h-2.5 bg-[#154D21] rounded-full scale-in" />}
                      </div>
                      <span className={`text-[14px] transition-colors ${category === cat.slug ? 'text-[#111827] font-bold' : 'text-gray-600 font-medium group-hover:text-gray-900'}`}>{cat.name}</span>
                      <input 
                        type="radio" 
                        name="category" 
                        className="hidden"
                        checked={category === cat.slug}
                        onChange={() => { setCategory(cat.slug); setPage(1); }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Price Range (₹)</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px] font-medium">₹</span>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 focus:ring-1 focus:ring-[#154D21] focus:border-[#154D21] transition-colors outline-none bg-white"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    />
                  </div>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px] font-medium">₹</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 focus:ring-1 focus:ring-[#154D21] focus:border-[#154D21] transition-colors outline-none bg-white"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => refetch()}
                className="w-full py-3 bg-[#154D21] hover:bg-[#103B19] text-white rounded-lg text-[14px] font-bold transition-colors shadow-sm"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="w-full sm:flex-1 sm:max-w-xl">
              <div className="relative">
                <DebouncedSearch 
                  onSearch={handleSearch} 
                  placeholder="Search for products, categories, or keywords..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[14px] bg-white shadow-sm focus:ring-1 focus:ring-[#154D21] focus:border-[#154D21] outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <label className="text-[13px] text-gray-600">Sort by:</label>
              <div className="relative">
                <select 
                  className="appearance-none pl-1 pr-6 text-[14px] font-bold text-[#111827] bg-transparent outline-none cursor-pointer"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                >
                  <option value="latest">Latest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {isError ? (
            <ErrorState title="Failed to load products" message="There was a problem communicating with the server." onRetry={refetch} />
          ) : (isLoading && products.length === 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(9).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <>
              <StaggerReveal className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} variant="detailed" />
                  </StaggerItem>
                ))}
              </StaggerReveal>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-12 flex items-center justify-center border border-dashed border-gray-200">
              <EmptyState 
                icon={Store}
                title="No products found" 
                description="Try adjusting your filters or search terms to find what you're looking for."
                action={<button onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); }} className="mt-4 px-6 py-2 bg-[#1E3A2B] text-white rounded-full text-sm font-medium hover:bg-[#162A1F] transition-colors">Clear all filters</button>}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
