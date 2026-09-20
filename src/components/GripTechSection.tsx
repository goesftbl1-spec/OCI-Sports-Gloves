import React, { useState } from 'react';
import { Shield, Droplets, Zap, Wind, Award, ArrowUpRight } from 'lucide-react';
import gloveGoldImg from '../assets/images/oci_glove_gold_1789861271872.jpg';
import gloveSilverImg from '../assets/images/oci_glove_silver_1789861283469.jpg';

export const GripTechSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'latex' | 'hydro' | 'cuff' | 'cut'>('latex');

  const techHighlights = {
    latex: {
      title: 'High-Contact All-Weather Palm Grip',
      subtitle: 'Molecular adhesion formula tuned specifically for the O\'Neills size 5 match ball leather.',
      description: 'Standard Gaelic gloves rely on budget synthetic foam that loses tackiness after three rain sessions. OCI features premium all-weather contact grip delivering unmatched high-ball friction even when sodden.',
      specs: [
        'Open-cell micro-vacuum surface adhesion',
        'Shock-absorbing 3mm underlying memory cushion protects fingers on rockets',
        'Zero greasy residue transferred to ball surface'
      ]
    },
    hydro: {
      title: 'Hydro-Channel Moisture Dispersion',
      subtitle: 'Engineered for typical Irish county conditions: boggy pitches, freezing rain, and summer dew.',
      description: 'Laser-etched micro-channels across the palm direct standing water outward away from the primary contact zone. The wetter the ball gets, the more the capillary pores engage, turning slippery leather into an absolute lock.',
      specs: [
        'Hydrophobic backing blocks dampness from penetrating into fingers',
        'Pre-activated grip compound increases tackiness upon contact with water',
        'Optimal performance in rain, sleet, or heavy evening condensation'
      ]
    },
    cuff: {
      title: '360° Neoprene Wrist Lockdown',
      subtitle: 'Eliminates glove twisting when contested in mid-air or tackling in the tackle box.',
      description: 'Dual-elastic wrap band features industrial hook-and-loop fastening anchored by our brushed gold or silver pull-tab. Provides deep wrist support without restricting wrist-flick passing or free-taking follow-through.',
      specs: [
        'Anatomical curved contour hugs the carpal bones',
        'Quick-release pull tab for rapid wet-glove removal',
        'Optional personalized laser print for player number / club crest'
      ]
    },
    cut: {
      title: 'Negative Bio-Fit Seam Construction',
      subtitle: 'Inward hand-stitching eliminates excessive finger bunching and fabric spin.',
      description: 'By stitching the seams inside the glove body, the material wraps precisely against each finger contour. The result is a true second-skin sensation giving you pinpoint feel for point-taking, hand-passing, and high catching.',
      specs: [
        'Zero excess fabric between fingers',
        'Roll-over thumb wrap expands catching surface area',
        'Pre-curved ergonomic finger posture reduces muscle fatigue'
      ]
    }
  };

  const current = techHighlights[activeTab];

  return (
    <section id="grip-tech" className="py-20 sm:py-28 bg-[#09090b] border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-extrabold uppercase tracking-widest text-[#d4af37] mb-3">
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            GAA Engineering Blueprint
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-['Outfit']">
            PRO GRIP. <span className="text-gold-gradient">IRISH WEATHER.</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-3 max-w-xl mx-auto">
            Gaelic Football demands hand gear that survives ferocious physical tackles, high-velocity ball impacts, and driving rain. Here is how OCI outperforms standard gloves.
          </p>
        </div>

        {/* Tech Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto mb-12">
          {[
            { id: 'latex' as const, label: 'All-Weather Grip', icon: Shield },
            { id: 'hydro' as const, label: 'Hydro-Channels', icon: Droplets },
            { id: 'cuff' as const, label: 'Wrist Lock', icon: Zap },
            { id: 'cut' as const, label: 'Bio-Fit Cut', icon: Wind }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tech-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  active
                    ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 text-[#d4af37] border-[#d4af37] shadow-lg shadow-[#d4af37]/10'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#d4af37]' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tech Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#111114] border border-zinc-800/90 rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {/* Left: Interactive Diagram / Visual */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black/60 border border-zinc-700/80 p-3 shadow-inner group">
              <img
                src={activeTab === 'hydro' ? gloveSilverImg : gloveGoldImg}
                alt={current.title}
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              
              {/* Highlight Overlay Label */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-black/85 backdrop-blur-md border border-[#d4af37]/50 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider block">Inspecting Spec</span>
                  <span className="font-extrabold text-white">{current.title}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
          </div>

          {/* Right: Technical Explanation */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div>
              <span className="text-xs font-extrabold tracking-widest text-[#d4af37] uppercase">
                OCI Spec Performance
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-['Outfit'] mt-1">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-1">
                {current.subtitle}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {current.description}
            </p>

            {/* Bullet Points */}
            <div className="space-y-2.5 pt-2">
              {current.specs.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-[#d4af37]">{idx + 1}</span>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Micro comparison stat */}
            <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Ball Friction Coefficient</div>
                <div className="text-base font-black text-[#d4af37]">0.92 µ (Industry High)</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Expected Matchday Span</div>
                <div className="text-base font-black text-white">Full County Season</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
