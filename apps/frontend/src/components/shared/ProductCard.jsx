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
                  <span className="text-[12px] font-semibold text-[#154D21] relative -top-[0.3em] mr-[1px]">₹</span>
                  <span className="text-[22px] font-extrabold text-[#154D21] leading-none">{integerPart}</span>
                  <span className="text-[12px] font-bold text-[#154D21] relative -top-[0.4em] ml-[1px]">{decimalPart}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  M.R.P.: <span className="line-through">₹{Number(compareAtPrice.toFixed(0)).toLocaleString('en-IN')}.00</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline">
                <span className="text-[12px] font-semibold text-[#154D21] relative -top-[0.3em] mr-[1px]">₹</span>
                <span className="text-[22px] font-extrabold text-[#154D21] leading-none">{integerPart}</span>
                <span className="text-[12px] font-bold text-[#154D21] relative -top-[0.4em] ml-[1px]">{decimalPart}</span>
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

  if (variant === 'organic-list') {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="group bg-white rounded-xl border border-gray-100 flex flex-col h-full overflow-hidden"
      >
        {/* Image Container */}
        <Link to={`/products/${slug}`} className="relative block bg-[#F9FAFB] aspect-square p-3 flex items-center justify-center overflow-hidden rounded-t-xl">
          <img 
            src={mainImage} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
            loading="lazy"
          />
          
          {/* Organic Badge */}
          <div className="absolute top-2.5 left-2.5 bg-white border border-gray-100 text-[#154D21] px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold flex items-center gap-1 z-10 shadow-sm">
            <Leaf size={9} className="fill-[#154D21] stroke-0" />
            Organic
          </div>

          {/* Favorite Button */}
          <WishlistButton 
            productId={product.id} 
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 transition-all border border-gray-100 p-0 z-10"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wide">OUT OF STOCK</span>
            </div>
          )}
        </Link>
        
        {/* Product Details */}
        <div className="p-3 flex flex-col flex-1 bg-white">
          <Link to={`/products/${slug}`} className="text-[13px] font-bold text-[#111827] line-clamp-1 hover:text-[#154D21] transition-colors mb-1">
            {name}
          </Link>

          {/* Ratings */}
          <div className="flex items-center gap-1 mb-2">
            <Star size={10} className="text-[#FBBF24] fill-[#FBBF24]" />
            <span className="text-[10px] font-bold text-gray-700">{(product.averageRating || 0.0).toFixed(1)}</span>
            <span className="text-[10px] text-gray-400 font-medium">({product.totalReviews || 0})</span>
          </div>

          {/* Price & Variant */}
          <div className="flex flex-col mb-3">
            <span className="text-[15px] font-extrabold text-[#154D21] leading-none mb-1">₹{price.toFixed(2)}</span>
            <span className="text-[10px] font-medium text-gray-400">{variantName}</span>
          </div>
          
          {/* Add to Cart Button */}
          <div className="mt-auto">
            <button
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
              className="w-full h-[32px] rounded-md flex items-center justify-center gap-1.5 bg-[#F0FDF4] border border-[#154D21]/20 text-[#154D21] hover:bg-[#DCFCE7] transition-colors disabled:opacity-50 text-[12px] font-bold"
            >
              <ShoppingCart size={13} className="stroke-[2.5]" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group bg-white rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden"
    >
      {/* Image Container */}
      <Link to={`/products/${slug}`} className="relative block w-full aspect-[4/3] bg-[#F9FAFB] overflow-hidden">
        <img 
          src={mainImage} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Organic Badge */}
        <div className="absolute top-3 left-3 bg-white/95 text-[#154D21] px-2 py-1 rounded-[4px] text-[10px] font-bold flex items-center gap-1 z-10 shadow-sm">
          <Leaf size={10} className="stroke-[2.5]" />
          Organic
        </div>

        {/* Favorite Button */}
        <WishlistButton 
          productId={product.id} 
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-gray-400 hover:text-red-500 transition-all border-none p-0 z-10"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full tracking-wide">OUT OF STOCK</span>
          </div>
        )}
      </Link>
      
      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        
        <Link to={`/products/${slug}`} className="text-[15px] font-bold text-[#111827] line-clamp-1 hover:text-[#154D21] transition-colors mb-2">
          {name}
        </Link>

        {/* Ratings */}
        <div className="flex items-center gap-1 mb-4">
          <Star size={12} className="text-[#FFB800] fill-[#FFB800]" />
          <span className="text-[12px] font-bold text-gray-600">{(product.averageRating || 0.0).toFixed(1)}</span>
          <span className="text-[12px] text-gray-400 font-medium ml-1">({product.totalReviews || 0})</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[18px] font-bold text-[#154D21] leading-none mb-1.5">₹{price.toFixed(2)}</span>
            <span className="text-[11px] font-medium text-gray-400">{variantName}</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#154D21] text-white hover:bg-[#103B19] transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            <ShoppingCart size={15} className="stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
