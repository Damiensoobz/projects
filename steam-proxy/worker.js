// ─────────────────────────────────────────────────────────────
//  Cloudflare Worker — Steam "recently played" proxy.
//
//  Holds the Steam Web API key server-side (as a secret) so it
//  never ships to the browser, and adds the CORS headers Steam
//  itself doesn't send. Returns GetRecentlyPlayedGames JSON as-is;
//  the site reads data.response.games[0].
//
//  Set two secrets (NOT in this file):
//    STEAM_API_KEY  — from https://steamcommunity.com/dev/apikey
//    STEAM_ID       — your 64-bit SteamID (public; e.g. 7656119…)
//  Then set steamConfig.proxyUrl in projects.js to this Worker's URL.
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'https://damiensoobz.github.io',
    'https://www.damienbuilds.dev',
    'https://damienbuilds.dev'
];

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

        // 5-minute edge cache so we never hammer the Steam API.
        const cacheKey = new Request(new URL(request.url).origin + '/steam-recent');
        const cache = caches.default;
        const hit = await cache.match(cacheKey);
        if (hit) return withCors(hit, cors);

        const api = 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/'
            + '?key=' + env.STEAM_API_KEY
            + '&steamid=' + env.STEAM_ID
            + '&count=1&format=json';

        let data;
        try {
            const r = await fetch(api, { cf: { cacheTtl: 300 } });
            if (!r.ok) throw new Error('Steam ' + r.status);
            data = await r.json();
        } catch (e) {
            // Hand back an empty response so the site shows its "away" state.
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
