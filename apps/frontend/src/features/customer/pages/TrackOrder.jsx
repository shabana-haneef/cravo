import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, Circle } from 'lucide-react';

export const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter a valid Order ID.');
      setShowResult(false);
      return;
    }
    setError('');
    setIsTracking(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      setIsTracking(false);
      setShowResult(true);
    }, 600);
  };

  const steps = [
    {
      title: 'Order Placed',
      description: 'Your order has been received and confirmed.',
      date: 'June 18, 2026 - 10:30 AM',
      status: 'completed'
    },
    {
      title: 'Dispatched',
      description: 'Seller has packed the items and handed the package to our logistics partner.',
      date: 'June 19, 2026 - 02:15 PM',
      status: 'completed'
    },
    {
      title: 'In Transit',
      description: 'Package is in transit between hub locations.',
      date: 'June 20, 2026 - 09:00 AM',
      status: 'active'
    },
    {
      title: 'Out For Delivery',
      description: 'Courier partner is delivering the package to your address today.',
      date: 'Estimated: June 21, 2026',
      status: 'pending'
    },
    {
      title: 'Delivered',
      description: 'Package successfully delivered.',
      date: 'Estimated: June 21, 2026',
      status: 'pending'
    }
  ];

  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Track Package
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Search input section */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleTrack} className="flex gap-4 items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                <Search size={20} className="stroke-[1.5]" />
              </span>
              <input
                type="text"
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#154D21] focus:ring-2 focus:ring-[#154D21]/10 transition-all duration-200 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isTracking}
              className="h-12 px-6 bg-[#F3F4F6] hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-semibold text-sm border border-gray-200 rounded-lg transition-colors duration-200 motion-reduce:transition-none cursor-pointer"
            >
              {isTracking ? 'Tracking...' : 'Track'}
            </button>
          </form>

          {error && (
            <p className="text-rose-500 text-xs font-semibold mt-4 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Tracking results timeline */}
        {showResult && (
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-8">
              <div>
                <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">Order ID</span>
                <h3 className="text-gray-900 font-bold text-base">{orderId}</h3>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-blue-600 font-bold text-sm">In Transit</span>
                </div>
              </div>
            </div>

            {/* Visual Steps */}
            <div className="relative pl-8 border-l border-gray-100 flex flex-col gap-8">
              {steps.map((step, idx) => {
                let dotIcon = null;
                let textClass = 'text-gray-400';
                let titleClass = 'text-gray-400 font-bold';

                if (step.status === 'completed') {
                  dotIcon = (
                    <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#E8F5E9] text-[#154D21] flex items-center justify-center border border-white">
                      <CheckCircle2 size={16} className="fill-current text-white stroke-[#154D21]" />
                    </div>
                  );
                  titleClass = 'text-[#154D21] font-bold';
                  textClass = 'text-gray-600';
                } else if (step.status === 'active') {
                  dotIcon = (
                    <div className="absolute -left-4 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                      <Truck size={16} className="animate-bounce motion-reduce:animate-none" />
                    </div>
                  );
                  titleClass = 'text-blue-600 font-bold';
                  textClass = 'text-gray-700';
                } else {
                  dotIcon = (
                    <div className="absolute -left-4 w-8 h-8 rounded-full bg-white text-gray-300 flex items-center justify-center border border-gray-200">
                      <Circle size={12} className="fill-current" />
                    </div>
                  );
                }

                return (
                  <div key={idx} className="relative flex flex-col gap-2">
                    {dotIcon}
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1">
                      <h4 className={`text-sm sm:text-base ${titleClass}`}>{step.title}</h4>
                      <span className="text-gray-400 text-xs font-semibold">{step.date}</span>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${textClass}`}>{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
