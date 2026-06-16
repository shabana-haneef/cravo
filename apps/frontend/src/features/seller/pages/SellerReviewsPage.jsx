import React from 'react';
import { MessageSquare, Star } from 'lucide-react';

export const SellerReviewsPage = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Read and respond to customer feedback.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 text-yellow-500">
          <Star size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-500 max-w-sm">When customers leave reviews for your products, they will appear here. Providing excellent service encourages great reviews!</p>
      </div>
    </div>
  );
};
