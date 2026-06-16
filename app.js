(function () {
    // ── Footer year ────────────────────────────────────────────
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    // ── ASCII name scramble — hover or load to decode ───────────
    var _reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var _art  = document.querySelector('.ascii-art');
    if (_art) {
        var _orig = _art.textContent;
        var _pool = '▓▒░▄▀◆●★#@$%!?><~^*+';
        var _busy = false;

        function _scramble() {
            if (_busy || _reduceMotion) return;   // honor reduced-motion: leave the name decoded
            _busy = true;
            var chars = _orig.split('');
            var idxs  = chars.reduce(function(a, c, i) {
                if (c !== ' ' && c !== '\n' && c !== '\r') a.push(i);
                return a;
            }, []);
            // Random reveal order so it doesn't just sweep left-to-right
            var order = idxs.slice().sort(function() { return Math.random() - 0.5; });
            var done  = {};
            var f = 0, totalF = 44;

            (function tick() {
                var rev = Math.floor(f / totalF * order.length);
                for (var k = 0; k < rev; k++) done[order[k]] = 1;
                _art.textContent = chars.map(function(c, i) {
                    if (c === ' ' || c === '\n' || c === '\r') return c;
                    return done[i] ? c : _pool[Math.floor(Math.random() * _pool.length)];
                }).join('');
                if (++f <= totalF) requestAnimationFrame(tick);
                else { _art.textContent = _orig; _busy = false; }
            })();
        }

        _scramble();                             // auto-run on load
        _art.style.cursor = 'crosshair';
        _art.addEventListener('mouseenter', _scramble);  // hover to re-trigger
        window.triggerScramble = _scramble;      // expose for theme switcher
    }

    // ── Projects ────────────────────────────────────────────────
    const grid  = document.getElementById('cards-grid');
    const count = document.getElementById('project-count');

    if (typeof projects === 'undefined' || projects.length === 0) {
        grid.innerHTML = '<p class="empty-state">// no modules found — database may be offline</p>';
    } else {
        if (count) count.textContent = projects.length;
        grid.innerHTML = projects.map(buildCard).join('');
        hydrateCommits();
    }

    // Extract "owner/repo" from a GitHub URL.
    function repoSlug(url) {
        var m = /github\.com\/([^\/]+\/[^\/]+)/.exec(url || '');
        return m ? m[1].replace(/\.git$/, '') : '';
    }

    // Small sessionStorage-cached JSON fetch (keeps us well under GitHub's
    // 60 req/hr unauthenticated limit across reloads).
    function cachedJson(url, ttl) {
        try {
            var raw = sessionStorage.getItem('gh:' + url);
            if (raw) { var o = JSON.parse(raw); if (Date.now() - o.t < ttl) return Promise.resolve(o.d); }
        } catch (e) {}
        return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (d) { try { sessionStorage.setItem('gh:' + url, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} return d; });
    }

    // Fill each card's "last commit" line from its repo's latest commit.
    function hydrateCommits() {
        [].forEach.call(document.querySelectorAll('.card-commit[data-repo]'), function (el) {
            var slug = el.getAttribute('data-repo');
            if (!slug) return;
            cachedJson('https://api.github.com/repos/' + slug + '/commits?per_page=1', 600000)
                .then(function (arr) {
                    var c = arr && arr[0];
                    if (!c || !c.commit) return;
                    var msg  = c.commit.message.split('\n')[0];
                    var sha  = (c.sha || '').substring(0, 7);
                    var date = c.commit.author && c.commit.author.date;
                    var when = date ? timeAgo(new Date(date)) : '';
                    var url  = c.html_url || ('https://github.com/' + slug);
                    el.innerHTML =
                        '<span class="cc-label">last commit</span> ' +
                        (sha ? '<a class="cc-sha" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(sha) + '</a> ' : '') +
                        '<span class="cc-msg">' + esc(msg) + '</span>' +
                        (when ? ' <span class="cc-time">· ' + esc(when) + '</span>' : '');
                    el.hidden = false;
                })
                .catch(function () { /* leave the line hidden on error */ });
        });
    }

    function buildCard(project, index) {
        const hasLink = project.link && project.link !== '#';
        const img     = project.image ? esc(project.image) : makePlaceholder(project.title, index);
        const slug    = repoSlug(project.github);

        const tags = (project.tags || [])
            .map(t => `<span class="card-tag">${esc(t)}</span>`)
            .join('')
            + (project.mobile ? `<span class="card-tag card-tag-mobile">Mobile Friendly</span>` : '');

        const demoLink = hasLink
            ? `<a class="card-demo" href="${esc(project.link)}" target="_blank" rel="noopener noreferrer">` +
              `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.252.027A2 2 0 0 1 7 9.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/><path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"/></svg>` +
              ` live demo ↗</a>`
            : '';

        const ghLink = project.github
            ? `<a class="card-gh" href="${esc(project.github)}" target="_blank" rel="noopener noreferrer">` +
              `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>` +
              ` view source ↗</a>`
            : '';

        const links = (demoLink || ghLink)
            ? `<div class="card-links">${demoLink}${ghLink}</div>`
            : '';

        // Screenshot is a link when there's a demo, otherwise a plain frame
        const shotTag   = hasLink ? 'a' : 'div';
        const shotAttrs = hasLink
            ? ` href="${esc(project.link)}" target="_blank" rel="noopener noreferrer"`
            : '';

        return `
<article class="card" style="animation-delay:${index * 0.07 + 0.1}s">
  <div class="card-bar">
    <h3 class="card-title">${esc(project.title)}</h3>
  </div>
  <div class="card-main">
    <${shotTag} class="card-shot"${shotAttrs} aria-label="${esc(project.title)} screenshot">
      <img class="card-img" src="${img}" alt="${esc(project.title)} screenshot" loading="lazy">
    </${shotTag}>
    <div class="card-body">
      ${project.subtitle ? `<p class="card-subtitle">${esc(project.subtitle)}</p>` : ''}
      <p class="card-desc">${esc(project.description)}</p>
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      ${slug ? `<p class="card-commit" data-repo="${esc(slug)}" hidden></p>` : ''}
      ${links}
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
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}&format=json&limit=5`;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                let tracks = data?.recenttracks?.track;
                if (!tracks) { renderSpotifyStatic(cfg.profileUrl); return; }
                if (!Array.isArray(tracks)) tracks = [tracks];
                if (tracks.length === 0) { renderSpotifyStatic(cfg.profileUrl); return; }
                renderSpotifyTracks(tracks, cfg.profileUrl);
            })
            .catch(() => renderSpotifyStatic(cfg.profileUrl));
    }

    // Largest non-placeholder cover Last.fm offers for a track.
    function lfmArt(track) {
        const imgs = track.image || [];
        let url = '';
        for (let i = imgs.length - 1; i >= 0; i--) { if (imgs[i] && imgs[i]['#text']) { url = imgs[i]['#text']; break; } }
        if (/2a96cbd8b46e442fc41c2b86b821562f/.test(url)) return '';   // Last.fm "no art" star
        return url;
    }

    function renderSpotifyTracks(tracks, profileUrl) {
        const first   = tracks[0];
        const playing  = first['@attr']?.nowplaying === 'true';
        const name     = first.name || '—';
        const artist   = first.artist?.['#text'] || '—';
        const art      = lfmArt(first);
        const status   = playing ? 'now playing' : 'last played';
        const rows = tracks.slice(0, 5).map((t, i) => {
            const n = t.name || '—';
            const a = t.artist?.['#text'] || '';
            return `<li class="sp-row${i === 0 ? ' on' : ''}"><span class="sp-row-name">${esc(n)}</span><span class="sp-row-artist">${esc(a)}</span></li>`;
        }).join('');
        spotifyEl.innerHTML = `
<div class="sp-panel${playing ? ' playing' : ''}">
  <div class="sp-now">
    ${art ? `<img class="sp-art" src="${esc(art)}" alt="" loading="lazy">` : '<div class="sp-art sp-art-empty"></div>'}
    <div class="sp-meta">
      <div class="sp-status"><span class="sp-dot"></span>${status}</div>
      <div class="sp-track">${esc(name)}</div>
      <div class="sp-artist">${esc(artist)}</div>
    </div>
  </div>
  <ol class="sp-list">${rows}</ol>
  ${profileUrl ? spotifyLinkHtml(profileUrl, 'open spotify') : ''}
</div>`;
    }

    function renderSpotifyStatic(profileUrl) {
        spotifyEl.innerHTML = `
<div class="sp-panel">
  <div class="sp-status"><span class="sp-dot"></span>spotify</div>
  <div class="sp-artist">signal lost &mdash; the bards are resting</div>
  ${profileUrl ? spotifyLinkHtml(profileUrl, 'open spotify') : ''}
</div>`;
    }

    function spotifyLinkHtml(url, label) {
        return `<a class="sp-link" href="${url}" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
  ${label} ↗
</a>`;
    }

    // ── GitHub last push widget ──────────────────────────────────
    var ghEl  = document.getElementById('github-widget');
    var ghCfg = (typeof githubConfig !== 'undefined') ? githubConfig : {};

    if (ghEl && ghCfg.username) {
        ghEl.innerHTML = '<p class="sp-loading out dim">> connecting to github...</p>';
        fetchGithubPush(ghCfg.username, ghCfg.profileUrl);
    }

    var GH_ICON     = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
    var BRANCH_ICON = '<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>';
    var STEAM_ICON  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>';

    function fetchGithubPush(username, profileUrl) {
        fetch('https://api.github.com/users/' + encodeURIComponent(username) + '/events?per_page=15')
            .then(function(r) { return r.json(); })
            .then(function(events) {
                if (!Array.isArray(events)) { renderGithubStatic(username, profileUrl); return; }
                var push = null;
                for (var i = 0; i < events.length; i++) {
                    if (events[i].type === 'PushEvent') { push = events[i]; break; }
                }
                if (!push) { renderGithubStatic(username, profileUrl); return; }

                // GitHub's events API no longer includes the per-commit `commits`
                // array in PushEvent payloads — only ref/head/before. So derive the
                // SHA from payload.head and fetch the message from the commits API.
                var p         = push.payload || {};
                var commits   = p.commits || [];
                var last      = commits.length ? commits[commits.length - 1] : null;
                var fullSha   = (last && last.sha) || p.head || '';
                var sha       = fullSha ? fullSha.substring(0, 7) : '';
                var branch    = p.ref ? p.ref.replace('refs/heads/', '') : '';
                var repo      = push.repo.name.split('/')[1];
                var repoUrl   = 'https://github.com/' + push.repo.name;
                var commitUrl = fullSha ? repoUrl + '/commit/' + fullSha : repoUrl;
                var when      = timeAgo(new Date(push.created_at));
                var inlineMsg = (last && last.message) ? last.message.split('\n')[0] : '';

                if (inlineMsg) {
                    renderGithubPush(repo, inlineMsg, sha, branch, when, repoUrl, commitUrl);
                    return;
                }
                // No message in the event — fetch it from the commit itself.
                if (fullSha) {
                    fetch('https://api.github.com/repos/' + push.repo.name + '/commits/' + fullSha)
                        .then(function(r) { return r.ok ? r.json() : null; })
                        .then(function(data) {
                            var msg = (data && data.commit && data.commit.message)
                                ? data.commit.message.split('\n')[0] : '';
                            renderGithubPush(repo, msg, sha, branch, when, repoUrl, commitUrl);
                        })
                        .catch(function() { renderGithubPush(repo, '', sha, branch, when, repoUrl, commitUrl); });
                } else {
                    renderGithubPush(repo, '', sha, branch, when, repoUrl, commitUrl);
                }
            })
            .catch(function() { renderGithubStatic(username, profileUrl); });
    }

    function renderGithubPush(repo, msg, sha, branch, when, repoUrl, commitUrl) {
        ghEl.innerHTML =
            '<div class="gh-panel active">' +
                '<div class="gh-status"><span class="gh-dot"></span>last push</div>' +
                '<div class="gh-repo">' + GH_ICON + esc(repo) + '</div>' +
                (branch ? '<div class="gh-branch">' + BRANCH_ICON + esc(branch) + '</div>' : '') +
                '<div class="gh-commit">' +
                    (sha ? '<a class="gh-sha" href="' + esc(commitUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(sha) + '</a> ' : '') +
                    esc(msg) +
                '</div>' +
                '<div class="gh-meta">' +
                    '<span class="gh-time">' + esc(when) + '</span>' +
                    '<a class="gh-link" href="' + esc(repoUrl) + '" target="_blank" rel="noopener noreferrer">' + GH_ICON + 'view repo ↗</a>' +
                '</div>' +
            '</div>';
    }

    function renderGithubStatic(username, profileUrl) {
        ghEl.innerHTML =
            '<div class="gh-panel">' +
                '<div class="gh-status"><span class="gh-dot"></span>github</div>' +
                (profileUrl
                    ? '<a class="gh-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener noreferrer">view profile ↗</a>'
                    : '<p class="sp-error">no recent activity found</p>') +
            '</div>';
    }

    // ── Steam recently played widget ─────────────────────────────
    var stEl  = document.getElementById('steam-widget');
    var stCfg = (typeof steamConfig !== 'undefined') ? steamConfig : {};

    if (stEl && stCfg.proxyUrl) {
        stEl.innerHTML = '<p class="sp-loading out dim">> connecting to steam...</p>';
        fetchSteamRecent(stCfg.proxyUrl, stCfg.profileUrl);
    } else if (stEl) {
        renderSteamStatic(stCfg.profileUrl || '');
    }

    function fetchSteamRecent(proxyUrl, profileUrl) {
        // proxyUrl is a serverless endpoint that holds the Steam key
        // server-side and returns GetRecentlyPlayedGames JSON as-is
        fetch(proxyUrl)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var games = data && data.response && data.response.games;
                if (!games || games.length === 0) { renderSteamStatic(profileUrl); return; }
                var g   = games[0];
                var hrs = g.playtime_2weeks
                    ? (Math.round(g.playtime_2weeks / 6) / 10)   // minutes → hours, 1 dp
                    : 0;
                renderSteamGame(g.name, g.appid, hrs, profileUrl);
            })
            .catch(function() { renderSteamStatic(profileUrl); });
    }

    function renderSteamGame(name, appId, hrs, profileUrl) {
        var storeUrl = 'https://store.steampowered.com/app/' + appId + '/';
        var imgUrl   = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appId + '/header.jpg';
        stEl.innerHTML =
            '<div class="steam-panel active">' +
                '<div class="steam-status"><span class="steam-dot"></span>recently played</div>' +
                '<a href="' + esc(storeUrl) + '" target="_blank" rel="noopener noreferrer" tabindex="-1">' +
                    '<img class="steam-img" src="' + esc(imgUrl) + '" alt="' + esc(name) + '" loading="lazy">' +
                '</a>' +
                '<div class="steam-info">' +
                    '<div class="steam-game">' + esc(name) + '</div>' +
                    '<div class="steam-meta">' + hrs + ' hrs past 2 weeks</div>' +
                    (profileUrl
                        ? '<a class="steam-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener noreferrer">' + STEAM_ICON + 'steam profile ↗</a>'
                        : '') +
                '</div>' +
            '</div>';
    }

    function renderSteamStatic(profileUrl) {
        stEl.innerHTML =
            '<div class="steam-panel">' +
                '<div class="steam-status"><span class="steam-dot"></span>steam</div>' +
                '<div class="steam-info">' +
                    '<div class="steam-meta">the wizard is away from the keep</div>' +
                    (profileUrl
                        ? '<a class="steam-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener noreferrer">' + STEAM_ICON + 'steam profile ↗</a>'
                        : '') +
                '</div>' +
            '</div>';
    }

    // ── Helpers ──────────────────────────────────────────────────
    function timeAgo(date) {
        var s = Math.floor((Date.now() - date) / 1000);
        if (s < 60)     return 'just now';
        if (s < 3600)   return Math.floor(s / 60)    + 'm ago';
        if (s < 86400)  return Math.floor(s / 3600)  + 'h ago';
        if (s < 604800) return Math.floor(s / 86400) + 'd ago';
        return Math.floor(s / 604800) + 'w ago';
    }

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

})();
