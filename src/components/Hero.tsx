import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface HeroProps {
  onShopNow: () => void;
  onViewReviews?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow, onViewReviews }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Dynamic interactive mouse spotlight tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 25, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const glowTranslateX = useTransform(smoothX, [-0.5, 0.5], ['-30%', '30%']);
  const glowTranslateY = useTransform(smoothY, [-0.5, 0.5], ['-30%', '30%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onShopNow();
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Safe fallback if browser requires interaction
      });
    }
  }, []);

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Subtle floating ember specs for championship stadium atmosphere
  const embers = [
    { id: 1, left: '15%', bottom: '20%', size: '4px', duration: 4.2, delay: 0 },
    { id: 2, left: '28%', bottom: '15%', size: '3px', duration: 5.1, delay: 1.2 },
    { id: 3, left: '48%', bottom: '25%', size: '5px', duration: 4.8, delay: 0.5 },
    { id: 4, left: '72%', bottom: '18%', size: '4px', duration: 5.5, delay: 2.1 },
    { id: 5, left: '84%', bottom: '22%', size: '3px', duration: 4.4, delay: 0.8 },
  ];

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-black overflow-hidden"
    >
      {/* Full-Screen Video Background covering entire hero section */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={handleEnded}
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle dark gradient overlay to guarantee text and buttons remain crisp and legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/90" />
      </div>

      {/* Floating Stadium Embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        {embers.map((ember) => (
          <motion.div
            key={ember.id}
            className="absolute rounded-full"
            style={{
              left: ember.left,
              bottom: ember.bottom,
              width: ember.size,
              height: ember.size,
              background: 'radial-gradient(circle, rgba(229,179,56,0.9) 0%, rgba(229,179,56,0) 70%)',
            }}
            animate={{
              y: [-10, -120],
              opacity: [0, 0.75, 0],
              scale: [0.7, 1.2, 0.5],
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Dynamic Interactive Stage Spotlight following mouse coordinates */}
      <motion.div 
        style={{
          x: glowTranslateX,
          y: glowTranslateY,
          background: 'radial-gradient(circle, rgba(229, 179, 56, 0.38) 0%, rgba(229, 179, 56, 0.12) 45%, rgba(0, 0, 0, 0) 75%)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[680px] h-[340px] sm:h-[500px] rounded-full pointer-events-none blur-[90px] z-[2]"
      />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center select-none">
        {/* Main Headline with Kinetic Staggered Words */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black text-white tracking-tight leading-[1.05] font-['Outfit'] select-none text-center flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-5">
          {/* Word 1: Own. */}
          <motion.span
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.92 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block cursor-default"
          >
            <span className="text-gold-animated inline-block">O</span>
            <span>wn.</span>
          </motion.span>

          {/* Word 2: Control. */}
          <motion.span
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.92 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block cursor-default"
          >
            <span className="text-gold-animated inline-block">C</span>
            <span>ontrol.</span>
          </motion.span>

          {/* Word 3: Impress. */}
          <motion.span
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.92 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.7, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block cursor-default"
          >
            <span className="text-gold-animated inline-block">I</span>
            <span>mpress.</span>
          </motion.span>
        </h1>

        {/* Subtitle with Tactile Glowing Underline */}
        <motion.p 
          initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-base sm:text-lg md:text-xl text-zinc-300 font-normal max-w-2xl leading-relaxed text-center"
        >
          Any Condition. Rain. Muck. Snow. We Have You Covered.{' '}
          <span className="text-[#e5b338] font-bold tracking-wide">OCI</span> Sport Gloves Are{' '}
          <span className="relative inline-block text-white font-semibold">
            Built To Last
            {/* Animated liquid-gold underline glow */}
            <motion.span 
              className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e5b338]/20 via-[#e5b338] to-[#e5b338]/20 rounded-full"
              animate={{ opacity: [0.65, 1, 0.65], scaleX: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
          .
        </motion.p>

        {/* Centered 4.7 ⭐️ (14) Rating Button */}
        <motion.button
          type="button"
          onClick={onViewReviews || onShopNow}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}
          whileTap={{ scale: 0.96 }}
          className="mt-5 flex items-center justify-center gap-1.5 text-xs text-zinc-400 select-none cursor-pointer mx-auto hover:text-zinc-200 transition-colors"
          title="4.7 rating based on 14 match reviews"
        >
          <div className="flex text-[#e5b338] gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-[#e5b338] stroke-none drop-shadow-[0_0_6px_rgba(229,179,56,0.6)]" />
            ))}
          </div>
          <span className="font-extrabold text-white text-xs tracking-tight">4.7</span>
          <span className="text-zinc-400">(14)</span>
        </motion.button>

        {/* PRIMARY ACTION: Centered "SHOP NOW" Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-10 flex items-center justify-center w-full z-20"
        >
          <div className="relative group mx-auto">
            {/* Subtle soft white under-glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.06, 1], 
                opacity: [0.25, 0.45, 0.25] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-white blur-xl pointer-events-none transition-all duration-300" 
            />

            {/* Direct Clickable Button Element with 100% Reliable Hit-Testing */}
            <motion.button
              id="hero-shop-now-btn"
              type="button"
              onClick={handleButtonClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              className="relative overflow-hidden px-10 sm:px-12 py-4 rounded-full bg-white text-black font-black text-sm sm:text-base tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:shadow-[0_0_45px_rgba(255,255,255,0.65)] flex items-center gap-3 cursor-pointer select-none touch-manipulation z-10"
            >
              {/* Clean Diagonal Specular Prism Glare Sweep */}
              <motion.div
                className="absolute -inset-y-6 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-28deg] pointer-events-none"
                animate={{ x: ['-200%', '350%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  ease: [0.16, 1, 0.3, 1],
                  repeatDelay: 1.6
                }}
              />

              <span className="relative z-10 font-black tracking-widest text-black">SHOP NOW</span>
              
              {/* Forward Slingshot Arrow on Hover */}
              <div className="relative z-10 w-4 h-4 flex items-center justify-center overflow-visible pointer-events-none">
                <ArrowRight className="w-4 h-4 stroke-[3] text-black transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </motion.button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

