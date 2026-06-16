import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useProducts } from '../../products/hooks/useProductQueries.js';
import { useCart, useAddToCart, useClearCart } from '../../cart/hooks/useCartQueries.js';
import { DetailsSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ChevronLeft, ChevronRight, Star, Heart, Minus, Plus, AlertCircle, Leaf, CheckCircle2, Truck, ShieldCheck, RefreshCcw, ShoppingCart, Share2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

import { WishlistButton } from '../../wishlist/components/WishlistButton.jsx';

export const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useProduct(slug);
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  const { data: cartData } = useCart();
  
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showShareMenu, setShowShareMenu] = useState(false);

  const productData = data?.data?.product;
  const { data: relatedData } = useProducts(
    { category: productData?.category?.slug, limit: 5 },
    { enabled: !!productData?.category?.slug }
  );

  const relatedProducts = relatedData?.data?.products?.filter(p => p.id !== productData?.id).slice(0, 4) || [];

  if (isLoading) return <DetailsSkeleton />;
  if (isError) return <ErrorState title="Product not found" onRetry={refetch} />;

  const product = data?.data?.product;
  if (!product) return <ErrorState title="Product not found" />;

  const images = product.images || [];
  const mainImageUrl = images[activeImage]?.imageUrl || 'https://via.placeholder.com/600x600?text=No+Image';
  
  const variants = product.variants || [];
  const selectedVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
  
  const stock = selectedVariant?.inventory?.availableStock || 0;
  const isOutOfStock = stock <= 0;
  
  const cartItems = cartData?.data?.cart?.items || [];
  const isItemInCart = cartItems.some(
    item => item.productId === product.id && item.variantId === selectedVariant?.id
  );

  const handleVariantSelect = (id) => {
    setSelectedVariantId(id);
    setQuantity(1);
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const executeAddToCart = () => {
    addToCart({ 
      productId: product.id, 
      variantId: selectedVariant?.id, 
      quantity 
    }, {
      onSuccess: () => {
        const variantSuffix = selectedVariant?.name && selectedVariant.name.toLowerCase() !== 'default'
          ? ` (${selectedVariant.name})`
          : '';
        toast.success(`Added ${quantity}x "${product.name}"${variantSuffix} to cart`);
        setShowClearCartModal(false);
      },
      onError: (error) => {
        const msg = error.response?.data?.message || '';
        if (msg.includes('different shop')) {
          setShowClearCartModal(true);
        } else {
          toast.error(msg || 'Failed to add item to cart');
        }
      }
    });
  };

  const handleClearAndAdd = () => {
    clearCart(undefined, {
      onSuccess: () => executeAddToCart(),
      onError: () => toast.error('Failed to clear cart')
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on Cravo!`;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text + ' ' + url)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F6F9F6] border border-gray-100 p-6 flex items-center justify-center group">
            <img 
              src={mainImageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300"
            />
            {/* Image Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            {/* Organic Badge */}
            <div className="absolute top-4 left-4 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-[#C8E6C9]/50 z-10">
              <Leaf size={16} className="stroke-[2.5]" />
              Organic
            </div>
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={prevImage} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1 flex-1 px-2">
                {images.map((img, idx) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#F6F9F6] ${
                      activeImage === idx ? 'border-[#154D21]' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img src={img.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>

              <button onClick={nextImage} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col py-2">
          {/* Category */}
          <p className="text-[#154D21] text-[11px] font-semibold uppercase tracking-wider mb-2">
            {product.category?.name || 'ORGANIC FRUITS'}
          </p>
          
          {/* Title & Badge */}
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] leading-tight">{product.name}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] shrink-0 uppercase tracking-wide">
              {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
            </span>
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 mb-5">
            <div className="flex text-[#FFB800]">
              <Star size={14} fill="currentColor" stroke="currentColor" />
            </div>
            <span className="text-gray-500 text-xs font-medium ml-1">
              {product.averageRating ? product.averageRating.toFixed(1) : '0.0'} ({product.totalReviews || 0} Reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[26px] font-bold text-[#B88645] leading-none">
              ₹{selectedVariant?.price?.toFixed(2) || '0.00'}
            </span>
            {selectedVariant?.compareAtPrice && (
              <span className="text-sm font-medium text-gray-400 line-through ml-2">
                ₹{selectedVariant.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.shortDescription && (
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-3">Size/Volume</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant.id)}
                    className={`px-5 py-1.5 text-[13px] font-medium rounded-full border transition-all ${
                      (selectedVariantId === variant.id || (selectedVariantId === null && variants[0].id === variant.id))
                        ? 'bg-[#F0FDF4] text-[#154D21] border-[#154D21]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#154D21] hover:text-[#154D21]'
                    }`}
                  >
                    {variant.name || variant.variantName || '1 Kg'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
            {/* Qty Selector */}
            <div className="flex items-center border border-gray-200 rounded-full bg-white h-11 w-[110px] shrink-0">
              <button 
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity(q => q - 1)}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#154D21] disabled:opacity-50"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-[#111827] border-x border-gray-100">
                {quantity}
              </div>
              <button 
                disabled={quantity >= stock || isOutOfStock}
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#154D21] disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {isItemInCart ? (
              <button 
                onClick={() => navigate('/cart')}
                className="h-10 px-6 text-[13px] bg-[#154D21] text-white font-semibold rounded-full hover:bg-[#103B19] transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(0,178,89,0.3)]"
              >
                <ShoppingCart size={16} /> Go to Cart
              </button>
            ) : (
              <button 
                disabled={isOutOfStock || isAdding}
                onClick={executeAddToCart}
                className="h-10 px-6 text-[13px] bg-[#154D21] text-white font-semibold rounded-full hover:bg-[#103B19] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_14px_rgba(0,178,89,0.3)]"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
            )}
            
            <button 
              disabled={isOutOfStock || isAdding}
              className="h-10 px-6 text-[13px] bg-[#E67E22] text-white font-semibold rounded-full hover:bg-[#D35400] transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(230,126,34,0.3)]"
            >
              Buy Now
            </button>
            
            <WishlistButton 
              productId={product.id}
              className="h-11 w-11 p-0 border border-gray-200 shadow-sm"
            />
          </div>

          {/* Meta Details */}
          <div className="space-y-4">
            {/* Tags removed for cleaner UI */}
            <div className="flex items-center gap-3 pt-1">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ${
                  showShareMenu 
                    ? 'border-[#154D21] bg-[#154D21] text-white shadow-md' 
                    : 'border-gray-200 text-gray-600 bg-white hover:bg-[#F6F9F6] hover:text-[#154D21] hover:border-[#154D21]/30'
                }`}
                title="Share this product"
              >
                <Share2 size={18} />
              </button>

              {showShareMenu && (
                <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)] rounded-full px-3 py-1.5 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* WhatsApp */}
                  <button onClick={() => { handleShare('whatsapp'); setShowShareMenu(false); }} className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm" title="Share on WhatsApp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </button>
                  {/* Facebook */}
                  <button onClick={() => { handleShare('facebook'); setShowShareMenu(false); }} className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm" title="Share on Facebook">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </button>
                  {/* X / Twitter */}
                  <button onClick={() => { handleShare('twitter'); setShowShareMenu(false); }} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm" title="Share on X">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  {/* Email */}
                  <button onClick={() => { handleShare('email'); setShowShareMenu(false); }} className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm" title="Share via Email">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </button>
                  {/* Copy Link */}
                  <div className="w-[1px] h-6 bg-gray-200 mx-1 rounded-full"></div>
                  <button onClick={() => { handleShare('copy'); setShowShareMenu(false); }} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 hover:scale-110 transition-all shadow-sm border border-gray-200" title="Copy Link">
                    <Link2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Tabs Section */}
      <div className="mt-16 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Tabs Header */}
        <div className="flex items-center gap-8 border-b border-gray-100 px-8 pt-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === 'description' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === 'ingredients' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Ingredients & Info
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === 'review' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Review ({product.totalReviews || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 text-gray-500 leading-relaxed text-sm">
          {activeTab === 'description' && (
            <div className="max-w-4xl space-y-6">
              <div className="whitespace-pre-line text-gray-600 text-sm leading-relaxed">
                {product.description || product.shortDescription || 'No description available for this product.'}
              </div>
              
              {product.features && product.features.length > 0 && (
                <ul className="space-y-3 pt-2">
                  {product.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600 font-medium text-[13px]">
                      <CheckCircle2 size={16} className="text-[#154D21] shrink-0 fill-[#E8F5E9]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {activeTab === 'ingredients' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-wider mb-2">Ingredients</h3>
                <div className="whitespace-pre-line text-gray-600 text-sm leading-relaxed p-4 bg-[#F6F9F6] rounded-xl border border-gray-100">
                  {product.ingredients || 'Not specified.'}
                </div>
              </div>
              
              {product.labelImageUrl && (
                <div>
                  <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-wider mb-2">Food Label & Hygiene Certificate</h3>
                  <div className="rounded-xl overflow-hidden border border-gray-200 inline-block">
                    <img src={product.labelImageUrl} alt="Product Label" className="max-w-full h-auto max-h-[500px]" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'review' && (
            <div className="max-w-4xl italic text-center py-10">
              Customer reviews will be displayed here.
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 mb-16">
          <div className="text-center mb-10 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-[#154D21] tracking-widest uppercase mb-1">Related Products</span>
            <h2 className="text-2xl font-bold text-[#111827]">
              Explore <span className="text-[#154D21]">Related</span> Products
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {relatedProducts.map(related => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Features Bar */}
      <div className="mt-10 pt-10 pb-6 border-t border-gray-100/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#154D21]/20 text-[#154D21]">
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">100% Organic</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Certified organic produce</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#154D21]/20 text-[#154D21]">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Fast Delivery</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Quick and safe delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#154D21]/20 text-[#154D21]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Secure Payment</p>
              <p className="text-[10px] text-gray-500 mt-0.5">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#154D21]/20 text-[#154D21]">
              <RefreshCcw size={18} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Easy Returns</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Hassle free returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Modal */}
      {showClearCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold text-gray-900">Different Shop</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Your cart currently contains items from a different shop. We need to clear your current cart first.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearCartModal(false)}>Cancel</Button>
              <Button onClick={handleClearAndAdd} isLoading={isClearing || isAdding}>Clear & Add Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
