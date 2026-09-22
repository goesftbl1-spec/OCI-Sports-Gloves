import React, { useEffect, useRef, useState } from 'react';
import { loadScript } from '@paypal/paypal-js';
import { CartItem, Currency, ShippingDetails, Order } from '../types';
import { AlertCircle, RefreshCw, CreditCard, ShieldCheck, HelpCircle } from 'lucide-react';

interface PayPalButtonProps {
  clientId: string;
  currency: Currency;
  items: CartItem[];
  shippingDetails: ShippingDetails;
  shippingMethod: 'standard' | 'dpd_express';
  discountPercentage: number;
  appliedPromo: string | null;
  onSuccess: (order: Order) => void;
  onError: (errorMessage: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

type PaymentTab = 'all' | 'card' | 'paypal';

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  clientId,
  currency,
  items,
  shippingDetails,
  shippingMethod,
  discountPercentage,
  appliedPromo,
  onSuccess,
  onError,
  onCancel,
  isProcessing,
  setIsProcessing,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PaymentTab>('all');
  const [paypalInstance, setPaypalInstance] = useState<any>(null);

  // Prevent multiple capture invocations for the same transaction
  const hasCapturedRef = useRef(false);

  // Keep latest refs to prevent stale closures during PayPal callbacks
  const itemsRef = useRef(items);
  const shippingRef = useRef(shippingDetails);
  const shippingMethodRef = useRef(shippingMethod);
  const promoRef = useRef(appliedPromo);
  const currencyRef = useRef(currency);

  useEffect(() => {
    itemsRef.current = items;
    shippingRef.current = shippingDetails;
    shippingMethodRef.current = shippingMethod;
    promoRef.current = appliedPromo;
    currencyRef.current = currency;
  }, [items, shippingDetails, shippingMethod, appliedPromo, currency]);

  // Load PayPal SDK
  useEffect(() => {
    let isMounted = true;

    async function loadPayPalSdk() {
      if (!clientId) {
        setSdkError('PayPal Client ID is missing.');
        setSdkLoading(false);
        return;
      }

      setSdkLoading(true);
      setSdkError(null);

      try {
        const paypal = await loadScript({
          clientId: clientId.trim(),
          currency: currency || 'EUR',
          components: 'buttons',
          intent: 'capture',
          enableFunding: 'card', // Explicitly enable guest card checkout without PayPal account
        });

        if (!isMounted) return;

        if (!paypal || !paypal.Buttons) {
          throw new Error('PayPal SDK loaded but Buttons component is unavailable.');
        }

        setPaypalInstance(paypal);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading PayPal SDK:', err);
          setSdkError(err.message || 'Could not load PayPal checkout buttons.');
        }
      } finally {
        if (isMounted) {
          setSdkLoading(false);
        }
      }
    }

    loadPayPalSdk();

    return () => {
      isMounted = false;
    };
  }, [clientId, currency]);

  // Render Buttons when instance or tab changes
  useEffect(() => {
    let buttonsInstance: any = null;
    let isMounted = true;

    async function renderButtons() {
      if (!paypalInstance || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      hasCapturedRef.current = false;

      try {
        let fundingSource: any = undefined;
        if (activeTab === 'card' && paypalInstance.FUNDING?.CARD) {
          fundingSource = paypalInstance.FUNDING.CARD;
        } else if (activeTab === 'paypal' && paypalInstance.FUNDING?.PAYPAL) {
          fundingSource = paypalInstance.FUNDING.PAYPAL;
        }

        const buttonOptions: any = {
          style: {
            layout: 'vertical',
            color: activeTab === 'card' ? 'black' : 'gold',
            shape: 'rect',
            label: 'pay',
            height: 48,
          },

          // 1. Server-side Order Creation with Authoritative Price Recalculation
          createOrder: async () => {
            setIsProcessing(true);
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: itemsRef.current,
                  shippingDetails: shippingRef.current,
                  shippingMethod: shippingMethodRef.current,
                  appliedPromo: promoRef.current,
                  currency: currencyRef.current,
                }),
              });

              const data = await res.json();

              if (!res.ok || !data.id) {
                throw new Error(data.message || data.error || 'Failed to initialize PayPal order.');
              }

              return data.id;
            } catch (err: any) {
              setIsProcessing(false);
              const errMsg = err.message || 'Error communicating with payment server.';
              onError(errMsg);
              throw err;
            }
          },

          // 2. Server-side Capture upon Customer Approval (Prevent duplicate payments)
          onApprove: async (data: { orderID: string }) => {
            if (hasCapturedRef.current) {
              console.warn('Capture already in progress for order:', data.orderID);
              return;
            }
            hasCapturedRef.current = true;
            setIsProcessing(true);

            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderID: data.orderID,
                  shippingDetails: shippingRef.current,
                  shippingMethod: shippingMethodRef.current,
                  items: itemsRef.current,
                  appliedPromo: promoRef.current,
                  currency: currencyRef.current,
                }),
              });

              const captureResult = await res.json();

              if (!res.ok || !captureResult.success || !captureResult.order) {
                hasCapturedRef.current = false;
                throw new Error(
                  captureResult.message || captureResult.error || 'Payment capture failed. No funds were taken.'
                );
              }

              setIsProcessing(false);
              onSuccess(captureResult.order);
            } catch (err: any) {
              hasCapturedRef.current = false;
              setIsProcessing(false);
              const errMsg = err.message || 'Payment approval failed during capture. Please contact support.';
              onError(errMsg);
            }
          },

          // 3. User Cancelled
          onCancel: () => {
            setIsProcessing(false);
            hasCapturedRef.current = false;
            onCancel();
          },

          // 4. SDK / Transaction Error
          onError: (err: any) => {
            setIsProcessing(false);
            hasCapturedRef.current = false;
            console.error('PayPal Buttons Error:', err);
            const errMsg =
              typeof err === 'string'
                ? err
                : err?.message || 'Payment was declined or cancelled. Please verify your card or try another payment method.';
            onError(errMsg);
          },
        };

        if (fundingSource) {
          buttonOptions.fundingSource = fundingSource;
        }

        buttonsInstance = paypalInstance.Buttons(buttonOptions);

        if (buttonsInstance.isEligible()) {
          await buttonsInstance.render(containerRef.current);
        } else {
          // If specific card button is not eligible in this browser/region, fallback to all buttons
          if (activeTab !== 'all') {
            setActiveTab('all');
          } else {
            throw new Error('PayPal payment buttons are not eligible for this device/currency configuration.');
          }
        }
      } catch (renderErr: any) {
        if (isMounted) {
          console.error('Error rendering PayPal buttons:', renderErr);
          setSdkError(renderErr.message || 'Could not display payment buttons.');
        }
      }
    }

    renderButtons();

    return () => {
      isMounted = false;
      if (buttonsInstance && typeof buttonsInstance.close === 'function') {
        try {
          buttonsInstance.close();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [paypalInstance, activeTab]);

  if (sdkError) {
    return (
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>PayPal SDK Connection Notice</span>
        </div>
        <p className="leading-relaxed text-[11px] text-zinc-300">{sdkError}</p>
        <p className="text-[10px] text-zinc-400">
          Please verify your PayPal Client ID in environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-3">
      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
            activeTab === 'all'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          All Options
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'card'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-[#d4af37]/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Debit / Credit Card</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paypal')}
          className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
            activeTab === 'paypal'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          PayPal
        </button>
      </div>

      {/* Guest Checkout Notice for Card users */}
      {activeTab === 'card' && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">No PayPal Account Required:</span>
            <p className="text-zinc-300 mt-0.5 leading-relaxed">
              Pay with your standard Visa, Mastercard, or Revolut Debit/Credit card. Your payment is processed securely through PayPal's guest checkout without creating an account.
            </p>
          </div>
        </div>
      )}

      {sdkLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-zinc-950/60 rounded-xl border border-zinc-800 min-h-[140px]">
          <RefreshCw className="w-6 h-6 text-[#d4af37] animate-spin" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Loading Official PayPal Infrastructure...
          </span>
        </div>
      )}

      {/* Official PayPal Buttons Container */}
      <div
        id="paypal-button-container"
        ref={containerRef}
        className={`w-full transition-opacity duration-300 ${
          sdkLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
        }`}
      />

      {isProcessing && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
          <div className="w-8 h-8 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-black uppercase tracking-wider text-white font-['Outfit']">
            Securing Payment & Finalizing Order...
          </div>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Communicating with PayPal. Please do not close or reload this page to prevent duplicate transactions.
          </p>
        </div>
      )}
    </div>
  );
};
