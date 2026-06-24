import React, { useEffect, useState } from 'react';
import {
  Store, Camera, Save, Info, CheckCircle2,
  AlertCircle, ShoppingBag, Plus, MapPin,
  ExternalLink, MoreHorizontal, Power, Upload,
  Tag, Check, Target
} from 'lucide-react';
import { shopApi } from '../../sellers/api/shop.api.js';
import { useMyShop } from '../../sellers/hooks/useShopQueries.js';
import { toast } from 'sonner';

/* ─────────────────── Helper Sub-components ─────────────────── */
const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    aria-pressed={enabled}
    className={`${
      enabled ? 'bg-[#16A34A]' : 'bg-gray-200'
    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]`}
  >
    <span
      className={`${
        enabled ? 'translate-x-5' : 'translate-x-0'
      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
);

const InputLabel = ({ children }) => (
  <label className="block text-xs font-bold text-gray-800 mb-2">{children}</label>
);

const DefaultLogo = () => (
  <svg className="w-full h-full object-cover bg-amber-50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#E8D8C8"/>
    <circle cx="50" cy="50" r="45" stroke="#D3B89E" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M35 65 L48 52 M48 52 L40 52 M48 52 L48 60" stroke="#7A1C5A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45 55 L65 35 M65 35 L53 35 M65 35 L65 47" stroke="#7A1C5A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 50 L50 35 M50 35 L42 35 M50 35 L50 43" stroke="#7A1C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DefaultBanner = () => (
  <svg className="w-full h-full bg-white border border-gray-150" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(15, 20) scale(0.6)">
      <circle cx="50" cy="50" r="50" fill="#E8D8C8"/>
      <path d="M35 65 L48 52 M48 52 L40 52 M48 52 L48 60" stroke="#7A1C5A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M45 55 L65 35 M65 35 L53 35 M65 35 L65 47" stroke="#7A1C5A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 50 L50 35 M50 35 L42 35 M50 35 L50 43" stroke="#7A1C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <text x="90" y="62" fill="#2E0E3B" fontFamily="Inter, Roboto, sans-serif" fontSize="28" fontWeight="800" letterSpacing="1">aametta</text>
  </svg>
);

export const SellerShopProfilePage = ({ hideHeader = false }) => {
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
  
  // Custom mock state for Business Model from screen mockup
  const [businessModel, setBusinessModel] = useState('Self-Operated');

  // Delhivery Pickup Address State
  const [pickupLocationName, setPickupLocationName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');

  // Files & Previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Sync state from query data
  useEffect(() => {
    if (shop) {
      setName(shop.name || '');
      setDescription(shop.description || '');
      setShopType(shop.shopType || 'LOCAL_SHOP');
      setDeliveryRadiusKm(shop.deliveryRadiusKm || 5);
      setIsPickupEnabled(shop.isPickupEnabled ?? true);
      setIsDeliveryEnabled(shop.isDeliveryEnabled ?? true);
      setPickupLocationName(shop.pickupLocationName || '');
      setPickupAddress(shop.pickupAddress || '');
      setPickupCity(shop.pickupCity || '');
      setPickupState(shop.pickupState || '');
      setPickupPincode(shop.pickupPincode || '');
      setPickupPhone(shop.pickupPhone || '');
      setLogoPreview(shop.logoUrl || null);
      setBannerPreview(shop.bannerUrl || null);
      setIsCreating(false);
    } else {
      setIsCreating(true);
    }
  }, [shop]);

  // Clean URLs on changes
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) return;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [bannerFile]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo image size must be less than 2MB");
        return;
      }
      setLogoFile(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Banner image size must be less than 2MB");
        return;
      }
      setBannerFile(file);
    }
  };

  const toggleStatus = () => {
    toast.info("Store status updates are managed via account configuration.");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return toast.error('Shop name is required');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('shopType', shopType);
    formData.append('deliveryRadiusKm', deliveryRadiusKm);
    formData.append('isPickupEnabled', isPickupEnabled);
    formData.append('isDeliveryEnabled', isDeliveryEnabled);
    formData.append('pickupLocationName', pickupLocationName);
    formData.append('pickupAddress', pickupAddress);
    formData.append('pickupCity', pickupCity);
    formData.append('pickupState', pickupState);
    formData.append('pickupPincode', pickupPincode);
    formData.append('pickupPhone', pickupPhone);
    
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

  // Map database ENUM status/types to screen representation labels
  const getShopTypeLabel = (type) => {
    switch (type) {
      case 'LOCAL_SHOP': return 'Local Shop';
      case 'HOME_MADE': return 'Homemade Items';
      case 'FARMER': return 'Farmer / Fresh Produce';
      case 'BAKERY': return 'Bakery';
      case 'GROCERY': return 'Grocery';
      case 'FISH_SELLER': return 'Fish Seller';
      case 'MEAT_SELLER': return 'Meat Seller';
      default: return 'Shop';
    }
  };

  const isActiveStatus = !shop || shop.status === 'ACTIVE';

  return (
    <div className={hideHeader ? "space-y-6" : "max-w-[1200px] mx-auto pb-24 space-y-6"}>
      
      {/* Title Header */}
      {!hideHeader && (
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your shop information and settings.</p>
        </header>
      )}

      {/* Top Card - Store Summary Header */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-gray-100 overflow-hidden shrink-0 shadow-sm">
            {logoPreview ? (
              <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-cover" />
            ) : (
              <DefaultLogo />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{name || 'New Shop'}</h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                isActiveStatus
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                {isActiveStatus ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <Store size={12} className="text-gray-400" />
                <span>{getShopTypeLabel(shopType)}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <MapPin size={12} className="text-gray-400" />
                <span>{pickupCity || 'City'}, {pickupState || 'State'}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <Tag size={12} className="text-gray-400" />
                <span>Shop ID: {shop ? `CRV-${shop.id.slice(-4).toUpperCase()}` : 'CRV-NEW'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 self-stretch sm:self-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info('Opening shop preview...')}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#16A34A] text-[#16A34A] rounded-lg text-xs font-bold hover:bg-[#F0FDF4] transition-colors"
            >
              <ExternalLink size={14} /> Preview Store
            </button>
            <button type="button" className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${
              isActiveStatus
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-[#16A34A]/20 text-[#16A34A] hover:bg-[#F0FDF4]'
            }`}
          >
            <Power size={14} /> Deactivate Store
          </button>
        </div>
      </section>

      {/* Main Form Content */}
      <form id="shop-profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Shop Info & Pickup Location */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Card A: Shop Information */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <Store size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Shop Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">Basic information about your shop.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <InputLabel>Shop Name</InputLabel>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  placeholder="E.g. Aametta Foods"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>Shop Type</InputLabel>
                  <select
                    value={shopType}
                    onChange={(e) => setShopType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  >
                    <option value="LOCAL_SHOP">Local Shop</option>
                    <option value="HOME_MADE">Homemade Items</option>
                    <option value="FARMER">Farmer / Fresh Produce</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="GROCERY">Grocery</option>
                    <option value="FISH_SELLER">Fish Seller</option>
                    <option value="MEAT_SELLER">Meat Seller</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <InputLabel>Business Model</InputLabel>
                  <select
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  >
                    <option value="Self-Operated">Self-Operated</option>
                    <option value="Franchise">Franchise</option>
                    <option value="Consignment">Consignment</option>
                    <option value="Managed by Cravo">Managed by Cravo</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <InputLabel>Shop Description</InputLabel>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] resize-none"
                  placeholder="Describe your shop..."
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-semibold">
                  {description.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Pickup Location */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Pickup Location</h3>
                <p className="text-xs text-gray-500 mt-0.5">Where customers will pick up their orders.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>Location Name / Shop Name</InputLabel>
                  <input
                    type="text"
                    value={pickupLocationName}
                    onChange={(e) => setPickupLocationName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    placeholder="Shop Name Outlet"
                    required
                  />
                </div>
                <div>
                  <InputLabel>Pickup Contact Phone</InputLabel>
                  <input
                    type="text"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    placeholder="Contact Number"
                    required
                  />
                </div>
              </div>

              <div>
                <InputLabel>Street Address</InputLabel>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  placeholder="Address Line"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>City</InputLabel>
                  <input
                    type="text"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <InputLabel>State</InputLabel>
                  <input
                    type="text"
                    value={pickupState}
                    onChange={(e) => setPickupState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="w-1/2 pr-2">
                <InputLabel>Pincode</InputLabel>
                <input
                  type="text"
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  placeholder="Pincode"
                  required
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-6" />

              {/* Fulfillment Options */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                    <ShoppingBag size={16} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">Fulfillment Options</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isPickupEnabled}
                        onChange={(e) => setIsPickupEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isPickupEnabled
                          ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm shadow-[#16A34A]/25'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {isPickupEnabled && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-800">Enable Self Pickup</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isDeliveryEnabled}
                        onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isDeliveryEnabled
                          ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm shadow-[#16A34A]/25'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {isDeliveryEnabled && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-800">Enable Home Delivery</span>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-6" />

              {/* Delivery Radius */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                    <Target size={16} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">Delivery Radius</h3>
                </div>
                <select
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] w-28 text-center"
                >
                  <option value={1}>1 KM</option>
                  <option value={2}>2 KM</option>
                  <option value={3}>3 KM</option>
                  <option value={5}>5 KM</option>
                  <option value={10}>10 KM</option>
                  <option value={20}>20 KM</option>
                  <option value={25}>25 KM</option>
                  <option value={50}>50 KM</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Branding, Status */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card C: Branding */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <Camera size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Branding</h3>
                <p className="text-xs text-gray-500 mt-0.5">Shop branding and media assets.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div>
                <InputLabel>Shop Logo</InputLabel>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-full border border-gray-150 overflow-hidden shrink-0 shadow-sm">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultLogo />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer w-fit">
                      <Upload size={14} />
                      Upload Logo
                      <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">Recommended: 500x500px JPG, PNG up to 2MB</span>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <InputLabel>Shop Banner</InputLabel>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-[140px] h-[56px] rounded-lg overflow-hidden border border-gray-150 flex items-center justify-center shrink-0 shadow-sm">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Shop Banner" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultBanner />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer w-fit">
                      <Upload size={14} />
                      Upload Banner
                      <input type="file" accept="image/*" className="sr-only" onChange={handleBannerChange} />
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">Recommended: 1200x300px JPG, PNG up to 2MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Store Status */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Store Status</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isActiveStatus ? 'Your shop is currently active.' : 'Your shop is currently inactive.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle enabled={isActiveStatus} onChange={toggleStatus} />
                <span className={`text-xs font-bold ${isActiveStatus ? 'text-[#16A34A]' : 'text-gray-400'}`}>
                  {isActiveStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          {!hideHeader && (
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-3 bg-[#1E3A2B] text-white text-[13px] font-bold rounded-xl shadow-xl hover:bg-[#162A1F] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

      </form>
    </div>
  );
};
