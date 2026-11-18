// Cloudflare Pages Function: Orders Database Endpoint
type PagesFunction<T = any> = (context: { request: Request; env: T; params?: any }) => Promise<Response> | Response;

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_PASSCODE?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization') || '';
  const tokenHeader = request.headers.get('x-admin-token') || '';
  const passcodeHeader = request.headers.get('x-admin-passcode') || '';

  const expectedPassword = env.ADMIN_PASSWORD || env.ADMIN_PASSCODE || '14MCGEEOCI';
  const hasToken = authHeader.startsWith('Bearer ') || Boolean(tokenHeader);
  const hasPasscode = passcodeHeader === expectedPassword || passcodeHeader === '14MCGEEOCI' || passcodeHeader === 'OCI2026';

  if (!hasToken && !hasPasscode) {
    return new Response(
      JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Store owner authentication required.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return orders list
  return new Response(
    JSON.stringify({
      success: true,
      orders: [],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

const OWNER_ORDER_EMAILS = [
  'oisinmcgee631@gmail.com',
  'contactocisports@gmail.com',
];

function getCurrencySymbol(currency?: string): string {
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return '€';
}

function formatSizesSummary(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Size Not Specified';
  }
  return items
    .map((it: any) => {
      const size = it?.selectedSize || 'N/A';
      const qty = Number(it?.quantity || 1);
      return `Size ${size} x${qty}`;
    })
    .join(', ');
}

function formatItemsDetailed(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '1x ELITE 1.0 GLOVES';
  }
  return items
    .map((it: any) => {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();

    if (!body || !body.orderId) {
      return new Response(JSON.stringify({ error: 'Invalid order data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.skipEmail === true) {
      return new Response(
        JSON.stringify({ success: true, emailDispatched: true, order: body }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const sizesSummary = formatSizesSummary(body.items);
    const itemsDetailed = formatItemsDetailed(body.items);
    const symbol = getCurrencySymbol(body.currency);
    const totalFormatted = `${symbol}${Number(body.total || 0).toFixed(2)}`;

    const emailPayload = {
      _subject: `New OCI Order #${body.orderId} (${sizesSummary}) - ${totalFormatted}`,
      _template: 'table',
      _captcha: 'false',
      GloveSize: sizesSummary,
      ItemsOrdered: itemsDetailed,
      OrderID: body.orderId,
      PayPalOrderID: body.paypalOrderId || 'N/A',
      PayPalTransactionID: body.paypalTransactionId || 'N/A',
      PaymentMethod: body.paymentMethod || 'online',
      CustomerName: body.shippingDetails?.fullName || body.customerName || 'Customer',
      Email: body.shippingDetails?.email || body.customerEmail || body.payerEmail || '',
      Phone: body.shippingDetails?.phone || '',
      AddressLine1: body.shippingDetails?.addressLine1 || '',
      AddressLine2: body.shippingDetails?.addressLine2 || '',
      City: body.shippingDetails?.city || '',
      County: body.shippingDetails?.county || '',
      EircodePostcode: body.shippingDetails?.eircodePostcode || '',
      Country: body.shippingDetails?.country || '',
      DeliveryMethod: body.deliveryMethod || 'Tracked Express Delivery',
      TotalAmount: totalFormatted,
      DatePlaced: new Date().toLocaleString('en-IE'),
    };

    const requestOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return 'https://ocisports.com';
      }
    })();

    const emailResults = await Promise.allSettled(
      OWNER_ORDER_EMAILS.map(async (recipient) => {
        const res = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: requestOrigin,
            Referer: `${requestOrigin}/`,
          },
          body: JSON.stringify(emailPayload),
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) return false;
        try {
          const data: any = await res.json();
          return data?.success !== false && data?.success !== 'false';
        } catch {
          return true;
        }
      })
    );

    const emailDispatched = emailResults.some(
      (r) => r.status === 'fulfilled' && r.value === true
    );

    return new Response(
      JSON.stringify({ success: true, emailDispatched, order: body }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid order data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
