import React from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { useProducts } from '../../products/hooks/useProductQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { DebouncedSearch } from '../../../components/shared/DebouncedSearch.jsx';
import { CategorySkeleton, ProductSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export const HomePage = () => {
  const { data: catData, isLoading: catLoading, isError: catError, refetch: refetchCat } = useCategories();
  const { data: prodData, isLoading: prodLoading, isError: prodError, refetch: refetchProd } = useProducts({ limit: 8, sort: 'latest' });

  const categories = catData?.data?.categories || [];
  const featuredProducts = prodData?.data?.products || [];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl mt-4 min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="/hero-bg.png" 
            alt="Farmers market" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/40 mix-blend-multiply"></div>
        </div>
        
        <div className="relative px-6 py-16 sm:px-12 sm:py-24 z-10 flex flex-col items-center text-center w-full">
          <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium border border-white/30 mb-6 shadow-sm">
            🌱 100% Organic & Homemade
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
            Fresh local goods, <br className="hidden sm:block" /> delivered to you.
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-gray-100 mb-10 drop-shadow-md font-medium">
            Discover the best homemade foods, organic groceries, and artisanal products directly from sellers in your neighborhood.
          </p>
          
          <div className="w-full max-w-2xl mx-auto p-2 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
            <DebouncedSearch 
              placeholder="Search for fresh vegetables, homemade cakes..." 
              className="bg-white rounded-xl overflow-hidden" 
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Explore Categories</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm">
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        {catError ? (
          <ErrorState title="Failed to load categories" onRetry={refetchCat} />
        ) : (
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">
            {catLoading ? (
              Array(6).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <Link 
                  key={category.id} 
                  to={`/products?category=${category.slug}`}
                  className="flex flex-col items-center min-w-[100px] sm:min-w-[120px] snap-start group"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-shadow group-hover:ring-4 ring-blue-50">
                    <img 
                      src={category.imageUrl || 'https://via.placeholder.com/150'} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">
                    {category.name}
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
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingBag className="mr-2 text-blue-600" /> New Arrivals
          </h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm">
            Browse Market <ArrowRight size={16} className="ml-1" />
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

      {/* Placeholder for Popular Shops */}
      <section className="bg-blue-50 rounded-2xl p-8 sm:p-12 text-center border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Support Local Businesses</h2>
        <p className="text-blue-700 max-w-2xl mx-auto mb-8">
          Cravo connects you directly with passionate home chefs, farmers, and boutique stores in your neighborhood.
        </p>
        <div className="inline-flex items-center justify-center space-x-2">
          {/* Mock avatars */}
          <div className="flex -space-x-3">
            <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://ui-avatars.com/api/?name=S+K&background=random" alt="" />
            <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://ui-avatars.com/api/?name=A+M&background=random" alt="" />
            <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://ui-avatars.com/api/?name=R+P&background=random" alt="" />
          </div>
          <span className="text-sm font-medium text-blue-800 ml-4">Join 500+ local sellers</span>
        </div>
      </section>
    </div>
  );
};
