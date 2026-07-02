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
import { RangeSlider } from '../../../components/ui/RangeSlider.jsx';
import { Filter, Store, ChevronDown, Leaf, CheckCircle2, ShieldCheck, Truck, X, Search, Apple, Carrot, Milk, Croissant, Coffee, Wheat, Cookie, Droplet, Star, StarHalf, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollReveal, StaggerReveal, StaggerItem, fadeUp } from '../../../components/shared/Motion.jsx';
import shopBanner from '../../../assets/minimal-basket.png';

export const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State for filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  let initialMin = searchParams.get('minPrice') || '';
  if (initialMin === 'NaN' || isNaN(Number(initialMin))) initialMin = '';
  const [minPrice, setMinPrice] = useState(initialMin);

  let initialMax = searchParams.get('maxPrice') || '';
  if (initialMax === 'NaN' || isNaN(Number(initialMax))) initialMax = '';
  const [maxPrice, setMaxPrice] = useState(initialMax);

  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [ratingFilter, setRatingFilter] = useState(''); // e.g. '4', '3', '2', '1'
  const [inStockOnly, setInStockOnly] = useState(false);

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
    <div className="w-full">
      {/* Page Header / Banner */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl relative overflow-hidden mb-8 min-h-[160px] flex items-center">
        <div className="p-5 lg:p-6 z-10 w-full lg:w-3/5">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#154D21] mb-2">
            <Leaf size={16} className="fill-[#154D21]" />
            Premium Organic Products
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-[#111827] tracking-tight mb-2">
            Shop Our Collection
          </h1>
          <p className="text-gray-500 text-[13px] lg:text-[14px] max-w-lg mb-4 leading-relaxed font-medium">
            Discover our range of premium, organic, and handcrafted products directly from trusted local sellers.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 lg:gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EA] flex items-center justify-center text-[#154D21]">
                <CheckCircle2 size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#111827] leading-tight">100% Organic</span>
                <span className="text-[9px] text-gray-500 font-medium">Certified & Natural</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EA] flex items-center justify-center text-[#154D21]">
                <Truck size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#111827] leading-tight">Fast Delivery</span>
                <span className="text-[9px] text-gray-500 font-medium">Quick & Safe</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EA] flex items-center justify-center text-[#154D21]">
                <ShieldCheck size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#111827] leading-tight">Secure Payment</span>
                <span className="text-[9px] text-gray-500 font-medium">100% Protected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 h-full w-[50%] hidden lg:block">
          <img
            src={shopBanner}
            alt="Cravo Premium Collection"
            className="w-full h-full object-contain object-right p-0 pr-4 scale-[1.65] origin-right transition-transform duration-300 hover:scale-[1.7] motion-reduce:transition-none motion-reduce:hover:scale-[1.65]"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-[260px] flex-shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] z-10 custom-scrollbar overflow-y-auto rounded-xl">
          {/* Header */}
          <div className="bg-[#F9FAFB] px-5 py-4 rounded-xl flex items-center justify-between mb-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-800" />
              <h2 className="text-[15px] font-bold text-gray-900">Filter</h2>
            </div>
          </div>

          <div className="bg-white px-5 py-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Filters</h2>
              <X size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 lg:hidden" onClick={() => toast.info('Close filters menu')} />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategory(''); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${category === '' ? 'bg-[#F0FDF4] text-[#154D21]' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  <Store size={18} className={category === '' ? 'text-[#154D21]' : 'text-gray-400'} />
                  <span className={`text-[14px] ${category === '' ? 'font-bold' : 'font-medium'}`}>All Categories</span>
                </button>

                {categories.map((cat, idx) => {
                  // Map category names to lucide icons (fallback to Store)
                  let Icon = Store;
                  const name = cat.name.toLowerCase();
                  if (name.includes('fruit')) Icon = Apple;
                  else if (name.includes('vegetable')) Icon = Carrot;
                  else if (name.includes('dairy') || name.includes('egg')) Icon = Milk;
                  else if (name.includes('baker')) Icon = Croissant;
                  else if (name.includes('beverage')) Icon = Coffee;
                  else if (name.includes('grain') || name.includes('pulse')) Icon = Wheat;
                  else if (name.includes('snack')) Icon = Cookie;
                  else if (name.includes('oil') || name.includes('masala')) Icon = Droplet;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.slug); setPage(1); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${category === cat.slug ? 'bg-[#F0FDF4] text-[#154D21]' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      <Icon size={18} className={category === cat.slug ? 'text-[#154D21]' : 'text-gray-400'} />
                      <span className={`text-[14px] ${category === cat.slug ? 'font-bold' : 'font-medium'}`}>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-4">Price Range</h3>
              <div className="mb-6">
                <RangeSlider
                  min={0}
                  max={5000}
                  minVal={minPrice || 0}
                  maxVal={maxPrice || 5000}
                  onChange={({ min, max }) => {
                    setMinPrice(String(min));
                    setMaxPrice(String(max));
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#154D21] bg-white"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#154D21] bg-white"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Ratings</h3>
              <div className="space-y-3">
                {[4, 3, 2, 1].map(num => (
                  <label key={num} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#154D21] focus:ring-[#154D21]"
                      checked={ratingFilter === String(num)}
                      onChange={() => {
                        setRatingFilter(prev => prev === String(num) ? '' : String(num));
                        setPage(1);
                      }}
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < num ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                      ))}
                    </div>
                    <span className="text-[13px] text-gray-500">(& above)</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Availability</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#154D21] focus:ring-[#154D21]"
                  checked={inStockOnly}
                  onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                />
                <span className="text-[14px] text-gray-700">In Stock Only</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => refetch()}
                className="w-full py-3 bg-[#113B1A] hover:bg-[#0A2610] text-white rounded-lg text-[14px] font-bold transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setRatingFilter(''); setInStockOnly(false); setPage(1); }}
                className="w-full py-3 text-[#113B1A] font-bold text-[14px] hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar (Sort & View) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500 font-medium">Sort by:</span>
              <div className="relative bg-white border border-gray-200 rounded-lg flex items-center px-3 py-1.5 min-w-[140px] cursor-pointer">
                <select
                  className="appearance-none w-full text-[13px] font-bold text-gray-900 bg-transparent outline-none cursor-pointer pr-4"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                >
                  <option value="latest">Latest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[13px] text-gray-500">
                Showing {products.length > 0 ? (page - 1) * 12 + 1 : 0}-{Math.min(page * 12, prodData?.data?.pagination?.totalItems || 0)} of {prodData?.data?.pagination?.totalItems || 0} products
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {isError ? (
            <ErrorState title="Failed to load products" message="There was a problem communicating with the server." onRetry={refetch} />
          ) : (isLoading && products.length === 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <>
              <StaggerReveal className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} variant="organic-list" />
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
