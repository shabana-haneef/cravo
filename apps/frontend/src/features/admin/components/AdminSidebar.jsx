import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store,
  Megaphone,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useLogout } from '../../auth/hooks/useAuthQueries.js';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Users', path: '/admin/users', icon: <Users size={18} /> },
      { name: 'Sellers', path: '/admin/sellers', icon: <Store size={18} /> },
      { name: 'Products', path: '/admin/products', icon: <Package size={18} /> },
      { name: 'Ads', path: '/admin/ads', icon: <Megaphone size={18} /> },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
    ]
  }
];

export const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#111827] text-white border-r border-gray-800 flex flex-col h-screen sticky top-0 transition-all duration-300 z-20`}>
      <div className={`p-6 flex items-center justify-center border-b border-gray-800 h-20`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          {!isCollapsed && <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">Admin Portal</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div className="space-y-8">
          {navGroups.map((group, i) => (
            <div key={i}>
              {!isCollapsed ? (
                <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {group.label}
                </p>
              ) : (
                <div className="h-px bg-gray-800 my-4 mx-2" />
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
                          ? 'bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/5'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`${isActive ? 'text-indigo-400' : 'text-gray-400'}`}>
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

      <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-end px-3'} py-2 rounded-xl text-sm font-medium transition-all text-gray-500 hover:bg-gray-800 hover:text-gray-300`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
