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
        it.addEventListener('click', function () { openFromMenu(it.dataset.target); setMenu(false); });
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
        { kind: 'computer', label: 'My Computer', action: function () { openDialog('My Computer', sysInfoHtml()); } },
        { kind: 'note',     label: 'readme.txt',  action: function () { openFromMenu(blocks[0] && blocks[0].dataset.winId); } },
        { kind: 'bin',      label: 'Recycle Bin', action: function () { openDialog('Recycle Bin', '<p class="dlg-p">The Recycle Bin is empty.<br>(No regrets in here.)</p>'); } }
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

    // ── "Activate Windows" desktop watermark (gag footer) ───────
    var wm = document.createElement('div');
    wm.className = 'activate-wm';
    wm.innerHTML =
        '<div class="activate-title">Activate Damien</div>' +
        '<div class="activate-sub">Go to Settings to activate Damien</div>';
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
})();
