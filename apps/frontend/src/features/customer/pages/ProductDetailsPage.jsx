import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useProducts } from '../../products/hooks/useProductQueries.js';
import { useAddToCart, useClearCart } from '../../cart/hooks/useCartQueries.js';
import { DetailsSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ChevronLeft, ChevronRight, Star, Heart, Minus, Plus, AlertCircle } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Images */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square max-h-[380px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
            <img 
              src={mainImageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {/* Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1E3A2B] text-white rounded-lg shadow-md flex items-center justify-center hover:bg-[#162A1F] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {images.map((img, idx) => (
                <button 
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-[#1E3A2B]' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          {/* Category */}
          <p className="text-gray-400 text-sm font-medium mb-2">{product.category?.name || 'Category'}</p>
          
          {/* Title & Badge */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 shrink-0">
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </span>
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-1 mb-4">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={13} fill="currentColor" />
              ))}
            </div>
            <span className="text-gray-500 text-xs ml-1">4.8 (245 Review)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-[#B88645]">
              ₹{selectedVariant?.price?.toFixed(2) || '0.00'}
            </span>
            {selectedVariant?.compareAtPrice && (
              <span className="text-sm font-medium text-gray-400 line-through">
                ₹{selectedVariant.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            {product.shortDescription || 'Fresh and juicy product from a trusted local seller.'}
          </p>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Size/Volume</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant.id)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      (selectedVariantId === variant.id || (selectedVariantId === null && variants[0].id === variant.id))
                        ? 'bg-[#1E3A2B] text-white border-[#1E3A2B]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-6">
            {/* Qty Selector */}
            <div className="flex items-center border border-gray-200 rounded-full bg-white h-9 w-[104px] shrink-0">
              <button 
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity(q => q - 1)}
                className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <Minus size={13} />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-sm font-medium text-gray-900 border-x border-gray-100">
                {quantity}
              </div>
              <button 
                disabled={quantity >= stock || isOutOfStock}
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </div>
            
            <button 
              disabled={isOutOfStock || isAdding}
              onClick={executeAddToCart}
              className="h-9 px-5 text-sm bg-[#1E3A2B] text-white font-medium rounded-full hover:bg-[#162A1F] transition-colors disabled:opacity-50"
            >
              Add To Cart
            </button>
            
            <button 
              disabled={isOutOfStock || isAdding}
              className="h-9 px-5 text-sm bg-[#B88645] text-white font-medium rounded-full hover:bg-[#a0743a] transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
            
            <button className="h-9 w-9 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:text-red-500 hover:border-red-500 transition-colors shrink-0">
              <Heart size={16} />
            </button>
          </div>

          {/* Meta Details */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="font-bold text-gray-900 w-16">SKU :</span>
              <span className="text-gray-500">{selectedVariant?.sku || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-bold text-gray-900 w-16">Tags :</span>
              <span className="text-gray-500">Skincare, Serums, Vitamin C</span>
            </div>
            <div className="flex items-center text-sm gap-3 pt-1">
              <span className="font-bold text-gray-900 w-[52px]">Share :</span>
              <div className="flex items-center gap-2">
                {/* Facebook */}
                <button className="w-6 h-6 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </button>
                {/* X / Twitter */}
                <button className="w-6 h-6 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                {/* Pinterest */}
                <button className="w-6 h-6 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                </button>
                {/* Instagram */}
                <button className="w-6 h-6 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center hover:opacity-80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Tabs Section */}
      <div className="mt-16">
        {/* Tabs Header */}
        <div className="flex items-center justify-center gap-8 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 text-lg font-bold transition-colors ${
              activeTab === 'description' 
                ? 'text-[#1E3A2B] border-b-2 border-[#1E3A2B]' 
                : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`pb-4 text-lg font-bold transition-colors ${
              activeTab === 'additional' 
                ? 'text-[#1E3A2B] border-b-2 border-[#1E3A2B]' 
                : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
            }`}
          >
            Additional Information
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-4 text-lg font-bold transition-colors ${
              activeTab === 'review' 
                ? 'text-[#1E3A2B] border-b-2 border-[#1E3A2B]' 
                : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
            }`}
          >
            Review
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-8 text-gray-500 leading-relaxed">
          {activeTab === 'description' && (
            <div className="max-w-4xl">
              <p className="mb-6">
                {product.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'}
              </p>
              <p className="mb-8">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
              
              <ul className="space-y-4">
                {[
                  '100% Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                  'Ut at nunc vel nisi gravida dictum.',
                  'Donec non velit sed risus tincidunt suscipit.',
                  'Cras laoreet lacus in dui posuere fringilla.'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-[#B88645] w-1/2 left-0" />
                      <div className="absolute inset-0 bg-[#1E3A2B] w-1/2 right-0" />
                    </div>
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
        <div className="mt-24 mb-10">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
              <span className="text-sm font-semibold text-gray-500 tracking-wider">Related Products</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#1E3A2B]">
              Explore <span className="text-[#B88645]">Related Products</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {relatedProducts.map(related => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}

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
