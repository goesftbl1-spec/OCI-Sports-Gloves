// Cloudflare Pages Function: Update Order Status
type PagesFunction<T = any> = (context: { request: Request; env: T; params?: any }) => Promise<Response> | Response;

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_PASSCODE?: string;
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, params } = context;
  const authHeader = request.headers.get('Authorization') || '';
  const tokenHeader = request.headers.get('x-admin-token') || '';
  const passcodeHeader = request.headers.get('x-admin-passcode') || '';

  const hasToken = authHeader.startsWith('Bearer ') || Boolean(tokenHeader) || Boolean(passcodeHeader);
  if (!hasToken) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: any = await request.json();
    const orderId = params.orderId;
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          orderId,
          status: body.status,
          dispatchStatus: body.dispatchStatus,
          updatedAt: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid update payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
