import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Currency } from '../types';
import { motion } from 'motion/react';
import ociLogo from '../assets/images/oci_sports_logo_1789864489183.jpg';

interface NavbarProps {
  currentPage: 'home' | 'product';
  onNavigate: (page: 'home' | 'product') => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenReviews?: () => void;
  onOpenChat?: () => void;
  currency?: Currency;
  onCurrencyChange?: (c: Currency) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-8 py-2.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Metallic Chrome Logo (Click to reload the page) */}
        <motion.button
          id="nav-logo-btn"
          type="button"
          onClick={handleReload}
          whileHover={{ scale: 1.05, rotate: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="flex items-center cursor-pointer group select-none py-1 relative"
          title="Reload page"
          aria-label="Reload page"
        >
          <div className="absolute inset-0 bg-[#e5b338]/0 group-hover:bg-[#e5b338]/15 rounded-lg blur-md transition-all duration-300" />
          <img
            src={ociLogo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="relative h-10 sm:h-12 w-auto object-contain transition-all duration-300 group-hover:brightness-125 group-hover:drop-shadow-[0_0_12px_rgba(229,179,56,0.4)]"
          />
        </motion.button>

        {/* Right Side: Only Bag Left */}
        <div className="flex items-center">
          <motion.button
            id="nav-cart-btn"
            type="button"
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 16 }}
            onClick={onOpenCart}
            className="relative group overflow-hidden flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_25px_rgba(229,179,56,0.5)] border border-white/80"
            aria-label="View Cart"
          >
            {/* Ambient Shimmer Sweep */}
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-[-20deg] pointer-events-none group-hover:animate-[shimmer_1s_ease-in-out_infinite]" />

            <ShoppingBag className="relative z-10 w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-[-8deg]" />
            <span className="relative z-10 font-extrabold tracking-widest">Bag</span>
            {cartCount > 0 ? (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative z-10 w-4 h-4 rounded-full bg-[#e5b338] text-black text-[10px] font-black flex items-center justify-center shadow-sm"
              >
                {cartCount}
              </motion.span>
            ) : null}
          </motion.button>
        </div>

      </div>
    </motion.header>
  );
};
