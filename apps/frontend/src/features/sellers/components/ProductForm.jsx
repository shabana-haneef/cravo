import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { MultiImageUpload } from './MultiImageUpload.jsx';
import { VariantsManager } from './VariantsManager.jsx';
import { useCategories, useCreateCategory } from '../../categories/hooks/useCategoryQueries.js';
import { useCreateProduct, useUpdateProduct, useAddVariant, useUpdateVariant } from '../../products/hooks/useSellerProductQueries.js';

const ArrayInput = ({ label, placeholder, values = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (inputValue.trim()) { onChange([...values, inputValue.trim()]); setInputValue(''); }
            }
          }}
        />
        <button type="button" onClick={() => { if (inputValue.trim()) { onChange([...values, inputValue.trim()]); setInputValue(''); } }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((val, i) => (
          <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {val}
            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  shortDescription: z.string().max(500, 'Short description must be less than 500 characters').optional().or(z.literal('')),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional().or(z.literal('')),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.string().min(1, 'Ingredients are required. List them clearly.'),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
});

const STEPS = [
  { id: 0, title: 'Basic Info', fields: ['name', 'categoryId', 'shortDescription', 'description', 'features', 'tags', 'ingredients'] },
  { id: 1, title: 'Images', fields: [] },
  { id: 2, title: 'Variants', fields: ['variants'] },
];

export const ProductForm = ({ initialData, isEditing = false, onClose }) => {
  const navigate = useNavigate();
  const { data: categoryData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoryData?.data?.categories || [];

  const createProductMut = useCreateProduct();
  const updateProductMut = useUpdateProduct();
  const addVariantMut = useAddVariant();
  const updateVariantMut = useUpdateVariant();
  const createCategoryMut = useCreateCategory();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Custom Category States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryError, setNewCategoryError] = useState('');

  // Store actual File objects OUTSIDE of react-hook-form to avoid any Zod/resolver interference
  const [selectedImages, setSelectedImages] = useState(initialData?.images || []);
  const [imageError, setImageError] = useState('');
  
  const [labelImage, setLabelImage] = useState(null);

  const DRAFT_KEY = isEditing ? `cravo_product_draft_${initialData?.id}` : 'cravo_product_draft_new';

  const getInitialValues = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse draft', e);
    }
    return {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || '',
      shortDescription: initialData?.shortDescription || '',
      description: initialData?.description || '',
      features: initialData?.features || [],
      tags: initialData?.tags || [],
      ingredients: initialData?.ingredients || '',
      isFeatured: initialData?.isFeatured || false,
      variants: initialData?.variants?.length > 0 ? initialData.variants : [{ variantName: '', price: '', compareAtPrice: '', initialStock: 0 }],
    };
  };

  const { register, handleSubmit, control, trigger, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
  });

  const formValues = watch();

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
    }, 500);
    return () => clearTimeout(timeout);
  }, [formValues, DRAFT_KEY]);

  const handleCancel = () => {
    localStorage.removeItem(DRAFT_KEY);
    if (onClose) onClose(); else navigate('/seller/products');
  };

  const categoryId = watch('categoryId');
  const watchShortDesc = watch('shortDescription') || '';
  const watchDesc = watch('description') || '';
  const watchIngredients = watch('ingredients') || '';

  const nextStep = async () => {
    // Validate images step manually
    if (currentStep === 1) {
      const newFiles = selectedImages.filter(img => img instanceof File);
      if (!isEditing && newFiles.length === 0) {
        setImageError('At least one product image is required');
        return;
      }
      setImageError('');
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      return;
    }
    const fields = STEPS[currentStep].fields;
    const isStepValid = fields.length === 0 ? true : await trigger(fields);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Validation failed on Step 0. Errors:', errors);
      toast.error('Please check the red error messages above to continue.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data) => {
    // Final image guard before sending to backend
    const newFiles = selectedImages.filter(img => img instanceof File);
    if (!isEditing && newFiles.length === 0) {
      setImageError('At least one product image is required');
      setCurrentStep(1); // go back to images step
      toast.error('Please select at least one product image.');
      return;
    }

    if (data.categoryId === 'OTHER') {
      if (!newCategoryName.trim()) {
        setNewCategoryError('Category name is required');
        setCurrentStep(0);
        toast.error('Please fill in the new category name.');
        return;
      }
      if (!newCategoryImage) {
        setNewCategoryError('Category image is required');
        setCurrentStep(0);
        toast.error('Please select an image for the new category.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let activeCategoryId = data.categoryId;
      if (activeCategoryId === 'OTHER') {
        const catFormData = new FormData();
        catFormData.append('name', newCategoryName);
        catFormData.append('image', newCategoryImage);
        
        const catRes = await createCategoryMut.mutateAsync(catFormData);
        activeCategoryId = catRes?.data?.category?.id || catRes?.category?.id;
        if (!activeCategoryId) throw new Error('Failed to create new category');
      }

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('categoryId', activeCategoryId);
      if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
      if (data.description) formData.append('description', data.description);
      formData.append('ingredients', data.ingredients);
      if (data.features && data.features.length > 0) formData.append('features', JSON.stringify(data.features));
      if (data.tags && data.tags.length > 0) formData.append('tags', JSON.stringify(data.tags));
      formData.append('isFeatured', data.isFeatured);

      // Append File objects directly from our state (never touched by Zod)
      newFiles.forEach(img => formData.append('images', img));
      if (labelImage) formData.append('labelImage', labelImage);

      const variants = data.variants || [];
      if (!isEditing) {
        const initialVariant = variants[0];
        if (!initialVariant) {
          toast.error('At least one variant is required');
          return;
        }
        formData.append('variantName', initialVariant.variantName);
        formData.append('price', initialVariant.price);
        if (initialVariant.compareAtPrice) formData.append('compareAtPrice', initialVariant.compareAtPrice);
        formData.append('initialStock', initialVariant.initialStock);

        const res = await createProductMut.mutateAsync(formData);
        const productId = res?.data?.product?.id || res?.product?.id;
        if (!productId) {
          throw new Error('Failed to retrieve product ID from server response');
        }

        if (variants.length > 1) {
          const extraVariants = variants.slice(1);
          for (const variant of extraVariants) {
            const payload = {
              name: variant.variantName,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              initialStock: variant.initialStock
            };
            await addVariantMut.mutateAsync({ productId, payload });
          }
        }
        toast.success('Product created successfully');
        localStorage.removeItem(DRAFT_KEY);
      } else {
        await updateProductMut.mutateAsync({ id: initialData.id, formData });
        
        for (const variant of variants) {
          const payload = {
            name: variant.variantName,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            initialStock: variant.initialStock
          };
          if (variant.id) {
            await updateVariantMut.mutateAsync({ productId: initialData.id, variantId: variant.id, payload });
          } else {
            await addVariantMut.mutateAsync({ productId: initialData.id, payload });
          }
        }
        toast.success('Product updated successfully');
        localStorage.removeItem(DRAFT_KEY);
      }

      if (onClose) onClose(); else navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                  <option value="OTHER">+ Add New Category</option>
                </select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
              </div>

              {categoryId === 'OTHER' && (
                <div className="col-span-1 md:col-span-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-sm font-bold text-[#1E3A2B]">New Category Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Category Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Chocolates & Candies"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setNewCategoryError('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Category Picture *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setNewCategoryImage(e.target.files[0]);
                            setNewCategoryError('');
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] outline-none"
                      />
                    </div>
                  </div>
                  {newCategoryError && (
                    <p className="text-xs text-red-500 font-semibold">{newCategoryError}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Short Description</label>
                <span className={`text-xs font-medium ${watchShortDesc.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {watchShortDesc.length}/500
                </span>
              </div>
              <input
                {...register('shortDescription')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none"
                placeholder="Brief summary for listings..."
              />
              {errors.shortDescription && <p className="text-xs text-red-500 mt-1">{errors.shortDescription.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Full Description</label>
                <span className={`text-xs font-medium ${watchDesc.length > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
                  {watchDesc.length}/5000
                </span>
              </div>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none resize-y"
                placeholder="Detailed description of your product..."
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <Controller
              control={control}
              name="features"
              render={({ field }) => (
                <ArrayInput 
                  label="Features (Bullet Points)" 
                  placeholder="e.g. 100% Organic, Freshly picked..."
                  values={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Ingredients *</label>
                <span className={`text-xs font-medium ${watchIngredients.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                  {watchIngredients.length}/2000
                </span>
              </div>
              <textarea
                {...register('ingredients')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none resize-y"
                placeholder="List all ingredients used in this product for food safety..."
              />
              {errors.ingredients && <p className="text-xs text-red-500 mt-1">{errors.ingredients.message}</p>}
            </div>

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <ArrayInput 
                  label="Tags" 
                  placeholder="e.g. organic, vegetables, local..."
                  values={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Step 1: Images — managed via local state, NOT via react-hook-form */}
        <div className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-1">Product Images</h2>
            <p className="text-xs text-gray-500 mb-4">First image will be the cover. You can upload up to 10 images.</p>
            <MultiImageUpload
              value={selectedImages}
              onChange={(imgs) => {
                setSelectedImages(imgs);
                if (imgs.filter(img => img instanceof File).length > 0) setImageError('');
              }}
              error={imageError}
            />

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-1">Food Label / Hygiene Info</h2>
              <p className="text-xs text-gray-500 mb-4">Upload an image of the product's nutritional label or hygiene certification. (Optional but recommended)</p>
              
              <div className="flex items-center gap-4">
                {labelImage || initialData?.labelImageUrl ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img 
                      src={labelImage ? URL.createObjectURL(labelImage) : initialData.labelImageUrl} 
                      alt="Label" 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button"
                      onClick={() => setLabelImage(null)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
                <label className="flex-1 border-2 border-dashed border-gray-200 hover:border-[#1E3A2B]/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 transition-colors">
                  <span className="text-sm font-semibold text-[#1E3A2B]">Click to upload label image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setLabelImage(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>
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
            onClick={currentStep === 0 ? handleCancel : prevStep}
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
