import React, { useState } from 'react';
import { Product, GloveSize, Currency, Review } from '../types';
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
  MessageSquarePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductPageProps {
  product: Product;
  currency: Currency;
  onBackToHome: () => void;
  onAddToCart: (product: Product, size: GloveSize, quantity: number) => void;
  onOpenSizingModal: () => void;
  onBuyNow: (product: Product, size: GloveSize, quantity: number) => void;
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  currency,
  onBackToHome,
  onOpenSizingModal,
  onBuyNow,
  reviews,
  onAddReview
}) => {
  const [selectedSize, setSelectedSize] = useState<GloveSize>('M');
  const [quantity, setQuantity] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Touch and drag swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  // Review form state
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [author, setAuthor] = useState('');
  const [county, setCounty] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

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

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    onAddReview({
      author: author.trim(),
      club: `${county || 'GAA'} Club Player`,
      county: county.trim() || 'Ireland',
      position: 'Forward',
      gloveModel: product.name,
      rating,
      title: 'Verified Gaelic Review',
      comment: comment.trim(),
      verifiedBuyer: true,
      gripRating: rating,
      durabilityRating: 5
    });

    setAuthor('');
    setCounty('');
    setComment('');
    setIsWritingReview(false);
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
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  €14.99
                </span>
                <span className="text-base text-zinc-500 line-through font-normal">
                  €20.00
                </span>
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
                      onClick={() => setSelectedSize(sz)}
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
              className="space-y-2 pt-1"
            >
              {/* Stepper placed above the Buy Now button */}
              <div className="flex items-center justify-start">
                <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-zinc-850"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xs text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-zinc-850"
                  >
                    +
                  </button>
                </div>
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

        {/* Reviews Section: Minimalist & Compact with Load Animation */}
        <motion.section 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          className="mt-10 pt-6 border-t border-zinc-900"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-['Outfit']">
                Player Reviews
              </h2>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsWritingReview(!isWritingReview)}
              className="px-3 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-900 text-[11px] font-semibold text-[#e5b338] border border-zinc-800 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{isWritingReview ? 'Close' : 'Write Review'}</span>
            </motion.button>
          </div>

          {/* Optional Review Form */}
          {isWritingReview && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleReviewSubmit} 
              className="mb-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Seán Kelly)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="px-3 py-1.5 rounded bg-black border border-zinc-750 text-xs text-white focus:border-[#e5b338] outline-none"
                />
                <input
                  type="text"
                  placeholder="County / GAA Club"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="px-3 py-1.5 rounded bg-black border border-zinc-750 text-xs text-white focus:border-[#e5b338] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Rating:</span>
                <div className="flex text-[#e5b338]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${s <= rating ? 'fill-[#e5b338]' : 'text-zinc-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={2}
                placeholder="How did they hold up in training and matches?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-black border border-zinc-750 text-xs text-white focus:border-[#e5b338] outline-none resize-none"
              />

              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#e5b338] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#f5df88] transition-colors cursor-pointer"
              >
                Submit Review
              </button>
            </motion.form>
          )}

          {/* 3 Compact Testimonial Cards with Staggered Entrance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Review 1: Patrick O'Ryan, Louth (5 Stars) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-[#e5b338]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#e5b338]" />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  “Jesus they’re class, no matter how many games i play in them they don’t get damaged. Well worth it.”
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white uppercase font-['Outfit']">Patrick O’Ryan</span>
                <span className="text-[#e5b338] font-semibold">Louth</span>
              </div>
            </motion.div>

            {/* Review 2: Jamie McDaid, Galway (4 Stars) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.62 }}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-[#e5b338]">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#e5b338]" />
                    ))}
                    <Star className="w-3 h-3 text-zinc-700" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  “The gloves are comfortable and they fit good. Had them a while now and they’re good to be fair.”
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white uppercase font-['Outfit']">Jamie McDaid</span>
                <span className="text-[#e5b338] font-semibold">Galway</span>
              </div>
            </motion.div>

            {/* Review 3: John Walsh, Kerry (5 Stars) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.69 }}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-[#e5b338]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#e5b338]" />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  “They look class and feel class, the lads in the dressing room all asked me where i got them from. Great pair of gloves to play with. Worth the money.”
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white uppercase font-['Outfit']">John Walsh</span>
                <span className="text-[#e5b338] font-semibold">Kerry</span>
              </div>
            </motion.div>

          </div>
        </motion.section>

      </div>
    </div>
  );
};
