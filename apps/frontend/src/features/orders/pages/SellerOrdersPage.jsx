import React, { useState, useMemo } from 'react';
import { useSellerOrders, useUpdateOrderStatus, useCreateShipment } from '../hooks/useSellerOrderQueries.js';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { toast } from 'sonner';
import { 
  Package, Search, Loader2, AlertCircle, CheckCircle, Truck, Box, XCircle, Users, Receipt, Printer, X, MapPin,
  Calendar, Download, ChevronDown, ChevronsUpDown, MoreVertical, ChevronLeft, ChevronRight, Clock, RefreshCw, CheckCircle2
} from 'lucide-react';

// Dummy orders removed to allow purely real backend orders

const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${timeStr}`;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'PLACED':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-orange-500 bg-orange-50 w-max"><Clock size={12} /> Pending Payment</span>;
    case 'CONFIRMED':
    case 'PREPARING':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-blue-500 bg-blue-50 w-max"><RefreshCw size={12} /> Processing</span>;
    case 'READY_FOR_PICKUP':
    case 'OUT_FOR_DELIVERY':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-purple-600 bg-purple-50 w-max"><Truck size={12} /> Shipped</span>;
    case 'DELIVERED':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-green-600 bg-green-50 w-max"><CheckCircle2 size={12} /> Delivered</span>;
    case 'CANCELLED':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-red-500 bg-red-50 w-max"><XCircle size={12} /> Cancelled</span>;
    default:
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-500 bg-gray-50 w-max">{status}</span>;
  }
};

const getPaymentBadge = (status) => {
  const paymentStatus = status === 'CANCELLED' ? 'refunded' : (status === 'PLACED' ? 'unpaid' : 'paid');
  switch (paymentStatus) {
    case 'paid':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-green-600 bg-green-50 w-max"><CheckCircle2 size={12}/> Paid</span>;
    case 'unpaid':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-red-500 bg-red-50 w-max">Unpaid</span>;
    case 'refunded':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-600 bg-gray-100 w-max">Refunded</span>;
    default:
      return null;
  }
};

export const SellerOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  
  // State for modals
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const { data: ordersData, isLoading, isError } = useSellerOrders(page, 10);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutate: createShipment, isPending: isCreatingShipment } = useCreateShipment();

  const combinedOrders = useMemo(() => {
    return ordersData?.orders || [];
  }, [ordersData]);

  const counts = useMemo(() => {
    const c = { 'All': 0, 'Pending Payment': 0, 'Processing': 0, 'Shipped': 0, 'Delivered': 0, 'Cancelled': 0 };
    combinedOrders.forEach(o => {
      c['All']++;
      if (o.status === 'PLACED') c['Pending Payment']++;
      else if (o.status === 'CONFIRMED' || o.status === 'PREPARING') c['Processing']++;
      else if (o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY') c['Shipped']++;
      else if (o.status === 'DELIVERED') c['Delivered']++;
      else if (o.status === 'CANCELLED') c['Cancelled']++;
    });
    return c;
  }, [combinedOrders]);

  const tabs = [
    { label: 'All', count: counts['All'], color: 'text-gray-900' },
    { label: 'Pending Payment', count: counts['Pending Payment'], color: 'text-orange-500' },
    { label: 'Processing', count: counts['Processing'], color: 'text-blue-600' },
    { label: 'Shipped', count: counts['Shipped'], color: 'text-purple-600' },
    { label: 'Delivered', count: counts['Delivered'], color: 'text-green-600' },
    { label: 'Cancelled', count: counts['Cancelled'], color: 'text-red-500' },
  ];

  const filteredOrders = useMemo(() => {
    return combinedOrders.filter(o => {
      if (activeTab === 'Pending Payment' && o.status !== 'PLACED') return false;
      if (activeTab === 'Processing' && !['CONFIRMED', 'PREPARING'].includes(o.status)) return false;
      if (activeTab === 'Shipped' && !['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)) return false;
      if (activeTab === 'Delivered' && o.status !== 'DELIVERED') return false;
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
  }, [combinedOrders, activeTab, searchTerm]);

  const visibleOrders = showAllRows ? filteredOrders : filteredOrders.slice(0, 4);

  const handleUpdateStatus = (orderId, newStatus) => {
    updateStatus(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
          setDetailsOrder(prev => prev ? { ...prev, status: newStatus } : null);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update order status');
        }
      }
    );
  };

  const handleCreateShipment = (orderId) => {
    createShipment(orderId, {
      onSuccess: (res) => {
        toast.success(res?.message || 'Shipment created successfully!');
        setDetailsOrder(prev => prev ? { ...prev, shipmentCreated: true, awbNumber: res?.awbNumber || 'Generated' } : null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to create shipment.');
      }
    });
  };

  const handleExport = () => {
    try {
      if (filteredOrders.length === 0) return toast.error("No orders to export");
      
      const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Items Count', 'Total Amount', 'Status'];
      const csvRows = filteredOrders.map(o => {
        const orderId = String(o.id || o._id || o.orderId || 'UNKNOWN');
        return [
          `#${orderId.slice(-8).toUpperCase()}`,
          new Date(o.createdAt || Date.now()).toLocaleString(),
          `"${o.customer?.profile?.fullName || o.customer?.fullName || 'Guest User'}"`,
          o.customer?.email || '',
          o.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0,
          o.grandTotal || o.totalAmount || 0,
          o.status || 'UNKNOWN'
        ].join(',');
      });
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Orders exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export. Check console for details.");
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#16A34A]" />
        <p className="text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#FCFDFD] text-sm max-w-[1400px] mx-auto p-2 sm:p-6 pb-20">
      
      <h1 className="text-[26px] font-bold text-[#0F172A] mb-5 tracking-tight">Orders</h1>
      
      <div className="flex items-center overflow-x-auto border-b border-gray-200 pb-3 mb-6 scrollbar-none">
        {tabs.map((tab, idx) => (
          <React.Fragment key={tab.label}>
            <div 
              onClick={() => setActiveTab(tab.label)}
              className={`relative flex items-center gap-2 cursor-pointer px-4 py-1 first:pl-0 whitespace-nowrap transition-all hover:opacity-80`}
            >
              <span className={`text-[13px] font-semibold ${activeTab === tab.label ? 'text-[#16A34A]' : 'text-gray-600'}`}>
                {tab.label}
              </span>
              <span className={`text-[13px] font-bold ${tab.color}`}>
                {tab.count}
              </span>
              {activeTab === tab.label && (
                <div className="absolute -bottom-[13px] left-4 right-4 h-[2px] bg-[#16A34A] rounded-t-full"></div>
              )}
            </div>
            {idx < tabs.length - 1 && <div className="h-4 w-px bg-gray-200 shrink-0"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Order ID, Customer, Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-800 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all bg-white"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select className="appearance-none border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-[13px] font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#16A34A] cursor-pointer hover:bg-gray-50 transition-colors">
              <option>All Status</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-gray-500 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select className="appearance-none border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-[13px] font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#16A34A] cursor-pointer hover:bg-gray-50 transition-colors">
              <option>All Payment Status</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-gray-500 pointer-events-none" />
          </div>
          
          <button className="border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-700 bg-white flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <Calendar size={16} className="text-gray-500" /> All Dates <ChevronDown size={14} className="text-gray-500 ml-1" />
          </button>
          
          <button onClick={handleExport} className="border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-700 bg-white flex items-center gap-2 hover:bg-gray-50 transition-colors xl:ml-2 shadow-sm">
            <Download size={16} className="text-gray-500" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[12px] uppercase tracking-wider text-gray-500 font-bold bg-[#FAFAFA]/50">
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Order ID <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Items <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Total Amount <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Status <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Payment <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">Date <ChevronsUpDown size={14} className="text-gray-400"/></div>
                </th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 font-medium">No orders found matching your criteria.</td>
                </tr>
              ) : visibleOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td 
                    className="py-4 px-6 text-[13px] font-bold text-[#16A34A] cursor-pointer hover:underline"
                    onClick={() => setDetailsOrder(order)}
                  >
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[13px] font-bold text-gray-900 leading-tight">{order.customer?.profile?.fullName || 'Guest User'}</div>
                    <div className="text-[12px] text-gray-500 mt-1">{order.customer?.email || 'No email'}</div>
                  </td>
                  <td className="py-4 px-6 text-[13px] font-bold text-gray-800">
                    {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                  </td>
                  <td className="py-4 px-6 text-[13px] font-bold text-gray-800">
                    ₹{order.grandTotal?.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(order.status)}</td>
                  <td className="py-4 px-6">{getPaymentBadge(order.status)}</td>
                  <td className="py-4 px-6 text-[13px] font-semibold text-gray-700">{formatOrderDate(order.createdAt)}</td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => setDetailsOrder(order)}
                      className="p-1.5 border border-gray-200 rounded-lg text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mx-auto block shadow-sm"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* View More / Show Less */}
        {filteredOrders.length > 4 && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400">
              Showing {visibleOrders.length} of {filteredOrders.length} orders
            </p>
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#16A34A] hover:text-[#15803d] transition-colors"
            >
              {showAllRows ? 'Show Less' : `View All ${filteredOrders.length}`}
              <ChevronRight size={14} className={`transition-transform ${showAllRows ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
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
                     <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-2">Current Status</p>
                     {getStatusBadge(detailsOrder.status)}
                   </div>
                   
                   <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {detailsOrder.status === 'PLACED' && (
                        <>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'CANCELLED')} disabled={isUpdating} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            <XCircle size={16} /> Cancel
                          </button>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'CONFIRMED')} disabled={isUpdating} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <CheckCircle size={16} /> Confirm Order
                          </button>
                        </>
                      )}
                      
                      {detailsOrder.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'PREPARING')} disabled={isUpdating} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <Box size={16} /> Start Preparing
                          </button>
                          {detailsOrder.shipmentCreated ? (
                            <div className="px-5 py-2 bg-green-50 text-green-700 border border-green-200 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm">
                              <CheckCircle size={16} /> Shipment Created (AWB: {detailsOrder.awbNumber})
                            </div>
                          ) : (
                            <button onClick={() => handleCreateShipment(detailsOrder.id)} disabled={isCreatingShipment} className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                              {isCreatingShipment ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />} Create Shipment
                            </button>
                          )}
                        </>
                      )}
                      
                      {detailsOrder.status === 'PREPARING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'READY_FOR_PICKUP')} disabled={isUpdating} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <Package size={16} /> Ready for Pickup
                          </button>
                          <button onClick={() => handleUpdateStatus(detailsOrder.id, 'OUT_FOR_DELIVERY')} disabled={isUpdating} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            <Truck size={16} /> Ship Order
                          </button>
                        </>
                      )}

                      {(detailsOrder.status === 'READY_FOR_PICKUP' || detailsOrder.status === 'OUT_FOR_DELIVERY') && (
                        <button onClick={() => handleUpdateStatus(detailsOrder.id, 'DELIVERED')} disabled={isUpdating} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                          <CheckCircle size={16} /> Mark as Delivered
                        </button>
                      )}

                      {(detailsOrder.status === 'DELIVERED' || detailsOrder.status === 'CANCELLED') && (
                        <p className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
                           No further actions available.
                        </p>
                      )}
                   </div>
                 </div>
              </div>

              {/* Items List */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Package size={14}/> Ordered Items ({detailsOrder.items?.length || 0})</h3>
                <div className="space-y-4">
                  {detailsOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50 p-1">
                        {item.product?.images?.[0]?.imageUrl ? (
                          <img src={item.product.images[0].imageUrl} alt="Product" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400"/></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Unknown Product'}</p>
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

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:block overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 print:hidden shrink-0">
              <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                <Receipt size={24} className="text-[#1E3A2B]" /> Invoice #{invoiceOrder.orderNumber || invoiceOrder.id.slice(-8).toUpperCase()}
              </h2>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => setInvoiceOrder(null)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible text-gray-800">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">INVOICE</h1>
              <p className="text-gray-500 font-medium text-sm">Order #{invoiceOrder.orderNumber || invoiceOrder.id.slice(-8).toUpperCase()}</p>
              <p className="text-gray-500 font-medium text-sm">Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
