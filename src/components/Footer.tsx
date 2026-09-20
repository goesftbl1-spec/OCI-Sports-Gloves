import React, { useState } from 'react';
import { ShieldCheck, Mail, ArrowRight, Check } from 'lucide-react';

interface FooterProps {
  onOpenSizingModal: () => void;
  onOpenChat: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSizingModal, onOpenChat }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-black border-t border-zinc-800/90 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter / Club Discount Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-[#d4af37]/30 mb-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-md">
            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">
              GAA Locker Room Access
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-['Outfit'] mt-0.5">
              GET 10% OFF YOUR FIRST PAIR
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Join 8,000+ Gaelic Footballers receiving championship drop alerts, gear care guides, and team discounts.
            </p>
          </div>

          <form onSubmit={handleNewsletter} className="flex-1 max-w-md flex gap-2">
            {subscribed ? (
              <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>You're in! Use code OCI10 at checkout.</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f5df88] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Join
                </button>
              </>
            )}
          </form>
        </div>

        {/* 4 Column Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-850">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-zinc-900 border border-[#d4af37] flex items-center justify-center font-extrabold text-xs text-gold-gradient">
                OCI
              </div>
              <span className="text-lg font-black tracking-widest text-white uppercase font-['Outfit']">
                OCI <span className="text-gold-gradient">SPORTS</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dedicated exclusively to Gaelic Football gloves. Crafted with all-weather contact grip for match-winning command across Irish sod.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>Designed & Dispatched in Ireland</span>
            </div>
          </div>

          {/* Links: Gaelic Gloves */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3 font-['Outfit']">
              Gloves Series
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#collection" className="hover:text-[#d4af37] transition-colors">Apex Gold Championship Pro</a></li>
              <li><a href="#collection" className="hover:text-[#d4af37] transition-colors">Stealth Silver All-Weather</a></li>
              <li><a href="#collection" className="hover:text-[#d4af37] transition-colors">Pure Whiteout Matchday Edition</a></li>
              <li><a href="#collection" className="hover:text-[#d4af37] transition-colors">Stealth Blackout Pro Edition</a></li>
              <li><a href="#collection" className="hover:text-[#d4af37] transition-colors">Underage / Youth GAA Gloves</a></li>
            </ul>
          </div>

          {/* Links: Tools & Tech */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3 font-['Outfit']">
              Player Equipment
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button onClick={onOpenSizingModal} className="hover:text-[#d4af37] transition-colors cursor-pointer text-left">
                  Hand Sizing Calculator
                </button>
              </li>
              <li><a href="#grip-tech" className="hover:text-[#d4af37] transition-colors">Grip Technology</a></li>
              <li><a href="#reviews" className="hover:text-[#d4af37] transition-colors">Club Player Reviews</a></li>
              <li><a href="#care-faq" className="hover:text-[#d4af37] transition-colors">Glove Washing & Longevity</a></li>
              <li>
                <button onClick={onOpenChat} className="hover:text-[#d4af37] transition-colors cursor-pointer text-left">
                  Live Gear Specialist Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Delivery & GAA Clubs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3 font-['Outfit']">
              GAA Clubs & Logistics
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><span className="text-zinc-200">Ireland:</span> An Post & DPD 24h Express</li>
              <li><span className="text-zinc-200">UK & Worldwide:</span> Tracked Air Express</li>
              <li><span className="text-[#d4af37] font-semibold">Club Code:</span> GAACLUB20 (20% Off 10+ Pairs)</li>
              <li><span className="text-zinc-200">Support:</span> support@ocisports.ie</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Badges & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 font-semibold">Accepted:</span>
            <span className="font-mono text-zinc-400">VISA • Mastercard • Apple Pay • Revolut</span>
          </div>
          <div>
            © {new Date().getFullYear()} OCI Sports Ltd. Engineered for Gaelic Football. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};
