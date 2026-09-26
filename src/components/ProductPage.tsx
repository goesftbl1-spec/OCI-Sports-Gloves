import React, { useState, useEffect } from 'react';
import { Product, GloveSize, Currency, Review } from '../types';
import { formatPrice } from '../utils/formatters';
import { 
  Star, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Ruler, 
  ChevronLeft,
  ChevronRight,
  Tag,
  Sparkles,
  Percent,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductPageProps {
  product: Product;
  currency: Currency;
  onBackToHome: () => void;
  onAddToCart?: (product: Product, size: GloveSize, quantity: number) => void;
  onOpenSizingModal: () => void;
  onBuyNow: (product: Product, size: GloveSize, quantity: number) => void;
  reviews?: Review[];
  onAddReview?: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => void;
  appliedPromo?: string | null;
  discountPercentage?: number;
  onApplyPromo?: (code: string) => boolean;
  onRemovePromo?: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  currency,
  onBackToHome,
  onOpenSizingModal,
  onBuyNow,
  appliedPromo,
  discountPercentage = 0,
  onApplyPromo,
  onRemovePromo
}) => {
  const [selectedSize, setSelectedSize] = useState<GloveSize>('M');
  const [quantity, setQuantity] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Discount code entry state
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);

  // Notification popup state ("5% off? Use “OCI5” for 5% off!")
  const [showDiscountToast, setShowDiscountToast] = useState(false);
  const [hasDismissedToast, setHasDismissedToast] = useState(false);

  // Trigger popup when entering/visiting the product page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!appliedPromo && !hasDismissedToast) {
        setShowDiscountToast(true);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [appliedPromo, hasDismissedToast]);

  // Exit-intent trigger
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !appliedPromo && !hasDismissedToast) {
        setShowDiscountToast(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [appliedPromo, hasDismissedToast]);

  // Editing triggers: when the user edits options (size, quantity) on the product page
  const handleSelectSize = (sz: GloveSize) => {
    setSelectedSize(sz);
    if (!appliedPromo && !hasDismissedToast) {
      setShowDiscountToast(true);
    }
  };

  const handleUpdateQuantity = (newQty: number) => {
    setQuantity(newQty);
    if (!appliedPromo && !hasDismissedToast) {
      setShowDiscountToast(true);
    }
  };

  // Live discount calculations
  const basePrice = product.price || 14.99;
  const isDiscounted = discountPercentage > 0;
  const discountedUnitPrice = isDiscounted
    ? Number((basePrice * (1 - discountPercentage / 100)).toFixed(2))
    : basePrice;
  const originalComparePrice = 20.00;

  // Touch and drag swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  // Image list for swipe carousel
  const imageList = [
    { id: 'pair', label: 'Full Pair', src: product.images.front },
    ...(product.images.back ? [{ id: 'detail', label: 'Logo Detail', src: product.images.back }] : [])
  ];

  // Safeguard current slide index
  const safeSlideIndex = currentSlide < imageList.length ? currentSlide : 0;
  const currentImg = imageList[safeSlideIndex];

  const handleNextSlide = () => {
    if (safeSlideIndex < imageList.length - 1) {
      setSlideDirection(1);
      setCurrentSlide(safeSlideIndex + 1);
    } else {
      setSlideDirection(1);
      setCurrentSlide(0);
    }
  };

  const handlePrevSlide = () => {
    if (safeSlideIndex > 0) {
      setSlideDirection(-1);
      setCurrentSlide(safeSlideIndex - 1);
    } else {
      setSlideDirection(-1);
      setCurrentSlide(imageList.length - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -35) {
      handleNextSlide();
    } else if (deltaX > 35) {
      handlePrevSlide();
    }
    setTouchStartX(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX === null) return;
    const deltaX = e.clientX - mouseStartX;
    if (deltaX < -45) {
      handleNextSlide();
    } else if (deltaX > 45) {
      handlePrevSlide();
    }
    setMouseStartX(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-8 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Status Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-2.5"
        >
          <button
            id="back-to-home-btn"
            onClick={onBackToHome}
            className="group flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              Limited Stock
            </span>
          </div>
        </motion.div>

        {/* Main Product Layout (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Swipeable Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2.5"
          >
            {/* Primary Swipeable Stage */}
            <div
              className="relative aspect-square max-h-[340px] sm:max-h-[380px] w-full rounded-xl bg-zinc-950 border border-zinc-850 overflow-hidden select-none transition-colors group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => { setIsZoomed(false); setMouseStartX(null); }}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {/* Animated Carousel Image Transition */}
              <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
                <motion.img
                  key={currentImg.id}
                  src={currentImg.src}
                  alt={currentImg.label}
                  referrerPolicy="no-referrer"
                  custom={slideDirection}
                  initial={{ opacity: 0, x: slideDirection * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 40 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className={`w-full h-full object-contain p-4 transition-transform duration-200 cursor-grab active:cursor-grabbing ${
                    isZoomed ? 'scale-135' : 'scale-100 group-hover:scale-102'
                  }`}
                  style={
                    isZoomed
                      ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                      : undefined
                  }
                  draggable={false}
                />
              </AnimatePresence>

              {/* View label badge */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-800">
                {currentImg.label}
              </div>

              {/* Arrow navigation hints (desktop click / visual guidance) */}
              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    aria-label="Previous view"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    aria-label="Next view"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Swipe Indicators & Dots (No buttons, clean swipe pagination) */}
            {imageList.length > 1 && (
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  {imageList.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setSlideDirection(idx > safeSlideIndex ? 1 : -1);
                        setCurrentSlide(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        safeSlideIndex === idx ? 'w-6 bg-[#e5b338]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      aria-label={`Switch to ${img.label}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 text-center tracking-wider uppercase">
                  ← Swipe →
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Column: Minimalist Product Details & Purchase Form */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5"
          >
            
            {/* Title & Price */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-1 text-xs">
                <div className="flex items-center gap-1 text-zinc-400">
                  <div className="flex text-[#e5b338]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#e5b338]" />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium">{product.rating} (14)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-['Outfit']">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="mt-1.5 flex flex-wrap items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  {formatPrice(discountedUnitPrice * quantity, currency)}
                </span>
                {isDiscounted ? (
                  <>
                    <span className="text-base text-zinc-500 line-through font-normal">
                      {formatPrice(basePrice * quantity, currency)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#e5b338]/15 border border-[#e5b338]/40 text-[#e5b338] text-xs font-black uppercase tracking-wider">
                      {appliedPromo} • {discountPercentage}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-base text-zinc-500 line-through font-normal">
                    {formatPrice(originalComparePrice * quantity, currency)}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Size Selector */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
                  Size: <span className="text-white font-black">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenSizingModal}
                  className="text-[11px] text-[#e5b338] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['S', 'M', 'L'] as GloveSize[]).map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <motion.button
                      key={sz}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectSize(sz)}
                      className={`py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#e5b338] text-black border-[#e5b338]'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      {sz}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Quantity Stepper & Buy Now Section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-3 pt-1"
            >
              {/* Stepper placed above the Buy Now button */}
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
                  Quantity
                </span>
                <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-zinc-850"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xs text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(quantity + 1)}
                    className="w-8 h-8 rounded text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-zinc-850"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Enter Discount Section */}
              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <Tag className="w-3.5 h-3.5 text-[#e5b338]" />
                    <span>Enter Discount</span>
                  </div>
                  {appliedPromo && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#e5b338] bg-[#e5b338]/15 px-2 py-0.5 rounded border border-[#e5b338]/30">
                      {appliedPromo} Active
                    </span>
                  )}
                </div>

                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#e5b338]/10 border border-[#e5b338]/30 text-xs">
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle className="w-4 h-4 text-[#e5b338] shrink-0" />
                      <div>
                        <div className="font-extrabold text-[#e5b338]">
                          {appliedPromo === 'EDITOR15' ? 'Secret Code EDITOR15 Unlocked (15% OFF) 🎉' : `Code ${appliedPromo} (${discountPercentage}% OFF)`}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Saving {formatPrice((basePrice * (discountPercentage / 100)) * quantity, currency)} on your gloves
                        </div>
                      </div>
                    </div>
                    {onRemovePromo && (
                      <button
                        type="button"
                        onClick={() => {
                          onRemovePromo();
                          setDiscountSuccess(null);
                        }}
                        className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer ml-2 shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setDiscountError(null);
                        setDiscountSuccess(null);
                        if (!discountInput.trim()) return;
                        if (onApplyPromo) {
                          const code = discountInput.trim().toUpperCase();
                          const ok = onApplyPromo(code);
                          if (ok) {
                            if (code === 'EDITOR15') {
                              setDiscountSuccess('Secret code unlocked! 15% off applied!');
                            } else {
                              setDiscountSuccess(`Applied! ${code} discount active`);
                            }
                            setDiscountInput('');
                          } else {
                            setDiscountError('Invalid code. Enter a valid discount code or try OCI5');
                          }
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => {
                          setDiscountInput(e.target.value.toUpperCase());
                          setDiscountError(null);
                        }}
                        placeholder="e.g. OCI5"
                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white placeholder-zinc-500 uppercase tracking-wider outline-none focus:border-[#e5b338] transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-[#e5b338] hover:text-black text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </form>

                    {discountError && (
                      <p className="text-[11px] text-red-400 font-medium">{discountError}</p>
                    )}
                    {discountSuccess && (
                      <p className="text-[11px] text-emerald-400 font-medium">{discountSuccess}</p>
                    )}

                    {/* Only OCI5 is visible */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active code:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyPromo) {
                            onApplyPromo('OCI5');
                            setDiscountSuccess('5% discount applied with code OCI5!');
                          }
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 hover:bg-[#e5b338]/20 text-[#e5b338] border border-zinc-700 hover:border-[#e5b338] transition-all cursor-pointer flex items-center gap-1"
                        title="Click to apply 5% off"
                      >
                        <Percent className="w-2.5 h-2.5" />
                        <span>OCI5 (5% OFF)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Buy Now Button without 14.99 price inside */}
              <motion.button
                id="buy-now-btn"
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onBuyNow(product, selectedSize, quantity)}
                className="relative overflow-hidden w-full py-3 px-4 rounded-lg bg-[#e5b338] hover:bg-[#f5df88] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg text-center"
              >
                {/* Glare sweep loop animation */}
                <motion.div
                  className="absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-25deg] pointer-events-none"
                  animate={{ x: ['-150%', '350%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: 'easeInOut',
                    repeatDelay: 1.2
                  }}
                />
                <span className="relative z-10">BUY NOW</span>
                <ArrowRight className="relative z-10 w-4 h-4" />
              </motion.button>
            </motion.div>

          </motion.div>

        </div>

      </div>

      {/* Floating Notification Pop-up when viewing/editing the product page */}
      <AnimatePresence>
        {showDiscountToast && !appliedPromo && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-md border-2 border-[#e5b338] shadow-[0_12px_40px_rgba(229,179,56,0.35)] text-white"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e5b338]/20 border border-[#e5b338] flex items-center justify-center text-[#e5b338] shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#e5b338]">
                    Special Gaelic Offer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountToast(false);
                      setHasDismissedToast(true);
                    }}
                    className="text-zinc-400 hover:text-white p-0.5 cursor-pointer rounded hover:bg-zinc-800 transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-white mt-1 leading-snug">
                  5% off? Use “OCI5” for 5% off!
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyPromo) {
                        onApplyPromo('OCI5');
                      }
                      setShowDiscountToast(false);
                      setHasDismissedToast(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#e5b338] hover:bg-[#f5df88] text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Tag className="w-3 h-3" />
                    <span>Apply “OCI5”</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountToast(false);
                      setHasDismissedToast(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
