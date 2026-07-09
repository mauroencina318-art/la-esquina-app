export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API de sincronizacion: guarda y devuelve los productos de una "sala" (room code)
    if (url.pathname === '/api/sync') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const room = (url.searchParams.get('room') || '').toUpperCase().trim();
      if (!room) {
        return new Response(JSON.stringify({ error: 'Falta el codigo de sala (room)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const key = 'room:' + room;

      if (request.method === 'GET') {
        const stored = await env.SYNC_KV.get(key);
        const data = stored ? stored : JSON.stringify({ products: [], timestamp: 0 });
        return new Response(data, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: 'JSON invalido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        const payload = JSON.stringify({
          products: body.products || [],
          timestamp: body.timestamp || Date.now()
        });
        await env.SYNC_KV.put(key, payload);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response('Metodo no permitido', { status: 405, headers: corsHeaders });
    }

    // Todo lo demas (index.html, manifest.json, service-worker.js, icons, etc.)
    // se sirve como archivo estatico normal.
    return env.ASSETS.fetch(request);
  }
};
