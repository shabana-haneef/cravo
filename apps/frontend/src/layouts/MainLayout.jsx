import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/auth.store.js';
import { useCartStore } from '../store/cart.store.js';
import { useLogout } from '../features/auth/hooks/useAuthQueries.js';
import { ShoppingCart, User, LogOut, Store, Package, Box, ChevronDown, Search, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { GlobalAdPopup } from '../components/shared/GlobalAdPopup.jsx';

export const MainLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const itemCount = useCartStore(state => state.itemCount);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

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
              <img src="/images/logo.jpeg" alt="Cravo Logo" className="h-12 w-auto object-contain rounded-xl mix-blend-multiply" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-2 ml-4">
              <Store size={18} className="text-[#00B259]" />
              <NavLink to="/products" className="text-[14px] font-bold text-[#111827] hover:text-[#00B259] transition-colors">
                Browse Market
              </NavLink>
            </nav>
          </div>

          {/* Central Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="w-full flex items-center bg-[#F8FAF8] border border-gray-100 rounded-lg px-4 py-2.5 transition-colors focus-within:bg-white focus-within:border-[#00B259] focus-within:ring-2 focus-within:ring-[#00B259]/20 shadow-sm">
              <input 
                type="text"
                placeholder="Search for fresh vegetables, homemade cakes..."
                className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none"
              />
              <Search size={18} className="text-gray-400 shrink-0 ml-2" />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Wishlist Link */}
            {(!isAuthenticated || user?.role === 'CUSTOMER') && (
              <Link
                to="/wishlist"
                className="p-2 text-gray-600 hover:text-rose-500 transition-colors"
                title="My Wishlist"
              >
                <Heart size={22} className="stroke-[2]" />
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

            {isAuthenticated ? (
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto pt-16 pb-8 text-[13px]">
        <div className="max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 mx-auto flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="w-full md:w-[30%]">
            <h3 className="font-bold text-[#111827] text-[15px] mb-3">Stay Updated with Cravo</h3>
            <p className="text-gray-500 mb-5 text-xs">Subscribe to get updates on new products, offers, and more.</p>
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden p-1 shadow-sm">
              <input type="email" placeholder="Enter your email address" className="flex-1 outline-none px-3 text-gray-700 text-xs" />
              <button className="bg-[#00B259] hover:bg-[#009B4E] text-white px-4 py-2 rounded-md font-semibold text-xs transition-colors">Subscribe</button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-wrap justify-between gap-8 md:px-6">
            <div>
              <h4 className="font-bold text-[#111827] text-sm mb-4">Marketplace</h4>
              <div className="flex flex-col gap-2.5 text-gray-500 text-xs font-medium">
                <Link className="hover:text-[#00B259] transition-colors">All Products</Link>
                <Link className="hover:text-[#00B259] transition-colors">Categories</Link>
                <Link className="hover:text-[#00B259] transition-colors">Stores</Link>
                <Link className="hover:text-[#00B259] transition-colors">Today's Deals</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm mb-4">Company</h4>
              <div className="flex flex-col gap-2.5 text-gray-500 text-xs font-medium">
                <Link to="/about" className="hover:text-[#00B259] transition-colors">About Us</Link>
                <Link to="/" className="hover:text-[#00B259] transition-colors">How It Works</Link>
                <Link to="/" className="hover:text-[#00B259] transition-colors">Blog</Link>
                <Link to="/contact" className="hover:text-[#00B259] transition-colors">Contact Us</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm mb-4">Help</h4>
              <div className="flex flex-col gap-2.5 text-gray-500 text-xs font-medium">
                <Link to="/faq" className="hover:text-[#00B259] transition-colors">FAQs</Link>
                <Link to="/" className="hover:text-[#00B259] transition-colors">Shipping & Delivery</Link>
                <Link to="/" className="hover:text-[#00B259] transition-colors">Returns & Refunds</Link>
                <Link to="/contact" className="hover:text-[#00B259] transition-colors">Support</Link>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[15%]">
            <h4 className="font-bold text-[#111827] text-sm mb-4">Connect</h4>
            <div className="flex gap-2">
              <button className="w-7 h-7 rounded-full bg-[#E8F5E9] text-[#00B259] flex items-center justify-center hover:bg-[#00B259] hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </button>
              <button className="w-7 h-7 rounded-full bg-[#E8F5E9] text-[#00B259] flex items-center justify-center hover:bg-[#00B259] hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </button>
              <button className="w-7 h-7 rounded-full bg-[#E8F5E9] text-[#00B259] flex items-center justify-center hover:bg-[#00B259] hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button className="w-7 h-7 rounded-full bg-[#E8F5E9] text-[#00B259] flex items-center justify-center hover:bg-[#00B259] hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 mx-auto flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-400 border-t border-gray-100 pt-8 font-medium">
          <p>© 2026 Cravo Marketplace. All rights reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms & Conditions</Link>
            <Link to="/cookie-policy" className="hover:text-gray-600 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>
      
      {/* Global Ad Popup */}
      <GlobalAdPopup />
    </div>
  );
};

