/* Core runtime: router, stage scaling, state, voice-over, camera, recording, quality checks. */
(function () {
  const params = new URLSearchParams(location.search);

  const App = (window.App = {
    screens: {},
    order: [],
    current: null,
    cleanup: null,
    config: {
      optional: params.get('optional') !== '0', // ?optional=0 → mandatory-only flow
      reg: 'KA 01 AB 1234',
    },
    state: {
      captures: {}, // key -> {kind:'photo'|'video', url, blob, w, h, duration, quality:{dark,blurry,ok}}
      damages: [], // array of captures
      rcType: null, // 'paper' | 'card'
      permissions: {},
      location: null,
      description: '',
      // optional capture flows picked on the Items screen (?optional=0 starts with all off)
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
  function deviceOrientation() {
    return innerWidth > innerHeight ? 'landscape' : 'portrait';
  }

  /* ---------- render ---------- */
  const stage = document.getElementById('stage');
  let lastShown = null;

  function currentId() {
    const m = location.hash.match(/^#\/([^?]+)/);
    return m ? decodeURIComponent(m[1]) : App.startId;
  }

  function ctxFor(def) {
    return {
      def, state: App.state, config: App.config, go: App.go, back: App.back,
      C: window.C, Camera: App.Camera, VO: App.VO,
    };
  }

  function render() {
    const framed = isFramed();
    document.documentElement.classList.toggle('framed', framed);
    document.documentElement.classList.toggle('shot', !!params.get('shot'));
    document.documentElement.style.setProperty('--status-h', framed ? '34px' : '0px');

    let id = currentId();
    let def = App.screens[id];
    if (!def) { id = App.startId; def = App.screens[id]; }
    if (!def) return;

    // orientation guard on real phones: show the designed rotate prompt
    let shown = def;
    if (!framed && def.orientation !== deviceOrientation() && def.rotate && App.screens[def.rotate]) {
      shown = App.screens[def.rotate];
    }

    const phoneLand = !framed && shown.orientation === 'landscape';
    document.documentElement.classList.toggle('phone-land', phoneLand);
    if (phoneLand) document.documentElement.style.setProperty('--status-h', '34px');
    layout(shown, framed);
    if (lastShown === shown && App.current === id) return; // only a resize
    if (App.cleanup) { try { App.cleanup(); } catch (e) { console.error(e); } App.cleanup = null; }
    App.current = id;
    lastShown = shown;

    const ctx = ctxFor(shown);
    const el = document.createElement('div');
    el.className = 'screen ' + (shown.scroll ? 'scroll ' : '') + (shown.className || '');
    el.dataset.screen = shown.id;
    el.dataset.o = shown.orientation;
    el.innerHTML = shown.render(ctx);
    stage.replaceChildren(el);
    if (shown.scroll) el.scrollTop = 0;
    App.cleanup = shown.mount ? shown.mount(el, ctx) || null : null;
    const vo = typeof shown.vo === 'function' ? shown.vo(ctx) : shown.vo;
    if (vo) App.VO.speak(vo); else App.VO.stop();
    // screens without a voice-over: replay / mute buttons shown disabled
    el.querySelectorAll('[data-action^="vo-"]').forEach((b) => { b.disabled = !vo; });
    App.VO.bind(el);
    document.body.style.background = framed ? '' : getComputedStyle(el).backgroundColor;
  }

  function layout(def, framed) {
    const land = def.orientation === 'landscape';
    let W = land ? 850 : 390;
    const H = land ? 390 : 850;
    let scale, h, left = 0, top = 0;
    if (params.get('shot')) {
      scale = 1; h = H;
    } else if (framed) {
      // desktop: the chosen device's screen (device-frame.js), fitted to the window
      ({ W, h, scale, left, top } = DeviceFrame.fit(land, W, H));
      DeviceFrame.mount();
    } else if (land) {
      // landscape phones: fit the 850×356 content area (390 minus status bar), then grow the stage to fill the
      // whole screen edge to edge; the 34px status-bar slot stays in layout (so Figma offsets hold) but off-screen
      scale = Math.min(innerWidth / W, innerHeight / 356);
      W = innerWidth / scale;
      h = innerHeight / scale + 34;
      top = -34 * scale;
    } else {
      scale = innerWidth / W;
      h = innerHeight / scale;
    }
    stage.style.width = W + 'px';
    stage.style.height = h + 'px';
    stage.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    App.scale = scale;
  }

  addEventListener('hashchange', render);
  addEventListener('resize', () => requestAnimationFrame(render));
  addEventListener('orientationchange', () => setTimeout(render, 150));

  /* Return-to support: Review screen sets App.state.returnTo before sending the user to re-capture an item;
     every "Next" after a capture goes through App.nextAfter(defaultId) so it comes back to Review. */
  App.nextAfter = function (defaultId) {
    const r = App.state.returnTo;
    if (r) { App.state.returnTo = null; return r; }
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
    // every load/refresh restarts the flow (the #/__index review helper is kept)
    if (currentId() !== '__index') history.replaceState(null, '', '#/' + startId);
    render();
  };

  /* ---------- pull to refresh (touch) ---------- */
  const ptr = document.createElement('div');
  ptr.className = 'ptr';
  ptr.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(ptr);
  const PTR_MAX = 120, PTR_TRIGGER = 80;
  let ptrY0 = null, ptrDy = 0;
  function atTop(node) {
    for (; node && node !== document.body; node = node.parentElement) if (node.scrollTop > 0) return false;
    return true;
  }
  function ptrSet(dy, animate) {
    ptr.style.transition = animate ? 'transform .2s, opacity .2s' : 'none';
    ptr.style.opacity = Math.min(dy / PTR_TRIGGER, 1);
    ptr.style.transform = `translate(-50%, ${dy - 48}px) rotate(${dy * 3}deg)`;
    ptr.classList.toggle('ready', dy >= PTR_TRIGGER);
  }
  addEventListener('touchstart', (e) => {
    ptrY0 = e.touches.length === 1 && atTop(e.target) ? e.touches[0].clientY : null;
    ptrDy = 0;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (ptrY0 === null) return;
    if (e.touches.length > 1) { ptrY0 = null; ptrSet(0, true); return; }
    ptrDy = Math.min(Math.max(e.touches[0].clientY - ptrY0, 0) * 0.5, PTR_MAX);
    ptrSet(ptrDy);
  }, { passive: true });
  addEventListener('touchend', () => {
    if (ptrY0 === null) return;
    ptrY0 = null;
    if (ptrDy >= PTR_TRIGGER) { ptr.classList.add('spin'); location.reload(); }
    else ptrSet(0, true);
  });
  App.rerender = () => { lastShown = null; render(); };

  /* ---------- helpers ---------- */
  App.asset = (p) => 'assets/' + p;
  App.capture = (key) => App.state.captures[key] || null;

  /* ---------- Voice-over (speechSynthesis) ---------- */
  const VO = (App.VO = {
    muted: false,
    progress: 0,
    text: '',
    _raf: 0,
    _voice: null,
    pickVoice() {
      if (this._voice || !window.speechSynthesis) return this._voice;
      const vs = speechSynthesis.getVoices();
      this._voice = vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
      return this._voice;
    },
    speak(text) {
      this.text = String(text).replace(/[“”"]/g, '');
      this.stop();
      if (this.muted || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(this.text);
      const v = this.pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.rate = 1;
      const est = Math.max(1.2, this.text.split(/\s+/).length / 2.6) * 1000;
      const t0 = performance.now();
      const tick = () => {
        this.setProgress(Math.min(0.97, (performance.now() - t0) / est));
        this._raf = requestAnimationFrame(tick);
      };
      const cues = this.cues(this.text);
      let exact = false;
      u.onstart = () => {
        cancelAnimationFrame(this._raf); tick();
        // fallback for voices without word boundaries: estimate when each cue word is reached
        this._cueT = cues.map((c) => setTimeout(() => !exact && this.cue(c), (est * c.at) / this.text.length));
      };
      u.onboundary = (e) => {
        if (e.name && e.name !== 'word') return;
        exact = true;
        cues.forEach((c) => { if (!c.done && e.charIndex >= c.at) this.cue(c); });
      };
      u.onend = u.onerror = () => { cancelAnimationFrame(this._raf); this.setProgress(1); };
      setTimeout(() => speechSynthesis.speak(u), 120);
    },
    /* CTA cues: "tap Capture" / "Tap 'I'm Ready'" → highlight the visible button with that label as the word is spoken */
    cues(text) {
      const norm = (s) => s.replace(/[’‘]/g, "'").replace(/^'|'$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const btns = [...document.querySelectorAll('#stage button, #stage [data-go], #stage [data-next]')].filter((b) => {
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height || b.disabled) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && (b === hit || b.contains(hit)); // not hidden under a modal
      });
      const out = [];
      for (const m of text.matchAll(/\b[Tt]ap\s+['‘’]?([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)*)/g)) {
        const want = norm(m[1]);
        const el = btns.find((b) => {
          const l = norm(b.getAttribute('aria-label') || b.textContent);
          return l && (l === want || l.startsWith(want + ' ') || want.startsWith(l + ' '));
        });
        if (el) out.push({ el, at: m.index + m[0].length - m[1].length });
      }
      return out;
    },
    cue(c) {
      c.done = true;
      c.el.classList.remove('vo-cue');
      void c.el.offsetWidth; // restart the animation
      c.el.classList.add('vo-cue');
      setTimeout(() => c.el.classList.remove('vo-cue'), 2400);
    },
    stop() {
      (this._cueT || []).forEach(clearTimeout);
      document.querySelectorAll('.vo-cue').forEach((n) => n.classList.remove('vo-cue'));
      cancelAnimationFrame(this._raf);
      if (window.speechSynthesis) speechSynthesis.cancel();
      this.setProgress(0);
    },
    replay() { if (this.muted) this.toggle(); else if (this.text) this.speak(this.text); },
    toggle() {
      this.muted = !this.muted;
      if (this.muted) this.stop(); else if (this.text) this.speak(this.text);
      document.querySelectorAll('[data-action="vo-toggle"]').forEach((b) => b.classList.toggle('muted', this.muted));
    },
    setProgress(p) {
      this.progress = p;
      const C = 2 * Math.PI * 19.2;
      document.querySelectorAll('.icon-btn .ring .bar').forEach((c) => {
        c.style.strokeDasharray = `${C * p} ${C}`;
      });
    },
    bind(root) {
      root.querySelectorAll('[data-action="vo-toggle"]').forEach((b) => {
        b.classList.toggle('muted', this.muted);
        b.addEventListener('click', () => this.toggle());
      });
      root.querySelectorAll('[data-action="vo-replay"]').forEach((b) => b.addEventListener('click', () => this.replay()));
      this.setProgress(this.progress);
    },
  });
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { VO._voice = null; VO.pickVoice(); };

  /* ---------- Camera ---------- */
  const Camera = (App.Camera = {
    stream: null,
    video: null,
    error: null,
    zoom: 1,
    hwZoom: null,
    async start() {
      if (this.stream && this.stream.active) return this.stream;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.error = 'Camera is not available in this browser (needs HTTPS).';
        throw new Error(this.error);
      }
      const video = { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      } catch (e) {
        // retry without audio (mic denied) so photos still work
        try { this.stream = await navigator.mediaDevices.getUserMedia({ video }); }
        catch (e2) { this.error = e2.message || String(e2); throw e2; }
      }
      this.error = null;
      if (!this.video) {
        const v = document.createElement('video');
        v.setAttribute('playsinline', ''); v.muted = true; v.autoplay = true;
        this.video = v;
      }
      this.video.srcObject = this.stream;
      try { await this.video.play(); } catch (e) {}
      const track = this.stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      this.hwZoom = caps.zoom ? caps.zoom : null;
      return this.stream;
    },
    hasAudio() { return !!(this.stream && this.stream.getAudioTracks().length); },
    stop() {
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    },
    /* Put the live preview into a .cam-slot. Returns a promise. Shows a fallback (file picker) if the camera fails. */
    async attach(slot, { fallbackImg, accept = 'image/*' } = {}) {
      try {
        await this.start();
        slot.querySelectorAll('.cam-fallback').forEach((n) => n.remove());
        slot.prepend(this.video);
        try { await this.video.play(); } catch (e) {}
        this.setZoom(this.zoom);
        return true;
      } catch (e) {
        if (fallbackImg && !slot.querySelector('.cam-fallback')) {
          const img = document.createElement('img');
          img.className = 'cam-fallback'; img.src = fallbackImg; img.alt = '';
          slot.prepend(img);
        }
        const msg = document.createElement('div');
        msg.className = 'cam-error';
        msg.innerHTML = `Camera unavailable: ${String(e.message || e).replace(/</g, '&lt;')}<br><label>Open phone camera<input type="file" accept="${accept}" capture="environment" hidden></label>`;
        slot.parentElement.appendChild(msg);
        return false;
      }
    },
    setZoom(z) {
      this.zoom = z;
      if (!this.video) return;
      const track = this.stream && this.stream.getVideoTracks()[0];
      if (this.hwZoom && track) {
        const val = Math.min(this.hwZoom.max, Math.max(this.hwZoom.min, z));
        track.applyConstraints({ advanced: [{ zoom: val }] }).catch(() => {});
        this.video.style.transform = '';
        this._digital = 1;
      } else {
        this.video.style.transform = z > 1 ? `scale(${z})` : '';
        this._digital = z;
      }
    },
    /* Grab the frame region under `cropEl` (defaults to whole slot). Returns capture object. */
    async snap(slot, cropEl) {
      const v = this.video;
      if (!v || !v.videoWidth) throw new Error('Camera not ready');
      const vw = v.videoWidth, vh = v.videoHeight;
      const sr = slot.getBoundingClientRect();
      const cr = (cropEl || slot).getBoundingClientRect();
      const s = Math.max(sr.width / vw, sr.height / vh) * (this._digital || 1);
      const dw = vw * s, dh = vh * s;
      const ox = sr.left + (sr.width - dw) / 2, oy = sr.top + (sr.height - dh) / 2;
      let sx = (cr.left - ox) / s, sy = (cr.top - oy) / s, sw = cr.width / s, sh = cr.height / s;
      sx = Math.max(0, sx); sy = Math.max(0, sy); sw = Math.min(vw - sx, sw); sh = Math.min(vh - sy, sh);
      const cv = document.createElement('canvas');
      cv.width = Math.round(sw); cv.height = Math.round(sh);
      cv.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
      return { kind: 'photo', blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height, quality: Quality.check(cv), at: Date.now(), geo: App.state.location };
    },
    /* Photo from <input type=file capture> fallback */
    async fromFile(file) {
      const url = URL.createObjectURL(file);
      if (/^video\//.test(file.type)) {
        const v = document.createElement('video'); v.src = url; v.muted = true;
        await new Promise((r) => { v.onloadedmetadata = r; v.onerror = r; });
        return { kind: 'video', blob: file, url, w: v.videoWidth, h: v.videoHeight, duration: v.duration || 0, quality: { ok: true }, at: Date.now() };
      }
      const img = new Image(); img.src = url; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      return { kind: 'photo', blob: file, url, w: cv.width, h: cv.height, quality: Quality.check(cv), at: Date.now() };
    },
    /* Video recording (with audio when granted) */
    startRecording() {
      if (!this.stream) throw new Error('Camera not started');
      const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
      const rec = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      const t0 = Date.now();
      rec.start(250);
      this._rec = { rec, chunks, t0, mimeType: rec.mimeType || mimeType || 'video/webm' };
      return t0;
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

  /* ---------- Image quality heuristics (dark / blurry) ---------- */
  const Quality = (App.Quality = {
    check(canvas) {
      try {
        const W = 160, H = Math.max(1, Math.round((canvas.height / canvas.width) * W));
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d'); g.drawImage(canvas, 0, 0, W, H);
        const d = g.getImageData(0, 0, W, H).data;
        const L = new Float32Array(W * H); let sum = 0;
        for (let i = 0; i < W * H; i++) { const y = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; L[i] = y; sum += y; }
        const mean = sum / (W * H);
        let lsum = 0, lsq = 0, n = 0;
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x; const lap = L[i - 1] + L[i + 1] + L[i - W] + L[i + W] - 4 * L[i];
          lsum += lap; lsq += lap * lap; n++;
        }
        const variance = lsq / n - (lsum / n) ** 2;
        const dark = mean < 40, blurry = variance < 20;
        return { mean: Math.round(mean), sharpness: Math.round(variance), dark, blurry, ok: !dark && !blurry };
      } catch (e) { return { ok: true }; }
    },
  });

  /* ---------- Permissions ---------- */
  // Already-granted permissions, without prompting (Permissions API; unsupported names count as not granted)
  App.grantedPermissions = async function () {
    const names = { camera: 'camera', microphone: 'microphone', location: 'geolocation' };
    const out = {};
    await Promise.all(Object.entries(names).map(async ([k, name]) => {
      try { out[k] = (await navigator.permissions.query({ name })).state === 'granted'; } catch (e) { out[k] = false; }
    }));
    return out;
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
