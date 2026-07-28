# Portfolio TODO

## 🔴 Action required (only you can do these)
- [ ] **Deploy the Steam worker.** `steam-proxy/worker.js` in this repo has the
      CORS fix (allows `localhost`/`127.0.0.1` on any port), but the LIVE worker
      is still running the old code — so the Steam widget shows "the wizard is
      away from the keep" during local dev. The live site is unaffected.
      *Safest path:* Cloudflare dashboard → Workers → `rapid-feather-4bb1` →
      Edit code → paste `worker.js` → Deploy. (Preserves secrets + KV bindings.)
      *Wrangler path:* `cd steam-proxy && wrangler deploy` — only after
      uncommenting the `HITS` KV binding in `wrangler.toml`, or the visitor
      counter breaks. `name` is already set to the live worker.
- [ ] **Confirm `damien@damienbuilds.dev` is a live, monitored inbox.** Every
      "hire me" / "contact" link reads it from `contactConfig.email` in
      `projects.js` (single source of truth). If the mailbox isn't set up,
      either configure it or point `contactConfig.email` at your real one.
- [ ] **`CNAME` for the custom domain.** `damienbuilds.dev` is referenced in
      meta/links but there's no `CNAME` file in the repo — make sure the custom
      domain is set in GitHub Pages settings so it survives redeploys. Once it's
      live, revisit `canonical` + `og:url` in `index.html` (they still point at
      `damiensoobz.github.io/projects/`).

## 🟡 Open / nice to have
- [ ] **HF username typo** — the Cartographer project links to
      `huggingface.co/spaces/damienbuids/...` ("damienbuids"). The link works,
      so it's cosmetic: rename the HF account to match the brand, or leave it.
- [ ] **Unused wallpapers** — `images/` ships `wallpaper1–5.jpg` but only
      `wallpaper.jpg` is used. Either delete them, or turn it into a feature:
      right-click desktop → "Change wallpaper" cycling through the set.
- [ ] **Reintroduce the desktop helper ("Clippy")** later — removed for now;
      the previous version felt clunky.

### Kurama Browser — future features
- [ ] Working menus: File / View / Tools dropdowns (Work Offline that really
      disconnects the tray modem, View → Text Size, pop-up blocker toggle).
- [ ] `Ctrl+D` Add to Favorites (localStorage → Bookmarks sidebar) and
      `Ctrl+F` find-in-page.
- [ ] More destinations: signable guestbook, `about:kurama` version page,
      fake 56k download manager.
- [ ] UI sounds wired to the tray volume slider (finally making it do
      something), hourglass cursor, white-flash page transitions.

## 🧩 Planned: open-source template (separate repo)
Deliver a forkable "Win98 desktop portfolio" template (à la cassidoo/blahg).
- [ ] New standalone public repo (e.g. `win98-portfolio-template`), GitHub
      "template repository" enabled so others can "Use this template".
- [ ] Consolidate ALL personal data into a single `config.js`: name, tagline,
      about copy, socials, projects, contact email, API config (last.fm/github/
      steam), DOS welcome + commands, and toggles for the browser gag pages.
      (`contactConfig`, `socialConfig`, `spotifyConfig`, `githubConfig`,
      `steamConfig` already centralize most of this.)
- [ ] Replace Damien-specific copy in `index.html` (About/Notepad, DOS welcome)
      with config-driven or neutral placeholder text.
- [ ] Add `README.md` (what it is + screenshots + fork → edit config → deploy
      to GitHub Pages) and an MIT `LICENSE`.
- [ ] Keep personal screenshots optional (the placeholder generator already
      covers missing images).

## ✅ Done
- [x] **Widgets rebranded** to resemble their real counterparts, each in a
      Win98 window frame with a brand app-icon:
      - Spotify98 — dark `#121212` panel, "I'M LISTENING TO", large album art
        as the hero, green mini-EQ. Launches on startup.
      - Git98 — git-log / commit-graph in Git orange, "I'm working on <repo>",
        live streak / pushes / followers / repos stats + join year.
      - Steam98 — Steam navy capsule card, "recently played", full-width game
        banner, playtime past 2 weeks + on record.
- [x] **Kurama Browser** (was "Foxfire") — loading progress bar, link-hover
      status previews, working Stop, address-bar autocomplete + select-on-focus,
      Alt+←/→ and F5 shortcuts, double-click title bar to maximize, a real
      History dropdown with working Clear, 56k status theater, 88×31 badge wall,
      web-ring navigator.
- [x] **Ads** — 16 rotating ads across 6 distinct LAYOUTS (garage-sale flyer,
      terminal window, print memo, vaporwave horizon, roadwork banner, fake
      Win98 popup). Skin-aware picking guarantees no two ads on screen share a
      skin. All point at damienbuilds.dev.
- [x] **Authentic Win98 icons** — hand-drawn pixel SVGs (My Computer, document,
      recycle bin) + brand marks (Git, Steam, Spotify); Kurama keeps the fox.
- [x] **Boot sequence** — BIOS POST under CRT glass → Win98-style splash (flag
      logo + scrolling light-bar) → classic blue login screen.
- [x] **Tray gadgets, each doing its own thing** — dial-up modem with a real
      connect/disconnect state machine + handshake theater; Network
      Neighborhood explorer window (MOMS-PC, PRINTER-666, TOASTER); damienOS
      Defender whose "Scan Now" really scans and finds one more regret each
      time; clock → Date/Time Properties with calendar + live clock; volume.
- [x] **Steam serverless proxy** — Cloudflare Worker holds `STEAM_API_KEY` /
      `STEAM_ID` as secrets, serves recent / profile / library with CORS locked
      to the live domains (+ localhost, pending deploy). Old leaked key revoked.
- [x] **Project copy** — all six cards rewritten in a consistent voice.
- [x] **Mobile layout** — stacked reorder, uniform full-width windows, compact
      chrome, no horizontal scroll.
- [x] **Contact email centralized** in `contactConfig` (`projects.js`).
- [x] **Favicon** + **404.html** + **PWA meta** (theme-color, apple-touch-icon,
      `site.webmanifest`).
- [x] **`socialConfig` filled** — Instagram / LinkedIn / GitHub wired to desktop
      icons + Start-menu "Socials".
- [x] Committed fully to the Win98 skin; one-screen draggable desktop with a
      fixed default window layout.
- [x] Easter eggs: Minesweeper, Konami → BSOD, Restart gag, Recycle Bin.
- [x] Reduced motion: respect `prefers-reduced-motion`.
- [x] Removed: random low-memory scare popup, "remembered by damienOS" login
      hint, Steam profile footer + "view profile" link.
