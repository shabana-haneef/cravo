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
import logoImg from '../logo.png';
import { api } from '../lib/axios.js';

export const MainLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const itemCount = useCartStore(state => state.itemCount);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
  const { data: wishlist = [] } = useWishlist(isCustomer);
  const wishlistCount = wishlist.length;

  // Search Suggestions State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Sync input value with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const delayDebounce = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await api.get('/products/suggestions', {
          params: { q: searchQuery },
          signal: controller.signal
        });
        setSuggestions(response.data?.data?.suggestions || []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Suggestions error:', err);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    navigate(`/products/${suggestion.slug}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

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
          <div className="hidden lg:flex flex-1 max-w-xl mx-8 relative" ref={searchContainerRef}>
            <form 
              onSubmit={handleSearchSubmit} 
              className="w-full flex items-center bg-[#F8FAF8] border border-gray-100 rounded-lg px-4 py-2.5 transition-colors focus-within:bg-white focus-within:border-[#154D21] focus-within:ring-2 focus-within:ring-[#154D21]/20 shadow-sm"
            >
              <input
                type="text"
                placeholder="Search for fresh vegetables, homemade cakes..."
                className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded={showSuggestions && (searchQuery.trim().length >= 2)}
                aria-autocomplete="list"
                aria-controls="search-suggestions-list"
              />
              <button 
                type="submit" 
                className="text-gray-400 hover:text-[#154D21] shrink-0 ml-2 transition-colors focus:outline-none"
                aria-label="Submit Search"
              >
                <Search size={18} />
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && (searchQuery.trim().length >= 2) && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                  className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden p-2"
                >
                  {isLoadingSuggestions ? (
                    <div className="p-4 text-center text-[12px] text-gray-500 font-semibold flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-[#154D21] rounded-full animate-spin"></div>
                      Searching available products...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <ul id="search-suggestions-list" role="listbox" className="space-y-2">
                        {suggestions.map((suggestion, index) => {
                          const isActive = index === activeIndex;
                          return (
                            <li key={suggestion.id} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-150 ${
                                  isActive 
                                    ? 'bg-[#154D21]/10 text-[#154D21]' 
                                    : 'hover:bg-[#154D21]/5 hover:text-[#154D21] text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={suggestion.images?.[0]?.imageUrl || 'https://via.placeholder.com/40'} 
                                    alt={suggestion.name} 
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-bold leading-tight">{suggestion.name}</span>
                                    <span className="text-[11px] text-gray-400 font-semibold">{suggestion.category?.name}</span>
                                  </div>
                                </div>
                                {suggestion.variants?.[0] && (
                                  <span className="text-[12px] font-bold text-[#E67E22]">
                                    ₹{suggestion.variants[0].price}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        type="submit"
                        onClick={handleSearchSubmit}
                        className="w-full text-center py-2 text-[12px] font-bold text-[#154D21] hover:bg-[#154D21]/5 border-t border-gray-100 block transition-colors mt-2"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-gray-500 font-semibold">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
      <Footer />

      {/* Global Ad Popup */}
      <GlobalAdPopup />
    </div>
  );
};

