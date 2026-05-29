(function () {
    // ── Footer year ────────────────────────────────────────────
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    // ── Projects ────────────────────────────────────────────────
    const grid  = document.getElementById('cards-grid');
    const count = document.getElementById('project-count');

    if (typeof projects === 'undefined' || projects.length === 0) {
        grid.innerHTML = '<p class="empty-state">// no modules found — database may be offline</p>';
    } else {
        if (count) count.textContent = projects.length;
        grid.innerHTML = projects.map(buildCard).join('');
    }

    function buildCard(project, index) {
        const img     = project.image || makePlaceholder(project.title, index);
        const hasLink = project.link && project.link !== '#';
        const aAttrs  = hasLink
            ? `href="${project.link}" target="_blank" rel="noopener noreferrer"`
            : `href="#"`;

        const tags = (project.tags || [])
            .map(t => `<span class="bubble-tag">${t}</span>`)
            .join('');

        const ghLink = project.github
            ? `<a class="bubble-gh" href="${esc(project.github)}" target="_blank" rel="noopener noreferrer">` +
              `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>` +
              ` view source ↗</a>`
            : '';

        return `
<article class="card" style="animation-delay:${index * 0.07 + 0.1}s">
  <span class="card-corner tl">&#x250C;</span>
  <span class="card-corner tr">&#x2510;</span>
  <span class="card-corner bl">&#x2514;</span>
  <span class="card-corner br">&#x2518;</span>

  <a ${aAttrs} class="card-link" aria-label="${project.title}">
    <img class="card-img" src="${img}" alt="${project.title}">
    <div class="card-footer">
      <h3 class="card-title">${project.title}</h3>
    </div>
  </a>

  <div class="speech-bubble" role="tooltip">
    <div class="bubble-inner">
      <p>${project.description}</p>
      ${tags ? `<div class="bubble-tags">${tags}</div>` : ''}
      ${ghLink}
    </div>
  </div>
</article>`;
    }

    // Terminal-style placeholder SVG
    function makePlaceholder(title, index) {
        const colors  = ['#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#f44747', '#9cdcfe'];
        const color   = colors[index % colors.length];
        const letter  = (title.trim()[0] || '?').toUpperCase();
        const gid     = 'f' + index;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="155">
  <defs>
    <filter id="${gid}"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="p${index}" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="0.7" fill="${color}" opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="400" height="155" fill="#0c0c0c"/>
  <rect width="400" height="155" fill="url(#p${index})"/>
  <text x="10"  y="20"  font-family="monospace" font-size="11" fill="${color}" opacity="0.35">&#x250C;&#x2500;&#x2500;</text>
  <text x="390" y="20"  font-family="monospace" font-size="11" fill="${color}" opacity="0.35" text-anchor="end">&#x2500;&#x2500;&#x2510;</text>
  <text x="10"  y="150" font-family="monospace" font-size="11" fill="${color}" opacity="0.35">&#x2514;&#x2500;&#x2500;</text>
  <text x="390" y="150" font-family="monospace" font-size="11" fill="${color}" opacity="0.35" text-anchor="end">&#x2500;&#x2500;&#x2518;</text>
  <text x="200" y="95"  font-family="monospace" font-size="64" fill="${color}" text-anchor="middle" filter="url(#${gid})" opacity="0.88">${letter}</text>
  <text x="200" y="138" font-family="monospace" font-size="9"  fill="${color}" text-anchor="middle" opacity="0.3" letter-spacing="5">// MODULE //</text>
</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // ── Spotify widget ──────────────────────────────────────────
    const spotifyEl = document.getElementById('spotify-widget');
    const cfg = (typeof spotifyConfig !== 'undefined') ? spotifyConfig : {};

    if (cfg.lastfmUser && cfg.lastfmKey) {
        spotifyEl.innerHTML = '<p class="sp-loading out dim">> connecting...</p>';
        fetchNowPlaying(cfg.lastfmUser, cfg.lastfmKey);
    } else {
        renderSpotifyStatic(cfg.profileUrl || '');
    }

    function fetchNowPlaying(user, key) {
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}&format=json&limit=1`;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                const tracks = data?.recenttracks?.track;
                if (!tracks || tracks.length === 0) { renderSpotifyStatic(cfg.profileUrl); return; }
                const track    = Array.isArray(tracks) ? tracks[0] : tracks;
                const playing  = track['@attr']?.nowplaying === 'true';
                const name     = track.name || '—';
                const artist   = track.artist?.['#text'] || '—';
                renderSpotifyTrack(name, artist, playing, cfg.profileUrl);
            })
            .catch(() => renderSpotifyStatic(cfg.profileUrl));
    }

    function renderSpotifyTrack(name, artist, playing, profileUrl) {
        const statusText = playing ? 'now playing' : 'last played';
        spotifyEl.innerHTML = `
<div class="sp-panel${playing ? ' playing' : ''}">
  <div class="sp-status"><span class="sp-dot"></span>${statusText}</div>
  <div class="sp-track">${esc(name)}</div>
  <div class="sp-artist">${esc(artist)}</div>
  ${profileUrl ? spotifyLinkHtml(profileUrl, 'open spotify') : ''}
</div>`;
    }

    function renderSpotifyStatic(profileUrl) {
        spotifyEl.innerHTML = `
<div class="sp-panel">
  <div class="sp-status"><span class="sp-dot"></span>spotify</div>
  ${profileUrl
    ? `<p class="out" style="margin-bottom:10px">link your Last.fm to show now playing &mdash; see <code>projects.js</code></p>${spotifyLinkHtml(profileUrl, 'open profile')}`
    : `<p class="sp-error">add your <code>profileUrl</code> and Last.fm credentials in <code>projects.js</code> to enable this widget</p>`
  }
</div>`;
    }

    function spotifyLinkHtml(url, label) {
        return `<a class="sp-link" href="${url}" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
  ${label} ↗
</a>`;
    }

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

})();
