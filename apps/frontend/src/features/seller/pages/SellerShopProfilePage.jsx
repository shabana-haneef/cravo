import React, { useEffect, useState } from 'react';
import { Store, Camera, Save, Info, CheckCircle2, AlertCircle, ShoppingBag, Plus } from 'lucide-react';
import { shopApi } from '../../sellers/api/shop.api.js';
import { useMyShop } from '../../sellers/hooks/useShopQueries.js';
import { toast } from 'sonner';

export const SellerShopProfilePage = () => {
  const { data: shop, isLoading, refetch } = useMyShop();
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shopType, setShopType] = useState('LOCAL_SHOP');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(5);
  const [isPickupEnabled, setIsPickupEnabled] = useState(true);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);

  // Files & Previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    if (shop) {
      setName(shop.name || '');
      setDescription(shop.description || '');
      setShopType(shop.shopType || 'LOCAL_SHOP');
      setDeliveryRadiusKm(shop.deliveryRadiusKm || 5);
      setIsPickupEnabled(shop.isPickupEnabled ?? true);
      setIsDeliveryEnabled(shop.isDeliveryEnabled ?? true);
      setLogoPreview(shop.logoUrl || null);
      setBannerPreview(shop.bannerUrl || null);
      setIsCreating(false);
    } else {
      setIsCreating(true);
    }
  }, [shop]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Shop name is required');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('shopType', shopType);
    formData.append('deliveryRadiusKm', deliveryRadiusKm);
    formData.append('isPickupEnabled', isPickupEnabled);
    formData.append('isDeliveryEnabled', isDeliveryEnabled);
    
    if (logoFile) formData.append('logo', logoFile);
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      if (isCreating) {
        await shopApi.createShop(formData);
        toast.success('Shop profile created successfully!');
      } else {
        await shopApi.updateShop(formData);
        toast.success('Shop profile updated successfully!');
      }
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save shop profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="text-[#00B259]" />
            {isCreating ? 'Set Up Your Shop' : 'Shop Profile'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCreating 
              ? 'Complete your shop profile to start listing products.' 
              : 'Customize how your shop appears to customers.'}
          </p>
        </div>
        {shop && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-semibold self-start sm:self-center">
            <CheckCircle2 size={16} />
            Shop Status: {shop.status}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Banner & Logo section */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <h3 className="px-6 py-4 border-b border-gray-100 text-sm font-bold text-gray-800 uppercase tracking-wide">Shop Branding</h3>
          
          <div className="p-6 space-y-8">
            {/* Banner Upload */}
            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Banner Image</label>
              <div 
                className="h-44 w-full bg-[#F6F9F6] rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden hover:bg-[#F0F5F0] hover:border-[#00B259]/30 transition-all relative"
                onClick={() => document.getElementById('banner-input').click()}
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Shop Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#00B259] transition-colors">
                    <Camera size={28} className="mb-2" />
                    <span className="text-sm font-semibold">Upload Shop Banner</span>
                    <span className="text-xs mt-1 text-gray-400">1200 x 400 suggested (JPEG, PNG, WEBP)</span>
                  </div>
                )}
              </div>
              <input 
                id="banner-input" 
                type="file" 
                accept="image/*" 
                onChange={handleBannerChange} 
                className="hidden" 
              />
            </div>

            {/* Logo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <div className="relative group shrink-0">
                <div 
                  className="w-28 h-28 bg-[#F6F9F6] rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden hover:bg-[#F0F5F0] transition-colors relative"
                  onClick={() => document.getElementById('logo-input').click()}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                        <Camera size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-[#00B259] transition-colors">
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold text-center px-1">Logo</span>
                    </div>
                  )}
                </div>
                <input 
                  id="logo-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange} 
                  className="hidden" 
                />
              </div>

              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">Upload Shop Logo</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                  Add a brand logo. Round shapes work best. Only JPEG, PNG, or WEBP images up to 5MB are accepted.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Shop Settings */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3">Shop Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#00B259] focus:ring-2 focus:ring-[#00B259]/10 outline-none transition-shadow text-gray-800 font-semibold" 
                placeholder="E.g., Grandma's Homemade Bakes" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Type</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#00B259] focus:ring-2 focus:ring-[#00B259]/10 outline-none transition-shadow text-gray-700 font-medium cursor-pointer"
                value={shopType}
                onChange={(e) => setShopType(e.target.value)}
              >
                <option value="HOME_MADE">Homemade Items</option>
                <option value="FARMER">Farmer / Fresh Produce</option>
                <option value="BAKERY">Bakery</option>
                <option value="GROCERY">Grocery</option>
                <option value="FISH_SELLER">Fish Seller</option>
                <option value="MEAT_SELLER">Meat Seller</option>
                <option value="LOCAL_SHOP">Local Shop</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Radius (KM)</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#00B259] focus:ring-2 focus:ring-[#00B259]/10 outline-none transition-shadow text-gray-700 font-medium cursor-pointer"
                value={deliveryRadiusKm}
                onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
              >
                <option value={1}>1 KM</option>
                <option value={2}>2 KM</option>
                <option value={3}>3 KM</option>
                <option value={5}>5 KM (Recommended)</option>
                <option value={10}>10 KM</option>
                <option value={15}>15 KM</option>
                <option value={20}>20 KM</option>
                <option value={25}>25 KM</option>
                <option value={50}>50 KM</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Description</label>
              <textarea 
                rows={4} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#00B259] focus:ring-2 focus:ring-[#00B259]/10 outline-none transition-shadow text-gray-700 resize-y leading-relaxed" 
                placeholder="Describe what makes your products and shop special. Tell your story to customers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Fulfillment Options */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3">Fulfillment & Operations</h3>
          
          <div className="flex flex-col sm:flex-row gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isPickupEnabled}
                onChange={(e) => setIsPickupEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#00B259] border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-[#00B259] transition-colors">Enable Self-Pickup</span>
                <p className="text-xs text-gray-400">Customers can order online and collect from shop</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isDeliveryEnabled}
                onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#00B259] border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-[#00B259] transition-colors">Enable Home Delivery</span>
                <p className="text-xs text-gray-400">Ship items to customers within delivery radius</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1E3A2B] text-white font-bold rounded-2xl hover:bg-[#2a4f3c] transition-all disabled:opacity-50 shadow-lg cursor-pointer text-sm"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <Save size={18} />
            )}
            {isCreating ? 'Create Shop Profile' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};
