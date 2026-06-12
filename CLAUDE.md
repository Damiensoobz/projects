# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio for **Damien** (GitHub: Damiensoobz). Fully static — no build step, no framework, no bundler. HTML + vanilla JS + CSS served directly. Deployed on **GitHub Pages** at `https://damiensoobz.github.io/projects` from the `main` branch root.

## Running locally

```bash
npx serve -p 3200 .
```

Configured in `.claude/launch.json` as the `portfolio` preview server. Use the `preview_start("portfolio")` MCP tool to launch it and `preview_screenshot` / `preview_eval` to inspect visually.

## Architecture

### Theming system

CSS-only theme switching via `<link id="main-style">` href swap in `theme.js`. **Only 2 active skins:**

| Key | File | Toggle label |
|-----|------|--------------|
| `y2k` | `style-y2k.css` | Switch Skin *(default)* |
| `gameboy` | `style-gb.css` | > SWITCH SKIN |

`index.html` loads `style-y2k.css` by default. `theme.js` reads/writes `localStorage('skin')` and calls `window.triggerScramble()` (defined in `app.js`) on every switch.

Files `style.css`, `style-sw.css`, and `style-da.css` still exist but are **not wired to any skin** — do not delete, but no need to maintain them.

### Data / configuration — `projects.js`

All user-editable content lives here. Three `var` globals consumed by `app.js`:

- **`projects[]`** — array of `{ title, subtitle, description, image, link, github, tags }`. `subtitle` is the plain-English one-liner shown under the title and atop the hover bubble. `image: ""` auto-generates a placeholder SVG. `github: ""` hides the "view source" bubble link.
- **`spotifyConfig`** — Last.fm credentials (`lastfmUser: "damiensoobz"`, `lastfmKey` present). Fetches via Last.fm API, displays Spotify now-playing.
- **`githubConfig`** — `username: "Damiensoobz"`, no API key needed (public events API).
- **`steamConfig`** — `proxyUrl` (serverless endpoint holding the Steam key server-side; empty = widget shows a static profile link) and `steamId: "76561198823151635"`. **Never put an API key in this file — the repo is public.**

### JavaScript — `app.js`

Single IIFE. Execution order:
1. Footer year
2. ASCII name scramble (`window.triggerScramble` exposed globally)
3. Projects grid — `buildCard()` generates card + speech-bubble HTML; `makePlaceholder()` generates dark SVG placeholder with project initial
4. Spotify widget — `fetchNowPlaying()` → Last.fm API
5. GitHub widget — `fetchGithubPush()` → GitHub Events API, extracts branch + 7-char SHA
6. Steam widget — `fetchSteamRecent()` → `steamConfig.proxyUrl` (serverless proxy) → Steam API JSON

SVG icon constants (`GH_ICON`, `BRANCH_ICON`, `STEAM_ICON`) defined at the widget section with explicit `width`/`height` attributes — required so they render at correct size in all skins.

### HTML — `index.html`

Four `<section class="block">` elements: welcome (ASCII art), about, projects, status--live. One footer `<div class="block footer-block">`. Script load order: `projects.js` → `app.js` → `theme.js`.

The `status--live` section contains `.status-grid` with three widget divs: `#spotify-widget`, `#github-widget`, `#steam-widget` side-by-side.

### CSS conventions

Each skin is a **complete, self-contained stylesheet** — no shared base. When adding a new CSS class, it must be added to **both** `style-y2k.css` and `style-gb.css`.

**Win98 skin (`style-y2k.css`) key patterns:**
- Raised 3D borders: `border-top/left: 2px solid #ffffff; border-right/bottom: 2px solid #404040`
- Blue title bars: `linear-gradient(to right, #000080, #1084d0)`
- `.status-grid > *` are flex containers so inner panels (`flex: 1`) auto-equalize height
- GitHub widget body: dark `#0d1117` / `#161b22` — GitHub dark mode colors
- Steam widget body: Steam navy `#1b2838` with store gradient title
- SVG icons in title bars use `content: url("data:image/svg+xml,...")` with `shape-rendering='crispEdges'`
- Folder cards: `::before` tab (62px wide, -14px top), `::after` and `::before` not used on `.block`

**Gameboy skin (`style-gb.css`) key patterns:**
- Palette: `#9bbc0f` · `#8bac0f` · `#306230` · `#0f380f`
- `image-rendering: pixelated` throughout
- Font: `'Press Start 2P'` for all UI chrome, `'Courier New'` for ASCII art

## Deployment

```bash
git add <files>
git commit -m "message"
git push
```

GitHub Pages auto-deploys from `main` root. CDN cache can take 2–5 minutes to propagate after push.
