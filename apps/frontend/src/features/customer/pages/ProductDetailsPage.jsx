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

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    navigate(`/checkout?buyNow=true&variantId=${selectedVariant?.id}&quantity=${quantity}`);
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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-8 font-medium">
        <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">Home</button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="hover:text-gray-900 transition-colors cursor-pointer">{product.category?.name || 'Dairy & Eggs'}</span>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-900 font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left: Images */}
        <div className="relative rounded-2xl bg-[#F9FAFB] border border-gray-100 p-6 flex flex-col h-full">
          {/* Organic Badge */}
          <div className="absolute top-5 left-5 bg-[#E8F5E9] text-[#154D21] px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 z-10">
            <Leaf size={14} className="stroke-[2]" />
            Organic
          </div>

          {/* Wishlist Button */}
          <div className="absolute top-5 right-5 z-10">
            <WishlistButton 
              productId={product.id}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-400 hover:text-red-500 transition-all border-none p-0"
            />
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center min-h-[360px] my-4">
            <img 
              src={mainImageUrl} 
              alt={product.name} 
              className="w-full h-[360px] object-contain mix-blend-multiply"
            />
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center justify-between w-full mt-2">
              <button 
                onClick={prevImage} 
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-500 hover:text-gray-800 transition-colors shrink-0"
              >
                <ChevronLeft size={18} className="stroke-[2.5] ml-[-2px]" />
              </button>
              
              <div className="flex gap-3 overflow-x-auto custom-scrollbar px-2 justify-center flex-1 mx-2">
                {images.map((img, idx) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden transition-all bg-white p-1.5 ${
                      activeImage === idx 
                        ? 'border-2 border-[#154D21]' 
                        : 'border border-transparent'
                    }`}
                  >
                    <img src={img.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>

              <button 
                onClick={nextImage} 
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-500 hover:text-gray-800 transition-colors shrink-0"
              >
                <ChevronRight size={18} className="stroke-[2.5] mr-[-2px]" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col py-4 px-2">
          {/* Category */}
          <p className="text-[#154D21] text-[10px] font-bold uppercase tracking-wider mb-3">
            {product.category?.name || 'DAIRY & EGGS'}
          </p>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-[#111827] leading-tight mb-3 tracking-tight">{product.name}</h1>

          {/* Ratings */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1 bg-[#ECFDF5] text-[#10B981] px-2 py-0.5 rounded-md text-[12px] font-bold">
              <span>{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}</span>
              <Star size={12} fill="currentColor" stroke="currentColor" />
            </div>
            <span className="text-gray-500 text-[13px] font-medium">
              ({product.totalReviews || 0} Reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-bold text-[#154D21] leading-none tracking-tight">
              ₹{selectedVariant?.price?.toFixed(2) || '200.00'}
            </span>
            {selectedVariant?.compareAtPrice && (
              <span className="text-sm font-medium text-gray-400 line-through ml-2">
                ₹{selectedVariant.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.shortDescription && (
            <p className="text-gray-500 text-[14px] mb-8 leading-relaxed max-w-md">
              {product.shortDescription}
            </p>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">WEIGHT</h3>
              <div className="flex flex-wrap gap-3">
                {variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant.id)}
                    className={`px-5 py-2 text-[13px] font-medium rounded-lg border transition-all ${
                      (selectedVariantId === variant.id || (selectedVariantId === null && variants[0].id === variant.id))
                        ? 'border-[#154D21] text-[#154D21]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {variant.name || variant.variantName || '200g'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              {/* Qty Selector */}
              <div className="flex items-center border border-gray-200 rounded-lg bg-white h-12 w-[120px] shrink-0">
                <button 
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity(q => q - 1)}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 h-full flex items-center justify-center text-[15px] font-bold text-[#111827]">
                  {quantity}
                </div>
                <button 
                  disabled={quantity >= stock || isOutOfStock}
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              {/* Add to Cart */}
              <button 
                disabled={isOutOfStock || isAdding}
                onClick={isItemInCart ? () => navigate('/cart') : executeAddToCart}
                className="flex-1 h-12 text-[14px] bg-[#154D21] text-white font-semibold rounded-lg hover:bg-[#103B19] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> {isItemInCart ? 'Go to Cart' : 'Add to Cart'}
              </button>
            </div>
            
            {/* Buy Now */}
            <button 
              disabled={isOutOfStock || isAdding || isClearing}
              onClick={handleBuyNow}
              className="w-full h-12 text-[14px] bg-[#CA8A04] text-white font-bold rounded-lg hover:bg-[#A16207] transition-all disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          {/* Hardcoded features below Buy Now */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 bg-[#F9FAFB] rounded-lg px-4 py-2.5 border border-gray-50">
              <Leaf size={16} className="text-[#154D21] stroke-[2.5]" />
              <span className="text-[12px] font-medium text-gray-600">100% Organic</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F9FAFB] rounded-lg px-4 py-2.5 border border-gray-50">
              <ShieldCheck size={16} className="text-[#154D21] stroke-[2.5]" />
              <span className="text-[12px] font-medium text-gray-600">No Preservatives</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F9FAFB] rounded-lg px-4 py-2.5 border border-gray-50">
              <CheckCircle2 size={16} className="text-[#154D21] stroke-[2.5]" />
              <span className="text-[12px] font-medium text-gray-600">Rich in Calcium</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Tabs Section */}
      <div className="mt-16 bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex items-center gap-8 border-b border-gray-100 px-8 pt-5">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 text-[14px] font-semibold transition-colors ${
              activeTab === 'description' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-4 text-[14px] font-semibold transition-colors ${
              activeTab === 'ingredients' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Ingredients & Info
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-4 text-[14px] font-semibold transition-colors ${
              activeTab === 'review' 
                ? 'text-[#154D21] border-b-[3px] border-[#154D21]' 
                : 'text-gray-500 hover:text-gray-800 border-b-[3px] border-transparent'
            }`}
          >
            Reviews ({product.totalReviews || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 text-gray-500 leading-relaxed text-sm">
          {activeTab === 'description' && (
            <div className="max-w-4xl space-y-6">
              <div className="whitespace-pre-line text-gray-500 text-[14px] leading-relaxed">
                {product.description || product.shortDescription || 'Our Cheddar Cheese is crafted from the finest organic milk, delivering a rich, creamy, and perfectly balanced flavor. Ideal for sandwiches, cooking, or snacking.'}
              </div>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#ECFDF5] p-1.5 rounded-md"><Leaf size={16} className="text-[#10B981] stroke-[2]" /></div>
                  <span className="text-[13px] font-medium text-gray-500">Source of Protein</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[#ECFDF5] p-1.5 rounded-md"><ShieldCheck size={16} className="text-[#10B981] stroke-[2]" /></div>
                  <span className="text-[13px] font-medium text-gray-500">Rich in Calcium</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[#ECFDF5] p-1.5 rounded-md"><AlertCircle size={16} className="text-[#10B981] stroke-[2]" /></div>
                  <span className="text-[13px] font-medium text-gray-500">No Artificial Flavors</span>
                </div>
              </div>
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
        <div className="mt-16 mb-16">
          <div className="text-center mb-10 flex flex-col items-center">
            <span className="text-[10px] font-bold text-[#154D21] tracking-widest uppercase mb-2">RELATED PRODUCTS</span>
            <h2 className="text-2xl font-bold text-[#111827]">
              You May Also Like
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
      <div className="mt-10 bg-[#F9FAFB] rounded-2xl py-8 px-8 border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0 text-[#10B981]">
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827]">100% Organic</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Certified organic produce</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0 text-[#10B981]">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827]">Fast Delivery</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Quick and safe delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0 text-[#10B981]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827]">Secure Payment</p>
              <p className="text-[11px] text-gray-500 mt-0.5">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0 text-[#10B981]">
              <RefreshCcw size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827]">Easy Returns</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Hassle-free returns</p>
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
