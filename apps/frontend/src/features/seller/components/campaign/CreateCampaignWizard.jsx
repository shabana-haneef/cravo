import React, { useState } from 'react';
import { X, Upload, IndianRupee, Link as LinkIcon, Tag } from 'lucide-react';
import { campaignService } from '../../services/campaign.service.js';
import { toast } from 'sonner';

export const CreateCampaignWizard = ({ onClose, onSuccess, initialType }) => {
  const totalSteps = initialType ? 4 : 5;
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    type: initialType || 'PRODUCT_PROMOTION',
    name: '',
    budget: 500,
    bannerFile: null,
    bannerUrl: '',
    destinationUrl: '',
    targetProductIds: []
  });

  const campaignTypes = [
    { id: 'PRODUCT_PROMOTION', name: 'Product Promotion', desc: 'Promote specific products to increase visibility and sales.' },
    { id: 'STOREWIDE_OFFER', name: 'Storewide Offer', desc: 'Run offers across your entire store to attract more buyers.' },
    { id: 'DISCOUNT_CAMPAIGN', name: 'Discount Campaign', desc: 'Create attractive discounts to drive quick sales.' },
    { id: 'FLASH_SALE', name: 'Flash Sale', desc: 'Create urgency with limited-time flash sales.' }
  ];

  // Map logical steps based on whether type was pre-selected
  const getStepContent = () => {
    if (initialType) {
      // 4 steps: Name+Budget → Banner → URL → Summary
      return step;
    }
    // 5 steps: Type → Name+Budget → Banner → URL → Summary
    return step;
  };

  const isTypeStep = !initialType && step === 1;
  const isNameBudgetStep = initialType ? step === 1 : step === 2;
  const isBannerStep = initialType ? step === 2 : step === 3;
  const isUrlStep = initialType ? step === 3 : step === 4;
  const isSummaryStep = initialType ? step === 4 : step === 5;

  const handleNext = () => {
    if (isTypeStep && !formData.type) return toast.error("Select a campaign type");
    if (isNameBudgetStep) {
      if (!formData.name) return toast.error("Campaign name is required");
      if (formData.budget < 100) return toast.error("Minimum budget is ₹100");
    }
    if (isBannerStep && !formData.bannerFile && !formData.bannerUrl) return toast.error("Banner image is required");
    setStep(step + 1);
  };

  const handleCreateAndPay = async () => {
    try {
      setIsProcessing(true);
      const data = new FormData();
      data.append('type', formData.type);
      data.append('name', formData.name);
      data.append('budget', formData.budget);
      data.append('targetProductIds', JSON.stringify(formData.targetProductIds));
      if (formData.destinationUrl) data.append('destinationUrl', formData.destinationUrl);
      if (formData.bannerFile) data.append('banner', formData.bannerFile);
      else if (formData.bannerUrl) data.append('bannerUrl', formData.bannerUrl);

      const res = await campaignService.createCampaign(data);
      const { campaign, razorpayOrder } = res.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Cravo Ad Network",
        description: `Campaign: ${campaign.name}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            await campaignService.verifyPayment(campaign.id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful! Campaign submitted for approval.");
            onSuccess();
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#16a34a" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp1.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step progress dots
  const stepLabels = initialType
    ? ['Details', 'Banner', 'Link', 'Pay']
    : ['Type', 'Details', 'Banner', 'Link', 'Pay'];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        style={{ animation: 'wizardSlideIn 0.2s ease' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 pb-4 flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 ${i + 1 <= step ? 'text-[#154D21]' : 'text-gray-300'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i + 1 < step ? 'bg-[#154D21] border-[#154D21] text-white' :
                  i + 1 === step ? 'border-[#154D21] text-[#154D21]' :
                  'border-gray-200 text-gray-400'
                }`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:inline ${i + 1 <= step ? 'text-[#154D21]' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${i + 1 < step ? 'bg-[#154D21]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-2">
          {/* Step: Campaign Type */}
          {isTypeStep && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">Select campaign type</p>
              <div className="grid grid-cols-1 gap-2">
                {campaignTypes.map(type => (
                  <div 
                    key={type.id} 
                    onClick={() => setFormData({...formData, type: type.id})}
                    className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === type.id ? 'border-[#154D21] bg-[#F0FDF4]' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <h4 className={`text-sm font-bold ${formData.type === type.id ? 'text-[#154D21]' : 'text-gray-900'}`}>{type.name}</h4>
                    <p className="text-[12px] text-gray-500 mt-0.5">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Name + Budget */}
          {isNameBudgetStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Summer Mega Sale"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#154D21] focus:ring-1 focus:ring-[#154D21]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Total Budget (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    min="100"
                    value={formData.budget} 
                    onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#154D21] focus:ring-1 focus:ring-[#154D21]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Minimum budget is ₹100</p>
              </div>
            </div>
          )}

          {/* Step: Banner */}
          {isBannerStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Banner Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={e => setFormData({...formData, bannerFile: e.target.files[0]})}
                    className="hidden" 
                    id="banner-upload"
                  />
                  <label htmlFor="banner-upload" className="cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#154D21] shrink-0">
                      <Upload size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">{formData.bannerFile ? formData.bannerFile.name : 'Click to upload banner'}</span>
                      <span className="text-[11px] text-gray-400 mt-0.5 block">PNG, JPG or WEBP (Max 5MB)</span>
                    </div>
                  </label>
                </div>
              </div>
              {formData.bannerFile && (
                <div className="rounded-xl overflow-hidden border border-gray-100 h-32">
                  <img src={URL.createObjectURL(formData.bannerFile)} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Step: Destination URL */}
          {isUrlStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Destination URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                <p className="text-[11px] text-gray-400 mb-2">Where should users land when they click your ad?</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="url" 
                    value={formData.destinationUrl} 
                    onChange={e => setFormData({...formData, destinationUrl: e.target.value})}
                    placeholder="https://cravo.com/product/..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#154D21] focus:ring-1 focus:ring-[#154D21]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Summary */}
          {isSummaryStep && (
            <div className="space-y-4">
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between border-b pb-2.5 border-gray-200">
                    <span className="text-gray-500">Type</span>
                    <span className="font-semibold text-gray-900">{campaignTypes.find(t => t.id === formData.type)?.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2.5 border-gray-200">
                    <span className="text-gray-500">Name</span>
                    <span className="font-semibold text-gray-900">{formData.name}</span>
                  </div>
                  {formData.destinationUrl && (
                    <div className="flex justify-between border-b pb-2.5 border-gray-200">
                      <span className="text-gray-500">Link</span>
                      <span className="font-semibold text-gray-900 truncate max-w-[200px]">{formData.destinationUrl}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-[#154D21] text-base">₹{formData.budget}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#FEFCE8] px-3 py-2.5 rounded-lg flex gap-2 text-[#A16207]">
                <Tag className="shrink-0 mt-0.5" size={14} />
                <p className="text-xs leading-relaxed">By clicking pay, you agree to our terms. Campaign goes live after admin approval.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Back
            </button>
          ) : <div></div>}
          
          {!isSummaryStep ? (
            <button onClick={handleNext} className="px-5 py-2 bg-[#154D21] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#0A2610] transition-colors">
              Continue
            </button>
          ) : (
            <button 
              onClick={handleCreateAndPay} 
              disabled={isProcessing}
              className="px-6 py-2 bg-[#154D21] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#0A2610] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${formData.budget}`}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wizardSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
