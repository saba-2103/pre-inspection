/* V2 · Stage 1 · Inside the car (landscape): RC type → RC capture(s) → odometer → windshield / sunroof videos.
   Each item: instruction modal (once) → capture → review panel (Captured / Error / Recorded). Figma 669:30753 §4.
   U.photoStep / U.videoStep are reused by Stage 2. */
(function () {
  const { A, I, esc } = U;
  const IMG = (f) => A('img/' + f);
  const F = App.flow;
  const st = App.state;
  st.seen = st.seen || {};
  const paper = () => st.rcType === 'paper';
  const next = (key) => App.go(App.nextAfter(F.after(key)));
  const list = (stage) => (stage === 's2' ? F.s2() : F.s1());

  /* ---------- photo item: [modal] → camera → review ----------
     o = { id, node, title, stage, key(), win, fallback(), badge, modal() → {html, vo} | null, vo, ask(), mode, zoom, okNode } */
  U.photoStep = function (o) {
    const modal = () => (o.modal && !st.seen[o.id] ? o.modal() : null);
    App.screen({
      id: o.id, node: o.node, title: o.title, orientation: 'landscape', className: 'cam',
      vo: () => { const m = modal(); return m ? m.vo : o.vo; },
      render: () => { const m = modal(); return U.cam({ items: list(o.stage), cur: o.stage === 's2' ? o.step || o.key() : o.key(), win: o.win, badge: o.badge, zoom: o.zoom, torch: true }) + (m ? m.html : ''); },
      mount: (el) => {
        if (!st.recT0) st.recT0 = Date.now(); // the inspection recording runs from the first capture
        if (o.mount) o.mount(el);
        return U.mountCam(el, {
          fallback: o.fallback(),
          onShot: (cap) => { App.save(o.key(), cap); App.go(o.id + '-ok'); },
          onAction: (act) => {
            if (act === 'got-it') { st.seen[o.id] = true; el.querySelector('.ov').remove(); App.VO.speak(o.vo); }
            if (o.onAction) o.onAction(act, el);
          },
        });
      },
    });
    const vopts = () => ({ label: F.label(o.step || o.key()), cap: App.capture(o.key()), fallback: o.fallback(), ask: o.ask(), mode: o.mode });
    App.screen({
      id: o.id + '-ok', node: o.okNode, title: o.title + ' · review', orientation: 'landscape', className: 'vpage',
      render: () => U.verdict(vopts()),
      mount: (el) => U.mountVerdict(el, {
        cap: App.capture(o.key()), fsLabel: F.label(o.step || o.key()).split(' · ')[0],
        onUse: () => next(o.step || o.key()),
        onRetake: () => { App.drop(o.key()); App.go(o.id); },
        onSkip: () => { App.drop(o.key()); next(o.step || o.key()); },
      }),
    });
  };

  /* ---------- video item: modal → record (3-2-1, timer) → recorded panel ----------
     o = { id, node, title, stage, key, modal: {title, pic, pan, vo}, vo, during, badge, badgeOn, fallback, chips, ask, min } */
  U.videoStep = function (o) {
    const modal = () => (!st.seen[o.id] ? o.modal : null);
    App.screen({
      id: o.id, node: o.node, title: o.title, orientation: 'landscape', className: 'cam vid',
      vo: () => (modal() ? o.modal.vo : o.vo),
      render: () => U.cam({ items: list(o.stage), cur: o.key, shutter: 'video', railCls: 'dark', badge: o.badge })
        + (modal() ? U.lmodal({ title: o.modal.title, pic: o.modal.pic, pan: o.modal.pan, foot: '<button class="btn full" data-action="got-it">Got it</button>' }) : ''),
      mount: (el) => U.mountCam(el, {
        fallback: o.fallback,
        onAction: (act) => { if (act === 'got-it') { st.seen[o.id] = true; el.querySelector('.ov').remove(); App.VO.speak(o.vo); } },
        video: {
          min: o.min || 10, during: o.during, badgeOn: o.badgeOn,
          onDone: (cap) => { cap.poster = cap.poster || U.thumb(o.fallback); App.save(o.key, cap); App.go(o.id + '-ok'); },
        },
      }),
    });
    const vopts = () => ({ label: F.label(o.key), cap: App.capture(o.key), poster: (App.capture(o.key) || {}).poster || o.fallback, fallback: o.fallback, ask: o.ask, chips: o.chips });
    App.screen({
      id: o.id + '-ok', node: o.okNode, title: o.title + ' · recorded', orientation: 'landscape', className: 'vpage',
      render: () => U.verdict(vopts()),
      mount: (el) => U.mountVerdict(el, {
        cap: App.capture(o.key), fsLabel: o.label,
        onUse: () => next(o.key),
        onRetake: () => { App.drop(o.key); App.go(o.id); },
      }),
    });
  };

  /* ---------- RC type (727:53032 / paper 727:53049 / card 727:53066) + RC capture ---------- */
  const rcOpts = () => {
    const opt = (t, label, img) => {
      const on = st.rcType === t;
      return `<button class="rco ${on ? 'on' : ''}" data-action="rc-${t}"><span class="rh"><b>${label}</b><img src="${I(on ? 'check-20-brand.svg' : 'dot-20.svg')}" alt=""></span>${img}</button>`;
    };
    return opt('paper', 'RC Paper', `<span class="rp"><img src="${IMG('rc-paper.png')}" alt=""></span>`) + opt('card', 'RC Card', `<span class="rcd"><img src="${IMG('rc-card-front.png')}" alt=""></span>`);
  };
  const rcTypeModal = () => ({
    vo: 'Do you have a RC paper or RC card?',
    html: U.lmodal({
      title: 'Select your type of RC', cls: 'rctype',
      body: `<div class="rcopts">${rcOpts()}</div>`,
      foot: `<button class="btn full" data-action="rc-continue" ${st.rcType ? '' : 'disabled'}>Continue</button>`,
    }),
  });
  const docModal = (title, img, cls) => U.lmodal({ title, cls: 'doc ' + cls, body: `<span class="dimg"><img src="${IMG(img)}" alt=""></span>`, foot: '<button class="btn full" data-action="got-it">Got it</button>' });
  U.photoStep({
    id: 'rc', node: '688:66438', okNode: '678:65248', title: 'RC capture (type → instruction → capture)', stage: 's1', win: 'rc',
    key: () => (paper() ? 'rcPaper' : 'rcFront'),
    fallback: () => IMG(paper() ? 'shot-rc-paper.jpg' : 'cam-rc-card.jpg'),
    badge: 'Fit the RC in the frame and tap the shutter',
    modal: () => (!st.rcChosen ? rcTypeModal()
      : paper() ? { vo: 'Now, capture your paper RC.', html: docModal('Capture RC Paper', 'rc-paper.png', 'paper') }
        : { vo: 'Now, capture the front of your RC card.', html: docModal('Capture RC Card (Front)', 'rc-card-front.png', 'card') }),
    vo: 'Keep it flat, inside the frame, and tap Capture.',
    ask: () => 'Can you read the reg. number? Tap Use photo.', mode: 'retake',
    onAction: (act, el) => {
      // picking a type updates the modal and the stepper in place (V1): no reload, no voice-over replay
      if (act === 'rc-paper' || act === 'rc-card') {
        st.rcType = act.slice(3);
        el.querySelector('.rcopts').innerHTML = rcOpts();
        el.querySelector('[data-action="rc-continue"]').disabled = false;
        el.querySelector('.stepper').outerHTML = U.stepper(F.s1(), paper() ? 'rcPaper' : 'rcFront');
      }
      if (act === 'rc-continue' && st.rcType) { st.rcChosen = true; App.rerender(); }
    },
  });
  U.photoStep({
    id: 'rc-back', node: '688:66437', okNode: '678:65329', title: 'RC card back capture', stage: 's1', win: 'rc',
    key: () => 'rcBack', fallback: () => IMG('cam-rc-back.jpg'),
    badge: 'Fit the RC in the frame and tap the shutter',
    modal: () => ({ vo: 'Now, flip the card and capture the back.', html: docModal('Capture RC Card (Back)', 'rc-card-back.png', 'card') }),
    vo: 'Keep it inside the frame, and tap Capture.',
    ask: () => 'Can you read the owner name or reg. number? Tap Use photo.', mode: 'retake',
  });

  /* ---------- Odometer (instruction 669:30961 · capture 688:66436 · zoom 678:66058 · captured 678:65565) ---------- */
  U.photoStep({
    id: 'odo', node: '688:66436', okNode: '678:65565', title: 'Odometer capture (zoom, too dark)', stage: 's1', win: 'odo', zoom: true,
    key: () => 'odometer', fallback: () => IMG('cam-odo.jpg'),
    badge: 'Fit the dashboard in the frame and tap the shutter',
    modal: () => ({ vo: 'Now, capture the odometer reading.', html: U.lmodal({ title: 'Capture Odometer', pic: IMG('cam-odo.jpg'), foot: '<button class="btn full" data-action="got-it">Got it</button>' }) }),
    vo: 'Keep the reading inside the frame, and tap Capture.',
    ask: () => 'Can you read the km clearly? Tap Use photo.', mode: 'anyway',
  });

  /* ---------- Windshield (669:31431 → 741:59757 → 669:31371 → 669:31377 → 731:56574) and Sunroof (669:31462 …) ---------- */
  U.videoStep({
    id: 'ws', node: '741:59757', okNode: '731:56574', title: 'Windshield video', stage: 's1', key: 'windshield', label: 'Windshield',
    modal: { title: 'Record the Windshield', pic: IMG('modal-ws.jpg'), pan: true, vo: 'Now, record the windshield.' },
    vo: 'Tap Record and pan slowly to capture completely.', during: 'Keep moving slowly.',
    badge: 'Tap Record and pan slowly to capture completely.', badgeOn: 'Pan slowly to capture completely.',
    fallback: IMG('cam-ws.jpg'), chips: ['Steady', 'Well lit'], ask: 'Does it cover the whole windshield? Tap Use video.',
  });
  U.videoStep({
    id: 'roof', node: '741:59756', okNode: '731:56646', title: 'Sunroof video', stage: 's1', key: 'roof', label: 'Sunroof',
    modal: { title: 'Record the Sunroof', pic: IMG('modal-roof.jpg'), pan: true, vo: 'Now, record the sunroof.' },
    vo: 'Tap Record and pan slowly to capture completely.', during: 'Keep moving slowly.',
    badge: 'Tap Record and pan slowly to capture completely.', badgeOn: 'Pan slowly to capture completely.',
    fallback: IMG('cam-roof.jpg'), chips: ['Steady', 'Well lit'], ask: 'Does it cover the whole sunroof? Tap Use video.',
  });
})();
