import React, { useState } from 'react';
import { X, Star, ShieldCheck, Droplets, Check, Ruler, Sparkles } from 'lucide-react';
import { Product, GloveSize, GloveCut, Currency } from '../types';
import { formatPrice } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  currency: Currency;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    size: GloveSize,
    cut: GloveCut,
    personalization?: { enabled: boolean; text: string; color: 'Gold' | 'Silver' | 'White' }
  ) => void;
  onOpenSizingModal: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
  onOpenSizingModal
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<GloveSize>(
    product.sizes.find((s) => s.inStock)?.size || 'Adult M'
  );
  const [selectedCut, setSelectedCut] = useState<GloveCut>(product.cut);
  const [activeImageKey, setActiveImageKey] = useState<'front' | 'back' | 'palm'>('front');
  const [personalize, setPersonalize] = useState(false);
  const [playerNumber, setPlayerNumber] = useState('');
  const [foilColor, setFoilColor] = useState<'Gold' | 'Silver' | 'White'>('Gold');
  const [isAdded, setIsAdded] = useState(false);

  const imagesList = [
    { key: 'front' as const, label: 'Main Product', src: product.images.front },
    ...(product.images.back ? [{ key: 'back' as const, label: 'Product Detail', src: product.images.back }] : []),
    ...(product.images.palm && product.images.palm !== product.images.front && product.images.palm !== product.images.back ? [{ key: 'palm' as const, label: 'Palm Grip', src: product.images.palm }] : [])
  ];

  const handleAdd = () => {
    onAddToCart(
      product,
      selectedSize,
      selectedCut,
      personalize && playerNumber.trim()
        ? { enabled: true, text: playerNumber.trim(), color: foilColor }
        : undefined
    );
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="product-detail-modal"
        className="relative w-full max-w-4xl bg-[#111114] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-white flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          id="close-product-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-700"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Gallery & Zoom Preview */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-[#09090b] flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-zinc-800">
          
          {/* Main Selected Image */}
          <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center p-2 border border-zinc-800/80 shadow-inner group">
            <img
              src={
                activeImageKey === 'back' && product.images.back
                  ? product.images.back
                  : activeImageKey === 'palm' && product.images.palm
                  ? product.images.palm
                  : product.images.front
              }
              alt={product.name}
              className="w-full h-full object-cover object-center rounded-lg transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />

            {product.badge && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest bg-black/85 text-[#d4af37] border border-[#d4af37]/40">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnail Gallery Row */}
          <div className="flex items-center gap-3 mt-4 w-full justify-center">
            {imagesList.map((img) => (
              <button
                key={img.key}
                onClick={() => setActiveImageKey(img.key)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all p-1 bg-zinc-900 ${
                  activeImageKey === img.key
                    ? 'border-[#d4af37] scale-105 shadow-md shadow-[#d4af37]/20'
                    : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover rounded"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>

          {/* Grip Ratings Bar */}
          <div className="w-full mt-6 grid grid-cols-3 gap-2 text-center pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Ball Friction</div>
              <div className="text-sm font-black text-[#d4af37]">{product.gripScore} / 10</div>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Tackiness</div>
              <div className="text-sm font-black text-white">{product.durabilityScore} / 10</div>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Wet Irish Sod</div>
              <div className="text-sm font-black text-sky-400">{product.wetWeatherScore} / 10</div>
            </div>
          </div>

        </div>

        {/* Right: Technical Specs, Customizer & Add To Cart */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          
          <div className="space-y-4">
            {/* Header / Reviews */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex text-[#d4af37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#d4af37]" />
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-300">
                  {product.rating} ({product.reviewCount} Verified Reviews)
                </span>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight font-['Outfit']">
                {product.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {product.subtitle}
              </p>

              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl font-black text-gold-gradient">
                  {formatPrice(product.price, currency)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-zinc-500 line-through">
                    {formatPrice(product.originalPrice, currency)}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  In Stock • Dispatches in 24h
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-300 leading-relaxed">
              {product.description}
            </p>

            {/* Grip Tech Highlights */}
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span><strong>Palm Grip:</strong> {product.palmLatex}</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                <span><strong>Rain Tech:</strong> Activated hydro-suction capillaries for wet leather</span>
              </div>
            </div>

            {/* Cut Selection */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Glove Cut Style:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Negative Cut', 'Hybrid Roll-Negative'] as GloveCut[]).map((cut) => (
                  <button
                    key={cut}
                    onClick={() => setSelectedCut(cut)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold text-left transition-all border ${
                      selectedCut === cut
                        ? 'bg-[#d4af37]/15 border-[#d4af37] text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div>{cut}</div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      {cut === 'Negative Cut' ? 'Snug bio-fit, inside seams' : 'Rolled grip on fingertips'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector with Guide Pop-up Link */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                <span>Select Hand Size:</span>
                <button
                  onClick={onOpenSizingModal}
                  className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Size Calculator</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={!s.inStock}
                    onClick={() => setSelectedSize(s.size)}
                    className={`py-2 text-xs font-black rounded-lg uppercase transition-all ${
                      selectedSize === s.size
                        ? 'bg-[#d4af37] text-black shadow-md'
                        : s.inStock
                        ? 'bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-zinc-500'
                        : 'bg-zinc-950 text-zinc-600 line-through cursor-not-allowed border border-zinc-900'
                    }`}
                  >
                    {s.size.replace('Adult ', '').replace('Youth ', 'Y-')}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Personalization (Player Number / Club Initials) */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={(e) => setPersonalize(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d4af37] bg-zinc-900 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  Add Custom Wrist Print (+€4.00)
                </span>
              </label>

              {personalize && (
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2.5 animate-in fade-in">
                  <div className="text-[11px] text-zinc-400">
                    Enter player jersey number (e.g. "14") or initials (max 4 chars):
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 14 or D.O"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value.toUpperCase())}
                      className="px-3 py-1.5 rounded bg-black border border-zinc-700 text-white font-black text-sm uppercase tracking-widest w-32 focus:border-[#d4af37] outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      {(['Gold', 'Silver', 'White'] as const).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setFoilColor(col)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            foilColor === col
                              ? 'bg-zinc-800 text-white border border-[#d4af37]'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {col} Print
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Add to Cart CTA Button */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button
              id="modal-add-to-cart-btn"
              onClick={handleAdd}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                isAdded
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black hover:brightness-110 shadow-[#d4af37]/20'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added To Matchday Bag!</span>
                </>
              ) : (
                <>
                  <span>Add To Bag — {formatPrice(product.price + (personalize && playerNumber ? 4 : 0), currency)}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
