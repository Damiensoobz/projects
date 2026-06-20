// ─────────────────────────────────────────────────────────────
//  calculator.js — a working Windows-98-style Calculator.
//  Opens in a draggable floating window via window.win98.createWindow.
//  Exposes window.launchCalculator(). Loads after win98.js.
// ─────────────────────────────────────────────────────────────
(function () {
    // [data-key, label, modifier class]
    var GRID = [
        ['mc', 'MC', 'mem'], ['7', '7', ''], ['8', '8', ''], ['9', '9', ''], ['/', '/', 'op'], ['sqrt', '√', 'fn'],
        ['mr', 'MR', 'mem'], ['4', '4', ''], ['5', '5', ''], ['6', '6', ''], ['*', '×', 'op'], ['%', '%', 'fn'],
        ['ms', 'MS', 'mem'], ['1', '1', ''], ['2', '2', ''], ['3', '3', ''], ['-', '−', 'op'], ['recip', '1/x', 'fn'],
        ['mp', 'M+', 'mem'], ['0', '0', ''], ['neg', '±', ''], ['.', '.', ''], ['+', '+', 'op'], ['eq', '=', 'eq']
    ];

    function launch() {
        if (!window.win98 || !window.win98.createWindow) return;
        var html =
            '<div class="calc">' +
                '<div class="calc-disp">0</div>' +
                '<div class="calc-top">' +
                    '<button class="calc-btn fn" data-k="back">Backspace</button>' +
                    '<button class="calc-btn fn" data-k="ce">CE</button>' +
                    '<button class="calc-btn fn" data-k="c">C</button>' +
                '</div>' +
                '<div class="calc-grid">' +
                    GRID.map(function (b) {
                        return '<button class="calc-btn' + (b[2] ? ' ' + b[2] : '') + '" data-k="' + b[0] + '">' + b[1] + '</button>';
                    }).join('') +
                '</div>' +
            '</div>';
        var w = window.win98.createWindow('Calculator', html, 'calc-win');
        new Calc(w.body.querySelector('.calc'));
    }

    function Calc(root) {
        var disp = root.querySelector('.calc-disp');
        var acc = null, op = null, cur = '0', fresh = true, errored = false, mem = 0;

        function show() { disp.textContent = cur; }
        function fmt(x) {
            if (x === 'ERR' || !isFinite(x)) return 'Cannot divide by zero';
            return String(+x.toPrecision(12));
        }
        function compute(a, b, o) {
            switch (o) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return b === 0 ? 'ERR' : a / b; }
            return b;
        }
        function clearAll() { acc = null; op = null; cur = '0'; fresh = true; errored = false; show(); }

        function digit(n) {
            if (errored) clearAll();
            if (fresh) { cur = (n === '.') ? '0.' : n; fresh = false; }
            else if (n === '.') { if (cur.indexOf('.') < 0) cur += '.'; }
            else { cur = (cur === '0') ? n : cur + n; }
            show();
        }
        function setOp(o) {
            if (errored) return;
            var b = parseFloat(cur);
            if (op !== null && !fresh) { acc = compute(acc, b, op); if (acc === 'ERR') return error(); cur = fmt(acc); show(); }
            else { acc = b; }
            op = o; fresh = true;
        }
        function equals() {
            if (errored || op === null) return;
            var r = compute(acc, parseFloat(cur), op);
            if (r === 'ERR') return error();
            cur = fmt(r); show(); acc = null; op = null; fresh = true;
        }
        function error() { cur = 'Cannot divide by zero'; show(); errored = true; acc = null; op = null; fresh = true; }
        function unary(fn) {
            if (errored) return;
            var v = fn(parseFloat(cur));
            if (!isFinite(v)) return error();
            cur = fmt(v); show(); fresh = true;
        }

        root.addEventListener('click', function (e) {
            var btn = e.target.closest('.calc-btn'); if (!btn) return;
            var k = btn.getAttribute('data-k');
            if (/^[0-9.]$/.test(k)) return digit(k);
            switch (k) {
                case '+': case '-': case '*': case '/': return setOp(k);
                case 'eq':   return equals();
                case 'c':    return clearAll();
                case 'ce':   cur = '0'; fresh = true; show(); return;
                case 'back': if (!fresh && !errored) { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; if (cur === '-' || cur === '') cur = '0'; show(); } return;
                case 'neg':  if (!errored && cur !== '0') { cur = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur; show(); } return;
                case 'sqrt': return unary(function (x) { return Math.sqrt(x); });
                case 'recip':return unary(function (x) { return x === 0 ? Infinity : 1 / x; });
                case '%':    if (!errored && acc !== null) { cur = fmt(acc * parseFloat(cur) / 100); show(); fresh = true; } return;
                case 'mc':   mem = 0; return;
                case 'mr':   if (!errored) { cur = fmt(mem); show(); fresh = true; } return;
                case 'ms':   if (!errored) mem = parseFloat(cur); return;
                case 'mp':   if (!errored) mem += parseFloat(cur); return;
            }
        });
        show();
    }

    window.launchCalculator = launch;
})();
