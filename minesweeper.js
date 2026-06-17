// ─────────────────────────────────────────────────────────────
//  minesweeper.js  —  a real, playable Minesweeper easter egg.
//  Opens in a draggable floating window via window.win98.createWindow.
//  Exposes window.launchMinesweeper(). Loads after win98.js.
// ─────────────────────────────────────────────────────────────
(function () {
    var ROWS = 9, COLS = 9, MINES = 10;

    function launch() {
        if (!window.win98 || !window.win98.createWindow) return;
        var html =
            '<div class="ms">' +
                '<div class="ms-head">' +
                    '<span class="ms-led ms-mines">010</span>' +
                    '<button class="ms-face" title="New game">☺</button>' +
                    '<span class="ms-led ms-time">000</span>' +
                '</div>' +
                '<div class="ms-grid"></div>' +
            '</div>';
        var w = window.win98.createWindow('Minesweeper', html, 'ms-win');
        new Game(w.body.querySelector('.ms'));
    }

    function Game(root) {
        var gridEl  = root.querySelector('.ms-grid');
        var face    = root.querySelector('.ms-face');
        var minesEl = root.querySelector('.ms-mines');
        var timeEl  = root.querySelector('.ms-time');
        var cells, revealed, flags, over, started, timer, secs;

        function pad(n) { n = Math.max(0, Math.min(999, n)); return ('00' + n).slice(-3); }

        function neighbors(r, c, fn) {
            for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) fn(cells[nr][nc]);
            }
        }
        function startTimer() {
            started = true;
            timer = setInterval(function () { secs++; timeEl.textContent = pad(secs); if (secs >= 999) clearInterval(timer); }, 1000);
        }
        function reveal(cell) {
            if (cell.rev || cell.flag) return;
            cell.rev = true; revealed++;
            cell.el.classList.add('ms-rev'); cell.el.disabled = true;
            if (cell.mine) { cell.el.classList.add('ms-boom'); cell.el.textContent = '✷'; return lose(); }
            if (cell.n) { cell.el.textContent = cell.n; cell.el.classList.add('ms-n' + cell.n); }
            else neighbors(cell.r, cell.c, reveal);
        }
        function lose() {
            over = true; clearInterval(timer); face.textContent = '☠';
            for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
                var cl = cells[r][c];
                if (cl.mine && !cl.rev) { cl.el.classList.add('ms-rev'); cl.el.textContent = '✷'; }
            }
        }
        function win() { over = true; clearInterval(timer); face.textContent = '✳'; minesEl.textContent = '000'; }
        function check() { if (!over && revealed === ROWS * COLS - MINES) win(); }

        function bind(cell) {
            cell.el.addEventListener('click', function () {
                if (over || cell.flag) return;
                if (!started) startTimer();
                reveal(cell); check();
            });
            cell.el.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                if (over || cell.rev) return;
                cell.flag = !cell.flag;
                cell.el.classList.toggle('ms-flag', cell.flag);
                cell.el.textContent = cell.flag ? '⚑' : '';
                flags += cell.flag ? 1 : -1;
                minesEl.textContent = pad(MINES - flags);
            });
        }
        function reset() {
            clearInterval(timer); secs = 0; timeEl.textContent = '000';
            over = false; started = false; revealed = 0; flags = 0;
            face.textContent = '☺'; minesEl.textContent = pad(MINES);
            gridEl.innerHTML = ''; gridEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 20px)';
            var mineSet = {}, placed = 0;
            while (placed < MINES) { var k = Math.floor(Math.random() * ROWS * COLS); if (!mineSet[k]) { mineSet[k] = 1; placed++; } }
            cells = [];
            for (var r = 0; r < ROWS; r++) {
                cells[r] = [];
                for (var c = 0; c < COLS; c++) {
                    var el = document.createElement('button');
                    el.className = 'ms-cell';
                    var cell = { el: el, r: r, c: c, mine: !!mineSet[r * COLS + c], rev: false, flag: false, n: 0 };
                    bind(cell); gridEl.appendChild(el); cells[r][c] = cell;
                }
            }
            for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) {
                if (cells[r2][c2].mine) continue;
                var n = 0; neighbors(r2, c2, function (nc) { if (nc.mine) n++; });
                cells[r2][c2].n = n;
            }
        }
        face.addEventListener('click', reset);
        reset();
    }

    window.launchMinesweeper = launch;
})();
