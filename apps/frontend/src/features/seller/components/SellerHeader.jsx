import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store.js';

export const SellerHeader = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const getPageTitle = () => {
    if (location.pathname.includes('products')) return 'Products';
    if (location.pathname.includes('inventory')) return 'Inventory';
    if (location.pathname.includes('orders')) return 'Orders';
    if (location.pathname.includes('shop-profile')) return 'Shop Profile';
    return 'Overview';
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 border-b border-gray-100/50">
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {user?.email?.split('@')[0] || 'Seller'}
            </p>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
              SELLER
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};
