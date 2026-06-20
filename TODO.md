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
- [ ] **Fill `socialConfig`** in `projects.js` with real Instagram/LinkedIn/
      Facebook URLs (icons are wired but inert until then).
- [ ] **Favicon** — currently none; a 16×16 pixel-art floppy/folder would fit.
- [ ] **404.html** for GitHub Pages.
- [ ] **Reintroduce the desktop helper ("Clippy")** later — removed for now;
      the previous version felt clunky.

## 🧩 Planned: open-source template (separate repo)
Deliver a forkable "Win98 desktop portfolio" template (à la cassidoo/blahg).
- [ ] New standalone public repo (e.g. `win98-portfolio-template`), GitHub
      "template repository" enabled so others can "Use this template".
- [ ] Consolidate ALL personal data into a single `config.js`: name, tagline,
      about copy, socials, projects, contact email, API config (last.fm/github/
      steam), DOS welcome + commands, and toggles for the browser gag pages.
- [ ] Replace Damien-specific copy in `index.html` (About/Notepad, DOS welcome)
      with config-driven or neutral placeholder text.
- [ ] Add `README.md` (what it is + screenshots + fork → edit `config.js` →
      deploy to GitHub Pages) and an MIT `LICENSE`.
- [ ] Keep personal screenshots optional (the placeholder generator already
      covers missing images).

## ✅ Recently done
- [x] Committed fully to the Win98 skin — dropped the skin switcher and all
      alternate skins (Game Boy, Dark Academia, Synthwave, original terminal).
- [x] Removed the CRT scanline/flicker overlay.
- [x] One-screen draggable desktop with a fixed default window layout.
- [x] Status apps restyled as standalone, frameless apps (Media Player,
      retro terminal, CD Player with a spinning game disc).
- [x] Easter eggs: Minesweeper, Konami → BSOD, Restart/Shut Down gags,
      Recycle Bin explorer.
- [x] Repo cleanup: deleted stray screenshots + empty files + dead CSS/JS;
      removed the unused Press Start 2P web font + dead GitHub-commit CSS.
- [x] IE app → real multi-page browser (`browser.js`): portfolio is home,
      plus gag pages (AltaVista search, guestbook, conspiracy, under
      construction, 404) with working Back/Forward/Refresh/Home + address bar.
- [x] Reduced motion: respect `prefers-reduced-motion`.
