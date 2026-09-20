import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CreditCard, CheckCircle, ArrowRight, Truck, Printer, Sparkles, ExternalLink } from 'lucide-react';
import { CartItem, Currency, ShippingDetails, Order } from '../types';
import { formatPrice } from '../utils/formatters';

const PAYPAL_HANDLE = 'goesftbl';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  discountPercentage: number;
  appliedPromo: string | null;
  onOrderCompleted: (order: Order) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  discountPercentage,
  appliedPromo,
  onOrderCompleted,
  onClearCart
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmed'>('shipping');

  // Form states
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    county: 'Dublin',
    eircodePostcode: '',
    country: 'Ireland',
    deliveryNote: ''
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'dpd_express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const itemBase = item.product.price;
    const itemPers = item.personalization?.enabled ? 4.0 : 0;
    return acc + (itemBase + itemPers) * item.quantity;
  }, 0);

  const discountAmount = (subtotal * discountPercentage) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  
  const standardShippingCost = 3.99;
  const expressShippingCost = 6.99;
  const shippingCost = shippingMethod === 'standard' ? standardShippingCost : expressShippingCost;
  const grandTotal = discountedSubtotal + shippingCost;

  const paypalPaymentUrl = `https://paypal.me/${PAYPAL_HANDLE}/${grandTotal.toFixed(2)}${currency}`;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingDetails.fullName || !shippingDetails.email || !shippingDetails.addressLine1) return;
    setStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const randomOrderId = `OCI-GAA-${Math.floor(10000 + Math.random() * 90000)}`;

    // If user selects PayPal, open the PayPal payment link in a new tab
    if (paymentMethod === 'paypal') {
      try {
        window.open(paypalPaymentUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback handled on confirmed screen
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      const order: Order = {
        orderId: randomOrderId,
        createdAt: new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [...items],
        subtotal,
        discountAmount,
        shippingCost,
        total: grandTotal,
        currency,
        shippingDetails,
        deliveryMethod: shippingMethod === 'standard' ? 'An Post Tracked (1-2 days)' : 'DPD GAA Matchday 24h Express',
        paymentMethod
      };

      setConfirmedOrder(order);
      onOrderCompleted(order);
      onClearCart();
      setStep('confirmed');
    }, 1200);
  };

  // Card number input formatter
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="checkout-modal-container"
        className="relative w-full max-w-2xl bg-[#111114] border border-zinc-700/90 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight font-['Outfit'] flex items-center gap-2">
                <span>OCI Secure Checkout</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  256-Bit SSL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Official GAA Equipment Dispatch • Dublin Warehouse
              </p>
            </div>
          </div>

          {step !== 'confirmed' && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'confirmed' && (
          <div className="flex items-center justify-between mb-6 px-2 text-xs font-bold uppercase tracking-wider">
            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-[#d4af37]' : 'text-zinc-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step === 'shipping' ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>
                1
              </div>
              <span>Shipping</span>
            </div>

            <div className="flex-1 h-[1px] bg-zinc-800 mx-3" />

            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-[#d4af37]' : 'text-zinc-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step === 'payment' ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>
                2
              </div>
              <span>Payment</span>
            </div>
          </div>
        )}

        {/* STEP 1: SHIPPING DETAILS */}
        {step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Clifford"
                  value={shippingDetails.fullName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Email Address (For Tracking) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gaa.ie"
                  value={shippingDetails.email}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Mobile Number (DPD SMS Updates) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="087 123 4567"
                  value={shippingDetails.phone}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Country
                </label>
                <select
                  value={shippingDetails.country}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, country: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                >
                  <option value="Ireland">Ireland (An Post & DPD Express)</option>
                  <option value="United Kingdom">United Kingdom (Tracked)</option>
                  <option value="United States">United States (US GAA Clubs)</option>
                  <option value="Australia">Australia (GAA Clubs)</option>
                  <option value="Europe">Europe (Gaelic Games Europe)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                Street Address / GAA Club House *
              </label>
              <input
                type="text"
                required
                placeholder="House name, street or club grounds"
                value={shippingDetails.addressLine1}
                onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine1: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Town / City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Killarney"
                  value={shippingDetails.city}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  County
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerry"
                  value={shippingDetails.county}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, county: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Eircode / Postcode
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. V93 X2T8"
                  value={shippingDetails.eircodePostcode}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, eircodePostcode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white uppercase focus:border-[#d4af37] outline-none font-mono"
                />
              </div>
            </div>

            {/* Shipping Method Selector */}
            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                Select Dispatch Method
              </label>
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  shippingMethod === 'standard'
                    ? 'bg-[#d4af37]/10 border-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="text-[#d4af37]"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>An Post Tracked Ireland (1-2 Days)</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">Reliable delivery with signature confirmation</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white">
                    {formatPrice(standardShippingCost, currency)}
                  </span>
                </label>

                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  shippingMethod === 'dpd_express'
                    ? 'bg-[#d4af37]/10 border-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'dpd_express'}
                      onChange={() => setShippingMethod('dpd_express')}
                      className="text-[#d4af37]"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>DPD 24h GAA Matchday Express</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">Dispatched priority before 2PM, 1-hour delivery window</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white">
                    {formatPrice(expressShippingCost, currency)}
                  </span>
                </label>
              </div>
            </div>

            {/* Total Summary Row */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Grand Total Due</div>
                <div className="text-xl font-black text-gold-gradient font-['Outfit']">
                  {formatPrice(grandTotal, currency)}
                </div>
              </div>

              <button
                type="submit"
                id="shipping-next-to-payment-btn"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 cursor-pointer shadow-lg shadow-[#d4af37]/20"
              >
                <span>Continue To Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {step === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Clean 2-Option Payment Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#0070ba]/15 border-[#0070ba] text-white ring-1 ring-[#0070ba]/50 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#0070ba] text-white flex items-center justify-center font-black italic text-xs">
                      P
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wide text-white">PayPal</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#60c5ff] bg-[#0070ba]/20 px-2 py-0.5 rounded border border-[#0070ba]/40">
                    @goesftbl
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Instant transfer • Revolut Cards, Bank, or PayPal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-zinc-850 border-[#d4af37] text-white ring-1 ring-[#d4af37]/50 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#d4af37]">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wide text-white">Debit / Credit Card</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Revolut Card, Visa, Mastercard
                </p>
              </button>
            </div>

            {/* Subtle accepted payment methods note */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
              <span>Accepted: Revolut • Visa • Mastercard • Apple Pay • PayPal</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Buyer Protected</span>
              </span>
            </div>

            {paymentMethod === 'paypal' ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-[#0070ba]/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0070ba]/20 border border-[#0070ba]/40 flex items-center justify-center text-[#0070ba] shrink-0">
                    <span className="font-black italic text-sm text-[#0070ba]">P</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Direct Transfer to @goesftbl</span>
                      <span className="font-mono text-[11px] text-[#60c5ff]">paypal.me/goesftbl</span>
                    </div>
                    <p className="text-zinc-400 mt-1 text-[11px] leading-relaxed">
                      Revolut users can pay instantly using their Revolut card or balance through PayPal. No account creation is required for card checkout.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4532 •••• •••• 8921"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white font-mono tracking-wider focus:border-[#d4af37] outline-none"
                    />
                    <CreditCard className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Works with Revolut debit cards and standard bank cards.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white font-mono focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                      Security Code (CVC)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white font-mono focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Name as it appears on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none uppercase"
                  />
                </div>
              </div>
            )}

            {/* Order Items Review Table */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Items Subtotal</span>
                <span className="text-white">{formatPrice(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#d4af37]">
                  <span>Applied Promo Discount</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Dispatch ({shippingMethod === 'standard' ? 'An Post' : 'DPD 24h'})</span>
                <span className="text-white">
                  {formatPrice(shippingCost, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-800">
                <span className="uppercase">Total Charged</span>
                <span className="text-gold-gradient font-['Outfit'] font-black">
                  {formatPrice(grandTotal, currency)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
              >
                Back To Shipping
              </button>

              <button
                type="submit"
                id="submit-payment-btn"
                disabled={isProcessing}
                className={`px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#ffc439] hover:bg-[#f4b82d] text-[#003087] shadow-[#ffc439]/20 font-extrabold'
                    : 'bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black hover:brightness-110 shadow-[#d4af37]/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Payment...</span>
                  </>
                ) : paymentMethod === 'paypal' ? (
                  <>
                    <span className="font-black italic text-sm text-[#003087]">P</span>
                    <span>Pay {formatPrice(grandTotal, currency)} with PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-black" />
                    <span>Pay {formatPrice(grandTotal, currency)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER CONFIRMATION */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
                Order Confirmed & Logged
              </span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-['Outfit'] mt-1">
                YOU'RE MATCH READY!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Confirmation email and tracking updates sent to <strong>{confirmedOrder.shippingDetails.email}</strong>
              </p>
            </div>

            {/* Order Reference Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Order Reference</span>
                  <div className="text-base font-mono font-black text-white">{confirmedOrder.orderId}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Dispatch Service</span>
                  <div className="text-xs font-bold text-[#d4af37]">{confirmedOrder.deliveryMethod}</div>
                </div>
              </div>

              <div className="text-xs space-y-1 text-zinc-300">
                <div className="font-bold text-white">Shipping To:</div>
                <div>{confirmedOrder.shippingDetails.fullName}</div>
                <div>{confirmedOrder.shippingDetails.addressLine1}, {confirmedOrder.shippingDetails.city}</div>
                <div>Co. {confirmedOrder.shippingDetails.county}, {confirmedOrder.shippingDetails.eircodePostcode}</div>
              </div>

              {/* Items in order */}
              <div className="pt-2 border-t border-zinc-850 space-y-2">
                {confirmedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-zinc-300">
                    <span>
                      {it.quantity}x {it.product.name} ({it.selectedSize})
                    </span>
                    <span className="font-bold text-white">
                      {formatPrice(it.product.price * it.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-black text-white">
                <span>Total Paid</span>
                <span className="text-gold-gradient font-mono">
                  {formatPrice(confirmedOrder.total, currency)}
                </span>
              </div>
            </div>

            {/* PayPal Payment Instructions Card if paid with PayPal */}
            {confirmedOrder.paymentMethod === 'paypal' && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#0070ba]/10 border border-[#0070ba]/40 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0070ba] text-white flex items-center justify-center font-black italic text-xs">
                      P
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#60c5ff] uppercase tracking-wide">
                        PayPal Transfer (@goesftbl)
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Amount: <strong className="text-white">{formatPrice(confirmedOrder.total, currency)}</strong> • Note: <strong className="font-mono text-white">{confirmedOrder.orderId}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Awaiting Payment
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  If the PayPal transfer window did not automatically open, tap the button below to complete the {formatPrice(confirmedOrder.total, currency)} payment directly to <strong>@goesftbl</strong>:
                </p>

                <div className="pt-1">
                  <a
                    href={`https://paypal.me/${PAYPAL_HANDLE}/${confirmedOrder.total.toFixed(2)}${currency}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ffc439] hover:bg-[#f4b82d] text-[#003087] font-black text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    <span>Open paypal.me/goesftbl</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#003087]" />
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Match Receipt</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#d4af37] text-black text-xs font-black uppercase tracking-wider hover:bg-[#f5df88]"
              >
                Back To OCI Sports
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
