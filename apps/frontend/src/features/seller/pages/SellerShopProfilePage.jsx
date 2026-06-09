import React from 'react';
import { Store, Camera, Save } from 'lucide-react';

export const SellerShopProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Customize how your shop appears to customers.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="space-y-6">
          
          {/* Banner & Logo */}
          <div className="relative">
            <div className="h-40 w-full bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 group cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-500">
                <Camera size={24} className="mb-2" />
                <span className="text-sm font-medium">Upload Shop Banner</span>
              </div>
            </div>
            
            <div className="absolute -bottom-8 left-8">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center bg-gray-50 group cursor-pointer hover:bg-gray-100 transition-colors">
                <Camera size={20} className="text-gray-400 group-hover:text-gray-500" />
              </div>
            </div>
          </div>

          <div className="pt-10 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600/30 outline-none" placeholder="Your Shop Name" defaultValue="Cravo Seller" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Description</label>
              <textarea rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600/30 outline-none resize-y" placeholder="Tell customers what your shop is about..."></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A2B] text-white font-semibold rounded-xl hover:bg-[#1E3A2B]/90 transition-colors">
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
