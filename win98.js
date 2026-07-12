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

    var CONTACT_EMAIL = (typeof contactConfig !== 'undefined' && contactConfig.email) || 'damien@damienbuilds.dev';

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
        '<div class="tray" id="tray">' +
            '<button class="tray-ico tray-modem" id="tray-modem" title="Dial-Up Networking"></button>' +
            '<button class="tray-ico tray-vol" id="tray-vol" title="Volume"></button>' +
            '<span class="tray-clock" id="tray-clock"></span>' +
        '</div>';
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
                       '<span class="sm-ico sm-ico-' + b.getAttribute('data-app') + '"></span>' + esc(b.dataset.winName) + '</button>';
            }).join('') +
            '<div class="sm-sep"></div>' +
            '<div class="sm-head">Socials</div>' +
            (function () {
                var sc = (typeof socialConfig !== 'undefined') ? socialConfig : {};
                var defs = [
                    { key: 'instagram', label: 'Instagram' },
                    { key: 'linkedin',  label: 'LinkedIn'  },
                    { key: 'facebook',  label: 'Facebook'  },
                    { key: 'github',    label: 'GitHub'    },
                ];
                return defs.filter(function (d) { return sc[d.key]; })
                           .map(function (d) {
                               return '<button class="sm-item" data-href="' + esc(sc[d.key]) + '">' +
                                      '<span class="sm-ico sm-ico-' + d.key + '"></span>' + d.label + '</button>';
                           }).join('');
            })() +
            '<div class="sm-sep"></div>' +
            '<button class="sm-item" data-sm="calc"><span class="sm-ico sm-ico-calc"></span>Calculator</button>' +
            '<button class="sm-item" data-sm="mines"><span class="sm-ico sm-ico-mine"></span>Minesweeper</button>' +
            '<button class="sm-item" data-sm="taskmgr"><span class="sm-ico sm-ico-task"></span>Task Manager</button>' +
            '<button class="sm-item" data-sm="restart"><span class="sm-ico sm-ico-restart"></span>Restart</button>' +
        '</div>';
    document.body.appendChild(menu);

    // ── Per-window taskbar buttons ──────────────────────────────
    var taskBtns = {};
    var taskWrap = document.getElementById('task-buttons');
    blocks.forEach(function (b) {
        var tb = document.createElement('button');
        tb.className = 'task-btn active';
        tb.dataset.target = b.dataset.winId;
        tb.innerHTML = '<span class="sm-ico sm-ico-' + b.getAttribute('data-app') + '" title="' + esc(b.dataset.winName) + '"></span>';
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
        // Maximize only makes sense for the IE window (the projects browser).
        // The frameless status apps look broken maximized, so they get min+close.
        var canMax = b.getAttribute('data-app') === 'ie';
        ctrls.innerHTML =
            '<button class="wc wc-min"   title="Minimize" aria-label="Minimize"></button>' +
            (canMax ? '<button class="wc wc-max" title="Maximize" aria-label="Maximize"></button>' : '') +
            '<button class="wc wc-close" title="Close"    aria-label="Close"></button>';
        prompt.appendChild(ctrls);
        ctrls.querySelector('.wc-min').addEventListener('click',   function (e) { e.stopPropagation(); minimize(b); });
        if (canMax) ctrls.querySelector('.wc-max').addEventListener('click', function (e) { e.stopPropagation(); toggleMax(b); });
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
        var goingMax = !b.classList.contains('win-max');
        b.classList.toggle('win-max', goingMax);
        if (goingMax) {
            // Hand geometry to the .win-max CSS — clear the inline left/top/width
            // that applyLayout set, otherwise they'd pin it at its old size.
            b.classList.remove('win-min');
            b.style.left = b.style.top = b.style.width = '';
            bringFront(b);                       // keep it above the other windows
        } else {
            // Restore its home position + width from the saved layout.
            if (b.dataset.homeLeft) { b.style.left = b.dataset.homeLeft; b.style.top = b.dataset.homeTop; }
            var L = LAYOUT[b.getAttribute('data-app')];
            if (L) b.style.width = Math.min(L.w, window.innerWidth - 16) + 'px';
            bringFront(b);
        }
        document.body.classList.toggle('has-max', !!document.querySelector('.win-max'));
    }
    function closeWin(b) {
        if (b.classList.contains('win-max')) toggleMax(b);
        b.classList.add('win-closed');
        setTaskState(b, 'gone');
        // hello.bat is a startup script — you can't kill it, it just runs again.
        if (b.getAttribute('data-app') === 'dos') {
            setTimeout(function () { restore(b); if (window.dosRerun) window.dosRerun(); }, 750);
        }
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
    var defaultsDone = false;

    function isDesktop() { return window.innerWidth >= 1024 && window.innerHeight >= 560; }

    // Initial desktop arrangement (runs once, the first time desktop mode is
    // active): Foxfire (the projects browser) launches MAXIMIZED — it's the
    // main attraction. Steam starts minimized; aboutMe starts closed (reopen
    // from its desktop icon). hello.bat, Media Player, Terminal sit behind.
    function applyDefaultStates() {
        var cd = document.querySelector('[data-app="cdplayer"]');
        if (cd) minimize(cd);
        var np = document.querySelector('[data-app="notepad"]');
        if (np) closeWin(np);
        var ie = document.querySelector('[data-app="ie"]');
        if (ie && !ie.classList.contains('win-max')) toggleMax(ie);
    }

    function applyLayout() {
        desktopMode = isDesktop();
        document.documentElement.classList.toggle('desktop-mode', desktopMode);
        if (!desktopMode) {
            // Stacked mobile flow shows every window — undo any min/max/closed state.
            blocks.forEach(function (b) {
                b.style.left = b.style.top = b.style.width = b.style.zIndex = b.style.transform = '';
                if (b.classList.contains('win-min') || b.classList.contains('win-closed') || b.classList.contains('win-max')) {
                    b.classList.remove('win-min', 'win-closed', 'win-max');
                    setTaskState(b, 'active');
                }
            });
            document.body.classList.remove('has-max');
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
        if (!defaultsDone) { defaultsDone = true; applyDefaultStates(); }
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
            if (sm === 'mines') { openMinesweeper(); }
            else if (sm === 'calc') { openCalc(); }
            else if (sm === 'taskmgr') openTaskManager();
            else if (sm === 'restart') restartGag();
            else if (it.dataset.href) { window.open(it.dataset.href, '_blank', 'noopener,noreferrer'); }
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

    // ── Tray: volume control + dial-up modem ────────────────────
    (function tray() {
        var vol   = document.getElementById('tray-vol');
        var modem = document.getElementById('tray-modem');
        var pop = null;

        function buildPop() {
            pop = document.createElement('div');
            pop.className = 'vol-pop';
            pop.innerHTML =
                '<div class="vol-title">Volume</div>' +
                '<input class="vol-slider" type="range" min="0" max="11" value="11" aria-label="Volume">' +
                '<div class="vol-val">11</div>' +
                '<label class="vol-mute"><input type="checkbox" class="vol-mute-cb"> Mute</label>';
            document.body.appendChild(pop);
            pop.addEventListener('click', function (e) { e.stopPropagation(); });
            var slider = pop.querySelector('.vol-slider');
            var valEl  = pop.querySelector('.vol-val');
            var muteCb = pop.querySelector('.vol-mute-cb');
            function sync() {
                var v = +slider.value;
                var muted = muteCb.checked || v === 0;
                valEl.textContent = muted ? 'Mute' : (v === 11 ? '11 ♫' : v);
                if (vol) vol.classList.toggle('muted', muted);
            }
            slider.addEventListener('input', function () { if (muteCb.checked) muteCb.checked = false; sync(); });
            muteCb.addEventListener('change', sync);
            sync();
        }
        function toggleVol() {
            if (!pop) buildPop();
            var open = !pop.classList.contains('open');
            pop.classList.toggle('open', open);
            if (open) {
                var r = vol.getBoundingClientRect();
                pop.style.left   = Math.max(4, Math.min(r.left - 20, window.innerWidth - 84)) + 'px';
                pop.style.bottom = (window.innerHeight - r.top + 5) + 'px';
            }
        }
        if (vol) vol.addEventListener('click', function (e) { e.stopPropagation(); toggleVol(); });
        document.addEventListener('click', function () { if (pop) pop.classList.remove('open'); });

        if (modem) {
            modem.title = 'Dial-Up Networking — Connected at 56,600 bps';
            modem.addEventListener('click', function (e) {
                e.stopPropagation();
                openDialog('Dial-Up Networking', '<div class="dlg-sys"><div class="dlg-sys-logo modem-big"></div><div class="dlg-sys-text">' +
                    '<p><b>Connected to The Internet</b></p>' +
                    '<p>Speed: 56,600 bps (allegedly)</p>' +
                    '<p>Duration: 004:20:00</p>' +
                    '<p>Bytes received: a worrying amount</p>' +
                    '<p class="dim">Do not pick up the phone.</p></div></div>');
            });
        }
    })();

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

    // ── Desktop icons ───────────────────────────────────────────
    var deskIcons = [
        { kind: 'computer', label: 'My Computer',   action: function () { openSysProps(); } },
        { kind: 'note',     label: 'aboutMe.txt',   action: function () { var n = document.querySelector('[data-app="notepad"]'); if (n) restore(n); } },
        { kind: 'mine',     label: 'Minesweeper',   action: function () { openMinesweeper(); } },
        { kind: 'bin',      label: 'Recycle Bin',   action: function () { openRecycleBin(); } },
        { kind: 'instagram', label: 'Instagram', action: function () { openSocial('Instagram', social('instagram')); } },
        { kind: 'linkedin',  label: 'LinkedIn',  action: function () { openSocial('LinkedIn',  social('linkedin')); } },
        { kind: 'facebook',  label: 'Facebook',  action: function () { openSocial('Facebook',  social('facebook')); } },
        { kind: 'github',    label: 'GitHub',    action: function () { openSocial('GitHub',    social('github')); } }
    ];
    function social(key) { return (typeof socialConfig !== 'undefined' && socialConfig[key]) || ''; }
    function openSocial(name, url) {
        if (url) { window.open(url, '_blank', 'noopener,noreferrer'); }
        else { openDialog(name, '<p class="dlg-p">No ' + esc(name) + ' profile set yet.<br><br>Add your URL to <b>socialConfig</b> in <code>projects.js</code>.</p>'); }
    }
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

    // ── "Activate damienOS" desktop watermark (also the footer) ──
    // The sub-line is a real link: Settings = System Properties, where the
    // Activate Now button lives (and promptly regrets being pressed).
    var wm = document.createElement('div');
    wm.className = 'activate-wm';
    wm.innerHTML =
        '<div class="activate-title">Activate damienOS</div>' +
        '<button class="activate-sub" type="button">Go to Settings to activate damienOS</button>' +
        '<div class="activate-foot">&copy; ' + new Date().getFullYear() +
            ' Damien &middot; built with tea &amp; questionable decisions' +
            ' &middot; <a href="mailto:' + CONTACT_EMAIL + '">hire me</a></div>';
    document.body.appendChild(wm);
    wm.querySelector('.activate-sub').addEventListener('click', function () { openSysProps(); });

    // ── Desktop right-click context menu ────────────────────────
    var ctx = document.createElement('div');
    ctx.className = 'ctx-menu';
    ctx.hidden = true;
    ctx.innerHTML =
        '<button class="ctx-item" data-act="refresh">Refresh</button>' +
        '<button class="ctx-item" data-act="tidy">Tidy Windows</button>' +
        '<div class="ctx-sep"></div>' +
        '<button class="ctx-item" data-act="taskmgr">Task Manager</button>' +
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
        else if (act === 'taskmgr') openTaskManager();
        else if (act === 'props') openSysProps();
        hideCtx();
    });

    // (The IE window's toolbar + navigation is handled by browser.js.)

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
        if (document.querySelector('.rb-win')) { alreadyRunning('Recycle Bin'); return; }
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

    // ── Error gags: no admin rights / single instance ───────────
    function adminError(verb, name) {
        openDialog(verb + ' Process',
            '<div class="dlg-err"><span class="dlg-err-ico"></span>' +
            '<p class="dlg-p">Unable to ' + verb.toLowerCase() + ' <b>' + esc(name) + '</b>.<br><br>' +
            'Access is denied &mdash; you do not have administrator privileges on this machine. (You never did.)</p></div>');
    }
    function alreadyRunning(name) {
        openDialog(name,
            '<div class="dlg-err"><span class="dlg-err-ico"></span>' +
            '<p class="dlg-p"><b>' + esc(name) + '</b> is already running.<br><br>' +
            'Only one instance may be open at a time.</p></div>');
    }
    function openMinesweeper() {
        if (document.querySelector('.ms-win')) { alreadyRunning('Minesweeper'); return; }
        if (window.launchMinesweeper) window.launchMinesweeper();
    }
    function openCalc() {
        if (document.querySelector('.calc-win')) { alreadyRunning('Calculator'); return; }
        if (window.launchCalculator) window.launchCalculator();
    }

    // ── Gag Task Manager ────────────────────────────────────────
    // Open windows are mapped to plausible process names; closing/reopening an
    // app is reflected live. The outrageous ones are always there for flavor.
    var TM_APP = {
        dos:      ['command.com',  '04', '1,180 K'],
        winamp:   ['wmplayer.exe', '06', '14,200 K'],
        terminal: ['telnet.exe',   '02', '3,900 K'],
        cdplayer: ['cdplayer.exe', '03', '5,600 K'],
        notepad:  ['notepad.exe',  '00', '2,040 K'],
        ie:       ['firefox.exe', '23', '88,000 K']
    };
    // Applications-tab status flavor per app
    var TM_STATUS = {
        dos:      'Running (refuses to die)',
        winamp:   'Vibing',
        terminal: 'Listening…',
        cdplayer: 'Spinning',
        notepad:  'Running',
        ie:       'Eating RAM'
    };
    var TM_FW = {
        'ms-win': ['winmine.exe',  '01', '1,400 K'],
        'tm-win': ['taskmgr.exe',  '08', '4,200 K'],
        'rb-win': ['explorer.exe', '05', '12,000 K']
    };
    var TM_GAG = [
        ['tea.exe',                  '420', '1,024,000 K'],
        ['imposter_syndrome.dll',    '99',  '6,666,666 K'],
        ['chrome.exe',               '88',  '9,999,999 K'],
        ['chrome.exe',               '88',  '9,999,998 K'],
        ['chrome.exe',               '88',  '9,999,997 K'],
        ['stack_overflow_tabs (47)', '45',  '3,500,000 K'],
        ['existential_dread.exe',    '73',  '512,000 K'],
        ['one_more_episode.exe',     '56',  '2,048,000 K'],
        ['procrastination.exe',      '02',  '8,008,135 K'],
        ['meeting_was_an_email.exe', '33',  '404,000 K'],
        ['vibes.dll',                '100', '1 K'],
        ['snacks.exe',               '17',  '256,000 K'],
        ['motivation.exe',           '00',  'Not Responding'],
        ['System Idle Process',      '-7',  '0 K']
    ];
    function tmProcesses() {
        var rows = [];
        [].forEach.call(document.querySelectorAll('.block[data-app]'), function (b) {
            if (b.classList.contains('win-closed')) return;
            var m = TM_APP[b.getAttribute('data-app')];
            if (m) rows.push(m);
        });
        [].forEach.call(document.querySelectorAll('.fw'), function (f) {
            for (var k in TM_FW) { if (f.classList.contains(k)) { rows.push(TM_FW[k]); break; } }
        });
        return rows.concat(TM_GAG);
    }
    function tmRowsHtml(rows) {
        return rows.map(function (p) {
            return '<tr><td>' + esc(p[0]) + '</td><td class="tm-num">' + p[1] + '</td><td class="tm-num">' + p[2] + '</td></tr>';
        }).join('');
    }
    // Open desktop windows, for the Applications tab.
    function tmApps() {
        var rows = [];
        [].forEach.call(document.querySelectorAll('.block[data-app]'), function (b) {
            if (b.classList.contains('win-closed')) return;
            var app = b.getAttribute('data-app');
            if (TM_APP[app]) rows.push({ app: app, title: b.dataset.winName, status: TM_STATUS[app] || 'Running' });
        });
        return rows;
    }
    function tmAppRowsHtml(rows) {
        return rows.map(function (a) {
            return '<tr data-app="' + esc(a.app) + '"><td>' + esc(a.title) + '</td><td>' + esc(a.status) + '</td></tr>';
        }).join('');
    }
    // Wobble a numeric CPU reading; '00', '-7' and friends stay put.
    function tmJitter(base) {
        var n = parseInt(base, 10);
        if (isNaN(n) || n <= 0) return base;
        var v = Math.max(1, n + Math.floor(Math.random() * 9) - 4);
        return (v < 10 ? '0' : '') + v;
    }

    function openTaskManager() {
        if (document.querySelector('.tm-win')) { alreadyRunning('Task Manager'); return; }
        // [label, in-use, total, bar%, over-capacity?]
        var perf = [
            ['Physical Memory', '63,901 MB',  '64 MB',      100, true],
            ['Commit Charge',   '999,999 K',  '512 K',      100, true],
            ['Tea',             '6 cups',     '2 cups',     100, true],
            ['Vibes',           'immaculate', 'immaculate', 100, false],
            ['Productivity',    '3%',         '100%',         3, false],
            ['Free Time',       '0 ms',       '0 ms',         0, false]
        ];
        var perfRows = perf.map(function (g) {
            return '<div class="tm-perf-row"><span class="tm-perf-label">' + g[0] + '</span>' +
                   '<span class="tm-perf-bar' + (g[4] ? ' over' : '') + '"><i style="width:' + g[3] + '%"></i></span>' +
                   '<span class="tm-perf-use">' + g[1] + '</span>' +
                   '<span class="tm-perf-tot">/ ' + g[2] + '</span></div>';
        }).join('');
        var rows0 = tmProcesses();
        var apps0 = tmApps();
        var html =
            '<div class="tm">' +
                '<div class="tm-menubar"><span>File</span><span>Options</span><span>View</span><span>Help</span></div>' +
                '<div class="tm-tabs">' +
                    '<button class="tm-tab active" data-tab="apps">Applications</button>' +
                    '<button class="tm-tab" data-tab="proc">Processes</button>' +
                    '<button class="tm-tab" data-tab="perf">Performance</button>' +
                '</div>' +
                '<div class="tm-body">' +
                    '<div class="tm-pane" data-pane="apps"><table class="tm-proc tm-apps">' +
                        '<thead><tr><th>Task</th><th>Status</th></tr></thead>' +
                        '<tbody>' + tmAppRowsHtml(apps0) + '</tbody></table></div>' +
                    '<div class="tm-pane" data-pane="proc" hidden><table class="tm-proc">' +
                        '<thead><tr><th>Image Name</th><th class="tm-num">CPU</th><th class="tm-num">Mem Usage</th></tr></thead>' +
                        '<tbody>' + tmRowsHtml(rows0) + '</tbody></table></div>' +
                    '<div class="tm-pane" data-pane="perf" hidden>' +
                        '<div class="tm-graph-label">CPU Usage History</div>' +
                        '<canvas class="tm-graph" width="330" height="96" aria-label="CPU usage history graph (decorative)"></canvas>' +
                        '<div class="tm-perf-head"><span>Resource</span><span>In&nbsp;Use&nbsp; / &nbsp;Total</span></div>' +
                        perfRows + '</div>' +
                '</div>' +
                '<div class="tm-foot"><button class="tm-end">End Task</button></div>' +
                '<div class="tm-status"><span class="tm-count"></span><span class="tm-cpu"></span><span class="tm-mem">Mem: 63,901 MB / 64 MB</span></div>' +
            '</div>';
        var w = createWindow('Task Manager', html, 'tm-win');
        var tabs     = w.body.querySelectorAll('.tm-tab');
        var procBody = w.body.querySelector('.tm-pane[data-pane="proc"] tbody');
        var appsBody = w.body.querySelector('.tm-pane[data-pane="apps"] tbody');
        var countEl  = w.body.querySelector('.tm-count');
        var cpuEl    = w.body.querySelector('.tm-cpu');
        var footEl   = w.body.querySelector('.tm-foot');
        var endBtn   = w.body.querySelector('.tm-end');
        var graph    = w.body.querySelector('.tm-graph');
        var activeTab = 'apps';
        var selProc = null, selApp = null;
        var sigProc = rows0.map(function (r) { return r[0]; }).join('|');
        var sigApps = apps0.map(function (a) { return a.app; }).join('|');

        [].forEach.call(tabs, function (t) {
            t.addEventListener('click', function () {
                [].forEach.call(tabs, function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                activeTab = t.getAttribute('data-tab');
                [].forEach.call(w.body.querySelectorAll('.tm-pane'), function (p) {
                    p.hidden = (p.getAttribute('data-pane') !== activeTab);
                });
                // Performance has nothing to end — the button stays on task tabs.
                footEl.hidden = (activeTab === 'perf');
                endBtn.textContent = (activeTab === 'proc') ? 'End Process' : 'End Task';
            });
        });

        function bindTable(tbody, setSel) {
            [].forEach.call(tbody.querySelectorAll('tr'), function (tr) {
                tr.addEventListener('click', function () {
                    var prev = tbody.querySelector('tr.sel');
                    if (prev) prev.classList.remove('sel');
                    tr.classList.add('sel');
                    setSel(tr);
                });
            });
        }
        function bindProc() { bindTable(procBody, function (tr) { selProc = tr; }); }
        function bindApps() { bindTable(appsBody, function (tr) { selApp = tr; }); }

        // ── CPU history graph — random walk around a healthy 420% ──
        var MAX_PCT = 500, cpuNow = 420;
        var series = [];
        for (var si = 0; si < 46; si++) {
            cpuNow = Math.max(370, Math.min(470, cpuNow + Math.floor(Math.random() * 25) - 12));
            series.push(cpuNow);
        }
        function drawGraph() {
            if (!graph || !graph.getContext) return;
            var ctx = graph.getContext('2d');
            var W = graph.width, H = graph.height;
            ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = '#003c00'; ctx.lineWidth = 1;
            for (var gx = W - 0.5; gx > 0; gx -= 15) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
            for (var gy = H - 0.5; gy > 0; gy -= 15) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
            var y100 = Math.round(H - (100 / MAX_PCT) * H) + 0.5;   // the line sanity left behind
            ctx.strokeStyle = '#7a0000';
            ctx.beginPath(); ctx.moveTo(0, y100); ctx.lineTo(W, y100); ctx.stroke();
            ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            var step = W / (series.length - 1);
            series.forEach(function (v, i) {
                var px = i * step, py = H - (v / MAX_PCT) * H;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
        }
        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        drawGraph();

        // Reflect apps being closed/reopened, without churning the DOM when nothing changed.
        function refresh() {
            var rows = tmProcesses();
            var newSig = rows.map(function (r) { return r[0]; }).join('|');
            if (newSig !== sigProc) { sigProc = newSig; procBody.innerHTML = tmRowsHtml(rows); bindProc(); selProc = null; }
            else {
                // Same processes — just let the CPU numbers twitch in place.
                [].forEach.call(procBody.querySelectorAll('tr'), function (tr, i) {
                    if (rows[i]) tr.children[1].textContent = tmJitter(rows[i][1]);
                });
            }
            var apps = tmApps();
            var newAppSig = apps.map(function (a) { return a.app; }).join('|');
            if (newAppSig !== sigApps) { sigApps = newAppSig; appsBody.innerHTML = tmAppRowsHtml(apps); bindApps(); selApp = null; }
            if (!reduceMotion) {
                cpuNow = Math.max(370, Math.min(470, cpuNow + Math.floor(Math.random() * 25) - 12));
                series.push(cpuNow); series.shift();
                if (activeTab === 'perf') drawGraph();
            }
            countEl.textContent = 'Processes: ' + rows.length;
            cpuEl.textContent = 'CPU Usage: ' + cpuNow + '%';
        }
        bindProc(); bindApps();
        refresh();          // include the Task Manager itself + anything opened since snapshot
        var poll = setInterval(function () {
            if (!document.body.contains(w.el)) { clearInterval(poll); return; }
            refresh();
        }, 1200);

        endBtn.addEventListener('click', function () {
            if (activeTab === 'apps') {
                // End Task genuinely closes the window (hello.bat respawns — it's a startup script).
                var tr = selApp || appsBody.querySelector('tr');
                if (!tr) return;
                var b = document.querySelector('.block[data-app="' + tr.getAttribute('data-app') + '"]');
                if (b) closeWin(b);
                refresh();
            } else {
                var first = procBody.querySelector('td');
                var name = selProc ? selProc.firstElementChild.textContent : (first ? first.textContent : 'tea.exe');
                adminError('End', name);
            }
        });
    }

    // ── System Properties — the "about this PC" screen, except the
    //    PC is this website. What it is, who made it, and why.
    function openSysProps() {
        if (document.querySelector('.dp-win')) { alreadyRunning('System Properties'); return; }
        var mins = Math.floor((Date.now() - (window.performance && performance.timing ? performance.timing.navigationStart : Date.now())) / 60000);
        // Days since Windows 98 shipped (June 25, 1998) — the trial runs long.
        var trialDay = Math.floor((Date.now() - Date.UTC(1998, 5, 25)) / 86400000).toLocaleString();
        var html =
            '<div class="dp">' +
                '<div class="dp-tabs"><button class="dp-tab active">General</button></div>' +
                '<div class="dp-body">' +
                    '<div class="dp-about">' +
                        '<div class="dlg-sys-logo"></div>' +
                        '<div class="dp-about-main">' +
                            '<div class="dp-group"><span class="dp-group-title">System</span>' +
                                '<p><b>damienOS 98</b> <span class="dp-dim">Second Edition (allegedly)</span></p>' +
                                '<p>A developer portfolio dressed as a Windows&nbsp;98 desktop.</p>' +
                                '<p>Hand-built in vanilla HTML/CSS/JS &mdash; no frameworks, no build step, no mercy.</p>' +
                            '</div>' +
                            '<div class="dp-group"><span class="dp-group-title">Registered to</span>' +
                                '<p><b>Damien</b> &mdash; Coder &amp; Warlock &#9876;&#65039;</p>' +
                                '<p>Powered by tea, delusion, and a healthy respect for the test suite.</p>' +
                                '<p><a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a></p>' +
                            '</div>' +
                            '<div class="dp-group"><span class="dp-group-title">The point</span>' +
                                '<p>The real work lives in <b>Foxfire</b> &mdash; open it from the taskbar and browse the projects.</p>' +
                                '<p>The rest of the desktop exists to make you smile. Everything you can click does something; some of it is even useful.</p>' +
                            '</div>' +
                            '<div class="dp-group"><span class="dp-group-title">Computer</span>' +
                                '<p>Display: ' + window.innerWidth + ' &times; ' + window.innerHeight + ' <span class="dp-dim">(pixels, mostly aligned)</span></p>' +
                                '<p>Memory: 64 MB of pure optimism <span class="dp-dim">&middot; Tea: <b>critical</b></span></p>' +
                                '<p>Uptime: ' + mins + ' min <span class="dp-dim">(this visit &mdash; thank you for ' + (mins < 1 ? 'the seconds' : 'them') + ')</span></p>' +
                            '</div>' +
                            '<div class="dp-group"><span class="dp-group-title">Activation</span>' +
                                '<p>Status: <b>not activated</b> <span class="dp-dim">(day ' + trialDay + ' of the 30-day trial)</span></p>' +
                                '<p><button class="dp-btn dp-activate">Activate Now&hellip;</button></p>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="dp-foot"><button class="dp-btn dp-ok">OK</button></div>' +
            '</div>';
        var w = createWindow('System Properties', html, 'dp-win');
        w.body.querySelector('.dp-ok').addEventListener('click', w.close);
        w.body.querySelector('.dp-activate').addEventListener('click', function () { activateGag(w); });
    }

    // ── Restart → refuses, on the grounds of preventing societal collapse ──
    function restartGag() {
        openDialog('Restart Error', '<div class="dlg-error">' +
            '<div class="dlg-error-ico"></div>' +
            '<div class="dlg-error-text">' +
                '<p>Restarting the internet is a bad idea.</p>' +
                '<p>Total societal collapse is not a favorable outcome &mdash; supply chains buckle, ' +
                'the group chats go dark, and somewhere a server farm weeps.</p>' +
                '<p><b>Request denied.</b> You&rsquo;re welcome.</p>' +
            '</div></div>');
    }

    // ── "Activate Now" → BSOD → gathers data → restarts → punchline ──
    // Deliberately unhurried: the crash needs a beat to land.
    function activateGag(fromWin) {
        if (document.querySelector('.bsod') || document.querySelector('.act-restart')) return;
        if (fromWin) fromWin.close();
        var b = document.createElement('div');
        b.className = 'bsod';
        b.innerHTML =
            '<div class="bsod-inner">' +
                '<p class="bsod-h">&nbsp;DAMIEN&nbsp;</p>' +
                '<p>A problem has been detected and damienOS has been shut down to prevent activation.</p>' +
                '<p>The problem seems to be caused by: <b>ACTIVATION_NOT_FOUND</b></p>' +
                '<p>damienOS cannot be activated. It was never licensed, never purchased, and if we are being honest, never entirely finished.</p>' +
                '<p>&nbsp;</p>' +
                '<p>Gathering activation data&hellip; <b class="bsod-pct">0%</b> complete</p>' +
                '<p>Your desktop will restart automatically. Do not turn off your portfolio.</p>' +
                '<p class="bsod-blink">_</p>' +
            '</div>';
        document.body.appendChild(b);
        var pctEl = b.querySelector('.bsod-pct');
        // [percent, ms until the next tick] — stalls at 24% like the real thing.
        var steps = [[7, 600], [23, 700], [24, 1500], [51, 800], [78, 700], [94, 650], [99, 900], [100, 1000]];
        var i = 0;
        function tick() {
            if (i < steps.length) {
                pctEl.textContent = steps[i][0] + '%';
                setTimeout(tick, steps[i][1]);
                i++;
            } else {
                b.remove();
                var r = document.createElement('div');
                r.className = 'act-restart';
                r.innerHTML = '<div class="act-restart-text">Restarting damienOS&hellip;<span class="bsod-blink">_</span></div>';
                document.body.appendChild(r);
                setTimeout(function () {
                    r.remove();
                    openDialog('Activation', '<p class="dlg-p">Activation failed successfully.<br><br>' +
                        'damienOS remains free, unlicensed, and slightly haunted.<br><br>' +
                        'Damien, however, is fully licensed and available for hire:<br>' +
                        '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a></p>');
                }, 1700);
            }
        }
        setTimeout(tick, 800);   // let "0%" sit for a beat first
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
                '<p>* Or just hire him: ' + CONTACT_EMAIL + '</p>' +
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
