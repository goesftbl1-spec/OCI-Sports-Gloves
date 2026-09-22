import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Truck,
  RefreshCw,
  Trash2,
  Lock,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Download,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { formatPrice } from '../utils/formatters';

interface OrdersDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders?: Order[];
}

export const OrdersDispatchModal: React.FC<OrdersDispatchModalProps> = ({
  isOpen,
  onClose,
  recentOrders = []
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem('oci_admin_auth'));
    } catch {
      return false;
    }
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSavedPasscode = (): string => {
    try {
      return sessionStorage.getItem('oci_admin_passcode') || '';
    } catch {
      return '';
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError('Please enter your owner passcode.');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('oci_admin_auth', 'true');
          sessionStorage.setItem('oci_admin_passcode', passcode.trim());
        } catch {}
        setPasscode('');
        setAuthError(null);
      } else {
        setAuthError('Access denied: Incorrect owner passcode.');
      }
    } catch {
      // Fallback check
      if (passcode.trim() === 'OCI2026') {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('oci_admin_auth', 'true');
          sessionStorage.setItem('oci_admin_passcode', passcode.trim());
        } catch {}
        setPasscode('');
        setAuthError(null);
      } else {
        setAuthError('Error verifying passcode with server.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('oci_admin_auth');
      sessionStorage.removeItem('oci_admin_passcode');
    } catch {}
    setOrders([]);
  };

  const loadOrders = async () => {
    setIsLoading(true);
    let serverOrders: Order[] = [];
    const activePasscode = getSavedPasscode() || passcode;

    try {
      const res = await fetch('/api/orders', {
        headers: {
          'x-admin-passcode': activePasscode,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          serverOrders = data.orders;
        }
      } else if (res.status === 401) {
        handleLogout();
        setIsLoading(false);
        return;
      }
    } catch {
      // network fallback
    }

    // Merge unique orders
    const mergedMap = new Map<string, Order>();
    [...serverOrders, ...recentOrders].forEach((ord) => {
      if (ord && ord.orderId && !mergedMap.has(ord.orderId)) {
        mergedMap.set(ord.orderId, ord);
      }
    });

    setOrders(Array.from(mergedMap.values()));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadOrders();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleCopyLabel = (order: Order) => {
    const label = `${order.shippingDetails.fullName}
${order.shippingDetails.addressLine1}
${order.shippingDetails.city}
Co. ${order.shippingDetails.county}
${order.shippingDetails.eircodePostcode}
${order.shippingDetails.country || 'Ireland'}
Phone: ${order.shippingDetails.phone}`;

    navigator.clipboard.writeText(label);
    setCopiedId(order.orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLog = async () => {
    if (window.confirm('Are you sure you want to clear dispatch history from the server?')) {
      try {
        await fetch('/api/orders', {
          method: 'DELETE',
          headers: { 'x-admin-passcode': getSavedPasscode() },
        });
      } catch {}
      setOrders([]);
    }
  };

  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      'OrderID',
      'Date',
      'CustomerName',
      'Email',
      'Phone',
      'AddressLine1',
      'City',
      'County',
      'Eircode',
      'Courier',
      'Total',
      'PayPalTransactionID',
      'Items'
    ];

    const rows = orders.map((o) => [
      `"${o.orderId}"`,
      `"${o.createdAt}"`,
      `"${o.shippingDetails.fullName}"`,
      `"${o.shippingDetails.email}"`,
      `"${o.shippingDetails.phone}"`,
      `"${o.shippingDetails.addressLine1}"`,
      `"${o.shippingDetails.city}"`,
      `"${o.shippingDetails.county}"`,
      `"${o.shippingDetails.eircodePostcode}"`,
      `"${o.deliveryMethod}"`,
      `"${o.total}"`,
      `"${o.paypalTransactionId || o.paypalOrderId || ''}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.product.name} (${i.selectedSize})`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oci_dispatch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        id="orders-dispatch-modal"
        className="relative w-full max-w-3xl bg-[#111114] border border-zinc-700/90 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* ========================================================= */}
        {/* VIEW 1: OWNER PASSCODE SECURITY GATE                      */}
        {/* ========================================================= */}
        {!isAuthenticated ? (
          <div className="py-6 sm:py-10 max-w-md mx-auto w-full text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37] mx-auto shadow-lg shadow-[#d4af37]/10">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">
                Restricted Access • Store Owner Only
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-['Outfit'] mt-1">
                Dispatch Portal Security Gate
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Customer delivery addresses, contact numbers, and order histories are protected. Enter your owner passcode to unlock.
              </p>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1.5">
                  Owner Passcode
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white font-mono text-sm tracking-wider focus:border-[#d4af37] outline-none"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer shadow-lg shadow-[#d4af37]/20 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Dispatch Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-500 hover:text-zinc-300 uppercase tracking-wider"
              >
                Cancel &amp; Return to Store
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: UNLOCKED ORDERS & DISPATCH HUB                     */
          /* ========================================================= */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white font-['Outfit'] flex items-center gap-2">
                    <span>Orders &amp; Dispatch Hub</span>
                    <span className="text-xs font-mono font-normal bg-zinc-800 px-2 py-0.5 rounded text-[#d4af37]">
                      {orders.length} Logged
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Confidential Store Orders • Dublin GAA Dispatch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Lock Portal (Logout)"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock Portal</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification sync bar */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>
                  Order notifications are dispatched to <strong>contactocisports@gmail.com</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <button
                    onClick={handleExportCsv}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Export CSV for couriers"
                  >
                    <Download className="w-3 h-3 text-[#d4af37]" />
                    <span>Export CSV</span>
                  </button>
                )}
                <button
                  onClick={loadOrders}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50">
                  <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No Orders Logged Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    When customers place orders, their delivery address, phone, and glove sizes will appear here and in your email.
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 transition-colors space-y-3.5"
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-850">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Order Reference</span>
                        <div className="font-mono font-black text-sm text-white flex items-center gap-2">
                          <span>{ord.orderId}</span>
                          {ord.paypalTransactionId && (
                            <span className="text-[10px] font-normal text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                              PayPal: {ord.paypalTransactionId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Total Charged</span>
                        <div className="text-sm font-black text-[#d4af37] font-mono">
                          {formatPrice(ord.total, ord.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Shipping & Customer Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#d4af37]" />
                          <span>Delivery Address</span>
                        </div>
                        <div className="font-bold text-white text-sm">{ord.shippingDetails.fullName}</div>
                        <div className="text-zinc-300">{ord.shippingDetails.addressLine1}</div>
                        <div className="text-zinc-300">
                          {ord.shippingDetails.city}, Co. {ord.shippingDetails.county}
                        </div>
                        <div className="font-mono font-bold text-[#d4af37]">{ord.shippingDetails.eircodePostcode}</div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-zinc-500">Customer Contact</div>
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <a href={`mailto:${ord.shippingDetails.email}`} className="hover:text-white underline">
                            {ord.shippingDetails.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <a href={`tel:${ord.shippingDetails.phone}`} className="hover:text-white">
                            {ord.shippingDetails.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{ord.deliveryMethod}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items in Order */}
                    <div className="p-3 rounded-lg bg-black/60 border border-zinc-900 space-y-1 text-xs">
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Items &amp; Sizing:</div>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-300">
                          <span>
                            <strong>{it.quantity}x</strong> {it.product.name} —{' '}
                            <span className="text-white font-bold">Size {it.selectedSize}</span>
                            {it.personalization?.enabled && (
                              <span className="text-[#d4af37] ml-2 text-[11px]">
                                [Print: "{it.personalization.text}"]
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-zinc-400">
                            {formatPrice(
                              (it.product.price + (it.personalization?.enabled ? 4.0 : 0)) * it.quantity,
                              ord.currency
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-zinc-500">
                        Method: <strong className="text-zinc-300">{ord.paymentMethod === 'paypal' ? 'PayPal' : 'PayPal / Card'}</strong> • {ord.createdAt}
                      </div>

                      <button
                        onClick={() => handleCopyLabel(ord)}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-white flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        {copiedId === ord.orderId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied Label!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>Copy Courier Label</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 mt-5 border-t border-zinc-850 text-xs">
              {orders.length > 0 ? (
                <button
                  onClick={handleClearLog}
                  className="text-zinc-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
