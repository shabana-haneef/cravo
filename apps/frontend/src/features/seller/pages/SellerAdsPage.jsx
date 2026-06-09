import React from 'react';
import { Megaphone, Plus, TrendingUp } from 'lucide-react';

export const SellerAdsPage = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Ads</h1>
          <p className="text-sm text-gray-500 mt-1">Boost your products visibility to get more sales.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-xl shadow-sm hover:bg-orange-600 transition-colors">
          <Plus size={18} />
          Create Ad Campaign
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
          <Megaphone size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No active campaigns</h3>
        <p className="text-gray-500 max-w-sm mb-6">Create your first advertising campaign to put your products in front of thousands of potential buyers.</p>
        <button className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
          Learn about Advertising
        </button>
      </div>
    </div>
  );
};
