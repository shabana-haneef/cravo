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

  const tabFilteredOrders = orders;

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
    toast(`Cancel order #${orderNumber}?`, {
      duration: 8000,
      action: {
        label: 'Yes, Cancel',
        onClick: () => cancelOrder(orderId, {
          onSuccess: () => toast.success(`Order #${orderNumber} has been cancelled successfully.`),
          onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel order.'),
        }),
      },
      cancel: {
        label: 'Keep Order',
        onClick: () => {},
      },
    });
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
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            // Get first item to show in preview
            const mainItem = order.items[0];
            const pImage = mainItem?.product?.images?.[0]?.imageUrl || 'https://via.placeholder.com/150';
            const extraItemsCount = order.items.length - 1;

            const isOrderCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

            return (
              <div 
                key={order.id} 
                onClick={() => {
                  if (isOrderCancelled) {
                    toast.error('This order has been cancelled.');
                    return;
                  }
                  navigate(`/orders/${order.id}`);
                }}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col ${
                  isOrderCancelled 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer hover:shadow-md transition-shadow'
                }`}
              >
                
                {/* Order Card Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex justify-between items-center text-xs">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-gray-500 font-medium">Order Placed</p>
                      <p className="font-semibold text-gray-800">{formattedDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Total</p>
                      <p className="font-semibold text-[#154D21]">₹{order.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 font-medium">Order # {order.orderNumber}</p>
                    <p className={`font-bold mt-0.5 ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </p>
                  </div>
                </div>

                {/* Order Card Body */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F6F9F6] border border-gray-100 rounded-lg p-1 shrink-0">
                      <img src={pImage} alt="Product" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{mainItem?.product?.name || 'Product'}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {mainItem?.productVariant?.name || 'Standard'} {extraItemsCount > 0 ? `+ ${extraItemsCount} more items` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={20} className="text-gray-400 -rotate-90 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
