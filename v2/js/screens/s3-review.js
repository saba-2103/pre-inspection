/* V2 · Stage 3 · Review & submit (portrait): review leads with what needs attention (uploads already ran in the
   background) → "Anything we should know?" (chips + optional note with Speak) → submitting → success.
   Figma section 648:21117. Deep links: #/review?state=attention | good (sample data). */
(function () {
  const { A, esc } = U;
  const P = (f) => A('photo/' + f);
  const S3 = (f) => A('s3/' + f);
  const st = App.state;
  const UP = App.Uploads;

  const INSIDE = [['rcFront', 'RC front', 'rc'], ['rcPaper', 'Paper RC', 'rc'], ['rcBack', 'RC back', 'rc-back'], ['odometer', 'Odometer', 'odo'], ['windshield', 'Windshield', 'ws'], ['roof', 'Sunroof', 'roof']];
  const AROUND = () => [['vin', 'VIN', 'vin'], ['engine', 'Engine sound', 'engine'], ...U.WALK.map((w, i) => ['walk_' + (i + 1), w.name, 'walk-' + (i + 1)])];
  const thumbOf = (c, fb) => (c && c.kind === 'photo' ? c.url : c && c.poster) || fb;
  const POSTER = { windshield: P('ws.jpg'), roof: P('roof.jpg'), engine: P('engine.jpg') };

  /* sample inspection for deep links / opening Review with nothing captured */
  function sample(kind) {
    const ph = (img, q) => ({ kind: 'photo', url: P(img), sample: true, quality: q || { ok: true }, up: { t0: Date.now() - 5000, dur: 1000 } });
    const vd = (img, d) => ({ kind: 'video', url: P(img), poster: P(img), duration: d, sample: true, quality: { ok: true }, up: { t0: Date.now() - 5000, dur: 1000 } });
    const c = {
      rcFront: ph('rc-front.jpg'), rcBack: ph('rc-back.jpg'), odometer: ph('odo.jpg', kind === 'attention' ? { ok: false, blurry: true } : null),
      windshield: vd('ws.jpg', 10), roof: vd('roof.jpg', 10), vin: ph('vin.jpg'), engine: vd('engine.jpg', 10),
    };
    U.WALK.forEach((w, i) => { c['walk_' + (i + 1)] = ph(w.photo, kind === 'attention' && i === 6 ? { ok: false, reason: 'Car is cut off on the left' } : null); });
    if (kind === 'attention') { c.odometer.up = { t0: Date.now(), dur: 9000 }; c.walk_7.up = { t0: Date.now(), dur: 12000 }; }
    st.captures = c;
    st.damages = [{ panel: 'rear', type: 'Dent', close: ph('dmg-example.jpg'), wide: ph('dmg-example.jpg') }, { panel: 'lr', type: 'Scratch', close: ph('dmg.jpg'), wide: ph('dmg.jpg') }];
  }

  function model() {
    const pick = (list) => list.filter(([k]) => App.capture(k)).map(([key, label, go]) => ({ key, label, go, cap: App.capture(key) }));
    const inside = pick(INSIDE), around = pick(AROUND());
    const all = [...inside, ...around];
    const attn = all.filter((it) => it.cap.kind === 'photo' && it.cap.quality && it.cap.quality.ok === false);
    const caps = [...all.map((x) => x.cap), ...st.damages.flatMap((d) => [d.close, d.wide]).filter(Boolean)];
    const total = all.length + st.damages.length;
    const uploaded = all.filter((x) => UP.done(x.cap)).length + st.damages.filter((d) => UP.done(d.close) && UP.done(d.wide)).length;
    return { inside, around, attn, total, uploaded, caps };
  }
  const reason = (q) => q.reason || (q.dark ? 'Too dark, use the torch' : 'Blurry, hold still');
  const upCard = (m) => `<div class="up-card card"><img src="${S3('ic-upload.svg')}" alt=""><div class="uc"><p data-up>${m.uploaded} of ${m.total} uploaded${m.uploaded < m.total ? ' · in the background' : ''}</p><i><b data-upbar style="width:${m.total ? (m.uploaded / m.total) * 100 : 0}%"></b></i></div></div>`;
  const group = (id, title, count, thumbs, open) => `
    <div class="grp-card card ${open ? 'open' : ''}" data-group="${id}">
      <div class="gh"><i class="ok"><img src="${S3('ic-check-sm.svg')}" alt=""></i><b>${title}</b><span>${count}</span><img class="chev" src="${S3('ic-chevron.svg')}" alt=""></div>
      <div class="gthumbs">${thumbs.map((t) => `<button class="gt" data-preview="${t.key}" title="${esc(t.label)}"><img src="${t.img}" alt="">${open ? `<span>${esc(t.label)}</span>` : ''}</button>`).join('')}</div>
    </div>`;

  App.screen({
    id: 'review', node: '654:21868', title: '34 · Review (needs attention / 35 · all good)', className: 's3-review', scroll: true,
    render: () => {
      const s = App.hashParam('state');
      if (s || !Object.keys(st.captures).length) { if (!st._sampled || s) { sample(s || 'good'); st._sampled = true; } }
      const m = model(), open = st.openGroups || {};
      const flagged = new Set(m.attn.map((x) => x.key));
      const fine = (list) => list.filter((x) => !flagged.has(x.key)).map((x) => ({ key: x.key, label: x.label, img: thumbOf(x.cap, POSTER[x.key]) }));
      const inside = fine(m.inside), around = fine(m.around);
      const dmg = st.damages.map((d, i) => ({ key: 'dmg' + i, label: 'Damage ' + (i + 1), img: d.close ? d.close.url : P('dmg.jpg') }));
      const n = m.attn.length;
      return `${U.status()}${U.browser()}${U.top(U.pill('Stage 3 of 3 · Review'))}
      <div class="pbody">
        ${n ? U.head('Almost done', `${n} photo${n > 1 ? 's need' : ' needs'} a retake. Everything else looks good.`) : U.head('Ready to submit', `All ${m.total} captures look good. Tap a stage to check any photo again.`)}
        ${upCard(m)}
        ${n ? `<p class="sl bad">NEEDS ATTENTION</p>${m.attn.map((it) => `
          <div class="att card"><span class="th"><img src="${thumbOf(it.cap)}" alt=""></span><div class="pt"><b>${esc(it.label)}</b><em><img src="${S3('ic-warn-sm.svg')}" alt="">${esc(reason(it.cap.quality))}</em></div>
            <button class="rt" data-retake="${it.go}">Retake</button></div>`).join('')}` : ''}
        <p class="sl ok">LOOKS GOOD</p>
        ${inside.length ? group('inside', 'Inside the car', `${inside.length} item${inside.length > 1 ? 's' : ''}`, open.inside ? inside : inside.slice(0, 4), open.inside) : ''}
        ${around.length ? group('around', 'Around the car', `${around.length} item${around.length > 1 ? 's' : ''}`, open.around ? around : around.slice(0, 4), open.around) : ''}
        ${dmg.length ? group('damages', 'Damages', `${dmg.length} tagged`, dmg, open.damages) : ''}
      </div>
      <div class="pfoot rv-foot">${n
        ? `<button class="btn" data-action="fix"><img src="${S3('ic-retake-white.svg')}" alt="">Fix ${n} item${n > 1 ? 's' : ''}</button><p class="foot-note">Then submit. Takes about a minute.</p>`
        : `<button class="btn" data-go="note">Continue</button><p class="foot-note">One optional question, then submit.</p>`}</div>
      <div class="pv" hidden><div class="pv-card"><div class="pv-media"></div><p class="pv-l"></p><div class="pv-b"><button class="btn ghost" data-action="pv-close">Close</button><button class="btn" data-action="pv-retake">Retake</button></div></div></div>`;
    },
    mount: (el) => {
      const iv = setInterval(() => {
        const m = model();
        const t = el.querySelector('[data-up]'), b = el.querySelector('[data-upbar]');
        if (t) t.textContent = `${m.uploaded} of ${m.total} uploaded${m.uploaded < m.total ? ' · in the background' : ''}`;
        if (b) b.style.width = `${m.total ? (m.uploaded / m.total) * 100 : 0}%`;
      }, 500);
      let pvGo = null;
      el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-retake]');
        if (r) { st.returnTo = 'review'; st.fixQueue = null; return App.go(r.dataset.retake); }
        if (e.target.closest('[data-action="fix"]')) {
          const q = model().attn.map((x) => x.go);
          st.returnTo = 'review'; st.fixQueue = q.slice(1);
          return App.go(q[0]);
        }
        const pv = e.target.closest('[data-preview]');
        if (pv) {
          const k = pv.dataset.preview;
          const d = /^dmg(\d+)$/.exec(k);
          const it = d ? null : [...INSIDE, ...AROUND()].find(([key]) => key === k);
          const cap = d ? st.damages[+d[1]].close : App.capture(k);
          el.querySelector('.pv-media').innerHTML = cap && cap.kind === 'video' && !cap.sample ? `<video src="${cap.url}" muted playsinline controls autoplay></video>` : `<img src="${thumbOf(cap, POSTER[k]) || ''}" alt="">`;
          el.querySelector('.pv-l').textContent = d ? `Damage ${+d[1] + 1}` : it[1];
          pvGo = d ? 'damages' : it[2];
          el.querySelector('.pv').hidden = false;
          return;
        }
        if (e.target.closest('[data-action="pv-close"]') || e.target.classList.contains('pv')) { el.querySelector('.pv').hidden = true; el.querySelector('.pv-media').innerHTML = ''; return; }
        if (e.target.closest('[data-action="pv-retake"]') && pvGo) { st.returnTo = 'review'; return App.go(pvGo); }
        const g = e.target.closest('[data-group] .gh');
        if (g) { const id = g.parentElement.dataset.group; st.openGroups = { ...(st.openGroups || {}), [id]: !(st.openGroups || {})[id] }; App.rerender(); }
      });
      return () => clearInterval(iv);
    },
  });

  /* ---------- 36 Anything we should know? (654:22128): chips + optional note (voice input), submit always on ---------- */
  const CHIPS = ['No issues', 'Old scratches or dents', 'Repaired before', 'Recent accident', 'Chipped glass', 'Something else'];
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  App.screen({
    id: 'note', node: '654:22128', title: '36 · Anything we should know?', className: 's3-note', scroll: true,
    render: () => `${U.status()}${U.browser()}${U.top()}
      <div class="pbody">
        ${U.head('Anything we should know?', 'Optional. It helps the assessor read your photos correctly.')}
        <div class="chips">${CHIPS.map((c) => `<button class="nc ${st.chips.includes(c) ? 'on' : ''}" data-chip="${esc(c)}">${st.chips.includes(c) ? `<img src="${S3('ic-chip-check.svg')}" alt="">` : ''}${esc(c)}</button>`).join('')}</div>
        <label class="nbox"><textarea placeholder="Add a note (optional)" maxlength="1000">${esc(st.note)}</textarea>
          <span class="nrow"><span>Your note</span>${SpeechRec ? `<button type="button" class="speak"><img src="${S3('ic-mic.svg')}" alt=""><span>Speak</span></button>` : ''}</span></label>
      </div>
      <div class="pfoot"><button class="btn" data-go="submitting">Submit inspection</button><p class="foot-note">You can't change photos after submitting.</p></div>`,
    mount: (el) => {
      const ta = el.querySelector('textarea');
      ta.addEventListener('input', () => { st.note = ta.value; });
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-chip]');
        if (!c) return;
        const v = c.dataset.chip, on = st.chips.includes(v);
        st.chips = v === 'No issues' ? (on ? [] : ['No issues']) : (on ? st.chips.filter((x) => x !== v) : [...st.chips.filter((x) => x !== 'No issues'), v]);
        App.rerender();
      });
      // Speak → live dictation appended to the note (from V1); text stays editable
      const mic = el.querySelector('.speak');
      if (!mic) return null;
      let rec = null;
      const set = (on) => { mic.classList.toggle('on', on); mic.querySelector('span').textContent = on ? 'Listening… tap to stop' : 'Speak'; };
      mic.addEventListener('click', (e) => {
        e.preventDefault();
        if (rec) { rec.stop(); return; }
        App.VO.stop();
        const base = ta.value.trim() ? ta.value.replace(/\s*$/, ' ') : '';
        rec = new SpeechRec();
        rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = true;
        rec.onresult = (ev) => {
          let said = '';
          for (let i = 0; i < ev.results.length; i++) said += ev.results[i][0].transcript;
          ta.value = (base + said.trim()).slice(0, ta.maxLength);
          st.note = ta.value;
        };
        rec.onend = rec.onerror = () => { rec = null; set(false); };
        try { rec.start(); set(true); } catch (err) { rec = null; }
      });
      return () => rec && rec.abort();
    },
  });

  /* ---------- 37 Submitting (654:22170) ---------- */
  App.screen({
    id: 'submitting', node: '654:22170', title: '37 · Submitting', className: 's3-sub',
    render: () => `${U.status()}${U.browser()}
      <div class="ld-body"><img class="ld-logo" src="${A('core/logo.svg')}" alt="ACME">
        <p class="ld-t">Submitting your inspection</p><p class="ld-s">All ${model().total} files are uploaded. A few seconds...</p>
        <div class="ld-bar"><i></i></div></div>
      <p class="ld-foot muted">Please keep this page open</p>`,
    mount: () => { const t = setTimeout(() => App.go('success', true), 2200); return () => clearTimeout(t); },
  });

  /* ---------- 38 Success (654:22230): reference, timeline with channel, summary ---------- */
  App.screen({
    id: 'success', node: '654:22230', title: '38 · Success', className: 's3-ok', scroll: true,
    render: () => {
      const caps = Object.values(st.captures);
      const photos = caps.filter((c) => c.kind === 'photo').length + st.damages.length * 2, videos = caps.filter((c) => c.kind === 'video').length;
      const thumb = App.capture('walk_1') ? thumbOf(App.capture('walk_1')) : P('walk-1.jpg');
      return `${U.status()}${U.browser()}
      <div class="ok-body">
        <span class="ok-ic"><img src="${S3('ok-big.svg')}" alt=""></span>
        <p class="ok-h">Inspection submitted</p>
        <div class="ref card"><span>Ref.</span><b>${App.config.ref}</b><button data-action="copy"><img src="${S3('ic-copy.svg')}" alt=""><span>Copy</span></button></div>
        <div class="next card"><p class="nh">WHAT HAPPENS NEXT</p>
          ${[['ic-clock-w', 'An assessor reviews your photos', 'By 6:00 PM today', true], ['ic-chat', 'You get the result on WhatsApp', 'Same day, from ACME General Insurance'], ['ic-doc', 'Your policy is issued', 'Within 24 hours of approval']]
            .map(([ic, t, s, on]) => `<div class="nx"><span class="${on ? 'on' : ''}"><img src="${S3(ic + '.svg')}" alt=""></span><div class="pt"><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>
        <div class="sum card"><span class="th"><img src="${thumb}" alt=""></span><div class="pt"><b>${esc(App.config.reg)}</b><em>${photos} photos · ${videos} video${videos === 1 ? '' : 's'} · ${st.damages.length} damage${st.damages.length === 1 ? '' : 's'}</em></div><img class="chev" src="${S3('ic-chevron.svg')}" alt=""></div>
      </div>
      <div class="pfoot"><button class="btn" data-action="done">Done</button><p class="foot-note">A copy of this summary is on WhatsApp.</p></div>`;
    },
    mount: (el) => el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-action="copy"]');
      if (c) { navigator.clipboard?.writeText(App.config.ref).catch(() => {}); c.querySelector('span').textContent = 'Copied'; }
      if (e.target.closest('[data-action="done"]')) location.href = '../';
    }),
  });
})();
