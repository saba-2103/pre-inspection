/* V2 · Stage 1 · Inside the car (landscape): RC (card/paper toggle) → verdict → RC back → verdict → odometer → verdict
   → windshield video → sunroof video. Figma section 648:21105. Good videos save with an undo toast on the next screen. */
(function () {
  const { A } = U;
  const P = (f) => A('photo/' + f);
  const F = App.flow;
  const paper = () => App.state.rcType === 'paper';
  const pill = (key, label, stage = 's1') => ({ label, ...F.pos(F[stage](), key) });
  const next = (key) => App.go(App.nextAfter(F.after(key)));

  /* small still for toasts: the current camera frame, or the screen's sample still */
  U.thumb = (fallback) => {
    try {
      const f = App.Camera.frame();
      if (f && App.Camera.source === App.Camera.video) {
        const c = document.createElement('canvas'); c.width = 160; c.height = Math.round((f.height / f.width) * 160);
        c.getContext('2d').drawImage(f, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.7);
      }
    } catch (e) {}
    return fallback;
  };

  /* ---------- photo capture + verdict pair ---------- */
  const photoItem = (U.photoItem = function (o) {
    // o = { id, key(), label(), win, fallback(), example, target, hint, ok(), caption(), ask, box, verdictNode, node, title, pillHtml? }
    App.screen({
      id: o.id, node: o.node, title: o.title, orientation: 'landscape', className: `cam c-${o.win}`,
      vo: () => o.caption(),
      render: () => U.cam({
        win: o.win, pill: o.pillHtml ? null : pill(o.key(), o.label(), o.stage), pillHtml: o.pillHtml && o.pillHtml(),
        target: o.target, example: o.example, hint: o.hint, toast: U.takeToast(),
      }),
      mount: (el) => {
        if (o.mount) o.mount(el);
        return U.mountCam(el, {
          fallback: o.fallback(), exit: o.exit || 'inside', hint: o.hint, live: { ok: o.ok() },
          onShot: (cap) => { App.save(o.key(), cap); App.go(o.id + '-ok'); },
        });
      },
    });
    App.screen({
      id: o.id + '-ok', node: o.verdictNode, title: o.title.replace('capture', 'verdict'), orientation: 'landscape', className: 'verdict',
      render: () => {
        const p = pill(o.key(), o.label(), o.stage);
        return U.verdict({ label: `${p.label} · ${p.i} of ${p.n}`, cap: App.capture(o.key()), fallback: o.fallback(), ask: o.ask, box: o.box });
      },
      mount: (el) => U.mountVerdict(el, {
        onUse: () => next(o.key()),
        onRetake: () => { App.drop(o.key()); App.go(o.id); },
      }),
    });
  });

  // 08 RC front · card (649:21404) / 08b paper (649:21444) → 09 verdict (649:21502)
  photoItem({
    id: 'rc', node: '649:21404', verdictNode: '649:21502', title: '08 · RC front capture (card / paper toggle)', win: 'card',
    key: () => (paper() ? 'rcPaper' : 'rcFront'), label: () => (paper() ? 'Paper RC' : 'RC front'),
    pillHtml: () => `<div class="rc-toggle"><button data-rc="card" class="${paper() ? '' : 'on'}">Card RC</button><button data-rc="paper" class="${paper() ? 'on' : ''}">Paper RC</button></div>`,
    fallback: () => P(paper() ? 'rc-paper.jpg' : 'rc-front.jpg'),
    hint: { text: 'Fit the RC inside the frame' },
    ok: () => (paper() ? 'Paper RC detected · hold still' : 'Front side detected · hold still'),
    caption: () => (paper() ? 'Now, capture your paper RC. Lay it flat with all four corners inside the frame.' : 'Now, capture the front of your RC card. Have a paper RC? Switch at the top.'),
    ask: 'Can you read the reg. number? Tap Use photo.',
    mount: (el) => el.querySelector('.rc-toggle').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rc]');
      if (!b || b.dataset.rc === App.state.rcType) return;
      App.state.rcType = b.dataset.rc;
      App.rerender();
    }),
  });
  // 10 RC back · capture (649:21554) → 11 verdict (649:21616)
  photoItem({
    id: 'rc-back', node: '649:21554', verdictNode: '649:21616', title: '10 · RC back capture', win: 'card',
    key: () => 'rcBack', label: () => 'RC back', fallback: () => P('rc-back.jpg'),
    hint: { text: 'Flip the card · fit it inside the frame' },
    ok: () => 'Back side detected · hold still',
    caption: () => 'Now, flip the card and capture the back.',
    ask: 'Can you read the owner name? Tap Use photo.',
  });
  // 12 Odometer · coach (649:21668, too dark 649:21729) → 13 verdict (649:21789, blurry 649:21839)
  photoItem({
    id: 'odo', node: '649:21668', verdictNode: '649:21789', title: '12 · Odometer capture (coach)', win: 'wide',
    key: () => 'odometer', label: () => 'Odometer', fallback: () => P('odo.jpg'), example: P('odo.jpg'),
    target: { l: 74.2, t: 47.9, w: 17.6, h: 15.4, label: 'km reading' },
    hint: { text: 'Fit the km reading inside the box' },
    ok: () => 'km reading is clear · hold still',
    caption: () => 'Now, capture the km reading. Keep it clear, inside the frame.',
    ask: 'Can you read the km clearly? Tap Use photo.',
    box: { l: 64.4, t: 51.3, w: 22.4, h: 13.3 },
  });

  /* ---------- video items: windshield (649:21892) and sunroof (649:21963) ---------- */
  const videoItem = (U.videoItem = function (o) {
    App.screen({
      id: o.id, node: o.node, title: o.title, orientation: 'landscape', className: 'cam c-wide vid',
      vo: o.caption,
      render: () => U.cam({
        win: 'wide', pill: pill(o.key, o.label, o.stage), shutter: 'video', hint: o.hint, toast: U.takeToast(),
        topLeft: `<div class="rec-pill"><i></i><b>REC 0:00</b></div>${o.skip ? `<button class="skip-pill" data-action="skip">No sunroof? Skip</button>` : ''}`,
        extra: o.noPace ? '' : `<div class="pace"><i class="trk"></i><i class="done"></i><i class="dot"></i><svg class="arrow" viewBox="0 0 14 16"><path d="M2 2l10 6-10 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`,
      }),
      mount: (el) => {
        if (o.skip) el.querySelector('[data-action="skip"]').addEventListener('click', () => next(o.key));
        return U.mountCam(el, {
          fallback: P(o.photo), exit: o.exit || 'inside', hint: o.hint, live: { ok: o.ok },
          lockHint: () => el.dataset.rec === 'on',
          video: {
            min: 10,
            onStart: () => {
              el.querySelector('[data-hint]').innerHTML = U.hintHtml({ kind: 'ok', text: o.pace });
              el.querySelector('[data-caption]').textContent = o.during;
            },
            onDone: (cap) => {
              cap.poster = cap.poster || U.thumb(P(o.photo));
              App.save(o.key, cap);
              U.setToast({ img: cap.poster, title: `${o.label} saved`, sub: `${Math.round(cap.duration)} s · ${o.savedNote || 'steady pace'}`, undo: { drop: () => App.drop(o.key), go: o.id } });
              next(o.key);
            },
          },
        });
      },
    });
  });
  videoItem({
    id: 'ws', key: 'windshield', label: 'Windshield', node: '649:21892', title: '14 · Windshield video', photo: 'ws.jpg',
    hint: { text: 'Start at the left edge, then tap Record' }, ok: 'Windshield in frame · tap Record',
    pace: 'Good pace · keep moving right',
    caption: 'Now, record the windshield. Start at the left edge, then tap Record.',
    during: 'Keep moving slowly to the right edge of the windshield.',
  });
  videoItem({
    id: 'roof', key: 'roof', label: 'Sunroof', node: '649:21963', title: '15 · Sunroof video', photo: 'roof.jpg', skip: true,
    hint: { text: 'Start at the front edge, then tap Record' }, ok: 'Sunroof in frame · tap Record',
    pace: 'Good pace · keep moving back',
    caption: 'Now, the sunroof. Start at the front edge and pan slowly to the back.',
    during: 'Keep moving slowly to the back edge of the sunroof.',
  });
})();
