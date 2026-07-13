// ─────────────────────────────────────────────────────────────
//  Cloudflare Worker — Steam API proxy + a real visitor counter.
//
//  Routes:
//    ?action=recent   → GetRecentlyPlayedGames (last 2 weeks). If that comes
//                       back empty — the usual reason the widget shows the
//                       "away from the keep" static state — falls back to
//                       the all-time most recently played game from
//                       GetOwnedGames (rtime_last_played), so the widget
//                       only truly goes quiet if nothing was EVER played.
//    ?action=profile  → GetPlayerSummaries  (online status, avatar)
//    ?action=library  → GetOwnedGames  (game count)
//    ?action=hits     → increments + returns a real hit count (KV-backed,
//                       independent of the Steam secrets below)
//
//  If the widget still falls back after this, the account's "Game details"
//  privacy setting is almost certainly not Public — both endpoints above
//  require that to return anything. Check: Steam → Edit Profile → Privacy
//  Settings → Game details → Public.
//
//  Secrets (set in Cloudflare dashboard, NOT in this file):
//    STEAM_API_KEY  — https://steamcommunity.com/dev/apikey
//    STEAM_ID       — your 64-bit SteamID
//
//  Bindings:
//    HITS — a KV namespace, bound under this exact name, for the counter.
//           Workers & Pages → your worker → Settings → Bindings → KV.
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'https://damiensoobz.github.io',
    'https://www.damienbuilds.dev',
    'https://damienbuilds.dev'
];

// Reflect the request Origin when it's one of ours, or any localhost/127.0.0.1
// (any port) for local development. Anything else falls back to the primary
// production origin. Without the localhost rule, the Steam widget "dies" during
// local dev: the browser blocks the cross-origin response and the fetch throws,
// dropping the widget to its offline state. (Last.fm/GitHub send `*`, so those
// widgets keep working locally — which is why only Steam appears to break.)
function resolveOrigin(origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
    return ALLOWED_ORIGINS[0];
}

const APIS = {
    recent:  (k, id) => `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${k}&steamid=${id}&count=5&format=json`,
    profile: (k, id) => `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${k}&steamids=${id}&format=json`,
    library: (k, id) => `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${k}&steamid=${id}&include_appinfo=true&include_played_free_games=true&format=json`,
};

// Cache duration per action, in seconds. `recent`/`library` barely change
// hour to hour, so they get a big margin against Steam's rate limit (still
// generous at 100,000 calls/day, but no reason to spend them). `profile`
// stays short — that's the live online/offline dot, and a long cache there
// would show a stale status for hours.
const CACHE_TTL = { recent: 3600, library: 3600, profile: 300 };

export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get('Origin') || '';
        const cors = {
            'Access-Control-Allow-Origin': resolveOrigin(origin),
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Vary': 'Origin'
        };
        if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

        const action = new URL(request.url).searchParams.get('action') || 'recent';

        // Visitor counter — its own thing, no Steam config required.
        if (action === 'hits') return handleHits(request, env, cors);

        if (!env.STEAM_API_KEY || !env.STEAM_ID) {
            return json({ error: 'Worker not configured: set STEAM_API_KEY and STEAM_ID secrets.' }, 500, cors);
        }

        const apiBuilder = APIS[action];
        if (!apiBuilder) return json({ error: 'Unknown action: ' + action }, 400, cors);

        // Per-action edge cache key
        const cacheKey = new Request(new URL(request.url).origin + '/steam-' + action);
        const cache = caches.default;
        const hit = await cache.match(cacheKey);
        if (hit) return withCors(hit, cors);

        const ttl = CACHE_TTL[action] || 300;
        let data;
        try {
            const r = await fetch(apiBuilder(env.STEAM_API_KEY, env.STEAM_ID), { cf: { cacheTtl: ttl } });
            if (!r.ok) throw new Error('Steam API returned ' + r.status);
            data = await r.json();
            if (action === 'recent' && !(data?.response?.games?.length)) {
                data = await recentFallback(env.STEAM_API_KEY, env.STEAM_ID, data);
            }
        } catch (e) {
            return json({ response: {} }, 200, cors);
        }

        const res = json(data, 200, Object.assign({ 'Cache-Control': 'public, max-age=' + ttl }, cors));
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
    }
};

// GetRecentlyPlayedGames only looks at the last 2 weeks, which is why the
// widget so often falls back to its static state — most people don't game
// every single week. This asks GetOwnedGames for the all-time most recent
// session instead (rtime_last_played), reshaped into the same response
// shape so nothing on the client needs to change.
async function recentFallback(key, id, original) {
    try {
        const r = await fetch(APIS.library(key, id), { cf: { cacheTtl: CACHE_TTL.library } });
        if (!r.ok) return original;
        const owned = await r.json();
        const list = owned?.response?.games;
        if (!list || !list.length) return original;

        const best = list.reduce((a, b) => (b.rtime_last_played || 0) > (a.rtime_last_played || 0) ? b : a);
        if (!best.rtime_last_played) return original;   // no timestamps at all — give up gracefully

        return { response: { games: [{
            appid: best.appid,
            name: best.name,
            playtime_forever: best.playtime_forever,
            img_icon_url: best.img_icon_url
        }] } };
    } catch (e) {
        return original;
    }
}

// One real increment per visitor per day (by IP), so refreshing the page
// doesn't inflate the number — dedup marker just expires itself via TTL.
async function handleHits(request, env, cors) {
    if (!env.HITS) {
        return json({ error: 'Worker not configured: bind a KV namespace named HITS.' }, 500, cors);
    }
    const path = new URL(request.url).searchParams.get('path') || '/';
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const countKey  = 'hits:' + path;
    const dedupeKey = 'seen:' + day + ':' + ip + ':' + path;

    let count = parseInt(await env.HITS.get(countKey), 10) || 0;
    const alreadySeenToday = await env.HITS.get(dedupeKey);
    if (!alreadySeenToday) {
        count += 1;
        await env.HITS.put(countKey, String(count));
        await env.HITS.put(dedupeKey, '1', { expirationTtl: 86400 });
    }
    return json({ count }, 200, Object.assign({ 'Cache-Control': 'no-store' }, cors));
}

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
