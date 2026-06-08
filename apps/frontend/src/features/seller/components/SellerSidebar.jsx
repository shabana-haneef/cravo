import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Box, 
  ShoppingCart,
  Store,
  ChevronRight,
  ChevronLeft,
  Menu,
  LogOut
} from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-300 z-20`}>
      <div className={`p-6 flex items-center justify-center border-b border-gray-100/50 h-20`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            C
          </div>
          {!isCollapsed && <span className="font-bold text-gray-900 text-lg tracking-tight whitespace-nowrap">Cravo Seller</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div className="space-y-8">
          {navGroups.map((group, i) => (
            <div key={i}>
              {!isCollapsed ? (
                <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {group.label}
                </p>
              ) : (
                <div className="h-px bg-gray-100 my-4 mx-2" />
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all ${
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
                        {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100/50 flex flex-col gap-2">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-end px-3'} py-2 rounded-xl text-sm font-medium transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-600`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

    </aside>
  );
};
