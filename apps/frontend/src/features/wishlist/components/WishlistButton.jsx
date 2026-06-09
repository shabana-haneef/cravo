import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../store/auth.store.js';
import { useWishlist, useToggleWishlist } from '../hooks/useWishlistQueries.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const WishlistButton = ({ productId, className = "" }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Only fetch wishlist if user is authenticated and is a CUSTOMER
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
  
  const { data: wishlist = [] } = useWishlist(isCustomer);
  const toggleWishlist = useToggleWishlist();

  const isWishlisted = wishlist.some(item => item.productId === productId);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to add items to your wishlist.');
      navigate('/login');
      return;
    }

    if (user?.role !== 'CUSTOMER') {
      toast.error('Only customers can add items to their wishlist.');
      return;
    }

    toggleWishlist.mutate(productId, {
      onSuccess: (res) => {
        if (res?.data?.wishlisted) {
          toast.success('Added to wishlist');
        } else {
          toast.success('Removed from wishlist');
        }
      },
      onError: () => {
        toast.error('Failed to update wishlist');
      }
    });
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      onClick={handleToggle}
      className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all duration-300 hover:shadow-lg focus:outline-none flex items-center justify-center cursor-pointer ${
        isWishlisted 
          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
          : 'bg-white/90 text-gray-400 border border-gray-100 hover:text-rose-500 hover:bg-rose-50/50'
      } ${className}`}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        size={20} 
        className={`transition-all duration-300 ${
          isWishlisted ? 'fill-rose-500 stroke-rose-500 scale-110' : 'stroke-current'
        }`}
      />
    </motion.button>
  );
};
