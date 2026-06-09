import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, TrendingUp } from 'lucide-react';
import { adSellerService } from '../services/ad.service.js';
import { toast } from 'sonner';

export const SellerAdsPage = () => {
  const [ads, setAds] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Campaign State
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adsRes, pkgsRes] = await Promise.all([
        adSellerService.getMyAds(),
        adSellerService.getPackages()
      ]);
      setAds(adsRes.data?.data || []);
      setPackages(pkgsRes.data?.data || []);
    } catch (error) {
      toast.error('Failed to load advertisements data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return toast.error('Please select an ad package');

    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('packageId', selectedPackage.id);
      formData.append('title', newAd.title);
      formData.append('targetUrl', newAd.targetUrl);
      if (newAd.imageFile) {
        formData.append('image', newAd.imageFile);
      } else if (newAd.imageUrl) {
        formData.append('imageUrl', newAd.imageUrl);
      } else {
        setIsProcessing(false);
        return toast.error('Please provide an image URL or upload an image file');
      }

      const res = await adSellerService.createAdOrder(formData);
      
      const { orderId, amount, currency, advertisementId } = res.data.data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency: currency,
        name: "Cravo Ad Network",
        description: selectedPackage.name,
        order_id: orderId,
        handler: async function (response) {
          try {
            await adSellerService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              advertisementId
            });
            toast.success("Payment successful! Ad submitted for approval.");
            setShowCreate(false);
            setNewAd({ title: '', imageUrl: '', targetUrl: '' });
            setSelectedPackage(null);
            fetchData();
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#4f46e5",
        },
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

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Ads</h1>
          <p className="text-sm text-gray-500 mt-1">Boost your products visibility to get more sales.</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-xl shadow-sm hover:bg-orange-600 transition-colors">
            <Plus size={18} />
            Create Ad Campaign
          </button>
        )}
      </div>

      {showCreate ? (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-lg font-bold">New Advertising Campaign</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          
          <form onSubmit={handleCreateOrder} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">1. Select a Package</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id} 
                    onClick={() => setSelectedPackage(pkg)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedPackage?.id === pkg.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                  >
                    <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                    <p className="text-2xl font-black text-orange-600 mt-2">₹{pkg.price}</p>
                    <p className="text-sm text-gray-500 mt-1">{pkg.durationDays} Days Duration</p>
                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="mt-4 space-y-1">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-orange-500 mt-0.5 shrink-0">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold">2. Ad Details</label>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ad Title</label>
                <input required type="text" value={newAd.title} onChange={e=>setNewAd({...newAd, title: e.target.value})} className="w-full max-w-md px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 50% Off Fresh Fruits" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Banner Image Upload</label>
                <input type="file" accept="image/*" onChange={e=>setNewAd({...newAd, imageFile: e.target.files[0]})} className="w-full max-w-md px-3 py-2 border rounded-lg text-sm bg-white" />
                <p className="text-xs text-gray-400 mt-1">OR provide an Image URL below</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Banner Image URL (Cloudinary URL)</label>
                <input type="url" value={newAd.imageUrl} onChange={e=>setNewAd({...newAd, imageUrl: e.target.value})} className="w-full max-w-md px-3 py-2 border rounded-lg text-sm" placeholder="https://res.cloudinary.com/..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target URL (Where customers go when they click)</label>
                <input required type="url" value={newAd.targetUrl} onChange={e=>setNewAd({...newAd, targetUrl: e.target.value})} className="w-full max-w-md px-3 py-2 border rounded-lg text-sm" placeholder="https://cravo.com/shop/my-shop" />
              </div>
            </div>

            <button type="submit" disabled={isProcessing || !selectedPackage} className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Pay & Submit for Approval'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {ads.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
                <Megaphone size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No active campaigns</h3>
              <p className="text-gray-500 max-w-sm mb-6">Create your first advertising campaign to put your products in front of thousands of potential buyers.</p>
              <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map(ad => (
                <div key={ad.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                  <img src={ad.imageUrl} alt={ad.title} className="w-full sm:w-32 h-24 object-cover rounded-lg" />
                  <div className="flex-1 space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        ad.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        ad.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                        ad.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ad.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Package: {ad.package?.name}</p>
                    {ad.status === 'ACTIVE' && (
                      <p className="text-xs text-gray-400">Ends: {new Date(ad.endDate).toLocaleDateString()}</p>
                    )}
                    {ad.status === 'REJECTED' && (
                      <p className="text-xs text-red-500 mt-1">Reason: {ad.rejectionReason}</p>
                    )}
                    
                    <div className="flex gap-4 pt-2 border-t mt-2">
                      <div>
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="font-bold">{ad.views}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Clicks</p>
                        <p className="font-bold text-orange-600">{ad.clicks}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
