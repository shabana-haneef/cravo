import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { SellerSidebar } from '../features/seller/components/SellerSidebar.jsx';
import { SellerHeader } from '../features/seller/components/SellerHeader.jsx';
import { useMyShop } from '../features/sellers/hooks/useShopQueries.js';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const SellerLayout = () => {
  const { data: shop, isLoading, isError } = useMyShop();
  const [showBanner, setShowBanner] = useState(false);

  // Determine if shop is missing
  const isShopMissing = !isLoading && (!shop || isError);

  useEffect(() => {
    if (!isShopMissing) {
      setShowBanner(false);
      return;
    }

    // Toggle widget visibility every 12 seconds (visible for 8s, hidden for 4s)
    const interval = setInterval(() => {
      setShowBanner(prev => !prev);
    }, 12000);

    // Initial show
    setShowBanner(true);

    return () => clearInterval(interval);
  }, [isShopMissing]);

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] font-sans antialiased text-gray-800 relative">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerHeader />

        {/* Modern Floating Setup Reminder Widget */}
        <AnimatePresence>
          {isShopMissing && showBanner && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md border border-amber-200 rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-start gap-3.5">
                {/* Pulsing Alarm Icon */}
                <div className="relative shrink-0 mt-0.5">
                  <span className="absolute inline-flex h-10 w-10 rounded-full bg-amber-400 opacity-20 animate-ping"></span>
                  <div className="relative w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                    <AlertTriangle size={20} className="stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#111827] text-sm">Shop Profile Incomplete</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    Customers cannot view your shop or purchase your products until you complete your shop profile setup.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowBanner(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors border border-gray-100 hover:bg-gray-50 rounded-xl"
                >
                  Later
                </button>
                <Link
                  to="/seller/shop-profile"
                  onClick={() => setShowBanner(false)}
                  className="flex-1 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white text-center rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1"
                >
                  Set Up Now <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
