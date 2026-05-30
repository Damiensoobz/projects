(function () {
    var sheet = document.getElementById('main-style');
    var btn   = document.getElementById('theme-toggle');
    var label = document.getElementById('toggle-label');

    var THEMES = [
        { key: 'y2k',     css: 'style-y2k.css', btn: 'Switch Skin'  },
        { key: 'gameboy', css: 'style-gb.css',   btn: '> SWITCH SKIN' },
    ];

    var saved = localStorage.getItem('skin');
    var idx   = THEMES.findIndex(function (t) { return t.key === saved; });
    if (idx === -1) idx = 0;

    apply(idx);

    btn.addEventListener('click', function () {
        idx = (idx + 1) % THEMES.length;
        localStorage.setItem('skin', THEMES[idx].key);
        apply(idx);
    });

    function apply(i) {
        var t = THEMES[i];
        sheet.href        = t.css;
        label.textContent = t.btn;
        document.documentElement.dataset.skin = t.key;
        setTimeout(function() {
            if (window.triggerScramble) window.triggerScramble();
        }, 80);
    }
})();
