import React from 'react';
import { useWishlist } from '../hooks/useWishlistQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.jsx';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const WishlistPage = () => {
  const { data: wishlist = [], isLoading } = useWishlist();

  if (isLoading) {
    return <LoadingScreen message="Loading your wishlist..." />;
  }

  // extract the products from the wishlist items
  const wishlistedProducts = wishlist.map(item => item.product).filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            <Link to="/" className="hover:text-gray-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Back to Home
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] flex items-center gap-2.5">
            My <span className="text-rose-500">Wishlist</span>
            <Heart size={26} className="fill-rose-500 stroke-rose-500 shrink-0" />
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500">
          You have <span className="text-rose-500 font-bold">{wishlistedProducts.length}</span> {wishlistedProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {wishlistedProducts.length === 0 ? (
        /* Empty State */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-gray-100 rounded-3xl p-10 md:p-16 text-center shadow-[0_2px_15px_rgba(0,0,0,0.02)] max-w-lg mx-auto mt-12 flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
            <Heart size={28} className="stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-sm">
            Save items that you like to your wishlist. You can buy them or view them anytime later.
          </p>
          <Link 
            to="/products"
            className="inline-flex items-center gap-2 bg-[#00B259] hover:bg-[#009B4E] text-white font-semibold text-[13px] px-6 py-3 rounded-full shadow-lg shadow-[#00B259]/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ShoppingBag size={16} /> Start Shopping
          </Link>
        </motion.div>
      ) : (
        /* Products Grid */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
        >
          {wishlistedProducts.map(product => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} variant="detailed" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
