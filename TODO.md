# Portfolio TODO

## 🔴 Urgent — outside this repo
- [ ] **Revoke the leaked Steam API key** at https://steamcommunity.com/dev/apikey.
      An old key shipped in `projects.js` and lives in git history forever —
      revocation is the only real fix. (Code no longer reads a client-side key.)

## 🟡 Features
- [ ] **Steam serverless proxy** — small Vercel/Cloudflare Worker holding
      `STEAM_API_KEY` as an env var, returning `GetRecentlyPlayedGames` JSON with
      CORS headers + a ~5 min cache. Then set `steamConfig.proxyUrl` in
      `projects.js`. Until then the CD Player shows the "away" state (no disc).
- [ ] **Favicon** — currently none; a 16×16 pixel-art floppy/folder would fit.
- [ ] **404.html** for GitHub Pages.
- [ ] **Reintroduce the desktop helper ("Clippy")** later — removed for now;
      the previous version felt clunky.

## ✅ Recently done
- [x] Committed fully to the Win98 skin — dropped the skin switcher and all
      alternate skins (Game Boy, Dark Academia, Synthwave, original terminal).
- [x] Removed the CRT scanline/flicker overlay.
- [x] One-screen draggable desktop with a fixed default window layout.
- [x] Status apps restyled as standalone, frameless apps (Media Player,
      retro terminal, CD Player with a spinning game disc).
- [x] Easter eggs: Minesweeper, Konami → BSOD, Restart/Shut Down gags,
      Recycle Bin explorer.
- [x] Repo cleanup: deleted stray screenshots + empty files + dead CSS/JS.
- [x] Reduced motion: respect `prefers-reduced-motion`.
