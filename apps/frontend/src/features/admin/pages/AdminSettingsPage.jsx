import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { toast } from 'sonner';

export const AdminSettingsPage = () => {
  const [formData, setFormData] = useState({
    platformName: '',
    supportEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      if (data.data?.settings) {
        setFormData(data.data.settings);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]"></div>
      </div>
    );
  }

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
              <input 
                type="text" 
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" 
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 outline-none" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-start">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A2B] text-white font-semibold rounded-xl hover:bg-[#2a4f3c] transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
