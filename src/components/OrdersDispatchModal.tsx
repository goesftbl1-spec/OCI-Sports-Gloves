import React, { useState, useEffect } from 'react';
import { X, Package, Copy, Check, ExternalLink, Mail, Phone, MapPin, Truck, RefreshCw, Trash2 } from 'lucide-react';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    let serverOrders: Order[] = [];
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          serverOrders = data.orders;
        }
      }
    } catch {
      // Backend api fallback
    }

    let stored: Order[] = [];
    try {
      stored = JSON.parse(localStorage.getItem('oci_orders_log') || '[]');
    } catch {
      stored = [];
    }

    // Merge unique orders
    const mergedMap = new Map<string, Order>();
    [...serverOrders, ...recentOrders, ...stored].forEach((ord) => {
      if (ord && ord.orderId && !mergedMap.has(ord.orderId)) {
        mergedMap.set(ord.orderId, ord);
      }
    });

    setOrders(Array.from(mergedMap.values()));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, recentOrders]);

  if (!isOpen) return null;

  const handleCopyLabel = (order: Order) => {
    const label = `${order.shippingDetails.fullName}
${order.shippingDetails.addressLine1}
${order.shippingDetails.city}
Co. ${order.shippingDetails.county}
${order.shippingDetails.eircodePostcode}
Ireland
Phone: ${order.shippingDetails.phone}`;

    navigator.clipboard.writeText(label);
    setCopiedId(order.orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLog = async () => {
    if (window.confirm('Clear dispatch history?')) {
      try {
        await fetch('/api/orders', { method: 'DELETE' });
      } catch {}
      localStorage.removeItem('oci_orders_log');
      setOrders([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="orders-dispatch-modal"
        className="relative w-full max-w-3xl bg-[#111114] border border-zinc-700/90 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white font-['Outfit'] flex items-center gap-2">
                <span>Orders & Dispatch Hub</span>
                <span className="text-xs font-mono font-normal bg-zinc-800 px-2 py-0.5 rounded text-[#d4af37]">
                  {orders.length} Logged
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Fulfillment orders dispatched to <strong className="text-white">contactocisports@gmail.com</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email sync note */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>
              All incoming buyer addresses and order specs are automatically forwarded to <strong>contactocisports@gmail.com</strong>.
            </span>
          </div>
          <button
            onClick={loadOrders}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {orders.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No Orders Logged Yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                When visitors place orders on your store, their shipping address, glove sizes, and order details will appear here and in your inbox.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.orderId}
                className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 transition-colors space-y-3.5"
              >
                {/* Top Row: ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-850">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Order Reference</span>
                    <div className="font-mono font-black text-sm text-white">{ord.orderId}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Total Charged</span>
                    <div className="text-sm font-black text-[#d4af37] font-mono">
                      {formatPrice(ord.total, ord.currency)}
                    </div>
                  </div>
                </div>

                {/* Shipping & Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#d4af37]" />
                      <span>An Post Shipping Address</span>
                    </div>
                    <div className="font-bold text-white">{ord.shippingDetails.fullName}</div>
                    <div className="text-zinc-300">{ord.shippingDetails.addressLine1}</div>
                    <div className="text-zinc-300">{ord.shippingDetails.city}, Co. {ord.shippingDetails.county}</div>
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
                  <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Glove Spec & Sizes:</div>
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-300">
                      <span>
                        <strong>{it.quantity}x</strong> {it.product.name} — <span className="text-white font-bold">Size {it.selectedSize}</span>
                      </span>
                      <span className="font-mono text-zinc-400">
                        {formatPrice(it.product.price * it.quantity, ord.currency)}
                      </span>
                    </div>
                  ))}
                  {ord.shippingDetails.deliveryNote && (
                    <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-900">
                      <strong>Delivery Note:</strong> {ord.shippingDetails.deliveryNote}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-zinc-500">
                    Payment: <strong className="text-zinc-300">{ord.paymentMethod === 'paypal' ? 'PayPal (@goesftbl)' : 'Card'}</strong> • {ord.createdAt}
                  </div>

                  <button
                    onClick={() => handleCopyLabel(ord)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-white flex items-center gap-1.5 border border-zinc-700 transition-colors"
                  >
                    {copiedId === ord.orderId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Label!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Copy An Post Label</span>
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
              className="text-zinc-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local List</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
