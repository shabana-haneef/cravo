import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const ProductCard = ({ product }) => {
  const { name, slug, shop, variants, images, category } = product;
  const mainImage = images?.[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image';
  const defaultVariant = variants?.[0];
  const price = defaultVariant?.price || 0;
  const isOutOfStock = defaultVariant?.inventory?.availableStock <= 0;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full">
      <Link to={`/products/${slug}`} className="relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={mainImage} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
            {category?.name}
          </span>
        </div>
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${slug}`} className="text-lg font-semibold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
          {name}
        </Link>
        
        <div className="flex items-center text-sm text-gray-500 mt-1 mb-2">
          <Store size={14} className="mr-1" />
          <span className="truncate">{shop?.name}</span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{defaultVariant?.name}</p>
            <p className="text-lg font-bold text-gray-900">₹{price.toFixed(2)}</p>
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            disabled={isOutOfStock}
            className="!px-3 !py-1.5"
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic will go here
            }}
          >
            <ShoppingBag size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
