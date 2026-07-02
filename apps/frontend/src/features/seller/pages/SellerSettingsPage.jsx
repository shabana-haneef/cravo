import React from 'react';
import { Settings, Save, Bell, Shield, Wallet } from 'lucide-react';

export const SellerSettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences and configurations.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button className="flex-1 py-4 font-semibold text-green-600 border-b-2 border-green-600 bg-green-50/30">General</button>
          <button className="flex-1 py-4 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-b-2 border-transparent">Notifications</button>
          <button className="flex-1 py-4 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-b-2 border-transparent">Payouts</button>
        </div>

        <div className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Timezone</label>
              <select className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600/30 outline-none bg-white">
                <option>Asia/Kolkata (IST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
              <select className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600/30 outline-none bg-white">
                <option>English</option>
                <option>Malayalam</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A2B] text-white font-semibold rounded-xl hover:bg-[#1E3A2B]/90 transition-colors">
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
