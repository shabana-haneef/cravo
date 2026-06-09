import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, ShoppingCart, Star, Heart, Leaf } from 'lucide-react';
import { useAddToCart } from '../../features/cart/hooks/useCartQueries.js';
import { toast } from 'sonner';

export const ProductCard = ({ product, variant = 'simple' }) => {
  const { name, slug, shop, variants, images, category } = product;
  const mainImage = images?.[0]?.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
  const defaultVariant = variants?.[0];
  const price = defaultVariant?.price || 0;
  // const comparePrice = defaultVariant?.compareAtPrice;
  const isOutOfStock = defaultVariant?.inventory?.availableStock <= 0;
  const variantName = defaultVariant?.name || defaultVariant?.variantName || '1 Kg'; // fallback if no name

  const { mutate: addToCart, isPending: isAdding } = useAddToCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!defaultVariant) return;

    addToCart({ 
      productId: product.id, 
      variantId: defaultVariant.id, 
      quantity: 1 
    }, {
      onSuccess: () => {
        toast.success(`Added 1x ${variantName} to cart`);
      },
      onError: (error) => {
        const msg = error.response?.data?.message || 'Failed to add item to cart';
        toast.error(msg);
      }
    });
  };

  return (
    <motion.div
      whileHover={{ y: -7, boxShadow: '0 20px 44px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col h-full"
    >
      {/* Image Container */}
      <Link to={`/products/${slug}`} className="relative block m-1.5 rounded-xl bg-[#F6F9F6] aspect-[4/3] overflow-hidden p-3">
        <img 
          src={mainImage} 
          alt={name} 
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          loading="lazy"
        />
        
        {/* Organic Badge */}
        <div className="absolute top-2 left-2 bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 border border-[#C8E6C9]/50">
          <Leaf size={12} className="stroke-[2.5]" />
          Organic
        </div>

        {/* Favorite Button */}
        <button 
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 transition-colors z-10"
          onClick={(e) => { e.preventDefault(); /* handle favorite */ }}
        >
          <Heart size={16} className="stroke-[2]" />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full tracking-wide">OUT OF STOCK</span>
          </div>
        )}
      </Link>
      
      {/* Product Details */}
      <div className="px-4 pt-3 pb-1 flex flex-col flex-1">
        {variant === 'detailed' && (
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {category?.name || 'Category'}
          </p>
        )}
        
        <Link to={`/products/${slug}`} className="text-[15px] font-bold text-[#111827] line-clamp-1 hover:text-[#1E3A2B] transition-colors mb-2 leading-snug">
          {name}
        </Link>

        {/* Ratings */}
        <div className="flex items-center gap-1.5 mb-3 text-[12px] text-gray-500 font-medium">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
              const rating = product.rating || 0;
              const isFilled = star <= Math.round(rating);
              return (
                <Star 
                  key={star} 
                  size={13} 
                  fill={isFilled ? "currentColor" : "none"} 
                  stroke="currentColor"
                  className={isFilled ? "text-[#FFB800]" : "text-gray-300"}
                />
              );
            })}
          </div>
          <span>{(product.rating || 0).toFixed(1)} ({product.numReviews || 0})</span>
        </div>

        {variant === 'detailed' && (
          <div className="flex items-center text-[12px] text-gray-500 font-medium mt-auto mb-2">
            <Store size={14} className="mr-1.5 opacity-70" />
            <span className="truncate">{shop?.name}</span>
          </div>
        )}
      </div>

      {/* Price & Action */}
      <div className="px-4 pb-4 flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[18px] font-bold text-[#B88645] leading-none mb-1">₹{price.toFixed(2)}</span>
          <span className="text-[12px] font-medium text-gray-400">{variantName}</span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.13, borderColor: '#00B259', color: '#00B259' }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-white text-gray-500 transition-colors disabled:opacity-50 shadow-sm"
        >
          <ShoppingCart size={18} className="stroke-[2.5]" />
        </motion.button>
      </div>
    </motion.div>
  );
};
