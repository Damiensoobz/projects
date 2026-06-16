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
        b.dataset.winId   = 'win' + i;
        b.dataset.winName = b.querySelector('.p-cmd').textContent.trim();
    });

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
        b.scrollIntoView({ block: 'nearest' });
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
})();
