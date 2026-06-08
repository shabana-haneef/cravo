import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useProducts } from '../../products/hooks/useProductQueries.js';
import { useAddToCart, useClearCart } from '../../cart/hooks/useCartQueries.js';
import { DetailsSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ChevronLeft, ChevronRight, Star, Heart, Minus, Plus, AlertCircle, Leaf, CheckCircle2, Truck, ShieldCheck, RefreshCcw, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useProduct(slug);
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

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
        toast.success(`Added ${quantity}x ${selectedVariant?.name} to cart`);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-6">
        <span className="hover:text-gray-600 cursor-pointer">Home</span>
        <span>&gt;</span>
        <span className="hover:text-gray-600 cursor-pointer">{product.category?.name || 'Category'}</span>
        <span>&gt;</span>
        <span className="text-gray-600">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F6F9F6] border border-gray-100 p-6 flex items-center justify-center">
            <img 
              src={mainImageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain mix-blend-multiply"
            />
            {/* Organic Badge */}
            <div className="absolute top-4 left-4 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-[#C8E6C9]/50">
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
                      activeImage === idx ? 'border-[#00B259]' : 'border-transparent hover:border-gray-200'
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
          <p className="text-[#00B259] text-[11px] font-semibold uppercase tracking-wider mb-2">
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
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={14} fill="currentColor" stroke="currentColor" />
              ))}
            </div>
            <span className="text-gray-500 text-xs font-medium ml-1">4.8 (125 Reviews)</span>
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
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {product.shortDescription || 'Fresh and juicy organic apples.'}
          </p>

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
                        ? 'bg-[#F0FDF4] text-[#00B259] border-[#00B259]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#00B259] hover:text-[#00B259]'
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
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#00B259] disabled:opacity-50"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-[#111827] border-x border-gray-100">
                {quantity}
              </div>
              <button 
                disabled={quantity >= stock || isOutOfStock}
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#00B259] disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <button 
              disabled={isOutOfStock || isAdding}
              onClick={executeAddToCart}
              className="h-10 px-6 text-[13px] bg-[#00B259] text-white font-semibold rounded-full hover:bg-[#009B4E] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_14px_rgba(0,178,89,0.3)]"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            
            <button 
              disabled={isOutOfStock || isAdding}
              className="h-10 px-6 text-[13px] bg-[#E67E22] text-white font-semibold rounded-full hover:bg-[#D35400] transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(230,126,34,0.3)]"
            >
              Buy Now
            </button>
            
            <button className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all shrink-0">
              <Heart size={18} />
            </button>
          </div>

          {/* Meta Details */}
          <div className="space-y-4">
            <div className="flex items-center text-xs">
              <span className="font-semibold text-[#111827] w-20 uppercase">SKU :</span>
              <span className="text-gray-500">{selectedVariant?.sku || 'TEST-APP-15-1KG'}</span>
            </div>
            <div className="flex items-center text-xs">
              <span className="font-semibold text-[#111827] w-20 uppercase">Tags :</span>
              <span className="text-gray-500">Skincare, Serums, Vitamin C</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-semibold text-[#111827] text-xs w-16 uppercase">Share :</span>
              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                <button className="w-7 h-7 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </button>
                {/* Facebook */}
                <button className="w-7 h-7 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </button>
                {/* X / Twitter */}
                <button className="w-7 h-7 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                {/* Email */}
                <button className="w-7 h-7 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </button>
              </div>
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
                ? 'text-[#00B259] border-b-[3px] border-[#00B259]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === 'additional' 
                ? 'text-[#00B259] border-b-[3px] border-[#00B259]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Additional Information
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === 'review' 
                ? 'text-[#00B259] border-b-[3px] border-[#00B259]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Review (125)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 text-gray-500 leading-relaxed text-sm">
          {activeTab === 'description' && (
            <div className="max-w-4xl space-y-6">
              <p>
                {product.description || 'Our organic apples are handpicked from certified organic farms. Naturally grown without harmful chemicals or pesticides, these apples are packed with essential nutrients and antioxidants.'}
              </p>
              <p>
                Crisp, juicy, and full of flavor — perfect for a healthy snack or your favorite recipes.
              </p>
              
              <ul className="space-y-3 pt-2">
                {[
                  '100% Organic and naturally grown',
                  'Rich in fiber and vitamin C',
                  'No harmful chemicals or pesticides',
                  'Freshly picked and carefully packed'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 font-medium text-[13px]">
                    <CheckCircle2 size={16} className="text-[#00B259] shrink-0 fill-[#E8F5E9]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {activeTab === 'additional' && (
            <div className="max-w-4xl italic text-center py-10">
              Additional information will be displayed here.
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
            <span className="text-[11px] font-semibold text-[#00B259] tracking-widest uppercase mb-1">Related Products</span>
            <h2 className="text-2xl font-bold text-[#111827]">
              Explore <span className="text-[#00B259]">Related</span> Products
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
