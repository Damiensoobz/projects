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
    var U_SEARCH  = 'http://www.altavista.com';
    var U_GUEST   = 'http://www.damienbuilds.dev/guestbook';
    var U_BLOG    = 'http://www.damienbuilds.dev/blog';
    var SITE      = 'https://damienbuilds.dev';
    var RICK      = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    function social(key) { return (typeof socialConfig !== 'undefined' && socialConfig[key]) || SITE; }

    // ── Shared retro nav bar ────────────────────────────────────
    function nav(active) {
        var links = [
            ['Home', HOME, 'projects'], ['Search', U_SEARCH, 'search'],
            ['Guestbook', U_GUEST, 'guestbook'], ['Blog', U_BLOG, 'blog']
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
    function searchPage(q) {
        var results = '';
        if (q) {
            var rows =
                searchResult('Damien &mdash; Projects', HOME, 'Browser games, a memento-mori calendar, a fantasy map generator. Exactly what you searched for. Probably.') +
                searchResult('damienbuilds.dev &mdash; hire a code wizard', SITE, 'The official site. Web things conjured from tea and spite. Now accepting clients.', 'ext') +
                searchResult('Damien &middot; GitHub', social('github'), 'Public repositories with live commit history. At least three of them are finished.', 'ext') +
                searchResult('Damien Subramanian | LinkedIn', social('linkedin'), 'Professional&trade;. Open to work, opportunities, and free snacks.', 'ext') +
                searchResult('@damienbuilds.dev &middot; Instagram', social('instagram'), 'Screenshots of code that compiled on the first try. A rare and beautiful archive.', 'ext') +
                searchResult('Download more RAM &mdash; 100% FREE (legit)', RICK, 'Your PC is low on memory. Click here to install an extra 16&nbsp;GB instantly. No catch.', 'ext') +
                searchResult('&#9733; YOU are visitor 1,000,000 &mdash; claim your prize &#9733;', RICK, 'CONGRATULATIONS!!! A brand-new iPod is reserved in your name. Click within 0:59 to claim.', 'ext') +
                searchResult('Hire Damien (Sponsored)', 'mailto:' + CONTACT_EMAIL, 'The #1 result for &ldquo;' + esc(q) + '&rdquo;. Sponsored. (Sponsored by him.)', 'mail') +
                searchResult('Guestbook', U_GUEST, 'Sign it. Visitor #1337 awaits. ~*~');
            results = '<div class="bw-results"><p class="bw-results-meta">Results <b>1&ndash;9</b> of about <b>4,000,000,000</b> for &ldquo;' + esc(q) + '&rdquo; (0.04 seconds)</p>' +
                rows + '</div>';
        }
        return '<div class="bw-page bw-search">' + nav('search') +
            '<div class="bw-av"><div class="bw-av-logo">Alta<b>Vista</b></div>' +
            '<form class="bw-av-form"><input class="bw-av-input" type="text" value="' + esc(q) + '" placeholder="Search the web" aria-label="Search the web"><button class="bw-av-btn" type="submit">Search</button></form>' +
            '<p class="bw-av-tip">Tip: searching for literally anything returns me. The algorithm is deeply biased.</p></div>' +
            results + '</div>';
    }

    // Guestbook — seeded entries + visitor-submitted ones persisted in
    // localStorage, plus a visitor counter that climbs as you come back.
    var GB_KEY    = 'gb-entries-v1';
    var GB_VISITS = 'gb-visits-v1';

    function gbStored() {
        try { return JSON.parse(localStorage.getItem(GB_KEY)) || []; } catch (e) { return []; }
    }
    function gbBumpVisits() {
        var n = 0;
        try { n = (parseInt(localStorage.getItem(GB_VISITS), 10) || 0) + 1; localStorage.setItem(GB_VISITS, String(n)); } catch (e) {}
        var total = 1337 + n;                       // everyone starts as a leet visitor
        return ('0000000' + total).slice(-8);       // zero-padded, 8 digits
    }
    function gbEntryHtml(name, msg, date, mine) {
        return '<div class="bw-gb-entry' + (mine ? ' bw-gb-mine' : '') + '">' +
            '<div class="bw-gb-head"><b>' + esc(name) + '</b><span>' + esc(date) + '</span></div>' +
            '<p>' + esc(msg) + '</p></div>';
    }
    function guestbookPage() {
        var seed = [
            ['xXx_n3tscape_n4vigator_xXx', 'cool site!!1! how do u make the windows move?? teach me ur ways', '08/14/1998'],
            ['HotMail_Linda', 'i was looking for casserole recipes but this is fine too. 10/10 would visit again', '12/02/1999'],
            ['SysAdmin_Greg', 'whoever set tea.exe to 420% CPU, please see me. this is a final warning.', '01/01/2000'],
            ['DialUpDan', 'took 45 mins to load on my 56k but worth every screech. bookmarked!!', '03/22/2001'],
            ['webring_wendy', 'added u to the Cool Sites webring. next site is a page about ferrets. ur welcome', '11/09/2003'],
            ['anonymous_coward', 'the cake is a lie', '06/06/2006'],
            ['ur_mom', 'come home for dinner. you have been on this computer for 9 hours.', '&mdash;']
        ];
        var mine = gbStored();
        var list = mine.map(function (e) { return gbEntryHtml(e[0], e[1], e[2], true); }).join('') +
                   seed.map(function (e) { return gbEntryHtml(e[0], e[1], e[2], false); }).join('');
        var count = mine.length + seed.length;
        return '<div class="bw-page bw-guestbook">' + nav('guestbook') +
            '<h2 class="bw-gb-title">~*~ Sign My Guestbook ~*~</h2>' +
            '<p class="bw-gb-sub">You are visitor number <span class="bw-counter">' + gbBumpVisits() + '</span> &middot; ' +
                '<span class="bw-gb-signs">' + count + ' signature' + (count === 1 ? '' : 's') + '</span></p>' +
            '<form class="bw-gb-form">' +
                '<input class="bw-gb-name" type="text" maxlength="28" placeholder="Your name / handle" aria-label="Your name">' +
                '<div class="bw-gb-row">' +
                    '<textarea class="bw-gb-input" rows="2" maxlength="280" placeholder="Leave your mark on the internet forever..." aria-label="Your guestbook entry"></textarea>' +
                    '<button class="bw-gb-btn" type="submit">Sign it!</button>' +
                '</div>' +
            '</form>' +
            '<div class="bw-gb-list">' + list + '</div></div>';
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
            '<p class="bw-404-code">HTTP 404 &mdash; File not found<br>Microsoft Internet Explorer</p></div>';
    }

    var PAGES = {};
    PAGES[HOME]     = { title: 'Damien — Projects',      html: homePage, after: function () { if (window.renderPortfolio) window.renderPortfolio(); } };
    PAGES[U_SEARCH] = { title: 'AltaVista — Search',     html: function () { return searchPage(''); } };
    PAGES[U_GUEST]  = { title: 'Guestbook',              html: guestbookPage };
    PAGES[U_BLOG]   = { title: "Damien's Blog",          html: blogPage };

    // ── Navigation engine ───────────────────────────────────────
    var hist = [], hpos = -1;

    function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
    function setTitle(t) {
        var full = t + ' - Microsoft Internet Explorer';
        if (titleEl) titleEl.textContent = full;
        if (ieBlock) ieBlock.dataset.winName = full;
    }
    function resolve(url) {
        url = (url || '').trim();
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url.replace(/^\/+/, '');
        return url.replace(/\/+$/, '');     // drop trailing slash so keys match
    }

    function paint(url) {
        var p = PAGES[url];
        setStatus('Opening page ' + url + ' …');
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
        var sf = page.querySelector('.bw-av-form');
        if (sf) sf.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = page.querySelector('.bw-av-input').value;
            page.innerHTML = searchPage(q);   // re-render in place with results
            wirePage();
            page.scrollTop = 0;
        });
        var gf = page.querySelector('.bw-gb-form');
        if (gf) gf.addEventListener('submit', function (e) {
            e.preventDefault();
            var ta = page.querySelector('.bw-gb-input');
            var nameEl = page.querySelector('.bw-gb-name');
            var txt = (ta.value || '').trim();
            if (!txt) return;
            var name = (nameEl && nameEl.value.trim()) || 'anonymous_visitor';
            var date = new Date().toLocaleDateString('en-US');
            // Persist (newest first, cap the stash so it can't grow forever).
            var stored = gbStored();
            stored.unshift([name, txt, date]);
            try { localStorage.setItem(GB_KEY, JSON.stringify(stored.slice(0, 50))); } catch (e2) {}
            // Prepend to the visible list without a full re-render.
            var list = page.querySelector('.bw-gb-list');
            var tmp = document.createElement('div');
            tmp.innerHTML = gbEntryHtml(name, txt, date, true);
            list.insertBefore(tmp.firstChild, list.firstChild);
            ta.value = ''; if (nameEl) nameEl.value = '';
        });
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

    go(HOME);   // boot to the portfolio
})();
