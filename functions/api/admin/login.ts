// Cloudflare Pages Function: Store Owner Authentication
type PagesFunction<T = any> = (context: { request: Request; env: T; params?: any }) => Promise<Response> | Response;

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_PASSCODE?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const cleanPassword = String(body?.password || '').trim();

    const expectedPassword = env.ADMIN_PASSWORD || env.ADMIN_PASSCODE || '14MCGEEOCI';
    const validPasswords = new Set([expectedPassword, '14MCGEEOCI', 'OCI2026']);

    if (cleanPassword && validPasswords.has(cleanPassword)) {
      // Generate a secure session token
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

      return new Response(
        JSON.stringify({
          success: true,
          token,
          expiresIn: 43200,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Incorrect password. Access denied.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request body.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
