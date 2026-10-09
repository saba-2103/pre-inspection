/* Group E — Stage 2: 360° walkaround (10 angles) + damages.
   Figma: 360-Instruction 346:38068, 360-Context 346:36915, S1..S10 Capture/Captured/Captured-FS, Damages 155:67019/66860/66654/67135. */
(function () {
  const { A, esc } = C;
  const N = 10;
  const NUMS = Array.from({ length: N }, (_, i) => String(i + 1));
  // Angle-list labels exactly as in the frames
  const LABELS = ['Front', 'Front Left', 'Left Half', 'Left Half 2', 'Rear Left', 'Rear', 'Rear Right', 'Right Half', 'Right Half 2', 'Front Right'];
  // Per step: Figma title name, capture node, captured node, fs node, info badge (frame text), VO (annotation text)
  const STEPS = [
    ['Front', '346:36914', '2:2113', '534:32755', 'Fit the car in frame and tap on the shutter', '"Now, capture the front. Keep it inside the frame and tap Capture."'],
    ['Front Right', '155:57184', '155:56979', '534:32787', 'Fit the Front Right in frame and tap on the shutter', '"Hold still and walk slowly to the next spot. Now, capture the front left.”'],
    ['Right Half 1', '155:57414', '155:57392', '534:32819', 'Fit the front side of Right Half in frame and tap on the shutter', '"Hold still and walk slowly to the next spot. Now, capture the left side front half.”'],
    ['Right Half 2', '155:57830', '155:57808', '534:32851', 'Fit the backside of Right Half in frame and tap on the shutter', '"Now, capture the left side rear half."'],
    ['Rear Right', '155:58243', '155:58221', '534:32881', 'Fit the Rear Right part in frame and tap on the shutter', '"Now, capture the rear left.”'],
    ['Rear', '155:58656', '155:58634', '534:32916', 'Fit the Rear side of the car in frame and tap on the shutter', '"Now, capture the rear."'],
    ['Rear Left', '155:59070', '155:59048', '534:32948', 'Fit the Rear Left in frame and tap on the shutter', '"Now, capture the rear right."'],
    ['Left Half 1', '155:59484', '155:59462', '534:32980', 'Fit the backside of the Left Half in frame and tap on the shutter', '"Now, capture the right side rear half."'],
    ['Left Half 2', '155:59920', '155:59876', '534:33009', 'Fit the front side of the Left Half in frame and tap on the shutter', '"Now, capture the right side front half."'],
    ['Front Left', '155:59937', '155:59898', '534:33044', 'Fit the Front Left part in frame and tap on the shutter', '"Now, capture the front right."'],
  ];
  const SCROLL = [0, 0, 94, 188, 282, 376, 470, 564, 678, 660]; // Angles List scroll offset per step (Figma)
  const key = (n) => 'v360_' + n;
  const photo = (n) => A('e/photo-' + n + '.jpg');
  const thumbOf = (n) => { const c = App.capture(key(n)); return c && c.kind === 'photo' ? c.url : photo(n); };

  /* Angles list (left rail). cur = 1-based current step; mode 'capture' | 'captured' */
  const angles = (cur) => `
    <div class="ang-list" data-scroll="${SCROLL[cur - 1]}"><div class="ang-col">${LABELS.map((label, i) => {
      const n = i + 1;
      const st = n < cur ? 'done' : n === cur ? 'current' : 'todo';
      const head = st === 'done' ? `<img class="ck" src="${A('e/check.svg')}" alt="">` : `<span class="num">${n}</span>`;
      const img = st === 'done' ? `<img class="ph" src="${thumbOf(n)}" alt="">` : `<img src="${A('e/thumb-' + n + '.png')}" alt="">`;
      return `<div class="ang ${st}"><div class="ang-h">${head}<p>${esc(label)}</p></div><div class="ang-img">${img}</div></div>`;
    }).join('')}</div></div>`;

  const recBadge = (cls = '') => `<div class="rec ${cls}"><img src="${A('e/dot.svg')}" alt=""><span>RECORDING</span></div>`;
  const moveArrow = (cls = '') => `<div class="move-arrow ${cls}"><img src="${A('e/arrows.svg')}" alt=""><span>Walk around the car slowly</span><img src="${A('e/arrows.svg')}" alt=""></div>`;
  const backBtn = (to) => `<div class="lhs"><button class="back-btn" data-go="${to}"><img src="${A('e/back.svg')}" alt=""><span>Back</span></button></div>`;
  const withBack = (html, to) => html.replace(/<div class="lhs">[\s\S]*?<\/div>/, backBtn(to));

  /* 360 capture screen (also the background of the Instruction & Context screens) */
  const capHtml = (n, o = {}) => {
    const alt = !!o.alt;
    let html = C.captureScreen({
      stepper: alt ? null : C.steps(NUMS, n - 1),
      cutout: alt ? { left: 128, top: 34, width: 594, height: 356, radius: 0, ring: false } : { left: 128, top: 94, width: 594, height: 274, radius: 20 },
      badge: o.badge || STEPS[n - 1][4],
      zoom: false,
      overlayHtml: `${n > 1 ? moveArrow(alt ? 'alt' : '') : ''}${angles(n)}
        <img class="minimap" src="${A('e/minimap-' + n + '.png')}" alt="">${recBadge(alt ? 'alt' : '')}`,
      extra: o.extra || '',
    });
    html = withBack(html, n === 1 ? 'v360-context' : `v360-${n - 1}-captured`);
    if (n === 1) html = html.replace('<p class="shutter-label">Capture</p>', '<p class="shutter-label">Capture<br>Front</p>');
    return html;
  };

  const scrollAngles = (el) => { const l = el.querySelector('.ang-list'); if (l) l.scrollTop = +l.dataset.scroll || 0; };

  /* ---------- 360 Instruction (346:38068) ---------- */
  App.screen({
    id: 'v360-instr', node: '346:38068', title: '360° - Instruction', orientation: 'landscape', className: 'capture v360 v360-instr', rotate: 'rotate-s2',
    vo: '“Now, record a full round of your car."',
    render: () => capHtml(1, { extra: `
      <div class="v360-ov"><div class="i-modal">
        <p class="i-title">Record 360° Walkaround</p>
        <div class="i-img"><div class="i-pic"><img src="${A('e/instr-360.png')}" alt=""></div></div>
        <button class="btn btn-primary btn-modal" data-go="v360-context">Continue</button>
      </div></div>` }),
    mount: (el) => { scrollAngles(el); return C.mountCapture(el, { customShutter: true, fallbackImg: photo(1) }); },
  });

  /* ---------- 360 Context — Do's & Don'ts (346:36915) ---------- */
  const tip = (img, title, cap) => ({ img, title, cap });
  const DOS = [tip(1, 'Move around the car smoothly', 'Keep the vehicle within frame from all angles'), tip(2, 'Move closer to capture damages', 'Pause, capture the damage, then return to the same position')];
  const DONTS = [tip(3, 'Don’t continue from<br>close-up view', 'Step back to your original path before continuing'), tip(4, 'Don’t rejoin the walkaround path diagonally', 'Return to the walkaround path<br>in the same line')];
  const ctxCol = (cls, icon, head, tips) => `
    <div class="c-col">
      <div class="c-head ${cls}"><img src="${A('e/' + icon + '.svg')}" alt=""><p>${head}</p></div>
      <div class="c-body">
        <div class="c-row c-titles">${tips.map((t) => `<p>${t.title}</p>`).join('')}</div>
        <div class="c-row c-pics">${tips.map((t) => `<div class="c-pic"><img src="${A('e/ctx-' + t.img + '.png')}" alt=""></div>`).join('')}</div>
        <div class="c-row c-caps">${tips.map((t) => `<p>${t.cap}</p>`).join('')}</div>
      </div>
    </div>`;
  App.screen({
    id: 'v360-context', node: '346:36915', title: '360° - Context', orientation: 'landscape', className: 'capture v360 v360-ctx', rotate: 'rotate-s2',
    vo: '"Start at the front and walk slowly around it."',
    render: () => capHtml(1, { extra: `
      <div class="v360-ov"><div class="c-card">
        <div class="c-cols">${ctxCol('do', 'radio', 'Do’s', DOS)}<div class="c-sep"></div>${ctxCol('dont', 'close', 'Don’ts', DONTS)}</div>
        <button class="btn btn-primary btn-modal c-btn" data-go="v360-1-capture">Capture</button>
      </div></div>` }),
    mount: (el) => { scrollAngles(el); return C.mountCapture(el, { customShutter: true, fallbackImg: photo(1) }); },
  });

  /* ---------- 10 steps × capture / captured / fullscreen ---------- */
  STEPS.forEach(([name, capNode, cpdNode, fsNode, , vo], i) => {
    const n = i + 1;
    const next = n < N ? `v360-${n + 1}-capture` : 'damages-instr';
    App.screen({
      id: `v360-${n}-capture`, node: capNode, title: `360° - Step ${n} - ${name} Capture`, orientation: 'landscape', className: 'capture v360 v360-cap', rotate: 'rotate-s2',
      vo,
      render: () => capHtml(n),
      mount: (el) => { scrollAngles(el); return C.mountCapture(el, { key: key(n), next: `v360-${n}-captured`, fallbackImg: photo(n) }); },
    });
    App.screen({
      id: `v360-${n}-captured`, node: cpdNode, title: `360° - Step ${n} - ${name} Captured`, orientation: 'landscape', className: 'captured v360 v360-cpd', rotate: 'rotate-s2',
      render: () => `
        ${C.header({ stepper: C.steps(NUMS, n - 1, { captured: true }), chrome: false })}
        <div class="body">
          ${angles(n)}
          <div class="content"><div class="pic" data-go="v360-${n}-fs">${C.media(App.capture(key(n)), photo(n), 'muted')}</div>${C.homeIndicator()}</div>
          <div class="ctas">
            ${C.button({ label: 'Previous', variant: 'grey', go: n > 1 ? `v360-${n - 1}-captured` : null, disabled: n === 1 })}
            ${C.button({ label: 'Retake', variant: 'outline', go: `v360-${n}-capture` })}
            ${C.button({ label: 'Next', next })}
          </div>
        </div>`,
      mount: (el) => { scrollAngles(el); },
    });
    App.screen({
      id: `v360-${n}-fs`, node: fsNode, title: `360° - Step ${n} - ${name} Captured Preview`, orientation: 'landscape', className: 'fs v360-fs', rotate: 'rotate-s2',
      render: () => C.fsScreen({ key: key(n), close: `v360-${n}-captured`, fallback: photo(n) }),
    });
  });

  /* Extra variant of Step 2 capture (581:20934): full-height camera window, no stepper, badges moved */
  App.screen({
    id: 'v360-2-capture-alt', node: '581:20934', title: '360° - Step 2 - Front Right Capture (full-height variant)', orientation: 'landscape', className: 'capture v360 v360-cap v360-alt', rotate: 'rotate-s2',
    vo: STEPS[1][5],
    render: () => capHtml(2, { alt: true, badge: 'Fit the Front Right to the screen and tap on the shutter' }),
    mount: (el) => { scrollAngles(el); return C.mountCapture(el, { key: key(2), next: 'v360-2-captured', fallbackImg: photo(2) }); },
  });

  /* ---------- Damages ---------- */
  const S2 = () => (App.config.optional ? ['VIN', 'Engine Sound', 'Exterior Walkthrough', 'Damages'] : ['Exterior Walkthrough', 'Damages']);
  const dmgHtml = (o = {}) => {
    const d = App.state.damages;
    const last = d[d.length - 1];
    const thumb = last ? `<img src="${last.url}" alt="">` : o.sample ? `<img src="${A('e/dmg-sample.jpg')}" alt="">` : '';
    return C.captureScreen({
      stepper: C.steps(S2(), S2().length - 1),
      cutout: { left: 20, top: 94, width: 702, height: 274, radius: 20 },
      badge: 'Fit the Damages in frame and tap on the shutter',
      zoom: false,
      overlayHtml: `
        <div class="d-thumbs"><div class="d-thumb">${thumb}</div><p class="d-count">${d.length} captured</p></div>
        <div class="d-finish">${C.button({ label: 'Finish', next: 'review' })}</div>`,
      extra: o.extra || '',
    });
  };
  const dmgMount = (el, onDismiss) => C.mountCapture(el, {
    multi: true, fallbackImg: A('e/dmg-sample.jpg'), onDismiss,
    next: () => (App.current === 'damages-captured' ? null : App.go('damages-captured')),
    onShot: () => {
      // already on the captured screen: update thumbnail + count in place (multiple-captures state, 155:67135)
      const d = App.state.damages;
      el.querySelector('.d-thumb').innerHTML = `<img src="${d[d.length - 1].url}" alt="">`;
      el.querySelector('.d-count').textContent = `${d.length} captured`;
      el.classList.toggle('multi', d.length > 1);
    },
  });

  App.screen({
    id: 'damages-instr', node: '155:67019', title: 'Damages - Instruction', orientation: 'landscape', className: 'capture dmg dmg-instr', rotate: 'rotate-s2',
    vo: '"Now, capture any dents or scratches. Tap Skip if there are no damages.”',
    render: () => dmgHtml({ extra: `
      <div class="instr-overlay" data-instr><div class="d-modal">
        <div class="d-titles"><p class="d-title">Capture Any Damages</p><p class="d-sub">Skip if there are no damages</p></div>
        <div class="d-imgs">${[['Capture closeups clearly', 1], ['Move closer, do not zoom to capture', 2], ['Capture multiple photos', 3]]
          .map(([t, k]) => `<div class="d-tip"><img src="${A('e/dmg-instr-' + k + '.png')}" alt=""><p>${t}</p></div>`).join('')}</div>
        <div class="d-btns">
          <button class="btn btn-primary btn-modal" data-action="dismiss-instr">Capture</button>
          ${C.button({ label: 'Skip', variant: 'outline', next: 'review', cls: 'btn-skip' })}
        </div>
      </div></div>` }),
    mount: (el) => dmgMount(el, () => App.go('damages-capture', true)),
  });
  App.screen({
    id: 'damages-capture', node: '155:66860', title: 'Damages - Capture', orientation: 'landscape', className: 'capture dmg', rotate: 'rotate-s2',
    vo: '“Go close, don\'t zoom, and tap Capture. Tap Finish when all damages are captured.”',
    render: () => dmgHtml(),
    mount: (el) => dmgMount(el),
  });
  // Damages - Captured 1 (155:66654); with >1 captures this is the "Captured Multiple" state (155:67135)
  App.screen({
    id: 'damages-captured', node: '155:66654', title: 'Damages - Captured', orientation: 'landscape', className: 'capture dmg', rotate: 'rotate-s2',
    render: () => dmgHtml({ sample: true }),
    mount: (el) => { el.classList.toggle('multi', App.state.damages.length > 1); return dmgMount(el); },
  });
})();
