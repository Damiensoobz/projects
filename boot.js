// ─────────────────────────────────────────────────────────────
//  boot.js — power-on theater: a quick BIOS POST, a damienOS
//  load screen (lines populate, the progress bar hangs like it
//  means it), then a lock screen whose password types itself.
//
//  Runs before the desktop scripts. All windows start minimized; the
//  user opens what they want from the desktop/taskbar/Start menu.
//  Enter / Esc / click skips straight to the lock screen.
// ─────────────────────────────────────────────────────────────
(function () {
    var root = document.getElementById('boot');
    if (!root) return;
    window.bootActive = true;
    document.documentElement.classList.add('booting');

    // Custom art — drop these files in /images. Each has a built-in fallback
    // (the inline-SVG shapes / the wizard emoji) if the file is missing.
    var BIOS_BADGE_SRC = 'images/bios-logo.jpg';  // top-right corner logo
    var BIOS_ICON_SRC  = 'images/bios-icon.jpg';  // small icon next to the brand text
    var AVATAR_SRC     = 'images/pfp.jpg';        // lock-screen profile picture

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stage = 'bios';
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function pad(s, n) { while (s.length < n) s += ' '; return s; }

    // ── Stage 1: BIOS POST (quick) ──────────────────────────────
    var BIOS_FIELDS = [
        ['File',       'Portfolio Website'],
        ['Built with', 'vanilla HTML / CSS / JS (no frameworks, no mercy)'],
        ['Specialist', 'Developer & Code Wizard'],
        ['Experience', '4+ years'],
        ['Stack',      'JavaScript, Python, HTML/CSS, APIs'],
        ['Languages',  'English, JavaScript, Sarcasm']
    ];
    var BIOS_CHECKS = [
        ['Detecting IDE drives .... damienbuilds.dev [OK]'],
        ['Keyboard ................ detected'],
        ['Mouse ................... detected'],
        ['Tea reserves ............ CRITICAL', 'b-red'],
        ['Excuses ................. none found', 'b-dim']
    ];

    function showBios() {
        stage = 'bios';
        root.innerHTML =
            '<div class="boot-stage boot-bios">' +
                '<div class="bios-head">' +
                    '<div class="bios-brand"><div class="bios-logo"></div>' +
                        '<div>DamienBIOS (C) 1998&ndash;' + new Date().getFullYear() + ' Damien Megatrends, Inc.<br>' +
                        '<span class="b-dim">Portfolio Modular BIOS v4.04 &mdash; An Energy Tea Ally</span></div></div>' +
                    '<div class="bios-badge">&#9733;&nbsp;D98</div>' +
                '</div>' +
                '<div class="bios-lines"></div>' +
                '<div class="bios-foot">Press <b>F</b> to pay respects &nbsp;&middot;&nbsp; Press <b>ENTER</b> to skip boot<br>' +
                    '<span class="b-dim">BIOS Date 06/25/98 &nbsp;&middot;&nbsp; Setup: there is no setup</span></div>' +
            '</div>';
        // Swap the custom logo into the top-right corner once it's confirmed
        // to load, uncropped at its natural aspect ratio; if the file is
        // missing, the "★ D98" badge stays.
        (function () {
            var img = new Image();
            img.onload = function () {
                var el = root.querySelector('.bios-badge');
                if (!el) return;
                el.textContent = '';
                el.classList.add('bios-badge-img');
                var pic = document.createElement('img');
                pic.src = BIOS_BADGE_SRC;
                pic.alt = '';
                el.appendChild(pic);
            };
            img.src = BIOS_BADGE_SRC;
        })();
        // Same trick for the small icon next to the brand text; falls back
        // to the inline-SVG geometric mark if the file is missing.
        (function () {
            var img = new Image();
            img.onload = function () {
                var el = root.querySelector('.bios-logo');
                if (!el) return;
                el.classList.add('bios-logo-img');
                el.style.backgroundImage = "url('" + BIOS_ICON_SRC + "')";
            };
            img.src = BIOS_ICON_SRC;
        })();
        var box = root.querySelector('.bios-lines');
        function line(html, cls) {
            var d = document.createElement('div');
            d.className = 'b-line' + (cls ? ' ' + cls : '');
            d.innerHTML = html;
            box.appendChild(d);
            return d;
        }
        line('Main Processor : Warlock(tm) Core, fueled at 4 cups/hr');
        var mem = line('Memory Test    : 0 KB');
        var kb = 0;                                    // classic RAM count-up
        (function count() {
            kb = Math.min(65536, kb + 4096);
            mem.textContent = 'Memory Test    : ' + kb + ' KB' + (kb === 65536 ? ' OK' : '');
            if (kb < 65536 && stage === 'bios') later(count, 35);
        })();

        var q = [['&nbsp;']];
        BIOS_FIELDS.forEach(function (f) { q.push([pad(f[0], 15) + ': ' + f[1]]); });
        q.push(['&nbsp;']);
        BIOS_CHECKS.forEach(function (c) { q.push(c); });
        var i = 0;
        function next() {
            if (stage !== 'bios') return;
            if (i < q.length) { line(q[i][0], q[i][1]); i++; later(next, 110); }
            else later(showLoad, 950);
        }
        later(next, 400);
    }

    // ── Stage 2: damienOS loading (lines + hanging progress bar) ─
    var ASCII =
' ██████╗  █████╗ ███╗   ███╗██╗███████╗███╗   ██╗\n' +
' ██╔══██╗██╔══██╗████╗ ████║██║██╔════╝████╗  ██║\n' +
' ██║  ██║███████║██╔████╔██║██║█████╗  ██╔██╗ ██║\n' +
' ██║  ██║██╔══██║██║╚██╔╝██║██║██╔══╝  ██║╚██╗██║\n' +
' ██████╔╝██║  ██║██║ ╚═╝ ██║██║███████╗██║ ╚████║\n' +
' ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═══╝';

    function showLoad() {
        stage = 'load';
        clearTimers();
        root.innerHTML =
            '<div class="boot-stage boot-load">' +
                '<pre class="osload-logo">' + ASCII + '</pre>' +
                '<div class="osload-tag">.portfolio</div>' +
                '<div class="osload-lines"></div>' +
                '<div class="boot-bar-wrap"><div class="boot-bar"><i></i></div>' +
                '<div class="boot-bar-label">Loading system&hellip; 0%</div></div>' +
            '</div>';
        var box = root.querySelector('.osload-lines');
        // [html, ms until the next line, css class]
        var LINES = [
            ['Starting damienOS 98&hellip;', 350],
            ['HIMEM is testing extended memory&hellip; OK', 420],
            ['Loading C:\\DAMIEN\\SYSTEM\\TEA.DLL', 240],
            ['Loading C:\\DAMIEN\\SYSTEM\\WIZARD.DLL', 220],
            ['WARNING: SLEEP.SYS not found &mdash; continuing without it', 520, 'b-yellow'],
            ['ERROR: Failed to load MOTIVATION.DLL&hellip; Retrying', 700, 'b-red'],
            ['Retrying&hellip; OK (close enough)', 420],
            ['Loading C:\\DAMIEN\\SYSTEM\\IMPOSTER_SYNDROME.DLL', 260],
            ['ERROR: IMPOSTER_SYNDROME.DLL cannot be unloaded', 600, 'b-red'],
            ['Initializing devices&hellip;', 430],
            ['Detecting hardware&hellip; 1 keyboard, 1 mouse, 0 excuses', 460],
            ['Initializing registry&hellip;', 380],
            ['Applying questionable decisions&hellip;', 520],
            ['C:\\&gt; <span class="bsod-blink">_</span>', 0, 'b-prompt']
        ];
        var i = 0;
        (function next() {
            if (stage !== 'load' || i >= LINES.length) return;
            var L = LINES[i];
            var d = document.createElement('div');
            d.className = 'b-line' + (L[2] ? ' ' + L[2] : '');
            d.innerHTML = L[0];
            box.appendChild(d);
            i++;
            if (i < LINES.length) later(next, L[1]);
        })();

        // The bar advances with deliberate stalls (24% and 59% are load-bearing).
        var fill  = root.querySelector('.boot-bar i');
        var label = root.querySelector('.boot-bar-label');
        var STEPS = [[9, 400], [22, 520], [24, 1150], [41, 430], [58, 700], [59, 950], [76, 480], [90, 760], [97, 650], [100, 420]];
        var s = 0;
        (function bar() {
            if (stage !== 'load') return;
            if (s < STEPS.length) {
                fill.style.width = STEPS[s][0] + '%';
                label.innerHTML = 'Loading system&hellip; ' + STEPS[s][0] + '%';
                later(bar, STEPS[s][1]);
                s++;
            } else later(function () { showLock(false); }, 550);
        })();
    }

    // ── Stage 3: lock screen — the password types itself ────────
    var PASSWORD = 'hunter2';
    function showLock(instant) {
        stage = 'lock';
        clearTimers();
        root.innerHTML =
            '<div class="boot-stage boot-lock">' +
                '<div class="lock-brand">damien<b>OS</b> 98 SE</div>' +
                '<div class="lock-card">' +
                    '<div class="lock-clock" id="lock-clock"></div>' +
                    '<div class="lock-date" id="lock-date"></div>' +
                    '<div class="lock-avatar"><img class="lock-avatar-img" src="' + AVATAR_SRC + '" alt=""></div>' +
                    '<div class="lock-user">Damien</div>' +
                    '<div class="lock-sub">code wizard &middot; logged in since 1998</div>' +
                    '<label class="lock-label" for="lock-pass">Enter Password</label>' +
                    '<div class="lock-row">' +
                        '<input class="lock-input" id="lock-pass" type="password" readonly value="" aria-label="Password (damienOS fills this in for you)">' +
                        '<button class="lock-btn" type="button">Log In</button>' +
                    '</div>' +
                    '<div class="lock-hint">press ENTER to log in</div>' +
                '</div>' +
            '</div>';
        // Live clock + date, lock-screen style.
        var clockEl = root.querySelector('#lock-clock');
        var dateEl  = root.querySelector('#lock-date');
        (function tick() {
            if (!clockEl || !document.contains(clockEl)) return;
            var d = new Date(), h = d.getHours(), m = d.getMinutes();
            var hh = h % 12; if (hh === 0) hh = 12;
            clockEl.textContent = hh + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
            dateEl.textContent  = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
            later(tick, 15000);
        })();
        // If the custom profile picture is missing, fall back to the wizard emoji.
        var avatar = root.querySelector('.lock-avatar-img');
        if (avatar) avatar.addEventListener('error', function () {
            avatar.parentNode.innerHTML = '&#129497;&#8205;&#9794;&#65039;';
        });
        var input = root.querySelector('.lock-input');
        var btn   = root.querySelector('.lock-btn');
        btn.addEventListener('click', unlock);
        function filled() {
            btn.focus();
        }
        if (instant || reduceMotion) { input.value = PASSWORD; filled(); }
        else {
            var c = 0;
            later(function type() {
                input.value = PASSWORD.slice(0, ++c);
                if (c < PASSWORD.length) later(type, 95);
                else filled();
            }, 550);
        }
    }

    function unlock() {
        if (stage !== 'lock') return;
        stage = 'done';
        clearTimers();
        var card = root.querySelector('.lock-card');
        var avatarEl = card.querySelector('.lock-avatar');
        card.innerHTML = (avatarEl ? avatarEl.outerHTML : '') +
            '<div class="lock-welcome">Welcome<span>Getting things ready for you&hellip;</span></div>';
        setTimeout(function () {
            root.classList.add('boot-fade');
            setTimeout(function () {
                root.remove();
                document.documentElement.classList.remove('booting');
                document.removeEventListener('keydown', onKey);
                window.bootActive = false;
            }, 500);
        }, reduceMotion ? 150 : 900);
    }

    // ── Skip / respects / keys ──────────────────────────────────
    function skip() {
        if (stage === 'bios' || stage === 'load') showLock(true);
    }
    var respects = 0, respectLine = null;
    function payRespects() {
        var box = root.querySelector('.bios-lines') || root.querySelector('.osload-lines');
        if (!box) return;
        respects++;
        if (!respectLine || !box.contains(respectLine)) {
            respectLine = document.createElement('div');
            respectLine.className = 'b-line b-green';
            box.appendChild(respectLine);
        }
        respectLine.textContent = 'Respects paid.' + (respects > 1 ? ' (×' + respects + ')' : '');
    }
    function onKey(e) {
        if (stage === 'lock') { if (e.key === 'Enter') { e.preventDefault(); unlock(); } return; }
        if (stage === 'done') return;
        if (e.key === 'f' || e.key === 'F') { payRespects(); return; }
        if (e.key === 'Enter' || e.key === 'Escape') skip();
    }
    document.addEventListener('keydown', onKey);
    root.addEventListener('click', skip);

    if (reduceMotion) showLock(true); else showBios();
})();
