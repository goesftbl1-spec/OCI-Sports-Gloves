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
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center cursor-pointer group select-none py-1"
          title="Reload page"
          aria-label="Reload page"
        >
          <img
            src={ociLogo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="h-10 sm:h-12 w-auto object-contain transition-all group-hover:brightness-125"
          />
        </motion.button>

        {/* Right Side: Only Bag Left */}
        <div className="flex items-center">
          <motion.button
            id="nav-cart-btn"
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Bag</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#e5b338] text-black text-[10px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </motion.button>
        </div>

      </div>
    </motion.header>
  );
};
