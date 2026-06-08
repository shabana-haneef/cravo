import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../../products/hooks/useProductQueries.js';
import { useAddToCart, useClearCart } from '../../cart/hooks/useCartQueries.js';
import { DetailsSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Store, ShieldCheck, ArrowLeft, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
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

  if (isLoading) return <DetailsSkeleton />;
  if (isError) return <ErrorState title="Product not found" onRetry={refetch} />;

  const product = data?.data?.product;
  if (!product) return <ErrorState title="Product not found" />;

  const images = product.images || [];
  const mainImageUrl = images[activeImage]?.url || 'https://via.placeholder.com/600x600?text=No+Image';
  
  const variants = product.variants || [];
  const selectedVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
  
  const stock = selectedVariant?.inventory?.availableStock || 0;
  const isOutOfStock = stock <= 0;

  const handleVariantSelect = (id) => {
    setSelectedVariantId(id);
    setQuantity(1); // Reset qty on variant change
  };

  const executeAddToCart = () => {
    addToCart({ 
      productId: product.id, 
      variantId: selectedVariant.id, 
      quantity 
    }, {
      onSuccess: () => {
        toast.success(`Added ${quantity}x ${selectedVariant.name} to cart`);
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

  const handleAddToCart = () => {
    executeAddToCart();
  };

  const handleClearAndAdd = () => {
    clearCart(undefined, {
      onSuccess: () => {
        executeAddToCart();
      },
      onError: () => {
        toast.error('Failed to clear cart');
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-green-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Image Gallery */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex flex-col">
            <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-4">
              <img 
                src={mainImageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-green-600 ring-2 ring-green-100' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="mb-2">
              <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
                {product.category?.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center text-sm text-gray-600 border-b border-gray-100 pb-4 mb-6">
                <Store size={16} className="mr-1.5 text-gray-400" />
                <span>Sold by <Link to={`/shops/${product.shop?.slug}`} className="font-semibold text-green-600 hover:underline">{product.shop?.name}</Link></span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">₹{selectedVariant?.price?.toFixed(2)}</span>
                {selectedVariant?.compareAtPrice && (
                  <span className="text-lg text-gray-400 line-through">₹{selectedVariant.compareAtPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Available Options</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        (selectedVariantId === variant.id || (selectedVariantId === null && variants[0].id === variant.id))
                          ? 'border-green-600 bg-green-50 text-green-700 ring-1 ring-green-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-12 w-32 shrink-0">
                  <button 
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(q => q - 1)}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 h-full flex items-center justify-center font-semibold text-gray-900 border-x border-gray-200">
                    {quantity}
                  </div>
                  <button 
                    disabled={quantity >= stock || isOutOfStock}
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <Button 
                  className="flex-1 h-12 text-lg" 
                  disabled={isOutOfStock || isAdding}
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={20} className="mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOutOfStock ? 'bg-red-500' : stock < 10 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  {isOutOfStock ? 'Currently unavailable' : stock < 10 ? `Only ${stock} left in stock` : 'In Stock'}
                </div>
                <div className="flex items-center text-green-700 font-medium">
                  <ShieldCheck size={16} className="mr-1" />
                  Authentic Product
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Description section */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
        <div className="prose prose-green max-w-none text-gray-600">
          {product.description ? (
            <p className="whitespace-pre-wrap">{product.description}</p>
          ) : (
            <p className="italic">No description provided for this product.</p>
          )}
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
              Your cart currently contains items from a different shop. To add items from <span className="font-semibold text-gray-900">{product.shop?.name}</span>, we need to clear your current cart first.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearCartModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleClearAndAdd} isLoading={isClearing || isAdding}>
                Clear & Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
