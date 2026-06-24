import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useCategories } from '../../categories/hooks/useCategoryQueries.js';
import { useProducts } from '../../products/hooks/useProductQueries.js';
import { ProductCard } from '../../../components/shared/ProductCard.jsx';
import { CategorySkeleton, ProductSkeleton } from '../../../components/shared/Skeletons.jsx';
import { ErrorState } from '../../../components/shared/ErrorState.jsx';
import {
  ScrollReveal, StaggerReveal, StaggerItem, HoverCard, TapButton,
  fadeUp, fadeIn, slideLeft, slideRight, scaleIn
} from '../../../components/shared/Motion.jsx';
import { ArrowRight, ShoppingBag, Search, CheckCircle2, Leaf, Truck, ShieldCheck, RefreshCcw, ChevronDown, Users } from 'lucide-react';

export const HomePage = () => {
  const { data: catData, isLoading: catLoading, isError: catError, refetch: refetchCat } = useCategories();
  const { data: prodData, isLoading: prodLoading, isError: prodError, refetch: refetchProd } = useProducts({ limit: 8, sort: 'latest' });

  const categories = catData?.data?.categories || [];
  const featuredProducts = prodData?.data?.products || [];

  // Parallax on hero bg
  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 600], [0, 90]);

  return (
    <div className="flex flex-col gap-16 w-full">

      {/* ── Hero ── */}
      <section id="hero" className="relative w-[100vw] h-[calc(100vh-80px)] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-8 overflow-hidden flex flex-col items-center justify-center p-8 bg-black">
        {/* Parallax BG */}
        <motion.img
          src="/images/herobg.png"
          alt="Crafted in Home Kitchens background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          style={{ y: heroBgY }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto px-6 space-y-6">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-[60px] leading-tight font-serif text-white tracking-tight drop-shadow-xl font-normal"
          >
            Crafted in Home Kitchens.<br />
            <span className="text-[#C5A880] italic">Delivered to You.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="max-w-2xl text-[16px] sm:text-[18px] text-white/85 font-medium leading-relaxed"
          >
            Discover authentic pickles, spices, snacks, and more — made by trusted home sellers across India.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            className="flex flex-row items-center justify-center gap-4 mt-2"
          >
            <Link 
              to="/products" 
              className="px-8 py-3.5 bg-[#154D21] hover:bg-[#103B19] text-white font-bold rounded-full transition-colors text-sm tracking-wide shadow-md"
            >
              Explore Products
            </Link>
            <Link 
              to="/seller/application" 
              className="px-8 py-3.5 border border-white/30 bg-[#2D2724]/40 hover:bg-[#2D2724]/60 text-white font-bold rounded-full transition-colors text-sm tracking-wide shadow-md"
            >
              Start Selling
            </Link>
          </motion.div>
        </div>

        {/* Running Ad Marquee */}
        <div className="absolute bottom-0 left-0 w-full py-3 bg-[#0a0604] border-y border-[#C5A880]/30 overflow-hidden z-20">
          <div className="animate-marquee whitespace-nowrap flex items-center text-[11px] sm:text-[12px] font-bold tracking-[0.18em] text-[#C5A880] uppercase">
            <span className="text-[#C5A880]">•</span><span className="mx-6">No Preservatives</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Pure &amp; Natural</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Crafted in Home Kitchens</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Authentic Spices</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Homemade Pickles</span>
            
            {/* Duplicate for seamless loop */}
            <span className="text-[#C5A880]">•</span><span className="mx-6">No Preservatives</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Pure &amp; Natural</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Crafted in Home Kitchens</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Authentic Spices</span>
            <span className="text-[#C5A880]">•</span><span className="mx-6">Homemade Pickles</span>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="mt-4">
        <ScrollReveal variant={fadeUp} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Shop by Category</h2>
          <Link to="/categories" className="text-[#154D21] hover:text-[#103B19] font-semibold flex items-center text-sm font-medium tracking-tight">
            Show more <ArrowRight size={14} className="ml-1" />
          </Link>
        </ScrollReveal>
        {catError ? (
          <ErrorState title="Failed to load categories" onRetry={refetchCat} />
        ) : (
          catLoading ? (
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 animate-pulse w-[110px] sm:w-[130px]">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-100 border border-gray-200" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <StaggerReveal className="flex flex-wrap justify-center gap-x-8 gap-y-6">
              {categories.slice(0, 6).map((category) => (
                <StaggerItem key={category.id}>
                  <motion.div 
                    whileHover={{ y: -5 }} 
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="flex flex-col items-center group cursor-pointer w-[110px] sm:w-[130px]"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-white shadow-md flex items-center justify-center p-0.5 bg-gray-50 relative group-hover:scale-[1.03] transition-transform duration-300">
                        <img 
                          src={category.imageUrl || '/grocery-bag.png'} 
                          alt={category.name} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      </div>
                      
                      <span className="mt-3.5 text-[14px] font-bold text-gray-700 text-center tracking-tight leading-tight group-hover:text-[#154D21] transition-colors block px-2">
                        {category.name}
                      </span>
                    </Link>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          )
        )}
      </section>

      {/* ── New Arrivals ── */}
      <section>
        <ScrollReveal variant={fadeUp} className="flex items-center justify-between mb-8">
          <h2 className="text-[22px] font-bold text-gray-900 flex items-center tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-[#154D21] mr-3"></span> New Arrivals
          </h2>
          <Link to="/products" className="text-gray-600 hover:text-gray-900 font-medium flex items-center text-sm">
            View All <ArrowRight size={16} className="ml-1.5" />
          </Link>
        </ScrollReveal>

        {prodError ? (
          <ErrorState title="Failed to load products" onRetry={refetchProd} />
        ) : (
          <StaggerReveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {prodLoading
              ? Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              : featuredProducts.length > 0
                ? featuredProducts.map(product => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggerItem>
                ))
                : <div className="col-span-full"><p className="text-gray-500">No products available right now.</p></div>
            }
          </StaggerReveal>
        )}
        
        {/* Load More Button */}
        <div className="mt-10 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-bold text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
            Load More <ChevronDown size={16} className="text-gray-500" />
          </button>
        </div>
      </section>



      {/* ── Features Bar ── */}
      <StaggerReveal className="mb-8">
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 py-8 px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { icon: Leaf, label: '100% Organic', sub: 'Certified organic products' },
              { icon: Truck, label: 'Fast Delivery', sub: 'Quick and safe delivery' },
              { icon: ShieldCheck, label: 'Secure Payment', sub: '100% secure checkout' },
              { icon: RefreshCcw, label: 'Easy Returns', sub: 'Hassle free returns' },
            ].map(({ icon: Icon, label, sub }) => (
              <StaggerItem key={label}>
                <motion.div
                  className="flex items-center justify-center gap-4 md:justify-start lg:justify-center"
                  whileHover={{ scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  <Icon size={28} className="text-[#154D21] shrink-0 stroke-[1.5]" />
                  <div>
                    <p className="text-[14px] font-extrabold text-gray-900">{label}</p>
                    <p className="text-[12px] font-medium text-gray-500 mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </div>
      </StaggerReveal>

      {/* Floating Join Community Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-2 group">
        <div className="bg-[#333333] text-white text-[12px] font-semibold px-3 py-1.5 rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md translate-y-2 pointer-events-none">
          Join Community
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333333]"></div>
        </div>
        <Link 
          to="/seller/application" 
          className="w-14 h-14 bg-[#154D21] hover:bg-[#103B19] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all"
        >
          <Users size={24} className="stroke-[2.5]" /> 
        </Link>
      </div>
    </div>
  );
};
