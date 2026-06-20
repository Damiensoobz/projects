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

    var HOME      = 'http://www.damienbuilds.dev/projects';
    var U_SEARCH  = 'http://www.altavista.com';
    var U_GUEST   = 'http://www.damienbuilds.dev/guestbook';
    var U_TRUTH   = 'http://the-truth.geocities.com/wake-up';
    var U_BLOG    = 'http://www.damienbuilds.dev/blog';

    // ── Shared retro nav bar ────────────────────────────────────
    function nav(active) {
        var links = [
            ['Home', HOME, 'projects'], ['Search', U_SEARCH, 'search'],
            ['Guestbook', U_GUEST, 'guestbook'], ['The Truth', U_TRUTH, 'truth'],
            ['Blog', U_BLOG, 'blog']
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
            '<p class="ie-teaser-body">Something new is in the cauldron. Bookmark this page (Ctrl&#8209;D, it&rsquo;ll pretend to work) and check back &mdash; or just <a href="mailto:hello@damienbuilds.dev">email me</a> and beat the queue.</p></div>' +
            '</div>';
    }

    function searchResult(title, link, desc, mail) {
        var a = mail
            ? '<a class="bw-result-title" href="' + esc(link) + '">' + esc(title) + '</a>'
            : '<a class="bw-result-title" data-link="' + esc(link) + '">' + esc(title) + '</a>';
        return '<div class="bw-result">' + a +
            '<p class="bw-result-url">' + esc(link) + '</p><p class="bw-result-desc">' + desc + '</p></div>';
    }
    function searchPage(q) {
        var results = '';
        if (q) {
            results = '<div class="bw-results"><p class="bw-results-meta">Results <b>1&ndash;4</b> of about <b>4,000,000,000</b> for &ldquo;' + esc(q) + '&rdquo; (0.04 seconds)</p>' +
                searchResult('Damien &mdash; Projects', HOME, 'Browser games, a memento-mori calendar, a fantasy map generator. Exactly what you searched for. Probably.') +
                searchResult('Hire Damien (Sponsored)', 'mailto:hello@damienbuilds.dev', 'The #1 result for &ldquo;' + esc(q) + '&rdquo;. Sponsored. (Sponsored by him.)', true) +
                searchResult('The Truth They Don&rsquo;t Want You To See', U_TRUTH, 'We found the page they tried to bury. Click before it&rsquo;s gone.') +
                searchResult('Guestbook', U_GUEST, 'Sign it. Visitor #1337 awaits. ~*~') +
                '</div>';
        }
        return '<div class="bw-page bw-search">' + nav('search') +
            '<div class="bw-av"><div class="bw-av-logo">Alta<b>Vista</b></div>' +
            '<form class="bw-av-form"><input class="bw-av-input" type="text" value="' + esc(q) + '" placeholder="Search the web" aria-label="Search the web"><button class="bw-av-btn" type="submit">Search</button></form>' +
            '<p class="bw-av-tip">Tip: searching for literally anything returns me. The algorithm is deeply biased.</p></div>' +
            results + '</div>';
    }

    function guestbookPage() {
        var entries = [
            ['xXx_n3tscape_n4vigator_xXx', 'cool site!!1! how do u make the windows move?? teach me ur ways', '08/14/1998'],
            ['HotMail_Linda', 'i was looking for casserole recipes but this is fine too. 10/10 would visit again', '12/02/1999'],
            ['SysAdmin_Greg', 'whoever set caffeine.exe to 420% CPU, please see me. this is a final warning.', '01/01/2000'],
            ['anonymous_coward', 'the cake is a lie', '06/06/2006'],
            ['ur_mom', 'come home for dinner. you have been on this computer for 9 hours.', '&mdash;']
        ];
        return '<div class="bw-page bw-guestbook">' + nav('guestbook') +
            '<h2 class="bw-gb-title">~*~ Sign My Guestbook ~*~</h2>' +
            '<p class="bw-gb-sub">You are visitor number <span class="bw-counter">00001337</span></p>' +
            '<div class="bw-gb-list">' + entries.map(function (e) {
                return '<div class="bw-gb-entry"><div class="bw-gb-head"><b>' + e[0] + '</b><span>' + e[2] + '</span></div><p>' + e[1] + '</p></div>';
            }).join('') + '</div>' +
            '<form class="bw-gb-form"><textarea class="bw-gb-input" rows="2" placeholder="Leave your mark on the internet forever..." aria-label="Your guestbook entry"></textarea>' +
            '<button class="bw-gb-btn" type="submit">Sign it!</button></form></div>';
    }

    function truthPage() {
        return '<div class="bw-page bw-truth">' + nav('truth') +
            '<h1 class="bw-truth-h">WAKE UP.</h1>' +
            '<p class="bw-truth-p">They told you semicolons were <s>optional</s>. <span class="bw-blink">THEY LIED.</span></p>' +
            '<p class="bw-truth-p">Ever notice the bug only appears when you STOP looking for it? That is not a coincidence. That is <b>them</b>.</p>' +
            '<ul class="bw-truth-list">' +
            '<li>&#9658; &ldquo;It works on my machine&rdquo; &mdash; works on WHOSE machine??</li>' +
            '<li>&#9658; The cloud is just someone else&rsquo;s computer. WHOSE COMPUTER.</li>' +
            '<li>&#9658; Tabs vs spaces was engineered to DIVIDE US.</li>' +
            '<li>&#9658; The AI was trained on Stack Overflow. We are ruled by COPY-PASTE.</li></ul>' +
            '<p class="bw-truth-foot">I have said too much. If this page vanishes, you know why. <span class="bw-blink">TRUST NO ONE. EXCEPT DAMIEN. HE SEEMS NICE.</span></p>' +
            '</div>';
    }

    function constructionPage() {
        return '<div class="bw-page bw-construct">' + nav('blog') +
            '<div class="bw-barrier"></div>' +
            '<h2 class="bw-construct-h">&#9888; UNDER CONSTRUCTION &#9888;</h2>' +
            '<p class="bw-construct-p">This page is being lovingly hand-coded in Notepad. Please check back in&hellip; 1998.</p>' +
            '<div class="bw-barrier"></div>' +
            '<p class="bw-construct-foot">Best viewed in <b>Netscape Navigator 4.0</b> at 800&times;600.<br>This site is <b>Y2K compliant</b> (we hope).</p>' +
            '<p class="bw-construct-foot"><a data-link="' + HOME + '">&laquo; back to something that actually works</a></p></div>';
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
    PAGES[U_TRUTH]  = { title: "THE TRUTH (uncensored)", html: truthPage };
    PAGES[U_BLOG]   = { title: 'Blog — Under Construction', html: constructionPage };

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
            var txt = (ta.value || '').trim();
            if (!txt) return;
            var list = page.querySelector('.bw-gb-list');
            var entry = document.createElement('div');
            entry.className = 'bw-gb-entry';
            entry.innerHTML = '<div class="bw-gb-head"><b>you</b><span>' + esc(new Date().toLocaleDateString('en-US')) + '</span></div><p>' + esc(txt) + '</p>';
            list.insertBefore(entry, list.firstChild);
            ta.value = '';
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
