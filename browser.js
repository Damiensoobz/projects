// ─────────────────────────────────────────────────────────────
//  browser.js — turns the IE window into a tiny multi-page
//  browser. The portfolio is "home"; the rest are period gags.
//  Working Back / Forward / Refresh / Home + an editable address
//  bar with its own history stack. Loads after app.js (uses
//  window.renderPortfolio to paint the home page's project cards).
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
    var U_AD      = 'http://www.totally-real-deals.net/claim';
    var SITE      = 'https://damienbuilds.dev';
    var RICK      = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // ── Pseudo-ads — 90s banners trolling the modern web ───────
    // [headline, body, cta, skin] — skins keep the ad wall from looking
    // like one advertiser bought every slot. All static trusted strings.
    //   s1 classic yellow · s2 hacker terminal · s3 corporate memo
    //   s4 vaporwave · s5 hazard tape
    var ADS = [
        ['Mine Bitcoin on dial-up!', 'Only ~4,000 years to your first coin. No refunds. Electricity not included.', 'START MINING', 's2'],
        ['AI took your job?', 'Take its job. Retrain as an artisanal CAPTCHA solver today.', 'I AM NOT A ROBOT', 's3'],
        ['The Doomscroll Wheel&trade;', 'Scroll 50% faster, feel 200% worse. Now with haptic regret.', 'UPGRADE MY SADNESS', 's4'],
        ['Your data is for sale', 'We know. We sold it. Buy it back in 3 easy payments of $9.99.', 'BUY MYSELF BACK', 's1'],
        ['FREE cloud storage*', '*The cloud is just someone else&rsquo;s computer. His name is Greg.', 'TRUST GREG', 's2'],
        ['Streaming mega-bundle', 'All 14 services for the price of a mortgage. Cancel anytime**. **You can&rsquo;t.', 'SUBSCRIBE FOREVER', 's4'],
        ['Refurbished attention span', 'Gently used. 8 seconds. One previous owner (a goldfish).', 'ADD TO CART', 's1'],
        ['Y2K38 is coming', 'The clocks run out again in 2038. Panic early &mdash; beat the rush.', 'PANIC NOW', 's5'],
        ['Hot singles? No.', 'Hot SIGNALS in your area. It&rsquo;s your router. It misses you.', 'RECONNECT', 's3']
    ];
    function adShuffle() {
        var a = ADS.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function adHtml(ad) {
        return '<div class="bw-ad bw-ad-' + (ad[3] || 's1') + '"><span class="bw-ad-tag">advertisement</span>' +
            '<a class="bw-ad-inner" data-link="' + U_AD + '">' +
                '<span class="bw-ad-head">' + ad[0] + '</span>' +
                '<span class="bw-ad-body">' + ad[1] + '</span>' +
                '<span class="bw-ad-cta">[ ' + ad[2] + ' ]</span>' +
            '</a></div>';
    }
    function railHtml(picks) {
        return '<aside class="bw-rail"><div class="bw-rail-sticky">' +
            adHtml(picks[0]) + adHtml(picks[1]) +
            '<div class="bw-ad bw-ad-s3"><span class="bw-ad-tag">advertisement</span>' +
                '<a class="bw-ad-inner" href="mailto:' + CONTACT_EMAIL + '">' +
                    '<span class="bw-ad-head">Your ad here</span>' +
                    '<span class="bw-ad-body">1 million impressions/day* (*mostly Damien refreshing).</span>' +
                    '<span class="bw-ad-cta">[ INQUIRE WITHIN ]</span>' +
                '</a></div>' +
            '</div></aside>';
    }
    // Wraps a page in the shell that carries the sidebar ad rail.
    function withRail(pageHtml) {
        var picks = adShuffle();
        return '<div class="bw-shell">' + pageHtml + railHtml(picks) + '</div>';
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
    function homePage() {
        var n = (window.projects ? window.projects.length : '');
        return '<div class="bw-page bw-home">' + nav('projects') +
            '<p class="out dim ls-meta">total <span id="project-count">' + n + '</span></p>' +
            '<div class="cards-grid" id="cards-grid"></div>' +
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

    // Where every ad click lands — the prize is nothing, and it's beautiful.
    function adClickPage() {
        var n = 1;
        try { n = (parseInt(sessionStorage.getItem('ad-clicks'), 10) || 0) + 1; sessionStorage.setItem('ad-clicks', String(n)); } catch (e) {}
        return '<div class="bw-page bw-claim">' + nav('') +
            '<h1 class="bw-claim-h">&#9733; CONGRATULATIONS!!! &#9733;</h1>' +
            '<p class="bw-claim-p">You clicked an ad. On purpose. In ' + new Date().getFullYear() + '. The marketing department has been notified and is openly weeping with joy.</p>' +
            '<p class="bw-claim-p">Your prize: <b>absolutely nothing</b>. No tracking pixel, no newsletter, no timeshare. It&rsquo;s very freeing.</p>' +
            '<p class="bw-claim-count">prizes claimed this session: ' + n + ' &times; nothing</p>' +
            '<p class="bw-claim-links"><a data-link="' + U_AD + '">claim again</a> &middot; <a data-link="' + HOME + '">&laquo; back to the projects</a></p>' +
            '</div>';
    }

    function notFoundPage(url) {
        return '<div class="bw-page bw-404">' + nav('') +
            '<h2 class="bw-404-h">The page cannot be displayed</h2>' +
            '<p class="bw-404-p">The page you are looking for is currently unavailable, or you may have spelled <b>' + esc(url) + '</b> wrong. Both are equally likely.</p>' +
            '<p class="bw-404-p">Please try the following:</p>' +
            '<ul class="bw-404-list"><li>Click the <a data-link="' + HOME + '">Home</a> button. It always works.</li>' +
            '<li>Blow on the cartridge.</li><li>Turn it off and on again.</li></ul>' +
            '<p class="bw-404-code">HTTP 404 &mdash; File not found<br>Damien Navigator</p></div>';
    }

    var PAGES = {};
    PAGES[HOME]     = { title: 'Damien — Projects',      html: function () { return withRail(homePage()); },
                        after: function () { if (window.renderPortfolio) window.renderPortfolio(); insertFeedAds(); } };
    PAGES[U_SEARCH] = { title: 'Googol',                 html: function () { return searchPage(''); } };
    PAGES[U_BLOG]   = { title: "Damien's Blog",          html: function () { return withRail(blogPage()); } };
    PAGES[U_AD]     = { title: 'YOU WON!!! (you did not)', html: adClickPage };

    // Drop two flashing banners between the project cards (after #2 and #4).
    function insertFeedAds() {
        var grid = document.getElementById('cards-grid');
        if (!grid) return;
        var cards = grid.querySelectorAll('.card');
        if (cards.length < 3) return;
        var picks = adShuffle();
        [[2, picks[0]], [4, picks[1]]].forEach(function (slot) {
            if (cards.length <= slot[0]) return;
            var tmp = document.createElement('div');
            tmp.innerHTML = adHtml(slot[1]);
            var ad = tmp.firstChild;
            ad.querySelector('[data-link]').addEventListener('click', function (e) {
                e.preventDefault(); go(U_AD);
            });
            grid.insertBefore(ad, cards[slot[0]]);
        });
    }

    // ── Navigation engine ───────────────────────────────────────
    var hist = [], hpos = -1;

    function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
    function setTitle(t) {
        var full = t + ' - Damien Navigator';
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

    // Idle status-bar flavor — rotates when nothing is loading.
    var STATUS_LINES = [
        'Done', 'Done (allegedly)', 'Blocking 0 pop-ups — they pay rent',
        'Summoning pixels… done', 'Held together by duct tape and belief',
        '100% Y2K compliant (fingers crossed)', 'The Aether is stable today',
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

    function paint(url) {
        var p = PAGES[url];
        setStatus('Opening page ' + url + ' …');
        throb();
        if (urlInput) urlInput.value = url;
        page.innerHTML = p ? p.html() : notFoundPage(url);
        setTitle(p ? p.title : 'Cannot find server');
        wirePage();
        if (p && p.after) p.after();
        page.scrollTop = 0;
        setStatus('Done');
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
    if (btn.stop)    btn.stop.addEventListener('click', function () { setStatus('Stopped'); });
    if (btn.go)      btn.go.addEventListener('click', function () { go(urlInput.value); });
    if (urlInput)    urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); go(urlInput.value); }
    });

    // Grimoire quick-bar bookmarks
    [].forEach.call(document.querySelectorAll('.ie-glink[data-nav]'), function (b) {
        b.addEventListener('click', function () { go(b.getAttribute('data-nav')); });
    });
    // Hire Me — the only toolbar button that pays rent
    var hireBtn = document.querySelector('[data-ie="hire"]');
    if (hireBtn) hireBtn.addEventListener('click', function () {
        window.location.href = 'mailto:' + CONTACT_EMAIL;
    });

    // ── Favorites explorer bar (docked left, IE5 style) ─────────
    var ieBody = document.querySelector('.ie-body');
    var favBar = document.getElementById('ie-fav');
    function favClosed() { try { return sessionStorage.getItem('fav-closed') === '1'; } catch (e) { return false; } }
    function setFav(open) {
        if (!ieBody) return;
        ieBody.classList.toggle('show-fav', open);
        try { sessionStorage.setItem('fav-closed', open ? '0' : '1'); } catch (e) {}
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
        // The Grimoire menu actually does something: toggles the bar.
        var gMenu = document.getElementById('menu-grimoire');
        if (gMenu) gMenu.addEventListener('click', function () {
            setFav(!ieBody.classList.contains('show-fav'));
        });
        // Auto-open on wide windows the first time (never fights a manual close).
        if (window.ResizeObserver && ieBody) {
            var favAuto = false;
            new ResizeObserver(function () {
                var wide = ieBody.clientWidth >= 1150;
                if (wide && !favAuto && !favClosed()) { favAuto = true; ieBody.classList.add('show-fav'); }
                if (!wide) ieBody.classList.remove('show-fav');
            }).observe(ieBody);
        }
    }

    // Sidebar ad rail only fits when the window is wide (e.g. maximized).
    if (window.ResizeObserver) {
        new ResizeObserver(function () {
            page.classList.toggle('has-rail', page.clientWidth >= 980);
        }).observe(page);
    }

    go(HOME);   // boot to the portfolio
})();
