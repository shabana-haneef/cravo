import React from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store.js';
import { useCartStore } from '../store/cart.store.js';
import { useLogout } from '../features/auth/hooks/useAuthQueries.js';
import { ShoppingCart, User, LogOut, Store, Package } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-primary-600 tracking-tight">
              <Store size={24} />
              Cravo
            </Link>
            <nav className="hidden md:flex gap-6">
              <NavLink to="/products" className={navLinkClass}>Browse Market</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-full transition-colors"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.role === 'SELLER' ? (
                  <>
                    <NavLink to="/seller/products" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Package size={16} /> Products
                    </NavLink>
                    <NavLink to="/seller/dashboard" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Store size={16} /> My Shop
                    </NavLink>
                  </>
                ) : (
                  <NavLink to="/seller/application" className={`hidden md:flex items-center gap-1 text-sm font-medium text-[#B88645] hover:text-[#a0743a] transition-colors`}>
                    <Store size={16} /> Sell on Cravo
                  </NavLink>
                )}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  <User size={16} />
                  <span className="max-w-[100px] truncate">{user.email.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                  title="Logout"
                >
                  <LogOut size={18} />
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
