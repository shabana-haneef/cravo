import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, ShoppingCart, Star, Leaf } from 'lucide-react';
import { useAddToCart } from '../../features/cart/hooks/useCartQueries.js';
import { toast } from 'sonner';
import { WishlistButton } from '../../features/wishlist/components/WishlistButton.jsx';

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
        const variantSuffix = variantName && variantName.toLowerCase() !== 'default'
          ? ` (${variantName})`
          : '';
        toast.success(`Added 1x "${name}"${variantSuffix} to cart`);
      },
      onError: (error) => {
        const msg = error.response?.data?.message || 'Failed to add item to cart';
        toast.error(msg);
      }
    });
  };

  if (variant === 'wishlist') {
    const compareAtPrice = defaultVariant?.compareAtPrice;
    const hasDiscount = compareAtPrice && compareAtPrice > price;
    const discountPercent = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

    const priceParts = price.toFixed(2).split('.');
    const integerPart = Number(priceParts[0]).toLocaleString('en-IN');
    const decimalPart = priceParts[1];

    const isSize = /\b\d+\s*(kg|g|ml|l|oz|lb|pack|piece|pcs|in|cm|m)\b/i.test(variantName) || /^\d+(\.\d+)?\s*(kg|g|ml|l|oz|lb|pack|piece|pcs|in|cm|m)?$/i.test(variantName);
    const label = isSize ? 'Size' : 'Colour';

    return (
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="group bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden p-3 relative text-left"
      >
        {/* Favorite Button */}
        <WishlistButton 
          productId={product.id} 
          className="absolute top-2 right-2 z-10 w-8 h-8 p-0 shadow-sm bg-white/95 rounded-full flex items-center justify-center"
        />

        {/* Image Container */}
        <Link to={`/products/${slug}`} className="relative block w-full aspect-square bg-[#F6F9F6] rounded-lg overflow-hidden p-2 flex items-center justify-center mb-3">
          <img 
            src={mainImage} 
            alt={name} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
            loading="lazy"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">OUT OF STOCK</span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="flex flex-col flex-1 px-1">
          {/* Title */}
          <Link 
            to={`/products/${slug}`} 
            className="text-[14px] font-medium text-gray-900 line-clamp-2 leading-tight hover:text-green-700 transition-colors mb-2 min-h-[36px]"
          >
            {name}
          </Link>

          {/* Price & Discount Section */}
          <div className="flex flex-col gap-0.5 mt-auto">
            {hasDiscount ? (
              <>
                <div className="flex items-baseline flex-wrap">
                  <span className="bg-[#CC0C39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded leading-none mr-2">
                    -{discountPercent}%
                  </span>
                  <span className="text-[12px] font-semibold text-gray-950 relative -top-[0.3em] mr-[1px]">₹</span>
                  <span className="text-[22px] font-extrabold text-gray-950 leading-none">{integerPart}</span>
                  <span className="text-[12px] font-bold text-gray-950 relative -top-[0.4em] ml-[1px]">{decimalPart}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  M.R.P.: <span className="line-through">₹{Number(compareAtPrice.toFixed(0)).toLocaleString('en-IN')}.00</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline">
                <span className="text-[12px] font-semibold text-gray-950 relative -top-[0.3em] mr-[1px]">₹</span>
                <span className="text-[22px] font-extrabold text-gray-950 leading-none">{integerPart}</span>
                <span className="text-[12px] font-bold text-gray-950 relative -top-[0.4em] ml-[1px]">{decimalPart}</span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <p className={`text-xs font-semibold mt-2 ${isOutOfStock ? 'text-[#B12704]' : 'text-[#007600]'}`}>
            {isOutOfStock ? 'Out of stock' : 'In stock'}
          </p>

          {/* Variant Property */}
          {variantName && (
            <p className="text-xs text-gray-700 mt-1">
              <span className="font-semibold">{label}:</span> {variantName}
            </p>
          )}

          {/* Move to Cart Button */}
          <button
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
            className="w-full mt-4 py-2 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            {isAdding ? 'Moving...' : 'Move to cart'}
          </button>
        </div>
      </motion.div>
    );
  }

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
        <WishlistButton 
          productId={product.id} 
          className="absolute top-2 right-2 w-8 h-8 p-0 z-10 shadow-sm"
        />

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
          whileHover={{ scale: 1.13, borderColor: '#154D21', color: '#154D21' }}
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
