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

    // Toggle banner visibility every 6 seconds (alternate show/hide)
    const interval = setInterval(() => {
      setShowBanner(prev => !prev);
    }, 6000);

    // Initial show
    setShowBanner(true);

    return () => clearInterval(interval);
  }, [isShopMissing]);

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] font-sans antialiased text-gray-800">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerHeader />

        {/* Periodic Setup Shop Banner */}
        <AnimatePresence>
          {isShopMissing && showBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white overflow-hidden shadow-sm"
            >
              <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 text-sm font-semibold">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="animate-bounce shrink-0 text-white" size={18} />
                  <span>Important: Your shop profile is not set up! Customers cannot view or buy your products.</span>
                </div>
                <Link 
                  to="/seller/shop-profile"
                  className="bg-white text-orange-600 px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-sm"
                >
                  Create Shop Now <ArrowRight size={14} />
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
