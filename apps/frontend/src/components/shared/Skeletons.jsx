import React from 'react';

export const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4 flex flex-col flex-1">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="mt-auto pt-3 flex items-end justify-between border-t border-gray-50">
        <div>
          <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex flex-col items-center min-w-[100px] animate-pulse">
    <div className="w-20 h-20 bg-gray-200 rounded-full mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-16"></div>
  </div>
);

export const DetailsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
    <div className="aspect-square bg-gray-200 rounded-xl"></div>
    <div className="space-y-6">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      </div>
      <div className="pt-6 border-t border-gray-100 flex gap-4">
        <div className="h-12 bg-gray-200 rounded w-32"></div>
        <div className="h-12 bg-gray-200 rounded flex-1"></div>
      </div>
    </div>
  </div>
);
