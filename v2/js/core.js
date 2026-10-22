/* V2 core runtime: router, stage scaling + orientation (counter-rotation + rotate prompt), state, voice-over with a
   playback ring on the voice button, camera (live checks, auto torch, zoom, fallback stills), recording, quality
   checks, background uploads, permissions. Based on V1's runtime; see /v1/js/core.js for the original. */
(function () {
  const params = new URLSearchParams(location.search);

  const App = (window.App = {
    screens: {},
    order: [],
    current: null,
    cleanup: null,
    fast: params.get('fast') === '1', // review/testing: 3 s video minimum instead of 10 s
    config: { owner: 'Rahul', reg: 'KA 01 AB 1234', model: 'Hyundai Creta', policy: 'MTR-24-88213', ref: 'PI-24-88213' },
    state: {
      captures: {}, // key -> {kind:'photo'|'video', url, blob, w, h, duration, quality:{dark,blurry,ok}, sample?}
      damages: [], // [{panel, type, close, wide}]
      rcType: null, // 'card' | 'paper', picked on the RC type modal
      permissions: {},
      location: null,
      note: '', voiceNote: null,
      // optional capture flows picked on the internal Items screen (?optional=0 starts with all off)
      items: Object.fromEntries(['windshield', 'roof', 'vin', 'engine'].map((k) => [k, params.get('optional') !== '0'])),
    },
  });

  /* ---------- registry ---------- */
  App.screen = function (def) {
    if (!def.id) throw new Error('screen needs id');
    def.orientation = def.orientation || 'portrait';
    App.screens[def.id] = def;
    App.order.push(def.id);
    return def;
  };
  App.go = function (id, replace) {
    const h = '#/' + id;
    if (replace) location.replace(h);
    else location.hash = h;
  };
  App.back = () => history.back();

  /* ---------- device / framing ---------- */
  const forceFrame = params.get('frame');
  function isFramed() {
    if (forceFrame === '1') return true;
    if (forceFrame === '0') return false;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const small = Math.min(screen.width, screen.height) < 600;
    return !(coarse && small);
  }
  const deviceOrientation = () => (innerWidth > innerHeight ? 'landscape' : 'portrait');
  App.deviceOrientation = deviceOrientation;

  /* ---------- render ---------- */
  const stage = document.getElementById('stage');
  let lastId = null, lastRot = null, lastVO = null;
  const currentId = () => { const m = location.hash.match(/^#\/([^?]+)/); return m ? decodeURIComponent(m[1]) : App.startId; };
  App.hashParam = (k) => new URLSearchParams(location.hash.split('?')[1] || '').get(k);

  function render() {
    const framed = isFramed();
    const html = document.documentElement;
    html.classList.toggle('framed', framed);
    let id = currentId();
    let def = App.screens[id];
    if (!def) { id = App.startId; def = App.screens[id]; }
    if (!def) return;

    // "turn your phone" screens move on by themselves once the phone is in the wanted orientation
    if (!framed && def.turnTo && def.turnTo === deviceOrientation() && def.next) { App.go(def.next(), true); return; }

    // wrong orientation on a phone: keep the screen in its own orientation (counter-rotated) + a turn prompt
    const rot = !framed && def.orientation !== deviceOrientation() ? (def.orientation === 'landscape' ? 'cw' : 'ccw') : null;
    html.classList.toggle('phone-land', !framed && (def.orientation === 'landscape'));
    html.classList.toggle('rot', !!rot);
    layout(def, framed, rot);
    const prompt = rot && !def.turnTo;
    const key = location.hash; // includes ?state=… so deep-link variants re-render
    if (lastId === key && App.current === id && lastRot === rot) return; // only a resize
    if (App.cleanup) { try { App.cleanup(); } catch (e) { console.error(e); } App.cleanup = null; }
    App.current = id; lastId = key; lastRot = rot;

    const ctx = { def, state: App.state, config: App.config, go: App.go };
    const el = document.createElement('div');
    el.className = 'screen ' + (def.scroll ? 'scroll ' : '') + (def.className || '');
    el.dataset.screen = def.id;
    el.dataset.o = def.orientation;
    el.innerHTML = def.render(ctx);
    stage.replaceChildren(el);
    App.cleanup = def.mount ? def.mount(el, ctx) || null : null;
    const vo = typeof def.vo === 'function' ? def.vo(ctx) : def.vo;
    // no voice-over behind the rotate prompt (it plays once the phone is turned); a re-render with the same
    // voice-over on the same screen (permission checks, RC type picks…) doesn't replay it
    if (prompt) { App.VO.clear(); lastVO = null; }
    else if (!vo) { App.VO.clear(); lastVO = null; }
    else if (!lastVO || lastVO.id !== id || lastVO.text !== vo) { lastVO = { id, text: vo }; App.VO.speak(vo); }
    App.VO.bind(el);
    togglePrompt(prompt, def);
    document.body.style.background = framed ? '' : getComputedStyle(el).backgroundColor;
  }

  /* rotate prompt over a counter-rotated screen (V1's "Please rotate your phone" modal, Figma 669:31280); the card
     is turned back so it reads upright in the hand */
  function togglePrompt(show, def) {
    let p = stage.querySelector('.turn-prompt');
    if (!show) { if (p) p.remove(); return; }
    if (p) return;
    p = document.createElement('div');
    p.className = 'turn-prompt';
    p.innerHTML = `<div class="tp-card ${App.rot || ''} ${def.orientation === 'landscape' ? 'to-l' : 'to-p'}"><p class="tp-t">Please rotate your phone</p>
      <div class="tp-ic"><img src="${App.asset('ui/rotate-phone.svg')}" alt=""></div></div>`;
    stage.appendChild(p);
  }

  /* Stage = design canvas scaled to the viewport. Portrait 390 wide (height flexes), landscape fits the 850×356 content
     area and grows edge to edge (34px status slot kept in layout but off-screen). rot = counter-rotate 90° cw/ccw. */
  function layout(def, framed, rot) {
    const land = def.orientation === 'landscape';
    let W = land ? 850 : 390, h = land ? 390 : 850, scale, tf;
    if (framed) {
      scale = Math.min((innerWidth - 40) / W, (innerHeight - 40) / h, 1.25);
      tf = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - h * scale) / 2}px) scale(${scale})`;
    } else {
      // visual (rotated) viewport
      const vw = rot ? innerHeight : innerWidth, vh = rot ? innerWidth : innerHeight;
      if (land) {
        scale = Math.min(vw / W, vh / 356);
        W = vw / scale; h = vh / scale + 34;
      } else {
        scale = vw / W; h = vh / scale;
      }
      if (rot === 'cw') tf = `translate(${innerWidth + (land ? 34 * scale : 0)}px, 0) rotate(90deg) scale(${scale})`;
      else if (rot === 'ccw') tf = `translate(${land ? -34 * scale : 0}px, ${innerHeight}px) rotate(-90deg) scale(${scale})`;
      else tf = `translate(0, ${land ? -34 * scale : 0}px) scale(${scale})`;
    }
    stage.style.width = W + 'px';
    stage.style.height = h + 'px';
    stage.style.transform = tf;
    App.scale = scale;
    App.rot = rot;
  }

  addEventListener('hashchange', render);
  addEventListener('resize', () => requestAnimationFrame(render));
  addEventListener('orientationchange', () => setTimeout(render, 150));
  App.rerender = () => { lastId = null; render(); };

  /* Return-to: Review sets App.state.returnTo before a re-capture; "next" after a capture goes through App.nextAfter. */
  App.nextAfter = function (defaultId) {
    const q = App.state.fixQueue;
    if (q && q.length) return q.shift();
    const r = App.state.returnTo;
    if (r) { App.state.returnTo = null; App.state.fixQueue = null; return r; }
    return defaultId;
  };

  // delegated navigation: data-go="screen-id" (plain), data-next="screen-id" (honours returnTo)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go],[data-next]');
    if (!t || !stage.contains(t)) return;
    e.preventDefault();
    if (t.dataset.next) App.go(App.nextAfter(t.dataset.next));
    else App.go(t.dataset.go);
  });

  App.start = function (startId) {
    App.startId = startId;
    // every load/refresh restarts the flow (the #/__index review helper and ?state deep links are kept)
    const id = currentId();
    if (id !== '__index' && !App.hashParam('state')) history.replaceState(null, '', '#/' + startId);
    render();
  };

  /* ---------- pull to refresh (touch) ---------- */
  const ptr = document.createElement('div');
  ptr.className = 'ptr';
  ptr.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(ptr);
  const PTR_MAX = 120, PTR_TRIGGER = 80;
  let ptrY0 = null, ptrDy = 0;
  const atTop = (node) => { for (; node && node !== document.body; node = node.parentElement) if (node.scrollTop > 0) return false; return true; };
  function ptrSet(dy, animate) {
    ptr.style.transition = animate ? 'transform .2s, opacity .2s' : 'none';
    ptr.style.opacity = Math.min(dy / PTR_TRIGGER, 1);
    ptr.style.transform = `translate(-50%, ${dy - 48}px) rotate(${dy * 3}deg)`;
    ptr.classList.toggle('ready', dy >= PTR_TRIGGER);
  }
  addEventListener('touchstart', (e) => { ptrY0 = !App.rot && e.touches.length === 1 && atTop(e.target) ? e.touches[0].clientY : null; ptrDy = 0; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (ptrY0 === null) return;
    if (e.touches.length > 1) { ptrY0 = null; ptrSet(0, true); return; }
    ptrDy = Math.min(Math.max(e.touches[0].clientY - ptrY0, 0) * 0.5, PTR_MAX);
    ptrSet(ptrDy);
  }, { passive: true });
  addEventListener('touchend', () => {
    if (ptrY0 === null) return;
    ptrY0 = null;
    if (ptrDy >= PTR_TRIGGER) { ptr.classList.add('spin'); location.href = '../'; /* back to the version launcher */ } else ptrSet(0, true);
  });

  /* ---------- helpers ---------- */
  App.asset = (p) => 'assets/' + p;
  App.capture = (key) => App.state.captures[key] || null;
  App.save = (key, cap) => { App.state.captures[key] = cap; Uploads.add(cap); return cap; };
  App.drop = (key) => { delete App.state.captures[key]; };

  /* ---------- Voice-over (speechSynthesis) ---------- */
  const VO = (App.VO = {
    text: '',
    _voice: null,
    _n: 0, // id of the current utterance; events from cancelled ones are ignored
    pickVoice() {
      if (this._voice || !window.speechSynthesis) return this._voice;
      const vs = speechSynthesis.getVoices();
      this._voice = vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
      return this._voice;
    },
    /* The voice guide is mandatory: while it plays the voice button shows its progress ring and can't be tapped;
       once it ends the button turns into Replay (Icon button + progress 669:33516 / 669:33529). */
    speak(text) {
      this.text = String(text).replace(/[“”"]/g, '');
      this.stop();
      const n = ++this._n;
      if (!window.speechSynthesis) return this.state('done');
      this.state('playing');
      const u = new SpeechSynthesisUtterance(this.text);
      const v = this.pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      const est = Math.max(1.2, this.text.split(/\s+/).length / 2.6) * 1000;
      const cues = this.cues(this.text);
      let exact = false, t0 = 0;
      u.onstart = () => {
        if (n !== this._n) return;
        t0 = Date.now();
        this._cueT = cues.map((c) => setTimeout(() => !exact && this.cue(c), (est * c.at) / this.text.length));
        this._ringT = setInterval(() => this.ring(Math.min(0.97, (Date.now() - t0) / est)), 120);
      };
      u.onboundary = (e) => {
        if (n !== this._n || (e.name && e.name !== 'word')) return;
        exact = true;
        cues.forEach((c) => { if (!c.done && e.charIndex >= c.at) this.cue(c); });
        this.ring(Math.max(this._p || 0, Math.min(1, e.charIndex / this.text.length)));
      };
      u.onend = u.onerror = () => { if (n !== this._n) return; clearInterval(this._ringT); this.state('done'); };
      this._startT = setTimeout(() => speechSynthesis.speak(u), 120);
    },
    replay() { if (this.text) this.speak(this.text); },
    /* playback ring: forwards only; a reset jumps straight back to 0 (no reverse animation) */
    ring(p, jump) {
      this._p = p;
      document.querySelectorAll('#stage .vo-btn .bar').forEach((c) => {
        if (jump) { c.style.transition = 'none'; c.style.strokeDasharray = '0 200'; void c.getBoundingClientRect(); c.style.transition = ''; return; }
        c.style.strokeDasharray = `${(p * 119.4).toFixed(1)} 200`;
      });
    },
    // 'playing' (ring, not tappable) · 'done' (replay) · 'idle' (no voice-over on this screen)
    state(s) {
      this._state = s;
      if (s !== 'playing') this.ring(0, true);
      document.querySelectorAll('#stage .vo-btn').forEach((b) => {
        b.dataset.vo = s;
        b.disabled = s !== 'done';
        b.setAttribute('aria-label', s === 'done' ? 'Replay voice guide' : 'Voice guide');
      });
    },
    /* CTA cues (from V1): "tap Record" / "Tap Use photo" → highlight that visible button as the word is spoken */
    cues(text) {
      const norm = (s) => s.replace(/[’‘]/g, "'").replace(/^'|'$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const btns = [...document.querySelectorAll('#stage button, #stage [data-go], #stage [data-next]')].filter((b) => {
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height || b.disabled) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && (b === hit || b.contains(hit));
      });
      const out = [];
      for (const m of text.matchAll(/\b[Tt]ap\s+['‘’]?([A-Z][\w'’-]*(?:\s+[A-Za-z][\w'’-]*)?)/g)) {
        const want = norm(m[1]);
        const el = btns.find((b) => {
          const l = norm(b.getAttribute('aria-label') || b.textContent);
          return l && (l === want || l.startsWith(want + ' ') || want.startsWith(l + ' ') || want.split(' ')[0] === l);
        });
        if (el) out.push({ el, at: m.index + m[0].length - m[1].length });
      }
      return out;
    },
    cue(c) {
      c.done = true;
      c.el.classList.remove('vo-cue');
      void c.el.offsetWidth;
      c.el.classList.add('vo-cue');
      setTimeout(() => c.el.classList.remove('vo-cue'), 2400);
    },
    stop() {
      this._n++;
      (this._cueT || []).forEach(clearTimeout);
      clearTimeout(this._startT);
      clearInterval(this._ringT);
      document.querySelectorAll('.vo-cue').forEach((n) => n.classList.remove('vo-cue'));
      if (window.speechSynthesis) speechSynthesis.cancel();
      this.state(this.text && this._state !== 'idle' ? 'done' : 'idle');
    },
    // screens without a voice-over: button shown but inactive
    clear() { this.text = ''; this._state = 'idle'; this.stop(); },
    bind(root) {
      root.querySelectorAll('.vo-btn').forEach((b) => b.addEventListener('click', () => { if (this._state === 'done') this.replay(); }));
      this.state(this._state || 'idle');
    },
  });
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { VO._voice = null; VO.pickVoice(); };

  /* ---------- Image quality heuristics (dark / blurry) ---------- */
  const Quality = (App.Quality = {
    measure(src, W = 160) {
      const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
      if (!sw || !sh) return null;
      const H = Math.max(1, Math.round((sh / sw) * W));
      const c = Quality._c || (Quality._c = document.createElement('canvas'));
      c.width = W; c.height = H;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, W, H);
      const d = g.getImageData(0, 0, W, H).data;
      const L = new Float32Array(W * H); let sum = 0;
      for (let i = 0; i < W * H; i++) { const y = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; L[i] = y; sum += y; }
      let lsum = 0, lsq = 0, n = 0;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x; const lap = L[i - 1] + L[i + 1] + L[i - W] + L[i + W] - 4 * L[i];
        lsum += lap; lsq += lap * lap; n++;
      }
      return { mean: sum / (W * H), sharpness: lsq / n - (lsum / n) ** 2 };
    },
    check(src) {
      try {
        const m = Quality.measure(src);
        if (!m) return { ok: true };
        const dark = m.mean < 40, blurry = m.sharpness < 20;
        return { mean: Math.round(m.mean), sharpness: Math.round(m.sharpness), dark, blurry, ok: !dark && !blurry };
      } catch (e) { return { ok: true }; }
    },
  });

  /* ---------- Camera ---------- */
  const Camera = (App.Camera = {
    stream: null, video: null, error: null, torchOn: false, zoom: 1,
    async start() {
      if (this.stream && this.stream.active) return this.stream;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.error = 'Camera is not available in this browser (needs HTTPS).';
        throw new Error(this.error);
      }
      const video = { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      try { this.stream = await navigator.mediaDevices.getUserMedia({ video, audio: true }); }
      catch (e) {
        try { this.stream = await navigator.mediaDevices.getUserMedia({ video }); } // mic denied: photos still work
        catch (e2) { this.error = e2.message || String(e2); throw e2; }
      }
      this.error = null;
      if (!this.video) {
        const v = document.createElement('video');
        v.setAttribute('playsinline', ''); v.muted = true; v.autoplay = true; v.className = 'cam-video';
        this.video = v;
      }
      this.video.srcObject = this.stream;
      try { await this.video.play(); } catch (e) {}
      return this.stream;
    },
    hasAudio() { return !!(this.stream && this.stream.getAudioTracks().length); },
    track() { return this.stream && this.stream.getVideoTracks()[0]; },
    canTorch() { const t = this.track(); try { return !!(t && t.getCapabilities && t.getCapabilities().torch); } catch (e) { return false; } },
    async torch(on) {
      const t = this.track();
      this.torchOn = !!on;
      if (t && this.canTorch()) { try { await t.applyConstraints({ advanced: [{ torch: !!on }] }); } catch (e) {} }
      return this.torchOn;
    },
    /* Live preview into a .cam-slot; falls back to the screen's sample still (so the flow works without a camera). */
    async attach(slot, { fallbackImg, crop } = {}) {
      this.source = null; this.zoom = 1;
      try {
        await this.start();
        slot.querySelectorAll('.cam-fallback').forEach((n) => n.remove());
        slot.prepend(this.video);
        try { await this.video.play(); } catch (e) {}
        this.source = this.video;
        return true;
      } catch (e) {
        if (fallbackImg && !slot.querySelector('.cam-fallback')) {
          const img = document.createElement('img');
          img.className = 'cam-fallback' + (crop ? ' crop-' + crop : ''); img.src = fallbackImg; img.alt = '';
          if (crop) img.dataset.crop = crop; // Figma crops one wide photo into two angles (75% left / right)
          slot.prepend(img);
          this.source = img;
        }
        slot.classList.add('no-cam');
        return false;
      }
    },
    /* Digital zoom (1×/2×/3×): scales the preview; snap() crops the same region */
    setZoom(slot, z) {
      this.zoom = z;
      slot.querySelectorAll('video, .cam-fallback').forEach((m) => { m.style.transform = (m === this.video && App.rot ? 'translate(-50%, -50%) rotate(-90deg) ' : '') + `scale(${z})`; });
    },
    /* Upright frame of what's on screen (rotation-lock mode turns the camera frame back upright) */
    frame() {
      const s = this.source;
      if (!s) return null;
      let w = s.videoWidth || s.naturalWidth, h = s.videoHeight || s.naturalHeight;
      if (!w || !h) return null;
      const c = document.createElement('canvas');
      if (s.dataset && s.dataset.crop) {
        c.width = Math.round(w * 0.75); c.height = Math.round(h * 0.75);
        c.getContext('2d').drawImage(s, s.dataset.crop === 'r' ? w * 0.25 : 0, h * 0.125, c.width, c.height, 0, 0, c.width, c.height);
        return c;
      }
      const turn = s === this.video && App.rot === 'cw';
      c.width = turn ? h : w; c.height = turn ? w : h;
      const g = c.getContext('2d');
      if (turn) { g.translate(0, c.height); g.rotate(-Math.PI / 2); }
      g.drawImage(s, 0, 0);
      return c;
    },
    /* Grab the region under cropEl (object-fit: cover math, in stage units so the stage transform doesn't matter) */
    async snap(slot, cropEl) {
      const f = this.frame();
      if (!f) throw new Error('Camera not ready');
      const sw = slot.offsetWidth, sh = slot.offsetHeight;
      const s = Math.max(sw / f.width, sh / f.height) * (this.zoom || 1);
      const ox = (sw - f.width * s) / 2, oy = (sh - f.height * s) / 2;
      const r = cropEl ? { x: cropEl.offsetLeft - slot.offsetLeft, y: cropEl.offsetTop - slot.offsetTop, w: cropEl.offsetWidth, h: cropEl.offsetHeight } : { x: 0, y: 0, w: sw, h: sh };
      let sx = (r.x - ox) / s, sy = (r.y - oy) / s, cw = r.w / s, ch = r.h / s;
      sx = Math.max(0, sx); sy = Math.max(0, sy); cw = Math.min(f.width - sx, cw); ch = Math.min(f.height - sy, ch);
      const cv = document.createElement('canvas');
      cv.width = Math.round(cw); cv.height = Math.round(ch);
      cv.getContext('2d').drawImage(f, sx, sy, cw, ch, 0, 0, cv.width, cv.height);
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9));
      return { kind: 'photo', blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height, quality: Quality.check(cv), at: Date.now(), geo: App.state.location, sample: this.source !== this.video };
    },
    startRecording() {
      if (!this.stream) throw new Error('no camera');
      const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
      const rec = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      rec.start(250);
      this._rec = { rec, chunks, t0: Date.now(), mimeType: rec.mimeType || mimeType || 'video/webm' };
    },
    stopRecording() {
      const r = this._rec;
      if (!r) return Promise.resolve(null);
      this._rec = null;
      return new Promise((res) => {
        r.rec.onstop = () => {
          const blob = new Blob(r.chunks, { type: r.mimeType });
          res({ kind: 'video', blob, url: URL.createObjectURL(blob), duration: (Date.now() - r.t0) / 1000, at: Date.now(), quality: { ok: true } });
        };
        r.rec.stop();
      });
    },
    isRecording() { return !!this._rec; },
  });

  /* ---------- Background uploads (simulated): every capture starts uploading as soon as it is saved ---------- */
  const Uploads = (App.Uploads = {
    add(cap) { if (cap && !cap.up) cap.up = { t0: Date.now(), dur: 2500 + Math.random() * 4500 }; },
    progress(cap) { if (!cap) return 1; this.add(cap); if (cap.up.failed) return cap.up.at; return Math.min(1, (Date.now() - cap.up.t0) / cap.up.dur); },
    done(cap) { return this.progress(cap) >= 1; },
    failed(cap) { return !!(cap && cap.up && cap.up.failed); },
    fail(cap) { this.add(cap); cap.up = { t0: Date.now(), dur: 1e9, failed: true, at: 0.2 + Math.random() * 0.5 }; },
    retry(cap) { cap.up = { t0: Date.now(), dur: 2500 + Math.random() * 3500 }; },
  });

  /* ---------- Permissions ---------- */
  App.grantedPermissions = async function () {
    const names = { camera: 'camera', microphone: 'microphone', location: 'geolocation' };
    const out = {};
    await Promise.all(Object.entries(names).map(async ([k, name]) => {
      try { out[k] = (await navigator.permissions.query({ name })).state; } catch (e) { out[k] = 'unknown'; }
    }));
    return out; // 'granted' | 'denied' | 'prompt' | 'unknown'
  };
  App.requestPermissions = async function () {
    const res = { camera: false, microphone: false, location: false };
    try { await Camera.start(); res.camera = true; res.microphone = Camera.hasAudio(); } catch (e) {}
    res.location = await new Promise((r) => {
      if (!navigator.geolocation) return r(false);
      navigator.geolocation.getCurrentPosition(
        (p) => { App.state.location = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; r(true); },
        () => r(false), { enableHighAccuracy: true, timeout: 15000 });
    });
    App.state.permissions = res;
    return res;
  };
})();
