# Portfolio TODO

## 🔴 Urgent — do today (outside this repo)
- [ ] **Revoke the leaked Steam API key** at https://steamcommunity.com/dev/apikey.
      The key shipped in `projects.js` and lives in git history forever — revocation
      is the only real fix. (Code no longer reads a client-side key.)

## 🟠 High value — content
- [ ] **Real project links** — `projects.js` now has the three real projects
      (snake, memento mori, map generator) but `link`/`github` are still `"#"`/`""`.
      Push each repo to GitHub, enable Pages on the two JS ones, fill in URLs.
- [ ] **Screenshots** — one per project into `/images/`, set `image:` in `projects.js`.
      This + working links is 80% of the portfolio's value.
- [ ] **Host the fantasy map generator** (Python) — see options in README/notes:
      Hugging Face Spaces (Gradio) or Render free tier; or Pyodide if the deps allow.
      Until then, link the repo and rely on screenshots.

## 🟡 Features
- [ ] **Steam serverless proxy** — small Vercel/Cloudflare Worker function holding
      `STEAM_API_KEY` as an env var, returning `GetRecentlyPlayedGames` JSON with
      CORS headers + cache (e.g. 5 min). Then set `steamConfig.proxyUrl` in
      `projects.js`. Widget currently shows a plain profile link (no setup copy).
- [ ] **CRT effect tuning** — bezel + scanlines + vignette added to both skins;
      review on a real monitor, maybe add subtle flicker/curvature if it reads well.
- [ ] **Favicon** — currently none; a 16×16 pixel-art floppy/folder would fit.
- [ ] **404.html** for GitHub Pages.

## 🟢 Housekeeping
- [ ] Remove the two `Screenshot *.png` files from the repo root (one is committed,
      one untracked) — or move into an ignored `/notes/` folder.
- [ ] `addingProjects.txt` is empty — delete or fold into this file.
- [ ] Decide fate of unused `style.css`, `style-sw.css`, `style-da.css`
      (kept per CLAUDE.md, but they're dead weight in the deploy).
- [ ] Reduced motion: respect `prefers-reduced-motion` for scramble/animations.

## ✅ Done (2026-06-13)
- [x] Default skin = Win98 (most legible) — already the default, confirmed.
- [x] Plain-English subtitles on project cards + hover bubbles (`subtitle` field).
- [x] Real project entries with honest descriptions in `projects.js`.
- [x] Steam/Spotify widgets no longer show setup instructions to visitors.
- [x] Steam client-side API key removed from code; config switched to `proxyUrl`.
- [x] Cross-link to damienbuilds.dev in the about card.
- [x] No-JS fallback (`<noscript>` project list) + static "total 3" for crawlers.
- [x] Meta description + Open Graph tags.
- [x] CRT bezel/scanline/vignette overlay on both skins.
- [x] Fixed missing `blink`/`pulse` keyframes in `style-y2k.css` (status dots never animated).
- [x] Escaped title/description/tags in `buildCard()`.
