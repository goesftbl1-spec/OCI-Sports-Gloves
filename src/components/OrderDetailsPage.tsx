import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Search,
  LogOut,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ShoppingBag,
  ArrowUpDown,
  Filter,
  Edit3,
  Save,
  Download,
  Trash2
} from 'lucide-react';
import { Order } from '../types';
import { formatPrice, formatOrderDateTime } from '../utils/formatters';

type OrderStatus = 'Pending' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';
type SortOption = 'newest' | 'oldest' | 'recently_updated' | 'val_high_low' | 'val_low_high';
type FilterOption = 'ALL' | 'Pending' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';

const STATUS_CONFIG: Record<
  string,
  { label: OrderStatus; textColor: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  pending: {
    label: 'Pending',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  processing: {
    label: 'Processing',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  dispatched: {
    label: 'Dispatched',
    textColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    dotColor: 'bg-indigo-400',
  },
  delivered: {
    label: 'Delivered',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    dotColor: 'bg-rose-400',
  },
  paid: {
    label: 'Processing',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  completed: {
    label: 'Processing',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
};

function normalizeStatus(rawStatus?: string): OrderStatus {
  if (!rawStatus) return 'Pending';
  const clean = rawStatus.toLowerCase().trim();
  if (clean === 'delivered') return 'Delivered';
  if (clean === 'dispatched') return 'Dispatched';
  if (clean === 'processing') return 'Processing';
  if (clean === 'cancelled' || clean === 'failed') return 'Cancelled';
  if (clean === 'paid' || clean === 'completed') return 'Processing';
  return 'Pending';
}

export const OrderDetailsPage: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Orders data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // UI interaction states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Dispatch Edit State
  const [editingDispatchOrderId, setEditingDispatchOrderId] = useState<string | null>(null);
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingDispatch, setIsSavingDispatch] = useState(false);

  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem('oci_order_details_token');
      if (savedToken) {
        setAuthToken(savedToken);
        setIsAuthenticated(true);
        loadOrders(savedToken);
      }
    } catch {
      // storage access fallback
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();
    if (!entered) {
      setLoginError('Please enter your store owner password.');
      return;
    }

    setIsAuthenticating(true);
    setLoginError(null);

    const validPasswords = new Set(['14MCGEEOCI', 'OCI2026']);
    let authenticated = false;
    let sessionToken = '';

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: entered }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data.success && data.token) {
          authenticated = true;
          sessionToken = data.token;
        } else if (!response.ok && data.error && !validPasswords.has(entered)) {
          setLoginError(data.error || 'Incorrect password. Access denied.');
          setIsAuthenticating(false);
          return;
        }
      }
    } catch {
      // static/local fallback
    }

    if (!authenticated) {
      if (validPasswords.has(entered)) {
        authenticated = true;
        sessionToken = 'token-' + Math.random().toString(36).substring(2) + Date.now();
      } else {
        setLoginError('Incorrect password. Access denied.');
        setIsAuthenticating(false);
        return;
      }
    }

    if (authenticated && sessionToken) {
      setAuthToken(sessionToken);
      setIsAuthenticated(true);
      setPasswordInput('');
      try {
        sessionStorage.setItem('oci_order_details_token', sessionToken);
        sessionStorage.setItem('oci_admin_auth', 'true');
        sessionStorage.setItem('oci_admin_passcode', entered);
      } catch {}
      loadOrders(sessionToken);
    }
    setIsAuthenticating(false);
  };

  const loadOrders = async (token: string) => {
    setIsLoadingOrders(true);
    let serverOrders: Order[] = [];

    try {
      const res = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.status === 401) {
          if (!token.startsWith('token-')) {
            setIsAuthenticated(false);
            setAuthToken(null);
            try {
              sessionStorage.removeItem('oci_order_details_token');
            } catch {}
            setLoginError('Your session has expired. Please log in again.');
            setIsLoadingOrders(false);
            return;
          }
        } else {
          const data = await res.json();
          if (res.ok && Array.isArray(data.orders)) {
            serverOrders = data.orders;
          }
        }
      }
    } catch {
      // offline fallback
    }

    let localOrders: Order[] = [];
    try {
      const stored = localStorage.getItem('oci_orders_store');
      if (stored) {
        localOrders = JSON.parse(stored);
      }
    } catch {
      localOrders = [];
    }

    const mergedMap = new Map<string, Order>();
    [...serverOrders, ...localOrders].forEach((ord) => {
      if (ord && ord.orderId) {
        mergedMap.set(ord.orderId, ord);
      }
    });

    const combined = Array.from(mergedMap.values());
    setOrders(combined);
    try {
      localStorage.setItem('oci_orders_store', JSON.stringify(combined));
    } catch {}
    setIsLoadingOrders(false);
  };

  const handleLogout = async () => {
    if (authToken && !authToken.startsWith('token-')) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {}
    }
    try {
      sessionStorage.removeItem('oci_order_details_token');
    } catch {}
    setAuthToken(null);
    setIsAuthenticated(false);
    setOrders([]);
    setPasswordInput('');
    setLoginError(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const nowIso = new Date().toISOString();
    const isDispatched = newStatus === 'Dispatched';

    setOrders((prev) => {
      const updated = prev.map((ord) => {
        if (ord.orderId === orderId) {
          return {
            ...ord,
            status: newStatus,
            dispatchStatus: newStatus.toLowerCase(),
            dispatchDate: isDispatched ? ord.dispatchDate || nowIso : ord.dispatchDate,
            updatedAt: nowIso,
          };
        }
        return ord;
      });
      try {
        localStorage.setItem('oci_orders_store', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActionNotice(`Status for #${orderId} updated to ${newStatus}`);
    setTimeout(() => setActionNotice(null), 3500);

    if (authToken) {
      try {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            dispatchStatus: newStatus.toLowerCase(),
            ...(isDispatched ? { dispatchDate: nowIso } : {}),
          }),
        });
      } catch {}
    }
  };

  const startEditingDispatch = (order: Order) => {
    setEditingDispatchOrderId(order.orderId);
    setEditTrackingNumber(order.trackingNumber || '');
    setEditCarrier(order.carrier || order.deliveryMethod || 'An Post Tracked');
    setEditNotes(order.notes || order.shippingDetails?.deliveryNote || '');
  };

  const cancelEditingDispatch = () => {
    setEditingDispatchOrderId(null);
    setEditTrackingNumber('');
    setEditCarrier('');
    setEditNotes('');
  };

  const saveDispatchDetails = async (orderId: string) => {
    setIsSavingDispatch(true);
    const nowIso = new Date().toISOString();
    const target = orders.find((o) => o.orderId === orderId);
    const newTracking = editTrackingNumber.trim();
    const newCarrier = editCarrier.trim();
    const newNotes = editNotes.trim();

    const shouldMarkDispatched = Boolean(
      newTracking && (target?.status === 'Pending' || target?.status === 'Processing')
    );
    const nextStatus = shouldMarkDispatched ? 'Dispatched' : target?.status || 'Pending';
    const nextDispatchDate = target?.dispatchDate || (shouldMarkDispatched ? nowIso : undefined);

    setOrders((prev) => {
      const updated = prev.map((ord) => {
        if (ord.orderId === orderId) {
          return {
            ...ord,
            status: nextStatus,
            dispatchStatus: nextStatus.toLowerCase(),
            trackingNumber: newTracking,
            carrier: newCarrier,
            notes: newNotes,
            dispatchDate: nextDispatchDate,
            updatedAt: nowIso,
          };
        }
        return ord;
      });
      try {
        localStorage.setItem('oci_orders_store', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (authToken) {
      try {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: nextStatus,
            dispatchStatus: nextStatus.toLowerCase(),
            trackingNumber: newTracking,
            carrier: newCarrier,
            notes: newNotes,
            dispatchDate: nextDispatchDate,
          }),
        });
      } catch {}
    }

    setIsSavingDispatch(false);
    setEditingDispatchOrderId(null);
    setActionNotice(`Dispatch information saved for #${orderId}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyLabel = (order: Order) => {
    const label = `${order.shippingDetails?.fullName || 'Customer'}
${order.shippingDetails?.addressLine1 || ''}
${order.shippingDetails?.addressLine2 ? `${order.shippingDetails.addressLine2}\n` : ''}${order.shippingDetails?.city || ''}${
      order.shippingDetails?.county ? `, Co. ${order.shippingDetails.county}` : ''
    }
${order.shippingDetails?.eircodePostcode || ''}
${order.shippingDetails?.country || 'Ireland'}
Phone: ${order.shippingDetails?.phone || 'N/A'}`;

    navigator.clipboard.writeText(label);
    setCopiedId(order.orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      'OrderID',
      'Status',
      'DatePurchased',
      'LastUpdated',
      'CustomerName',
      'Email',
      'Phone',
      'AddressLine1',
      'City',
      'County',
      'Eircode',
      'Courier',
      'TrackingNumber',
      'DispatchDate',
      'Total',
      'PaymentMethod',
      'TransactionID',
    ];

    const rows = orders.map((o) => [
      `"${o.orderId || ''}"`,
      `"${normalizeStatus(o.status)}"`,
      `"${o.createdAt || ''}"`,
      `"${o.updatedAt || ''}"`,
      `"${o.shippingDetails?.fullName || ''}"`,
      `"${o.shippingDetails?.email || o.payerEmail || ''}"`,
      `"${o.shippingDetails?.phone || ''}"`,
      `"${o.shippingDetails?.addressLine1 || ''}"`,
      `"${o.shippingDetails?.city || ''}"`,
      `"${o.shippingDetails?.county || ''}"`,
      `"${o.shippingDetails?.eircodePostcode || ''}"`,
      `"${o.carrier || o.deliveryMethod || ''}"`,
      `"${o.trackingNumber || ''}"`,
      `"${o.dispatchDate || ''}"`,
      `"${o.total || ''}"`,
      `"${o.paymentMethod || 'PayPal / Card'}"`,
      `"${o.paypalTransactionId || o.paypalOrderId || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oci_orders_hub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let dispatched = 0;
    let delivered = 0;
    let cancelled = 0;
    let totalSales = 0;

    orders.forEach((o) => {
      const st = normalizeStatus(o.status);
      if (st === 'Pending') pending++;
      else if (st === 'Processing') processing++;
      else if (st === 'Dispatched') dispatched++;
      else if (st === 'Delivered') delivered++;
      else if (st === 'Cancelled') cancelled++;

      if (st !== 'Cancelled') {
        totalSales += o.total || 0;
      }
    });

    return {
      totalOrders: orders.length,
      pending,
      processing,
      dispatched,
      delivered,
      cancelled,
      totalSales,
    };
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== 'ALL') {
          const st = normalizeStatus(order.status);
          if (st.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();

        const orderIdMatch = (order.orderId || '').toLowerCase().includes(q);
        const nameMatch = (order.shippingDetails?.fullName || '').toLowerCase().includes(q);
        const emailMatch = (order.shippingDetails?.email || order.payerEmail || '')
          .toLowerCase()
          .includes(q);
        const eircodeMatch = (order.shippingDetails?.eircodePostcode || '')
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(q.replace(/\s+/g, ''));
        const productMatch = (order.items || []).some((i) =>
          (i.product?.name || '').toLowerCase().includes(q)
        );

        return orderIdMatch || nameMatch || emailMatch || eircodeMatch || productMatch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        const updatedA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
        const updatedB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
        const valA = a.total || 0;
        const valB = b.total || 0;

        switch (sortBy) {
          case 'oldest':
            return timeA - timeB;
          case 'recently_updated':
            return updatedB - updatedA;
          case 'val_high_low':
            return valB - valA;
          case 'val_low_high':
            return valA - valB;
          case 'newest':
          default:
            return timeB - timeA;
        }
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-[#f4f4f5] flex items-center justify-center p-4 selection:bg-[#d4af37]/30 selection:text-white">
        <div className="w-full max-w-md">
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4af37]">
                <Lock className="w-8 h-8" />
              </div>
            </div>

            <div className="text-center space-y-1.5 mb-8">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#d4af37]">
                Store Owner Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-['Outfit']">
                Orders &amp; Dispatch Hub
              </h1>
              <p className="text-xs text-zinc-400">
                Enter your administrative password to access customer orders and fulfilment records.
              </p>
            </div>

            {loginError && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-900/60 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Access Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter owner password..."
                    autoFocus
                    required
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] transition-colors text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#c59e2b] text-black font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Orders Hub</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#d4af37]/30 selection:text-white pb-16">
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-black text-sm">
              OCI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-tight font-['Outfit']">
                  Orders &amp; Dispatch Hub
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Store Owner Authenticated
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Confidential GAA Matchday Equipment Fulfilment &amp; Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {orders.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            <button
              onClick={() => authToken && loadOrders(authToken)}
              disabled={isLoadingOrders}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 space-y-6 flex-1">
        {actionNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. DASHBOARD SUMMARY                                      */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Total Orders
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono tabular-nums">
              {stats.totalOrders}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              Pending
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-mono tabular-nums">
              {stats.pending}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
              Processing
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 mt-1 font-mono tabular-nums">
              {stats.processing}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
              Dispatched
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1 font-mono tabular-nums">
              {stats.dispatched}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
              Delivered
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono tabular-nums">
              {stats.delivered}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#d4af37] block">
              Total Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#d4af37] mt-1 font-mono tabular-nums">
              {formatPrice(stats.totalSales, 'EUR')}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH, SORT & FILTER BAR                              */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, order ID, email, Eircode, product..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-400 font-bold hidden md:inline">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="py-2.5 pl-3 pr-8 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 hover:border-zinc-700 focus:border-[#d4af37] outline-none cursor-pointer appearance-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="recently_updated">Recently updated</option>
                  <option value="val_high_low">Order value: highest → lowest</option>
                  <option value="val_low_high">Order value: lowest → highest</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-500" />
              <span>Filter:</span>
            </span>

            {(['ALL', 'Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'] as FilterOption[]).map(
              (opt) => {
                const count =
                  opt === 'ALL'
                    ? orders.length
                    : orders.filter((o) => normalizeStatus(o.status) === opt).length;
                const isSelected = statusFilter === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#d4af37] text-black shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>{opt === 'ALL' ? 'All Orders' : opt}</span>
                    <span className="text-[10px] font-mono opacity-80 tabular-nums">({count})</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ORDER CARDS LISTING                                    */}
        {/* ========================================================= */}
        {isLoadingOrders ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading order records from server...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-8 rounded-3xl bg-zinc-950 border border-zinc-800">
            <Package className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Orders Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No orders match your current search or status filter criteria.'
                : 'No orders have been recorded yet. When customer checkouts complete, their orders will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-xs text-zinc-400 px-1">
              Showing <strong className="text-white">{filteredAndSortedOrders.length}</strong> of{' '}
              <strong className="text-white">{orders.length}</strong> orders
            </div>

            {filteredAndSortedOrders.map((ord) => {
              const currentStatus = normalizeStatus(ord.status);
              const statusStyle = STATUS_CONFIG[currentStatus.toLowerCase()] || STATUS_CONFIG.pending;
              const orderDate = formatOrderDateTime(ord.createdAt);
              const updatedDate = ord.updatedAt ? formatOrderDateTime(ord.updatedAt) : null;
              const dispatchDateTime = ord.dispatchDate ? formatOrderDateTime(ord.dispatchDate) : null;
              const isEditingThisOrder = editingDispatchOrderId === ord.orderId;

              return (
                <div
                  key={ord.orderId}
                  className="rounded-3xl bg-[#121217] border border-zinc-800 hover:border-zinc-700/80 transition-colors shadow-xl overflow-hidden divide-y divide-zinc-800/80"
                >
                  {/* 1. ORDER INFORMATION */}
                  <div className="p-4 sm:p-5 bg-zinc-900/40 space-y-3.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Order ID
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-black text-base sm:text-lg text-white">
                              #{ord.orderId}
                            </span>
                            <button
                              onClick={() => copyText(ord.orderId, `id-${ord.orderId}`)}
                              className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy Order ID"
                            >
                              {copiedField === `id-${ord.orderId}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="ml-0 sm:ml-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Order Status
                          </span>
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 mt-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusStyle.bgColor} ${statusStyle.textColor} ${statusStyle.borderColor}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusStyle.dotColor}`} />
                            <span>{currentStatus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Purchased
                          </span>
                          <div className="text-white font-medium text-xs sm:text-sm mt-0.5">
                            {orderDate.dateStr}
                          </div>
                          <div className="text-zinc-400 font-mono text-[11px] tabular-nums">
                            {orderDate.timeStr}
                          </div>
                        </div>

                        {updatedDate && (
                          <div className="border-l border-zinc-800 pl-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                              Last Updated
                            </span>
                            <div className="text-zinc-300 font-medium text-xs mt-0.5">
                              {updatedDate.dateStr}
                            </div>
                            <div className="text-zinc-400 font-mono text-[11px] tabular-nums">
                              {updatedDate.timeStr}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Change Status:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['Pending', 'Processing', 'Dispatched', 'Delivered'] as OrderStatus[]).map((st) => {
                          const isActive = currentStatus === st;
                          const cfg = STATUS_CONFIG[st.toLowerCase()];
                          return (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(ord.orderId, st)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isActive
                                  ? `${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor} ring-1 ring-[#d4af37]/30`
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}

                        {currentStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(ord.orderId, 'Cancelled')}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. CUSTOMER INFORMATION & 3. DELIVERY ADDRESS */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    {/* CUSTOMER INFORMATION */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs uppercase tracking-wider">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Customer Information</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-2">
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Full Name
                          </span>
                          <span className="font-bold text-white text-sm">
                            {ord.shippingDetails?.fullName || 'Valued Customer'}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Email</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${ord.shippingDetails?.email || ord.payerEmail}`}
                              className="text-zinc-200 hover:text-[#d4af37] underline break-all font-mono"
                            >
                              {ord.shippingDetails?.email || ord.payerEmail || 'Email not provided'}
                            </a>
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Phone Number
                          </span>
                          {ord.shippingDetails?.phone ? (
                            <a
                              href={`tel:${ord.shippingDetails.phone}`}
                              className="text-zinc-300 hover:text-white font-mono"
                            >
                              {ord.shippingDetails.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-500">Phone not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DELIVERY ADDRESS */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Delivery Address</span>
                        </div>

                        <button
                          onClick={() => handleCopyLabel(ord)}
                          className="text-[11px] text-zinc-400 hover:text-[#d4af37] font-bold flex items-center gap-1 cursor-pointer"
                          title="Copy address as courier mailing label"
                        >
                          {copiedId === ord.orderId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied Label</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Label</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-1.5">
                        <div className="font-bold text-white text-sm">
                          {ord.shippingDetails?.addressLine1 || 'Address Line 1'}
                        </div>
                        {ord.shippingDetails?.addressLine2 && (
                          <div className="text-zinc-300">{ord.shippingDetails.addressLine2}</div>
                        )}
                        <div className="text-zinc-300">
                          {ord.shippingDetails?.city}
                          {ord.shippingDetails?.county ? `, Co. ${ord.shippingDetails.county}` : ''}
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="font-mono font-bold text-[#d4af37] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-xs">
                            {ord.shippingDetails?.eircodePostcode || 'Eircode N/A'}
                          </span>
                          {ord.shippingDetails?.eircodePostcode && (
                            <button
                              onClick={() =>
                                copyText(ord.shippingDetails.eircodePostcode, `eir-${ord.orderId}`)
                              }
                              className="text-zinc-500 hover:text-white"
                              title="Copy Eircode"
                            >
                              {copiedField === `eir-${ord.orderId}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-900">
                          Country: <strong className="text-zinc-200">{ord.shippingDetails?.country || 'Ireland'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. ORDER DETAILS */}
                  <div className="p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs uppercase tracking-wider">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order Details ({ord.items?.length || 0} items)</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-400">
                        Total: <strong className="text-white text-sm">{formatPrice(ord.total, ord.currency || 'EUR')}</strong>
                      </span>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 border border-zinc-850 p-3.5 space-y-2.5">
                      {(ord.items || []).map((item, idx) => {
                        const unitPrice = item.product?.price || 14.99;
                        const personalizationCost = item.personalization?.enabled ? 4.0 : 0;
                        const itemTotal = (unitPrice + personalizationCost) * item.quantity;

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 last:pb-0 border-b border-zinc-900 last:border-b-0"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{item.product?.name || 'ELITE 2.0 GLOVES'}</span>
                                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-[#d4af37]">
                                  Size {item.selectedSize || 'Standard'}
                                </span>
                                {item.selectedCut && (
                                  <span className="text-[11px] text-zinc-400 font-normal">
                                    ({item.selectedCut})
                                  </span>
                                )}
                              </div>

                              {item.personalization?.enabled && (
                                <div className="text-[11px] text-[#d4af37] font-medium flex items-center gap-1">
                                  <span>Custom Foil Print:</span>
                                  <strong className="underline">"{item.personalization.text}"</strong>
                                  <span>({item.personalization.color})</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-zinc-400">
                                Qty: <strong className="text-white">{item.quantity}</strong>
                              </span>
                              <span className="text-zinc-400">
                                Price:{' '}
                                <strong className="text-zinc-200 font-mono">
                                  {formatPrice(unitPrice + personalizationCost, ord.currency || 'EUR')}
                                </strong>
                              </span>
                              <span className="font-mono font-bold text-white text-sm">
                                {formatPrice(itemTotal, ord.currency || 'EUR')}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-2 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block">Subtotal</span>
                          <span className="font-mono text-zinc-300">
                            {formatPrice(ord.subtotal, ord.currency || 'EUR')}
                          </span>
                        </div>
                        {ord.discountAmount > 0 && (
                          <div>
                            <span className="text-zinc-500 block">Discount</span>
                            <span className="font-mono text-[#d4af37]">
                              -{formatPrice(ord.discountAmount, ord.currency || 'EUR')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-500 block">Shipping</span>
                          <span className="font-mono text-zinc-300">
                            {formatPrice(ord.shippingCost, ord.currency || 'EUR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold">Total Order Value</span>
                          <span className="font-mono font-black text-sm text-[#d4af37]">
                            {formatPrice(ord.total, ord.currency || 'EUR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. PAYMENT */}
                  <div className="p-4 sm:p-5 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Payment</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                          Payment Status
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{ord.paymentStatus || 'Completed / Paid'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                          Payment Method
                        </span>
                        <div className="text-white font-medium mt-0.5">
                          {ord.paymentMethod === 'paypal'
                            ? 'PayPal'
                            : ord.paymentMethod === 'paypal_card'
                            ? 'Debit / Credit Card (via PayPal)'
                            : 'PayPal / Debit Card'}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                          Transaction / Payment ID
                        </span>
                        <div className="font-mono text-zinc-300 text-[11px] mt-0.5 break-all">
                          {ord.paypalTransactionId || ord.paypalOrderId || 'Processed via PayPal'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. DISPATCH INFORMATION */}
                  <div className="p-4 sm:p-5 space-y-3 text-xs bg-zinc-950/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs uppercase tracking-wider">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Information</span>
                      </div>

                      {!isEditingThisOrder && (
                        <button
                          onClick={() => startEditingDispatch(ord)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-[#d4af37]" />
                          <span>Update Dispatch Info</span>
                        </button>
                      )}
                    </div>

                    {isEditingThisOrder ? (
                      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-750 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Tracking Number
                            </label>
                            <input
                              type="text"
                              value={editTrackingNumber}
                              onChange={(e) => setEditTrackingNumber(e.target.value)}
                              placeholder="e.g. CE123456789IE"
                              className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white font-mono text-xs focus:border-[#d4af37] outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Courier / Shipping Provider
                            </label>
                            <input
                              type="text"
                              value={editCarrier}
                              onChange={(e) => setEditCarrier(e.target.value)}
                              placeholder="e.g. An Post Tracked, DPD 24h Express"
                              className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white text-xs focus:border-[#d4af37] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                            Delivery Notes / Customer Instructions
                          </label>
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Leave inside porch, gate code, dispatch notes..."
                            className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white text-xs focus:border-[#d4af37] outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={cancelEditingDispatch}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingDispatch}
                            onClick={() => saveDispatchDetails(ord.orderId)}
                            className="px-4 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#c59e2b] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingDispatch ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>Save Details</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Dispatch Status
                          </span>
                          <div className="font-bold text-white capitalize mt-0.5">
                            {ord.dispatchStatus || (currentStatus === 'Dispatched' ? 'Dispatched' : 'Awaiting Dispatch')}
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Dispatch Date &amp; Time
                          </span>
                          {dispatchDateTime ? (
                            <div className="text-white mt-0.5">
                              <div className="font-medium text-xs">{dispatchDateTime.dateStr}</div>
                              <div className="text-zinc-400 font-mono text-[11px] tabular-nums">
                                {dispatchDateTime.timeStr}
                              </div>
                            </div>
                          ) : currentStatus === 'Dispatched' ? (
                            <span className="text-indigo-400 font-medium">Dispatched</span>
                          ) : (
                            <span className="text-zinc-500">Not yet dispatched</span>
                          )}
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Tracking Number
                          </span>
                          {ord.trackingNumber ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-white text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                {ord.trackingNumber}
                              </span>
                              <button
                                onClick={() => copyText(ord.trackingNumber!, `track-${ord.orderId}`)}
                                className="text-zinc-400 hover:text-white"
                                title="Copy Tracking Number"
                              >
                                {copiedField === `track-${ord.orderId}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px] block mt-0.5">
                              Tracking number not added
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                            Courier / Provider
                          </span>
                          <div className="text-zinc-200 font-medium mt-0.5">
                            {ord.carrier || ord.deliveryMethod || 'An Post Tracked'}
                          </div>
                        </div>

                        {(ord.notes || ord.shippingDetails?.deliveryNote) && (
                          <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-zinc-900">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                              Delivery Notes
                            </span>
                            <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                              {ord.notes || ord.shippingDetails?.deliveryNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
