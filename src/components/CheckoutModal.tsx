import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle,
  ArrowRight,
  Truck,
  Printer,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  Mail,
  ChevronLeft,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { CartItem, Currency, ShippingDetails, Order } from '../types';
import { formatPrice } from '../utils/formatters';
import { PayPalButton } from './PayPalButton';
import {
  validateCustomerAddress,
  formatEircode,
  IRISH_COUNTIES
} from '../utils/addressValidation';

interface PayPalConfigState {
  loading: boolean;
  configured: boolean;
  clientId: string | null;
  mode: 'sandbox' | 'live';
  currency: string;
  contactEmail: string;
}

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
  onClearCart,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmed'>('shipping');

  // PayPal Configuration state from server
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfigState>({
    loading: true,
    configured: false,
    clientId: null,
    mode: 'sandbox',
    currency: 'EUR',
    contactEmail: 'contactocisports@gmail.com',
  });

  // Shipping form state
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: 'Dublin',
    eircodePostcode: '',
    country: 'Ireland',
    deliveryNote: '',
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'dpd_express'>('standard');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressWarnings, setAddressWarnings] = useState<string[]>([]);
  const [showAddressReviewPrompt, setShowAddressReviewPrompt] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  // Payment execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch server-side PayPal config on modal mount
  useEffect(() => {
    let isMounted = true;
    async function fetchConfig() {
      try {
        const res = await fetch('/api/paypal/config');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPaypalConfig({
              loading: false,
              configured: Boolean(data.configured && data.clientId),
              clientId: data.clientId || null,
              mode: data.mode || 'sandbox',
              currency: data.currency || 'EUR',
              contactEmail: data.contactEmail || 'contactocisports@gmail.com',
            });
          }
        } else {
          if (isMounted) {
            setPaypalConfig((prev) => ({ ...prev, loading: false, configured: false }));
          }
        }
      } catch {
        if (isMounted) {
          setPaypalConfig((prev) => ({ ...prev, loading: false, configured: false }));
        }
      }
    }

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Recalculate price totals strictly matching canonical server logic
  const subtotal = Number(
    items
      .reduce((acc, item) => {
        const itemBase = item.product.price;
        const itemPers = item.personalization?.enabled ? 4.0 : 0;
        return acc + (itemBase + itemPers) * item.quantity;
      }, 0)
      .toFixed(2)
  );

  const discountAmount = Number(((subtotal * discountPercentage) / 100).toFixed(2));
  const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));

  const standardShippingCost = 3.99;
  const expressShippingCost = 6.99;
  const shippingCost = shippingMethod === 'standard' ? standardShippingCost : expressShippingCost;
  const grandTotal = Number((discountedSubtotal + shippingCost).toFixed(2));

  // Handle Shipping Submit with Address Validation
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side rule validation
    const check = validateCustomerAddress(shippingDetails);
    if (!check.isValid) {
      setFormErrors(check.errors);
      setAddressWarnings(check.warnings);
      return;
    }

    setFormErrors({});
    setIsValidatingAddress(true);

    // 2. Server-side Geocoding & Address Check
    try {
      const res = await fetch('/api/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingDetails),
      });

      const data = await res.json();
      setIsValidatingAddress(false);

      if (!res.ok || !data.valid) {
        setFormErrors(data.errors || { addressLine1: 'Please check your address details.' });
        setAddressWarnings(data.warnings || []);
        return;
      }

      // If geocoding had soft warnings (e.g. unindexed property or routing check), ask customer to review rather than silently altering or rejecting
      const combinedWarnings = Array.from(new Set([...(check.warnings || []), ...(data.warnings || [])]));
      if (combinedWarnings.length > 0 && !showAddressReviewPrompt) {
        setAddressWarnings(combinedWarnings);
        setShowAddressReviewPrompt(true);
        return;
      }

      // Valid and confirmed
      setShowAddressReviewPrompt(false);
      setStep('payment');
      setPaymentError(null);
      setPaymentCancelled(false);
    } catch {
      // If validation endpoint has network error, proceed without blocking customer
      setIsValidatingAddress(false);
      setStep('payment');
      setPaymentError(null);
      setPaymentCancelled(false);
    }
  };

  const handleProceedAfterWarning = () => {
    setShowAddressReviewPrompt(false);
    setStep('payment');
    setPaymentError(null);
    setPaymentCancelled(false);
  };

  const handlePaymentSuccess = (order: Order) => {
    setConfirmedOrder(order);
    onOrderCompleted(order);
    onClearCart();
    setStep('confirmed');
  };

  const handlePaymentError = (errorMsg: string) => {
    setPaymentError(errorMsg);
    setPaymentCancelled(false);
  };

  const handlePaymentCancel = () => {
    setPaymentCancelled(true);
    setPaymentError(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        id="checkout-modal-container"
        className="relative w-full max-w-2xl bg-[#111114] border border-zinc-700/90 rounded-2xl shadow-2xl p-5 sm:p-8 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight font-['Outfit'] flex items-center gap-2">
                <span>OCI Secure Checkout</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  PayPal &amp; Card Secure
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
              disabled={isProcessing}
              className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-40"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'confirmed' && (
          <div className="flex items-center justify-between mb-6 px-1 text-xs font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => !isProcessing && setStep('shipping')}
              className={`flex items-center gap-2 transition-colors ${
                step === 'shipping' ? 'text-[#d4af37]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'shipping' ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                1
              </div>
              <span>Delivery Details</span>
            </button>

            <div className="flex-1 h-[1px] bg-zinc-800 mx-3" />

            <div
              className={`flex items-center gap-2 ${
                step === 'payment' ? 'text-[#d4af37]' : 'text-zinc-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'payment' ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                2
              </div>
              <span>Payment (Card / PayPal)</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: DELIVERY & LOCATION DETAILS                            */}
        {/* ============================================================== */}
        {step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            {/* Address Review Checkpoint (If automated geocoding requires customer confirmation) */}
            {showAddressReviewPrompt && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Address Verification Check</span>
                </div>
                <div className="text-[11px] text-zinc-300 space-y-1">
                  {addressWarnings.map((warn, i) => (
                    <p key={i} className="leading-relaxed">• {warn}</p>
                  ))}
                  <p className="pt-1 font-medium text-white">
                    Please confirm that your house number, street name, town, and Eircode are correct so your courier can deliver without delay:
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddressReviewPrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold"
                  >
                    Edit Address
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedAfterWarning}
                    className="px-4 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#f5df88] text-black text-[11px] font-black uppercase tracking-wider"
                  >
                    Confirm &amp; Proceed To Payment
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Full Name (First &amp; Surname) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Clifford"
                  value={shippingDetails.fullName}
                  onChange={(e) => {
                    setShippingDetails({ ...shippingDetails, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none ${
                    formErrors.fullName ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. player@gaaclub.ie"
                  value={shippingDetails.email}
                  onChange={(e) => {
                    setShippingDetails({ ...shippingDetails, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none ${
                    formErrors.email ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Mobile / Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +353 87 123 4567"
                  value={shippingDetails.phone}
                  onChange={(e) => {
                    setShippingDetails({ ...shippingDetails, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none ${
                    formErrors.phone ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Country <span className="text-red-400">*</span>
                </label>
                <select
                  value={shippingDetails.country}
                  onChange={(e) =>
                    setShippingDetails({
                      ...shippingDetails,
                      country: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                >
                  <option value="Ireland">Ireland (32 Counties)</option>
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="United States">United States (US)</option>
                  <option value="Australia">Australia</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                House/Building № or Name &amp; Street Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 14 Main Street, Teach Na nGael, or Apt 3B"
                value={shippingDetails.addressLine1}
                onChange={(e) => {
                  setShippingDetails({ ...shippingDetails, addressLine1: e.target.value });
                  if (formErrors.addressLine1) setFormErrors({ ...formErrors, addressLine1: '' });
                }}
                className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none ${
                  formErrors.addressLine1 ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                }`}
              />
              {formErrors.addressLine1 && (
                <p className="text-[11px] text-red-400 mt-1">{formErrors.addressLine1}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Town / City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Killarney or Dublin"
                  value={shippingDetails.city}
                  onChange={(e) => {
                    setShippingDetails({ ...shippingDetails, city: e.target.value });
                    if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none ${
                    formErrors.city ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                  }`}
                />
                {formErrors.city && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  County / Region <span className="text-red-400">*</span>
                </label>
                {shippingDetails.country === 'Ireland' ? (
                  <select
                    value={shippingDetails.county}
                    onChange={(e) => {
                      setShippingDetails({ ...shippingDetails, county: e.target.value });
                      if (formErrors.county) setFormErrors({ ...formErrors, county: '' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  >
                    {IRISH_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        Co. {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="County or State"
                    value={shippingDetails.county}
                    onChange={(e) => {
                      setShippingDetails({ ...shippingDetails, county: e.target.value });
                      if (formErrors.county) setFormErrors({ ...formErrors, county: '' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  />
                )}
                {formErrors.county && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.county}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Eircode / Postcode <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. V93 X2K1"
                  value={shippingDetails.eircodePostcode}
                  onChange={(e) => {
                    const formatted = shippingDetails.country === 'Ireland'
                      ? formatEircode(e.target.value)
                      : e.target.value.toUpperCase();
                    setShippingDetails({
                      ...shippingDetails,
                      eircodePostcode: formatted,
                    });
                    if (formErrors.eircodePostcode) setFormErrors({ ...formErrors, eircodePostcode: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-black border text-xs text-white outline-none font-mono ${
                    formErrors.eircodePostcode ? 'border-red-500' : 'border-zinc-700 focus:border-[#d4af37]'
                  }`}
                />
                {formErrors.eircodePostcode && (
                  <p className="text-[11px] text-red-400 mt-1">{formErrors.eircodePostcode}</p>
                )}
              </div>
            </div>

            {/* Courier Dispatch Option */}
            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                Select Dispatch Courier Service
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShippingMethod('standard')}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'standard'
                      ? 'bg-zinc-850 border-[#d4af37] text-white ring-1 ring-[#d4af37]/40'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-white">An Post Tracked</div>
                      <div className="text-[11px] text-zinc-400">1-2 Working Days (All 32 Counties)</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">€3.99</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('dpd_express')}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'dpd_express'
                      ? 'bg-zinc-850 border-[#d4af37] text-white ring-1 ring-[#d4af37]/40'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-white">DPD Matchday Express</div>
                      <div className="text-[11px] text-zinc-400">Next-Day Priority with 1h SMS Window</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">€6.99</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Cart: {items.reduce((acc, i) => acc + i.quantity, 0)} item(s) • Total Due:
              </span>
              <span className="text-base font-black text-white font-['Outfit']">
                {formatPrice(grandTotal, currency)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
              >
                Back To Bag
              </button>

              <button
                type="submit"
                id="shipping-continue-btn"
                disabled={isValidatingAddress}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 cursor-pointer shadow-lg shadow-[#d4af37]/20 disabled:opacity-50"
              >
                {isValidatingAddress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Address...</span>
                  </>
                ) : (
                  <>
                    <span>Continue To Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PAYMENT (DEBIT/CREDIT CARD OR PAYPAL)                  */}
        {/* ============================================================== */}
        {step === 'payment' && (
          <div className="space-y-4">
            {/* Delivery address snapshot pill */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="text-zinc-300">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Delivering To:</span>
                <span className="font-semibold text-white">
                  {shippingDetails.fullName}, {shippingDetails.addressLine1}, {shippingDetails.city}, Co.{' '}
                  {shippingDetails.county} ({shippingDetails.eircodePostcode})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="text-[11px] font-bold text-[#d4af37] hover:underline shrink-0 ml-3"
              >
                Edit
              </button>
            </div>

            {/* Price Breakdown Preview */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">{formatPrice(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#d4af37] font-semibold">
                  <span>Promo Discount ({appliedPromo})</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>
                  Courier ({shippingMethod === 'standard' ? 'An Post Tracked' : 'DPD GAA Matchday 24h'})
                </span>
                <span className="text-white font-medium">{formatPrice(shippingCost, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-800">
                <span className="uppercase">Final Amount Sent To Payment Processor</span>
                <span className="text-gold-gradient font-['Outfit'] font-black text-base">
                  {formatPrice(grandTotal, currency)}
                </span>
              </div>
            </div>

            {/* Cancelled Banner */}
            {paymentCancelled && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">Transaction Cancelled</div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                    The payment window was cancelled. No money was deducted from your account. Your cart items are preserved so you can retry when ready.
                  </p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {paymentError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-red-300">Payment Issue Encountered</div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Official PayPal Buttons OR Real Configuration Setup Notice */}
            {paypalConfig.configured && paypalConfig.clientId ? (
              <div className="space-y-3">
                {/* Official PayPal Smart Payment Component */}
                <PayPalButton
                  clientId={paypalConfig.clientId}
                  currency={currency}
                  items={items}
                  shippingDetails={shippingDetails}
                  shippingMethod={shippingMethod}
                  discountPercentage={discountPercentage}
                  appliedPromo={appliedPromo}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Official Secure Infrastructure:</span>
                  </div>
                  <p className="leading-relaxed">
                    • Card &amp; PayPal transactions are processed directly through PayPal's secure 256-bit encrypted gateway.
                  </p>
                  <p className="leading-relaxed">
                    • No card numbers, CVVs, or PayPal passwords are ever handled by or stored on our website.
                  </p>
                  <p className="leading-relaxed">
                    • Funds from successful purchases are deposited directly into your connected PayPal Business account.
                  </p>
                </div>
              </div>
            ) : (
              /* Honest, Zero-Fake Configuration Guide */
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-700/80 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0070ba]/20 border border-[#0070ba]/50 flex items-center justify-center text-[#0070ba] shrink-0 font-black italic text-base">
                    P
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight font-['Outfit']">
                      PayPal Credentials Required To Process Customer Payments
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      To direct customer debit/credit card and PayPal funds into your PayPal account (<strong>contactocisports@gmail.com</strong>),
                      set your PayPal REST API credentials. Per your security rules, no fake checkout or demo orders are simulated.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                  <div className="font-bold text-[#d4af37] uppercase tracking-wider text-[11px]">
                    How to connect your PayPal Business account:
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
                    <li>
                      Log into{' '}
                      <a
                        href="https://developer.paypal.com/dashboard/applications"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#60c5ff] underline inline-flex items-center gap-1"
                      >
                        developer.paypal.com/dashboard/applications
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Create an app under <strong>Apps &amp; Credentials</strong> for OCI Sports.</li>
                    <li>
                      Copy the <strong>Client ID</strong> and <strong>Secret Key</strong>.
                    </li>
                    <li>
                      Add them to your project's <code>.env</code> file (or AI Studio Settings):
                      <div className="mt-1 p-2 rounded bg-black font-mono text-[10px] text-zinc-300 border border-zinc-800">
                        PAYPAL_MODE="live" (or "sandbox" for test mode)<br />
                        PAYPAL_CLIENT_ID="your_client_id_here"<br />
                        PAYPAL_CLIENT_SECRET="your_client_secret_here"
                      </div>
                    </li>
                    <li>
                      In your PayPal Business Account (<strong>Settings &gt; Website Payments</strong>), make sure <strong>"PayPal Account Optional"</strong> is turned <strong>ON</strong> so customers can pay directly with Debit/Credit cards without creating an account.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setStep('shipping')}
                className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back To Delivery Details</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: ORDER CONFIRMED (REAL VERIFIED PAYPAL CAPTURE ONLY)     */}
        {/* ============================================================== */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="text-center py-2 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
                Payment Verified &amp; Secured
              </span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-['Outfit'] mt-1">
                YOU'RE MATCH READY!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Funds received securely via PayPal. Order dispatched to fulfillment warehouse.
              </p>
            </div>

            {/* Order Reference & Tracking Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Store Order ID</span>
                  <div className="text-base font-mono font-black text-white flex items-center gap-2">
                    <span>{confirmedOrder.orderId}</span>
                    <button
                      onClick={() => handleCopy(confirmedOrder.orderId, 'orderId')}
                      className="p-1 hover:text-[#d4af37] text-zinc-500 transition-colors"
                      title="Copy Order ID"
                    >
                      {copiedId === 'orderId' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">PayPal Transaction ID</span>
                  <div className="text-xs font-mono font-bold text-[#60c5ff] flex items-center justify-end gap-1.5">
                    <span>{confirmedOrder.paypalTransactionId || confirmedOrder.paypalOrderId || 'VERIFIED'}</span>
                    {confirmedOrder.paypalTransactionId && (
                      <button
                        onClick={() => handleCopy(confirmedOrder.paypalTransactionId!, 'paypalId')}
                        className="p-1 hover:text-[#d4af37] text-zinc-500 transition-colors"
                        title="Copy PayPal ID"
                      >
                        {copiedId === 'paypalId' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping snapshot */}
              <div className="text-xs space-y-1 text-zinc-300">
                <div className="font-bold text-white">Shipping To:</div>
                <div>{confirmedOrder.shippingDetails.fullName}</div>
                <div>
                  {confirmedOrder.shippingDetails.addressLine1}, {confirmedOrder.shippingDetails.city}
                </div>
                <div>
                  Co. {confirmedOrder.shippingDetails.county}, {confirmedOrder.shippingDetails.eircodePostcode}
                </div>
                <div className="text-zinc-400">
                  Dispatch Courier: <strong className="text-white">{confirmedOrder.deliveryMethod}</strong>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="pt-2 border-t border-zinc-850 space-y-2">
                {confirmedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-zinc-300">
                    <div>
                      <span className="font-semibold text-white">
                        {it.quantity}x {it.product.name}
                      </span>
                      <span className="text-zinc-400 ml-1">
                        (Size: {it.selectedSize} • {it.selectedCut})
                      </span>
                      {it.personalization?.enabled && (
                        <div className="text-[10px] text-[#d4af37]">
                          Foil Print: "{it.personalization.text}" ({it.personalization.color})
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-white">
                      {formatPrice(
                        (it.product.price + (it.personalization?.enabled ? 4.0 : 0)) * it.quantity,
                        currency
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Paid */}
              <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-black text-white">
                <span className="uppercase">Total Paid via PayPal Gateway</span>
                <span className="text-gold-gradient font-mono text-base font-black">
                  {formatPrice(confirmedOrder.total, currency)}
                </span>
              </div>
            </div>

            {/* Notification to store owner confirmation */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-left text-xs flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-zinc-300 text-[11px]">
                Order dispatch details sent to <strong>{paypalConfig.contactEmail}</strong> and recorded in your
                Orders &amp; Dispatch Hub.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#d4af37] text-black text-xs font-black uppercase tracking-wider hover:bg-[#f5df88] cursor-pointer"
              >
                Back To Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
