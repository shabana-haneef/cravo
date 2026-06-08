import React from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { useProducts } from '../../products/hooks/useProductQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { DebouncedSearch } from '../../../components/shared/DebouncedSearch.jsx';
import { CategorySkeleton, ProductSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ArrowRight, ShoppingBag, Search, CheckCircle2, Leaf, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';

export const HomePage = () => {
  const { data: catData, isLoading: catLoading, isError: catError, refetch: refetchCat } = useCategories();
  const { data: prodData, isLoading: prodLoading, isError: prodError, refetch: refetchProd } = useProducts({ limit: 8, sort: 'latest' });

  const categories = catData?.data?.categories || [];
  const featuredProducts = prodData?.data?.products || [];

  return (
    <div className="pb-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden mt-2 min-h-[500px] flex items-center justify-center bg-[#1E293B]">
        <div className="absolute inset-0">
          <img 
            src="/hero-bg.png" 
            alt="Farmers market" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
        </div>
        
        <div className="relative px-6 py-12 sm:px-12 z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-white text-[#111827] text-xs font-bold mb-5 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#00B259]" /> 100% Organic & Homemade
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] leading-tight font-serif text-white tracking-tight mb-5 drop-shadow-md">
            Fresh local goods, <br className="hidden sm:block" /> delivered to you.
          </h1>
          <p className="max-w-xl text-[14px] sm:text-[15px] text-gray-200 mb-8 drop-shadow font-medium leading-relaxed">
            Discover handpicked organic produce, homemade food, and artisanal products directly from sellers in your neighborhood.
          </p>
          
          <div className="w-full max-w-2xl mx-auto flex items-center bg-white rounded-full p-1.5 shadow-xl mb-6">
            <div className="flex-1 flex items-center pl-5">
              <input 
                type="text"
                placeholder="Search for fresh vegetables, homemade cakes..."
                className="w-full bg-transparent text-[14px] text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>
            <button className="bg-[#00B259] hover:bg-[#009B4E] text-white p-2.5 rounded-full transition-colors flex items-center justify-center">
              <Search size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[12px] text-white">
            <span className="font-bold mr-1">Popular:</span>
            <button className="px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-gray-900 transition-colors">Organic Vegetables</button>
            <button className="px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-gray-900 transition-colors">Fresh Fruits</button>
            <button className="px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-gray-900 transition-colors">Homemade Bakery</button>
            <button className="px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-gray-900 transition-colors hidden sm:block">Dairy Products</button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#111827] font-serif">Explore Categories</h2>
          <Link to="/products" className="text-[#00B259] hover:text-[#009B4E] font-semibold flex items-center text-xs tracking-wider uppercase">
            View All Categories <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        {catError ? (
          <ErrorState title="Failed to load categories" onRetry={refetchCat} />
        ) : (
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-5 snap-x hide-scrollbar">
            {catLoading ? (
              Array(6).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <Link 
                  key={category.id} 
                  to={`/products?category=${category.slug}`}
                  className="flex flex-col items-center min-w-[140px] sm:min-w-[160px] snap-start group bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 p-6 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F6F9F6] mb-4 flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                    <img 
                      src={category.imageUrl || 'https://via.placeholder.com/150'} 
                      alt={category.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <span className="text-[14px] font-bold text-[#111827] text-center leading-tight">
                    {category.name?.split(' ').map((word, idx) => <React.Fragment key={idx}>{word}<br/></React.Fragment>)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No categories found.</p>
            )}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#111827] flex items-center font-serif">
            <ShoppingBag size={24} className="mr-3 text-[#00B259] stroke-[2.5]" /> New Arrivals
          </h2>
          <Link to="/products" className="text-[#00B259] hover:text-[#009B4E] font-semibold flex items-center text-xs tracking-wider uppercase">
            View All Products <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        {prodError ? (
          <ErrorState title="Failed to load products" onRetry={refetchProd} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {prodLoading ? (
              Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full">
                <p className="text-gray-500">No products available right now.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Support Local Businesses Banner */}
      <section className="mt-12 bg-[#F0FDF4] rounded-3xl p-8 sm:p-12 border border-[#C8E6C9] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00B259]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#00B259]/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex items-center gap-10">
          <div className="hidden md:block w-48 h-48 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-xl">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" alt="Basket" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-[#111827] mb-4 font-serif">Support Local Businesses</h2>
            <p className="text-gray-600 max-w-xl mb-8 leading-relaxed text-[15px]">
              Cravo connects you directly with passionate home-chefs, farmers, and boutique stores in your neighborhood.
            </p>
            <Link to="/seller/application" className="inline-flex items-center px-6 py-3 bg-[#00B259] text-white font-bold rounded-full hover:bg-[#009B4E] transition-colors shadow-lg shadow-[#00B259]/20 text-sm">
              Join the Community <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center sm:items-end">
          <div className="flex -space-x-4 mb-3">
            <img className="w-12 h-12 rounded-full border-2 border-[#F0FDF4] shadow-sm object-cover" src="https://ui-avatars.com/api/?name=S+K&background=00B259&color=fff" alt="" />
            <img className="w-12 h-12 rounded-full border-2 border-[#F0FDF4] shadow-sm object-cover" src="https://ui-avatars.com/api/?name=A+M&background=E67E22&color=fff" alt="" />
            <img className="w-12 h-12 rounded-full border-2 border-[#F0FDF4] shadow-sm object-cover" src="https://ui-avatars.com/api/?name=R+P&background=B88645&color=fff" alt="" />
            <img className="w-12 h-12 rounded-full border-2 border-[#F0FDF4] shadow-sm object-cover" src="https://ui-avatars.com/api/?name=J+D&background=111827&color=fff" alt="" />
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Join 1000+ <br/>local sellers</span>
        </div>
      </section>

      {/* Bottom Features Bar */}
      <div className="mt-12 pt-8 border-t border-gray-100/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#00B259]/20 text-[#00B259]">
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">100% Organic</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Certified organic produce</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#00B259]/20 text-[#00B259]">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Fast Delivery</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Quick and safe delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#00B259]/20 text-[#00B259]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Secure Payment</p>
              <p className="text-[10px] text-gray-500 mt-0.5">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#00B259]/20 text-[#00B259]">
              <RefreshCcw size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Easy Returns</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Hassle free returns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
