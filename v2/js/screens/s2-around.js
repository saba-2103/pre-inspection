/* V2 · Stage 2 · Around the car (landscape): step out → VIN → engine sound → close bonnet + 360° intro → 10-angle
   walk-around (auto-advance, orbit status) → all captured → damages. Figma 669:30753 §5–6. */
(function () {
  const { A, I, esc } = U;
  const IMG = (f) => A('img/' + f);
  const P = (f) => A('photo/' + f);
  const F = App.flow;
  const st = App.state;
  const next = (key) => App.go(App.nextAfter(F.after(key)));
  const recTime = () => U.fmt(Math.max(0, (Date.now() - (st.recT0 || Date.now())) / 1000));

  /* ---------- Step out (692:68759) → Around the car agenda (728:55318 / only mandatory 730:55433) ---------- */
  const S2_ROWS = {
    vin: { src: P('vin.jpg'), t: 'VIN', s: () => 'Bottom of the windshield, driver side', kind: 'Photo' },
    engine: { src: P('engine.jpg'), t: 'Engine sound', s: () => 'Open the bonnet, engine running', kind: 'Video' },
    walk: { src: A('walk/w2.jpg'), t: 'Walk-around', s: () => '10 photos, saved as you walk', kind: 'Photo' },
  };
  const STEP_OUT_VO = "Please step out of the car. Keep the engine running. Recording is still on. Tap Done once you're outside.";
  App.screen({
    id: 'step-out', node: '692:68759', title: 'Stage 2 · step out + agenda', orientation: 'landscape', className: 's2-ag',
    vo: () => (st.seen['step-out'] ? "Next, we'll capture the following items, one by one. Tap Continue Inspection." : STEP_OUT_VO),
    render: () => {
      if (!st.recT0) st.recT0 = Date.now();
      const rows = F.s2().map((x) => x.key).filter((k) => S2_ROWS[k]);
      return `${U.status()}
      <div class="ag-nav">${U.logo()}${U.vo()}</div>
      <div class="ag-body">
        <div class="ag-left">
          <div class="ag-top"><span class="recchip"><img src="${I('rec-dot-10.svg')}" alt="">RECORDING STILL IN PROGRESS</span>
            <p class="h">Around the car</p><p class="s">About 5 minutes. The voice guide talks you through each one.</p></div>
          <button class="btn full" data-go="${F.stage2Start()}">Continue inspection</button>
        </div>
        <div class="ag-right">${rows.map((k) => U.agendaRow(S2_ROWS[k])).join('')}</div>
      </div>
      ${st.seen['step-out'] ? '' : `<div class="ov"><div class="lmodal stepout"><p class="mt">Step out of the car</p>
        <div class="car"><img class="flip" src="${IMG(F.has('engine') ? 'car-stepout.png' : 'car-door.png')}" alt=""></div>
        <div class="cta"><p>Tap Done once you’re outside</p><button class="btn full" data-action="done">Done</button></div></div></div>`}`;
    },
    mount: (el) => el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action="done"]')) return;
      st.seen['step-out'] = true;
      App.rerender();
    }),
  });

  /* ---------- VIN (instruction 669:31610 · where? 753:36639 · capture 734:56718 · captured 743:60244) ---------- */
  U.photoStep({
    id: 'vin', node: '734:56718', okNode: '743:60244', title: 'VIN capture', stage: 's2', win: 'vin',
    key: () => 'vin', fallback: () => IMG('cam-vin.jpg'),
    badge: 'Fit the VIN in the frame and tap the shutter',
    modal: () => ({
      vo: 'Now, capture the VIN or chassis number. Look under the bonnet, at the bottom of the windshield, or on the door frame.',
      html: U.lmodal({
        title: 'Capture VIN', sub: 'You’ll find it in one of these spots', cls: 'vinm',
        body: `<div class="spots">${[1, 2, 3].map((n) => `<img src="${IMG(`vin-spot-${n}.jpg`)}" alt="">`).join('')}</div>`,
        foot: '<div class="row"><button class="btn sec flex" data-action="where">Where is VIN?</button><button class="btn flex" data-action="got-it">Got it</button></div>',
      }),
    }),
    vo: 'Fit the VIN in the frame and tap Capture.',
    ask: () => 'Can you read all 17 characters? Tap Use photo.', mode: 'skip',
    onAction: (act, el) => {
      if (act !== 'where') return;
      const f = document.createElement('div');
      f.className = 'fs vinwhere';
      f.innerHTML = `<img src="${IMG('vin-where.png')}" alt="VIN locations: windshield, door frame, engine bay"><button class="x" aria-label="Close"><img src="${I('x-24-w.svg')}" alt=""></button>`;
      f.querySelector('.x').addEventListener('click', (e) => { e.stopPropagation(); f.remove(); });
      el.appendChild(f);
    },
  });

  /* ---------- Engine sound (669:31466 → 734:57042 → 669:31390 → 669:31401 → 743:60359) ---------- */
  U.videoStep({
    id: 'engine', node: '734:57042', okNode: '743:60359', title: 'Engine sound video', stage: 's2', key: 'engine', label: 'Engine sound',
    modal: { title: 'Record Engine Sound', pic: IMG('modal-engine.jpg'), vo: 'Now, record the engine sound. Keep the engine running.' },
    vo: 'Keep it inside the frame and tap Record. Hold for at least 10 seconds.', during: 'Hold steady. Keep the engine running.',
    badge: 'Point at the engine and tap Record. Hold 10 s', badgeOn: 'Hold steady, recording the engine sound',
    fallback: IMG('cam-engine.jpg'), chips: ['Clear audio', '10 s or more'], ask: 'Can you hear the engine clearly? Tap Use video.',
  });

  /* ---------- 360° walk-around (steps 720:48913 … 713:46171) ---------- */
  // ex = angle example (Angle thumbnail 734:57274 …): image + its Figma crop [w%, h%, left%, top%] (none = contain)
  const WALK = [
    { name: 'Front', short: 'Front', ex: 'a1', node: '720:48913', vo: 'Stand in front of the car. Keep the whole car in the frame and tap Capture.' },
    { name: 'Front left', short: 'Front Left', ex: 'a2', crop: [124.47, 121.62, -18.21, -9.38], node: '706:44391', vo: 'Walk slowly to the front left corner, then tap Capture.' },
    { name: 'Left, front half', short: 'Left Front', ex: 'a3', crop: [142.01, 137.65, 16.52, -21.32], node: '706:45179', vo: 'Now, the left side, front half.' },
    { name: 'Left, rear half', short: 'Left Rear', ex: 'a3', crop: [142.01, 137.65, -41.59, -21.32], node: '713:45453', vo: 'Now, the left side, rear half.' },
    { name: 'Rear left', short: 'Rear Left', ex: 'a5', crop: [144.35, 150.83, -22.17, -28.26], node: '713:45571', vo: 'Walk to the rear left corner, then tap Capture.' },
    { name: 'Rear', short: 'Rear', ex: 'a6', node: '713:45691', vo: 'Now, the rear of the car.' },
    { name: 'Rear right', short: 'Rear Right', ex: 'a7', crop: [138.81, 145.05, -19.4, -23.44], node: '713:45811', vo: 'Walk to the rear right corner, then tap Capture.' },
    { name: 'Right, rear half', short: 'Right Rear', ex: 'a8', crop: [140.79, 136.46, -0.01, -21.1], node: '713:45931', vo: 'Now, the right side, rear half.' },
    { name: 'Right, front half', short: 'Right Front', ex: 'a8', crop: [140.79, 136.46, -40.68, -21.1], node: '713:46051', vo: 'Now, the right side, front half.' },
    { name: 'Front right', short: 'Front Right', ex: 'a10', crop: [126.01, 123.13, -8.51, -10.95], node: '713:46171', vo: 'Last one. Walk to the front right corner, then tap Capture.' },
  ].map((w, i) => ({ ...w, photo: A(`walk/w${i + 1}.jpg`) })); // sample stills: Figma 360° step photos
  const exImg = (w) => `<img class="${w.crop ? '' : 'fit'}" src="${A(`angle/${w.ex}.png`)}" alt=""${w.crop ? ` style="width:${w.crop[0]}%;height:${w.crop[1]}%;left:${w.crop[2]}%;top:${w.crop[3]}%"` : ''}>`;
  U.WALK = WALK;
  const wkey = (n) => 'walk_' + n;
  const walkDone = () => WALK.filter((_, i) => App.capture(wkey(i + 1))).length;

  /* orbit status (Capture status 706:44636): dashed ring, top-down car (front down), 10 angles counter-clockwise from
     the front; done = green tick, current = blue dot with a view cone toward the car, numbers for the intro */
  // size: 86 in the shutter rail, 140 in the intro modal and the all-captured summary (everything scales with it)
  U.orbit = (cur, mode, size = 86) => {
    const k = size / 86, R = 37 * k, C = 43 * k;
    const dots = WALK.map((_, i) => {
      const n = i + 1, a = (i * 36 * Math.PI) / 180, x = C + R * Math.sin(a), y = C + R * Math.cos(a);
      if (mode === 'numbers') return `<span class="on num" style="left:${x}px;top:${y}px">${n}</span>`;
      if (n === cur) return `<img class="cone" style="left:${x - 21.6 * k}px;top:${y - 21.3 * k}px;transform:rotate(${-i * 36}deg)" src="${A('cam2/orb-cur.svg')}" alt="">`;
      if (mode === 'all' || App.capture(wkey(n))) return `<button class="on ok" data-angle="${n}" style="left:${x}px;top:${y}px" aria-label="${WALK[i].name}"><img src="${A('cam2/orb-check.svg')}" alt=""></button>`;
      return `<img class="on" style="left:${x}px;top:${y}px" src="${A('cam2/orb-todo.svg')}" alt="">`;
    }).join('');
    return `<div class="orbit ${mode || ''}" style="--k:${k}"><img class="ring" src="${A('cam2/orb-circle.png')}" alt=""><img class="car" src="${A('cam2/orb-car.png')}" alt="">${dots}</div>`;
  };

  const introModal = () => {
    if (App.capture('engine') && !st.seen.bonnetClosed) {
      return { vo: "Please close the bonnet. Tap I'm Ready once it's closed.", html: `<div class="ov"><div class="lmodal stepout"><p class="mt">Close the Bonnet</p>
        <div class="car"><img class="flip" src="${IMG('car-closed.png')}" alt=""></div><button class="btn full" data-action="bonnet-closed">I’m Ready</button></div></div>` };
    }
    if (!st.seen.walkIntro) {
      return { vo: 'Now, record a full round of your car. Make sure the car is always in the frame while moving.',
        html: U.lmodal({ title: '360° walk-around', cls: 'orbm', body: `<div class="orb-wrap">${U.orbit(0, 'numbers', 140)}</div>`, foot: '<button class="btn full" data-action="walk-go">Continue</button>' }) };
    }
    return null;
  };

  WALK.forEach((w, i) => {
    const n = i + 1;
    const modal = () => (n === 1 ? introModal() : null);
    const last = () => { for (let k = 10; k >= 1; k--) if (App.capture(wkey(k))) return App.capture(wkey(k)); return null; };
    App.screen({
      id: `walk-${n}`, node: w.node, title: `360° · step ${n} · ${w.name}`, orientation: 'landscape', className: 'cam walk',
      vo: () => { const m = modal(); return m ? m.vo : w.vo; },
      render: () => {
        const m = modal(), lc = last();
        return U.cam({
          items: F.s2(), cur: 'walk', railCls: 'dark wrail', badge: 'Fit the car in frame and tap on the shutter',
          navLeft: `<span class="wl"><button class="xbtn" data-action="exit" aria-label="Close"><img src="${I('x-20-w.svg')}" alt=""></button>
            <span class="rec"><i></i><b data-rec>REC ${recTime()}</b></span></span>`,
          railTop: U.orbit(n),
          railBottom: `<button class="lthumb" data-action="last" ${lc ? '' : 'disabled'}>${lc ? `<img src="${lc.url}" alt="">` : ''}</button>`,
          extra: `${n > 1 ? `<div class="cue"><img src="${I('arrows.svg')}" alt=""><span>Walk around the car slowly</span><img src="${I('arrows.svg')}" alt=""></div>` : ''}
            <div class="angle"><p class="ah"><span>${n}</span>Capture<br>${esc(w.short)}</p><div class="ai">${exImg(w)}</div></div>`,
        }) + (m ? m.html : '');
      },
      mount: (el) => {
        const iv = setInterval(() => { const r = el.querySelector('[data-rec]'); if (r) r.textContent = `REC ${recTime()}`; }, 1000);
        const off = U.mountCam(el, {
          fallback: w.photo,
          onShot: (cap) => {
            App.save(wkey(n), cap);
            if (cap.quality && cap.quality.ok === false) { st.walkBad = n; return App.go('walk-check'); }
            // auto-advance to the next angle (no preview); retakes started from review/summary go back there
            App.go(App.nextAfter(n < 10 ? `walk-${n + 1}` : 'walk-done'));
          },
          onAction: (act, _el, btn) => {
            if (act === 'exit') App.go('step-out');
            if (act === 'bonnet-closed') { st.seen.bonnetClosed = true; App.rerender(); }
            if (act === 'walk-go') { st.seen.walkIntro = true; el.querySelector('.ov').remove(); App.VO.speak(w.vo); }
            if (act === 'last') {
              const k = WALK.map((_, j) => j + 1).filter((j) => App.capture(wkey(j))).pop();
              if (k) U.fullscreen(el, { cap: App.capture(wkey(k)), src: App.capture(wkey(k)).url, label: WALK[k - 1].name, sub: `${k} of 10` });
            }
          },
        });
        // tap a captured angle on the orbit to retake it, then come back here
        el.addEventListener('click', (e) => {
          const d = e.target.closest('[data-angle]');
          if (!d || +d.dataset.angle === n) return;
          st.returnTo = `walk-${n}`;
          App.go(`walk-${d.dataset.angle}`);
        });
        return () => { clearInterval(iv); off(); };
      },
    });
  });
  // a failed check stops the walk-around with the review panel
  App.screen({
    id: 'walk-check', title: '360° · failed check', orientation: 'landscape', className: 'vpage',
    render: () => {
      const n = st.walkBad || 1, w = WALK[n - 1];
      return U.verdict({ label: `${w.name} · ${n} of 10`, cap: App.capture(wkey(n)), fallback: w.photo, ask: '', mode: 'anyway' });
    },
    mount: (el) => U.mountVerdict(el, {
      cap: App.capture(wkey(st.walkBad || 1)),
      onUse: () => { const n = st.walkBad || 1; App.go(App.nextAfter(n < 10 ? `walk-${n + 1}` : 'walk-done')); },
      onRetake: () => { const n = st.walkBad || 1; App.drop(wkey(n)); App.go(`walk-${n}`); },
    }),
  });

  /* ---------- 360° · All captured (737:58532) ---------- */
  App.screen({
    id: 'walk-done', node: '737:58532', title: '360° · all captured', orientation: 'landscape', className: 'vpage wdone',
    vo: 'All 10 photos are done. Tap Continue.',
    render: () => `${U.status()}
      <div class="vrow">
        <div class="gal">${WALK.map((w, i) => { const c = App.capture(wkey(i + 1)); return `
          <button class="gi" data-retake="${i + 1}"><span class="gp"><img src="${c ? c.url : w.photo}" alt=""></span><span class="gl">${w.name}</span></button>`; }).join('')}</div>
        <div class="vside"><div class="top"><p class="lab">${F.label('walk')}</p>
          <div class="head"><i><img src="${I('check-16-w.svg')}" alt=""></i><p>Completed</p></div>
          <div class="orb-big">${U.orbit(0, 'all', 140)}</div></div>
          <div class="bot"><div class="row"><button class="btn flex" data-action="continue">Continue</button></div></div></div>
      </div>`,
    mount: (el) => el.addEventListener('click', (e) => {
      const r = e.target.closest('[data-retake]');
      if (r) { st.returnTo = 'walk-done'; return App.go('walk-' + r.dataset.retake); }
      if (e.target.closest('[data-action="continue"]')) next('walk');
    }),
  });

  /* ---------- Damages (instruction 669:31435 · capture 743:60679 · captured 743:61225 / multiple 743:74173) ---------- */
  App.screen({
    id: 'damages', node: '743:60679', title: 'Damages (capture any, Finish)', orientation: 'landscape', className: 'cam dmg',
    vo: () => (!st.seen.damages ? "Now, capture any dents, scratches or damages. Tap Skip if there are no damages."
      : st.damages.length ? 'Got it. Capture the next one, or tap Finish.' : "Go close, don't zoom, and tap Capture. Tap Finish when you're done."),
    render: () => {
      const last = st.damages[st.damages.length - 1];
      return U.cam({
        items: F.s2(), cur: 'damages', railCls: 'dark drail',
        railBottom: `<button class="lthumb" data-action="last" ${last ? '' : 'disabled'}>${last ? `<img src="${last.close.url}" alt="">` : ''}</button>`,
        extra: `<button class="btn finish" data-action="finish">Finish</button>${st.damages.length ? `<span class="dcount">${st.damages.length} captured</span>` : ''}`,
      }) + (st.seen.damages ? '' : U.lmodal({
        title: 'Capture Any Damages', sub: 'Skip if there are no damages', cls: 'dmgm',
        body: `<div class="dimg"><img src="${IMG('modal-dmg.jpg')}" alt=""></div>`,
        foot: '<div class="row"><button class="btn flex" data-action="capture-dmg">Capture</button><button class="btn sec" data-action="skip-dmg">Skip</button></div>',
      }));
    },
    mount: (el) => U.mountCam(el, {
      fallback: IMG('cam-dmg.jpg'),
      onShot: (cap) => { App.Uploads.add(cap); st.damages.push({ close: cap }); App.rerender(); },
      onAction: (act) => {
        if (act === 'capture-dmg') { st.seen.damages = true; el.querySelector('.ov').remove(); App.VO.speak("Go close, don't zoom, and tap Capture. Tap Finish when you're done."); }
        if (act === 'skip-dmg') { st.seen.damages = true; st.damages = []; next('damages'); }
        if (act === 'finish') next('damages');
        if (act === 'last' && st.damages.length) { const d = st.damages[st.damages.length - 1]; U.fullscreen(el, { cap: d.close, src: d.close.url, label: `Damage ${st.damages.length}` }); }
      },
    }),
  });
})();
