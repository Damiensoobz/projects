# Steam "recently played" proxy

The CD Player widget needs your Steam **recently played** game. The Steam Web
API can't be called from the browser — it needs a secret key (which must never
ship in this public repo) and it sends no CORS headers. This tiny proxy holds
the key server-side and returns the JSON the site already expects.

You only need **one** of the two options below. Cloudflare Workers is the
simplest (free, no build step, one file).

---

## 0. Get a Steam key (and revoke the old one)

1. **Revoke the previously-leaked key** at <https://steamcommunity.com/dev/apikey>
   (an old key is in this repo's git history — revocation is the only real fix).
2. Generate a **new** key on that same page. Keep it secret.
3. Note your **64-bit SteamID** — it's the number in your profile URL,
   e.g. `https://steamcommunity.com/profiles/7656119XXXXXXXXXX`.
   (Already in `projects.js` as `steamConfig.steamId`; it's public, not a secret.)

---

## Option A — Cloudflare Worker (recommended)

```bash
npm install -g wrangler
cd steam-proxy
wrangler login
wrangler secret put STEAM_API_KEY   # paste the new key when prompted
wrangler secret put STEAM_ID        # paste your 64-bit SteamID
wrangler deploy
```

`wrangler deploy` prints a URL like
`https://steam-recent-proxy.<you>.workers.dev`.

Prefer no CLI? In the Cloudflare dashboard: **Workers & Pages → Create → Worker**,
paste `worker.js`, then **Settings → Variables → add `STEAM_API_KEY` and
`STEAM_ID` as encrypted secrets**, and Deploy.

## Option B — Vercel

1. Deploy the `steam-proxy/vercel/` folder as its own Vercel project.
2. In the project's **Settings → Environment Variables**, add `STEAM_API_KEY`
   and `STEAM_ID`.
3. The endpoint is `https://<project>.vercel.app/api/steam`.

---

## Final step — wire it up

Set the URL in `projects.js`:

```js
var steamConfig = {
    proxyUrl:   "https://steam-recent-proxy.<you>.workers.dev",  // ← your URL
    steamId:    "7656119XXXXXXXXXX",
    profileUrl: "https://steamcommunity.com/profiles/7656119XXXXXXXXXX",
};
```

Commit + push. The CD Player will start showing your latest game as a spinning
disc. (No `proxyUrl` → it just shows the "away" state, which is the current
behaviour.)

### Sanity check
Open the proxy URL directly in a browser — you should see JSON like:

```json
{ "response": { "total_count": 1, "games": [
  { "appid": 1245620, "name": "ELDEN RING", "playtime_2weeks": 720 }
] } }
```

If `games` is empty, you simply haven't played anything in the last two weeks.
