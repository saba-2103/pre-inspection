/* Group F — Review & Submit. Figma: Review (Uploading / Recapture / Failed / Reuploading / Uploaded), Previews,
   Accident Description, Success. Upload is simulated (no backend) but behaves realistically:
   per-item progress, offline → Failed + Retry, quality-failed captures → Re-capture. */
(function () {
  const { A, esc } = C;
  const F = (p) => A('f/' + p);

  /* ---------- catalogue ---------- */
  const V360 = ['Front', 'Front Right', 'Right Half 1', 'Right Half 2', 'Rear Right', 'Rear', 'Rear Left', 'Left Half 1', 'Left Half 2', 'Front Left'];
  // [key, label, section] in the design's order
  const LEAVES = [
    ['rcPaper', 'RC', 'interior'], ['rcFront', 'RC (Front)', 'interior'], ['rcBack', 'RC (Back)', 'interior'],
    ['odometer', 'Odometer', 'interior'], ['windshield', 'Windshield', 'interior'], ['roof', 'Rooftop Glass', 'interior'],
    ['vin', 'VIN', 'exterior'], ['engine', 'Engine Bay', 'exterior'],
  ];
  const CAP_SCREEN = {
    rcPaper: 'rc-paper-capture', rcFront: 'rc-front-capture', rcBack: 'rc-back-capture', odometer: 'odo-capture',
    windshield: 'ws-record', roof: 'roof-record', vin: 'vin-capture', engine: 'engine-record',
  };
  const GROUPS = { v360: '360° Walkaround', damages: 'Damages' };
  const ATTN_GROUPS = { v360: '360 Walkaround', damages: 'Damages' };

  /* Figma sample data — used when Review is opened with no captures (deep link) */
  const smp = (img, kind = 'photo', duration) => ({ kind, url: F(img), duration, sample: true, quality: { ok: true } });
  const SAMPLE = {
    captures: Object.assign(
      { rcFront: smp('rc-front.png'), rcBack: smp('rc-back.png'), odometer: smp('odometer.png'), windshield: smp('windshield.png', 'video', 52), roof: smp('rooftop.png', 'video', 21), vin: smp('vin.png') },
      Object.fromEntries(V360.map((_, i) => ['v360_' + (i + 1), smp('v360-' + (i + 1) + '.png')]))),
    damages: Array.from({ length: 10 }, (_, i) => smp('dmg-' + ((i % 3) + 1) + '.png')),
  };
  const LARGE = { odometer: F('odometer-lg.png') }; // larger sample crops for the preview modal

  /* Design states (deep links: #/review?state=uploading|recapture|failed|reuploading|uploaded) */
  const FROZEN = {
    uploading: { windshield: 'uploading', roof: 'uploading' },
    recapture: { odometer: 'error', v360_5: 'error', windshield: 'uploading', roof: 'uploading' },
    failed: { windshield: 'failed' },
    reuploading: { windshield: 'uploading' },
    uploaded: {},
  };
  const VO_TEXT = {
    uploading: '“Uploading. Please keep this page open.”',
    reuploading: '“Uploading. Please keep this page open.”',
    recapture: '“Some photos are blurry or too dark. Tap Re-capture to fix them.”',
    failed: '"Upload failed. Check your internet and tap Retry."',
    uploaded: '"All uploaded. Tap Next."',
  };

  const hashParam = (k) => new URLSearchParams((location.hash.split('?')[1] || '')).get(k);
  const frozenState = () => { const s = hashParam('state'); return FROZEN[s] ? s : null; };

  /* ---------- model ---------- */
  function model(frozen) {
    const real = Object.keys(App.state.captures).length > 0 || App.state.damages.length > 0;
    const caps = real ? App.state.captures : SAMPLE.captures;
    const dmg = real ? App.state.damages : SAMPLE.damages;
    if (!real && !frozen) initSample();
    const items = [];
    // sample data follows the Items screen too (optional items switched off are not listed)
    LEAVES.forEach(([key, label, sec]) => caps[key] && (real || !(key in App.state.items) || C.has(key)) && items.push({ key, label, sec, cap: caps[key] }));
    V360.forEach((label, i) => { const key = 'v360_' + (i + 1); if (caps[key]) items.push({ key, label, sec: 'exterior', group: 'v360', cap: caps[key] }); });
    dmg.forEach((cap, i) => items.push({ key: 'dmg_' + i, label: 'Damage ' + (i + 1), sec: 'exterior', group: 'damages', cap }));
    const m = { items, sample: !real, frozen };
    m.status = (it) => (frozen ? FROZEN[frozen][it.key] || 'done' : st(it.cap).status);
    m.progress = (it) => (frozen ? null : st(it.cap).progress);
    const c = { done: 0, error: 0, failed: 0, busy: 0 };
    items.forEach((it) => { const s = m.status(it); if (s === 'done') c.done++; else if (s === 'error') c.error++; else if (s === 'failed') c.failed++; else c.busy++; });
    m.count = c;
    m.state = frozen || (c.error ? 'recapture' : c.failed ? 'failed' : c.busy ? (Sim.retried ? 'reuploading' : 'uploading') : 'uploaded');
    return m;
  }

  /* ---------- upload simulation (per capture object, survives screen changes) ---------- */
  const ST = new WeakMap();
  const Sim = { timer: null, subs: new Set(), retried: false, sampleInit: false };
  function st(cap) {
    let s = ST.get(cap);
    if (!s) {
      s = cap.quality && cap.quality.ok === false ? { status: 'error', progress: 0 } : { status: 'queued', progress: 0 };
      ST.set(cap, s);
    }
    return s;
  }
  function uploadMs(cap) {
    const mb = cap.blob ? cap.blob.size / 1e6 : 0;
    const base = cap.kind === 'video' ? 2600 : 1100;
    return Math.min(9000, base + mb * 900 + Math.random() * 1400);
  }
  function initSample() {
    if (Sim.sampleInit) return;
    Sim.sampleInit = true;
    // open as in the design: 24/26 done, Windshield + Rooftop still uploading
    const all = [...Object.values(SAMPLE.captures), ...SAMPLE.damages];
    all.forEach((c) => ST.set(c, { status: 'done', progress: 1 }));
    ST.set(SAMPLE.captures.windshield, { status: 'uploading', progress: 0.3, dur: 4200, t0: performance.now() });
    ST.set(SAMPLE.captures.roof, { status: 'uploading', progress: 0.55, dur: 3600, t0: performance.now() });
  }
  function ensureSim() {
    const m = model(null);
    if (m.sample) initSample();
    m.items.forEach((it) => st(it.cap));
    if (!Sim.timer && m.items.some((it) => ['queued', 'uploading'].includes(st(it.cap).status))) Sim.timer = setInterval(tick, 100);
  }
  function tick() {
    const { items } = model(null);
    const online = navigator.onLine !== false;
    const now = performance.now();
    let changed = false, active = 0;
    // offline: a stalled upload fails after a moment, and the rest of the queue fails with it
    if (!online && items.some((it) => st(it.cap).status === 'uploading' && now - (st(it.cap).t0 || 0) > 900)) {
      items.forEach((it) => { const s = st(it.cap); if (s.status === 'uploading' || s.status === 'queued') { s.status = 'failed'; changed = true; } });
    }
    for (const it of items) {
      const s = st(it.cap);
      if (s.status !== 'uploading') continue;
      if (online) s.progress = Math.min(1, s.progress + 100 / s.dur);
      if (s.progress >= 1) { s.status = 'done'; changed = true; } else active++;
    }
    for (const it of items) {
      if (active >= 3) break;
      const s = st(it.cap);
      if (s.status === 'queued') { Object.assign(s, { status: 'uploading', progress: 0, dur: uploadMs(it.cap), t0: now }); active++; changed = true; }
    }
    Sim.subs.forEach((fn) => fn(changed));
    if (!items.some((it) => ['queued', 'uploading'].includes(st(it.cap).status))) { clearInterval(Sim.timer); Sim.timer = null; }
  }
  function retry() {
    model(null).items.forEach((it) => { const s = st(it.cap); if (s.status === 'failed') Object.assign(s, { status: 'queued', progress: 0 }); });
    Sim.retried = true;
    ensureSim();
    Sim.subs.forEach((fn) => fn(true));
  }
  if (typeof addEventListener === 'function') addEventListener('offline', () => Sim.timer && tick());

  /* video first-frame posters (cached per capture) */
  const POSTER = new WeakMap();
  function poster(cap) {
    if (POSTER.has(cap)) return POSTER.get(cap);
    POSTER.set(cap, null);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = cap.url;
    const grab = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = v.videoWidth; cv.height = v.videoHeight;
        if (!cv.width) return;
        cv.getContext('2d').drawImage(v, 0, 0);
        cv.toBlob((b) => { if (b) { POSTER.set(cap, URL.createObjectURL(b)); Sim.subs.forEach((fn) => fn(true)); } }, 'image/jpeg', 0.85);
      } catch (e) {}
    };
    v.addEventListener('loadeddata', () => { try { v.currentTime = 0.1; } catch (e) { grab(); } }, { once: true });
    v.addEventListener('seeked', grab, { once: true });
    return null;
  }

  /* ---------- markup ---------- */
  const CHIP = {
    done: ['st-done', 'Done'], uploading: ['st-uploading', 'Uploading...'], queued: ['st-uploading', 'Uploading...'],
    error: ['st-error', 'Error'], failed: ['st-failed', 'Failed'],
  };
  // status icons are inlined as data URIs once loaded, so the Failed chip still shows its icon while offline
  const ICON = {};
  ['st-done', 'st-uploading', 'st-error', 'st-failed'].forEach((n) => {
    fetch(F(n + '.svg')).then((r) => r.text()).then((t) => { ICON[n] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t); }).catch(() => {});
  });
  const chip = (s) => `<div class="chip ${s}"><img src="${ICON[CHIP[s][0]] || F(CHIP[s][0] + '.svg')}" alt=""><span>${CHIP[s][1]}</span></div>`;
  const fmtDur = (d) => { d = Math.max(0, Math.round(d || 0)); return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}s`; };
  const isVideo = (cap) => cap.kind === 'video';

  function media(cap) {
    if (cap.sample || !isVideo(cap)) return `<img src="${cap.url}" alt="">`;
    const p = poster(cap);
    return p ? `<img src="${p}" alt="">` : `<video src="${cap.url}#t=0.1" muted playsinline preload="metadata"></video>`;
  }
  const playIcon = `<span class="play"><img src="${F('play.svg')}" alt=""></span>`;
  const prog = (m, it) => {
    const p = m.progress(it);
    return m.status(it) === 'uploading' && p != null ? `<div class="prog"><i data-prog="${it.key}" style="width:${Math.round(p * 100)}%"></i></div>` : '';
  };
  const recapBtn = (it) => `<button class="btn-sm" data-recap="${it.key}">Re-capture</button>`;

  function leafCard(m, it, attn) {
    const s = m.status(it);
    const v = isVideo(it.cap);
    return `
      <div class="card" data-preview="${it.key}">
        <div class="thumb ${s === 'error' ? 'blur' : ''}">${media(it.cap)}${v ? playIcon : ''}${prog(m, it)}</div>
        <div class="info">
          <div class="top"><div class="name-row"><p class="name">${esc(it.label)}</p></div>${chip(s)}</div>
          ${s === 'error' ? `<div class="cta">${recapBtn(it)}</div>` : v ? `<p class="sub">${fmtDur(it.cap.duration)}</p>` : ''}
        </div>
      </div>`;
  }
  function row(m, it, attn) {
    const s = m.status(it);
    return `
      <div class="row" data-preview="${it.key}">
        <div class="rthumb ${s === 'error' ? 'blur' : ''}">${media(it.cap)}${isVideo(it.cap) ? playIcon : ''}${prog(m, it)}</div>
        <div class="rinfo"><p class="rname">${esc(it.label)}</p><div class="rbot">${chip(s)}${s === 'error' ? `<div class="cta">${recapBtn(it)}</div>` : ''}</div></div>
      </div>`;
  }
  const groupStatus = (m, list) => {
    const ss = list.map(m.status);
    return ss.includes('error') ? 'error' : ss.includes('failed') ? 'failed' : ss.some((s) => s === 'uploading' || s === 'queued') ? 'uploading' : 'done';
  };
  function groupCard(m, g, list) {
    if (isOpen(m, g)) {
      return `
        <div class="group">
          <div class="ghead" data-toggle="${g}"><p class="name">${GROUPS[g]}</p><img src="${F('arrow-up.svg')}" alt=""></div>
          <div class="rows">${list.map((it) => row(m, it, false)).join('')}</div>
        </div>`;
    }
    const tiles = list.slice(0, 4);
    const more = list.length - 3;
    const done = list.filter((it) => m.status(it) === 'done').length;
    return `
      <div class="card gcard" data-toggle="${g}">
        <div class="grid">${tiles.map((it, i) => `<div class="tile">${media(it.cap)}${i === 3 && more > 0 ? `<div class="more">+${more}</div>` : ''}</div>`).join('')}</div>
        <div class="info">
          <div class="top"><div class="name-row"><p class="name">${GROUPS[g]}</p><img src="${F('arrow-down.svg')}" alt=""></div>${chip(groupStatus(m, list))}</div>
          ${g === 'damages' ? `<p class="sub">${done}/${list.length} Uploaded</p>` : ''}
        </div>
      </div>`;
  }
  const Open = { v360: null, damages: null }; // null = follow the design default
  const isOpen = (m, g) => (Open[g] != null ? Open[g] : g === 'v360' && m.state === 'uploading');

  const section = (title, html, cls = '') => `
    <div class="section ${cls}">
      <div class="heading"><i></i><p>${title}</p><i></i></div>
      <div class="list">${html}</div>
    </div>`;

  function sectionItems(m, sec) {
    const out = [];
    const leaves = m.items.filter((it) => it.sec === sec && !it.group && m.status(it) !== 'failed');
    leaves.forEach((it) => out.push(leafCard(m, it, false)));
    if (sec === 'exterior') {
      ['v360', 'damages'].forEach((g) => { const list = m.items.filter((it) => it.group === g); if (list.length) out.push(groupCard(m, g, list)); });
    }
    return out.join('');
  }
  function attention(m) {
    const bad = (it) => ['error', 'failed'].includes(m.status(it));
    const out = m.items.filter((it) => !it.group && bad(it)).map((it) => leafCard(m, it, true));
    ['v360', 'damages'].forEach((g) => {
      const list = m.items.filter((it) => it.group === g && bad(it));
      if (list.length) out.push(`
        <div class="group attn">
          <div class="ghead"><p class="name">${ATTN_GROUPS[g]}</p><img src="${F('arrow-up.svg')}" alt=""></div>
          <div class="rows">${list.map((it) => row(m, it, true)).join('')}</div>
        </div>`);
    });
    return out.join('');
  }

  function bodyHTML(m) {
    const c = m.count;
    const attn = attention(m);
    return `
      <div class="title"><p class="h">${c.done}/${m.items.length} items uploaded</p><p class="s">Keep this page open until all steps finish uploading</p></div>
      ${attn ? section('NEEDS ATTENTION', attn, 'attn') : ''}
      ${m.items.some((it) => it.sec === 'interior') ? section('INTERIOR', sectionItems(m, 'interior')) : ''}
      ${m.items.some((it) => it.sec === 'exterior') ? section('EXTERIOR', sectionItems(m, 'exterior')) : ''}`;
  }
  function footerHTML(m) {
    const note = `<div class="note"><p>You can submit once all items are uploaded successfully</p></div>`;
    let inner;
    if (m.count.failed) inner = `<div class="stack"><div class="footer-row"><button class="btn btn-outline wide" data-action="retry">Retry Upload</button></div>${note}</div>`;
    else if (m.state === 'uploaded') inner = `<div class="ok-line"><img src="${A('core/checkCircle.svg')}" alt=""><p>All items uploaded successfully</p></div><div class="stack"><div class="footer-row"><button class="btn btn-primary" data-go="accident">Next</button></div></div>`;
    else inner = `<div class="stack"><div class="footer-row"><button class="btn btn-off" aria-disabled="true">Next</button></div>${note}</div>`;
    return `${inner}<div class="home-bar device-only"></div>`;
  }
  const reviewHTML = (m) => `
    <div class="fade"></div>
    ${C.header({})}
    <div class="rv-body">${bodyHTML(m)}</div>
    <div class="footer rv-footer">${footerHTML(m)}</div>`;

  /* ---------- actions ---------- */
  function recapture(key) {
    App.state.returnTo = 'review';
    if (key.startsWith('dmg_')) {
      Sim.dmgReplace = { index: +key.slice(4), len: App.state.damages.length };
      return App.go('damages-capture');
    }
    if (key.startsWith('v360_')) return App.go('v360-' + key.slice(5) + '-capture');
    App.go(CAP_SCREEN[key] || 'review');
  }
  const previewKind = (s) => (s === 'done' ? 'done' : s === 'error' || s === 'failed' ? 'error' : 'uploading');
  let savedScroll = 0;

  /* ---------- Review (216:15155 · 536:33293 · 536:33294 · 536:33295 · 346:35910) ---------- */
  App.screen({
    id: 'review',
    node: '216:15155',
    title: 'Review',
    orientation: 'portrait',
    className: 'f-review',
    rotate: 'rotate-review',
    scroll: true,
    vo: () => VO_TEXT[model(frozenState()).state],
    render: () => reviewHTML(model(frozenState())),
    mount: (el) => {
      const frozen = frozenState();
      // a damage re-captured from Review is appended by the capture screen — move it into the old slot
      const r = Sim.dmgReplace;
      if (r && App.state.damages.length > r.len) { const nw = App.state.damages.pop(); App.state.damages.splice(r.index, 1, nw); }
      Sim.dmgReplace = null;
      const body = el.querySelector('.rv-body'), foot = el.querySelector('.rv-footer');
      let state = model(frozen).state;
      const refresh = () => {
        const m = model(frozen);
        body.innerHTML = bodyHTML(m);
        foot.innerHTML = footerHTML(m);
        if (m.state !== state) { state = m.state; App.VO.speak(VO_TEXT[state]); }
      };
      const sub = (changed) => {
        if (changed) return refresh();
        const m = model(frozen);
        m.items.forEach((it) => { const bar = el.querySelector(`[data-prog="${it.key}"]`); if (bar) bar.style.width = Math.round((m.progress(it) || 0) * 100) + '%'; });
      };
      if (!frozen) { Sim.subs.add(sub); ensureSim(); }
      requestAnimationFrame(() => { el.scrollTop = savedScroll; });
      el.addEventListener('click', (e) => {
        const t = e.target;
        const rc = t.closest('[data-recap]');
        if (rc) return recapture(rc.dataset.recap);
        if (t.closest('[data-action="retry"]')) return retry();
        const tg = t.closest('[data-toggle]');
        if (tg) { const g = tg.dataset.toggle; Open[g] = !isOpen(model(frozen), g); return refresh(); }
        const pv = t.closest('[data-preview]');
        if (pv) {
          App.state.previewKey = pv.dataset.preview;
          const it = model(frozen).items.find((x) => x.key === pv.dataset.preview);
          Sim.fromReview = true;
          App.go('preview-' + previewKind(model(frozen).status(it)));
        }
      });
      return () => { savedScroll = el.scrollTop; Sim.subs.delete(sub); };
    },
  });

  /* ---------- Previews (513:21050 done · 513:21096 uploading · 513:21479 error) ---------- */
  const PREVIEW_DEFAULT = { done: 'rcFront', uploading: 'windshield', error: 'odometer' };
  function previewItem(kind) {
    const m = model(null);
    const key = App.state.previewKey || PREVIEW_DEFAULT[kind];
    const it = m.items.find((x) => x.key === key) || m.items.find((x) => x.key === PREVIEW_DEFAULT[kind]) || m.items[0];
    return { m, it };
  }
  function modalMedia(it) {
    const cap = it.cap;
    if (isVideo(cap)) {
      const src = cap.sample ? `<img src="${cap.url}" alt="">` : `<video src="${cap.url}" playsinline autoplay muted></video>`;
      const d = cap.duration || 0;
      return `
        <div class="pv-media video">${src}<div class="grad"></div>
          <div class="ctrls">
            <button class="ic" data-action="pv-play" aria-label="Play/Pause"><img src="${F('pause.svg')}" alt=""></button>
            <div class="bar"><i style="width:${cap.sample ? '30px' : '0'}"></i></div>
            <p class="time">${cap.sample ? '0:04/0:52' : `0:00/${fmtDur(d).slice(0, -1)}`}</p>
            <button class="ic" data-action="pv-fs" aria-label="Full screen"><img src="${F('fullscreen.svg')}" alt=""></button>
          </div>
        </div>`;
    }
    return `<div class="pv-media"><img src="${(cap.sample && LARGE[it.key]) || cap.url}" alt=""></div>`;
  }
  ['done', 'uploading', 'error'].forEach((kind) => {
    App.screen({
      id: 'preview-' + kind,
      node: { done: '513:21050', uploading: '513:21096', error: '513:21479' }[kind],
      title: 'Preview - ' + { done: 'Done', uploading: 'Uploading', error: 'Error' }[kind],
      orientation: 'portrait',
      className: 'f-review f-static f-preview',
      rotate: 'rotate-review',
      render: () => {
        const { m, it } = previewItem(kind);
        // deep link (no item tapped): show the design's state for this preview
        const s = App.state.previewKey ? m.status(it) : { done: 'done', uploading: 'uploading', error: 'error' }[kind];
        return `
          ${reviewHTML(m)}
          <div class="overlay">
            <div class="modal">
              <div class="pv-head"><p>${esc(it.label)}</p>${chip(s)}</div>
              ${modalMedia(it)}
              <div class="pv-foot">
                <button class="btn btn-outline" data-action="pv-retake">Retake</button>
                <button class="btn btn-primary" data-action="pv-close">Close</button>
              </div>
            </div>
          </div>`;
      },
      mount: (el) => {
        ensureSim();
        const { it } = previewItem(kind);
        const sub = (changed) => {
          if (!changed) return;
          const { m, it: cur } = previewItem(kind);
          const k = previewKind(m.status(cur));
          if (k !== kind && App.state.previewKey) App.go('preview-' + k, true);
          else { const bg = el.querySelector('.rv-body'); if (bg) bg.innerHTML = bodyHTML(m); }
        };
        Sim.subs.add(sub);
        const v = el.querySelector('.pv-media video');
        const ctrls = el.querySelector('.ctrls');
        if (v && ctrls) {
          const bar = ctrls.querySelector('.bar i'), time = ctrls.querySelector('.time'), ic = ctrls.querySelector('[data-action="pv-play"] img');
          const total = () => (isFinite(v.duration) && v.duration > 0 ? v.duration : it.cap.duration || 0);
          const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
          const upd = () => {
            const T = total();
            bar.style.width = T ? Math.min(100, (v.currentTime / T) * 100) + '%' : '0';
            time.textContent = `${mmss(v.currentTime)}/${mmss(T)}`;
            ic.src = F(v.paused ? 'play-sm.svg' : 'pause.svg');
          };
          ['timeupdate', 'play', 'pause', 'loadedmetadata', 'ended'].forEach((ev) => v.addEventListener(ev, upd));
          ctrls.querySelector('.bar').addEventListener('click', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const T = total(); if (T) v.currentTime = ((e.clientX - r.left) / r.width) * T;
          });
        }
        el.addEventListener('click', (e) => {
          const a = e.target.closest('[data-action]');
          if (!a) return;
          const act = a.dataset.action;
          if (act === 'pv-close') { if (Sim.fromReview) { Sim.fromReview = false; history.back(); } else App.go('review', true); }
          else if (act === 'pv-retake') { Sim.fromReview = false; recapture(it.key); }
          else if (act === 'pv-play' && v) { v.paused ? v.play() : v.pause(); }
          else if (act === 'pv-fs' && v) { (v.requestFullscreen || v.webkitEnterFullscreen || (() => {})).call(v); }
        });
        return () => { Sim.subs.delete(sub); if (v) v.pause(); };
      },
    });
  });

  /* ---------- Accident description (346:35675 empty · 346:36660 filled) ---------- */
  App.screen({
    id: 'accident',
    node: '346:35675',
    title: 'Accident Description',
    orientation: 'portrait',
    className: 'f-review f-static f-accident',
    rotate: 'rotate-review',
    vo: '“Describe the accident in a few words… Tap Submit Inspection when done”',
    render: (ctx) => `
      ${reviewHTML(model('uploaded'))}
      <div class="overlay">
        <div class="sheet">
          <div class="grabber"></div>
          <p class="sheet-title">About the Accident</p>
          <label class="ta">
            <textarea placeholder="Describe the accident in a few words..." maxlength="1000">${esc(ctx.state.description || '')}</textarea>
            <img class="resize" src="${F('resizable.svg')}" alt="">
            ${SpeechRec ? `<button type="button" class="mic" aria-label="Speak"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/></svg><span>Speak</span></button>` : ''}
          </label>
          <button class="btn submit ${String(ctx.state.description || '').trim() ? '' : 'off'}" data-action="submit">Submit Inspection</button>
        </div>
      </div>`,
    mount: (el) => {
      const ta = el.querySelector('textarea'), btn = el.querySelector('.submit');
      ta.addEventListener('input', () => {
        App.state.description = ta.value;
        btn.classList.toggle('off', !ta.value.trim());
      });
      btn.addEventListener('click', () => { if (ta.value.trim()) App.go('loading-final'); else ta.focus(); });
      return mountDictation(el, ta);
    },
  });

  /* Speak → text: live dictation appended to whatever is already typed; the text stays editable afterwards */
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  function mountDictation(el, ta) {
    const mic = el.querySelector('.mic');
    if (!mic) return null;
    const label = mic.querySelector('span');
    let rec = null;
    const set = (on) => { mic.classList.toggle('on', on); label.textContent = on ? 'Listening… tap to stop' : 'Speak'; };
    mic.addEventListener('click', (e) => {
      e.preventDefault();
      if (rec) { rec.stop(); return; }
      App.VO.stop(); // keep the voice-over out of the mic
      const base = ta.value.trim() ? ta.value.replace(/\s*$/, ' ') : '';
      rec = new SpeechRec();
      rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = true;
      rec.onresult = (ev) => {
        let said = '';
        for (let i = 0; i < ev.results.length; i++) said += ev.results[i][0].transcript;
        ta.value = (base + said.trim()).slice(0, ta.maxLength);
        ta.scrollTop = ta.scrollHeight;
        ta.dispatchEvent(new Event('input'));
      };
      rec.onend = rec.onerror = () => { rec = null; set(false); };
      try { rec.start(); set(true); } catch (err) { rec = null; }
    });
    return () => rec && rec.abort();
  }

  /* ---------- Success (2:3323) ---------- */
  App.screen({
    id: 'success',
    node: '2:3323',
    title: 'Success',
    orientation: 'portrait',
    className: 'f-success',
    rotate: 'rotate-review',
    vo: `"Done! Your inspection is submitted. We'll update you soon. Thank you."`,
    render: () => `
      <div class="fade"></div>
      ${C.header({ ctas: false, extraClass: 'center' })}
      <div class="body">
        <div class="art"><img src="${F('success.png')}" alt=""></div>
        <div class="card">
          <img class="check" src="${F('s-check.svg')}" alt="">
          <div class="msg">
            <p class="h">Your inspection has been<br>submitted successfully!</p>
            <div class="safe"><img src="${F('s-shield.svg')}" alt=""><span>Your details are safe &amp; secure with us</span></div>
          </div>
          <div class="divider"><i></i><p>What happens next?</p><i></i></div>
          <div class="steps">
            <div class="st"><div class="circ"><img src="${F('s-clock.svg')}" alt=""></div><div class="tx"><p class="a">We’ll review</p><p class="b">your inspection</p></div></div>
            <div class="vline"></div>
            <div class="st"><div class="circ"><img src="${F('s-bell.svg')}" alt=""></div><div class="tx"><p class="a">We’ll notify</p><p class="b">of next steps</p></div></div>
            <div class="vline"></div>
            <div class="st"><div class="circ"><img src="${F('s-notes.svg')}" alt=""></div><div class="tx"><p class="a">Your claim</p><p class="b">moves forward</p></div></div>
          </div>
          <div class="close-tab"><p>You may now close the tab</p></div>
        </div>
      </div>
      <div class="foot"><div class="home-bar device-only"></div></div>`,
  });
})();
