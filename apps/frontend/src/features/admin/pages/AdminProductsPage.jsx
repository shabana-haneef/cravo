import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Package, Check, X, Image as ImageIcon, Search, Tag, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { toast } from 'sonner';

const STATUS_TABS = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

const STATUS_BADGE = {
  PENDING_APPROVAL: <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pending Review</span>,
  APPROVED:         <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Approved</span>,
  REJECTED:         <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Rejected</span>,
};

const TAB_LABEL = {
  PENDING_APPROVAL: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// ─── Image Gallery (mini) ────────────────────────────────────────────────────
const ImageGallery = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const total = images?.length ?? 0;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  if (!total) {
    return (
      <div className="w-full h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        <ImageIcon size={40} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden group">
      <img
        src={images[current].imageUrl}
        alt={`Product image ${current + 1}`}
        className="w-full h-full object-cover"
      />
      {total > 1 && (
        <>
          <button
            onClick={prev}
            disabled={current === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            disabled={current === total - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
          <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
            {current + 1}/{total}
          </span>
        </>
      )}
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ product, onReview }) => {
  const thumbnail = product.images?.[0]?.imageUrl;
  const lowestPrice = useMemo(() => {
    if (!product.variants?.length) return null;
    return Math.min(...product.variants.map(v => v.price));
  }, [product.variants]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="h-40 bg-gray-100 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon size={32} />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 flex-1 mr-2">{product.name}</h3>
          {STATUS_BADGE[product.status]}
        </div>

        <div className="space-y-1.5 mt-auto text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Tag size={12} className="shrink-0" />
            <span className="truncate">{product.category?.name || 'Uncategorized'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Store size={12} className="shrink-0" />
            <span className="truncate">{product.shop?.name || '—'}</span>
          </div>
          {lowestPrice !== null && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-700">
                ₹{lowestPrice.toFixed(2)}
                {product.variants?.length > 1 && <span className="text-gray-400 font-normal"> onwards</span>}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onReview(product)}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-[#B88645] text-[#B88645] rounded-lg text-sm font-medium hover:bg-[#B88645] hover:text-white transition-colors"
          >
            <Search size={14} />
            Review Product
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = React.memo(({ product, onClose, onApprove, onReject }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isActing, setIsActing] = useState(false);

  const handleApprove = useCallback(async () => {
    setIsActing(true);
    await onApprove(product.id);
    setIsActing(false);
  }, [product.id, onApprove]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setIsActing(true);
    await onReject(product.id, rejectReason);
    setIsActing(false);
  }, [product.id, rejectReason, onReject]);

  const lowestVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.reduce((min, v) => v.price < min.price ? v : min, product.variants[0]);
  }, [product.variants]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-[#1E3A2B]" />
            Review Product
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Top: Images + Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Images</h3>
              <ImageGallery images={product.images} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">{product.category?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    {STATUS_BADGE[product.status]}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                  {lowestVariant && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price from:</span>
                      <span className="font-semibold text-gray-900">₹{lowestVariant.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shop / Seller Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Shop & Seller</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shop:</span>
                    <span className="font-medium text-gray-900">{product.shop?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium text-gray-900">
                      {product.shop?.seller?.user?.profile?.fullName || product.shop?.seller?.user?.email || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900">{product.shop?.seller?.user?.email || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.shortDescription && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">Short Description</h3>
              <p className="text-gray-700">{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">Full Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">Variants & Pricing</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Compare At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {product.variants.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.sku}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{v.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {v.compareAtPrice ? `₹${v.compareAtPrice.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (already rejected) */}
          {product.status === 'REJECTED' && product.rejectionReason && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{product.rejectionReason}</p>
            </div>
          )}

          {/* Rejection textarea (only when pending) */}
          {product.status === 'PENDING_APPROVAL' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Rejection <span className="text-gray-400 font-normal">(required if rejecting)</span>
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow text-gray-700 text-sm resize-none"
                placeholder="E.g., Content violates community guidelines, product images are unclear..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {product.status === 'PENDING_APPROVAL' && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={handleReject}
              disabled={isActing}
              className="px-6 py-2.5 rounded-lg font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject Product
            </button>
            <button
              onClick={handleApprove}
              disabled={isActing}
              className="px-6 py-2.5 rounded-lg font-bold bg-[#1E3A2B] text-white hover:bg-[#2a4f3c] transition-colors shadow-lg disabled:opacity-50"
            >
              Approve Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
ReviewModal.displayName = 'ReviewModal';

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_APPROVAL');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useCallback(async (status) => {
    try {
      setLoading(true);
      const data = await adminService.listProducts(status);
      setProducts(data.data?.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filter);
  }, [filter, fetchProducts]);

  const openModal = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  }, []);

  const handleApprove = useCallback(async (id) => {
    try {
      await adminService.approveProduct(id);
      toast.success('Product approved successfully');
      closeModal();
      fetchProducts(filter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve product');
    }
  }, [filter, fetchProducts, closeModal]);

  const handleReject = useCallback(async (id, reason) => {
    try {
      await adminService.rejectProduct(id, reason);
      toast.success('Product rejected');
      closeModal();
      fetchProducts(filter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product');
    }
  }, [filter, fetchProducts, closeModal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve seller product listings.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {STATUS_TABS.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                filter === status
                  ? 'bg-[#1E3A2B] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {TAB_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1E3A2B]/5 rounded-full flex items-center justify-center mb-4 text-[#1E3A2B]">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 max-w-sm">
            There are no {TAB_LABEL[filter].toLowerCase()} products at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onReview={openModal} />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isModalOpen && selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
