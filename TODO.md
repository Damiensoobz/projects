# Portfolio TODO

## 🟡 Open
- [ ] **Confirm `damien@damienbuilds.dev` is a live, monitored inbox.** Every
      "hire me" / "contact" link now reads it from `contactConfig.email` in
      `projects.js` (single source of truth). If the domain mailbox isn't set
      up, either configure it or point `contactConfig.email` at your real one.
- [ ] **`CNAME` for the custom domain.** `damienbuilds.dev` is referenced in
      meta/links but there's no `CNAME` file in the repo — make sure the custom
      domain is set in GitHub Pages settings so it survives redeploys.
- [ ] **Reintroduce the desktop helper ("Clippy")** later — removed for now;
      the previous version felt clunky.

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
- [x] **Steam serverless proxy** — Cloudflare Worker live at
      `rapid-feather-4bb1`, holds `STEAM_API_KEY`/`STEAM_ID` as secrets, serves
      recent / profile / library endpoints with CORS locked to the live domains.
      Old leaked key revoked; new key is server-side only.
- [x] **Steam widget** — vinyl-record disc with full-cover game art, online
      status + avatar + library count footer, spin pauses when off-screen.
- [x] **Contact email centralized** in `contactConfig` (`projects.js`).
- [x] **Favicon** (`favicon.svg`) + **404.html** + **PWA meta** (theme-color,
      apple-touch-icon, `site.webmanifest`).
- [x] **`socialConfig` filled** — Instagram / LinkedIn / Facebook / GitHub wired
      to desktop icons + Start-menu "Socials".
- [x] **Mobile layout** — stacked reorder (prompt → projects → about → apps),
      compact IE chrome, centered fixed "Activate" footer, no horizontal scroll.
- [x] **GitHub terminal** — activity feed + streak, most-active repo, language
      chips.
- [x] Committed fully to the Win98 skin; one-screen draggable desktop with a
      fixed default window layout.
- [x] Easter eggs: Minesweeper, Konami → BSOD, Restart gag, Recycle Bin.
- [x] IE app → real multi-page browser (`browser.js`) with gag pages + working
      Back/Forward/Refresh/Home + address bar.
- [x] Reduced motion: respect `prefers-reduced-motion`.
