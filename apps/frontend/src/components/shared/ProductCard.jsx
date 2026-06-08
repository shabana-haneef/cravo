import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShoppingCart, Star } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { name, slug, shop, variants, images, category } = product;
  const mainImage = images?.[0]?.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
  const defaultVariant = variants?.[0];
  const price = defaultVariant?.price || 0;
  const comparePrice = defaultVariant?.compareAtPrice;
  const isOutOfStock = defaultVariant?.inventory?.availableStock <= 0;

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
      <Link to={`/products/${slug}`} className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-6">
        <img 
          src={mainImage} 
          alt={name} 
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full tracking-wide">OUT OF STOCK</span>
          </div>
        )}
        {comparePrice && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#B88645] text-white text-[10px] font-bold px-2 py-1 rounded">
              SALE
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-6 flex flex-col flex-1 bg-white">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {category?.name || 'Category'}
        </p>
        
        <Link to={`/products/${slug}`} className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-[#1E3A2B] transition-colors mb-2 leading-snug">
          {name}
        </Link>

        {/* Ratings placeholder */}
        <div className="flex items-center gap-1 mb-4">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={14} fill="currentColor" />
            ))}
          </div>
          <span className="text-gray-400 text-xs ml-1">(4.8)</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-5 border-b border-gray-50 pb-5">
          <Store size={16} className="mr-2 opacity-70" />
          <span className="truncate">{shop?.name}</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#B88645]">₹{price.toFixed(2)}</span>
              {comparePrice && (
                <span className="text-sm font-medium text-gray-400 line-through">₹{comparePrice.toFixed(2)}</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{defaultVariant?.name}</span>
          </div>
          <button 
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic will go here
            }}
            className="w-12 h-12 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-[#1E3A2B] hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-gray-50 disabled:hover:text-gray-700 border border-gray-100 hover:border-transparent shrink-0 shadow-sm"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
