// ─────────────────────────────────────────────────────────────
//  browser.js — turns the "ie" window into Foxfire, a tiny
//  multi-page old-school Firefox parody. The portfolio is "home";
//  the rest are period gags. Working Back / Forward / Reload / Home
//  + an editable address bar with its own history stack. Loads after
//  app.js (uses window.renderPortfolio to paint the home page's cards).
// ─────────────────────────────────────────────────────────────
(function () {
    var page = document.getElementById('ie-page');
    if (!page) return;

    var urlInput = document.getElementById('ie-url');
    var statusEl = document.querySelector('.ie-status-text');
    var titleEl  = document.querySelector('[data-app="ie"] .p-cmd');
    var ieBlock  = document.querySelector('[data-app="ie"]');
    var btn = {
        back:    document.querySelector('[data-ie="back"]'),
        fwd:     document.querySelector('[data-ie="fwd"]'),
        stop:    document.querySelector('[data-ie="stop"]'),
        refresh: document.querySelector('[data-ie="refresh"]'),
        home:    document.querySelector('[data-ie="home"]'),
        go:      document.querySelector('[data-ie="go"]')
    };

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var CONTACT_EMAIL = (typeof contactConfig !== 'undefined' && contactConfig.email) || 'damien@damienbuilds.dev';

    var HOME      = 'http://www.damienbuilds.dev/projects';
    var U_SEARCH  = 'http://www.googol.com';
    var U_BLOG    = 'http://www.damienbuilds.dev/blog';
    var SITE      = 'https://damienbuilds.dev';
    var RICK      = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // ── Pseudo-ads — 90s banners, but the pitch is real: every one of them
    // is actually for damienbuilds.dev and actually links there (new tab).
    // [headline, body, cta, skin] — each skin is its own LAYOUT (not just a
    // palette) so the ad wall reads like six different advertisers bought
    // slots. All static trusted strings.
    //   s1 garage-sale flyer · s2 terminal window · s3 print memo
    //   s4 vaporwave horizon · s5 roadwork banner · s6 fake Win98 popup
    var ADS = [
        ['Tired of boring websites?', 'One weirdly competent developer built this entire desktop from scratch. See more at damienbuilds.dev.', 'VISIT NOW', 's2'],
        ['This could be YOUR website', 'Fast, weird, and shockingly functional. No mortgage-sized invoice required.', 'SEE THE WORK', 's3'],
        ['BREAKING: local wizard makes websites', 'Neighbors are furious. Clients are thrilled. damienbuilds.dev has the receipts.', 'READ MORE', 's4'],
        ['Your competitor already has one', 'A real website, that is. Fix that at damienbuilds.dev before it&rsquo;s too late.', 'GET STARTED', 's1'],
        ['100% certified not-a-template', 'Every pixel here was placed on purpose (mostly). Hire the person who did it.', 'HIRE DAMIEN', 's2'],
        ['WARNING: portfolio may cause hiring', 'Side effects include working code, good taste, and reasonable rates.', 'PROCEED ANYWAY', 's5'],
        ['You&rsquo;ve won&hellip; a great developer', 'No prize wheel needed. Just go to damienbuilds.dev and say hello.', 'CLAIM DAMIEN', 's6'],
        ['Websites. But good.', 'Revolutionary concept, we know. Available now at damienbuilds.dev.', 'LEARN MORE', 's4'],
        ['This banner is self-aware', 'And so is the person who built it. Real projects, real code, no filler.', 'SEE PROOF', 's3'],
        ['One weird trick for a better website', 'Agencies hate him. He just&hellip; builds the thing properly, on time.', 'SEE THE TRICK', 's1'],
        ['HOT DEALS on cold hard code', '50% off nothing! Everything is already reasonably priced at damienbuilds.dev.', 'SHOP NOW-ISH', 's1'],
        ['sudo hire damien', 'Permission granted. The command actually works at damienbuilds.dev.', 'EXECUTE', 's2'],
        ['Websites from the future (1998)', 'Retro on the outside, modern underneath. The timeline is a circle.', 'RIDE THE WAVE', 's4'],
        ['ROAD WORK AHEAD?', 'Yeah, we work on the web. Under construction since 1998, shipping anyway.', 'MERGE LEFT', 's5'],
        ['Your PC is running&hellip; fine, actually', 'This is not a virus warning. It is a Damien warning. He will improve your website.', 'SCAN ANYWAY', 's6'],
        ['This ad space is real estate', 'And it all points to one place: damienbuilds.dev.', 'GO NOW', 's3']
    ];
    function adShuffle() {
        var a = ADS.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    // Pick n ads such that no two on screen share a skin — three identical
    // cream memos stacked in the rail was the bad-luck case this kills.
    function adPicks(n) {
        var pool = adShuffle(), picks = [], used = {};
        pool.forEach(function (ad) { if (picks.length < n && !used[ad[3]]) { used[ad[3]] = 1; picks.push(ad); } });
        pool.forEach(function (ad) { if (picks.length < n && picks.indexOf(ad) === -1) picks.push(ad); });
        return picks;
    }
    function adHtml(ad) {
        return '<div class="bw-ad bw-ad-' + (ad[3] || 's1') + '"><span class="bw-ad-tag">advertisement</span>' +
            '<a class="bw-ad-inner" href="' + SITE + '" target="_blank" rel="noopener noreferrer">' +
                '<span class="bw-ad-head">' + ad[0] + '</span>' +
                '<span class="bw-ad-body">' + ad[1] + '</span>' +
                '<span class="bw-ad-cta">[ ' + ad[2] + ' ]</span>' +
            '</a></div>';
    }
    // Classic web-ring navigator — fills the bottom of the rail with
    // something that isn't an ad. Prev is a lesson, Random is a real
    // project, Next is the mothership.
    function webringHtml() {
        return '<div class="bw-ring">' +
            '<div class="bw-ring-head">&#9733; WIZARD WEB RING &#9733;</div>' +
            '<p class="bw-ring-p">This site is member <b>#98</b> of the Ring of Code Wizards.</p>' +
            '<div class="bw-ring-nav">' +
                '<a href="' + RICK + '" target="_blank" rel="noopener noreferrer">&laquo; prev</a>' +
                '<a data-ring="random">random</a>' +
                '<a href="' + SITE + '" target="_blank" rel="noopener noreferrer">next &raquo;</a>' +
            '</div></div>';
    }
    function railHtml(picks) {
        return '<aside class="bw-rail"><div class="bw-rail-sticky">' +
            picks.map(adHtml).join('') +
            webringHtml() +
            '</div></aside>';
    }
    // Wraps a page in the shell that carries the sidebar ad rail.
    function withRail(pageHtml) {
        return '<div class="bw-shell">' + pageHtml + railHtml(adPicks(4)) + '</div>';
    }

    function social(key) { return (typeof socialConfig !== 'undefined' && socialConfig[key]) || SITE; }

    // ── Shared retro nav bar ────────────────────────────────────
    function nav(active) {
        var links = [
            ['Home', HOME, 'projects'], ['Search', U_SEARCH, 'search'], ['Blog', U_BLOG, 'blog']
        ];
        return '<div class="bw-nav">' + links.map(function (l) {
            return '<a class="bw-navlink' + (l[2] === active ? ' on' : '') + '" data-link="' + esc(l[1]) + '">' + esc(l[0]) + '</a>';
        }).join('<span class="bw-navsep">&middot;</span>') + '</div>';
    }

    // ── Pages ───────────────────────────────────────────────────
    // Always shown — this one stays put rather than being dismissible.
    function introHtml() {
        return '<div class="bw-intro" id="bw-intro">' +
            '<p>This whole thing is Damien&rsquo;s developer portfolio, dressed up as a Windows&nbsp;98 desktop. You&rsquo;re currently reading the project list in <b>Kurama</b> &mdash; minimize this window (or grab it from the taskbar) to poke around the rest of the desktop: a terminal with live GitHub activity, a media player, Steam stats, and a few things that bite back.</p>' +
            '<p class="bw-intro-note">Heads up: the full desktop experience really wants a bigger screen. If you&rsquo;re on mobile, this project list is already the best part &mdash; sorry about that.</p>' +
            '</div>';
    }
    function homePage() {
        var n = (window.projects ? window.projects.length : '');
        return '<div class="bw-page bw-home">' + nav('projects') + introHtml() +
            '<p class="out dim ls-meta">total <span id="project-count">' + n + '</span></p>' +
            '<div class="cards-grid" id="cards-grid"></div>' +
            // The sacred 88×31 badge wall — no old-school page is complete
            '<div class="bw-badges" aria-hidden="true">' +
                '<span class="b88 b88-kurama">KURAMA<br>ready</span>' +
                '<span class="b88 b88-notepad">made with<br>NOTEPAD.EXE</span>' +
                '<span class="b88 b88-y2k">Y2K<br>compliant*</span>' +
                '<span class="b88 b88-tea">powered by<br>TEA</span>' +
                '<span class="b88 b88-800">best viewed at<br>800 &times; 600</span>' +
            '</div>' +
            '<div class="ie-teaser"><h3 class="ie-teaser-title">Currently conjuring&hellip;</h3>' +
            '<p class="ie-teaser-body">Something new is in the cauldron. Bookmark this page (Ctrl&#8209;D, it&rsquo;ll pretend to work) and check back &mdash; or just <a href="mailto:' + CONTACT_EMAIL + '">email me</a> and beat the queue.</p></div>' +
            '</div>';
    }

    // title + desc are trusted static strings (may contain HTML entities), so
    // they render raw. kind: 'ext' → new tab · 'mail' → mailto · else in-browser.
    function searchResult(title, link, desc, kind) {
        var a;
        if (kind === 'ext')       a = '<a class="bw-result-title" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + title + '</a>';
        else if (kind === 'mail') a = '<a class="bw-result-title" href="' + esc(link) + '">' + title + '</a>';
        else                      a = '<a class="bw-result-title" data-link="' + esc(link) + '">' + title + '</a>';
        return '<div class="bw-result">' + a +
            '<p class="bw-result-url">' + esc(link) + '</p><p class="bw-result-desc">' + desc + '</p></div>';
    }
    // Googol — the search engine that "indexes 4 billion pages, returns 1 guy".
    var GG_COLORS = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'];
    function googolLogo(cls) {
        return '<span class="gg-logo ' + cls + '" aria-label="Googol">' +
            'Googol'.split('').map(function (ch, i) {
                return '<b style="color:' + GG_COLORS[i] + '">' + ch + '</b>';
            }).join('') + '</span>';
    }
    function googolForm(q, compact) {
        return '<form class="gg-form' + (compact ? ' gg-form-compact' : '') + '">' +
            '<input class="gg-input" type="text" value="' + esc(q) + '" aria-label="Search the web">' +
            '<span class="gg-btns">' +
                '<button class="gg-btn" type="submit">Googol Search</button>' +
                '<button class="gg-btn gg-lucky" type="button">I&rsquo;m Feeling Lucky</button>' +
            '</span></form>';
    }
    function searchPage(q) {
        if (!q) {
            return '<div class="bw-page bw-search gg-home">' + nav('search') +
                '<div class="gg-hero">' + googolLogo('gg-big') +
                    googolForm('', false) +
                    '<p class="gg-tip">Searching 4,000,000,000 pages. Returning 1 guy. Every time.</p>' +
                '</div></div>';
        }
        var rows =
            searchResult('Damien &mdash; Projects', HOME, 'Browser games, a memento-mori calendar, a fantasy map generator. Exactly what you searched for. Probably.') +
            searchResult('damienbuilds.dev &mdash; hire a code wizard', SITE, 'The official site. Web things conjured from tea and spite. Now accepting clients.', 'ext') +
            searchResult('Damien &middot; GitHub', social('github'), 'Public repositories with live commit history. At least three of them are finished.', 'ext') +
            searchResult('Damien Subramanian | LinkedIn', social('linkedin'), 'Professional&trade;. Open to work, opportunities, and free snacks.', 'ext') +
            searchResult('@damienbuilds.dev &middot; Instagram', social('instagram'), 'Screenshots of code that compiled on the first try. A rare and beautiful archive.', 'ext') +
            searchResult('Download more RAM &mdash; 100% FREE (legit)', RICK, 'Your PC is low on memory. Click here to install an extra 16&nbsp;GB instantly. No catch.', 'ext') +
            searchResult('&#9733; YOU are visitor 1,000,000 &mdash; claim your prize &#9733;', RICK, 'CONGRATULATIONS!!! A brand-new iPod is reserved in your name. Click within 0:59 to claim.', 'ext') +
            searchResult('Hire Damien (Sponsored)', 'mailto:' + CONTACT_EMAIL, 'The #1 result for &ldquo;' + esc(q) + '&rdquo;. Sponsored. (Sponsored by him.)', 'mail') +
            searchResult('damien_resume_FINAL_v7_REAL.doc', 'http://files.damienbuilds.dev/resume', 'Download starts in 1998 seconds. Do not close this window. Do not open another.');
        return '<div class="bw-page bw-search gg-results">' + nav('search') +
            '<div class="gg-resbar">' + googolLogo('gg-small') + googolForm(q, true) + '</div>' +
            '<div class="bw-results"><p class="bw-results-meta">About <b>4,000,000,000</b> results for &ldquo;' + esc(q) + '&rdquo; (0.04 seconds) &mdash; all of them Damien</p>' +
            rows + '</div></div>';
    }

    function blogPage() {
        var drafts = [
            ['Building a Windows 98 desktop in vanilla JS',
             'How this whole portfolio came together &mdash; draggable windows, a fake taskbar, a working Start menu, and not a single framework in sight.',
             'draft &middot; 0% written, 100% planned'],
            ['Keeping an API key secret on a static site',
             'Why my Steam stats route through a Cloudflare Worker, and other small, healthy acts of paranoia.',
             'draft &middot; steeping'],
            ['Tea-driven development',
             'A field guide to shipping software one steeped pot at a time &mdash; calm hands, green tests.',
             'draft &middot; brewing']
        ];
        return '<div class="bw-page bw-blog">' + nav('blog') +
            '<header class="bw-blog-head">' +
                '<h1 class="bw-blog-h">Damien&rsquo;s Blog</h1>' +
                '<p class="bw-blog-tag">Notes on code, conjuring, and questionable decisions.</p>' +
            '</header>' +
            '<p class="bw-blog-soon">&#10022; First post coming soon &#10022;</p>' +
            '<div class="bw-blog-drafts">' + drafts.map(function (d) {
                return '<article class="bw-blog-draft">' +
                    '<h3 class="bw-blog-draft-h">' + d[0] + '</h3>' +
                    '<p class="bw-blog-draft-meta">' + d[2] + '</p>' +
                    '<p class="bw-blog-draft-p">' + d[1] + '</p></article>';
            }).join('') + '</div>' +
            '<form class="bw-blog-sub">' +
                '<p class="bw-blog-sub-label">Want a nudge when the first post lands?</p>' +
                '<div class="bw-blog-sub-row">' +
                    '<input class="bw-blog-sub-input" type="email" placeholder="you@example.com" aria-label="Email address">' +
                    '<button class="bw-blog-sub-btn" type="submit">Notify me</button>' +
                '</div>' +
                '<p class="bw-blog-sub-note">(this button is refreshingly honest about doing nothing)</p>' +
            '</form></div>';
    }

    function notFoundPage(url) {
        return '<div class="bw-page bw-404">' + nav('') +
            '<h2 class="bw-404-h">The page cannot be displayed</h2>' +
            '<p class="bw-404-p">The page you are looking for is currently unavailable, or you may have spelled <b>' + esc(url) + '</b> wrong. Both are equally likely.</p>' +
            '<p class="bw-404-p">Please try the following:</p>' +
            '<ul class="bw-404-list"><li>Click the <a data-link="' + HOME + '">Home</a> button. It always works.</li>' +
            '<li>Blow on the cartridge.</li><li>Turn it off and on again.</li></ul>' +
            '<p class="bw-404-code">HTTP 404 &mdash; File not found<br>Kurama</p></div>';
    }

    var PAGES = {};
    PAGES[HOME]     = { title: 'Damien — Projects',      html: function () { return withRail(homePage()); },
                        after: function () { if (window.renderPortfolio) window.renderPortfolio(); insertFeedAds(); } };
    PAGES[U_SEARCH] = { title: 'Googol',                 html: function () { return searchPage(''); } };
    PAGES[U_BLOG]   = { title: "Damien's Blog",          html: function () { return withRail(blogPage()); } };

    // Drop two flashing banners between the project cards (after #2 and #4).
    // Real anchors now (they open damienbuilds.dev in a new tab), so no click
    // wiring is needed beyond inserting the markup.
    function insertFeedAds() {
        var grid = document.getElementById('cards-grid');
        if (!grid) return;
        var cards = grid.querySelectorAll('.card');
        if (cards.length < 3) return;
        var picks = adPicks(2);
        [[2, picks[0]], [4, picks[1]]].forEach(function (slot) {
            if (cards.length <= slot[0]) return;
            var tmp = document.createElement('div');
            tmp.innerHTML = adHtml(slot[1]);
            grid.insertBefore(tmp.firstChild, cards[slot[0]]);
        });
    }

    // ── Navigation engine ───────────────────────────────────────
    var hist = [], hpos = -1;

    function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
    function setTitle(t) {
        var full = t + ' - Kurama Browser';
        if (titleEl) titleEl.textContent = full;
        if (ieBlock) ieBlock.dataset.winName = full;
    }

    // Throbber spins briefly whenever a page is conjured.
    var throbber = document.getElementById('ie-throbber');
    var throbT;
    function throb() {
        if (!throbber) return;
        throbber.classList.add('busy');
        clearTimeout(throbT);
        throbT = setTimeout(function () { throbber.classList.remove('busy'); }, 700);
    }

    // Thin loading bar under the toolbar — the classic "page is loading" strip.
    var ieChrome = document.querySelector('[data-app="ie"] .ie-chrome');
    var progress = null;
    if (ieChrome) {
        progress = document.createElement('div');
        progress.className = 'ie-progress';
        ieChrome.appendChild(progress);
    }
    var progT1, progT2;
    function startProgress() {
        if (!progress) return;
        clearTimeout(progT1); clearTimeout(progT2);
        progress.style.transition = 'none';
        progress.style.opacity = '1';
        progress.style.width = '0';
        void progress.offsetWidth;                       // reflow so the next line animates
        progress.style.transition = 'width 0.5s ease-out';
        progress.style.width = '80%';
    }
    function endProgress() {
        if (!progress) return;
        progress.style.width = '100%';
        progT1 = setTimeout(function () { progress.style.opacity = '0'; }, 200);
        progT2 = setTimeout(function () { progress.style.transition = 'none'; progress.style.width = '0'; }, 550);
    }
    function stopProgress() {
        if (!progress) return;
        clearTimeout(progT1); clearTimeout(progT2);
        progress.style.opacity = '0';
        progress.style.width = '0';
    }

    // Idle status-bar flavor — rotates when nothing is loading.
    var STATUS_LINES = [
        'Done', 'Done (allegedly)', 'Blocking 0 pop-ups — they pay rent',
        'Summoning pixels… done', 'Held together by duct tape and belief',
        '100% Y2K compliant (fingers crossed)', 'The information superhighway is clear',
        'Cookies accepted: 1 (chocolate chip)'
    ];
    setInterval(function () {
        if (!statusEl || document.hidden) return;
        setStatus(STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)]);
    }, 12000);
    function resolve(url) {
        url = (url || '').trim();
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url.replace(/^\/+/, '');
        return url.replace(/\/+$/, '');     // drop trailing slash so keys match
    }

    var paintSeq = 0;
    function paint(url) {
        var p = PAGES[url];
        var seq = ++paintSeq;
        var host = url.replace(/^https?:\/\//, '').split('/')[0];
        // Little 56k theater: connect → open → done. Guarded by seq so a
        // rapid second navigation doesn't get stale status lines.
        setStatus('Connecting to site ' + host + '…');
        throb();
        startProgress();
        if (urlInput) urlInput.value = url;
        page.innerHTML = p ? p.html() : notFoundPage(url);
        setTitle(p ? p.title : 'Cannot find server');
        wirePage();
        if (p && p.after) p.after();
        page.scrollTop = 0;
        setTimeout(function () { if (seq === paintSeq) setStatus('Opening page ' + url + ' …'); }, 240);
        setTimeout(function () { if (seq === paintSeq) setStatus('Done'); }, 560);
        endProgress();
        updateNav();
    }
    function go(url) {
        var u = resolve(url);
        if (!u) return;
        hist = hist.slice(0, hpos + 1);
        hist.push(u);
        hpos = hist.length - 1;
        paint(u);
    }
    function back()    { if (hpos > 0) { hpos--; paint(hist[hpos]); } }
    function forward() { if (hpos < hist.length - 1) { hpos++; paint(hist[hpos]); } }
    function refresh() { if (hpos >= 0) paint(hist[hpos]); }
    function updateNav() {
        if (btn.back) btn.back.disabled = hpos <= 0;
        if (btn.fwd)  btn.fwd.disabled  = hpos >= hist.length - 1;
    }

    // ── Per-page wiring (internal links + the gag forms) ────────
    function wirePage() {
        [].forEach.call(page.querySelectorAll('[data-link]'), function (a) {
            a.addEventListener('click', function (e) { e.preventDefault(); go(a.getAttribute('data-link')); });
        });
        // Hovering any link previews its destination in the status bar (classic IE).
        [].forEach.call(page.querySelectorAll('[data-link], a[href]'), function (el) {
            var dest = el.getAttribute('data-link') || el.getAttribute('href') || '';
            if (!dest) return;
            el.addEventListener('mouseenter', function () { setStatus('Shortcut to ' + dest); });
            el.addEventListener('mouseleave', function () { setStatus('Done'); });
        });
        // Web ring "random" → a random live project, new tab.
        var ring = page.querySelector('[data-ring="random"]');
        if (ring) ring.addEventListener('click', function () {
            var ps = (window.projects || []).filter(function (p) { return p.link && p.link !== '#'; });
            if (ps.length) window.open(ps[Math.floor(Math.random() * ps.length)].link, '_blank', 'noopener,noreferrer');
        });
        var sf = page.querySelector('.gg-form');
        if (sf) {
            sf.addEventListener('submit', function (e) {
                e.preventDefault();
                var q = page.querySelector('.gg-input').value;
                page.innerHTML = searchPage(q);   // re-render in place with results
                wirePage();
                page.scrollTop = 0;
            });
            var lucky = page.querySelector('.gg-lucky');
            if (lucky) lucky.addEventListener('click', function () {
                // Feeling lucky → a random live project, in a new tab.
                var ps = (window.projects || []).filter(function (p) { return p.link && p.link !== '#'; });
                if (ps.length) window.open(ps[Math.floor(Math.random() * ps.length)].link, '_blank', 'noopener,noreferrer');
                else go(U_BLOG);
            });
        }
        var blf = page.querySelector('.bw-blog-sub');
        if (blf) blf.addEventListener('submit', function (e) {
            e.preventDefault();
            var note = page.querySelector('.bw-blog-sub-note');
            if (note) note.textContent = 'Thanks! We’ll never email you. Pinky promise.';
        });
    }

    // ── Chrome wiring ───────────────────────────────────────────
    if (btn.back)    btn.back.addEventListener('click', back);
    if (btn.fwd)     btn.fwd.addEventListener('click', forward);
    if (btn.refresh) btn.refresh.addEventListener('click', refresh);
    if (btn.home)    btn.home.addEventListener('click', function () { go(HOME); });
    if (btn.stop)    btn.stop.addEventListener('click', function () {
        if (throbber) throbber.classList.remove('busy');
        stopProgress();
        setStatus('Stopped');
    });
    if (btn.go)      btn.go.addEventListener('click', function () { go(urlInput.value); });
    if (urlInput) {
        urlInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); go(urlInput.value); }
            // Esc → abandon the edit, restore the current page's URL.
            else if (e.key === 'Escape') { urlInput.value = hist[hpos] || ''; urlInput.blur(); }
        });
        // Click into the address bar → select the whole URL, like a real browser.
        urlInput.addEventListener('focus', function () { setTimeout(function () { urlInput.select(); }, 0); });
        // Autocomplete: suggest the sites this browser actually knows about.
        var dl = document.createElement('datalist');
        dl.id = 'ie-url-suggest';
        [HOME, U_SEARCH, U_BLOG].forEach(function (u) {
            var o = document.createElement('option');
            o.value = u;
            dl.appendChild(o);
        });
        document.body.appendChild(dl);
        urlInput.setAttribute('list', 'ie-url-suggest');
    }

    // ── History menu — the menubar's "History" becomes a real Win98
    //    dropdown of this session's pages (with a Clear that works). ────
    var histMenuEl = null;
    function closeHistMenu() { if (histMenuEl) { histMenuEl.remove(); histMenuEl = null; } }
    (function wireHistoryMenu() {
        var histSpan = null;
        [].forEach.call(document.querySelectorAll('[data-app="ie"] .ie-menubar span'), function (s) {
            if (s.textContent === 'History') histSpan = s;
        });
        var chrome = document.querySelector('[data-app="ie"] .ie-chrome');
        if (!histSpan || !chrome) return;
        histSpan.classList.add('ie-menu-live');
        histSpan.title = 'Where you have been (this session only, we respect the fiction of privacy)';
        histSpan.addEventListener('click', function (e) {
            e.stopPropagation();
            if (histMenuEl) { closeHistMenu(); return; }
            var seen = {}, items = [];
            for (var i = hist.length - 1; i >= 0 && items.length < 8; i--) {
                if (seen[hist[i]]) continue;
                seen[hist[i]] = 1;
                items.push({ url: hist[i], title: PAGES[hist[i]] ? PAGES[hist[i]].title : hist[i], current: hist[i] === hist[hpos] });
            }
            histMenuEl = document.createElement('div');
            histMenuEl.className = 'ie-hist-menu';
            histMenuEl.innerHTML =
                items.map(function (it) {
                    return '<button class="ie-hist-item' + (it.current ? ' on' : '') + '" type="button" data-u="' + esc(it.url) + '">' + esc(it.title) + '</button>';
                }).join('') +
                '<div class="ie-hist-sep"></div>' +
                '<button class="ie-hist-item ie-hist-clear" type="button">Clear History</button>';
            chrome.appendChild(histMenuEl);
            histMenuEl.style.left = histSpan.offsetLeft + 'px';
            histMenuEl.style.top  = (histSpan.offsetTop + histSpan.offsetHeight + 5) + 'px';
            [].forEach.call(histMenuEl.querySelectorAll('[data-u]'), function (b) {
                b.addEventListener('click', function () { closeHistMenu(); go(b.getAttribute('data-u')); });
            });
            histMenuEl.querySelector('.ie-hist-clear').addEventListener('click', function () {
                closeHistMenu();
                hist = hist.slice(hpos, hpos + 1); hpos = 0; updateNav();
                paintSeq++;                     // cancel any pending status lines
                setStatus('History cleared. It never happened.');
            });
            setTimeout(function () { document.addEventListener('click', closeHistMenu, { once: true }); }, 0);
        });
    })();

    // Keyboard shortcuts — only while the pointer or focus is on the Kurama
    // window, so they never hijack the DOS prompt or the real browser.
    document.addEventListener('keydown', function (e) {
        if (!ieBlock) return;
        if (ieBlock.classList.contains('win-min') || ieBlock.classList.contains('win-closed')) return;
        var engaged = ieBlock.contains(document.activeElement) || ieBlock.matches(':hover');
        if (!engaged) return;
        if (e.altKey && e.key === 'ArrowLeft')  { e.preventDefault(); back(); }
        else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); forward(); }
        else if (e.key === 'F5') { e.preventDefault(); refresh(); }
    });

    // Bookmarks toolbar buttons
    [].forEach.call(document.querySelectorAll('.ie-glink[data-nav]'), function (b) {
        b.addEventListener('click', function () { go(b.getAttribute('data-nav')); });
    });
    // Hire Me — the only toolbar button that pays rent
    var hireBtn = document.querySelector('[data-ie="hire"]');
    if (hireBtn) hireBtn.addEventListener('click', function () {
        window.location.href = 'mailto:' + CONTACT_EMAIL;
    });

    // ── Bookmarks sidebar (docked left) — shown only while the window
    //    is maximized, since that's the only time there's real room for it.
    var ieBody = document.querySelector('.ie-body');
    var favBar = document.getElementById('ie-fav');
    function favClosed() { try { return sessionStorage.getItem('fav-closed') === '1'; } catch (e) { return false; } }
    function isMaximized() { return !!(ieBlock && ieBlock.classList.contains('win-max')); }
    function setFav(open) {
        if (!ieBody) return;
        ieBody.classList.toggle('show-fav', open);
        try { sessionStorage.setItem('fav-closed', open ? '0' : '1'); } catch (e) {}
    }
    function syncFavToMaximize() {
        if (ieBody) ieBody.classList.toggle('show-fav', isMaximized() && !favClosed());
    }
    if (favBar) {
        [].forEach.call(favBar.querySelectorAll('[data-nav]'), function (b) {
            b.addEventListener('click', function () { go(b.getAttribute('data-nav')); });
        });
        [].forEach.call(favBar.querySelectorAll('[data-ext]'), function (b) {
            b.addEventListener('click', function () { window.open(b.getAttribute('data-ext'), '_blank', 'noopener,noreferrer'); });
        });
        var favX = favBar.querySelector('.ie-fav-x');
        if (favX) favX.addEventListener('click', function () { setFav(false); });
        // The Bookmarks menu toggles the sidebar — only meaningful while
        // maximized, since a windowed view has nowhere to dock it.
        var gMenu = document.getElementById('menu-grimoire');
        if (gMenu) gMenu.addEventListener('click', function () {
            if (!isMaximized()) return;
            setFav(!ieBody.classList.contains('show-fav'));
        });
        // Keep the sidebar in sync every time the window is maximized/restored.
        syncFavToMaximize();
        if (window.MutationObserver && ieBlock) {
            new MutationObserver(syncFavToMaximize).observe(ieBlock, { attributes: true, attributeFilter: ['class'] });
        }
    }

    // Sidebar ad rail only fits when the window is wide (e.g. maximized).
    if (window.ResizeObserver) {
        new ResizeObserver(function () {
            page.classList.toggle('has-rail', page.clientWidth >= 980);
        }).observe(page);
    }

    // ── Real visitor counter — Cloudflare Worker + KV, no cookies ────
    // Reuses the same Worker that proxies Steam (see steam-proxy/worker.js,
    // ?action=hits). Silently disappears if the Worker/KV isn't set up yet.
    (function () {
        var hitsEl = document.getElementById('ie-hits');
        var cfg = (typeof steamConfig !== 'undefined') ? steamConfig : {};
        if (!hitsEl || !cfg.proxyUrl) { if (hitsEl) hitsEl.remove(); return; }
        fetch(cfg.proxyUrl + '?action=hits&path=' + encodeURIComponent(location.pathname))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (typeof data.count !== 'number') throw new Error('no count');
                var padded = ('000000' + data.count).slice(-6);
                hitsEl.innerHTML = 'Visitors: <b class="ie-hits-n">' + padded + '</b>';
            })
            .catch(function () { hitsEl.remove(); });
    })();

    go(HOME);   // boot to the portfolio
})();
