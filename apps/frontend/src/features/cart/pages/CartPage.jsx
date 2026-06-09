import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '../hooks/useCartQueries.js';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import { 
  ShoppingCart, Trash2, Plus, Minus, Store, ArrowRight, ArrowLeft, 
  ShieldCheck, Truck, BadgeCheck, Receipt, Lock,
  Leaf, HeadphonesIcon, RefreshCcw
} from 'lucide-react';

const CartSkeleton = () => (
  <div className="max-w-7xl mx-auto pb-12 pt-10 px-4 sm:px-6 lg:px-8 animate-pulse space-y-8">
    <div className="h-16 bg-gray-200 rounded-2xl w-1/4 mb-6"></div>
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
        ))}
      </div>
      <div className="w-full lg:w-[400px] h-[400px] bg-gray-100 rounded-2xl"></div>
    </div>
  </div>
);

const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
    <div className="w-32 h-32 bg-[#f0fdf4] rounded-[32px] flex items-center justify-center mb-8 shadow-sm">
      <ShoppingCart className="w-16 h-16 text-[#16a34a]" />
    </div>
    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Your cart is feeling light</h2>
    <p className="text-gray-500 max-w-md mb-10 text-lg">
      Looks like you haven't added anything yet. Discover fresh homemade goods and local specialties.
    </p>
    <Link to="/products" className="inline-flex items-center justify-center h-14 px-8 text-lg bg-[#16a34a] text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm">
      Browse Market
    </Link>
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

  // Free delivery calculation
  const freeDeliveryThreshold = 499;
  const amountAway = Math.max(0, freeDeliveryThreshold - summary.subtotal);
  const progressPercent = Math.min(100, (summary.subtotal / freeDeliveryThreshold) * 100);

  return (
    <div className="max-w-7xl mx-auto pb-16 pt-1 px-4 sm:px-6 lg:px-8 font-inter bg-[#fafafa] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center shrink-0 border border-[#bbf7d0]/30 shadow-sm">
            <ShoppingCart className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#111827] tracking-tight leading-tight">Shopping Cart</h1>
            <p className="text-[#6b7280] text-[13px]">Review your items and proceed to checkout</p>
          </div>
        </div>
        
        {cart.shop && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0fdf4] text-[#16a34a] rounded-xl text-[14px] font-medium border border-[#bbf7d0]/50 shadow-sm">
            <Store size={18} />
            Ordering from: <span className="font-bold">{cart.shop.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        {/* Left Column: Cart Items */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
            
            {/* Table Header (Desktop) */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-100 text-[14px] font-medium text-[#6b7280]">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right pr-2">Total</div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.id} className="p-6 sm:px-8 sm:py-6 grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-4 items-center">
                  
                  {/* Product Info */}
                  <div className="col-span-1 sm:col-span-5 flex items-center gap-5">
                    <div className="w-[100px] h-[100px] bg-[#f8f9fa] rounded-[16px] overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-1">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain rounded-[12px]" />
                      ) : (
                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <Link to={`/products/${item.productId}`} className="text-[17px] font-bold text-gray-900 hover:text-[#16a34a] transition-colors line-clamp-2 leading-snug mb-1.5">
                        {item.productName}
                      </Link>
                      <span className="text-[14px] text-gray-500 mb-2.5">Variant: {item.variantName}</span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] text-[#16a34a] text-[12px] font-semibold rounded-md w-max border border-[#bbf7d0]/50">
                        <ShieldCheck size={14} /> In stock
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 sm:col-span-2 text-left sm:text-center text-[15px] font-bold text-gray-900">
                    <span className="sm:hidden text-gray-500 text-[14px] font-normal mr-2">Price:</span>
                    ₹{item.unitPrice.toFixed(2)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 sm:col-span-3 flex justify-start sm:justify-center">
                    <div className="flex items-center border border-gray-200 rounded-[12px] bg-white h-[44px] w-[110px] overflow-hidden shadow-sm">
                      <button 
                        disabled={item.quantity <= 1 || isUpdating}
                        onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                        className="w-10 h-full flex items-center justify-center text-[#16a34a] hover:bg-gray-50 disabled:text-gray-300 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="flex-1 h-full flex items-center justify-center font-bold text-gray-900 text-[15px]">
                        {item.quantity}
                      </div>
                      <button 
                        disabled={isUpdating}
                        onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                        className="w-10 h-full flex items-center justify-center text-[#16a34a] hover:bg-gray-50 disabled:text-gray-300 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Total & Remove */}
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-between sm:justify-end gap-4">
                    <div className="font-bold text-[17px] text-[#16a34a]">
                      <span className="sm:hidden text-gray-500 text-[14px] font-normal mr-2">Total:</span>
                      ₹{item.totalPrice.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={isRemoving}
                      className="text-gray-400 hover:text-red-500 rounded-[12px] hover:bg-red-50 transition-colors disabled:opacity-50 border border-gray-200 bg-white shadow-sm flex items-center justify-center w-[40px] h-[40px]"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Flexible Spacer to match right column height perfectly */}
            <div className="flex-1 w-full bg-transparent min-h-[20px]"></div>

            {/* Footer Actions */}
            <div className="p-6 sm:px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-b-2xl mt-auto">
              <Link to="/products" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#bbf7d0] text-[#16a34a] text-[14px] font-bold rounded-[12px] hover:bg-[#f0fdf4] transition-colors w-full sm:w-auto justify-center shadow-sm">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
              <button 
                onClick={() => clearCart()}
                disabled={isClearing}
                className="flex items-center gap-2 px-5 py-2.5 text-red-500 text-[14px] font-bold hover:bg-red-50 rounded-[12px] transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <Trash2 size={16} /> Clear Cart
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] border border-gray-100 h-full flex flex-col">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-[#f0fdf4] rounded-lg flex items-center justify-center shrink-0 border border-[#bbf7d0]/50 shadow-sm">
                <Receipt className="w-[18px] h-[18px] text-[#16a34a]" />
              </div>
              <h2 className="text-[17px] font-bold text-gray-900">Order Summary</h2>
            </div>
            
            <div className="space-y-4 mb-5 text-[14px]">
              <div className="flex justify-between items-center text-gray-600 border-b border-dashed border-gray-200 pb-4">
                <span>Subtotal ({summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''})</span>
                <span className="font-bold text-gray-900">₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 pb-1">
                <span>Delivery</span>
                <span className="text-[13px] font-medium text-gray-500">Calculated at checkout</span>
              </div>
            </div>

            <div className="bg-[#f0fdf4] rounded-[14px] p-4 mb-5 flex justify-between items-center border border-[#bbf7d0]/50">
              <span className="font-bold text-gray-900 text-[15px]">Estimated Total</span>
              <span className="text-[22px] font-extrabold text-[#16a34a]">₹{summary.estimatedTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full h-[48px] bg-[#16a34a] hover:bg-green-700 text-white font-bold rounded-[12px] flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-colors mb-3 text-[15px]"
            >
              <Lock size={16} className="mb-0.5" /> Proceed to Checkout <ArrowRight size={16} className="mb-0.5" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-5 mt-3 text-[#16a34a]">
              <ShieldCheck size={15} />
              <span className="text-[12px] font-medium text-gray-500">Safe & Secure Payments</span>
            </div>

            <div className="grid grid-cols-3 pt-4 border-t border-gray-100">
              <div className="flex flex-col items-center text-center gap-2 border-r border-gray-100 px-1">
                <div className="w-7 h-7 rounded-full bg-white border border-[#bbf7d0] shadow-sm flex items-center justify-center text-[#16a34a]">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 leading-[1.3]">Secure<br/>Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 border-r border-gray-100 px-1">
                <div className="w-7 h-7 rounded-full bg-white border border-[#bbf7d0] shadow-sm flex items-center justify-center text-[#16a34a]">
                  <Truck size={14} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 leading-[1.3]">Fast & Reliable<br/>Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 px-1">
                <div className="w-7 h-7 rounded-full bg-white border border-[#bbf7d0] shadow-sm flex items-center justify-center text-[#16a34a]">
                  <BadgeCheck size={14} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 leading-[1.3]">100% Money<br/>Back Guarantee</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Features Banner */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          <div className="flex items-center gap-4 lg:px-6">
            <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] shrink-0 border border-[#bbf7d0]/50 shadow-sm">
              <BadgeCheck size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">Quality Products</h4>
              <p className="text-[13px] text-gray-500 leading-[1.4]">Carefully selected<br/>for you</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:px-6 pt-6 md:pt-0">
            <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] shrink-0 border border-[#bbf7d0]/50 shadow-sm">
              <Leaf size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">Organic & Natural</h4>
              <p className="text-[13px] text-gray-500 leading-[1.4]">100% natural and<br/>safe to use</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:px-6 pt-6 md:pt-0">
            <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] shrink-0 border border-[#bbf7d0]/50 shadow-sm">
              <HeadphonesIcon size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">Dedicated Support</h4>
              <p className="text-[13px] text-gray-500 leading-[1.4]">We're here to help<br/>you anytime</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:px-6 pt-6 md:pt-0">
            <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] shrink-0 border border-[#bbf7d0]/50 shadow-sm">
              <RefreshCcw size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">Easy Returns</h4>
              <p className="text-[13px] text-gray-500 leading-[1.4]">Hassle-free returns<br/>within 7 days</p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
