import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../store/auth.store.js';
import { useCartStore } from '../store/cart.store.js';
import { useLogout } from '../features/auth/hooks/useAuthQueries.js';
import { ShoppingCart, User, LogOut, Store, Package, Box, ChevronDown, Search, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { GlobalAdPopup } from '../components/shared/GlobalAdPopup.jsx';
import { useWishlist } from '../features/wishlist/hooks/useWishlistQueries.js';
import { Footer } from '../components/shared/Footer.jsx';
import { GlobalSearchBar } from '../components/shared/GlobalSearchBar.jsx';
import logoImg from '../logo.png';

export const MainLayout = () => {
  const { isAuthenticated, user, isInitializing } = useAuthStore();
  const itemCount = useCartStore(state => state.itemCount);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
  const { data: wishlist = [] } = useWishlist(isCustomer);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className={`bg-white border-b border-gray-100 sticky top-0 z-50 header-transition ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 mx-auto h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Cravo Logo" className="h-32 w-80 object-contain rounded-xl mix-blend-multiply" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 ml-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-[14px] font-bold transition-colors ${isActive ? 'text-[#154D21]' : 'text-[#111827] hover:text-[#154D21]'}`
                }
                end
              >
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `text-[14px] font-bold transition-colors ${isActive ? 'text-[#154D21]' : 'text-[#111827] hover:text-[#154D21]'}`
                }
              >
                Shop
              </NavLink>
            </nav>
          </div>

          {/* Central Search Bar */}
          <GlobalSearchBar />

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Wishlist Link */}
            {(!isAuthenticated || user?.role === 'CUSTOMER') && (
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-600 hover:text-rose-500 transition-colors"
                title="My Wishlist"
              >
                <Heart size={22} className="stroke-[2]" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center leading-none shadow-sm border-2 border-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart size={22} className="stroke-[2]" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#E67E22] text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center leading-none shadow-sm border-2 border-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isInitializing ? (
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-5">
                {user?.role === 'SELLER' ? (
                  <>
                    <NavLink to="/seller/dashboard" className={`hidden md:flex items-center gap-1 text-sm font-medium ${navLinkClass({ isActive: false })}`}>
                      <Store size={16} /> My Shop
                    </NavLink>
                  </>
                ) : (
                  <NavLink to="/seller/application" className={`hidden md:flex items-center gap-2 bg-[#FFF9F2] text-[#E67E22] border border-[#FFE8CC] px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#FFE8CC] transition-colors shadow-sm`}>
                    <Store size={16} /> Sell on Cravo
                  </NavLink>
                )}

                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                >
                  <User size={18} className="stroke-[2]" />
                  <span className="max-w-[120px] truncate">{(user?.email?.split('@') || [])[0] || 'User'}</span>
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

      {/* Main Content with Framer Motion page transitions */}
      <main className="flex-1 w-full max-w-[1536px] px-4 sm:px-6 lg:px-8 py-8 mx-auto">
        <AnimatePresence>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Ad Popup */}
      <GlobalAdPopup />
    </div>
  );
};

