import React from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store.js';
import { useCartStore } from '../store/cart.store.js';
import { useLogout } from '../features/auth/hooks/useAuthQueries.js';
import { ShoppingCart, User, LogOut, Store, Package, Box, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const MainLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const itemCount = useCartStore(state => state.itemCount);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-[#00B259] tracking-tight">
              <Store size={26} className="stroke-[2.5]" />
              Cravo
            </Link>
            
            <div className="hidden md:block h-6 w-px bg-gray-200 mx-6"></div>
            
            <nav className="hidden md:flex">
              <NavLink to="/products" className="text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Browse Market
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart size={22} className="stroke-[2]" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#D35400] text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center leading-none shadow-sm border-2 border-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-5">
                {user?.role === 'SELLER' ? (
                  <>
                    <NavLink to="/seller/inventory" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Box size={16} /> Inventory
                    </NavLink>
                    <NavLink to="/seller/products" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Package size={16} /> Products
                    </NavLink>
                    <NavLink to="/seller/dashboard" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Store size={16} /> My Shop
                    </NavLink>
                  </>
                ) : (
                  <NavLink to="/seller/application" className={`hidden md:flex items-center gap-2 bg-[#FFF4E6] text-[#D35400] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#FFE8CC] transition-colors`}>
                    <Store size={16} /> Sell on Cravo
                  </NavLink>
                )}
                
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                >
                  <User size={18} className="stroke-[2]" />
                  <span className="max-w-[120px] truncate">{user.email.split('@')[0]}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
                  title="Logout"
                >
                  <LogOut size={18} className="stroke-[2]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-lg">
            <Store size={20} />
            Cravo
          </div>
          <p className="text-gray-400 text-sm">© 2026 Cravo Marketplace. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/about" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">About</Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Terms</Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
