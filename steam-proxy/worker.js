// ─────────────────────────────────────────────────────────────
//  Cloudflare Worker — Steam API proxy.
//
//  Routes:
//    ?action=recent   → GetRecentlyPlayedGames  (default)
//    ?action=profile  → GetPlayerSummaries  (online status, avatar)
//    ?action=library  → GetOwnedGames  (game count)
//
//  Secrets (set in Cloudflare dashboard, NOT in this file):
//    STEAM_API_KEY  — https://steamcommunity.com/dev/apikey
//    STEAM_ID       — your 64-bit SteamID
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'https://damiensoobz.github.io',
    'https://www.damienbuilds.dev',
    'https://damienbuilds.dev'
];

const APIS = {
    recent:  (k, id) => `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${k}&steamid=${id}&count=5&format=json`,
    profile: (k, id) => `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${k}&steamids=${id}&format=json`,
    library: (k, id) => `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${k}&steamid=${id}&include_appinfo=false&include_played_free_games=true&format=json`,
};

export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get('Origin') || '';
        const cors = {
            'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Vary': 'Origin'
        };
        if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

        if (!env.STEAM_API_KEY || !env.STEAM_ID) {
            return json({ error: 'Worker not configured: set STEAM_API_KEY and STEAM_ID secrets.' }, 500, cors);
        }

        const action = new URL(request.url).searchParams.get('action') || 'recent';
        const apiBuilder = APIS[action];
        if (!apiBuilder) return json({ error: 'Unknown action: ' + action }, 400, cors);

        // Per-action edge cache key
        const cacheKey = new Request(new URL(request.url).origin + '/steam-' + action);
        const cache = caches.default;
        const hit = await cache.match(cacheKey);
        if (hit) return withCors(hit, cors);

        let data;
        try {
            const r = await fetch(apiBuilder(env.STEAM_API_KEY, env.STEAM_ID), { cf: { cacheTtl: 300 } });
            if (!r.ok) throw new Error('Steam API returned ' + r.status);
            data = await r.json();
        } catch (e) {
            return json({ response: {} }, 200, cors);
        }

        const res = json(data, 200, Object.assign({ 'Cache-Control': 'public, max-age=300' }, cors));
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
    }
};

function json(obj, status, headers) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
    });
}
function withCors(res, cors) {
    const h = new Headers(res.headers);
    for (const k in cors) h.set(k, cors[k]);
    return new Response(res.body, { status: res.status, headers: h });
}
