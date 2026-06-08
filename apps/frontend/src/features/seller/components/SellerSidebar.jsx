import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Box, 
  ShoppingCart,
  ChefHat,
  Receipt,
  LogOut,
  Store,
  ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store.js';
import { useLogout } from '../../auth/hooks/useAuthQueries.js';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/seller/dashboard', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Products', path: '/seller/products', icon: <Package size={18} /> },
      { name: 'Inventory', path: '/seller/inventory', icon: <Box size={18} /> },
      { name: 'Orders', path: '/seller/orders', icon: <ShoppingCart size={18} /> },
    ]
  },
  {
    label: 'SHOP',
    items: [
      { name: 'Shop Profile', path: '/seller/shop-profile', icon: <Store size={18} /> },
    ]
  }
];

export const SellerSidebar = () => {
  const { user } = useAuthStore();
  const logoutMut = useLogout();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100/50">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
          C
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">Cravo Seller</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div className="space-y-8">
          {navGroups.map((group, i) => (
            <div key={i}>
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-100/50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => logoutMut.mutate()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  );
};
