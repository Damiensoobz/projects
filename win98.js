// ─────────────────────────────────────────────────────────────
//  win98.js  —  desktop environment: taskbar, Start menu, live
//  tray clock, and a tiny window manager (minimize / maximize /
//  close ↔ taskbar). Chrome is skin-themed via CSS; the behavior
//  is skin-agnostic. Loads after theme.js.
// ─────────────────────────────────────────────────────────────
(function () {
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Managed windows = content blocks that have a command title.
    var blocks = [].slice.call(document.querySelectorAll('.block'))
        .filter(function (b) { return b.querySelector('.prompt .p-cmd'); });
    if (!blocks.length) return;

    blocks.forEach(function (b, i) {
        b.dataset.winId = 'win' + i;
        // An app-styled section sets its own window/taskbar title; otherwise
        // the command text is used.
        var titleEl  = b.querySelector('.p-cmd');
        var appTitle = b.getAttribute('data-app-title');
        if (appTitle) titleEl.textContent = appTitle;
        b.dataset.winName = titleEl.textContent.trim();
    });

    // The terminal-style <hr> dividers don't belong in the windowed desktop —
    // they'd orphan as floating lines whenever a window collapses. Remove them
    // here so the no-JS view still keeps them as section separators.
    [].forEach.call(document.querySelectorAll('.divider'), function (d) { d.remove(); });

    // ── Taskbar ─────────────────────────────────────────────────
    var bar = document.createElement('div');
    bar.className = 'taskbar';
    bar.innerHTML =
        '<button class="start-btn" id="start-btn"><span class="start-logo"></span>Start</button>' +
        '<div class="task-buttons" id="task-buttons"></div>' +
        '<div class="tray" id="tray"><span class="tray-clock" id="tray-clock"></span></div>';
    document.body.appendChild(bar);

    // Relocate the existing skin toggle into the system tray.
    var toggle = document.getElementById('theme-toggle');
    var tray   = document.getElementById('tray');
    if (toggle && tray) tray.insertBefore(toggle, document.getElementById('tray-clock'));

    // ── Start menu ──────────────────────────────────────────────
    var menu = document.createElement('div');
    menu.className = 'start-menu';
    menu.hidden = true;
    menu.innerHTML =
        '<div class="sm-rail">damien<b>98</b></div>' +
        '<div class="sm-list">' +
            '<div class="sm-head">Programs</div>' +
            blocks.map(function (b) {
                return '<button class="sm-item" data-target="' + b.dataset.winId + '">' +
                       '<span class="sm-ico"></span>' + esc(b.dataset.winName) + '</button>';
            }).join('') +
            '<div class="sm-sep"></div>' +
            '<button class="sm-item" data-sm="mines"><span class="sm-ico sm-ico-mine"></span>Minesweeper</button>' +
            '<button class="sm-item" data-sm="shutdown"><span class="sm-ico sm-ico-shut"></span>Shut Down&hellip;</button>' +
        '</div>';
    document.body.appendChild(menu);

    // ── Per-window taskbar buttons ──────────────────────────────
    var taskBtns = {};
    var taskWrap = document.getElementById('task-buttons');
    blocks.forEach(function (b) {
        var tb = document.createElement('button');
        tb.className = 'task-btn active';
        tb.dataset.target = b.dataset.winId;
        tb.innerHTML = '<span class="tb-ico"></span><span class="tb-label">' + esc(b.dataset.winName) + '</span>';
        tb.addEventListener('click', function () { toggleFromTask(b); });
        taskWrap.appendChild(tb);
        taskBtns[b.dataset.winId] = tb;
    });

    // ── Window control buttons (min / max / close) ──────────────
    blocks.forEach(function (b) {
        var prompt = b.querySelector('.prompt');
        prompt.classList.add('wm');                       // hides the decorative ::after buttons
        var ctrls = document.createElement('span');
        ctrls.className = 'win-ctrls';
        ctrls.innerHTML =
            '<button class="wc wc-min"   title="Minimize" aria-label="Minimize"></button>' +
            '<button class="wc wc-max"   title="Maximize" aria-label="Maximize"></button>' +
            '<button class="wc wc-close" title="Close"    aria-label="Close"></button>';
        prompt.appendChild(ctrls);
        ctrls.querySelector('.wc-min').addEventListener('click',   function (e) { e.stopPropagation(); minimize(b); });
        ctrls.querySelector('.wc-max').addEventListener('click',   function (e) { e.stopPropagation(); toggleMax(b); });
        ctrls.querySelector('.wc-close').addEventListener('click', function (e) { e.stopPropagation(); closeWin(b); });
    });

    function setTaskState(b, state) {           // 'active' | 'inactive' | 'gone'
        var tb = taskBtns[b.dataset.winId];
        if (!tb) return;
        tb.hidden = (state === 'gone');
        tb.classList.toggle('active',   state === 'active');
        tb.classList.toggle('inactive', state === 'inactive');
    }

    function minimize(b) {
        if (b.classList.contains('win-max')) toggleMax(b);
        b.classList.add('win-min');
        setTaskState(b, 'inactive');
    }
    function restore(b) {
        b.classList.remove('win-min', 'win-closed');
        setTaskState(b, 'active');
        if (desktopMode) bringFront(b);
        else b.scrollIntoView({ block: 'nearest' });
    }
    function toggleFromTask(b) {
        if (b.classList.contains('win-min') || b.classList.contains('win-closed')) restore(b);
        else minimize(b);
    }
    function toggleMax(b) {
        b.classList.toggle('win-max');
        if (b.classList.contains('win-max')) b.classList.remove('win-min');
        document.body.classList.toggle('has-max', !!document.querySelector('.win-max'));
    }
    function closeWin(b) {
        if (b.classList.contains('win-max')) toggleMax(b);
        b.classList.add('win-closed');
        setTaskState(b, 'gone');
    }
    function openFromMenu(id) {
        var b = document.querySelector('[data-win-id="' + id + '"]');
        if (b) restore(b);
    }

    // ── Desktop layout + draggable windows ──────────────────────
    // On wide screens the sections become free-floating windows in a
    // single-screen cascade (Blog up front). Narrow screens keep the tidy
    // stacked flow with dragging off. Positions/widths are fractions of the
    // desktop so the arrangement scales; each window's content area caps its
    // own height and scrolls internally, so the desktop never page-scrolls.
    var LAYOUT = {
        dos:      { l: 0.085, t: 0.02, w: 440 },
        notepad:  { l: 0.610, t: 0.03, w: 460 },
        ie:       { l: 0.220, t: 0.07, w: 600 },
        winamp:   { l: 0.010, t: 0.50, w: 300 },
        terminal: { l: 0.400, t: 0.58, w: 360 },
        cdplayer: { l: 0.715, t: 0.55, w: 310 },
        outlook:  { l: 0.545, t: 0.40, w: 540 }
    };
    var Z_ORDER = ['dos', 'notepad', 'winamp', 'cdplayer', 'terminal', 'outlook', 'ie'];
    var zTop = 20;
    var desktopMode = false;

    function isDesktop() { return window.innerWidth >= 1024 && window.innerHeight >= 560; }

    function applyLayout() {
        desktopMode = isDesktop();
        document.documentElement.classList.toggle('desktop-mode', desktopMode);
        if (!desktopMode) {
            blocks.forEach(function (b) { b.style.left = b.style.top = b.style.width = b.style.zIndex = b.style.transform = ''; });
            return;
        }
        var W = window.innerWidth, H = window.innerHeight - 30;
        zTop = 20;
        Z_ORDER.forEach(function (app, i) {
            var b = document.querySelector('[data-app="' + app + '"]');
            var L = LAYOUT[app];
            if (!b || !L) return;
            var left = Math.round(Math.max(2, Math.min(L.l * W, W - 90)));
            var top  = Math.round(Math.max(2, Math.min(L.t * H, H - 60)));
            b.style.width  = Math.min(L.w, W - 16) + 'px';
            b.style.left   = left + 'px';
            b.style.top    = top + 'px';
            b.style.transform = '';
            b.style.zIndex = 20 + i;
            b.dataset.homeLeft = left + 'px';
            b.dataset.homeTop  = top + 'px';
            zTop = 20 + i;
        });
    }

    function bringFront(b) { b.style.zIndex = ++zTop; }
    function resetWin(b) {
        if (desktopMode && b.dataset.homeLeft) { b.style.left = b.dataset.homeLeft; b.style.top = b.dataset.homeTop; bringFront(b); }
        else b.style.transform = '';
    }

    function makeDraggable(b) {
        var bar = b.querySelector('.prompt');
        bar.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || e.target.closest('.win-ctrls')) return;
            if (desktopMode) bringFront(b);
            if (!desktopMode || b.classList.contains('win-max')) return;
            e.preventDefault();
            document.body.classList.add('dragging');
            var sx = e.clientX, sy = e.clientY;
            var startL = parseFloat(b.style.left) || b.getBoundingClientRect().left;
            var startT = parseFloat(b.style.top)  || b.getBoundingClientRect().top;
            function move(ev) {
                b.style.left = (startL + ev.clientX - sx) + 'px';
                b.style.top  = (startT + ev.clientY - sy) + 'px';
            }
            function up() {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                document.body.classList.remove('dragging');
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        bar.addEventListener('dblclick', function (e) {
            if (e.target.closest('.win-ctrls')) return;
            resetWin(b);
        });
    }
    blocks.forEach(makeDraggable);
    function tidyWindows() { applyLayout(); }

    applyLayout();
    var _resizeT;
    window.addEventListener('resize', function () { clearTimeout(_resizeT); _resizeT = setTimeout(applyLayout, 150); });

    // ── Start menu open/close ───────────────────────────────────
    var startBtn = document.getElementById('start-btn');
    function setMenu(open) {
        menu.hidden = !open;
        startBtn.classList.toggle('pressed', open);
    }
    startBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    [].forEach.call(menu.querySelectorAll('.sm-item'), function (it) {
        it.addEventListener('click', function () {
            var sm = it.getAttribute('data-sm');
            if (sm === 'mines') { if (window.launchMinesweeper) window.launchMinesweeper(); }
            else if (sm === 'shutdown') shutDownGag();
            else openFromMenu(it.dataset.target);
            setMenu(false);
        });
    });

    // ── Live tray clock ─────────────────────────────────────────
    var clock = document.getElementById('tray-clock');
    function tick() {
        var d = new Date();
        var h = d.getHours(), m = d.getMinutes();
        var ap = h < 12 ? 'AM' : 'PM';
        var hh = h % 12; if (hh === 0) hh = 12;
        clock.textContent = hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
        clock.title = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    tick();
    setInterval(tick, 15000);

    // ── Reusable Win98 dialog ───────────────────────────────────
    function openDialog(title, bodyHtml) {
        var ov = document.createElement('div');
        ov.className = 'dlg-overlay';
        ov.innerHTML =
            '<div class="dlg" role="dialog" aria-label="' + esc(title) + '">' +
                '<div class="dlg-bar"><span class="dlg-title">' + esc(title) + '</span>' +
                    '<button class="dlg-x" aria-label="Close"></button></div>' +
                '<div class="dlg-body">' + bodyHtml + '</div>' +
                '<div class="dlg-foot"><button class="dlg-ok">OK</button></div>' +
            '</div>';
        document.body.appendChild(ov);
        function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
        function onKey(e) { if (e.key === 'Escape') close(); }
        ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
        ov.querySelector('.dlg-x').addEventListener('click', close);
        ov.querySelector('.dlg-ok').addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        ov.querySelector('.dlg-ok').focus();
        return ov;
    }

    function sysInfoHtml() {
        return '<div class="dlg-sys">' +
            '<div class="dlg-sys-logo"></div>' +
            '<div class="dlg-sys-text">' +
                '<p><b>damienOS 98</b></p>' +
                '<p>Registered to: one (1) code wizard</p>' +
                '<p>Display: ' + window.innerWidth + ' × ' + window.innerHeight + '</p>' +
                '<p>Caffeine: <b>critical</b></p>' +
            '</div></div>';
    }

    // ── Desktop icons ───────────────────────────────────────────
    var deskIcons = [
        { kind: 'computer', label: 'My Computer',   action: function () { openDialog('My Computer', sysInfoHtml()); } },
        { kind: 'note',     label: 'aboutMe.txt',   action: function () { var n = document.querySelector('[data-app="notepad"]'); if (n) restore(n); } },
        { kind: 'mine',     label: 'Minesweeper',   action: function () { if (window.launchMinesweeper) window.launchMinesweeper(); } },
        { kind: 'secret',   label: 'TopSecret.exe', action: function () { openDialog('TopSecret.exe', '<p class="dlg-p"><b>ACCESS DENIED.</b><br><br>Nice try. The good stuff is still in the cauldron &mdash; <a href="mailto:hello@damienbuilds.dev">ask nicely</a>.</p>'); } },
        { kind: 'bin',      label: 'Recycle Bin',   action: function () { openDialog('Recycle Bin', '<p class="dlg-p">Recycle Bin contents:<br>&bull; 0 regrets<br>&bull; 3 abandoned side-projects<br>&bull; 1 New Year&rsquo;s resolution (2019)</p>'); } }
    ];
    var deskWrap = document.createElement('div');
    deskWrap.className = 'desktop-icons';
    deskIcons.forEach(function (ic) {
        var b = document.createElement('button');
        b.className = 'desk-icon icon-' + ic.kind;
        b.innerHTML = '<span class="desk-glyph"></span><span class="desk-label">' + esc(ic.label) + '</span>';
        b.addEventListener('click', ic.action);
        deskWrap.appendChild(b);
    });
    document.body.appendChild(deskWrap);

    // ── "Activate Windows" desktop watermark (also the footer) ──
    var wm = document.createElement('div');
    wm.className = 'activate-wm';
    wm.innerHTML =
        '<div class="activate-title">Activate Damien</div>' +
        '<div class="activate-sub">Go to Settings to activate Damien</div>' +
        '<div class="activate-foot">&copy; ' + new Date().getFullYear() +
            ' Damien &middot; built with caffeine &amp; questionable decisions' +
            ' &middot; <a href="https://github.com/Damiensoobz" target="_blank" rel="noopener noreferrer">GitHub</a>' +
            ' &middot; <a href="mailto:hello@damienbuilds.dev">hire me</a></div>';
    document.body.appendChild(wm);

    // ── Desktop right-click context menu ────────────────────────
    var ctx = document.createElement('div');
    ctx.className = 'ctx-menu';
    ctx.hidden = true;
    ctx.innerHTML =
        '<button class="ctx-item" data-act="refresh">Refresh</button>' +
        '<button class="ctx-item" data-act="tidy">Tidy Windows</button>' +
        '<div class="ctx-sep"></div>' +
        '<button class="ctx-item" data-act="props">Properties</button>';
    document.body.appendChild(ctx);
    function hideCtx() { ctx.hidden = true; }
    document.addEventListener('contextmenu', function (e) {
        if (e.target.closest('a, button, input, textarea, img, .card-img')) return;  // keep native menu on links/media
        e.preventDefault();
        ctx.hidden = false;
        var w = ctx.offsetWidth || 160, h = ctx.offsetHeight || 120;
        ctx.style.left = Math.min(e.clientX, window.innerWidth - w - 4) + 'px';
        ctx.style.top  = Math.min(e.clientY, window.innerHeight - h - 34) + 'px';
    });
    document.addEventListener('click', hideCtx);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideCtx(); });
    ctx.addEventListener('click', function (e) {
        var act = e.target.getAttribute('data-act');
        if (act === 'refresh' && window.triggerScramble) window.triggerScramble();
        else if (act === 'tidy') tidyWindows();
        else if (act === 'props') openDialog('Display Properties', sysInfoHtml());
        hideCtx();
    });

    // ── One-time boot splash (per browser session) ──────────────
    if (!sessionStorage.getItem('booted')) {
        sessionStorage.setItem('booted', '1');
        var boot = document.createElement('div');
        boot.className = 'boot-splash';
        boot.innerHTML =
            '<div class="boot-box">' +
                '<div class="boot-logo"></div>' +
                '<div class="boot-name">damien<b>98</b></div>' +
                '<div class="boot-bar"><span></span></div>' +
                '<div class="boot-tip">starting up&hellip;</div>' +
            '</div>';
        document.body.appendChild(boot);
        var killBoot = function () {
            boot.classList.add('boot-done');
            setTimeout(function () { if (boot.parentNode) boot.remove(); }, 500);
        };
        setTimeout(killBoot, 1900);          // fail-safe auto-dismiss
        boot.addEventListener('click', killBoot);
    }

    // ── Internet Explorer toolbar (projects "blog" app) ─────────
    var ieApp = document.querySelector('[data-app="ie"]');
    if (ieApp) {
        var ieStatus = ieApp.querySelector('.ie-status-text');
        function ieFlash(msg) {
            if (!ieStatus) return;
            ieStatus.textContent = msg;
            setTimeout(function () { ieStatus.textContent = 'Done'; }, 1000);
        }
        var refreshBtn = ieApp.querySelector('[data-ie="refresh"]');
        var homeBtn    = ieApp.querySelector('[data-ie="home"]');
        if (refreshBtn) refreshBtn.addEventListener('click', function () {
            ieFlash('Opening page http://damienbuilds.dev/blog ...');
            if (window.reloadBlog) window.reloadBlog();
        });
        if (homeBtn) homeBtn.addEventListener('click', function () {
            var page = ieApp.querySelector('.ie-page');
            if (page) page.scrollTop = 0;
        });
    }

    // ── Generic draggable floating window (games / gags) ────────
    var fwZ = 600;
    function createWindow(title, contentHtml, cls) {
        var w = document.createElement('div');
        w.className = 'fw' + (cls ? ' ' + cls : '');
        w.style.zIndex = ++fwZ;
        w.innerHTML =
            '<div class="fw-bar"><span class="fw-title">' + esc(title) + '</span>' +
                '<button class="fw-x" aria-label="Close"></button></div>' +
            '<div class="fw-body">' + contentHtml + '</div>';
        document.body.appendChild(w);
        w.style.left = Math.max(8, Math.round((window.innerWidth - w.offsetWidth) / 2 + (Math.random() * 50 - 25))) + 'px';
        w.style.top  = Math.max(8, Math.round((window.innerHeight - w.offsetHeight) / 2 - 50)) + 'px';
        var bar = w.querySelector('.fw-bar');
        bar.addEventListener('mousedown', function (e) {
            if (e.target.closest('.fw-x')) return;
            w.style.zIndex = ++fwZ; e.preventDefault();
            var sx = e.clientX, sy = e.clientY, l = parseFloat(w.style.left), t = parseFloat(w.style.top);
            function mv(ev) { w.style.left = (l + ev.clientX - sx) + 'px'; w.style.top = (t + ev.clientY - sy) + 'px'; }
            function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
        function close() { w.remove(); }
        w.querySelector('.fw-x').addEventListener('click', close);
        return { el: w, body: w.querySelector('.fw-body'), close: close };
    }
    window.win98 = { openDialog: openDialog, createWindow: createWindow };

    // ── Shut Down gag ───────────────────────────────────────────
    function shutDownGag() {
        var s = document.createElement('div');
        s.className = 'shutdown-screen';
        s.innerHTML = '<div class="shutdown-text">It&rsquo;s now safe to turn off your portfolio.</div>' +
                      '<div class="shutdown-sub">(click anywhere to power back on)</div>';
        document.body.appendChild(s);
        setTimeout(function () { s.addEventListener('click', function () { s.remove(); }); }, 400);
    }

    // ── Konami code → (harmless) Blue Screen of Death ───────────
    function bsod() {
        if (document.querySelector('.bsod')) return;
        var b = document.createElement('div');
        b.className = 'bsod';
        b.innerHTML =
            '<div class="bsod-inner">' +
                '<p class="bsod-h">&nbsp;DAMIEN&nbsp;</p>' +
                '<p>A problem has been detected and your good time has been shut down to prevent damage to your productivity.</p>' +
                '<p>The problem seems to be caused by: <b>TOO_MUCH_FUN.SYS</b></p>' +
                '<p>If this is the first time you have seen this screen, relax &mdash; it&rsquo;s a bit. Damien is fine. Probably.</p>' +
                '<p>&nbsp;</p>' +
                '<p>* Press any key to continue</p>' +
                '<p>* Or just hire him: hello@damienbuilds.dev</p>' +
                '<p class="bsod-blink">_</p>' +
            '</div>';
        document.body.appendChild(b);
        function dismiss() { b.remove(); document.removeEventListener('keydown', onk); }
        function onk() { dismiss(); }
        setTimeout(function () { document.addEventListener('keydown', onk); b.addEventListener('click', dismiss); }, 700);
    }
    var konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65], kpos = 0;
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === konami[kpos]) { kpos++; if (kpos === konami.length) { kpos = 0; bsod(); } }
        else { kpos = (e.keyCode === konami[0]) ? 1 : 0; }
    });

    // ── Clippy-style helper ─────────────────────────────────────
    (function initClippy() {
        var c = document.createElement('div');
        c.className = 'clippy';
        c.innerHTML =
            '<div class="clippy-bubble"><span class="clippy-text"></span>' +
                '<div class="clippy-actions"><button class="clippy-next">Tell me more</button>' +
                '<button class="clippy-bye">Go away</button></div></div>' +
            '<button class="clippy-guy" title="It looks like you need help"></button>';
        document.body.appendChild(c);
        var tips = [
            'It looks like you&rsquo;re trying to hire a developer. Want a hand?',
            'Psst &mdash; right-click the desktop. There&rsquo;s a menu.',
            'The Blog window scrolls. There&rsquo;s more in there than fits.',
            'Drag any title bar to move a window. Double-click it to send it home.',
            'Bored? Start &rarr; Minesweeper. You&rsquo;re welcome.',
            'Try the skin toggle in the tray. Game Boy mode is a vibe.',
            'Damien tests his code before it touches main. Wild, I know.',
            'I am legally distinct from a paperclip you may remember.'
        ];
        var i = 0;
        function show(msg) { c.querySelector('.clippy-text').innerHTML = msg; c.classList.add('open'); }
        c.querySelector('.clippy-next').addEventListener('click', function () { i = (i + 1) % tips.length; show(tips[i]); });
        c.querySelector('.clippy-bye').addEventListener('click', function () { c.remove(); });
        c.querySelector('.clippy-guy').addEventListener('click', function () { c.classList.toggle('open'); });
        setTimeout(function () { show(tips[0]); }, 6500);
    })();
})();
