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
  LogOut,
  BarChart3,
  Megaphone,
  Star,
  Settings,
  ShoppingBag
} from 'lucide-react';
import { useLogout } from '../../auth/hooks/useAuthQueries.js';
import logoImg from '../../../logo.png';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/seller/dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Analytics', path: '/seller/analytics', icon: <BarChart3 size={18} /> },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Products', path: '/seller/products', icon: <Package size={18} /> },
      { name: 'Inventory', path: '/seller/inventory', icon: <Box size={18} /> },
      { name: 'Orders', path: '/seller/orders', icon: <ShoppingCart size={18} /> },
      { name: 'Reviews', path: '/seller/reviews', icon: <Star size={18} /> },
    ]
  },
  {
    label: 'MARKETING',
    items: [
      { name: 'Ads & Promotions', path: '/seller/ads', icon: <Megaphone size={18} /> },
    ]
  },
  {
    label: 'SHOP',
    items: [
      { name: 'Settings', path: '/seller/settings', icon: <Settings size={18} /> },
    ]
  }
];

export const SellerSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-300 motion-reduce:transition-none z-20`}>
      <div className={`p-6 flex items-center justify-center border-b border-gray-100/50 h-20`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img src={logoImg} alt="Cravo Logo" className="h-8 w-auto object-contain rounded-md mix-blend-multiply" />
          {!isCollapsed && <span className="font-bold text-gray-900 text-lg tracking-tight whitespace-nowrap">Seller</span>}
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
                          ? 'bg-green-50 text-green-600 shadow-sm shadow-green-100/50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`${isActive ? 'text-green-600' : 'text-gray-400'}`}>
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

      <div className={`p-4 ${isCollapsed ? 'px-2' : 'px-4'} border-t border-gray-100/50 flex flex-col gap-2`}>
        <NavLink
          to="/"
          title={isCollapsed ? 'Browse Marketplace' : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all motion-reduce:transition-none text-[#16a34a] hover:bg-[#f0fdf4] hover:text-[#15803d]`}
        >
          <ShoppingBag size={18} />
          {!isCollapsed && <span>Browse Marketplace</span>}
        </NavLink>

        <div className={`flex flex-row items-center justify-center gap-1.5`}>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            title={isCollapsed ? 'Logout' : undefined}
            className={`${isCollapsed ? 'w-7 h-7 justify-center' : 'flex-1 gap-3 px-3 py-2.5'} flex items-center rounded-lg text-sm font-medium transition-all motion-reduce:transition-none text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className={`${isCollapsed ? 'w-7 h-7' : 'w-10 h-10'} flex items-center justify-center rounded-lg text-sm font-medium transition-all motion-reduce:transition-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0`}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-150 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 text-red-650">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <LogOut size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-left">Log Out</h3>
            </div>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-705 font-bold text-xs rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
};
