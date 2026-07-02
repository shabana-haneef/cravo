import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, Rocket, BarChart2, Target, Shield, Tag, Store, Percent, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { campaignService } from '../services/campaign.service.js';
import { CreateCampaignWizard } from '../components/campaign/CreateCampaignWizard.jsx';
import { ScrollReveal, StaggerReveal, StaggerItem } from '../../../components/shared/Motion.jsx';

export const SellerAdsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await campaignService.getMyCampaigns();
      setCampaigns(res.data?.data?.campaigns || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSuccess = () => {
    setShowCreate(false);
    setSelectedType(null);
    fetchCampaigns();
  };

  const openWizardWithType = (type) => {
    setSelectedType(type);
    setShowCreate(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Promotions & Ads</h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium">Boost your products visibility and drive more sales.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)} 
          className="flex items-center gap-2 px-5 py-2.5 bg-[#154D21] text-white font-bold rounded-xl shadow-sm hover:bg-[#0A2610] transition-colors"
        >
          <Plus size={18} strokeWidth={2.5} />
          Create Ad Campaign
        </button>
      </div>


      {/* 4 Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#154D21] shrink-0">
            <Rocket size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-1">Increase Visibility</h4>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Get your products in front of thousands of customers.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#154D21] shrink-0">
            <BarChart2 size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-1">More Sales</h4>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Drive traffic to your products and boost conversions.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#154D21] shrink-0">
            <Target size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-1">Targeted Reach</h4>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Reach the right audience that matters to your business.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#154D21] shrink-0">
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-1">Secure & Trusted</h4>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Safe payments and 100% secure transactions.</p>
          </div>
        </div>
      </div>

      {/* Campaign Types Section */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-gray-900">Get Started with These Campaign Types</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div 
          onClick={() => openWizardWithType('PRODUCT_PROMOTION')}
          className="bg-gradient-to-br from-white to-[#F0FDF4]/50 border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:border-[#154D21]/30 transition-all cursor-pointer shadow-sm"
        >
          <span className="absolute top-4 right-4 bg-white text-[#154D21] text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">Popular</span>
          <div className="w-10 h-10 bg-[#E8F3EA] text-[#154D21] rounded-xl flex items-center justify-center mb-4">
            <Tag size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-[#154D21] mb-2">Product Promotion</h3>
          <p className="text-[12px] text-gray-600 font-medium mb-6 relative z-10">Promote specific products to increase visibility and sales.</p>
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#154D21] group-hover:translate-x-1 transition-transform relative z-10">
            Use This Campaign <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={() => openWizardWithType('STOREWIDE_OFFER')}
          className="bg-gradient-to-br from-white to-[#F3E8FF]/50 border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-300 transition-all cursor-pointer shadow-sm"
        >
          <span className="absolute top-4 right-4 bg-white text-purple-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">Popular</span>
          <div className="w-10 h-10 bg-[#F3E8FF] text-purple-700 rounded-xl flex items-center justify-center mb-4">
            <Megaphone size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Storewide Offer</h3>
          <p className="text-[12px] text-gray-600 font-medium mb-6 relative z-10">Run offers across your entire store to attract more buyers.</p>
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#154D21] group-hover:translate-x-1 transition-transform relative z-10">
            Use This Campaign <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={() => openWizardWithType('DISCOUNT_CAMPAIGN')}
          className="bg-gradient-to-br from-white to-[#FFF7ED]/50 border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-300 transition-all cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 bg-[#FFEDD5] text-orange-600 rounded-xl flex items-center justify-center mb-4">
            <Percent size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Discount Campaign</h3>
          <p className="text-[12px] text-gray-600 font-medium mb-6 relative z-10">Create attractive discounts to drive quick sales.</p>
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#154D21] group-hover:translate-x-1 transition-transform relative z-10">
            Use This Campaign <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={() => openWizardWithType('FLASH_SALE')}
          className="bg-gradient-to-br from-white to-[#EFF6FF]/50 border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-300 transition-all cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 bg-[#DBEAFE] text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Flash Sale</h3>
          <p className="text-[12px] text-gray-600 font-medium mb-6 relative z-10">Create urgency with limited-time flash sales.</p>
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#154D21] group-hover:translate-x-1 transition-transform relative z-10">
            Use This Campaign <ArrowRight size={16} />
          </div>
        </div>
      </div>



      {showCreate && (
        <CreateCampaignWizard 
          onClose={() => { setShowCreate(false); setSelectedType(null); }} 
          onSuccess={handleCampaignSuccess}
          initialType={selectedType}
        />
      )}
    </div>
  );
};
