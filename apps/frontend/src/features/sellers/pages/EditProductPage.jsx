import React from 'react';
import { useParams } from 'react-router-dom';
import { useMyProduct } from '../../products/hooks/useSellerProductQueries.js';
import { ProductForm } from '../components/ProductForm.jsx';
import { Loader2, AlertCircle } from 'lucide-react';

export const EditProductPage = () => {
  const { id } = useParams();
  const { data: product, isLoading, isError } = useMyProduct(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A2B]" />
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-gray-500">We couldn't load the product details. It may have been deleted.</p>
      </div>
    );
  }

  // Format product data to match form structure
  const initialData = {
    id: product.id,
    name: product.name || '',
    categoryId: product.categoryId || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    features: Array.isArray(product.features) ? product.features : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    ingredients: product.ingredients || '',
    isFeatured: Boolean(product.isFeatured),
    images: product.images || [], // { id, imageUrl, publicId, sortOrder }
    variants: product.variants?.map(v => ({
      id: v.id,
      variantName: v.name || v.variantName || '',
      price: v.price !== null && v.price !== undefined ? String(v.price) : '',
      compareAtPrice: v.compareAtPrice !== null && v.compareAtPrice !== undefined ? String(v.compareAtPrice) : '',
      initialStock: v.inventory?.availableStock ?? v.stock ?? v.initialStock ?? 0,
      weight: v.weight !== null && v.weight !== undefined ? String(v.weight) : '',
    })) || [],
  };

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <ProductForm initialData={initialData} isEditing={true} key={product.id} />
    </div>
  );
};
