/* V2 shared UI (Anaira design system, Figma 669:30753): page chrome, logo, voice button, sheets and modals,
   the landscape camera screen (stepper header, capture window with live checks, shutter rail, countdown + timer
   for videos, zoom) and the capture review panel. */
(function () {
  const A = App.asset;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const U = (window.U = { A, esc });
  const I = (f) => A('ui/' + f);
  U.I = I;

  /* ---------- device chrome (desktop phone frame only) ---------- */
  U.status = () => `<div class="sbar device-only"><span>08:15</span><img src="${A('core/statusIcons.svg')}" alt=""></div>`;
  U.browser = () => `
    <div class="bbar device-only">
      <img src="${A('core/chromeHome.svg')}" alt="">
      <div class="addr"><img src="${A('core/chromeSite.svg')}" alt=""><span>acmeinsurance.in<i>/pre-inspection/</i></span></div>
      <img src="${A('core/chromePlus.svg')}" alt=""><img src="${A('core/chromeTabs.svg')}" alt=""><img src="${A('core/chromeMore.svg')}" alt="">
    </div>`;
  U.home = () => '<i class="homebar device-only"></i>';

  /* ---------- brand + header ---------- */
  U.logo = (white) => `<span class="logo ${white ? 'w' : ''}"><img class="mk" src="${I(white ? 'logo-mark-w.svg' : 'logo-mark.svg')}" alt=""><img class="wd" src="${I(white ? 'logo-word-w.svg' : 'logo-word.svg')}" alt="anaira"></span>`;
  U.vo = () => `<button class="vo-btn" data-vo="idle" disabled aria-label="Voice guide"><img class="i-vol" src="${I('volume.svg')}" alt=""><img class="i-rep" src="${I('replay.svg')}" alt="">
    <svg viewBox="0 0 40 40"><circle class="trk" cx="20" cy="20" r="19"/><circle class="bar" cx="20" cy="20" r="19"/></svg></button>`;
  U.nav = (right = U.vo(), cls = '') => `<div class="nav ${cls}">${U.logo()}${right}</div>`;
  U.title = (h, s) => `<div class="ptitle"><p class="h">${h}</p>${s ? `<p class="s">${s}</p>` : ''}</div>`;
  // portrait page: chrome + nav + body + action bar
  U.page = ({ body, foot = '', nav = U.nav(), bodyCls = '' }) => `${U.status()}${U.browser()}${nav}
    <div class="pg-body ${bodyCls}">${body}</div>
    <div class="abar">${foot}${U.home()}</div>`;
  U.foot = (btn, info) => `<div class="stack"><div class="foot">${btn}</div>${info ? `<p class="info-line">${info}</p>` : ''}</div>`;

  /* ---------- overlays ---------- */
  U.sheet = ({ title, body = '', note = "Tap I'm Ready when done", btn = 'I’m Ready', attrs = 'data-action="sheet-next"', cls = '' }) => `
    <div class="ov"><div class="sheet ${cls}"><i class="handle"></i><p class="st">${title}</p>${body}
      <div class="cta">${note ? `<p>${note}</p>` : ''}<button class="btn full" ${attrs}>${btn}</button></div></div></div>`;
  U.lmodal = ({ title, sub, body = '', foot, pic, pan, cls = '' }) => `
    <div class="ov"><div class="lmodal ${pic ? 'pic' : ''} ${pan ? 'pan' : ''} ${cls}">
      ${pic ? `<div class="bg"><img src="${pic}" alt=""></div>` : ''}
      ${sub ? `<div style="display:flex;flex-direction:column;gap:4px;width:100%"><p class="mt">${title}</p><p class="ms">${sub}</p></div>` : `<p class="mt">${title}</p>`}
      ${body}${foot}</div></div>`;
  U.snack = (el, text) => {
    const s = document.createElement('div');
    s.className = 'snack'; s.textContent = text;
    el.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  };

  /* ---------- stepper (Stepper 669:33512): done · current · to do ---------- */
  U.stepper = (items, curKey) => {
    const ci = items.findIndex((x) => x.key === curKey);
    return `<div class="stepper">${items.map((x, i) => {
      const s = i < ci || (ci < 0 && x.done) ? 'done' : i === ci ? 'cur' : 'todo';
      return `${i ? '<i class="dv"></i>' : ''}<span class="si ${s}"><img src="${A('cam2/st-' + s + '.svg')}" alt="">${esc(x.step)}</span>`;
    }).join('')}</div>`;
  };
  U.camNav = ({ items, cur, light, left }) => `<div class="cnav ${light ? 'light' : ''}">${left != null ? left : U.logo(true)}${items ? U.stepper(items, cur) : ''}${U.vo()}</div>`;

  /* ---------- landscape camera screen ----------
     o = { items, cur, win: 'rc'|'odo'|'vin', badge, shutter: 'photo'|'video', railCls, railTop, railBottom, zoom, extra, navLeft } */
  U.cam = (o) => {
    const shutter = o.shutter === 'video'
      ? `<span class="rtimer">0:00</span><button class="shutter rec" data-action="shutter" aria-label="Record"><i></i></button>`
      : `<button class="shutter" data-action="shutter" aria-label="Capture"><i></i></button>`;
    const torch = o.torch ? `<button class="torch-btn" data-action="torch" aria-label="Torch"><img src="${I('torch-off.svg')}" alt=""></button>` : '';
    return `
      <div class="cam-slot"></div>
      ${o.win ? `<div class="win w-${o.win}" data-win><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>` : ''}
      ${U.status()}
      ${U.camNav({ items: o.items, cur: o.cur, left: o.navLeft })}
      <div class="live" data-live><img src="${I('alert-16-dark.svg')}" alt=""><span></span></div>
      ${o.shutter === 'video' ? '<p class="countdown" data-count>3</p>' : ''}
      <div class="rail ${o.railCls || ''}">${o.railTop || ''}${torch}${shutter}${o.railBottom || ''}</div>
      ${o.zoom ? `<div class="zoom">${[1, 2, 3].map((z) => `<button data-zoom="${z}" class="${z === 1 ? 'on' : ''}">${z}x</button>`).join('')}</div>` : ''}
      ${o.badge ? `<p class="ibadge" data-badge>${esc(o.badge)}</p>` : ''}
      ${o.extra || ''}`;
  };

  /* Live judgment on the frame: corners go amber (dark / shaky) or green (sharp, lit); an amber pill says why. */
  function liveChecks(el) {
    const win = el.querySelector('[data-win]');
    const pill = el.querySelector('[data-live]');
    const Camera = App.Camera;
    let last = null, streak = 0;
    const set = (state) => {
      if (win) win.dataset.state = state;
      const msg = state === 'dark' ? (Camera.canTorch() ? 'Too dark · torch turned on, hold still' : 'Too dark · find more light') : state === 'blurry' ? 'Hold still · the picture is blurry' : '';
      if (pill && el.dataset.rec !== 'on') { pill.classList.toggle('on', !!msg); pill.querySelector('span').textContent = msg; }
      if (state === 'dark' && Camera.canTorch() && !Camera.torchOn) { Camera.torch(true); U.torchIcon(el, true); }
    };
    const tick = () => {
      const s = Camera.source;
      if (!s) return;
      let m;
      try { m = App.Quality.measure(s, 120); } catch (e) { return; }
      if (!m) return;
      const state = m.mean < 38 ? 'dark' : m.sharpness < 10 ? 'blurry' : 'ok';
      if (state === last) streak++; else { last = state; streak = 1; }
      if (streak === 2 || (state === 'ok' && streak === 3)) set(state);
    };
    const iv = setInterval(tick, 400);
    return () => clearInterval(iv);
  }

  /* Mount a camera screen. o = { fallback, crop, live, onShot(cap, el) | video: { min, max, onDone(cap), during }, onAction(act, el) } */
  U.mountCam = (el, o) => {
    const slot = el.querySelector('.cam-slot');
    const offs = [];
    App.Camera.attach(slot, { fallbackImg: o.fallback, crop: o.crop }).then(() => { if (o.live !== false) offs.push(liveChecks(el)); });
    el.addEventListener('click', async (e) => {
      const z = e.target.closest('[data-zoom]');
      if (z) {
        el.querySelectorAll('[data-zoom]').forEach((b) => b.classList.toggle('on', b === z));
        App.Camera.setZoom(slot, +z.dataset.zoom);
        return;
      }
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'torch') { U.torchIcon(el, await App.Camera.torch(!App.Camera.torchOn)); return; }
      if (act === 'shutter' && !o.video) {
        if (el.dataset.busy || el.querySelector('.ov')) return;
        el.dataset.busy = 1;
        try {
          flash(el);
          const cap = await App.Camera.snap(slot, el.querySelector('[data-win]'));
          o.onShot(cap, el);
        } catch (err) { console.warn(err); }
        delete el.dataset.busy;
      } else if (o.onAction) o.onAction(act, el, a);
    });
    if (o.video) offs.push(recorder(el, o));
    return () => { offs.forEach((f) => f && f()); App.Camera.torch(false); if (App.Camera.video) App.Camera.video.remove(); };
  };
  // Torch (855:81742 off / 855:81738 on)
  U.torchIcon = (el, on) => { const b = el.querySelector('.torch-btn'); if (b) { b.classList.toggle('on', on); b.querySelector('img').src = I(on ? 'torch-on.svg' : 'torch-off.svg'); } };
  function flash(el) {
    const f = document.createElement('div');
    f.className = 'flash';
    el.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => (f.style.opacity = '0')));
    setTimeout(() => f.remove(), 300);
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  U.fmt = fmt;

  /* Video (Windshield · Record 741:59757 → Countdown 669:31371 → Recording 669:31377): tap Record → 3-2-1 →
     red timer above the stop button; Stop works once the minimum length is reached. */
  function recorder(el, o) {
    const v = o.video, min = App.fast ? 3 : v.min || 10, max = v.max || 60;
    const btn = el.querySelector('.shutter'), time = el.querySelector('.rtimer'), count = el.querySelector('[data-count]');
    let t0 = 0, iv = 0, ct = 0, sample = false, dead = false;
    const tick = () => {
      const s = (Date.now() - t0) / 1000;
      time.textContent = fmt(s);
      btn.classList.toggle('wait', s < min);
      if (s >= max) stop();
    };
    const start = () => {
      el.dataset.rec = 'count';
      let n = 3;
      count.textContent = n;
      ct = setInterval(() => {
        n -= 1;
        if (n > 0) { count.textContent = n; return; }
        clearInterval(ct);
        if (dead) return;
        el.dataset.rec = 'on';
        if (v.during) App.VO.speak(v.during);
        const b = el.querySelector('[data-badge]');
        if (b && v.badgeOn) b.textContent = v.badgeOn;
        try { App.Camera.startRecording(); sample = false; } catch (e) { sample = true; } // no camera: timed sample clip
        t0 = Date.now(); tick(); iv = setInterval(tick, 200);
      }, 1000);
    };
    const stop = async () => {
      if (el.dataset.rec !== 'on') return;
      el.dataset.rec = 'saving';
      clearInterval(iv);
      let cap = sample ? null : await App.Camera.stopRecording();
      const dur = (Date.now() - t0) / 1000;
      if (!cap) cap = { kind: 'video', sample: true, url: o.fallback, duration: dur, quality: { ok: true }, at: Date.now() };
      cap.duration = cap.duration || dur;
      if (!dead) v.onDone(cap);
    };
    const click = (e) => {
      if (!e.target.closest('[data-action="shutter"]') || el.querySelector('.ov')) return;
      if (el.dataset.rec === 'on') { if ((Date.now() - t0) / 1000 >= min) stop(); }
      else if (!el.dataset.rec) { App.VO.stop(); start(); }
    };
    el.addEventListener('click', click);
    return () => { dead = true; clearInterval(iv); clearInterval(ct); if (App.Camera.isRecording()) App.Camera.stopRecording(); };
  }

  /* small still for posters: the current camera frame, or the screen's sample still */
  U.thumb = (fallback) => {
    try {
      const f = App.Camera.frame();
      if (f && App.Camera.source === App.Camera.video) {
        const c = document.createElement('canvas'); c.width = 320; c.height = Math.round((f.height / f.width) * 320);
        c.getContext('2d').drawImage(f, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.75);
      }
    } catch (e) {}
    return fallback;
  };

  /* ---------- capture review panel (Captured 678:65329 · Error 743:74582 · Too dark 678:65703 · Recorded 731:56574)
     o = { label, cap, fallback, poster, ask, chips:[a,b], mode: 'good'|'retake'|'skip'|'anyway' } */
  U.verdict = (o) => {
    const q = (o.cap && o.cap.quality) || { ok: true };
    const video = o.cap && o.cap.kind === 'video';
    const bad = !video && q.ok === false;
    const mode = bad ? o.mode || 'anyway' : 'good';
    const src = o.cap ? (video ? o.poster : o.cap.url) : o.fallback;
    const chip = (ok, t) => `<span class="chip ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✕'} ${t}</span>`;
    const [c1, c2] = o.chips || (video ? ['Steady', 'Well lit'] : ['Sharp', 'Well lit']);
    const head = bad
      ? `<i class="warn">!</i><p>${q.dark ? 'Bad lighting, too dark' : 'A bit blurry'}</p>`
      : `<i><img src="${I('check-16-w.svg')}" alt=""></i><p>Completed</p>`;
    const tip = !bad ? `<p class="tip"><img src="${I('info-12.svg')}" alt="">${esc(o.ask)}</p>`
      : mode === 'anyway' ? `<p class="tip"><img src="${I('info-12.svg')}" alt="">${q.dark ? 'Turn on the torch or find better light, then retake.' : 'Hold still for a second, then retake.'}</p>`
        : `<p class="tip err"><img src="${I('alert-16-red.svg')}" alt="">${q.dark ? 'Find better light, then retake.' : 'Hold still for a second, then retake.'}</p>`;
    const btns = {
      good: `<button class="btn sec" data-action="retake">Retake</button><button class="btn flex" data-action="use">${video ? 'Use video' : 'Use photo'}</button>`,
      retake: `<button class="btn flex" data-action="retake">Retake</button>`,
      skip: `<button class="btn sec flex" data-action="retake">Retake</button><button class="btn grey" data-action="skip">Skip</button>`,
      anyway: `<button class="btn sec" data-action="use">Use anyway</button><button class="btn flex" data-action="retake">Retake</button>`,
    }[mode];
    return `
      ${U.status()}
      <div class="vrow">
        <div class="vimg ${bad && q.dark ? 'dark' : ''} ${bad && q.blurry && !q.dark ? 'soft' : ''}">
          <img src="${src}" alt="">
          <button class="max" data-action="full" aria-label="Full screen"><img src="${I('maximize.svg')}" alt=""></button>
          ${video ? `<div class="player"><button data-action="play" aria-label="Play"><img src="${I('pause-16.svg')}" alt=""></button><i class="pb"><i data-pb></i></i><span data-pt>0:00/${fmt(o.cap.duration || 0)}</span></div>` : ''}
        </div>
        <div class="vside">
          <div class="top"><p class="lab">${esc(o.label)}</p><div class="head">${head}</div>
            <div class="chips">${chip(!(bad && q.blurry && !q.dark), c1)}${chip(!(bad && q.dark), c2)}</div></div>
          <div class="bot">${tip}<div class="row">${btns}</div></div>
        </div>
      </div>`;
  };
  U.mountVerdict = (el, o) => {
    const cap = o.cap;
    // recorded video: a looping (muted) preview with a progress bar; sample clips animate the bar over their length
    let iv = 0;
    if (cap && cap.kind === 'video') {
      const img = el.querySelector('.vimg > img');
      let vid = null;
      if (!cap.sample && cap.url) {
        vid = document.createElement('video');
        Object.assign(vid, { src: cap.url, muted: true, loop: true, playsInline: true, autoplay: true });
        img.replaceWith(vid);
        vid.play().catch(() => {});
      }
      const dur = cap.duration || 10, t0 = Date.now();
      let paused = false, pAt = 0;
      iv = setInterval(() => {
        const t = vid ? vid.currentTime : paused ? pAt : ((Date.now() - t0) / 1000) % dur;
        el.querySelector('[data-pb]').style.width = `${(t / dur) * 100}%`;
        el.querySelector('[data-pt]').textContent = `${fmt(t)}/${fmt(dur)}`;
      }, 250);
      el.querySelector('[data-action="play"]').addEventListener('click', (e) => {
        e.stopPropagation();
        paused = !paused; pAt = ((Date.now() - t0) / 1000) % dur;
        if (vid) (paused ? vid.pause() : vid.play());
        e.currentTarget.querySelector('img').src = I(paused ? 'play-20-w.svg' : 'pause-16.svg');
      });
    }
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const act = a.dataset.action;
      if (act === 'full') U.fullscreen(el, { cap, src: el.querySelector('.vimg > img, .vimg > video').src, label: o.fsLabel });
      if (act === 'use') o.onUse();
      if (act === 'retake') o.onRetake();
      if (act === 'skip') o.onSkip && o.onSkip();
    });
    return () => clearInterval(iv);
  };

  /* full-screen preview (Captured Preview 669:30983) */
  U.fullscreen = (el, { cap, src, label, sub, action }) => {
    const f = document.createElement('div');
    f.className = 'fs';
    const video = cap && cap.kind === 'video' && !cap.sample;
    f.innerHTML = `${video ? `<video src="${cap.url}" muted loop playsinline autoplay controls></video>` : `<img src="${src}" alt="">`}
      ${label ? `<div class="fl"><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>` : ''}
      ${action ? `<button class="btn fs-act">${esc(action.label)}</button>` : ''}
      <button class="x" aria-label="Close"><img src="${I('x-24-w.svg')}" alt=""></button>`;
    f.querySelector('.x').addEventListener('click', (e) => { e.stopPropagation(); f.remove(); });
    if (action) f.querySelector('.fs-act').addEventListener('click', (e) => { e.stopPropagation(); action.onClick(); });
    el.appendChild(f);
    return f;
  };
})();
