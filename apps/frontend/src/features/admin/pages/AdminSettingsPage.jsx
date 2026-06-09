import React from 'react';
import { Settings, Save } from 'lucide-react';

export const AdminSettingsPage = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global platform parameters.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">General Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Platform Name</label>
              <input type="text" className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none" defaultValue="Cravo" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email</label>
              <input type="email" className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none" defaultValue="support@cravo.com" />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-start">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
