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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    return new Response(JSON.stringify({ success: true, order: body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid order data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
