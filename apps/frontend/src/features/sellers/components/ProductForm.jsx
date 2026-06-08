import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { MultiImageUpload } from './MultiImageUpload.jsx';
import { VariantsManager } from './VariantsManager.jsx';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { useCreateProduct, useUpdateProduct, useAddVariant, useUpdateVariant } from '../../products/hooks/useSellerProductQueries.js';

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

const STEPS = [
  { id: 0, title: 'Basic Info', fields: ['name', 'categoryId', 'shortDescription', 'description'] },
  { id: 1, title: 'Images', fields: ['images'] },
  { id: 2, title: 'Variants', fields: ['variants'] },
];

export const ProductForm = ({ initialData, isEditing = false }) => {
  const navigate = useNavigate();
  const { data: categoryData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoryData?.data?.categories || [];

  const createProductMut = useCreateProduct();
  const updateProductMut = useUpdateProduct();
  const addVariantMut = useAddVariant();
  const updateVariantMut = useUpdateVariant();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const defaultValues = {
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',
    isFeatured: initialData?.isFeatured || false,
    images: initialData?.images || [], 
    variants: initialData?.variants?.length > 0 ? initialData.variants : [{ variantName: '', price: '', compareAtPrice: '', initialStock: 0 }],
  };

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const nextStep = async () => {
    const fields = STEPS[currentStep].fields;
    const isStepValid = await trigger(fields);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('categoryId', data.categoryId);
      if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
      if (data.description) formData.append('description', data.description);
      formData.append('isFeatured', data.isFeatured);

      const newImages = data.images.filter(img => img instanceof File);
      newImages.forEach(img => formData.append('images', img));

      if (!isEditing) {
        const initialVariant = data.variants[0];
        formData.append('variantName', initialVariant.variantName);
        formData.append('price', initialVariant.price);
        if (initialVariant.compareAtPrice) formData.append('compareAtPrice', initialVariant.compareAtPrice);
        formData.append('initialStock', initialVariant.initialStock);

        const res = await createProductMut.mutateAsync(formData);
        const productId = res.data.product.id;

        if (data.variants.length > 1) {
          const extraVariants = data.variants.slice(1);
          for (const variant of extraVariants) {
            await addVariantMut.mutateAsync({ productId, payload: variant });
          }
        }
        toast.success('Product created successfully');
      } else {
        await updateProductMut.mutateAsync({ id: initialData.id, formData });
        
        for (const variant of data.variants) {
          if (variant.id) {
            await updateVariantMut.mutateAsync({ productId: initialData.id, variantId: variant.id, payload: variant });
          } else {
            await addVariantMut.mutateAsync({ productId: initialData.id, payload: variant });
          }
        }
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
    <div className="max-w-3xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/seller/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1E3A2B] rounded-full z-0 transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-[#1E3A2B] border-[#1E3A2B] text-white' 
                      : isCurrent
                        ? 'bg-white border-[#1E3A2B] text-[#1E3A2B]'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : idx + 1}
                </div>
                <span className={`text-[11px] font-bold absolute -bottom-5 whitespace-nowrap ${isCurrent ? 'text-[#1E3A2B]' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-10">
        
        {/* Step 0: Basic Info */}
        <div className={currentStep === 0 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800">Basic Information</h2>
            
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
        </div>

        {/* Step 1: Images */}
        <div className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-1">Product Images</h2>
            <p className="text-xs text-gray-500 mb-4">First image will be the cover. You can upload up to 10 images.</p>
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
        </div>

        {/* Step 2: Variants */}
        <div className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <VariantsManager control={control} register={register} errors={errors} />
            {errors.variants?.root && <p className="text-xs text-red-500 mt-2">{errors.variants.root.message}</p>}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={currentStep === 0 ? () => navigate('/seller/products') : prevStep}
            className="px-5 py-2 rounded-full font-bold text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm text-white bg-[#1E3A2B] hover:bg-[#162A1F] transition-colors shadow-sm"
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm text-white bg-[#1E3A2B] hover:bg-[#162A1F] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? 'Save Changes' : 'Publish Product'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
