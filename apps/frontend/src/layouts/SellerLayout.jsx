import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { SellerSidebar } from '../features/seller/components/SellerSidebar.jsx';
import { SellerHeader } from '../features/seller/components/SellerHeader.jsx';
import { useMyShop } from '../features/sellers/hooks/useShopQueries.js';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MotionLink = motion(Link);

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

        {/* Modern Centered Setup Reminder Modal */}
        <AnimatePresence>
          {isShopMissing && showBanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="max-w-md w-full bg-white rounded-3xl p-7 shadow-2xl flex flex-col gap-5 text-center items-center"
              >
                {/* Pulsing Alarm Icon */}
                <div className="relative shrink-0">
                  <span className="absolute inline-flex h-14 w-14 rounded-full bg-amber-400 opacity-20 animate-ping"></span>
                  <div className="relative w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                    <AlertTriangle size={26} className="stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-[#111827] text-lg animate-pulse">Shop Profile Incomplete</h4>
                  <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-sm">
                    Customers cannot view your shop or purchase your products until you complete your shop profile setup. Let's get your store ready!
                  </p>
                </div>

                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setShowBanner(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Later
                  </button>
                  <MotionLink
                    to="/seller/shop-profile"
                    onClick={() => setShowBanner(false)}
                    animate={{
                      scale: [1, 1.04, 1],
                      boxShadow: [
                        "0px 4px 10px rgba(245, 158, 11, 0.2)",
                        "0px 4px 22px rgba(245, 158, 11, 0.5)",
                        "0px 4px 10px rgba(245, 158, 11, 0.2)"
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex-1 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white text-center rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Set Up Now <ArrowRight size={14} />
                  </MotionLink>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
