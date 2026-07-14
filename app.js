(function () {
    // Single source of truth for the contact address (set in projects.js).
    var CONTACT_EMAIL = (typeof contactConfig !== 'undefined' && contactConfig.email) || 'damien@damienbuilds.dev';

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

    // ── Interactive MS-DOS prompt ───────────────────────────────
    (function dosShell() {
        var screen = document.getElementById('dos-screen');
        var out    = document.getElementById('dos-out');
        var input  = document.getElementById('dos-input');
        var cursor = document.getElementById('dos-cursor');
        if (!screen || !out || !input) return;

        var bootOut = out.innerHTML;             // snapshot of the initial "script" output
        // Re-running AUTOEXEC.BAT (used when the window is closed → relaunched).
        window.dosRerun = function () {
            out.innerHTML = '<p class="out dim">Running hello.bat&hellip;</p>' + bootOut;
            input.value = ''; grow();
            screen.scrollTop = 0;
            input.focus();
        };

        function grow() { input.style.width = Math.max(1, input.value.length) + 'ch'; }
        input.addEventListener('input', grow); grow();

        // Clicking anywhere on the screen (except a link) focuses the prompt.
        screen.addEventListener('mousedown', function (e) {
            if (e.target.closest('a')) return;
            if (e.target !== input) { setTimeout(function () { input.focus(); }, 0); }
        });
        input.addEventListener('focus', function () { if (cursor) cursor.style.visibility = 'visible'; });

        function line(html, cls) {
            var p = document.createElement('p');
            p.className = 'out' + (cls ? ' ' + cls : '');
            p.innerHTML = html;
            out.appendChild(p);
        }
        function multiline(text) { return esc(text).replace(/\n/g, '<br>'); }

        var commands = {
            help: function () {
                return 'Available commands:\n' +
                    '  about      who you\'re dealing with\n' +
                    '  projects   list the builds\n' +
                    '  skills     the toolbox\n' +
                    '  contact    how to reach me\n' +
                    '  hire       smartest command here\n' +
                    '  whoami     existential check\n' +
                    '  ls / dir   look around\n' +
                    '  date       what year is it\n' +
                    '  cls        clear the screen';
            },
            about: function () {
                return "Damien — developer & code wizard. Conjures web things out of " +
                    "tea and spite; refuses to ship before the test suite is green.";
            },
            projects: function () {
                var ps = window.projects || [];
                if (!ps.length) return 'see the Blog window — it has the full list.';
                return ps.map(function (p) { return '  ' + p.title + ' — ' + p.subtitle; }).join('\n');
            },
            skills: function () { return 'JavaScript · HTML/CSS · Python · APIs · pixel-pushing · questionable humor'; },
            contact: function () { return CONTACT_EMAIL; },
            hire: function () { return 'Excellent choice. → ' + CONTACT_EMAIL; },
            whoami: function () { return 'visitor (esteemed guest)'; },
            ls: function () { return 'projects/   about.txt   status/   secrets/   [try the Blog window]'; },
            date: function () { return new Date().toString(); },
            echo: function (a) { return a.join(' '); },
            secret: function () { return 'Hint: up up down down left right left right B A.'; },
            cls: function () { out.innerHTML = ''; return null; }
        };
        commands.dir = commands.ls;
        commands.clear = commands.cls;

        var history = [], hpos = -1;
        function run(raw) {
            var text = raw.trim();
            line('<span class="dos-echo">C:\\DAMIEN&gt; ' + esc(raw) + '</span>');
            if (text) {
                history.unshift(raw);
                var parts = text.split(/\s+/);
                var cmd = parts.shift().toLowerCase();
                var fn = commands[cmd];
                if (fn) { var r = fn(parts); if (r != null) line(multiline(r), 'dim'); }
                else line("'" + esc(cmd) + "' is not recognized as a command. Type <b>help</b>.", 'dim');
            }
            hpos = -1;
            screen.scrollTop = screen.scrollHeight;
        }
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); run(input.value); input.value = ''; grow(); }
            else if (e.key === 'ArrowUp')   { e.preventDefault(); if (hpos < history.length - 1) { hpos++; input.value = history[hpos]; grow(); } }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (hpos > 0) { hpos--; input.value = history[hpos]; } else { hpos = -1; input.value = ''; } grow(); }
        });
    })();

    // ── Projects ────────────────────────────────────────────────
    // The project cards are the IE browser's "home" page; browser.js calls
    // this whenever that page is (re)rendered, so #cards-grid exists then.
    window.renderPortfolio = function () {
        var grid  = document.getElementById('cards-grid');
        if (!grid) return;
        var count = document.getElementById('project-count');
        if (typeof projects === 'undefined' || projects.length === 0) {
            grid.innerHTML = '<p class="empty-state">// no modules found — database may be offline</p>';
            return;
        }
        if (count) count.textContent = projects.length;
        grid.innerHTML = projects.map(buildCard).join('');
        hydrateCommits();
    };

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

        // Framed preview: the full screenshot sits inside a faux browser window.
        // Its title bar shows the live-demo URL; the whole frame links to the demo.
        const frameTag   = hasLink ? 'a' : 'div';
        const frameAttrs = hasLink
            ? ` href="${esc(project.link)}" target="_blank" rel="noopener noreferrer"`
            : '';
        const displayUrl = hasLink
            ? project.link.replace(/^https?:\/\//, '').replace(/\/$/, '')
            : (project.github ? project.github.replace(/^https?:\/\//, '') : 'preview.html');

        return `
<article class="card" style="animation-delay:${index * 0.07 + 0.1}s">
  <div class="card-bar">
    <h3 class="card-title">${esc(project.title)}</h3>
  </div>
  <${frameTag} class="card-frame"${frameAttrs} aria-label="${esc(project.title)}${hasLink ? ' — open live demo' : ' screenshot'}">
    <div class="card-frame-bar">
      <span class="card-frame-dots"><i></i><i></i><i></i></span>
      <span class="card-frame-url">${esc(displayUrl)}</span>
      ${hasLink ? '<span class="card-frame-go">open ↗</span>' : ''}
    </div>
    <div class="card-frame-shot">
      <img class="card-img" src="${img}" alt="${esc(project.title)} screenshot" loading="lazy">
    </div>
  </${frameTag}>
  <div class="card-body">
    ${project.subtitle ? `<p class="card-subtitle">${esc(project.subtitle)}</p>` : ''}
    <p class="card-desc">${esc(project.description)}</p>
    ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    ${slug ? `<p class="card-commit" data-repo="${esc(slug)}" hidden></p>` : ''}
    ${links}
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
        const status   = playing ? "I'm listening to" : "I last listened to";
        // The previous track becomes the small "last listened" footnote.
        const prev    = tracks[1];
        const prevTxt = prev ? `${prev.name || '—'} — ${prev.artist?.['#text'] || ''}` : '';
        spotifyEl.innerHTML = `
<div class="sp-panel spotify${playing ? ' playing' : ''}">
  <div class="sp-now">
    ${art ? `<img class="sp-art" src="${esc(art)}" alt="" loading="lazy">` : '<div class="sp-art sp-art-empty"></div>'}
    <div class="sp-meta">
      <div class="sp-status"><span class="sp-dot"></span>${status}</div>
      <div class="sp-track">${esc(name)}</div>
      <div class="sp-artist">${esc(artist)}</div>
    </div>
    <div class="sp-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  </div>
  ${prevTxt ? `<div class="sp-last"><span class="sp-last-k">last</span> ${esc(prevTxt)}</div>` : ''}
</div>`;
    }

    function renderSpotifyStatic(profileUrl) {
        spotifyEl.innerHTML = `
<div class="sp-panel spotify">
  <div class="sp-now">
    <div class="sp-art sp-art-empty"></div>
    <div class="sp-meta">
      <div class="sp-status"><span class="sp-dot"></span>not listening right now</div>
      <div class="sp-track">signal lost</div>
      <div class="sp-artist">the bards are resting</div>
    </div>
  </div>
</div>`;
    }

    // ── GitHub last push widget ──────────────────────────────────
    var ghEl  = document.getElementById('github-widget');
    var ghCfg = (typeof githubConfig !== 'undefined') ? githubConfig : {};

    if (ghEl && ghCfg.username) {
        ghEl.innerHTML = '<p class="sp-loading out dim">> connecting to github...</p>';
        fetchGithubFeed(ghCfg.username, ghCfg.profileUrl);
    }

    var GH_ICON     = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
    var BRANCH_ICON = '<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>';

    var LANG_COLORS = { JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572a5', HTML:'#e34c26', CSS:'#563d7c', Java:'#b07219', 'C#':'#178600', 'C++':'#f34b7d', Go:'#00add8', Rust:'#dea584', PHP:'#4f5d95', Ruby:'#701516', Swift:'#f05138', Kotlin:'#a97bff', Shell:'#89e051' };
    var LANG_SHORT  = { JavaScript:'JS', TypeScript:'TS', Python:'Py', 'C#':'C#', 'C++':'C++', Shell:'SH', Kotlin:'KT', Swift:'SW' };
    function langColor(l) { return LANG_COLORS[l] || '#666'; }
    function langShort(l) { return LANG_SHORT[l] || (l && l.length > 4 ? l.slice(0, 3) : (l || '')); }

    function fetchGithubFeed(username, profileUrl) {
        cachedJson('https://api.github.com/users/' + encodeURIComponent(username) + '/events?per_page=30', 300000)
            .then(function (events) {
                if (!Array.isArray(events)) { renderGithubStatic(username, profileUrl); return; }

                // Streak: count consecutive days (newest-first) that have at least one PushEvent
                var pushDaySet = {};
                events.forEach(function (ev) {
                    if (ev.type === 'PushEvent' && ev.created_at) pushDaySet[ev.created_at.slice(0, 10)] = true;
                });
                var days = Object.keys(pushDaySet).sort().reverse();
                var streak = 0;
                if (days.length) {
                    streak = 1;
                    for (var di = 1; di < days.length; di++) {
                        var prev = new Date(days[di - 1] + 'T00:00:00Z');
                        var curr = new Date(days[di] + 'T00:00:00Z');
                        if ((prev.getTime() - curr.getTime()) === 86400000) { streak++; } else break;
                    }
                }

                // Most active repo + total pushes in the window. (The public events
                // API omits payload.size/commits, so a commit count isn't available —
                // push count is the reliable git-activity signal.)
                var repoPushCount = {}, totalPushes = 0;
                events.forEach(function (ev) {
                    if (ev.type === 'PushEvent' && ev.repo) {
                        repoPushCount[ev.repo.name] = (repoPushCount[ev.repo.name] || 0) + 1;
                        totalPushes++;
                    }
                });
                var topRepo = '', topCount = 0;
                Object.keys(repoPushCount).forEach(function (r) { if (repoPushCount[r] > topCount) { topCount = repoPushCount[r]; topRepo = r; } });

                // Fetch language for top push repos (up to 4)
                var pushRepos = Object.keys(repoPushCount).sort(function (a, b) { return repoPushCount[b] - repoPushCount[a]; }).slice(0, 4);
                var langFetches = pushRepos.map(function (full) {
                    return cachedJson('https://api.github.com/repos/' + full, 3600000)
                        .then(function (d) { return { full: full, lang: d.language || null }; })
                        .catch(function () { return { full: full, lang: null }; });
                });
                // Account-level stats (followers, public repos, join year)
                var userP = cachedJson('https://api.github.com/users/' + encodeURIComponent(username), 3600000)
                    .catch(function () { return null; });

                Promise.all([Promise.all(langFetches), userP]).then(function (res) {
                    var results = res[0], user = res[1] || {};
                    var langMap = {};
                    results.forEach(function (r) { if (r.lang) langMap[r.full] = r.lang; });

                    var items = [];
                    for (var i = 0; i < events.length && items.length < 7; i++) {
                        var it = describeEvent(events[i]);
                        if (it) { it.lang = langMap[it.full] || null; items.push(it); }
                    }
                    if (!items.length) { renderGithubStatic(username, profileUrl); return; }
                    renderGithubFeed(items, profileUrl, {
                        streak: streak, topRepo: topRepo, topCount: topCount,
                        pushes: totalPushes,
                        followers: (typeof user.followers === 'number') ? user.followers : null,
                        repos: (typeof user.public_repos === 'number') ? user.public_repos : null,
                        since: (user.created_at ? user.created_at.slice(0, 4) : null)
                    });
                });
            })
            .catch(function () { renderGithubStatic(username, profileUrl); });
    }

    // Turn a raw GitHub event into a feed row (glyphs are ASCII so they render
    // in Press Start 2P too). Returns null for event types we don't surface.
    function describeEvent(ev) {
        if (!ev || !ev.repo) return null;
        var full = ev.repo.name, repo = full.split('/')[1], p = ev.payload || {};
        var base = { repo: repo, full: full, when: timeAgo(new Date(ev.created_at)) };
        function row(kind, glyph, text) { base.kind = kind; base.glyph = glyph; base.text = text; return base; }
        switch (ev.type) {
            case 'PushEvent':
                var n = p.size || (p.commits ? p.commits.length : 0);
                return row('push', '>', 'pushed' + (n ? ' ' + n + ' commit' + (n > 1 ? 's' : '') : '') + ' to');
            case 'CreateEvent':       return row('create', '+', 'created ' + (p.ref_type || 'repo'));
            case 'WatchEvent':        return row('star',   '*', 'starred');
            case 'ForkEvent':         return row('fork',   'Y', 'forked');
            case 'PullRequestEvent':  return row('pr',     '#', (p.action || 'updated') + ' PR in');
            case 'IssuesEvent':       return row('issue',  '!', (p.action || 'updated') + ' issue in');
            case 'IssueCommentEvent': return row('issue',  '!', 'commented in');
            case 'PublicEvent':       return row('create', '+', 'open-sourced');
            case 'ReleaseEvent':      return row('create', '+', 'released');
            default:                  return null;
        }
    }

    function renderGithubFeed(items, profileUrl, stats) {
        stats = stats || {};
        var streak = stats.streak || 0, topRepo = stats.topRepo || '';
        var topRepoShort = topRepo ? topRepo.split('/')[1] : '';
        var chips = [];
        if (streak > 1)            chips.push('<span class="gh-streak">&#9650; ' + streak + 'd streak</span>');
        if (stats.pushes)          chips.push('<span class="gh-stat">&#8593; ' + stats.pushes + ' push' + (stats.pushes === 1 ? '' : 'es') + '</span>');
        if (stats.followers != null) chips.push('<span class="gh-stat">&#9733; ' + stats.followers + ' follower' + (stats.followers === 1 ? '' : 's') + '</span>');
        if (stats.repos != null)   chips.push('<span class="gh-stat">&#9636; ' + stats.repos + ' repo' + (stats.repos === 1 ? '' : 's') + '</span>');
        var statsHtml = chips.length ? '<div class="gh-stats">' + chips.join('') + '</div>' : '';
        var workingOn = topRepoShort
            ? "I'm working on <a class=\"gh-status-repo\" href=\"https://github.com/" + esc(topRepo) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(topRepoShort) + '</a>'
            : "I'm working on things";
        ghEl.innerHTML =
            '<div class="gh-panel active">' +
                statsHtml +
                '<div class="gh-status"><span class="gh-dot"></span>' + workingOn + '</div>' +
                '<ul class="gh-feed">' +
                    items.map(function (it) {
                        var langHtml = it.lang
                            ? '<span class="gh-lang" style="background:' + langColor(it.lang) + '">' + esc(langShort(it.lang)) + '</span>'
                            : '';
                        return '<li class="gh-ev">' +
                            '<span class="gh-ev-ico gh-ev-' + it.kind + '">' + esc(it.glyph) + '</span>' +
                            '<span class="gh-ev-text">' + esc(it.text) + ' ' +
                                '<a class="gh-ev-repo" href="https://github.com/' + esc(it.full) + '" target="_blank" rel="noopener noreferrer">' + esc(it.repo) + '</a></span>' +
                            langHtml +
                            '<span class="gh-ev-time">' + esc(it.when) + '</span>' +
                        '</li>';
                    }).join('') +
                '</ul>' +
                '<div class="gh-meta">' +
                    '<a class="gh-link" href="' + esc(profileUrl || 'https://github.com/Damiensoobz') + '" target="_blank" rel="noopener noreferrer">' + GH_ICON + 'view profile ↗</a>' +
                    (stats.since ? '<span class="gh-since">since ' + esc(stats.since) + '</span>' : '') +
                '</div>' +
            '</div>';
    }

    function renderGithubStatic(username, profileUrl) {
        ghEl.innerHTML =
            '<div class="gh-panel">' +
                '<div class="gh-status"><span class="gh-dot"></span>I\'m working on things</div>' +
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
        cachedJson(proxyUrl + '?action=recent', 300000)
            .then(function (data) {
                var games = data && data.response && data.response.games;
                if (!games || games.length === 0) { renderSteamStatic(profileUrl); return; }
                var g        = games[0];
                var hrs      = g.playtime_2weeks  ? (Math.round(g.playtime_2weeks  / 6) / 10) : 0;
                var totalHrs = g.playtime_forever ? Math.round(g.playtime_forever / 60)       : 0;
                renderSteamGame(g.name, g.appid, hrs, totalHrs);
            })
            .catch(function () { renderSteamStatic(profileUrl); });
    }

    function renderSteamGame(name, appId, hrs, totalHrs) {
        var storeUrl = 'https://store.steampowered.com/app/' + appId + '/';
        var imgUrl   = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appId + '/header.jpg';
        stEl.innerHTML =
            '<div class="steam-panel active">' +
                '<div class="steam-status"><span class="steam-dot"></span>recently played</div>' +
                '<a class="steam-cap" href="' + esc(storeUrl) + '" target="_blank" rel="noopener noreferrer" tabindex="-1">' +
                    '<img class="steam-img" src="' + esc(imgUrl) + '" alt="' + esc(name) + '" loading="lazy">' +
                '</a>' +
                '<div class="steam-info">' +
                    '<div class="steam-game">' + esc(name) + '</div>' +
                    '<div class="steam-meta">' + hrs + ' hrs past 2 weeks' +
                        (totalHrs ? ' &middot; ' + totalHrs.toLocaleString() + ' hrs on record' : '') + '</div>' +
                    '<a class="steam-store-link" href="' + esc(storeUrl) + '" target="_blank" rel="noopener noreferrer">view on steam ↗</a>' +
                '</div>' +
            '</div>';
    }

    function renderSteamStatic(profileUrl) {
        stEl.innerHTML =
            '<div class="steam-panel">' +
                '<div class="steam-status"><span class="steam-dot"></span>currently offline</div>' +
                '<div class="steam-info">' +
                    '<div class="steam-game">Not in a game</div>' +
                    '<div class="steam-meta">the wizard is away from the keep</div>' +
                    (profileUrl
                        ? '<a class="steam-store-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener noreferrer">view profile ↗</a>'
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
