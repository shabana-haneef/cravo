import React, { useState, useMemo } from 'react';
import { useSellerOrders, useUpdateOrderStatus } from '../hooks/useSellerOrderQueries.js';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { toast } from 'sonner';
import { 
  Package, Search, Loader2, AlertCircle, CheckCircle, Truck, Box, XCircle, Users, Receipt, Printer, X, FileText, MapPin
} from 'lucide-react';

export const SellerOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const { data: ordersData, isLoading, isError } = useSellerOrders(page, 20);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const orders = ordersData?.orders || [];
  const meta = ordersData?.meta;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'Pending' && !['PLACED', 'CONFIRMED'].includes(o.status)) return false;
      if (activeTab === 'Processing' && !['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)) return false;
      if (activeTab === 'Completed' && o.status !== 'DELIVERED') return false;
      if (activeTab === 'Cancelled' && o.status !== 'CANCELLED') return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const idMatch = o.id ? o.id.toLowerCase().includes(term) : false;
        const emailMatch = o.customer?.email ? o.customer.email.toLowerCase().includes(term) : false;
        const nameMatch = o.customer?.profile?.fullName ? o.customer.profile.fullName.toLowerCase().includes(term) : false;
        return idMatch || emailMatch || nameMatch;
      }
      
      return true;
    });
  }, [orders, activeTab, searchTerm]);

  const handleUpdateStatus = (orderId, newStatus) => {
    updateStatus(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
          // Optimistically update the details modal if it's open
          setDetailsOrder(prev => prev ? { ...prev, status: newStatus } : null);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update order status');
        }
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREPARING': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'READY_FOR_PICKUP': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A2B]" />
        <p className="text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-xl font-medium text-gray-900">Failed to Load Orders</h2>
        <p className="text-gray-500">There was a problem communicating with the server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-[#1E3A2B]" />
            Order Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Process and track your customer orders in real-time.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? 'bg-[#1E3A2B] text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Order ID, Name, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/20 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid - Simplified */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 bg-white border border-gray-200 rounded-xl shadow-sm text-center flex flex-col items-center">
          <Package size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setDetailsOrder(order)}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col hover:shadow-md hover:border-[#1E3A2B]/30 transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 group-hover:bg-white transition-colors">
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4">
                 <div>
                   <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-1">Customer</p>
                   <p className="font-medium text-gray-900 text-sm truncate">{order.customer?.profile?.fullName || 'Guest User'}</p>
                 </div>
                 
                 {order.items && order.items.length > 0 && (
                   <div>
                     <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">Order Items</p>
                     <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                       <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden shrink-0 p-0.5">
                          {order.items[0].product?.images?.[0]?.imageUrl ? (
                            <img src={order.items[0].product.images[0].imageUrl} alt="Product" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-400"/></div>
                          )}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="text-xs font-medium text-gray-900 truncate">{order.items[0].product?.name || 'Unknown Product'}</p>
                         <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                           Qty: {order.items[0].quantity}
                           {order.items.length > 1 && <span className="text-blue-600 font-medium ml-1">&bull; +{order.items.length - 1} more</span>}
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center group-hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-lg font-semibold text-[#1E3A2B]">₹{order.grandTotal?.toFixed(2)}</p>
                </div>
                <button className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-medium rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm">
                  <FileText size={14} /> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={meta.totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* ORDER DETAILS MODAL */}
      {detailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                  <Package size={24} className="text-[#1E3A2B]" /> Order Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">Order #{detailsOrder.id.slice(-8).toUpperCase()} &bull; {new Date(detailsOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setDetailsOrder(null)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
              {/* Status and Action Buttons */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-1">Current Status</p>
                     <span className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${getStatusColor(detailsOrder.status)}`}>
                       {detailsOrder.status.replace(/_/g, ' ')}
                     </span>
                   </div>
                   
                   <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {detailsOrder.status === 'PLACED' && (
                        <>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'CANCELLED')} disabled={isUpdating} className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            <XCircle size={16} /> Cancel
                          </button>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'CONFIRMED')} disabled={isUpdating} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <CheckCircle size={16} /> Confirm Order
                          </button>
                        </>
                      )}
                      
                      {detailsOrder.status === 'CONFIRMED' && (
                        <button onClick={() => handleUpdateStatus(detailsOrder.id, 'PREPARING')} disabled={isUpdating} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                          <Box size={16} /> Start Preparing
                        </button>
                      )}
                      
                      {detailsOrder.status === 'PREPARING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'READY_FOR_PICKUP')} disabled={isUpdating} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <Package size={16} /> Ready for Pickup
                          </button>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'OUT_FOR_DELIVERY')} disabled={isUpdating} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <Truck size={16} /> Ship Order
                          </button>
                        </>
                      )}

                      {(detailsOrder.status === 'READY_FOR_PICKUP' || detailsOrder.status === 'OUT_FOR_DELIVERY') && (
                        <button onClick={() => handleUpdateStatus(detailsOrder.id, 'DELIVERED')} disabled={isUpdating} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                          <CheckCircle size={16} /> Mark as Delivered
                        </button>
                      )}

                      {(detailsOrder.status === 'DELIVERED' || detailsOrder.status === 'CANCELLED') && (
                        <p className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2.5 rounded-xl border border-gray-200">
                           No further actions available.
                        </p>
                      )}
                   </div>
                 </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users size={14}/> Customer</h3>
                  <p className="font-medium text-gray-900 text-sm">{detailsOrder.customer?.profile?.fullName || 'Guest User'}</p>
                  <p className="text-sm text-gray-500 mt-1">{detailsOrder.customer?.email}</p>
                </div>
                {detailsOrder.address && (
                  <div className="flex-1 md:border-l md:border-gray-100 md:pl-6">
                    <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin size={14}/> Shipping Address</h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {detailsOrder.address.street}<br/>
                      {detailsOrder.address.city}, {detailsOrder.address.state || ''} {detailsOrder.address.postalCode}<br/>
                      {detailsOrder.address.country}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Package size={14}/> Ordered Items ({detailsOrder.items?.length || 0})</h3>
                <div className="space-y-4">
                  {detailsOrder.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50 p-1">
                        {item.product?.images?.[0]?.imageUrl ? (
                          <img src={item.product.images[0].imageUrl} alt="Product" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400"/></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Unknown Product'}</p>
                        {item.productVariant?.name && (
                           <p className="text-xs text-gray-500 mt-0.5 font-medium">Variant: {item.productVariant.name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 font-medium">Qty: {item.quantity} &times; ₹{item.unitPrice?.toFixed(2)}</p>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-sm font-semibold text-gray-900">₹{(item.unitPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 rounded-b-2xl">
               <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-2xl font-semibold text-[#1E3A2B]">₹{detailsOrder.grandTotal?.toFixed(2)}</p>
               </div>
               {detailsOrder.status !== 'PENDING_PAYMENT' && (
                 <button onClick={() => { setDetailsOrder(null); setInvoiceOrder(detailsOrder); }} className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm">
                   <Receipt size={16} /> View Invoice
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:block overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            {/* Modal Header (Not printed) */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 print:hidden shrink-0">
              <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                <Receipt size={24} className="text-[#1E3A2B]" /> Invoice #{invoiceOrder.orderNumber || invoiceOrder.id.slice(-8).toUpperCase()}
              </h2>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="px-4 py-2 bg-[#1E3A2B] hover:bg-[#1E3A2B]/90 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => setInvoiceOrder(null)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Area */}
            <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible text-gray-800">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-10 border-b border-gray-200 pb-8">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">INVOICE</h1>
                  <p className="text-gray-500 font-medium text-sm">Order #{invoiceOrder.orderNumber || invoiceOrder.id.slice(-8).toUpperCase()}</p>
                  <p className="text-gray-500 font-medium text-sm">Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-[#1E3A2B]">Cravo Marketplace</h2>
                  <p className="text-gray-500 text-sm mt-1">123 Green Avenue, Organics Valley</p>
                  <p className="text-gray-500 text-sm">support@cravo.com</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Billed To / Shipped To</p>
                  <p className="text-base font-medium text-gray-900 mb-1">{invoiceOrder.customer?.profile?.fullName || invoiceOrder.address?.fullName || 'Customer'}</p>
                  {invoiceOrder.address && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {invoiceOrder.address.street}<br/>
                      {invoiceOrder.address.city}, {invoiceOrder.address.state || ''} {invoiceOrder.address.postalCode}<br/>
                      {invoiceOrder.address.country}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">{invoiceOrder.customer?.email}</p>
                </div>
                <div className="flex-1 sm:text-right">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Payment Details</p>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-semibold text-gray-800">Status:</span> {invoiceOrder.paymentStatus || 'PAID'}</p>
                  <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Method:</span> Credit Card</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left mb-10">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="py-3 font-medium text-sm text-gray-900">Item Description</th>
                    <th className="py-3 font-medium text-sm text-gray-900 text-center">Qty</th>
                    <th className="py-3 font-medium text-sm text-gray-900 text-right">Price</th>
                    <th className="py-3 font-medium text-sm text-gray-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoiceOrder.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-4">
                        <p className="font-medium text-gray-900 text-sm">{item.product?.name || 'Product'}</p>
                        {item.productVariant?.name && (
                          <p className="text-xs text-gray-500 mt-0.5">Variant: {item.productVariant.name}</p>
                        )}
                      </td>
                      <td className="py-4 text-center font-medium text-sm">{item.quantity}</td>
                      <td className="py-4 text-right font-medium text-sm">₹{item.unitPrice?.toFixed(2)}</td>
                      <td className="py-4 text-right font-medium text-gray-900 text-sm">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{invoiceOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-gray-200 pb-3">
                    <span>Shipping</span>
                    <span>₹{invoiceOrder.deliveryCharge?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xl font-semibold text-gray-900 pt-1">
                    <span>Total</span>
                    <span>₹{invoiceOrder.grandTotal?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center border-t border-gray-200 pt-8 mt-auto">
                <p className="text-gray-900 font-medium text-sm mb-1">Thank you for your business!</p>
                <p className="text-gray-500 text-xs">If you have any questions about this invoice, please contact support@cravo.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
