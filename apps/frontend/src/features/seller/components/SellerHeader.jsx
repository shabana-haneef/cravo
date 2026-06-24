import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store.js';
import { NotificationBell } from '../../notifications/components/NotificationBell.jsx';

export const SellerHeader = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const getPageTitle = () => {
    if (location.pathname.includes('products')) return 'Products';
    if (location.pathname.includes('inventory')) return 'Inventory';
    if (location.pathname.includes('orders')) return 'Orders';
    if (location.pathname.includes('shop-profile')) return 'Shop Profile';
    if (location.pathname.includes('settings')) return 'Settings';
    return 'Overview';
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 border-b border-gray-100/50">
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-6">
        <NotificationBell variant="seller" />
        
        <div className="flex items-center gap-3 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {(user?.email?.split('@') || [])[0] || 'testseller'}
            </p>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
              SELLER
            </p>
          </div>
          <Link to="/seller/settings" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
              <User size={18} />
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-gray-600"><path d="m6 9 6 6 6-6"/></svg>
          </Link>
        </div>
      </div>
    </header>
  );
};
