import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { api } from '../../lib/axios.js';

export const GlobalAdPopup = () => {
  const [activeAds, setActiveAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    api.get('/ads/active').then(res => {
      if (res.data?.data && res.data.data.length > 0) {
        setActiveAds(res.data.data);
        setIsVisible(true);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeAds.length > 1 && isVisible) {
      const interval = setInterval(() => {
        setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeAds.length, isVisible]);

  const handleAdClick = (ad) => {
    api.post(`/ads/${ad.id}/click`).catch(console.error);
    window.open(ad.targetUrl, '_blank');
  };

  const closePopup = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (!isVisible || activeAds.length === 0) return null;

  const currentAd = activeAds[currentAdIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[9999] w-[340px] sm:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 cursor-pointer group"
          onClick={() => handleAdClick(currentAd)}
        >
          {/* Close Button */}
          <button 
            onClick={closePopup}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* Ad Image */}
          <div className="relative h-[230px] w-full overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentAd.id}
                src={currentAd.imageUrl}
                alt={currentAd.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[#154D21] text-white text-[11px] font-bold rounded uppercase tracking-wider shadow-sm">
              Sponsored
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <motion.div
                key={`text-${currentAd.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{currentAd.title}</h3>
                <div className="flex items-center text-white/90 text-[14px] font-medium gap-1.5 group-hover:text-white transition-colors">
                  View Details <ExternalLink size={15} />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Indicators for multiple ads */}
          {activeAds.length > 1 && (
            <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
              {activeAds.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentAdIndex(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === currentAdIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
