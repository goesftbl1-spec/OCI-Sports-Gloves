import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, Bell, Check, Package, ShieldCheck } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  productName = 'OCI Grip Gaelic Gloves'
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      try {
        const existing = JSON.parse(localStorage.getItem('oci_waitlist_emails') || '[]');
        if (!existing.includes(email.trim().toLowerCase())) {
          existing.push(email.trim().toLowerCase());
          localStorage.setItem('oci_waitlist_emails', JSON.stringify(existing));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-white"
        >
          {/* Gold Accent Banner */}
          <div className="h-1.5 bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Badge & Title */}
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#e5b338] text-xs font-black tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-[#e5b338] animate-pulse" />
                <span>Stock Landing Soon • Coming Soon</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white uppercase">
                Gloves Arriving Soon
              </h2>

              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                The first production batch of <span className="text-[#e5b338] font-bold">{productName}</span> is currently being crafted and en route. Checkout and payments are paused until physical stock arrives in our Irish dispatch depot.
              </p>
            </div>

            {/* Feature Cards / Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Inventory Status</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Physical shipment in transit to Dublin</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payments Paused</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Paywall locked to protect customers</p>
                </div>
              </div>
            </div>

            {/* Notification signup form */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              {submitted ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>You're on the priority list! We'll email you the moment stock goes live.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Get Notified The Moment We Launch
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-lg bg-[#e5b338] hover:bg-[#f5df88] text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer text-center"
              >
                Close & Return to Store
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Zero charge until gloves are in stock and ready to dispatch</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
