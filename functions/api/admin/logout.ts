// Cloudflare Pages Function: Store Owner Logout
type PagesFunction<T = any> = (context?: { request: Request; env: T; params?: any }) => Promise<Response> | Response;

export const onRequestPost: PagesFunction = async () => {
  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
