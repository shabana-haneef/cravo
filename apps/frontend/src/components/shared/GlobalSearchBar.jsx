import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api } from '../../lib/axios.js';
import { optimizeImage } from '../../lib/cloudinary.js';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce.js';

export const GlobalSearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // TanStack Query for suggestions
  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['productSuggestions', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.trim().length < 2) return [];
      const { data } = await api.get('/products/suggestions', {
        params: { q: debouncedSearch }
      });
      return data?.data?.suggestions || [];
    },
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: 60 * 1000 // Cache for 1 minute
  });

  const suggestions = suggestionsData || [];

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
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

  return (
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
                              src={optimizeImage(suggestion.images?.[0]?.imageUrl, 100) || 'https://via.placeholder.com/40'} 
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
                  type="button"
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
  );
};
