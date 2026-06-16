import React from 'react';
import { ProductForm } from '../components/ProductForm.jsx';

export const CreateProductPage = () => {
  return (
    <div className="py-8">
      <ProductForm isEditing={false} />
    </div>
  );
};
