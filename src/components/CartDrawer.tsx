import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Lock, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  appliedPromo: string | null;
  discountPercentage: number;
  onApplyPromo: (code: string) => boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedPromo,
  discountPercentage,
  onApplyPromo
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const subtotal = items.reduce((acc, item) => {
    const itemBase = item.product.price;
    const itemPers = item.personalization?.enabled ? 4.0 : 0;
    return acc + (itemBase + itemPers) * item.quantity;
  }, 0);

  const discountAmount = (subtotal * discountPercentage) / 100;
  const finalSubtotal = subtotal - discountAmount;

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    if (!promoInput.trim()) return;

    const ok = onApplyPromo(promoInput.trim());
    if (ok) {
      setPromoSuccess(`Applied! ${promoInput.toUpperCase()} discount active`);
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code. Try OCI10');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111114] border-l border-zinc-800 text-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-base font-['Outfit']">
                Matchday Bag
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black text-[11px] font-black">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
                <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-800">
                  <Tag className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Your Match Bag is Empty</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Gear up with gloves engineered for high Gaelic ball command.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 px-5 py-2.5 rounded-lg bg-[#d4af37] text-black font-extrabold text-xs uppercase tracking-wider"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemTotal = (item.product.price + (item.personalization?.enabled ? 4.0 : 0)) * item.quantity;
                return (
                  <div
                    key={item.cartItemId}
                    className="flex gap-3.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-700/60 p-1">
                      <img
                        src={item.product.images.front}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1 font-['Outfit']">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.cartItemId)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-zinc-400 mt-0.5 space-y-0.5">
                          <div>Size: <span className="text-zinc-200 font-semibold">{item.selectedSize}</span></div>
                          <div>Cut: <span className="text-zinc-300">{item.selectedCut}</span></div>
                          {item.personalization?.enabled && (
                            <div className="text-[#d4af37] font-semibold text-[10px]">
                              Wrist Print: "{item.personalization.text}" ({item.personalization.color} Foil)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Item Total */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-2 bg-black rounded-md p-1 border border-zinc-800">
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-white">
                          {formatPrice(itemTotal, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Promo Code & Checkout Summary Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 space-y-3">
              
              {/* Promo Code Input */}
              <form onSubmit={handlePromoSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Club / Promo Code (e.g. OCI10)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white uppercase tracking-wider outline-none focus:border-[#d4af37]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white uppercase tracking-wider transition-colors"
                >
                  Apply
                </button>
              </form>

              {promoError && <p className="text-[11px] text-red-400">{promoError}</p>}
              {promoSuccess && <p className="text-[11px] text-emerald-400 font-semibold">{promoSuccess}</p>}
              {appliedPromo && (
                <div className="flex items-center justify-between text-[11px] text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded border border-[#d4af37]/30">
                  <span>Code '{appliedPromo}' ({discountPercentage}% OFF) applied</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-850 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">{formatPrice(subtotal, currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#d4af37] font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tracked Dispatch</span>
                  <span className="text-white font-semibold">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-800">
                  <span className="uppercase">Total Due</span>
                  <span className="text-gold-gradient text-base font-black font-['Outfit']">
                    {formatPrice(finalSubtotal, currency)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="drawer-proceed-to-checkout-btn"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#d4af37]/20"
              >
                <Lock className="w-4 h-4 text-black" />
                <span>Proceed To Secure Checkout</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>256-Bit SSL Encrypted • Irish & UK Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
