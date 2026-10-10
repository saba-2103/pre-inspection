/* Group C — Stage 1 photo captures: RC type, RC paper / RC card front+back, Odometer.
   Figma header "4 / Stage 1 - Capture RC (Front & Back), Odometer, Windshield (O), Rooftop (O)". */
(function () {
  const { A, esc } = C;
  const CUT_CARD = { left: 185, top: 82, width: 480, height: 284 }; // Overlay 2:2179 / 2:2230
  const CUT_PAPER = { left: 95, top: 94, width: 660, height: 272 }; // Overlay 136:40791
  const BADGE_RC = 'Fit the RC in frame and tap on the shutter';
  const RC_ASPECT = 2880 / 1716; // Figma captured image 195 / 196
  const isPaper = () => App.state.rcType === 'paper';

  /* ---------- 4.1 Retake scenarios (509:18553 / 512:18648 / 512:18742) ----------
     Captured review driven by the real capture's quality (App.Quality):
       bad + mandatory → "Error - Mandatory Retake" (info line + Retake only)
       bad + optional  → "Error - Retake/Skip"     (info line + Retake | Skip)
       good            → "No Error - Retake/Proceed" (= normal captured layout: Retake | Next)
     o = {stepper, key, fs, retake, next, fallback, aspect, optional} */
  C.qcCaptured = (o) => {
    const cap = App.capture(o.key);
    const q = (cap && cap.quality) || { ok: true };
    const bad = !!cap && q.ok === false;
    const ar = cap && cap.w && cap.h ? cap.w / cap.h : o.aspect || 662 / 272;
    const msg = q.dark ? 'Image is too dark. Please click again' : 'Image is blurred. Please click again';
    const buttons = !bad
      ? [{ label: 'Retake', variant: 'outline', go: o.retake }, { label: 'Next', next: o.next }]
      : o.optional
        ? [{ label: 'Retake', variant: 'outline', go: o.retake, cls: 'c-grow' }, { label: 'Skip', variant: 'skip', action: 'qc-skip' }]
        : [{ label: 'Retake', variant: 'outline', go: o.retake, cls: 'c-retake-only' }];
    return `
      ${C.header({ stepper: o.stepper, chrome: false })}
      <div class="captured-img" style="aspect-ratio:${ar}" ${o.fs ? `data-go="${o.fs}"` : ''}>${C.media(cap, o.fallback)}</div>
      ${C.footer({
        cls: 'captured-footer',
        before: bad ? `<div class="c-info-line"><img src="${A('c/danger.svg')}" alt=""><p>${esc(msg)}</p></div>` : '',
        buttons,
      })}`;
  };
  // Skip (optional items only): drop the bad capture and move on.
  C.qcMount = (el, o) => {
    const h = (e) => {
      if (!e.target.closest('[data-action="qc-skip"]')) return;
      delete App.state.captures[o.key];
      App.go(App.nextAfter(o.next));
    };
    el.addEventListener('click', h);
  };

  /* Fullscreen preview with the capture's own aspect (design: 597.5×356 for RC) */
  const fs = (o) => {
    const cap = App.capture(o.key);
    const ar = cap && cap.w && cap.h ? cap.w / cap.h : o.aspect;
    return C.fsScreen(o).replace('<div class="media">', `<div class="media" style="aspect-ratio:${ar}">`);
  };

  /* White instruction modal (RC paper / card): title · reference image · Capture.
     img = {src, l, t, w, h}: Figma render bounds of the image (shadow baked in) inside the 440×140 image box. */
  const sheet = (title, img) => `
    <div class="instr-overlay" data-instr>
      <div class="instr-modal c-sheet">
        <p class="title">${esc(title)}</p>
        <div class="c-sheet-img"><img src="${img.src}" alt="" style="left:${img.l}px;top:${img.t}px;width:${img.w}px;height:${img.h}px"></div>
        <button class="btn btn-primary btn-modal" data-action="dismiss-instr">Capture</button>
      </div>
    </div>`;

  /* ---------- RC Type (42:5183; Paper selected 136:41079; Card selected 136:41182) ---------- */
  const typeCard = (type, label, sel, img) => {
    const on = sel === type;
    return `
      <button class="c-type-card ${on ? 'sel' : ''} ${sel && !on ? 'dim' : ''}" data-rc="${type}">
        <div class="c-type-head"><p>${label}</p><img src="${A(on ? 'c/check-bold.svg' : 'c/radio-empty.svg')}" alt=""></div>
        <img class="c-type-img" src="${img.src}" alt="" style="left:${img.l}px;width:${img.w}px">
      </button>`;
  };
  const typeCards = (sel) =>
    typeCard('paper', 'RC Paper', sel, { src: A('c/type-paper.png'), l: 0, w: 214 }) +
    typeCard('card', 'RC Card', sel, { src: A('c/type-card.png'), l: 9.85, w: 194.31 });
  App.screen({
    id: 'rc-type', node: '42:5183', title: 'RC Type', orientation: 'landscape', className: 'capture c-rc c-type', rotate: 'rotate-s1',
    vo: '“Do you have a RC paper or RC card?"',
    render: () => {
      const sel = App.state.rcType;
      return C.captureScreen({
        stepper: C.stageSteps(1, 'RC (Front)'),
        cutout: CUT_CARD,
        badge: BADGE_RC,
        zoom: false,
        extra: `
          <div class="instr-overlay">
            <div class="instr-modal c-sheet">
              <p class="title">Select your type of RC</p>
              <div class="c-types">${typeCards(sel)}</div>
              <button class="btn btn-modal ${sel ? 'btn-primary' : 'c-disabled'}" data-action="rc-continue">Continue</button>
            </div>
          </div>`,
      });
    },
    mount: (el) => {
      const cleanup = C.mountCapture(el, { customShutter: true });
      el.addEventListener('click', (e) => {
        const card = e.target.closest('[data-rc]');
        if (card) {
          // update in place (no rerender) so the VO doesn't replay
          App.state.rcType = card.dataset.rc;
          el.querySelector('.c-types').innerHTML = typeCards(App.state.rcType);
          el.querySelector('[data-action="rc-continue"]').classList.replace('c-disabled', 'btn-primary');
          return;
        }
        if (e.target.closest('[data-action="rc-continue"]') && App.state.rcType) App.go(isPaper() ? 'rc-paper-instr' : 'rc-front-instr');
      });
      return cleanup;
    },
  });

  /* ---------- generic RC capture flow ---------- */
  function rcFlow(d) {
    const capture = (withInstr) => () => C.captureScreen({
      stepper: d.stepper(),
      cutout: d.cut,
      badge: BADGE_RC,
      zoom: false,
      extra: withInstr ? sheet(d.instrTitle, d.instrImg) : '',
    });
    App.screen({
      id: d.p + '-instr', node: d.nodes[0], title: d.titles[0], orientation: 'landscape', className: 'capture c-rc', rotate: 'rotate-s1',
      vo: d.vo[0],
      render: capture(true),
      mount: (el) => C.mountCapture(el, { key: d.key, next: d.p + '-captured', onDismiss: () => App.go(d.p + '-capture', true) }),
    });
    App.screen({
      id: d.p + '-capture', node: d.nodes[1], title: d.titles[1], orientation: 'landscape', className: 'capture c-rc', rotate: 'rotate-s1',
      vo: d.vo[1],
      render: capture(false),
      mount: (el) => C.mountCapture(el, { key: d.key, next: d.p + '-captured' }),
    });
    const qc = () => ({
      stepper: d.stepper(true), key: d.key, fs: d.p + '-fs', retake: d.p + '-capture', next: d.next(),
      fallback: d.sample, aspect: d.aspect,
    });
    App.screen({
      id: d.p + '-captured', node: d.nodes[2], title: d.titles[2], orientation: 'landscape', className: 'captured c-cap', rotate: 'rotate-s1',
      render: () => C.qcCaptured(qc()),
      mount: (el) => C.qcMount(el, qc()),
    });
    App.screen({
      id: d.p + '-fs', node: d.nodes[3], title: d.titles[3], orientation: 'landscape', className: 'fs c-fs', rotate: 'rotate-s1',
      render: () => fs({ key: d.key, close: d.p + '-captured', fallback: d.sample, aspect: d.aspect }),
    });
  }

  // RC paper: Instruction 136:40977 · Capture 136:41342 · Captured 136:40599 (+ 4.1 retake states) · Preview 513:21883
  rcFlow({
    p: 'rc-paper', key: 'rcPaper', nodes: ['136:40977', '136:41342', '136:40599', '513:21883'],
    titles: ['RC (Paper) - Instruction', 'RC (Paper) - Capture', 'RC (Paper) - Captured', 'RC (Paper) - Captured Preview'],
    vo: ['"Now, capture your RC paper."', '"Keep it flat, inside the frame, and tap Capture."'],
    stepper: (captured) => C.stageSteps(1, 'RC Paper', { captured }),
    cut: CUT_PAPER,
    instrTitle: 'Capture RC Paper',
    instrImg: { src: A('c/paper-instr.png'), l: 86.36, t: -6, w: 267.28, h: 229 },
    sample: A('c/paper-sample.png'), aspect: RC_ASPECT,
    next: () => 'odo-instr',
  });
  // RC card front: Instruction 136:40877 · Capture 136:39356 · Captured 2:1642 · Preview 516:31918
  rcFlow({
    p: 'rc-front', key: 'rcFront', nodes: ['136:40877', '136:39356', '2:1642', '516:31918'],
    titles: ['RC (Card - Front) - Instruction', 'RC (Card - Front) - Capture', 'RC (Card - Front) - Captured', 'RC (Card - Front) - Captured Preview'],
    vo: ['"Now, capture the front of your RC card."', '"Keep it inside the frame and tap Capture."'],
    stepper: (captured) => C.stageSteps(1, 'RC (Front)', { captured }),
    cut: CUT_CARD,
    instrTitle: 'Capture RC Card (Front)',
    instrImg: { src: A('c/front-instr.png'), l: 81.31, t: -6, w: 277.38, h: 229 },
    sample: A('c/front-sample.png'), aspect: RC_ASPECT,
    next: () => 'rc-back-instr',
  });
  // RC card back: Instruction 42:5232 · Capture 136:39934 · Captured 2:1660 · Preview 516:31947
  rcFlow({
    p: 'rc-back', key: 'rcBack', nodes: ['42:5232', '136:39934', '2:1660', '516:31947'],
    titles: ['RC (Card - Back) - Instruction', 'RC (Card - Back) - Capture', 'RC (Card - Back) - Captured', 'RC (Card - Back) - Captured Preview'],
    vo: ['"Now, capture the back of your RC card."', '"Keep it inside the frame and tap Capture."'],
    stepper: (captured) => C.stageSteps(1, 'RC (Back)', { captured }),
    cut: CUT_CARD,
    instrTitle: 'Capture RC Card (Back)',
    instrImg: { src: A('c/back-instr.png'), l: 81.31, t: -6, w: 277.38, h: 229 },
    sample: A('c/back-sample.png'), aspect: RC_ASPECT,
    next: () => 'odo-instr',
  });

  /* ---------- Odometer ---------- */
  // stepper follows the chosen RC path (Figma frames show the card path)
  const odoSteps = (captured) => C.stageSteps(1, 'Odometer', { captured });
  // Odometer — Instruction (42:5163) = capture screen + instruction modal
  // Odometer — Capture (132:37989)
  const odoCapture = (withInstr) => () => C.captureScreen({
    stepper: odoSteps(),
    badge: 'Fit the Odometer Reading in frame and tap on the shutter',
    instruction: withInstr ? { title: 'Capture Odometer', image: A('c/odo-instr-bg.png'), button: 'Capture' } : null,
  });
  const odoNext = () => App.route.afterOdometer();

  App.screen({
    id: 'odo-instr', node: '42:5163', title: 'Odometer - Instruction', orientation: 'landscape', className: 'capture c-odo', rotate: 'rotate-s1',
    vo: '"Now, capture the odometer reading."',
    render: odoCapture(true),
    mount: (el) => C.mountCapture(el, { key: 'odometer', next: 'odo-captured', onDismiss: () => App.go('odo-capture', true) }),
  });
  App.screen({
    id: 'odo-capture', node: '132:37989', title: 'Odometer - Capture', orientation: 'landscape', className: 'capture c-odo', rotate: 'rotate-s1',
    vo: '"Keep it clear, inside the frame, and tap Capture."',
    render: odoCapture(false),
    mount: (el) => C.mountCapture(el, { key: 'odometer', next: 'odo-captured' }),
  });
  // Odometer — Captured (2:1626) (+ 4.1 retake states)
  const odoQC = () => ({ stepper: odoSteps(true), key: 'odometer', fs: 'odo-fs', retake: 'odo-capture', next: odoNext(), fallback: A('c/odo-sample.png'), aspect: 662 / 272 });
  App.screen({
    id: 'odo-captured', node: '2:1626', title: 'Odometer - Captured', orientation: 'landscape', className: 'captured c-cap', rotate: 'rotate-s1',
    render: () => C.qcCaptured(odoQC()),
    mount: (el) => C.qcMount(el, odoQC()),
  });
  // Odometer — Captured Preview (516:31976)
  App.screen({
    id: 'odo-fs', node: '516:31976', title: 'Odometer - Captured Preview', orientation: 'landscape', className: 'fs c-fs', rotate: 'rotate-s1',
    render: () => fs({ key: 'odometer', close: 'odo-captured', fallback: A('c/odo-sample.png'), aspect: 866.4 / 356 }),
  });
})();
