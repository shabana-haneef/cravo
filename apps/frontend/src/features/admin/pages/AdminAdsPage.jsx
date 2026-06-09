import React, { useState, useEffect } from 'react';
import { 
  Megaphone, CheckCircle, XCircle, Package, 
  Clock, TrendingUp, Gift, Tag, IndianRupee, 
  Calendar, GripVertical, X, Layers, Crown, 
  ChevronLeft, ChevronRight, MoreVertical, Plus, Edit2, Trash2,
  User, Image as ImageIcon, Link, Send, Info, Zap, CreditCard, Upload
} from 'lucide-react';
import { api } from '../../../lib/axios.js';
import { toast } from 'sonner';

export const AdminAdsPage = () => {
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Package Form
  const [newPackage, setNewPackage] = useState({ 
    name: '', 
    price: '', 
    durationDays: '', 
    features: [''] // Array of feature strings
  });
  const [editingPackageId, setEditingPackageId] = useState(null);
  
  // New Admin Ad Form
  const [newAdminAd, setNewAdminAd] = useState({ title: '', imageUrl: '', targetUrl: '', durationDays: 30 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'packages') {
        const res = await api.get('/admin/ads/packages');
        setPackages(res.data?.data || []);
      } else {
        const res = await api.get('/admin/ads');
        setAds(res.data?.data || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePackage = async (e) => {
    e.preventDefault();
    try {
      const validFeatures = newPackage.features.filter(f => f.trim() !== '');
      if (editingPackageId) {
        await api.put(`/admin/ads/packages/${editingPackageId}`, {
          ...newPackage,
          features: validFeatures
        });
        toast.success('Package updated');
        setEditingPackageId(null);
      } else {
        await api.post('/admin/ads/packages', {
          ...newPackage,
          features: validFeatures
        });
        toast.success('Package created');
      }
      setNewPackage({ name: '', price: '', durationDays: '', features: [''] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save package');
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    setNewPackage({
      name: pkg.name,
      price: pkg.price.toString(),
      durationDays: pkg.durationDays.toString(),
      features: pkg.features?.length > 0 ? [...pkg.features] : ['']
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePackage = async (id) => {
    if(!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.delete(`/admin/ads/packages/${id}`);
      toast.success('Package deleted');
      if (editingPackageId === id) cancelEdit();
      fetchData();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const cancelEdit = () => {
    setEditingPackageId(null);
    setNewPackage({ name: '', price: '', durationDays: '', features: [''] });
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...newPackage.features];
    newFeatures[index] = value;
    setNewPackage({ ...newPackage, features: newFeatures });
  };

  const handleAddFeature = () => {
    setNewPackage({ ...newPackage, features: [...newPackage.features, ''] });
  };

  const handleRemoveFeature = (index) => {
    const newFeatures = newPackage.features.filter((_, i) => i !== index);
    if (newFeatures.length === 0) newFeatures.push(''); 
    setNewPackage({ ...newPackage, features: newFeatures });
  };

  const handleCreateAdminAd = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newAdminAd.title);
      formData.append('targetUrl', newAdminAd.targetUrl);
      formData.append('durationDays', newAdminAd.durationDays);
      if (newAdminAd.imageFile) {
        formData.append('image', newAdminAd.imageFile);
      } else if (newAdminAd.imageUrl) {
        formData.append('imageUrl', newAdminAd.imageUrl);
      } else {
        return toast.error('Please provide an image URL or upload an image file');
      }

      await api.post('/admin/ads/free', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Free admin ad created');
      setNewAdminAd({ title: '', imageUrl: '', imageFile: null, targetUrl: '', durationDays: 30 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ad');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/ads/${id}/approve`);
      toast.success('Ad approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.put(`/admin/ads/${id}/reject`, { reason });
      toast.success('Ad rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const pendingAds = ads.filter(ad => ad.status === 'PENDING_APPROVAL');
  const activeAds = ads.filter(ad => ad.status === 'ACTIVE');

  return (
    <div className="space-y-4 font-['Inter'] flex flex-col h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Advertisement Module</h1>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">Manage seller ad approvals, ad packages, and run free admin ads.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${activeTab === 'approvals' ? 'text-[#16a34a] border-b-[3px] border-[#16a34a]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Clock size={15} className={activeTab === 'approvals' ? 'text-[#16a34a]' : 'text-gray-400'} />
          Pending Approvals 
          <span className="bg-[#dcfce7] text-[#15803d] text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">{pendingAds.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${activeTab === 'active' ? 'text-[#16a34a] border-b-[3px] border-[#16a34a]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <TrendingUp size={15} className={activeTab === 'active' ? 'text-[#16a34a]' : 'text-gray-400'} />
          Active Ads
        </button>
        <button 
          onClick={() => setActiveTab('packages')}
          className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${activeTab === 'packages' ? 'text-[#16a34a] border-b-[3px] border-[#16a34a]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Gift size={15} className={activeTab === 'packages' ? 'text-[#16a34a]' : 'text-gray-400'} />
          Ad Packages
        </button>
        <button 
          onClick={() => setActiveTab('admin_ad')}
          className={`pb-3 flex items-center gap-1.5 text-[13px] font-bold transition-colors ${activeTab === 'admin_ad' ? 'text-[#16a34a] border-b-[3px] border-[#16a34a]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Megaphone size={15} className={activeTab === 'admin_ad' ? 'text-[#16a34a]' : 'text-gray-400'} />
          Run Free Ad
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#16a34a]"></div></div>
        ) : (
          <div className="space-y-4">
            
            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div className="space-y-4">
                {/* Create New Package Form */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#f0fdf4] p-1.5 rounded-lg text-[#16a34a]">
                      <Gift size={18} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#1a1a1a]">{editingPackageId ? 'Edit Package' : 'Create New Package'}</h2>
                  </div>

                  <form onSubmit={handleCreateOrUpdatePackage}>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Left Side: Inputs & Button */}
                      <div className="lg:col-span-3 flex flex-col justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[12px] font-bold text-gray-800 mb-1.5">Package Name</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Tag size={14} className="text-gray-400" />
                              </div>
                              <input required type="text" value={newPackage.name} onChange={e=>setNewPackage({...newPackage, name: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-800 focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="e.g. 7 Days Banner" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-gray-800 mb-1.5">Price (₹)</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={14} className="text-gray-400" />
                              </div>
                              <input required type="number" min="0" value={newPackage.price} onChange={e=>setNewPackage({...newPackage, price: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-800 focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="e.g. 500" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-gray-800 mb-1.5">Duration (Days)</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={14} className="text-gray-400" />
                              </div>
                              <input required type="number" min="1" value={newPackage.durationDays} onChange={e=>setNewPackage({...newPackage, durationDays: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-800 focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="e.g. 7" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button type="submit" className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-[13px] font-bold hover:bg-[#15803d] transition-colors shadow-sm shadow-green-600/20">
                            {editingPackageId ? 'Update Package' : 'Add Package'}
                          </button>
                          {editingPackageId && (
                            <button type="button" onClick={cancelEdit} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-bold hover:bg-gray-200 transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Features */}
                      <div className="lg:col-span-1">
                        <label className="block text-[12px] font-bold text-gray-800 mb-1.5">Features</label>
                        <div className="space-y-2">
                          {newPackage.features.map((feat, idx) => (
                            <div key={idx} className="relative flex items-center">
                              <div className="absolute left-2.5 text-gray-300">
                                <GripVertical size={14} />
                              </div>
                              <input 
                                type="text" 
                                value={feat} 
                                onChange={(e) => handleFeatureChange(idx, e.target.value)} 
                                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-800 focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400" 
                                placeholder="Feature detail..." 
                              />
                              <button type="button" onClick={() => handleRemoveFeature(idx)} className="absolute right-2.5 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={handleAddFeature} className="flex items-center gap-1 text-[12px] font-bold text-[#16a34a] hover:text-[#15803d] mt-1 transition-colors">
                            <Plus size={14} strokeWidth={2.5} /> Add Feature
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Existing Packages */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#f0fdf4] p-1.5 rounded-lg text-[#16a34a]">
                      <Layers size={18} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#1a1a1a]">Existing Packages</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map(pkg => (
                      <div key={pkg.id} className={`border rounded-xl p-4 shadow-sm flex relative bg-white hover:shadow-md transition-all duration-300 ${editingPackageId === pkg.id ? 'border-[#16a34a] ring-1 ring-[#16a34a]' : 'border-gray-100'}`}>
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <button onClick={() => handleEditPackage(pkg)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeletePackage(pkg.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center items-center border-r border-gray-100 pr-4 mt-2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#16a34a] mb-2">
                            <Crown size={20} strokeWidth={2.5} />
                          </div>
                          <h3 className="font-bold text-gray-800 text-[12px] lowercase">{pkg.name}</h3>
                          <p className="text-[20px] font-black text-[#16a34a] leading-none my-1">₹{pkg.price}</p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-1">
                            <Calendar size={12} />
                            <span>{pkg.durationDays} Days</span>
                          </div>
                        </div>

                        <div className="flex-1 pl-5 flex flex-col justify-center">
                          <p className="text-[11px] font-bold text-gray-500 mb-2">Features</p>
                          {pkg.features && pkg.features.length > 0 ? (
                            <ul className="space-y-1.5">
                              {pkg.features.map((feat, idx) => (
                                <li key={idx} className="text-[12px] font-bold text-gray-700 flex items-start gap-1.5 leading-tight">
                                  <CheckCircle size={14} className="text-[#16a34a] shrink-0 mt-[1px]" strokeWidth={2.5} />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[12px] font-medium text-gray-400">No features</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {packages.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                        <ChevronLeft size={14} strokeWidth={2.5} />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#16a34a] text-white font-bold text-[12px] shadow-sm shadow-green-600/20">
                        1
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Ad Tab */}
            {activeTab === 'admin_ad' && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#16a34a] shrink-0">
                    <Megaphone size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1a1a1a]">Create Your Free Advertisement</h2>
                    <p className="text-[13px] font-medium text-gray-500 mt-0.5">Create an advertisement that bypasses payment and approval, instantly going live.</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Form Area */}
                  <div className="flex-1">
                    <form onSubmit={handleCreateAdminAd} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 space-y-0">
                      
                      {/* Form Row 1: Ad Title */}
                      <div className="flex flex-col md:flex-row items-start md:items-center py-4 border-b border-gray-100 gap-4">
                        <div className="flex items-start gap-3 w-full md:w-1/2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] shrink-0">
                            <User size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-[#1a1a1a]">Ad Title</label>
                            <p className="text-[12px] font-medium text-gray-500">Give your ad a catchy title</p>
                          </div>
                        </div>
                        <div className="w-full md:w-1/2">
                          <input required type="text" value={newAdminAd.title} onChange={e=>setNewAdminAd({...newAdminAd, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400" placeholder="e.g. Special Offer on Organic Products" />
                        </div>
                      </div>

                      {/* Form Row 2: Image Upload */}
                      <div className="flex flex-col md:flex-row items-start md:items-center py-4 border-b border-gray-100 gap-4">
                        <div className="flex items-start gap-3 w-full md:w-1/2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] shrink-0">
                            <ImageIcon size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-[#1a1a1a]">Image Upload</label>
                            <p className="text-[12px] font-medium text-gray-500">Upload an image for your advertisement</p>
                          </div>
                        </div>
                        <div className="w-full md:w-1/2">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 border border-[#16a34a] text-[#16a34a] rounded-lg text-[13px] font-bold hover:bg-[#f0fdf4] transition-colors cursor-pointer w-auto">
                              <Upload size={16} strokeWidth={2.5} />
                              Choose File
                              <input type="file" accept="image/*" className="hidden" onChange={e=>setNewAdminAd({...newAdminAd, imageFile: e.target.files[0]})} />
                            </label>
                            <span className="text-[13px] font-medium text-gray-500">{newAdminAd.imageFile ? newAdminAd.imageFile.name : 'No file chosen'}</span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 mt-2">OR provide an image URL below</p>
                        </div>
                      </div>

                      {/* Form Row 3: Image URL */}
                      <div className="flex flex-col md:flex-row items-start md:items-center py-4 border-b border-gray-100 gap-4">
                        <div className="flex items-start gap-3 w-full md:w-1/2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] shrink-0">
                            <Link size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-[#1a1a1a]">Image URL (Cloudinary URL)</label>
                            <p className="text-[12px] font-medium text-gray-500">Provide a Cloudinary image URL</p>
                          </div>
                        </div>
                        <div className="w-full md:w-1/2">
                          <input type="url" value={newAdminAd.imageUrl} onChange={e=>setNewAdminAd({...newAdminAd, imageUrl: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400" placeholder="https://res.cloudinary.com/your-image.jpg" />
                        </div>
                      </div>

                      {/* Form Row 4: Target URL */}
                      <div className="flex flex-col md:flex-row items-start md:items-center py-4 border-b border-gray-100 gap-4">
                        <div className="flex items-start gap-3 w-full md:w-1/2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] shrink-0">
                            <Link size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-[#1a1a1a]">Target URL (Where it clicks to)</label>
                            <p className="text-[12px] font-medium text-gray-500">Enter the URL where users will be redirected</p>
                          </div>
                        </div>
                        <div className="w-full md:w-1/2">
                          <input required type="url" value={newAdminAd.targetUrl} onChange={e=>setNewAdminAd({...newAdminAd, targetUrl: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400" placeholder="https://your-store.com/offer" />
                        </div>
                      </div>

                      {/* Form Row 5: Duration */}
                      <div className="flex flex-col md:flex-row items-start md:items-center py-4 gap-4">
                        <div className="flex items-start gap-3 w-full md:w-1/2">
                          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] shrink-0">
                            <Clock size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-[#1a1a1a]">Duration (Days)</label>
                            <p className="text-[12px] font-medium text-gray-500">Set how many days your ad will be live</p>
                          </div>
                        </div>
                        <div className="w-full md:w-1/2 relative">
                          <input required type="number" min="1" value={newAdminAd.durationDays} onChange={e=>setNewAdminAd({...newAdminAd, durationDays: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all pr-10" />
                          <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2 mt-4">
                        <button type="submit" className="w-full py-3.5 bg-[#16a34a] text-white rounded-lg text-[14px] font-bold hover:bg-[#15803d] transition-colors shadow-sm shadow-green-600/20 flex items-center justify-center gap-2">
                          <Send size={18} strokeWidth={2.5} />
                          Publish Free Ad
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Info Area */}
                  <div className="w-full lg:w-[320px] shrink-0">
                    <div className="bg-[#f8fafc] rounded-xl border border-gray-100 p-6">
                      <div className="w-8 h-8 rounded-full border border-[#16a34a] text-[#16a34a] flex items-center justify-center mb-4 bg-[#f0fdf4]">
                        <Info size={16} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">About Free Ads</h3>
                      <p className="text-[13px] font-medium text-gray-500 leading-relaxed pb-6 border-b border-gray-200 mb-6">
                        Free ads are published <span className="text-[#16a34a] font-bold">instantly</span> without payment or approval.<br/>They will be visible on the platform for the selected duration.
                      </p>

                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#16a34a] shrink-0 mt-0.5">
                            <Zap size={14} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-[#1a1a1a]">Instantly live</h4>
                            <p className="text-[12px] font-medium text-gray-500">No approval required</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#16a34a] shrink-0 mt-0.5">
                            <CreditCard size={14} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-[#1a1a1a]">No payment</h4>
                            <p className="text-[12px] font-medium text-gray-500">100% free to publish</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#16a34a] shrink-0 mt-0.5">
                            <Calendar size={14} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-[#1a1a1a]">Set duration</h4>
                            <p className="text-[12px] font-medium text-gray-500">Choose how long to run</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'approvals' && (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 space-y-4">
                {pendingAds.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 font-medium text-[13px]">No ads pending approval.</p>
                ) : (
                  pendingAds.map(ad => (
                    <div key={ad.id} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all">
                      <img src={ad.imageUrl} alt={ad.title} className="w-full md:w-[160px] h-[100px] object-cover rounded-lg" />
                      <div className="flex-1 space-y-1.5 py-1">
                        <h3 className="font-bold text-[15px] text-gray-900">{ad.title}</h3>
                        <p className="text-[12px] font-medium text-gray-500">Seller: <span className="text-gray-800">{ad.seller?.user?.profile?.fullName || ad.seller?.user?.email}</span></p>
                        <p className="text-[12px] font-medium text-gray-500">Package: <span className="text-gray-800">{ad.package?.name} ({ad.package?.durationDays} Days)</span></p>
                        <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-[#16a34a] text-[12px] font-bold hover:underline inline-block mt-0.5">Test Target URL →</a>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 justify-center md:pl-4 md:border-l border-gray-100">
                        <button onClick={() => handleApprove(ad.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#f0fdf4] text-[#16a34a] rounded-lg hover:bg-[#dcfce7] font-bold text-[12px] transition-colors w-full">
                          <CheckCircle size={14} strokeWidth={2.5} /> Approve
                        </button>
                        <button onClick={() => handleReject(ad.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-[12px] transition-colors w-full">
                          <XCircle size={14} strokeWidth={2.5} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Ads Tab */}
            {activeTab === 'active' && (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 space-y-4">
                {activeAds.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 font-medium text-[13px]">No active ads.</p>
                ) : (
                  activeAds.map(ad => (
                    <div key={ad.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl items-center hover:shadow-sm transition-all">
                      <img src={ad.imageUrl} alt={ad.title} className="w-[100px] h-[70px] object-cover rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-[14px] text-gray-900">{ad.title}</h3>
                        <p className="text-[12px] font-medium text-gray-500">{ad.sellerId ? `Seller ID: ${ad.sellerId}` : 'Admin Free Ad'}</p>
                        <p className="text-[12px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> Ends: {new Date(ad.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right pr-2">
                        <p className="text-[12px] font-bold text-gray-700 mb-1">{ad.views} Views</p>
                        <p className="text-[12px] font-bold text-[#16a34a] bg-[#f0fdf4] px-2.5 py-0.5 rounded-md inline-block">{ad.clicks} Clicks</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

