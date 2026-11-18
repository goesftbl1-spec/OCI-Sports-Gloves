import { CartItem, Currency, Order } from '../types';

export const OWNER_ORDER_EMAILS = [
  'oisinmcgee631@gmail.com',
  'contactocisports@gmail.com',
] as const;

const sentOrderEmailIds = new Set<string>();

export function getCurrencySymbol(currency?: Currency | string): string {
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return '€';
}

export function formatOrderSizesSummary(items: CartItem[] = []): string {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Size Not Specified';
  }
  return items
    .map((it) => {
      const size = it?.selectedSize || 'N/A';
      const qty = Number(it?.quantity || 1);
      return `Size ${size} x${qty}`;
    })
    .join(', ');
}

export function formatOrderItemsDetailed(items: CartItem[] = []): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '1x ELITE 1.0 GLOVES';
  }
  return items
    .map((it) => {
      const qty = Number(it?.quantity || 1);
      const name = it?.product?.name || 'ELITE 1.0 GLOVES';
      const size = it?.selectedSize || 'N/A';
      const cut = it?.selectedCut ? `, ${it.selectedCut}` : '';
      const pers = it?.personalization?.enabled
        ? ` [Foil: "${it.personalization.text || ''}" - ${it.personalization.color || 'Gold'}]`
        : '';
      return `${qty}x ${name} — Size: ${size}${cut}${pers}`;
    })
    .join(' | ');
}

export function buildOrderEmailPayload(order: Order) {
  const sizesSummary = formatOrderSizesSummary(order.items);
  const itemsDetailed = formatOrderItemsDetailed(order.items);
  const symbol = getCurrencySymbol(order.currency);
  const totalFormatted = `${symbol}${Number(order.total || 0).toFixed(2)}`;

  return {
    _subject: `New OCI Order #${order.orderId} (${sizesSummary}) - ${totalFormatted}`,
    _template: 'table',
    _captcha: 'false',
    GloveSize: sizesSummary,
    ItemsOrdered: itemsDetailed,
    OrderID: order.orderId,
    PayPalOrderID: order.paypalOrderId || 'N/A',
    PayPalTransactionID: order.paypalTransactionId || 'N/A',
    PaymentMethod: order.paymentMethod || 'online',
    CustomerName: order.shippingDetails?.fullName || order.customerName || 'Customer',
    Email: order.shippingDetails?.email || order.customerEmail || order.payerEmail || '',
    Phone: order.shippingDetails?.phone || '',
    AddressLine1: order.shippingDetails?.addressLine1 || '',
    AddressLine2: order.shippingDetails?.addressLine2 || '',
    City: order.shippingDetails?.city || '',
    County: order.shippingDetails?.county || '',
    EircodePostcode: order.shippingDetails?.eircodePostcode || '',
    Country: order.shippingDetails?.country || '',
    DeliveryMethod: order.deliveryMethod || 'Tracked Express Delivery',
    TotalAmount: totalFormatted,
    DatePlaced: new Date().toLocaleString('en-IE'),
  };
}

export function markOrderEmailDispatched(orderId?: string): void {
  if (orderId) {
    sentOrderEmailIds.add(orderId);
  }
}

export function hasOrderEmailBeenDispatched(orderId?: string): boolean {
  return Boolean(orderId && sentOrderEmailIds.has(orderId));
}

export async function sendOrderEmailNotification(order: Order): Promise<boolean> {
  if (!order || !order.orderId) return false;
  if (sentOrderEmailIds.has(order.orderId)) return true;

  const payload = buildOrderEmailPayload(order);

  const results = await Promise.allSettled(
    OWNER_ORDER_EMAILS.map(async (recipient) => {
      const res = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return false;
      try {
        const data = await res.json();
        return data?.success !== false && data?.success !== 'false';
      } catch {
        return true;
      }
    })
  );

  const anySucceeded = results.some(
    (r) => r.status === 'fulfilled' && r.value === true
  );

  if (anySucceeded) {
    sentOrderEmailIds.add(order.orderId);
  }

  return anySucceeded;
}
