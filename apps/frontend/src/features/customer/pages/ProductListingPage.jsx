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
import { Filter, Store, ChevronDown } from 'lucide-react';

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
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-[#1E3A2B] mb-3">Shop Our Collection</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">Discover our range of premium, organic, and handcrafted products directly from trusted local sellers.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Filter size={18} className="text-[#1E3A2B]" />
              <h2 className="text-lg font-bold text-gray-900 tracking-wide">Filters</h2>
            </div>

            <div className="space-y-8">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Categories</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === '' ? 'border-[#1E3A2B] bg-[#1E3A2B]' : 'border-gray-300 group-hover:border-[#1E3A2B]'}`}>
                      {category === '' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm transition-colors ${category === '' ? 'text-gray-900 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>All Categories</span>
                    <input 
                      type="radio" 
                      name="category" 
                      className="hidden" 
                      checked={category === ''}
                      onChange={() => { setCategory(''); setPage(1); }}
                    />
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === cat.slug ? 'border-[#1E3A2B] bg-[#1E3A2B]' : 'border-gray-300 group-hover:border-[#1E3A2B]'}`}>
                        {category === cat.slug && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className={`text-sm transition-colors ${category === cat.slug ? 'text-gray-900 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat.name}</span>
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
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Price Range (₹)</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-[#1E3A2B] focus:border-[#1E3A2B] transition-colors outline-none bg-gray-50 focus:bg-white"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    />
                  </div>
                  <span className="text-gray-300">-</span>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-[#1E3A2B] focus:border-[#1E3A2B] transition-colors outline-none bg-gray-50 focus:bg-white"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="w-full sm:max-w-md">
              <div className="relative">
                <DebouncedSearch onSearch={handleSearch} placeholder="Search anything..." />
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort by:</label>
              <div className="relative">
                <select 
                  className="appearance-none pl-1 pr-6 py-1 text-sm font-semibold text-[#1E3A2B] bg-transparent outline-none cursor-pointer"
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

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
