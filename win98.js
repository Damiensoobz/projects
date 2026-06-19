// ─────────────────────────────────────────────────────────────
//  win98.js  —  desktop environment: taskbar, Start menu, live
//  tray clock, and a tiny window manager (minimize / maximize /
//  close ↔ taskbar). Chrome is styled by the Win98 skin via CSS;
//  the behavior here is presentation-agnostic.
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
            '<button class="sm-item" data-sm="restart"><span class="sm-ico sm-ico-restart"></span>Restart</button>' +
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
        ie:       { l: 0.129, t: 0.178, w: 600 },
        dos:      { l: 0.266, t: 0.010, w: 440 },
        notepad:  { l: 0.366, t: 0.340, w: 460 },
        winamp:   { l: 0.612, t: 0.123, w: 300 },
        cdplayer: { l: 0.779, t: 0.412, w: 310 },
        terminal: { l: 0.627, t: 0.697, w: 360 }
    };
    // Back-to-front: IE under DOS under Notepad; the right-hand apps sit on top.
    var Z_ORDER = ['ie', 'dos', 'notepad', 'winamp', 'cdplayer', 'terminal'];
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
            else if (sm === 'restart') restartGag();
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
        { kind: 'bin',      label: 'Recycle Bin',   action: function () { openRecycleBin(); } }
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
        setTimeout(killBoot, 3000);          // a proper few-second boot (click to skip)
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

    // ── Recycle Bin → faux explorer of "deleted" things ─────────
    function openRecycleBin() {
        var files = [
            { ic: 'html', name: 'portfolio_v1_FINAL_final.html', meta: 'HTML Document &middot; 4 KB' },
            { ic: 'txt',  name: 'good_intentions.txt',           meta: 'Text Document &middot; 0 KB' },
            { ic: 'exe',  name: 'free_time.exe',                 meta: 'Application &middot; 404 KB' },
            { ic: 'log',  name: 'that_one_bug.log',              meta: 'Log File &middot; 666 KB' },
            { ic: 'dll',  name: 'motivation.dll',               meta: 'status: missing' },
            { ic: 'txt',  name: 'NYE_resolution_2019.doc',       meta: 'never opened' }
        ];
        var rowsHtml = files.map(function (f) {
            return '<li class="rb-row"><span class="rb-ico rb-ico-' + f.ic + '"></span>' +
                   '<span class="rb-name">' + esc(f.name) + '</span>' +
                   '<span class="rb-meta">' + f.meta + '</span></li>';
        }).join('');
        var html =
            '<div class="rb">' +
                '<div class="rb-toolbar">' +
                    '<button class="rb-empty">Empty Recycle Bin</button>' +
                    '<button class="rb-restore">Restore</button>' +
                '</div>' +
                '<ul class="rb-list">' + rowsHtml + '</ul>' +
                '<div class="rb-status"><span class="rb-count">' + files.length + ' object(s)</span></div>' +
            '</div>';
        var w = createWindow('Recycle Bin', html, 'rb-win');
        var list   = w.body.querySelector('.rb-list');
        var status = w.body.querySelector('.rb-status');
        w.body.querySelector('.rb-empty').addEventListener('click', function () {
            list.classList.add('rb-emptying');
            setTimeout(function () {
                list.innerHTML = '<li class="rb-zero">This folder is empty.</li>';
                list.classList.remove('rb-emptying');
                status.innerHTML = '<span class="rb-count">0 object(s)</span>';
                setTimeout(function () {                 // gag: nothing is ever truly deleted
                    list.innerHTML = rowsHtml;
                    status.innerHTML = '<span class="rb-count">' + files.length +
                        ' object(s)</span> &middot; nothing is ever <i>really</i> deleted';
                }, 1700);
            }, 450);
        });
        w.body.querySelector('.rb-restore').addEventListener('click', function () {
            openDialog('Restore File', '<p class="dlg-p">Restore <b>free_time.exe</b>?<br><br>' +
                'Error 0x1A4: file is currently in use by <i>adult life</i> and cannot be restored.</p>');
        });
    }

    // ── Restart → black "Restarting…" then a fresh boot splash ──
    function restartGag() {
        var s = document.createElement('div');
        s.className = 'shutdown-screen';
        s.innerHTML = '<div class="shutdown-text">Restarting&hellip;</div>';
        document.body.appendChild(s);
        sessionStorage.removeItem('booted');   // so the boot splash replays on reload
        setTimeout(function () { location.reload(); }, 1100);
    }

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

})();
