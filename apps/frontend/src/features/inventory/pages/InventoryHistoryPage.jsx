import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInventoryHistory, useInventoryItem } from '../hooks/useInventoryQueries.js';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { 
  ArrowLeft, History, Loader2, AlertCircle, 
  TrendingUp, TrendingDown, RefreshCcw, Hand,
  PackageCheck, PackageMinus, Edit2
} from 'lucide-react';

export const InventoryHistoryPage = () => {
  const { variantId } = useParams();
  const [page, setPage] = useState(1);
  
  const { data: historyData, isLoading: isHistoryLoading, isError: isHistoryError } = useInventoryHistory(variantId, page, 20);
  const { data: itemData, isLoading: isItemLoading } = useInventoryItem(variantId);

  const getTransactionIcon = (type, quantity) => {
    switch (type) {
      case 'STOCK_IN': return <TrendingUp size={16} className="text-emerald-500" />;
      case 'STOCK_OUT': return <TrendingDown size={16} className="text-red-500" />;
      case 'ORDER_RESERVED': return <Hand size={16} className="text-amber-500" />;
      case 'ORDER_RELEASED': return <RefreshCcw size={16} className="text-blue-500" />;
      case 'ORDER_COMPLETED': return <PackageCheck size={16} className="text-emerald-600" />;
      case 'MANUAL_ADJUSTMENT': 
        return quantity > 0 ? <TrendingUp size={16} className="text-purple-500" /> : <TrendingDown size={16} className="text-purple-500" />;
      default: return <Edit2 size={16} className="text-gray-500" />;
    }
  };

  const formatTypeLabel = (type) => {
    return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  if (isHistoryLoading || isItemLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A2B]" />
        <p className="text-gray-500 font-medium">Loading history logs...</p>
      </div>
    );
  }

  if (isHistoryError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Failed to Load History</h2>
      </div>
    );
  }

  const transactions = historyData?.history || [];
  const meta = historyData?.meta;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/seller/inventory" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History size={24} className="text-[#1E3A2B]" />
            Inventory History
          </h1>
          {itemData && (
            <p className="text-sm text-gray-500 mt-1">
              Logs for <span className="font-bold text-gray-700">{itemData.productVariant?.product?.name}</span> ({itemData.productVariant?.variantName})
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <History size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No transactions yet</h3>
            <p className="text-gray-500 text-sm">Stock changes and order reservations will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Transaction Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Delta</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Previous Stock</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">New Stock</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type, tx.quantity)}
                        <span className="font-semibold text-gray-800">{formatTypeLabel(tx.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${tx.quantity > 0 ? 'bg-emerald-100 text-emerald-700' : tx.quantity < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {tx.previousStock}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {tx.newStock}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate" title={tx.reason || '-'}>
                      {tx.reason || '-'}
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
