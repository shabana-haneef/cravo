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
import { ArrowRight, ShoppingBag, Search, CheckCircle2, Leaf, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';

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
      <section className="relative w-[100vw] h-[calc(100vh-80px)] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-8 overflow-hidden flex flex-col items-center justify-center p-8 bg-black">
        {/* Parallax BG */}
        <motion.img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80"
          alt="Fresh produce"
          className="absolute inset-0 w-full h-full object-cover opacity-55 scale-110"
          style={{ y: heroBgY }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto px-6">
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="px-4 py-1.5 rounded-full bg-white text-[#111827] text-xs font-bold mb-6 inline-flex items-center gap-1.5 shadow-md"
          >
            <CheckCircle2 size={14} className="text-[#00B259]" />
            100% Organic &amp; Homemade
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-[66px] leading-tight font-serif text-white tracking-tight mb-5 drop-shadow-xl"
          >
            Fresh local goods,<br className="hidden sm:block" /> delivered to you.
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="max-w-xl text-[15px] text-gray-200 mb-8 font-medium leading-relaxed"
          >
            Discover handpicked organic produce, homemade food, and artisanal products directly from sellers in your neighborhood.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
            className="w-full max-w-2xl mx-auto flex items-center bg-white rounded-full p-1.5 shadow-2xl mb-6"
          >
            <div className="flex-1 flex items-center pl-5">
              <input
                type="text"
                placeholder="Search for fresh vegetables, homemade cakes..."
                className="w-full bg-transparent text-[14px] text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="bg-[#00B259] hover:bg-[#009B4E] text-white p-2.5 rounded-full transition-colors flex items-center justify-center shadow"
            >
              <Search size={18} />
            </motion.button>
          </motion.div>

          {/* Popular tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="flex flex-wrap items-center justify-center gap-2.5 text-[12px] text-white/90"
          >
            <span className="font-semibold mr-1">Popular:</span>
            {['Organic Vegetables', 'Fresh Fruits', 'Homemade Cakes', 'Dairy Products'].map((tag, i) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.65)' }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                className="px-4 py-1.5 rounded-full bg-black/40 transition-colors"
              >
                {tag}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mt-4">
        <ScrollReveal variant={fadeUp} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#111827] font-serif">Explore Categories</h2>
          <Link to="/products" className="text-[#00B259] hover:text-[#009B4E] font-semibold flex items-center text-xs tracking-wider uppercase">
            View All <ArrowRight size={14} className="ml-1" />
          </Link>
        </ScrollReveal>

        {catError ? (
          <ErrorState title="Failed to load categories" onRetry={refetchCat} />
        ) : (
          <StaggerReveal className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-5 snap-x hide-scrollbar">
            {catLoading
              ? Array(6).fill(0).map((_, i) => <CategorySkeleton key={i} />)
              : categories.map((category) => (
                <StaggerItem key={category.id}>
                  <motion.div whileHover={{ y: -7, boxShadow: '0 16px 32px rgba(0,0,0,0.09)' }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="flex flex-col items-center min-w-[150px] sm:min-w-[180px] snap-start group bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 py-4 px-6 block"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#F8FAF8] mb-3 flex items-center justify-center p-3">
                        <motion.img
                          src={category.imageUrl || 'https://via.placeholder.com/150'}
                          alt={category.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                          whileHover={{ scale: 1.12 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                      </div>
                      <div className="text-center leading-tight">
                        {category.name?.split(' ').map((word, idx) => (
                          <span key={idx} className={idx === 0 ? "block text-[14px] font-extrabold text-[#111827]" : "block text-[13px] font-semibold text-gray-500 mt-0.5"}>
                            {word}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                </StaggerItem>
              ))
            }
          </StaggerReveal>
        )}
      </section>

      {/* ── New Arrivals ── */}
      <section>
        <ScrollReveal variant={fadeUp} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#111827] flex items-center font-serif">
            <ShoppingBag size={24} className="mr-3 text-[#00B259] stroke-[2.5]" /> New Arrivals
          </h2>
          <Link to="/products" className="text-[#00B259] hover:text-[#009B4E] font-semibold flex items-center text-xs tracking-wider uppercase">
            View All <ArrowRight size={14} className="ml-1" />
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
      </section>

      {/* ── Support Banner ── */}
      <ScrollReveal variant={slideLeft}>
        <section className="bg-[#F3FAF5] rounded-[24px] p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* BG Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E8F5E9]/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#E8F5E9]/50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

          {/* Floating SVG Leaves */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <motion.svg animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              viewBox="0 0 100 100" fill="#88C057" className="absolute right-24 top-6 w-6 h-6 opacity-80 blur-[2px]">
              <path d="M 0 100 C 0 0, 100 0, 100 0 C 100 100, 0 100, 0 100 Z" />
            </motion.svg>
            <motion.svg animate={{ y: [0, -7, 0], rotate: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              viewBox="0 0 100 100" fill="#88C057" className="absolute right-36 top-16 w-5 h-5 opacity-70 blur-[1px]">
              <path d="M 0 100 C 0 0, 100 0, 100 0 C 100 100, 0 100, 0 100 Z" />
            </motion.svg>
            <motion.svg animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              viewBox="0 0 100 100" fill="#88C057" className="absolute -right-4 top-20 w-20 h-20 opacity-80 blur-[4px]">
              <path d="M 0 100 C 0 0, 100 0, 100 0 C 100 100, 0 100, 0 100 Z" />
            </motion.svg>
            <motion.svg animate={{ y: [0, -9, 0], rotate: [0, -3, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              viewBox="0 0 100 100" fill="#6B9F36" className="absolute right-12 bottom-6 w-16 h-16 opacity-90 blur-[3px]">
              <path d="M 0 100 C 0 0, 100 0, 100 0 C 100 100, 0 100, 0 100 Z" />
            </motion.svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 w-full md:w-auto">
            <motion.div
              className="hidden md:block w-44 h-44 rounded-full overflow-hidden shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50"
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              <img src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&q=80" alt="Grocery" className="w-full h-full object-cover" />
            </motion.div>
            <div className="text-left max-w-lg">
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0B1527] mb-3 font-serif leading-tight">Support Local Businesses</h2>
              <p className="text-[#5B6B79] mb-6 leading-relaxed text-[14px]">
                Cravo connects you directly with passionate home-chefs, farmers, and boutique stores in your neighborhood.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Link to="/seller/application" className="inline-flex items-center px-5 py-2.5 bg-[#00B259] text-white font-bold rounded-full hover:bg-[#009B4E] transition-colors shadow-sm text-[13px]">
                  Join the Community <ArrowRight size={16} className="ml-1.5" />
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 shrink-0 mr-12">
            <div className="flex -space-x-3">
              {[
                'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80',
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
                'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
              ].map((src, i) => (
                <motion.img
                  key={i}
                  src={src}
                  alt="Seller"
                  className="w-12 h-12 rounded-full border-[3px] border-[#F3FAF5] shadow-sm object-cover"
                  style={{ zIndex: 40 - i * 10 }}
                  whileHover={{ y: -4, zIndex: 50 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                />
              ))}
            </div>
            <div className="text-left ml-1">
              <span className="text-[13px] font-bold text-[#1E293B] block">Join 1000+</span>
              <span className="text-[13px] font-medium text-[#64748B] block">local sellers</span>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Features Bar ── */}
      <StaggerReveal className="pt-8 border-t border-gray-100/80 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          {[
            { icon: Leaf, label: '100% Organic', sub: 'Certified organic produce' },
            { icon: Truck, label: 'Fast Delivery', sub: 'Quick and safe delivery' },
            { icon: ShieldCheck, label: 'Secure Payment', sub: '100% secure checkout' },
            { icon: RefreshCcw, label: 'Easy Returns', sub: 'Hassle-free returns' },
          ].map(({ icon: Icon, label, sub }) => (
            <StaggerItem key={label}>
              <motion.div
                className="flex items-center justify-center gap-3"
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              >
                <Icon size={24} className="text-[#00B259] shrink-0 stroke-[2]" />
                <div>
                  <p className="text-[14px] font-extrabold text-[#111827]">{label}</p>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5">{sub}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </div>
      </StaggerReveal>
    </div>
  );
};
