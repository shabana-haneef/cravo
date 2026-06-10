import React from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store.js';
import { NotificationBell } from '../../notifications/components/NotificationBell.jsx';

export const AdminHeader = () => {
  const { user } = useAuthStore();

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search users, sellers, or settings..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-4">
        <NotificationBell variant="admin" />

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{user?.email || 'Admin User'}</p>
            <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};
