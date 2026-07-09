import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';

export const VariantsManager = ({ control, register, errors, watch, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Layers size={18} className="text-[#1E3A2B]" />
            Product Variants
          </h3>
          <p className="text-sm text-gray-500 mt-1">Add options like size, weight, or color.</p>
        </div>
        <button
          type="button"
          onClick={() => append({ variantName: '', price: '', compareAtPrice: '', initialStock: 0 })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#1E3A2B] bg-[#F0F8F3] hover:bg-[#E0F0E6] rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Variant
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const variantErrors = errors?.variants?.[index] || {};

          return (
            <div key={field.id} className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 relative group">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                  Variant {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove variant"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* Variant Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Variant Label (What customers see, e.g. "500g Pack")</label>
                  <input
                    {...register(`variants.${index}.variantName`)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                    placeholder="e.g. 500g Pack"
                  />
                  {variantErrors.variantName && <p className="text-xs text-red-500 mt-1">{variantErrors.variantName.message}</p>}
                </div>

                {/* Price Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price`)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                      placeholder="0.00"
                    />
                    {variantErrors.price && <p className="text-xs text-red-500 mt-1">{variantErrors.price.message}</p>}
                  </div>

                  {/* Compare at Price */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Compare at Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.compareAtPrice`)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                      placeholder="Optional"
                    />
                    {variantErrors.compareAtPrice && <p className="text-xs text-red-500 mt-1">{variantErrors.compareAtPrice.message}</p>}
                  </div>
                </div>

                {/* Stock & Weight Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Initial Stock */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Available Stock</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.initialStock`)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                      placeholder="0"
                    />
                    {variantErrors.initialStock && <p className="text-xs text-red-500 mt-1">{variantErrors.initialStock.message}</p>}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Actual Weight (in grams)</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.weight`, {
                        onChange: (e) => {
                          if (watch && setValue) {
                            const val = e.target.value;
                            const currentName = watch(`variants.${index}.variantName`);
                            if (!currentName && val) {
                              setValue(`variants.${index}.variantName`, `${val}g`, { shouldValidate: true });
                            }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                      placeholder="e.g. 500"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Number only (used by Delhivery).</p>
                    {variantErrors.weight && <p className="text-xs text-red-500 mt-1">{variantErrors.weight.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
