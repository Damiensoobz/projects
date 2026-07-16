// ─────────────────────────────────────────────────────────────
//  boot.js — power-on theater: a quick BIOS POST, a damienOS 98
//  splash (flag logo + the classic scrolling light-bar), then a
//  lock screen whose password types itself.
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

    // ── Stage 2: damienOS splash — like the real Win98 boot: a brief
    //    text-mode "Starting…" line, then the flag logo over black with
    //    the classic scrolling light-bar along the bottom edge. ─────────
    function showLoad() {
        stage = 'load';
        clearTimers();
        root.innerHTML =
            '<div class="boot-stage boot-load">' +
                '<div class="osload-dos">Starting damienOS 98&hellip;</div>' +
            '</div>';
        later(function () {
            if (stage !== 'load') return;
            var host = root.querySelector('.boot-load');
            if (!host) return;
            host.innerHTML =
                '<div class="osload-center">' +
                    '<div class="osload-flag"></div>' +
                    '<div class="osload-title">damienOS<span>98</span></div>' +
                    '<div class="osload-sub">Second Edition (allegedly)</div>' +
                '</div>' +
                '<div class="osload-copy">&copy; 1998&ndash;' + new Date().getFullYear() + ' Damien Megatrends, Inc.</div>' +
                '<div class="boot98-strip"><i></i></div>';
            later(function () { showLock(false); }, 3400);
        }, 1100);
    }

    // ── Stage 3: lock screen — the password types itself ────────
    var PASSWORD = 'hunter2';
    function showLock(instant) {
        stage = 'lock';
        clearTimers();
        root.innerHTML =
            '<div class="boot-stage boot-lock">' +
                '<div class="lock-card">' +
                    '<div class="lock-avatar"><img class="lock-avatar-img" src="' + AVATAR_SRC + '" alt=""></div>' +
                    '<div class="lock-user">Hello there.</div>' +
                    '<label class="lock-label" for="lock-pass">Enter Password</label>' +
                    '<div class="lock-row">' +
                        '<input class="lock-input" id="lock-pass" type="password" readonly value="" aria-label="Password (damienOS fills this in for you)">' +
                        '<button class="lock-btn" type="button">Confirm</button>' +
                    '</div>' +
                    '<div class="lock-hint">&nbsp;</div>' +
                '</div>' +
            '</div>';
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
