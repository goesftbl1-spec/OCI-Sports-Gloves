import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle, ShieldAlert, Droplet } from 'lucide-react';
import { FAQS } from '../data/mockData';

export const GripCareFAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="care-faq" className="py-20 sm:py-28 bg-[#09090b] border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-extrabold uppercase tracking-widest text-[#d4af37] mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#d4af37]" />
            GAA Match Preparation & Care
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-['Outfit']">
            GRIP CARE & <span className="text-silver-gradient">LIFESPAN</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Everything you need to know about preserving all-weather contact grip across long winter league and championship campaigns.
          </p>
        </div>

        {/* 3 Care Ritual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-xl bg-[#111114] border border-zinc-800/80 text-left">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mb-3">
              <Droplet className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-['Outfit']">1. Pre-Activation</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Before your first training session, gently soak the palms in lukewarm water to wash away manufacturing compounds and open the grip pores.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111114] border border-zinc-800/80 text-left">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-300 mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-['Outfit']">2. Matchday Dampening</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              In dry or warm conditions, lightly spray the palms with a water bottle before warm-up. The contact grip generates up to 30% higher friction when moist.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111114] border border-zinc-800/80 text-left">
            <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 mb-3">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-['Outfit']">3. Zero Radiator Rule</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Never dry your OCI gloves on a household radiator or in a tumble dryer. Intense artificial heat will dry out the grip material, causing brittle cracking.
            </p>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#111114] border border-zinc-800 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm uppercase tracking-wide text-white hover:text-[#d4af37] transition-colors"
                >
                  <span className="font-['Outfit']">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#d4af37]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-850 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
