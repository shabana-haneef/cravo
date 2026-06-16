import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyOrders, useCancelOrder } from '../hooks/useOrderQueries.js';
import { useAddToCart } from '../../cart/hooks/useCartQueries.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.jsx';
import { toast } from 'sonner';
import { 
  Package, Search, ShoppingBag, ArrowLeft, ChevronDown, 
  CheckCircle, Clock, AlertTriangle, Truck, Receipt, XCircle
} from 'lucide-react';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyOrders();
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const orders = data?.data?.orders || [];

  if (isLoading) {
    return <LoadingScreen message="Loading your orders..." />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load orders</h2>
        <p className="text-gray-500 text-sm mb-6">Something went wrong while fetching your orders. Please try again.</p>
        <button 
          onClick={refetch}
          className="bg-[#154D21] hover:bg-[#103B19] text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter orders by active tab
  const getTabFilteredOrders = () => {
    return orders.filter(order => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Preparing') {
        return ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);
      }
      if (activeTab === 'Shipped') {
        // Shipped translates to READY_FOR_PICKUP or OUT_FOR_DELIVERY in progress
        return ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status);
      }
      if (activeTab === 'Out for Delivery') {
        return order.status === 'OUT_FOR_DELIVERY';
      }
      if (activeTab === 'Delivered') {
        return order.status === 'DELIVERED';
      }
      if (activeTab === 'Cancelled') {
        return ['CANCELLED', 'REFUNDED'].includes(order.status);
      }
      return true;
    });
  };

  const tabFilteredOrders = getTabFilteredOrders();

  // Search filter
  const filteredOrders = tabFilteredOrders.filter(order => {
    const query = filterQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesOrderNum = order.orderNumber.toLowerCase().includes(query);
    const matchesProduct = order.items.some(item => 
      item.product?.name?.toLowerCase().includes(query) ||
      item.productVariant?.name?.toLowerCase().includes(query)
    );
    const matchesShop = order.shop?.name?.toLowerCase().includes(query);

    return matchesOrderNum || matchesProduct || matchesShop;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilterQuery(searchQuery);
  };

  const handleBuyAgain = (productId, variantId, variantName, productName) => {
    if (!variantId) return;
    addToCart({ productId, variantId, quantity: 1 }, {
      onSuccess: () => {
        const variantSuffix = variantName && variantName.toLowerCase() !== 'default'
          ? ` (${variantName})`
          : '';
        const displayName = productName ? `"${productName}"${variantSuffix}` : (variantName || 'item');
        toast.success(`Added ${displayName} back to cart!`);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to add item to cart');
      }
    });
  };

  const handleCancelOrder = (orderId, orderNumber) => {
    if (window.confirm(`Are you sure you want to cancel order #${orderNumber}?`)) {
      cancelOrder(orderId, {
        onSuccess: () => {
          toast.success(`Order #${orderNumber} has been cancelled successfully.`);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to cancel order.');
        }
      });
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'PENDING_PAYMENT': return 'Pending payment';
      case 'PLACED': return 'Pending ETA allocation';
      case 'CONFIRMED': return 'Order confirmed';
      case 'PREPARING': return 'Preparing order';
      case 'READY_FOR_PICKUP': return 'Ready for pickup';
      case 'OUT_FOR_DELIVERY': return 'Out for delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'REFUNDED': return 'Refunded';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'DELIVERED': return 'text-emerald-700 font-semibold';
      case 'CANCELLED': 
      case 'REFUNDED': return 'text-rose-600 font-semibold';
      case 'PENDING_PAYMENT': return 'text-amber-600 font-semibold';
      default: return 'text-gray-900 font-semibold';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-2 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-4">
        <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <span className="text-gray-300">/</span>
        <Link to="/profile" className="hover:text-gray-600 transition-colors">Profile</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Orders</span>
      </nav>

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-[26px] font-bold text-gray-900 tracking-tight leading-none">Your Orders</h1>
        
        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-xs w-full md:w-[360px] h-[38px] px-3">
          <Search size={16} className="text-gray-400 shrink-0 mr-2" />
          <input 
            type="text" 
            placeholder="Search orders, products, or shops..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button 
            type="submit" 
            className="bg-[#111827] hover:bg-black text-white px-4 rounded-md text-xs font-semibold h-[30px] ml-1 transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto flex scrollbar-none">
        <div className="flex gap-6 sm:gap-8 min-w-max pb-3">
          {['All', 'Preparing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery('');
                setFilterQuery('');
              }}
              className={`text-[14px] font-medium transition-all cursor-pointer relative pb-1 ${
                activeTab === tab 
                  ? 'text-orange-600 font-semibold after:absolute after:bottom-[-13px] after:left-0 after:w-full after:h-[3px] after:bg-orange-500 after:rounded-t'
                  : 'text-[#007185] hover:text-[#c45500] hover:underline'
              }`}
            >
              {tab === 'All' ? 'All Orders' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs max-w-md mx-auto mt-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-5 border border-gray-100 shadow-inner">
            <ShoppingBag size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
            {filterQuery 
              ? "We couldn't find any orders matching your search." 
              : "Looks like you haven't placed any orders yet. Discover fresh organic items on our market!"
            }
          </p>
          <Link 
            to="/products"
            className="inline-flex items-center gap-2 bg-[#154D21] hover:bg-[#103B19] text-white font-bold text-sm px-6 py-3 rounded-full shadow-md shadow-[#154D21]/20 transition-all hover:scale-105 active:scale-95"
          >
            Browse Market
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const canCancel = ['PENDING_PAYMENT', 'PLACED'].includes(order.status);

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
                
                {/* Order Card Header */}
                <div className="bg-[#F0F2F2] border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-4">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    {/* Order Date */}
                    <div>
                      <p className="uppercase text-[10px] font-bold text-gray-500 tracking-wider">Order Placed</p>
                      <p className="font-semibold text-gray-800 text-[13px] mt-0.5">{formattedDate}</p>
                    </div>

                    {/* Total Amount */}
                    <div>
                      <p className="uppercase text-[10px] font-bold text-gray-500 tracking-wider">Total</p>
                      <p className="font-semibold text-gray-800 text-[13px] mt-0.5">₹{order.grandTotal.toFixed(2)}</p>
                    </div>

                    {/* Ship/Dispatch To */}
                    <div>
                      <p className="uppercase text-[10px] font-bold text-gray-500 tracking-wider">Ship To</p>
                      <p className="font-semibold text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-[13px] mt-0.5 relative group">
                        {order.address?.fullName || 'Customer'}
                        
                        {/* Address tooltip */}
                        {order.address && (
                          <span className="absolute left-0 top-6 hidden group-hover:block bg-white text-gray-800 border border-gray-200 rounded p-3 shadow-md z-30 min-w-[200px] leading-relaxed">
                            <span className="font-bold text-gray-900 block mb-1">{order.address.fullName}</span>
                            <span>{order.address.street}</span><br />
                            <span>{order.address.city}, {order.address.postalCode}</span><br />
                            <span>{order.address.country}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Order ID / Actions */}
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="uppercase text-[10px] font-bold text-gray-500 tracking-wider">Order # {order.orderNumber}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-[13px]">
                        View order details
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-[13px]">
                        Invoice
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Card Body */}
                <div className="p-4 sm:p-6 flex flex-col gap-6">
                  {/* Status Indicator */}
                  <div>
                    <h3 className={`text-[17px] font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {order.status === 'DELIVERED' ? 'Thank you for shopping with us!' : 'Order is confirmed and being processed.'}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-gray-100">
                    {order.items.map(item => {
                      const pImage = item.product?.images?.[0]?.imageUrl || 'https://via.placeholder.com/150';
                      const pSlug = item.product?.slug || item.productId;

                      return (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex gap-4 min-w-0">
                            {/* Product Image */}
                            <Link to={`/products/${pSlug}`} className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-xs hover:opacity-95 transition-opacity">
                              <img src={pImage} alt={item.product?.name || 'Product'} className="max-w-full max-h-full object-contain" />
                            </Link>
                            
                            {/* Details */}
                            <div className="min-w-0 flex flex-col">
                              <Link 
                                to={`/products/${pSlug}`} 
                                className="text-sm font-semibold text-[#007185] hover:text-[#c45500] hover:underline line-clamp-2 leading-snug"
                              >
                                {item.product?.name || 'Product Details'}
                              </Link>
                              
                              <p className="text-[12px] text-gray-500 mt-1">
                                Sold by: <span className="font-semibold text-gray-700">{order.shop?.name || 'Cravo Seller'}</span>
                              </p>
                              <p className="text-[12px] text-gray-600 mt-0.5">
                                Qty: <span className="font-bold text-gray-900">{item.quantity}</span>
                              </p>
                              {item.productVariant?.name && (
                                <p className="text-[12px] text-gray-600">
                                  Variant: <span className="font-bold text-gray-900">{item.productVariant.name}</span>
                                </p>
                              )}

                              {/* Buy Again button on mobile/desktop */}
                              <div className="mt-2.5">
                                <button
                                  onClick={() => handleBuyAgain(item.productId, item.productVariantId, item.productVariant?.name, item.product?.name)}
                                  disabled={isAdding}
                                  className="h-[28px] px-3.5 bg-[#F0F2F2] border border-[#D5D9D9] hover:bg-[#E3E6E6] text-gray-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  Buy it again
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Item Price */}
                          <div className="text-[15px] font-bold text-gray-900 self-end sm:self-center shrink-0">
                            ₹{(item.unitPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  {canCancel && (
                    <div className="flex justify-start border-t border-gray-100 pt-4 mt-2">
                      <button
                        onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                        disabled={isCancelling}
                        className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        Cancel order
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
