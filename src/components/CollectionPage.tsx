import React, { useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/formatters';
import { motion } from 'motion/react';
import bothGloveImage from '../assets/images/Both .jpg';

interface CollectionPageProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  onBackToHome: () => void;
  onAddToCart?: (product: Product, size: any, quantity?: number) => void;
  onOpenSizingModal?: () => void;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  products,
  currency,
  onSelectProduct,
  onBackToHome,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-20 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3 border-b border-zinc-900 pb-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-['Outfit']">
              Collection
            </h1>
            <span className="text-xs text-zinc-500 font-mono">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>

        {/* Product Grid (Room for more products later down the line) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-start">
          {products.map((product) => {
            const isHovered = hoveredId === product.id;
            const isFavorite = !!favorites[product.id];

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer flex flex-col w-full max-w-[300px]"
              >
                {/* 1. Square Image Container with Heart Icon at Top-Left */}
                <div className="relative aspect-square w-full rounded-2xl bg-[#0c0c10] border border-zinc-850 group-hover:border-[#e5b338]/60 transition-all duration-300 p-4 sm:p-5 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-[0_0_25px_rgba(229,179,56,0.12)]">
                  
                  {/* Heart / Wishlist Icon at Top-Left (matching screenshot) */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-3.5 left-3.5 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-sm transition-all cursor-pointer group/heart"
                    aria-label="Save to Wishlist"
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform group-hover/heart:scale-110 ${
                        isFavorite
                          ? 'fill-[#e5b338] text-[#e5b338]'
                          : 'text-zinc-300 hover:text-white stroke-[2]'
                      }`}
                    />
                  </button>

                  {/* Product Image Stage (Flips angle on hover) */}
                  <img
                    src={isHovered && product.images.back ? product.images.back : (product.images.front || bothGloveImage)}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-106 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                  />
                </div>

                {/* 2. Product Details Section (Matching Screenshot Layout in OCI Sports Colours) */}
                <div className="pt-4 space-y-2">
                  {/* Title */}
                  <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-[#e5b338] transition-colors font-['Outfit'] leading-snug tracking-tight">
                    {product.name}
                  </h2>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <p className="text-base sm:text-lg font-bold text-zinc-100 font-mono">
                      {formatPrice(product.price, currency)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-xs text-zinc-500 line-through font-mono">
                        {formatPrice(product.originalPrice, currency)}
                      </p>
                    )}
                  </div>

                  {/* SALE Badge in OCI Sports Gold (or SOLD OUT badge if stock is depleted) */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    {product.sizes && product.sizes.every((s) => s.stockCount <= 0) ? (
                      <span className="inline-block px-3 py-1 rounded-sm bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-sm">
                        SOLD OUT
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-sm bg-[#e5b338] text-black font-black text-xs uppercase tracking-wider shadow-sm">
                        SALE
                      </span>
                    )}

                    {product.sizes && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                        {product.sizes.map((s) => (
                          <span
                            key={s.size}
                            className={`px-1.5 py-0.5 rounded ${
                              s.stockCount <= 0
                                ? 'bg-zinc-900 text-zinc-600 line-through'
                                : 'bg-zinc-900/80 text-zinc-300'
                            }`}
                            title={`${s.size}: ${s.stockCount} in stock`}
                          >
                            {s.size}: {s.stockCount <= 0 ? 'Out' : s.stockCount}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
