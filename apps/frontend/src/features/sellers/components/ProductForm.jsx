import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { MultiImageUpload } from './MultiImageUpload.jsx';
import { VariantsManager } from './VariantsManager.jsx';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { useCreateProduct, useUpdateProduct, useAddVariant, useUpdateVariant, useDeleteVariant } from '../../products/hooks/useSellerProductQueries.js';

const variantSchema = z.object({
  id: z.string().optional(),
  variantName: z.string().min(1, 'Required'),
  price: z.coerce.number().min(0.01, 'Must be positive'),
  compareAtPrice: z.union([z.coerce.number().positive(), z.literal(''), z.nan()]).optional().transform(v => v === '' || isNaN(v) ? null : v),
  initialStock: z.coerce.number().int().min(0, 'Cannot be negative'),
});

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  shortDescription: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  isFeatured: z.boolean().default(false),
  images: z.array(z.any()).max(10, 'Max 10 images'),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
});

export const ProductForm = ({ initialData, isEditing = false }) => {
  const navigate = useNavigate();
  const { data: categoryData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoryData?.data?.categories || [];

  const createProductMut = useCreateProduct();
  const updateProductMut = useUpdateProduct();
  const addVariantMut = useAddVariant();
  const updateVariantMut = useUpdateVariant();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',
    isFeatured: initialData?.isFeatured || false,
    images: initialData?.images || [], // Can be existing objects or new Files
    variants: initialData?.variants?.length > 0 ? initialData.variants : [{ variantName: '', price: '', compareAtPrice: '', initialStock: 0 }],
  };

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('categoryId', data.categoryId);
      if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
      if (data.description) formData.append('description', data.description);
      formData.append('isFeatured', data.isFeatured);

      // Append new files
      const newImages = data.images.filter(img => img instanceof File);
      newImages.forEach(img => formData.append('images', img));

      if (!isEditing) {
        // CREATE FLOW
        const initialVariant = data.variants[0];
        formData.append('variantName', initialVariant.variantName);
        formData.append('price', initialVariant.price);
        if (initialVariant.compareAtPrice) formData.append('compareAtPrice', initialVariant.compareAtPrice);
        formData.append('initialStock', initialVariant.initialStock);

        const res = await createProductMut.mutateAsync(formData);
        const productId = res.data.product.id;

        // Add additional variants if any
        if (data.variants.length > 1) {
          const extraVariants = data.variants.slice(1);
          for (const variant of extraVariants) {
            await addVariantMut.mutateAsync({ productId, payload: variant });
          }
        }
        toast.success('Product created successfully');
      } else {
        // UPDATE FLOW
        await updateProductMut.mutateAsync({ id: initialData.id, formData });
        
        // Update Variants
        for (const variant of data.variants) {
          if (variant.id) {
            await updateVariantMut.mutateAsync({ productId: initialData.id, variantId: variant.id, payload: variant });
          } else {
            await addVariantMut.mutateAsync({ productId: initialData.id, payload: variant });
          }
        }
        // Note: For simplicity in this demo, we aren't handling deleted variants during edit in this form snippet.
        toast.success('Product updated successfully');
      }

      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/seller/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                {...register('categoryId')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none bg-white"
                disabled={isLoadingCategories}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
            <input
              {...register('shortDescription')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
              placeholder="Brief summary for listings..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none resize-y"
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Product Images</h2>
          <p className="text-sm text-gray-500 mb-4">First image will be the cover. You can upload up to 10 images.</p>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <MultiImageUpload
                value={field.value}
                onChange={field.onChange}
                error={errors.images?.message}
              />
            )}
          />
        </div>

        {/* Variants */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <VariantsManager control={control} register={register} errors={errors} />
          {errors.variants?.root && <p className="text-xs text-red-500 mt-2">{errors.variants.root.message}</p>}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 sticky bottom-4">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-6 py-2.5 rounded-full font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-white bg-[#1E3A2B] hover:bg-[#162A1F] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditing ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
