import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useUpdateInventory } from '../hooks/useInventoryQueries.js';
import { toast } from 'sonner';

const schema = z.object({
  newQuantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(3, 'Reason is required').max(255),
});

export const StockAdjustmentModal = ({ isOpen, onClose, variantData, productName }) => {
  const updateInventoryMut = useUpdateInventory();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      newQuantity: 0,
      reason: 'Manual Correction',
    }
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen && variantData) {
      reset({
        newQuantity: variantData.stock || 0,
        reason: 'Manual Correction',
      });
    }
  }, [isOpen, variantData, reset]);

  if (!isOpen || !variantData) return null;

  const currentStock = variantData.stock || 0;

  const onSubmit = async (data) => {
    try {
      const delta = data.newQuantity - currentStock;
      
      if (delta === 0) {
        toast.info("No changes made to the stock quantity.");
        onClose();
        return;
      }

      await updateInventoryMut.mutateAsync({
        variantId: variantData.id,
        payload: {
          quantity: delta,
          reason: data.reason,
        }
      });
      
      toast.success('Stock updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Adjust Stock</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{productName}</p>
            <p className="text-xs text-gray-500 mt-1">Variant: <span className="font-medium text-gray-700">{variantData.variantName}</span> | SKU: {variantData.sku || 'N/A'}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Current Stock:</span>
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">{currentStock}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Total Quantity *</label>
              <input
                type="number"
                {...register('newQuantity')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none transition-all"
              />
              {errors.newQuantity && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {errors.newQuantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Adjustment *</label>
              <select
                {...register('reason')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none transition-all appearance-none"
              >
                <option value="New Stock Arrived">New Stock Arrived</option>
                <option value="Manual Correction">Manual Correction</option>
                <option value="Damaged Items">Damaged Items</option>
                <option value="Returned Item Restocked">Returned Item Restocked</option>
                <option value="Lost in Transit">Lost in Transit</option>
              </select>
              {errors.reason && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {errors.reason.message}
                </p>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A2B] text-white rounded-lg font-semibold hover:bg-[#162A1F] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
