import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { Search, ArrowLeft } from 'lucide-react';
import { StaggerReveal, StaggerItem, scaleIn } from '../../../components/shared/Motion.jsx';

export const CategoriesPage = () => {
  const { data: catData, isLoading, isError, refetch } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = catData?.data?.categories || [];

  // Filter categories by search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ErrorState title="Failed to load categories" onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back button & Header area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#154D21] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">All Categories</h1>
        </div>

        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#154D21] focus:ring-2 focus:ring-[#154D21]/10 outline-none transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 animate-pulse w-[110px] sm:w-[130px]">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-100 border border-gray-200" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <StaggerReveal className="flex flex-wrap justify-center gap-x-8 gap-y-8">
          {filteredCategories.map((category) => (
            <StaggerItem key={category.id}>
              <motion.div 
                whileHover={{ y: -5 }} 
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Link
                  to={`/products?category=${category.slug}`}
                  className="flex flex-col items-center group cursor-pointer w-[110px] sm:w-[130px]"
                >
                  {/* Rounded image with borders and shadow */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-white shadow-md flex items-center justify-center p-0.5 bg-gray-50 relative group-hover:scale-[1.03] transition-transform duration-300">
                    <img 
                      src={category.imageUrl || '/grocery-bag.png'} 
                      alt={category.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </div>
                  
                  {/* Category Name */}
                  <span className="mt-3.5 text-[14px] font-bold text-gray-700 text-center tracking-tight leading-tight group-hover:text-[#154D21] transition-colors block px-2">
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">No categories found matching "{searchQuery}"</p>
        </div>
      )}

    </div>
  );
};
