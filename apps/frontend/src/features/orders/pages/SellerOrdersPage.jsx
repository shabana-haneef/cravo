import React, { useState } from 'react';
import { useSellerOrders } from '../hooks/useSellerOrderQueries.js';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Package, Search, Loader2, AlertCircle } from 'lucide-react';

export const SellerOrdersPage = () => {
  const [page, setPage] = useState(1);
  const { data: ordersData, isLoading, isError } = useSellerOrders(page, 20);
  const orders = ordersData?.orders || [];
  const meta = ordersData?.meta;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => {
    const idMatch = o.id ? o.id.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = o.customer?.email ? o.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return idMatch || emailMatch;
  });

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
        <h2 className="text-xl font-bold text-gray-900">Failed to Load Orders</h2>
        <p className="text-gray-500">There was a problem communicating with the server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-[#1E3A2B]" />
            Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID or Customer Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/20"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Package size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No orders found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Order ID</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Total</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{order.customer?.profile?.fullName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{order.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={meta.totalPages} 
          onPageChange={setPage} 
        />
      )}
    </div>
  );
};
