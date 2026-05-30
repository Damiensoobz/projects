(function () {
    var sheet = document.getElementById('main-style');
    var btn   = document.getElementById('theme-toggle');
    var label = document.getElementById('toggle-label');

    var THEMES = [
        { key: 'terminal',  css: 'style.css',      btn: '// switch skin'  },
        { key: 'y2k',       css: 'style-y2k.css',  btn: 'Switch Skin'     },
        { key: 'synthwave', css: 'style-sw.css',   btn: '> switch_skin'   },
        { key: 'gameboy',     css: 'style-gb.css',   btn: '> SWITCH SKIN'     },
        { key: 'darkacademia', css: 'style-da.css', btn: '✦ change skin'    }
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
    }
})();
