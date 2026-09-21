import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onShopNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-black overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/85" />
      </div>

      {/* Warm Golden Glow behind top-left of the headline */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-[75%] -translate-y-1/2 w-[350px] sm:w-[500px] h-[300px] sm:h-[400px] rounded-full pointer-events-none blur-[100px] z-[1]"
        style={{ background: 'radial-gradient(circle, #e5b338 0%, rgba(229, 179, 56, 0) 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Main Headline with O - C - I Gold Accents */}
        <motion.h1 
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[82px] font-black text-white tracking-tight leading-[1.08] font-['Outfit'] select-none text-center"
        >
          <span className="text-[#e5b338]">O</span>wn.{' '}
          <span className="text-[#e5b338]">C</span>ontrol.{' '}
          <span className="text-[#e5b338]">I</span>mpress.
        </motion.h1>

        {/* Subtitle with OCI Gold and Underline on Built To Last */}
        <motion.p 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-base sm:text-lg md:text-xl text-zinc-300 font-normal max-w-2xl leading-relaxed"
        >
          Any Condition. Rain. Muck. Snow. We Have You Covered.{' '}
          <span className="text-[#e5b338] font-semibold">OCI</span> Sport Gloves Are{' '}
          <span className="underline decoration-zinc-400 decoration-1 underline-offset-4 text-white font-medium">
            Built To Last
          </span>
          .
        </motion.p>

        {/* Glowing Pill Button with Slow Looping Scaling Animation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 sm:mt-12 relative group"
        >
          {/* Subtle under-glow synchronized with loop */}
          <motion.div 
            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-white blur-xl" 
          />
          
          <motion.button
            id="hero-shop-now-btn"
            onClick={onShopNow}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden px-10 sm:px-12 py-4 rounded-full bg-white text-black font-extrabold text-sm sm:text-base tracking-widest uppercase transition-shadow duration-300 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] flex items-center gap-3 cursor-pointer"
          >
            {/* Glare sweep loop animation */}
            <motion.div
              className="absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-amber-200/50 via-white/80 to-transparent skew-x-[-25deg] pointer-events-none"
              animate={{ x: ['-150%', '350%'] }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut',
                repeatDelay: 1.2
              }}
            />
            <span className="relative z-10">SHOP NOW</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1 stroke-[2.5]" />
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
};
