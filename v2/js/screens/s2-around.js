/* V2 · Stage 2 · Around the car (landscape, no rotation): step out → VIN → verdict → bonnet + engine sound
   → 10-angle walk-around (auto-advance with undo toast; a failed check stops with a verdict) → damages map
   (tap a panel → close-up + wide shot → type) → turn upright. Figma section 648:21111. */
(function () {
  const { A, esc } = U;
  const P = (f) => A('photo/' + f);
  const F = App.flow;
  const st = App.state;

  /* ---------- 16 Step out · Around the car (651:21580) ---------- */
  const PLAN = {
    vin: ['vin.jpg', 'VIN', 'Bottom of the windshield, driver side', 'Photo'],
    engine: ['engine.jpg', 'Engine sound', 'Open the bonnet, engine running', 'Video · 10 s'],
    walk: ['walk-1.jpg', 'Walk-around', '10 photos, saved as you walk', 'Photo × 10'],
    damages: ['dmg.jpg', 'Damages', 'Tap the car map, if any', 'Optional'],
  };
  App.screen({
    id: 'step-out', node: '651:21580', title: '16 · Step out · Around the car', orientation: 'landscape', className: 's2-out',
    render: () => {
      U.takeToast(); // stage 1's last save is confirmed by the "saved" chip here
      const s1 = F.s1(), saved = s1.filter((x) => App.capture(x.key)).length;
      const rows = [...F.s2().map((x) => x.key), 'damages'];
      return `${U.status()}
      <div class="so-body">
        <div class="so-left">
          <span class="so-chip">✓ Inside the car · ${saved} of ${s1.length} saved</span>
          <p class="so-h">Now, step out of the car</p>
          <p class="so-s">Keep the engine running and the phone sideways. Stand at the front of the car to begin.</p>
          <i class="sp"></i>
          <button class="btn" data-go="${F.stage2Start()}">I'm at the front · start</button>
        </div>
        <div class="so-plan card"><p class="ph">STAGE 2 OF 3 · ABOUT 5 MIN</p>${rows.map((k, i) => { const [img, t, s, m] = PLAN[k]; return `${i ? '<i class="divider"></i>' : ''}
          <div class="pr2"><span class="th"><img src="${P(img)}" alt=""></span><div class="pt"><b>${t}</b><em>${s}</em></div><span class="m">${m}</span></div>`; }).join('')}</div>
      </div>`;
    },
  });

  /* ---------- 17 VIN · coach (651:21659) → 18 verdict (651:21722) ---------- */
  U.photoItem({
    id: 'vin', stage: 's2', exit: 'step-out', node: '651:21659', verdictNode: '651:21722', title: '17 · VIN capture (coach)', win: 'wide',
    key: () => 'vin', label: () => 'VIN', fallback: () => P('vin.jpg'), example: P('vin-example.jpg'),
    target: { l: 23.05, t: 70.9, w: 55.9, h: 23.1, label: 'VIN plate' },
    hint: { text: 'Fit the VIN plate inside the box' },
    ok: () => 'VIN plate is sharp · hold still',
    caption: () => 'Find the VIN at the bottom of the windshield, driver side. Fit it inside the box.',
    ask: 'Can you read all 17 characters? Tap Use photo.',
  });

  /* ---------- 19 Bonnet + engine sound (651:21774): open the bonnet right here, close it before the walk-around ---------- */
  U.videoItem({
    id: 'engine', stage: 's2', exit: 'step-out', key: 'engine', label: 'Engine sound', node: '651:21774', title: '19 · Bonnet + engine sound',
    photo: 'engine.jpg', noPace: true, savedNote: 'clear audio',
    hint: { text: 'Open the bonnet, then tap Record' }, ok: 'Engine in frame · tap Record',
    pace: 'Engine sound is clear · hold still',
    caption: 'Open the bonnet and keep the engine running. Then tap Record.',
    during: 'Bonnet open, engine running. Hold the phone over the engine until the ring fills.',
  });

  /* ---------- 20–29 Walk-around (652:21644 … 652:22529): one spatial progress ring, auto-advance ---------- */
  const HOLD = 'Hold still and walk slowly to the next spot.';
  const WALK = [
    { name: 'Front', short: 'Front', photo: 'walk-1.jpg', node: '652:21644', hint: 'Stand at the front, then hold still', cap: 'Now, the walk-around. Start at the front and keep the whole car in the frame.' },
    { name: 'Front-left corner', short: 'Front-left', photo: 'walk-2.jpg', node: '652:21745', hint: 'Walk to the front-left corner, then hold still', cap: 'Now, capture the front left. Keep the whole car inside the frame.' },
    { name: 'Left side, front half', short: 'Left front half', photo: 'walk-left.jpg', crop: 'l', node: '652:21805', hint: 'Walk to the left side, then hold still', cap: HOLD },
    { name: 'Left side, rear half', short: 'Left rear half', photo: 'walk-left.jpg', crop: 'r', node: '652:21890', hint: 'Walk to the rear half, then hold still', cap: HOLD },
    { name: 'Rear-left corner', short: 'Rear-left', photo: 'walk-5.jpg', node: '652:21994', hint: 'Walk to the rear-left corner', cap: HOLD },
    { name: 'Rear', short: 'Rear', photo: 'walk-6.jpg', node: '652:22099', hint: 'Walk to the back of the car', cap: HOLD },
    { name: 'Rear-right corner', short: 'Rear-right', photo: 'walk-7.jpg', node: '652:22205', hint: 'Walk to the rear-right corner', cap: HOLD },
    { name: 'Right side, rear half', short: 'Right rear half', photo: 'walk-right.jpg', crop: 'l', node: '652:22312', hint: 'Walk to the right side, then hold still', cap: HOLD },
    { name: 'Right side, front half', short: 'Right front half', photo: 'walk-right.jpg', crop: 'r', node: '652:22420', hint: 'Walk to the front half, then hold still', cap: HOLD },
    { name: 'Front-right corner', short: 'Front-right', photo: 'walk-10.jpg', node: '652:22529', hint: 'Last one · walk to the front-right corner', cap: 'Last one. Keep the whole car inside the frame.' },
  ];
  U.WALK = WALK;
  const wkey = (n) => 'walk_' + n;
  // ring positions (top-down car, front up), Figma 652:21666
  const POS = [[55, 13], [30.5, 21.5], [15.5, 42.5], [15.5, 67.5], [30.5, 88.5], [55, 97], [79.5, 88.5], [94.5, 67.5], [94.5, 42.5], [79.5, 21.5]];
  const ring = (cur) => `<svg class="wring" viewBox="0 0 110 110"><rect width="110" height="110" rx="20" fill="#0C1126" fill-opacity=".62"/>
    <circle cx="55" cy="55" r="42" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2" stroke-dasharray="3 5"/>
    <rect x="42" y="33" width="26" height="44" rx="9" fill="#fff" fill-opacity=".9"/><rect x="45" y="40" width="20" height="8" rx="3" fill="#0C1126" fill-opacity=".5"/>
    ${POS.map(([x, y], i) => {
      const n = i + 1;
      if (n === cur) return `<circle cx="${x}" cy="${y}" r="11" fill="#1C3095" fill-opacity=".35"/><circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`;
      if (App.capture(wkey(n))) return `<circle cx="${x}" cy="${y}" r="7" fill="#32D583"/><path d="M${x - 3.2} ${y + .2}l2.2 2.2 4.2-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      return `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" fill-opacity=".45"/>`;
    }).join('')}</svg>`;
  const NEXT = ['front-left corner', 'left side', 'left rear half', 'rear-left corner', 'rear', 'rear-right corner', 'right side', 'right front half', 'front-right corner'];

  WALK.forEach((w, i) => {
    const n = i + 1;
    const afterWalk = () => App.nextAfter(n < 10 ? `walk-${n + 1}` : 'damages');
    // the bonnet is only opened for the engine sound: close it before the walk-around starts
    const bonnet = () => n === 1 && App.capture('engine');
    App.screen({
      id: `walk-${n}`, node: w.node, title: `${20 + i} · Walk-around ${n} of 10 · ${w.name}`, orientation: 'landscape', className: 'cam c-wide walk',
      vo: () => (bonnet() ? 'Close the bonnet. ' : '') + w.cap,
      render: () => U.cam({
        win: 'wide', pill: { label: w.name, i: n, n: 10 }, ring: `<div class="ring-wrap">${ring(n)}</div>`,
        hint: { icon: 'walk', text: bonnet() ? 'Close the bonnet, then stand at the front' : w.hint }, toast: U.takeToast(),
        extra: n < 10 ? `<span class="next-chip"><img src="${A('cam/walk-ic.svg')}" alt="">Next: ${NEXT[i]}</span>` : '',
      }),
      mount: (el) => U.mountCam(el, {
        fallback: P(w.photo), fallbackCrop: w.crop, exit: 'step-out',
        hint: { icon: 'walk', text: bonnet() ? 'Close the bonnet, then stand at the front' : w.hint }, live: { ok: 'Whole car in frame · hold still' },
        onShot: (cap) => {
          App.save(wkey(n), cap);
          if (cap.quality && cap.quality.ok === false) { st.walkBad = n; return App.go('walk-check'); }
          U.setToast({ img: cap.url, title: `${w.short} saved`, sub: 'Sharp, whole car in frame', undo: { drop: () => App.drop(wkey(n)), go: `walk-${n}` } });
          App.go(afterWalk());
        },
      }),
    });
  });
  // a failed walk-around check stops the flow with a specific retake hint
  App.screen({
    id: 'walk-check', title: 'Walk-around · failed check', orientation: 'landscape', className: 'verdict',
    render: () => {
      const n = st.walkBad || 1, w = WALK[n - 1];
      return U.verdict({ label: `${w.name} · ${n} of 10`, cap: App.capture(wkey(n)), fallback: P(w.photo), ask: '' });
    },
    mount: (el) => U.mountVerdict(el, {
      onUse: () => { const n = st.walkBad || 1; App.go(App.nextAfter(n < 10 ? `walk-${n + 1}` : 'damages')); },
      onRetake: () => { const n = st.walkBad || 1; App.drop(wkey(n)); App.go(`walk-${n}`); },
    }),
  });

  /* ---------- 30 / 32 Damages map (653:21804 / 653:21944) ---------- */
  // panels of the top-down map (Figma vectors 653:21956 …): front, roof, rear and the four doors
  const PANELS = [
    { id: 'front', name: 'Front bumper', d: 'M120.5 60.5C150.5 49.8 180.5 49.8 210.5 60.5L206.5 92.5H124.5Z' },
    { id: 'roof', name: 'Roof', d: 'M130 96.5H200A6 6 0 0 1 206 102.5V160.5A6 6 0 0 1 200 166.5H130A6 6 0 0 1 124 160.5V102.5A6 6 0 0 1 130 96.5Z' },
    { id: 'rear', name: 'Rear bumper', d: 'M124.5 170.5H206.5L210.5 196.5C180.5 207.2 150.5 207.2 120.5 196.5Z' },
    { id: 'lf', name: 'Left front door', d: 'M108 92.5H111A4 4 0 0 1 115 96.5V128.5A4 4 0 0 1 111 132.5H108A4 4 0 0 1 104 128.5V96.5A4 4 0 0 1 108 92.5Z' },
    { id: 'lr', name: 'Left rear door', d: 'M108 136.5H111A4 4 0 0 1 115 140.5V172.5A4 4 0 0 1 111 176.5H108A4 4 0 0 1 104 172.5V140.5A4 4 0 0 1 108 136.5Z' },
    { id: 'rf', name: 'Right front door', d: 'M219 92.5H222A4 4 0 0 1 226 96.5V128.5A4 4 0 0 1 222 132.5H219A4 4 0 0 1 215 128.5V96.5A4 4 0 0 1 219 92.5Z' },
    { id: 'rr', name: 'Right rear door', d: 'M219 136.5H222A4 4 0 0 1 226 140.5V172.5A4 4 0 0 1 222 176.5H219A4 4 0 0 1 215 172.5V140.5A4 4 0 0 1 219 136.5Z' },
  ];
  const MARK = { front: [165, 74], roof: [165, 131], rear: [165, 189], lf: [99, 112], lr: [99, 156], rf: [231, 112], rr: [231, 156] };
  const TYPES = ['Dent', 'Scratch', 'Crack', 'Other'];
  const map = () => {
    const tagged = {};
    st.damages.forEach((d, i) => { (tagged[d.panel] = tagged[d.panel] || []).push(i + 1); });
    return `<svg class="dmap" viewBox="0 0 330 250">
      <rect x=".5" y=".5" width="329" height="249" rx="16" fill="#fff" stroke="#EAECF0"/>
      <text x="165" y="22" class="lab">FRONT</text><text x="165" y="236" class="lab">REAR</text><text x="72" y="102" class="lab">LEFT</text><text x="258" y="102" class="lab">RIGHT</text>
      <rect x="115.75" y="32.75" width="100" height="186" rx="34" fill="#F4F6FB" stroke="#D0D5DD" stroke-width="1.5"/>
      ${PANELS.map((p) => `<path data-panel="${p.id}" class="pnl ${tagged[p.id] ? 'hit' : ''} ${p.id === 'front' ? 'tint' : ''}" d="${p.d}"/>`).join('')}
      ${Object.entries(tagged).map(([pid, nums]) => { const [x, y] = MARK[pid]; return `<g class="mk"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y + 4}">${nums[nums.length - 1]}</text></g>`; }).join('')}
    </svg>`;
  };
  App.screen({
    id: 'damages', node: '653:21804', title: '30 · Damages map (32 · tagged)', orientation: 'landscape', className: 's2-dmg',
    render: () => {
      U.takeToast();
      const d = st.damages;
      return `${U.status()}
      <div class="dm-top"><div><p class="h">Any dents or scratches?</p><p class="s">Tap where the damage is, then take a close-up. Old damage counts too.</p></div><span class="stage-pill">Optional</span></div>
      <div class="dm-map">${map()}</div>
      <div class="dm-side">
        <div class="dm-list">${d.length ? d.map((x, i) => `
          <div class="dm-row"><span class="num">${i + 1}</span><span class="th"><img src="${x.close ? x.close.url : P('dmg.jpg')}" alt=""></span>
            <div class="pt"><b>${esc(PANELS.find((p) => p.id === x.panel).name)}</b><em>Close-up + wide shot</em></div>
            ${x.type ? `<button class="type" data-retype="${i}">${x.type}</button>` : `<div class="types">${TYPES.map((t) => `<button data-type="${t}" data-i="${i}">${t}</button>`).join('')}</div>`}
          </div>`).join('') : `<div class="dm-empty card"><b>Nothing tagged yet</b><p>Tap a panel on the map. You take a close-up, then a wide shot. Old damage counts too.</p></div>`}
          <button class="dm-add" data-action="add"><img src="${A('cam/plus.svg')}" alt="">${d.length ? 'Tap the car map to add another' : 'Tap the car map to start'}</button>
        </div>
        <button class="btn" data-go="upright">${d.length ? `Done · ${d.length} damage${d.length > 1 ? 's' : ''}` : 'No damage · continue'}</button>
      </div>`;
    },
    mount: (el) => el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-panel]');
      if (p) { st.dmgDraft = { panel: p.dataset.panel, step: 'close' }; return App.go('dmg-shot'); }
      const t = e.target.closest('[data-type]');
      if (t) { st.damages[+t.dataset.i].type = t.dataset.type; return App.rerender(); }
      const r = e.target.closest('[data-retype]');
      if (r) { st.damages[+r.dataset.retype].type = null; return App.rerender(); }
      if (e.target.closest('[data-action="add"]')) el.querySelector('.dmap').classList.add('nudge'), setTimeout(() => el.querySelector('.dmap')?.classList.remove('nudge'), 900);
    }),
  });

  /* ---------- 31 Damage close-up (653:21881) + wide shot ---------- */
  App.screen({
    id: 'dmg-shot', node: '653:21881', title: '31 · Damage close-up / wide shot', orientation: 'landscape', className: 'cam c-wide',
    vo: () => ((st.dmgDraft || {}).step === 'wide' ? 'Now step back and capture the whole panel.' : 'Now, a close-up of the damage. Next, step back for a wide shot.'),
    render: () => {
      const dr = st.dmgDraft || { panel: 'rear', step: 'close' };
      const name = PANELS.find((p) => p.id === dr.panel).name, wide = dr.step === 'wide';
      return U.cam({
        win: 'wide', pillHtml: `<div class="cpill"><p>${esc(name)} · ${wide ? 'wide shot 2 of 2' : 'close-up 1 of 2'}</p><i><b style="width:${wide ? 100 : 50}%"></b></i></div>`,
        example: wide ? null : P('dmg-example.jpg'), toast: U.takeToast(),
        hint: { text: wide ? 'Step back · show the whole panel' : 'Get close · fill the frame with the damage' },
      });
    },
    mount: (el) => {
      const dr = st.dmgDraft || (st.dmgDraft = { panel: 'rear', step: 'close' });
      const wide = dr.step === 'wide';
      return U.mountCam(el, {
        fallback: P('dmg.jpg'), exit: 'damages',
        hint: { text: wide ? 'Step back · show the whole panel' : 'Get close · fill the frame with the damage' },
        live: { ok: wide ? 'Whole panel in frame · hold still' : 'Damage in focus · hold still' },
        onShot: (cap) => {
          App.Uploads.add(cap);
          if (!wide) {
            dr.close = cap; dr.step = 'wide';
            U.setToast({ img: cap.url, title: 'Close-up saved', sub: 'Now a wide shot of the panel', undo: { drop: () => { dr.close = null; dr.step = 'close'; }, go: 'dmg-shot' } });
            return App.rerender();
          }
          st.damages.push({ panel: dr.panel, type: null, close: dr.close, wide: cap });
          st.dmgDraft = null;
          App.go(App.nextAfter('damages'));
        },
      });
    },
  });

  /* ---------- 33 Turn upright (653:22018): all captures done; portrait continues to review ---------- */
  App.screen({
    id: 'upright', node: '653:22018', title: '33 · Turn upright', orientation: 'landscape', className: 's2-up',
    turnTo: 'portrait', next: () => 'review',
    render: () => {
      const inside = F.s1().filter((x) => App.capture(x.key)).length;
      const around = (App.capture('vin') ? 1 : 0) + (App.capture('engine') ? 1 : 0) + WALK.filter((_, i) => App.capture(wkey(i + 1))).length;
      return `${U.status()}
      <div class="up-body" data-go="review">
        <span class="tbox"><img src="${A('s0/ic-rotate.svg')}" alt=""></span>
        <p class="up-h">All captures done</p>
        <p class="up-s">Turn your phone upright to review. We continue as soon as it's in portrait.</p>
        <div class="up-chips"><span>✓ Inside the car · ${inside}</span><span>✓ Around the car · ${around}</span>${st.damages.length ? `<span>✓ Damages · ${st.damages.length}</span>` : ''}</div>
        <p class="up-tap device-only">Desktop preview: click to continue</p>
      </div>`;
    },
    mount: () => { if (!App.state.rotLock) return null; const t = setTimeout(() => App.go('review'), 2500); return () => clearTimeout(t); },
  });
})();
