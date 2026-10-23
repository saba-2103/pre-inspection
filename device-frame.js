/* Desktop phone frame: device picker (Chrome DevTools sizes, portrait CSS px) shared by V1 and V2, plus the
   platform's device chrome: iOS status bar (Dynamic Island) + Safari, or Android status bar + Chrome. The choice is
   kept in localStorage so it carries across versions. Only shown when the page is framed. */
(function () {
  const DEVICES = [
    { id: 'iphone-se', name: 'iPhone SE', w: 375, h: 667, os: 'ios' },
    { id: 'iphone-16', name: 'iPhone 16', w: 393, h: 852, os: 'ios', island: true },
    { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', w: 440, h: 956, os: 'ios', island: true },
    { id: 'pixel-9', name: 'Pixel 9', w: 412, h: 924, os: 'android' },
    { id: 'pixel-9-pro', name: 'Pixel 9 Pro', w: 427, h: 952, os: 'android' },
    { id: 'pixel-10', name: 'Pixel 10', w: 412, h: 924, os: 'android' },
    { id: 'galaxy-a55', name: 'Samsung Galaxy A55', w: 360, h: 800, os: 'android' },
  ];
  const KEY = 'pi-device', TOP = 56; // room for the picker above the phone
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const get = () => DEVICES.find((d) => d.id === read()) || DEVICES[1];
  // html[data-os] + .island switch the chrome below (CSS only, so a device change needs no re-render)
  const apply = () => { const d = get(), r = document.documentElement; r.dataset.os = d.os; r.classList.toggle('island', !!d.island); };
  apply();

  const svg = (w, h, body) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;
  // Android: wifi, cell signal, battery (Material)
  const ANDROID_ICONS = svg(50, 14, '<g fill="#1f1f1f"><path d="M8 13.4.3 4.1a12 12 0 0 1 15.4 0z"/><path d="M20 13.4 32 1.4v12z"/><rect x="40" y="2" width="7.5" height="11.4" rx="1.4"/><rect x="42" y=".6" width="3.5" height="2" rx=".6"/></g>');
  const RELOAD = svg(16, 16, '<g fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1"/><path d="M12.4 1.5v2.9H9.5"/></g>');
  const LOCK = svg(10, 12, '<path fill="#3c3c43" fill-opacity=".6" d="M2.2 5V3.6a2.8 2.8 0 0 1 5.6 0V5h.6c.6 0 1 .4 1 1v4.6c0 .6-.4 1-1 1H1.6c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1zm1.3 0h3V3.6a1.5 1.5 0 0 0-3 0z"/>');

  const st = document.createElement('style');
  st.textContent = `#device-pick{position:fixed;left:16px;top:16px;z-index:1000;appearance:none;-webkit-appearance:none;cursor:pointer;
      background:#22252b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
      color:#fff;border:1px solid #3a3d44;border-radius:8px;padding:8px 34px 8px 12px;font:500 13px/1.2 'Inter',system-ui,sans-serif}
    #device-pick:focus{outline:2px solid #3554d1;outline-offset:1px} html:not(.framed) #device-pick{display:none}
    html[data-os="ios"] .dc-and, html[data-os="android"] .dc-ios{display:none !important}
    .dc-island{display:none;position:absolute;left:50%;top:4px;width:96px;height:26px;margin-left:-48px;border-radius:13px;background:#000}
    html.island [data-o="portrait"] .dc-island{display:block}
    html[data-os="ios"] .dc-sb .dc-t{font-family:-apple-system,'SF Pro Text','Inter',sans-serif}
    html[data-os="ios"]:not(.island) .dc-sb .dc-t{position:absolute;left:50%;transform:translateX(-50%)}
    html[data-os="ios"]:not(.island) .dc-sb > img.dc-ios{margin-left:auto}
    html[data-os="android"] .dc-sb{padding-left:18px;padding-right:18px}
    html[data-os="android"] .dc-sb .dc-t{font:500 14px/1 'Roboto',sans-serif;letter-spacing:.1px;text-align:left;width:auto;color:#1f1f1f}
    .dc-sb img.dc-and{width:50px;height:14px}
    .dc-chrome{display:flex;align-items:center;width:100%;height:100%}
    .dc-safari{display:flex;align-items:center;width:100%;height:100%;padding:0 2px}
    .dc-safari .sf{flex:1;height:38px;border-radius:12px;background:#eeeef0;display:flex;align-items:center;gap:8px;padding:0 12px;font:400 16px/1 -apple-system,'SF Pro Text','Inter',sans-serif;color:#000;white-space:nowrap}
    .dc-safari .aa{font-weight:500;font-size:17px;letter-spacing:-.5px}.dc-safari .aa small{font-size:12px}
    .dc-safari .u{flex:1;display:flex;align-items:center;justify-content:center;gap:5px}
    .dc-safari img{display:block}`;
  document.head.appendChild(st);

  window.DeviceFrame = {
    list: DEVICES,
    get,
    /* platform chrome pieces for the versions' status bar (class dc-sb, time in .dc-t) and browser bar */
    time: () => '<b class="dc-ios">08:15</b><b class="dc-and">8:15</b>',
    statusIcons: (iosIcons) => `<i class="dc-island"></i><img class="dc-ios" src="${iosIcons}" alt=""><img class="dc-and" src="${ANDROID_ICONS}" alt="">`,
    safari: (domain) => `<div class="dc-ios dc-safari"><div class="sf"><span class="aa"><small>A</small>A</span><span class="u"><img src="${LOCK}" width="10" height="12" alt="">${domain}</span><img src="${RELOAD}" width="16" height="16" alt=""></div></div>`,
    /* Stage geometry for a design canvas dw × dh: the device box (rotated for landscape) is filled the way a real
       phone would be (portrait scales to the width, landscape fits the canvas), then the box is fitted to the window. */
    fit(land, dw, dh) {
      const d = get(), bw = land ? d.h : d.w, bh = land ? d.w : d.h;
      const s = land ? Math.min(bw / dw, bh / dh) : bw / dw;
      // one zoom for every device (fits the largest), so a smaller phone really looks smaller
      const mw = Math.max(...DEVICES.map((x) => (land ? x.h : x.w))), mh = Math.max(...DEVICES.map((x) => (land ? x.w : x.h)));
      const f = Math.min((innerWidth - 40) / mw, (innerHeight - TOP - 24) / mh, 1.25);
      return { W: bw / s, h: bh / s, scale: s * f, left: (innerWidth - bw * f) / 2, top: TOP + (innerHeight - TOP - bh * f) / 2, box: { w: bw, h: bh, f } };
    },
    mount() {
      if (document.getElementById('device-pick')) return;
      const sel = document.createElement('select');
      sel.id = 'device-pick';
      sel.setAttribute('aria-label', 'Device');
      sel.innerHTML = DEVICES.map((d) => `<option value="${d.id}">${d.name} (${d.w} × ${d.h})</option>`).join('');
      sel.value = get().id;
      sel.addEventListener('change', () => {
        try { localStorage.setItem(KEY, sel.value); } catch (e) {}
        apply();
        dispatchEvent(new Event('resize')); // every page re-lays out on resize
      });
      document.body.appendChild(sel);
    },
  };
})();
