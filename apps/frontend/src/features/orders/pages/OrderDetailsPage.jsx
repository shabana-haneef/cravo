import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderById, useCancelOrder } from '../hooks/useOrderQueries.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.jsx';
import { useProducts } from '../../products/hooks/useProductQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { ArrowLeft, Share2, Copy, CheckCircle2, Circle, HelpCircle, Home, User, ThumbsUp, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal.jsx';

export const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useOrderById(id);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const [isDeliveryPriceModalOpen, setIsDeliveryPriceModalOpen] = useState(false);
  const [isOtherItemsModalOpen, setIsOtherItemsModalOpen] = useState(false);
  const [isRelatedProductsModalOpen, setIsRelatedProductsModalOpen] = useState(false);

  const handleReviewSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    toast.success('Thank you for your feedback!');
    setIsReviewModalOpen(false);
    setRating(0);
    setReviewComment('');
  };

  const { data: productsData } = useProducts({ limit: 4 });
  const relatedProducts = productsData?.data?.products || [];

  if (isLoading) return <LoadingScreen message="Loading order details..." />;
  if (isError || !data?.data?.order) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold">Order not found</h2>
      <button onClick={() => navigate('/orders')} className="text-blue-600 mt-4 underline">Go back to orders</button>
    </div>
  );

  const order = data?.data?.order;

  useEffect(() => {
    if (order && (order.status === 'CANCELLED' || order.status === 'REFUNDED')) {
      toast.error('This order has been cancelled.');
      navigate('/orders', { replace: true });
    }
  }, [order, navigate]);

  // Use first item for top summary (like Flipkart)
  const mainItem = order.items[0];
  const mainProduct = mainItem?.product;
  const pImage = mainProduct?.images?.[0]?.imageUrl || 'https://via.placeholder.com/150';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(order.orderNumber);
    toast.success('Order ID copied');
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'PENDING_PAYMENT': return 'Pending';
      case 'PLACED': return 'Confirmed';
      case 'CONFIRMED': return 'Confirmed';
      case 'PREPARING': return 'Processing';
      case 'READY_FOR_PICKUP': return 'Shipped';
      case 'OUT_FOR_DELIVERY': return 'Out for delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusStage = (status) => {
    if (['DELIVERED'].includes(status)) return 3;
    if (['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(status)) return 2;
    if (['PLACED', 'CONFIRMED', 'PREPARING'].includes(status)) return 1;
    return 0; // Cancelled or Pending
  };

  const currentStage = getStatusStage(order.status);
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const displayStatus = getStatusText(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen pb-16">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/help')}
            className="text-sm font-semibold border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
          >
            Help
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard');
            }}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 mb-2">
        {/* Product Brief */}
        <div className="flex gap-4 mb-5 border-b border-gray-100 pb-4">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded p-1 shrink-0 flex items-center justify-center">
            <img src={pImage} alt={mainProduct?.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{mainProduct?.name || 'Product'}</h2>
            <p className="text-xs text-gray-500 mt-1">{mainItem?.productVariant?.name || 'Standard'}</p>
          </div>
        </div>

        {/* Order ID */}
        <div className="flex items-center text-gray-500 text-xs mb-3">
          <span>Order #OD{order.orderNumber}</span>
          <button onClick={copyToClipboard} className="ml-1 text-blue-600 p-1 hover:bg-blue-50 rounded">
            <Copy size={12} />
          </button>
        </div>

        {/* Tracking Card */}
        <div className="border border-[#1a73e8] rounded-xl overflow-hidden bg-white mb-2 shadow-sm">
          <div className="p-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-gray-900">{displayStatus}</h3>
              {currentStage >= 1 && !isCancelled && (
                <span className="bg-[#154D21] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  On Time
                </span>
              )}
              {isCancelled && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Cancelled</span>
              )}
            </div>
            
            <p className="text-xs text-gray-700 mb-5">
              {order.shipmentLogs?.[0] ? 
                `Latest: ${order.shipmentLogs[0].event}` : 
                (isCancelled ? 'This order was cancelled.' : 'Your order is being processed.')
              }
            </p>

            {/* Visual Timeline */}
            {!isCancelled && (
              <div className="relative mb-5 px-1">
                <div className="flex justify-between items-center relative z-10">
                  {/* Step 1: Confirmed */}
                  <div className="flex flex-col items-center">
                    {currentStage >= 1 ? (
                      <div className="bg-white rounded-full"><CheckCircle2 size={20} className="text-[#154D21] fill-[#154D21] text-white" /></div>
                    ) : (
                      <Circle size={20} className="text-gray-300 fill-white" />
                    )}
                  </div>
                  {/* Step 2: Shipped */}
                  <div className="flex flex-col items-center">
                    {currentStage >= 2 ? (
                      <div className="bg-white rounded-full"><CheckCircle2 size={20} className="text-[#154D21] fill-[#154D21] text-white" /></div>
                    ) : (
                      <Circle size={20} className="text-gray-300 fill-white" />
                    )}
                  </div>
                  {/* Step 3: Delivered */}
                  <div className="flex flex-col items-center">
                    {currentStage >= 3 ? (
                      <div className="bg-white rounded-full"><CheckCircle2 size={20} className="text-[#154D21] fill-[#154D21] text-white" /></div>
                    ) : (
                      <Circle size={20} className="text-gray-300 fill-white" />
                    )}
                  </div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-2.5 left-[10%] right-[10%] h-[3px] bg-gray-200 -z-0">
                  <div 
                    className="h-full bg-[#154D21] transition-all duration-500" 
                    style={{ width: currentStage === 3 ? '100%' : currentStage === 2 ? '50%' : '0%' }}
                  />
                </div>

                {/* Labels */}
                <div className="flex justify-between items-start mt-2 text-[10px] text-gray-500 font-medium">
                  <div className="text-center w-16 -ml-5">
                    <p>Order Confirmed</p>
                    <p className="mt-0.5">{formattedDate}</p>
                  </div>
                  <div className="text-center w-16">
                    <p>Shipped</p>
                    {currentStage >= 2 && <p className="mt-0.5">{order.shipmentLogs?.[0] ? new Date(order.shipmentLogs[0].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>}
                  </div>
                  <div className="text-center w-20 -mr-6">
                    <p>Delivery</p>
                    {currentStage >= 3 && <p className="mt-0.5">Delivered</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-[#F8F9FA] rounded-lg p-3 flex items-start gap-2 border border-gray-100">
              <HelpCircle size={14} className="text-gray-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700 leading-tight">
                Delivery Executive details will be available once the order is out for delivery
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Rate Experience */}
      <div className="px-4 py-3 bg-white mb-2">
        <h3 className="font-bold text-[15px] text-gray-900 mb-3">Rate your experience</h3>
        <div 
          className="border border-gray-100 bg-[#F8F9FA] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsReviewModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <ThumbsUp size={18} className="text-gray-500" />
            <span className="text-[13px] font-medium text-gray-800">Did you find this page helpful?</span>
          </div>
          <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm font-medium">Rate</button>
        </div>
      </div>



      {/* Multiple Items Listing if applicable */}
      {order.items.length > 1 && (
        <div 
          className="px-4 py-3 bg-white mb-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsOtherItemsModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-[15px] text-gray-900">Other items in this order ({order.items.length - 1})</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      )}

      {/* Delivery & Price details summary */}
      <div 
        className="px-4 py-3 bg-white mb-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsDeliveryPriceModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-[15px] text-gray-900">Delivery & Price Details</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div 
          className="px-4 py-3 bg-white mb-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsRelatedProductsModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-[15px] text-gray-900">You May Also Like</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      )}
      
      {/* Actions (Cancel Order) */}
      {['PENDING_PAYMENT', 'PLACED'].includes(order.status) && (
        <div className="px-4 pb-8">
           <button 
             onClick={() => {
               toast('Are you sure you want to cancel this order?', {
                 duration: 8000,
                 action: {
                   label: 'Yes, Cancel Order',
                   onClick: () => cancelOrder(order.id, {
                     onSuccess: () => toast.success('Order cancelled successfully'),
                     onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel order'),
                   }),
                 },
                 cancel: {
                   label: 'Keep Order',
                   onClick: () => {},
                 },
               });
             }}
             disabled={isCancelling}
             className="w-full bg-white border border-gray-300 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
           >
             Cancel Order
           </button>
        </div>
      )}

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Write a Review">
        <div className="flex flex-col items-center mb-6">
          <p className="text-sm text-gray-600 mb-4 text-center">How would you rate your experience with this order?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110 p-1"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  size={32}
                  className={`${
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            rows="4"
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent outline-none resize-none"
            placeholder="Tell us what you liked or what we can improve..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          ></textarea>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsReviewModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReviewSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1a73e8] rounded-xl hover:bg-blue-700 transition-colors"
          >
            Submit Feedback
          </button>
        </div>
      </Modal>

      {/* Other Items Modal */}
      <Modal isOpen={isOtherItemsModalOpen} onClose={() => setIsOtherItemsModalOpen(false)} title="Other items in this order">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4">
          {order.items.slice(1).map(item => (
            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="w-16 h-16 bg-[#F6F9F6] rounded p-1 shrink-0 border border-gray-100">
                <img src={item.product?.images?.[0]?.imageUrl || 'https://via.placeholder.com/150'} alt={item.product?.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.product?.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} | {item.productVariant?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Delivery & Price Details Modal */}
      <Modal isOpen={isDeliveryPriceModalOpen} onClose={() => setIsDeliveryPriceModalOpen(false)} title="Delivery & Price Details">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pb-4">
          <div>
            <h3 className="font-bold text-[15px] text-gray-900 mb-3">Delivery details</h3>
            <div className="space-y-3">
              <div className="bg-[#F8F9FA] p-3 rounded-xl flex items-start gap-3 border border-gray-100">
                <Home size={18} className="text-gray-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-sm text-gray-900 mr-2">Home</span>
                  <span className="text-[13px] text-gray-600 leading-snug">
                    {order.address?.street}, {order.address?.city}, {order.address?.postalCode}
                  </span>
                </div>
              </div>
              <div className="bg-[#F8F9FA] p-3 rounded-xl flex items-center gap-3 border border-gray-100">
                <User size={18} className="text-gray-600 shrink-0" />
                <div className="flex-1 flex gap-2">
                  <span className="font-bold text-sm text-gray-900">{order.address?.fullName}</span>
                  <span className="text-[13px] text-gray-600">{order.address?.phone || ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">Price details</h3>
            <div className="space-y-3 text-[13px] text-gray-700">
              <div className="flex justify-between">
                <span>Listing price</span>
                <span className="line-through text-gray-400">₹{((order?.grandTotal || 0) + 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Special price</span>
                <span className="text-[#154D21] font-medium">₹{(order?.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping / Delivery</span>
                <span className="text-[#154D21] font-medium">₹{(order?.shippingFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-[15px] text-gray-900">
                <span>Total Amount</span>
                <span className="text-[#154D21] font-extrabold">₹{(order?.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Related Products Modal */}
      <Modal isOpen={isRelatedProductsModalOpen} onClose={() => setIsRelatedProductsModalOpen(false)} title="You May Also Like">
        <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pb-4">
          {relatedProducts.map(product => (
            <div key={product.id}>
              <ProductCard product={product} variant="simple" />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
