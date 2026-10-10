/* V2 shared UI: page chrome, buttons, the landscape camera screen (live checks, torch, example, captions, toast),
   video recorder (min-length ring, pace path) and the photo verdict. */
(function () {
  const A = App.asset;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const U = (window.U = { A, esc });

  /* ---------- portrait chrome (status + browser bar shown in the desktop phone frame only) ---------- */
  U.status = () => `<div class="sbar device-only"><span>08:15</span><img src="${A('core/statusIcons.svg')}" alt=""></div>`;
  U.browser = () => `
    <div class="bbar device-only">
      <img src="${A('core/chromeHome.svg')}" alt="">
      <div class="addr"><img src="${A('core/chromeSite.svg')}" alt=""><span>acmeinsurance.in<i>/pre-inspection/</i></span></div>
      <img src="${A('core/chromePlus.svg')}" alt=""><img src="${A('core/chromeTabs.svg')}" alt=""><img src="${A('core/chromeMore.svg')}" alt="">
    </div>`;
  U.top = (right = '') => `<div class="ptop"><img class="logo" src="${A('core/logo.svg')}" alt="ACME">${right}</div>`;
  U.pill = (t) => `<span class="stage-pill">${esc(t)}</span>`;
  U.head = (h, s) => `<div class="phead"><p class="h">${h}</p>${s ? `<p class="s">${s}</p>` : ''}</div>`;
  U.btn = (label, attrs = '', cls = '') => `<button class="btn ${cls}" ${attrs}>${label}</button>`;

  /* ---------- toast (shown on the next capture screen after a save) ---------- */
  U.toast = (t) => {
    if (!t) return '';
    const st = App.state;
    const img = t.img ? `<img src="${t.img}" alt="">` : '';
    return `<div class="toast" data-toast>
      <div class="t-img">${img}</div>
      <div class="t-txt"><p class="t-h"><i><img src="${A('cam/toast-check.svg')}" alt=""></i>${esc(t.title)}</p><p class="t-s">${esc(t.sub || '')}</p></div>
      ${t.undo ? `<button class="t-undo" data-action="undo"><img src="${A('cam/undo.svg')}" alt="">Undo</button>` : ''}
    </div>`;
  };
  U.setToast = (t) => { App.state.toast = t; };
  U.takeToast = () => { const t = App.state.toast; App.state.toast = null; App.state.lastToast = t; return t; };

  /* ---------- landscape camera screen ----------
     o = { pill:{label,i,n} | pillHtml, win:'wide'|'card', target:{l,t,w,h,label}, hint:{text,icon}, live:{ok:'text'},
           shutter:'photo'|'video', example:img, ring:html, topLeft:html, extra:html, toast } */
  U.cam = (o) => {
    const pill = o.pillHtml || (o.pill ? `<div class="cpill"><p>${esc(o.pill.label)} · ${o.pill.i} of ${o.pill.n}</p><i><b style="width:${(o.pill.i / o.pill.n) * 100}%"></b></i></div>` : '');
    const tgt = o.target ? `<div class="target" style="left:${o.target.l}%;top:${o.target.t}%;width:${o.target.w}%;height:${o.target.h}%"><span>${esc(o.target.label)}</span></div>` : '';
    const right = o.shutter === 'video'
      ? `<button class="shutter vid" data-action="shutter" aria-label="Record"><svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" class="trk"/><circle cx="40" cy="40" r="38" class="bar" pathLength="100" style="stroke-dasharray:0 100"/></svg><i></i></button>
         <div class="vtime"><b>0:00</b><span>min 0:${String(o.min || 10).padStart(2, '0')}</span></div>`
      : `<button class="shutter" data-action="shutter" aria-label="Capture"><i></i></button>`;
    return `
      <div class="cam-slot"></div>
      <div class="shade win-${o.win || 'wide'}"><div class="win" data-win>${tgt}<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div></div>
      ${U.status()}
      <button class="cbtn close" data-action="close" aria-label="Close"><img src="${A('cam/close.svg')}" alt=""></button>
      ${o.topLeft || ''}
      ${pill}
      <div class="cright">
        <button class="wbtn" data-action="cc-toggle" aria-label="Captions"><img src="${A('cam/cc.svg')}" alt=""></button>
        <button class="wbtn" data-action="vo-toggle" aria-label="Voice"><img src="${A('cam/speaker.svg')}" alt=""></button>
      </div>
      ${o.ring || `<button class="cbtn torch" data-action="torch" aria-label="Torch"><img src="${A('cam/torch.svg')}" alt=""></button>`}
      ${right}
      ${o.example ? `<button class="example" data-action="example" aria-label="Example"><img src="${o.example}" alt=""><span>Example</span></button>` : ''}
      <div class="hint" data-hint>${U.hintHtml(o.hint)}</div>
      ${o.extra || ''}
      ${U.toast(o.toast)}
      <div class="caption win-${o.win || 'wide'}"><img src="${A('cam/cap-speaker.svg')}" alt=""><p data-caption></p></div>
      ${o.example ? `<div class="ex-pop" hidden><img src="${o.example}" alt=""><p>Example · tap to close</p></div>` : ''}`;
  };
  const ICON = { info: 'cam/hint-info.svg', ok: 'cam/ok-check.svg', warn: 'cam/warn-dark.svg', walk: 'cam/walk-ic.svg' };
  U.hintHtml = (h) => (h ? `<span class="hp ${h.kind || 'info'}"><img src="${A(ICON[h.icon || h.kind] || ICON.info)}" alt="">${esc(h.text)}</span>` : '');

  /* Live judgment on the frame: corners + hint go amber (dark / shaky) or green (sharp, lit) as the camera moves. */
  function liveChecks(el, o) {
    const win = el.querySelector('.shade');
    const hint = el.querySelector('[data-hint]');
    let last = null, streak = 0, iv = 0;
    const set = (state) => {
      win.dataset.state = state;
      if (o.lockHint && o.lockHint()) return;
      const h = state === 'ok' ? { kind: 'ok', text: o.live.ok } : state === 'dark' ? { kind: 'warn', text: Camera.canTorch() ? 'Too dark · torch turned on, hold still' : 'Too dark · find more light' }
        : state === 'blurry' ? { kind: 'warn', text: 'Hold still · the picture is blurry' } : o.hint;
      hint.innerHTML = U.hintHtml(h);
      if (state === 'dark' && Camera.canTorch() && !Camera.torchOn) { Camera.torch(true); el.querySelector('[data-action="torch"]')?.classList.add('on'); }
    };
    const Camera = App.Camera;
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
    iv = setInterval(tick, 400);
    return () => clearInterval(iv);
  }

  /* Mount a camera screen. o = { key, fallback, live, hint, onShot(cap, el) | video:{min, max, onDone(cap)} , lockHint } */
  U.mountCam = (el, o) => {
    const slot = el.querySelector('.cam-slot');
    const offs = [];
    App.Camera.attach(slot, { fallbackImg: o.fallback, crop: o.fallbackCrop }).then(() => { if (o.live) offs.push(liveChecks(el, o)); });
    const t = el.querySelector('[data-toast]');
    if (t) { const tm = setTimeout(() => t.classList.add('out'), 3500); offs.push(() => clearTimeout(tm)); }
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) {
        if (e.target.closest('.ex-pop')) el.querySelector('.ex-pop').hidden = true;
        return;
      }
      const act = a.dataset.action;
      if (act === 'close') App.go(o.exit || 'inside');
      else if (act === 'torch') { const on = await App.Camera.torch(!App.Camera.torchOn); a.classList.toggle('on', on); }
      else if (act === 'example') el.querySelector('.ex-pop').hidden = false;
      else if (act === 'undo') { const u = (App.state.lastToast || {}).undo; if (u) { u.drop && u.drop(); App.go(u.go); } }
      else if (act === 'shutter' && !o.video) {
        if (el.dataset.busy) return;
        el.dataset.busy = 1;
        try {
          flash(el);
          const cap = await App.Camera.snap(slot, el.querySelector('[data-win]'));
          o.onShot(cap, el);
        } catch (err) { console.warn(err); }
        delete el.dataset.busy;
      }
    });
    if (o.video) offs.push(recorder(el, o));
    return () => { offs.forEach((f) => f && f()); App.Camera.torch(false); if (App.Camera.video) App.Camera.video.remove(); };
  };
  function flash(el) {
    const f = document.createElement('div');
    f.className = 'flash';
    el.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => (f.style.opacity = '0')));
    setTimeout(() => f.remove(), 300);
  }

  /* Video: no countdown. Red REC timer, ring fills to the minimum length before Stop unlocks, pace dot along the path. */
  function recorder(el, o) {
    const v = o.video, min = App.fast ? 3 : v.min || 10, max = v.max || 45;
    const btn = el.querySelector('.shutter'), bar = btn.querySelector('.bar'), time = el.querySelector('.vtime b');
    const pace = el.querySelector('.pace'), dot = pace && pace.querySelector('.dot'), done = pace && pace.querySelector('.done');
    let t0 = 0, iv = 0, sample = false, dead = false;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const tick = () => {
      const s = (Date.now() - t0) / 1000;
      time.textContent = fmt(s);
      el.querySelector('.rec-pill b').textContent = `REC ${fmt(s)}`;
      bar.style.strokeDasharray = `${Math.min(100, (s / min) * 100)} 100`;
      btn.classList.toggle('locked', s < min);
      if (pace) { const p = Math.min(1, s / min); dot.style.left = done.style.width = `calc((100% - 30px) * ${p})`; }
      if (s >= max) stop();
    };
    const start = async () => {
      App.VO.stop();
      el.dataset.rec = 'on';
      if (v.onStart) v.onStart(el);
      try { App.Camera.startRecording(); sample = false; } catch (e) { sample = true; } // no camera: timed sample clip
      t0 = Date.now(); tick(); iv = setInterval(tick, 200);
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
      if (!e.target.closest('[data-action="shutter"]')) return;
      if (el.dataset.rec === 'on') { if ((Date.now() - t0) / 1000 >= min) stop(); }
      else if (!el.dataset.rec) start();
    };
    el.addEventListener('click', click);
    return () => { dead = true; clearInterval(iv); if (App.Camera.isRecording()) App.Camera.stopRecording(); };
  }

  /* ---------- verdict (after a photo) ---------- */
  // o = { label:'Odometer · 3 of 5', cap, ask:'Can you read …', box:{l,t,w,h} (%), onUse, onRetake }
  U.verdict = (o) => {
    const q = (o.cap && o.cap.quality) || { ok: true };
    const bad = q.ok === false;
    const chip = (ok, t) => `<span class="vchip ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✕'} ${t}</span>`;
    const head = bad
      ? `<i class="vic warn">!</i><p>${q.dark ? 'Too dark' : 'A bit blurry'}</p>`
      : `<i class="vic ok"><img src="${A('cam/verdict-check.svg')}" alt=""></i><p>Clear and readable</p>`;
    const tip = bad ? (q.dark ? 'Turn on the torch or find more light, then capture again.' : 'Hold still for a second, then capture again.') : o.ask;
    return `
      ${U.status()}
      <div class="vphoto ${bad && q.blurry ? 'soft' : ''}"><img src="${o.cap ? o.cap.url : o.fallback}" alt="">
        ${!bad && o.box ? `<i class="vbox" style="left:${o.box.l}%;top:${o.box.t}%;width:${o.box.w}%;height:${o.box.h}%"></i>` : ''}
        <button class="vfull" data-action="full" aria-label="Full screen"><img src="${A('cam/fullscreen.svg')}" alt=""></button></div>
      <div class="vpanel">
        <p class="vlabel">${esc(o.label)}</p>
        <div class="vhead">${head}</div>
        <div class="vchips">${chip(true, 'In frame')}${chip(!q.blurry, 'Sharp')}${chip(!q.dark, 'Well lit')}</div>
        <div class="vtip">${esc(tip)}</div>
        <div class="vbtns">${bad
          ? `<button class="btn ghost" data-action="use">Use anyway</button><button class="btn" data-action="retake">Retake</button>`
          : `<button class="btn ghost" data-action="retake"><img src="${A('cam/retake.svg')}" alt="">Retake</button><button class="btn" data-action="use">Use photo</button>`}</div>
      </div>
      <div class="vfs" hidden><img src="${o.cap ? o.cap.url : o.fallback}" alt=""></div>`;
  };
  U.mountVerdict = (el, o) => {
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (e.target.closest('.vfs')) { el.querySelector('.vfs').hidden = true; return; }
      if (!a) return;
      if (a.dataset.action === 'full') el.querySelector('.vfs').hidden = false;
      if (a.dataset.action === 'use') o.onUse();
      if (a.dataset.action === 'retake') o.onRetake();
    });
  };
})();
