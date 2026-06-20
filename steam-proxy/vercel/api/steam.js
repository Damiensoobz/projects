// ─────────────────────────────────────────────────────────────
//  Vercel serverless alternative — deploy this folder as its own
//  Vercel project; the endpoint becomes  /api/steam .
//  Set env vars STEAM_API_KEY and STEAM_ID in the Vercel dashboard.
//  Then point steamConfig.proxyUrl at  https://<project>.vercel.app/api/steam
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const key = process.env.STEAM_API_KEY;
    const id  = process.env.STEAM_ID;
    if (!key || !id) {
        return res.status(500).json({ error: 'Set STEAM_API_KEY and STEAM_ID env vars.' });
    }

    try {
        const url = 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/'
            + '?key=' + key + '&steamid=' + id + '&count=1&format=json';
        const r = await fetch(url);
        if (!r.ok) throw new Error('Steam ' + r.status);
        res.status(200).json(await r.json());
    } catch (e) {
        res.status(200).json({ response: {} });   // site falls back to "away" state
    }
}
