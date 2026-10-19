/* V2 · Review & submit (portrait): uploading (753:36841) → recapture (730:56158) / failed (753:37289) → reuploading
   (758:36517) → ready (753:38345) → "Anything we should know?" note + voice note (736:57550, 762:36629/36831/37039)
   → submitting (716:48751) → success (669:32288). Deep links: #/review?state=uploading|attention|failed|good. */
(function () {
  const { A, I, esc } = U;
  const IMG = (f) => A('img/' + f);
  const P = (f) => A('photo/' + f);
  const st = App.state;
  const UP = App.Uploads;

  const INSIDE = [['rcFront', 'RC front', 'rc'], ['rcPaper', 'RC paper', 'rc'], ['rcBack', 'RC back', 'rc-back'], ['odometer', 'Odometer', 'odo'], ['windshield', 'Windshield', 'ws'], ['roof', 'Sunroof', 'roof']];
  const AROUND = () => [['vin', 'VIN', 'vin'], ['engine', 'Engine sound', 'engine'], ...U.WALK.map((w, i) => ['walk_' + (i + 1), w.name, 'walk-' + (i + 1)])];
  const POSTER = { windshield: P('ws.jpg'), roof: P('roof.jpg'), engine: P('engine.jpg') };
  const thumbOf = (c, fb) => (c && c.kind === 'photo' ? c.url : c && c.poster) || fb;

  /* sample inspection for deep links / opening Review with nothing captured */
  function sample(kind) {
    const done = { t0: Date.now() - 9000, dur: 1000 };
    const phA = (url, q) => ({ kind: 'photo', url, sample: true, quality: q || { ok: true }, up: { ...done } });
    const ph = (img, q) => phA(P(img), q);
    const vd = (img, d) => ({ kind: 'video', url: P(img), poster: P(img), duration: d, sample: true, quality: { ok: true }, up: { ...done } });
    const c = {
      rcFront: ph('rc-front.jpg'), rcBack: ph('rc-back.jpg'), odometer: ph('odo.jpg', kind === 'attention' ? { ok: false, blurry: true } : null),
      windshield: vd('ws.jpg', 52), roof: vd('roof.jpg', 21), vin: ph('vin.jpg'), engine: vd('engine.jpg', 12),
    };
    U.WALK.forEach((w, i) => { c['walk_' + (i + 1)] = phA(w.photo, kind === 'attention' && i === 6 ? { ok: false, reason: 'Car is cut off on the left' } : null); });
    st.captures = c;
    st.damages = [{ close: ph('dmg-example.jpg') }, { close: ph('dmg.jpg') }];
    if (kind === 'uploading') { c.walk_9.up = { t0: Date.now(), dur: 5000 }; c.walk_10.up = { t0: Date.now(), dur: 7000 }; st.damages[1].close.up = { t0: Date.now(), dur: 9000 }; }
    if (kind === 'failed') { UP.fail(c.roof); UP.fail(st.damages[1].close); }
    st.retrying = false;
  }

  function model() {
    const pick = (list) => list.filter(([k]) => App.capture(k)).map(([key, label, go]) => ({ key, label, go, cap: App.capture(key) }));
    const inside = pick(INSIDE), around = pick(AROUND());
    const dmg = st.damages.map((d, i) => ({ key: 'dmg' + i, label: 'Damage ' + (i + 1), go: 'damages', cap: d.close }));
    const all = [...inside, ...around, ...dmg];
    const attn = [...inside, ...around].filter((it) => it.cap.kind === 'photo' && it.cap.quality && it.cap.quality.ok === false);
    const failed = all.filter((x) => UP.failed(x.cap));
    const uploaded = all.filter((x) => UP.done(x.cap)).length;
    const mode = failed.length ? 'failed' : uploaded < all.length ? 'uploading' : attn.length ? 'attention' : 'good';
    return { inside, around, dmg, all, attn, failed, uploaded, total: all.length, mode };
  }
  const kindOf = (it) => (it.key.startsWith('dmg') ? '1 photo' : it.key.startsWith('walk_') ? 'Walk-around · Photo' : it.cap.kind === 'video' ? `Video · ${U.fmt(it.cap.duration || 0)}` : 'Photo');
  const reason = (q) => q.reason || (q.dark ? 'Too dark, use the torch' : 'Blurry, hold still');
  const upRow = (m) => `<div class="uprow"><img src="${I('cloud-upload.svg')}" alt=""><div class="ut"><p data-up>${m.uploaded} of ${m.total} uploaded${m.uploaded < m.total && m.mode !== 'failed' ? ' · in the background' : ''}</p><i><b data-upbar style="width:${m.total ? (m.uploaded / m.total) * 100 : 0}%"></b></i></div></div>`;
  const check = (cls = '') => `<i class="gck ${cls}"><img src="${I('check-13-w.svg')}" alt=""></i>`;

  // "Your captures" while uploading: every capture with its own status
  const status = (it) => {
    if (UP.failed(it.cap)) return '<span class="us bad">Upload failed</span>';
    const p = UP.progress(it.cap);
    return p >= 1 ? '<span class="us ok">✓ Uploaded</span>' : `<span class="us up"><span>Uploading · ${Math.round(p * 100)}%</span><i><b style="width:${p * 100}%"></b></i></span>`;
  };
  const upGroup = (title, items) => {
    if (!items.length) return '';
    const n = items.filter((x) => UP.done(x.cap)).length, all = n === items.length;
    return `<div class="grp"><div class="gh">${check(all ? '' : 'pend')}<b>${title}</b><span class="${all ? '' : 'pend'}">${n} of ${items.length} uploaded</span></div>
      <div class="caps">${items.map((it, i) => `${i ? '<i class="dv"></i>' : ''}<div class="cap" data-key="${it.key}"><span class="th"><img src="${thumbOf(it.cap, POSTER[it.key])}" alt=""></span>
        <div class="ct"><b>${esc(it.label)}</b><em>${kindOf(it)}</em></div><span data-status>${status(it)}</span></div>`).join('')}</div></div>`;
  };
  // "Looks good": a stage card with thumbnails (collapsed to 4, tap the header to see all)
  const good = (id, title, items, count, flagged) => {
    const list = items.filter((x) => !flagged.has(x.key));
    if (!list.length) return '';
    const open = (st.openGroups || {})[id];
    const shown = open ? list : list.slice(0, 4);
    return `<div class="grp ${open ? 'open' : ''}" data-group="${id}"><div class="gh tap">${check()}<b>${title}</b><span>${count(list)}</span><img class="chev" src="${I('chevron-right.svg')}" alt=""></div>
      <div class="thumbs">${shown.map((t) => `<button class="gt" data-preview="${t.key}"><img src="${thumbOf(t.cap, POSTER[t.key])}" alt="">${open ? `<span>${esc(t.label)}</span>` : ''}</button>`).join('')}</div></div>`;
  };
  const items = (n) => `${n.length} item${n.length > 1 ? 's' : ''}`;

  function reviewBody(m) {
    const flagged = new Set(m.attn.map((x) => x.key));
    const failedKeys = new Set(m.failed.map((x) => x.key));
    if (m.mode === 'uploading') {
      return `${U.title(st.retrying ? 'Retrying upload' : 'Uploading your captures', st.retrying ? 'Retrying the files that didn’t upload. Keep this page open.' : 'We upload as you go. Keep this page open, it takes about a minute.')}
        ${upRow(m)}<div class="sec"><p class="sl">YOUR CAPTURES</p>${upGroup('Inside the car', m.inside)}${upGroup('Around the car', m.around)}${upGroup('Damages', m.dmg)}</div>`;
    }
    if (m.mode === 'failed') {
      const n = m.failed.length, sub = (it) => (it.key.startsWith('dmg') ? 'Upload failed · 1 photo' : `Upload failed · ${it.cap.kind === 'video' ? 'Video' : 'Photo'}`);
      const ok = (list) => list.filter((x) => !failedKeys.has(x.key));
      const upCount = (all) => () => `${ok(all).length} of ${all.length} uploaded`;
      return `${U.title('Some uploads failed', `${n} file${n > 1 ? 's' : ''} didn't upload. Check your internet, then tap Retry upload.`)}
        ${upRow(m)}
        <div class="sec"><p class="sl bad">DIDN'T UPLOAD</p>${m.failed.map((it) => `
          <div class="att"><span class="th"><img src="${thumbOf(it.cap, POSTER[it.key])}" alt=""></span><div class="ct"><b>${esc(it.label)}</b><em><img src="${I('alert-14-red.svg')}" alt="">${sub(it)}</em></div>
            <button class="rt" data-retry="${it.key}">Retry</button></div>`).join('')}</div>
        <div class="sec"><p class="sl ok">UPLOADED</p>${good('inside', 'Inside the car', ok(m.inside), upCount(m.inside), new Set())}${good('around', 'Around the car', ok(m.around), upCount(m.around), new Set())}${good('damages', 'Damages', ok(m.dmg), upCount(m.dmg), new Set())}</div>`;
    }
    const n = m.attn.length;
    return `${n ? U.title('Almost done', `${n} photo${n > 1 ? 's need' : ' needs'} a retake. Everything else looks good.`) : U.title('Ready to submit', `All ${m.total} captures look good. Tap a stage to check any photo again.`)}
      ${upRow(m)}
      ${n ? `<div class="sec"><p class="sl bad">NEEDS ATTENTION</p>${m.attn.map((it) => `
        <div class="att"><span class="th"><img src="${thumbOf(it.cap)}" alt=""></span><div class="ct"><b>${esc(it.label)}</b><em><img src="${I('alert-14-red.svg')}" alt="">${esc(reason(it.cap.quality))}</em></div>
          <button class="rt" data-retake="${it.go}">Retake</button></div>`).join('')}</div>` : ''}
      <div class="sec"><p class="sl ok">LOOKS GOOD</p>${good('inside', 'Inside the car', m.inside, items, flagged)}${good('around', 'Around the car', m.around, items, flagged)}${good('damages', 'Damages', m.dmg, (l) => `${l.length} tagged`, flagged)}</div>`;
  }
  function reviewFoot(m) {
    if (m.mode === 'uploading') return U.foot('<button class="btn lg" disabled>Continue</button>', 'You can submit once all items are uploaded successfully');
    if (m.mode === 'failed') return U.foot('<button class="btn lg" data-action="retry-all">Retry upload</button>', 'Your other captures are saved.');
    if (m.mode === 'attention') return U.foot(`<button class="btn lg" data-action="fix">Recapture ${m.attn.length} item${m.attn.length > 1 ? 's' : ''}</button>`, 'Then submit. Takes about a minute.');
    return U.foot('<button class="btn lg" data-go="note">Continue</button>', 'One optional question, then submit.');
  }
  const REVIEW_VO = {
    uploading: () => (st.retrying ? 'Retrying the upload. Please keep this page open.' : 'Uploading. Please keep this page open.'),
    failed: (m) => `${m.failed.length} file${m.failed.length > 1 ? 's' : ''} didn't upload. Check your internet and tap Retry upload.`,
    attention: () => 'Some photos are blurry or too dark. Recapture them.',
    good: () => 'Everything looks good. Tap Continue.',
  };
  const prepare = () => {
    const s = App.hashParam('state');
    if (s && st._sampled !== s) { sample(s); st._sampled = s; } else if (!Object.keys(st.captures).length && !st._sampled) { sample('good'); st._sampled = 'good'; }
  };
  const page = (m) => U.page({ body: reviewBody(m), foot: reviewFoot(m) });

  App.screen({
    id: 'review', node: '753:36841', title: 'Review (uploading / recapture / failed / ready)', className: 's3-review pg', scroll: true,
    vo: () => { prepare(); const m = model(); return REVIEW_VO[m.mode](m); },
    render: () => { prepare(); const m = model(); st._mode = m.mode; return page(m); },
    mount: (el) => {
      // live upload progress; the page switches state once everything has uploaded
      const iv = setInterval(() => {
        const m = model();
        if (m.mode !== st._mode) { if (m.mode !== 'uploading') st.retrying = false; return App.rerender(); }
        const t = el.querySelector('[data-up]'), b = el.querySelector('[data-upbar]');
        if (t) t.textContent = `${m.uploaded} of ${m.total} uploaded${m.uploaded < m.total && m.mode !== 'failed' ? ' · in the background' : ''}`;
        if (b) b.style.width = `${m.total ? (m.uploaded / m.total) * 100 : 0}%`;
        el.querySelectorAll('.cap[data-key]').forEach((row) => { const it = m.all.find((x) => x.key === row.dataset.key); if (it) row.querySelector('[data-status]').innerHTML = status(it); });
      }, 400);
      el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-retake]');
        if (r) { st.returnTo = 'review'; st.fixQueue = null; return App.go(r.dataset.retake); }
        if (e.target.closest('[data-action="fix"]')) {
          const q = model().attn.map((x) => x.go);
          st.returnTo = 'review'; st.fixQueue = q.slice(1);
          return App.go(q[0]);
        }
        const rt = e.target.closest('[data-retry]');
        if (rt || e.target.closest('[data-action="retry-all"]')) {
          const m = model();
          m.failed.filter((x) => !rt || x.key === rt.dataset.retry).forEach((x) => UP.retry(x.cap));
          st.retrying = true;
          return App.rerender();
        }
        const pv = e.target.closest('[data-preview]');
        if (pv) {
          const it = model().all.find((x) => x.key === pv.dataset.preview);
          if (it) U.fullscreen(el, { cap: it.cap, src: thumbOf(it.cap, POSTER[it.key]), label: it.label, action: { label: 'Retake', onClick: () => { st.returnTo = 'review'; App.go(it.go); } } });
          return;
        }
        const g = e.target.closest('[data-group] .gh');
        if (g) { const id = g.parentElement.dataset.group; st.openGroups = { ...(st.openGroups || {}), [id]: !(st.openGroups || {})[id] }; App.rerender(); }
      });
      return () => clearInterval(iv);
    },
  });

  /* ---------- Anything we should know? note + voice note ---------- */
  const NOTE_VO = 'Anything we should know? Type a note, or record a voice note. Then tap Submit Inspection.';
  const bars = (n, seed) => Array.from({ length: n }, (_, i) => 6 + Math.round(Math.abs(Math.sin(i * 1.7 + seed) * 12 + Math.sin(i * .6) * 7)));
  const WAVE = bars(28, 2);
  const voiceUI = () => {
    const v = st.voiceNote;
    if (st.recNote) {
      return `<div class="vn rec"><div class="vr"><img src="${I('rec-dot-red.svg')}" alt=""><b>Recording</b><i></i><span data-vt>0:00 / 2:00</span></div>
        <div class="vw"><div class="wave red" data-wave>${bars(30, 1).map((h) => `<i style="height:${h}px"></i>`).join('')}</div>
        <button class="stop" data-action="vn-stop" aria-label="Stop"><i></i></button></div></div>
        <p class="vn-hint">Tap stop when you're done. You can record up to 2 minutes.</p>`;
    }
    if (v) {
      return `<div class="vn done"><button class="play" data-action="vn-play" aria-label="Play"><img src="${I('play-20-w.svg')}" alt=""></button>
        <div class="vm"><div class="wave" data-wave>${WAVE.map((h) => `<i style="height:${h}px"></i>`).join('')}</div><span data-vlen>Voice note · ${U.fmt(v.duration)}</span></div>
        <button class="del" data-action="vn-del" aria-label="Delete"><img src="${I('trash-18.svg')}" alt=""></button></div>
        <button class="rerec" data-action="vn-rec"><img src="${I('rotate-ccw.svg')}" alt="">Re-record</button>`;
    }
    return `<div class="or"><i></i><span>or</span><i></i></div><button class="vn-btn" data-action="vn-rec"><img src="${I('mic-18.svg')}" alt="">Record a voice note</button>`;
  };
  App.screen({
    id: 'note', node: '736:57550', title: 'Anything we should know? (note / voice note)', className: 's3-review pg note',
    vo: () => (st.voiceNote ? 'Voice note saved. Play it back, or tap Submit Inspection.' : NOTE_VO),
    render: () => { prepare(); const m = model(); return page(m) + `<div class="ov"><div class="sheet nsheet"><i class="handle"></i><p class="st">Anything we should know?</p>
        <textarea placeholder="Optional. E.g. a dent or scratch that was already there." maxlength="1000">${esc(st.note)}</textarea>
        <div class="voice" data-voice>${voiceUI()}</div>
        <div class="cta"><button class="btn full" data-go="submitting" ${st.recNote ? 'disabled' : ''}>Submit Inspection</button></div></div></div>`; },
    mount: (el) => {
      const ta = el.querySelector('textarea');
      ta.addEventListener('input', () => { st.note = ta.value; });
      let rec = null, iv = 0, audio = null, t0 = 0;
      const box = el.querySelector('[data-voice]');
      const redraw = () => { box.innerHTML = voiceUI(); el.querySelector('.cta .btn').disabled = !!st.recNote; };
      const stopRec = async () => {
        clearInterval(iv);
        const dur = (Date.now() - t0) / 1000;
        let url = null;
        if (rec) {
          url = await new Promise((res) => { rec.r.onstop = () => res(URL.createObjectURL(new Blob(rec.chunks, { type: rec.r.mimeType || 'audio/webm' }))); rec.r.stop(); });
          rec.stream.getTracks().forEach((t) => t.stop());
          rec = null;
        }
        st.recNote = false;
        st.voiceNote = { url, duration: Math.max(1, dur) };
        redraw();
        App.VO.speak('Voice note saved. Play it back, or tap Submit Inspection.');
      };
      const startRec = async () => {
        App.VO.stop();
        if (audio) audio.pause();
        st.voiceNote = null; st.recNote = true;
        redraw();
        App.VO.speak('Recording. Tap stop when you’re done.');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const r = new MediaRecorder(stream), chunks = [];
          r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          r.start(250);
          rec = { r, chunks, stream };
        } catch (e) { rec = null; } // no microphone: a timed sample note
        t0 = Date.now();
        iv = setInterval(() => {
          const s = (Date.now() - t0) / 1000;
          const t = el.querySelector('[data-vt]');
          if (t) t.textContent = `${U.fmt(s)} / 2:00`;
          el.querySelectorAll('[data-wave] i').forEach((b) => { b.style.height = `${4 + Math.random() * 18}px`; });
          if (s >= 120) stopRec();
        }, 200);
      };
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-action]');
        if (!a) return;
        const act = a.dataset.action;
        if (act === 'vn-rec') startRec();
        if (act === 'vn-stop') stopRec();
        if (act === 'vn-del') { if (audio) audio.pause(); st.voiceNote = null; redraw(); }
        if (act === 'vn-play') {
          const v = st.voiceNote, img = a.querySelector('img'), bars = [...el.querySelectorAll('[data-wave] i')], len = el.querySelector('[data-vlen]');
          if (a.classList.contains('on')) { a.classList.remove('on'); img.src = I('play-20-w.svg'); if (audio) audio.pause(); clearInterval(iv); return; }
          a.classList.add('on'); img.src = I('pause-16.svg');
          if (v.url) { audio = new Audio(v.url); audio.play().catch(() => {}); }
          const p0 = Date.now();
          clearInterval(iv);
          iv = setInterval(() => {
            const s = audio && v.url ? audio.currentTime : (Date.now() - p0) / 1000, p = Math.min(1, s / v.duration);
            bars.forEach((b, i) => b.classList.toggle('on', i / bars.length < p));
            len.textContent = `${U.fmt(s)} / ${U.fmt(v.duration)}`;
            if (p >= 1) { clearInterval(iv); a.classList.remove('on'); img.src = I('play-20-w.svg'); bars.forEach((b) => b.classList.remove('on')); len.textContent = `Voice note · ${U.fmt(v.duration)}`; }
          }, 150);
        }
      });
      return () => { clearInterval(iv); if (audio) audio.pause(); if (rec) { rec.r.stop(); rec.stream.getTracks().forEach((t) => t.stop()); st.recNote = false; } };
    },
  });

  /* ---------- Submitting (716:48751) ---------- */
  App.screen({
    id: 'submitting', node: '716:48751', title: 'Submitting', className: 's3-sub',
    vo: 'Submitting your inspection. This takes a few seconds.',
    render: () => `${U.status()}${U.browser()}
      <div class="ld-body"><span class="ld-logo">${U.logo()}</span>
        <div class="sb-mid"><p class="ld-t">Submitting your inspection</p><p class="sb-s">All ${model().total} files are uploaded. A few seconds...</p></div>
        <div class="ld-bar"><i></i></div></div>
      <div class="abar">${U.home()}</div>`,
    mount: () => { const t = setTimeout(() => App.go('success', true), 3200); return () => clearTimeout(t); },
  });

  /* ---------- Success (669:32288) ---------- */
  App.screen({
    id: 'success', node: '669:32288', title: 'Success', className: 's3-ok pg',
    vo: "Your inspection has been submitted successfully. We'll update you soon. Thank you.",
    render: () => `${U.status()}${U.browser()}<div class="nav center">${U.logo()}</div>
      <div class="ok-body">
        <div class="ok-ill"><img src="${IMG('success.png')}" alt=""></div>
        <div class="ok-card">
          <span class="ok-ic"><img src="${I('success-check.svg')}" alt=""></span>
          <div class="ok-t"><p>Your inspection has been<br>submitted successfully!</p>
            <span class="safe"><img src="${I('shield-16.svg')}" alt="">Your details are safe &amp; secure with us</span></div>
          <div class="ok-next"><i></i><span>What happens next?</span><i></i></div>
          <div class="ok-steps">${[['clock.svg', 'We’ll review', 'your inspection'], ['bell.svg', 'We’ll notify', 'of next steps'], ['notepad.svg', 'Your policy', 'moves forward']]
            .map(([ic, t, s], i) => `${i ? '<i class="vd"></i>' : ''}<div class="os"><span><img src="${I(ic)}" alt=""></span><p><b>${t}</b><em>${s}</em></p></div>`).join('')}</div>
          <p class="ok-close">You may now close the tab</p>
        </div>
      </div>
      <div class="abar">${U.home()}</div>`,
  });
})();
