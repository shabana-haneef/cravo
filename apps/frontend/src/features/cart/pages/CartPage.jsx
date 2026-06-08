import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '../hooks/useCartQueries.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { ShoppingCart, Trash2, Plus, Minus, Store, ArrowRight } from 'lucide-react';

const CartSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
        ))}
      </div>
      <div className="w-full lg:w-96 h-64 bg-gray-100 rounded-2xl"></div>
    </div>
  </div>
);

const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-32 h-32 bg-primary-50 rounded-full flex items-center justify-center mb-6">
      <ShoppingCart className="w-16 h-16 text-primary-400" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is feeling light</h2>
    <p className="text-gray-500 max-w-md mb-8">
      Looks like you haven't added anything yet. Discover fresh homemade goods and local specialties.
    </p>
    <Button as={Link} to="/products" className="h-12 px-8 text-lg">
      Browse Market
    </Button>
  </div>
);

export const CartPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useCart();
  const { mutate: updateQuantity, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();

  if (isLoading) return <CartSkeleton />;
  if (isError) return <ErrorState title="Failed to load cart" onRetry={refetch} />;

  const cart = data?.data?.cart;
  const items = cart?.items || [];
  const summary = cart?.summary;

  if (items.length === 0) return <EmptyCart />;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
        {cart.shop && (
          <div className="flex items-center text-sm font-medium text-primary-700 bg-primary-50 px-4 py-2 rounded-lg">
            <Store size={16} className="mr-2" />
            Ordering from: {cart.shop.name}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative">
              
              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-center">
                <Link to={`/products/${item.productId}`} className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors mb-1 line-clamp-1">
                  {item.productName}
                </Link>
                <div className="text-sm text-gray-500 mb-2">Variant: {item.variantName}</div>
                <div className="text-lg font-semibold text-gray-900">₹{item.unitPrice.toFixed(2)}</div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden h-10 w-32 shrink-0">
                <button 
                  disabled={item.quantity <= 1 || isUpdating}
                  onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 h-full flex items-center justify-center font-medium text-gray-900 border-x border-gray-100 text-sm">
                  {item.quantity}
                </div>
                <button 
                  disabled={isUpdating}
                  onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Total Price */}
              <div className="hidden sm:block text-right min-w-[100px]">
                <div className="text-sm text-gray-500 mb-1">Total</div>
                <div className="text-lg font-bold text-gray-900">₹{item.totalPrice.toFixed(2)}</div>
              </div>

              {/* Remove Button */}
              <button 
                onClick={() => removeItem(item.id)}
                disabled={isRemoving}
                className="absolute top-4 right-4 sm:static text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button 
              onClick={() => clearCart()}
              disabled={isClearing}
              className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-1.5" /> Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({summary.totalItems} items)</span>
                <span className="font-medium text-gray-900">₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-sm italic">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                <span className="text-2xl font-extrabold text-primary-600">₹{summary.estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg" 
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
