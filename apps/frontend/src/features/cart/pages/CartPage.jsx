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
  const [unselectedItemIds, setUnselectedItemIds] = React.useState(new Set());

  const toggleSelection = (id) => {
    setUnselectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const { mutate: updateQuantity, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();

  if (isLoading) return <CartSkeleton />;
  if (isError) return <ErrorState title="Failed to load cart" onRetry={refetch} />;

  const cart = data?.data?.cart;
  const items = cart?.items || [];
  const summary = cart?.summary;

  if (items.length === 0) return <EmptyCart />;

  const activeItems = items.filter(item => !unselectedItemIds.has(item.id));
  const activeSubtotal = activeItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const activeTotalItems = activeItems.length;

  return (
    <div className="max-w-7xl mx-auto pb-16 pt-1 px-4 sm:px-6 lg:px-8 font-inter bg-[#fafafa] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-[22px] sm:text-[24px] font-bold text-[#111827] tracking-tight leading-tight">Shopping Cart</h1>
        
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
            
            {/* Cart Items List */}
            <div className="divide-y divide-gray-200 px-6 pt-4">
              {items.map(item => (
                <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-6">
                  {/* Selection Checkbox & Image */}
                  <div className="flex items-center gap-4 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={!unselectedItemIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[#007185] focus:ring-[#007185] cursor-pointer shrink-0 mt-2 self-start sm:self-center sm:mt-0" 
                    />
                    <div className="w-[180px] h-[180px] bg-white flex items-center justify-center p-2 rounded-xl overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Middle Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <Link to={`/products/${item.productSlug || item.productId}`} className="text-[18px] sm:text-[20px] font-medium text-gray-900 hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                        {item.productName}
                      </Link>
                      <div className="text-[18px] sm:text-[20px] font-bold text-[#154D21] shrink-0 text-right">
                        ₹{item.unitPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-1 text-[#007600] text-[13px]">In stock</div>
                    
                    <div className="mt-2 text-[13px] text-gray-900">
                      <span className="font-bold">Variant:</span> {item.variantName}
                    </div>

                    {/* Actions Row */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#007185]">
                      
                      {/* Quantity Dropdown / Selector */}
                      <div className="flex items-center border border-gray-300 rounded-lg bg-[#F0F2F2] shadow-sm overflow-hidden h-[32px] w-fit">
                        <button 
                          disabled={item.quantity <= 1 || isUpdating}
                          onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                          className="w-8 h-full flex items-center justify-center text-gray-800 hover:bg-gray-200 disabled:text-gray-400 transition-colors bg-gradient-to-b from-gray-100 to-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="w-10 h-full flex items-center justify-center bg-white border-x border-gray-300 font-medium text-gray-900">
                          {item.quantity}
                        </div>
                        <button 
                          disabled={isUpdating}
                          onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                          className="w-8 h-full flex items-center justify-center text-gray-800 hover:bg-gray-200 disabled:text-gray-400 transition-colors bg-gradient-to-b from-gray-100 to-gray-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>

                      <button 
                        onClick={() => removeItem(item.id)}
                        disabled={isRemoving}
                        className="hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>

                      <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                      <button className="hover:underline">Save for later</button>
                      <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                      <button className="hover:underline">Share</button>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal row at bottom of items list like Amazon */}
            <div className="px-6 py-5 flex justify-end text-[18px] border-t border-gray-200 bg-gray-50/50">
              <span className="text-gray-900">
                Subtotal ({activeTotalItems} item{activeTotalItems !== 1 ? 's' : ''}): <span className="font-bold text-[#154D21]">₹{activeSubtotal.toFixed(2)}</span>
              </span>
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
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col">
          <div className="bg-white p-8 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col h-fit">
            
            <h2 className="text-[18px] font-bold text-gray-900 mb-6 pb-5 border-b border-gray-100">Order Summary</h2>
            
            <div className="space-y-4 mb-8 text-[15px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Items</span>
                <span className="font-semibold text-gray-900">{activeTotalItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sub Total</span>
                <span className="font-semibold text-[#154D21]">₹{activeSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold text-[#154D21]">₹0.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Taxes</span>
                <span className="font-semibold text-[#154D21]">₹0.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-[16px] font-medium text-gray-500">Total</span>
              <span className="text-[20px] font-bold text-[#154D21]">₹{activeSubtotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout', { state: { unselectedItemIds: Array.from(unselectedItemIds) } })}
              className="w-full py-3.5 bg-[#16a34a] hover:bg-green-700 text-white font-bold rounded-full transition-colors text-[16px]"
            >
              Proceed to Checkout
            </button>

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
