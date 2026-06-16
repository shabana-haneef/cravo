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
    name: product.name,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    isFeatured: product.isFeatured,
    images: product.images || [], // { url, publicId } objects
    variants: product.variants?.map(v => ({
      id: v.id,
      variantName: v.variantName,
      price: v.price,
      compareAtPrice: v.compareAtPrice || '',
      initialStock: v.stock, // backend might return 'stock' or 'initialStock'
    })) || [],
  };

  return (
    <div className="py-8">
      <ProductForm initialData={initialData} isEditing={true} />
    </div>
  );
};
