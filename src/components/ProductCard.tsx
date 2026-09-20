import React, { useState } from 'react';
import { Star, Eye, Plus, Check, ShieldAlert } from 'lucide-react';
import { Product, GloveSize, Currency } from '../types';
import { formatPrice } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, size: GloveSize) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onQuickView,
  onAddToCart
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<GloveSize>(
    product.sizes.find((s) => s.inStock)?.size || 'Adult M'
  );
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1800);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#111114] rounded-xl border border-zinc-800/90 hover:border-[#d4af37]/60 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/70"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {product.badge && (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-black/85 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/40 shadow-sm">
            {product.badge}
          </span>
        )}
        <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-700">
          {product.cut}
        </span>
      </div>

      {/* Product Image Stage with Smooth Hover Effects & Zoom */}
      <div 
        onClick={() => onQuickView(product)}
        className="relative w-full aspect-square bg-[#09090b] overflow-hidden cursor-pointer flex items-center justify-center p-3 sm:p-4"
      >
        {/* Shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

        {/* Primary Product Image with smooth hover scale and sheen */}
        <img
          src={isHovered && product.images.back ? product.images.back : product.images.front}
          alt={product.name}
          className="w-full h-full object-cover object-center rounded-lg transition-all duration-500 ease-out group-hover:scale-108 group-hover:brightness-105"
          referrerPolicy="no-referrer"
        />

        {/* Quick View Button Hover Pop-up */}
        <button
          id={`quick-view-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/90 backdrop-blur-md text-white border border-zinc-600 hover:border-[#d4af37] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1.5 shadow-xl hover:text-[#d4af37] z-20"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Quick Inspect</span>
        </button>
      </div>

      {/* Product Details Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-[#111114]">
        
        {/* Title, Rating & Subtitle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            {/* Star Rating */}
            <div className="flex items-center gap-1">
              <div className="flex text-[#d4af37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[#d4af37]" />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">
                ({product.reviewCount})
              </span>
            </div>

            {/* Grip Score Metric */}
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              Grip: {product.gripScore}/10
            </span>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="text-base font-bold text-white uppercase tracking-tight group-hover:text-gold-gradient transition-colors cursor-pointer line-clamp-1 font-['Outfit']"
          >
            {product.name}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
            {product.subtitle}
          </p>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2.5 mt-2.5">
            <span className="text-lg font-black text-white tracking-tight">
              {formatPrice(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-zinc-500 line-through">
                {formatPrice(product.originalPrice, currency)}
              </span>
            )}
            <span className="text-[10px] font-semibold text-emerald-400 uppercase ml-auto">
              In Stock
            </span>
          </div>
        </div>

        {/* Size Selector Pills (Prioritizing Mobile Performance & Speed) */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1.5">
            <span>Size:</span>
            <span className="text-zinc-200 font-bold">{selectedSize}</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {product.sizes.map((s) => (
              <button
                key={s.size}
                id={`size-pill-${product.id}-${s.size.replace(/\s+/g, '-').toLowerCase()}`}
                disabled={!s.inStock}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(s.size);
                }}
                className={`py-1 text-[10px] font-extrabold rounded uppercase transition-all ${
                  selectedSize === s.size
                    ? 'bg-[#d4af37] text-black shadow-sm font-black'
                    : s.inStock
                    ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                    : 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed line-through'
                }`}
                title={s.inStock ? `${s.size} in stock` : `${s.size} sold out`}
              >
                {s.size.replace('Adult ', '').replace('Youth ', 'Y-')}
              </button>
            ))}
          </div>

          {/* Quick Add To Cart Button with Pop-up Confirmation */}
          <button
            id={`quick-add-btn-${product.id}`}
            onClick={handleAddToCart}
            className={`w-full mt-3.5 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              addedSuccess
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-zinc-900 hover:bg-[#d4af37] text-white hover:text-black border border-zinc-700 hover:border-[#d4af37] active:scale-[0.98]'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white animate-bounce" />
                <span>Added to Bag!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pair — {formatPrice(product.price, currency)}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
