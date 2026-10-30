/*
 * ui.js: reine Darstellungsschicht für das MCP-Bridge-Panel.
 * Ändert nichts an der Bridge-Logik in bridge-cep.js. Übernimmt das Theme aus Premiere,
 * übersetzt die Statustexte ins Deutsche und formatiert Warteschlange und Protokoll.
 */
(function () {
    'use strict';

    // Bekannte Texte aus bridge-cep.js. Unbekannte Texte bleiben unverändert.
    var STATUS_TEXT = {
        'Connected': 'Verbunden',
        'Disconnected': 'Getrennt',
        'Premiere Pro: Ready': 'Bereit',
        'Premiere Pro: Waiting': 'Wartet'
    };

    var QUEUE_STATUS = {
        'pending': 'Wartet',
        'executing': 'Läuft',
        'completed': 'Fertig'
    };

    var QUEUE_EMPTY_EN = 'No commands in queue';
    var QUEUE_EMPTY_DE = 'Keine Befehle in der Warteschlange';

    function setText(el, value) {
        if (el && el.textContent !== value) el.textContent = value;
    }

    // Beobachtet ein Element und führt fn bei jeder Änderung aus.
    // fn muss idempotent sein, weil die eigene Änderung den Observer erneut auslöst.
    function watch(el, fn, opts) {
        if (!el || typeof MutationObserver === 'undefined') return;
        fn(el);
        new MutationObserver(function () { fn(el); }).observe(el, opts || { childList: true, characterData: true, subtree: true });
    }

    // ---------- Version ----------
    function showVersion() {
        var badge = document.getElementById('panelVersion');
        if (!badge) return;
        var raw = null;
        try {
            if (typeof require === 'function') {
                var fs = require('fs');
                var path = require('path');
                var base = decodeURIComponent(window.location.pathname);
                if (/^\/[A-Za-z]:\//.test(base)) base = base.slice(1);
                raw = fs.readFileSync(path.join(path.dirname(base), 'mcp-version.json'), 'utf8');
            }
        } catch (e) {}
        if (!raw) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'mcp-version.json', false);
                xhr.send(null);
                if (xhr.status === 0 || xhr.status === 200) raw = xhr.responseText;
            } catch (e2) {}
        }
        try {
            var version = raw ? JSON.parse(raw).version : '';
            if (version) badge.textContent = 'v' + version;
        } catch (e3) {}
    }

    // ---------- Theme aus Premiere übernehmen ----------
    function toHex(c) {
        var h = Math.round(c).toString(16);
        return h.length === 1 ? '0' + h : h;
    }

    function applyHostTheme(cs) {
        try {
            var skin = cs.getHostEnvironment().appSkinInfo;
            var c = skin.panelBackgroundColor.color;
            var root = document.documentElement;
            root.style.setProperty('--bg', '#' + toHex(c.red) + toHex(c.green) + toHex(c.blue));
            var luminance = (0.2126 * c.red + 0.7152 * c.green + 0.0722 * c.blue) / 255;
            if (luminance > 0.5) root.setAttribute('data-theme', 'light');
            else root.removeAttribute('data-theme');
        } catch (e) {}
    }

    function initTheme() {
        if (typeof CSInterface === 'undefined') return;
        try {
            var cs = new CSInterface();
            applyHostTheme(cs);
            cs.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, function () { applyHostTheme(cs); });
        } catch (e) {}
    }

    // ---------- Status ----------
    function translateStatus(el) {
        var de = STATUS_TEXT[el.textContent];
        if (de) setText(el, de);
    }

    // ---------- Update-Banner ----------
    function translateUpdateVersion(el) {
        var m = /^(\S+) available$/.exec(el.textContent);
        if (m) setText(el, 'v' + m[1].replace(/^v/, ''));
    }

    function translateUpdateCopy(el) {
        var m = /^(\S+) is recommended\. You have (\S+)\./.exec(el.textContent);
        if (m) setText(el, 'Installiert ist ' + m[2] + '. Befehl kopieren, im Terminal ausführen, danach das Panel neu laden.');
    }

    function translateUpdateStatus(el) {
        if (/^Copied\./.test(el.textContent)) setText(el, 'Kopiert. Im Terminal einfügen, danach das Panel neu laden.');
    }

    // ---------- Warteschlange ----------
    function decorateQueue(el) {
        var items = el.querySelectorAll('.command-item');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var label = item.querySelector('.command-label');
            var status = item.querySelector('.command-status');
            if (!status && label && (label.textContent === QUEUE_EMPTY_EN || label.textContent === QUEUE_EMPTY_DE)) {
                if (!item.classList.contains('is-empty')) item.classList.add('is-empty');
                setText(label, QUEUE_EMPTY_DE);
                continue;
            }
            if (label && !label.title) label.title = label.textContent;
            if (status) {
                var key = status.className.replace('command-status', '').trim();
                if (QUEUE_STATUS[key]) setText(status, QUEUE_STATUS[key]);
            }
        }
    }

    // ---------- Protokoll ----------
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatLogEntry(entry) {
        if (entry.getAttribute('data-formatted')) return;
        if (entry.querySelector('.log-msg')) {
            entry.setAttribute('data-formatted', '1');
            return;
        }
        var text = entry.textContent || '';
        var m = /^\[([^\]]+)\]\s?([\s\S]*)$/.exec(text);
        var msg = m ? m[2] : text;
        if (msg === 'Log cleared') msg = 'Protokoll geleert';

        entry.setAttribute('data-formatted', '1');
        entry.textContent = '';

        if (m) {
            var d = new Date(m[1]);
            if (!isNaN(d.getTime())) {
                var time = document.createElement('span');
                time.className = 'log-time';
                time.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
                time.title = d.toLocaleString('de-DE');
                entry.appendChild(time);
            }
        }
        var body = document.createElement('span');
        body.className = 'log-msg';
        body.textContent = msg;
        entry.appendChild(body);
    }

    function formatLog(el) {
        var entries = el.querySelectorAll('.log-entry');
        for (var i = 0; i < entries.length; i++) formatLogEntry(entries[i]);
    }

    function init() {
        showVersion();
        initTheme();
        watch(document.getElementById('connectionText'), translateStatus);
        watch(document.getElementById('serverText'), translateStatus);
        watch(document.getElementById('updateBannerVersion'), translateUpdateVersion);
        watch(document.getElementById('updateBannerCopy'), translateUpdateCopy);
        watch(document.getElementById('updateBannerStatus'), translateUpdateStatus);
        watch(document.getElementById('commandQueue'), decorateQueue);
        watch(document.getElementById('logContainer'), formatLog, { childList: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
