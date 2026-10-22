/* V2 · Onboarding (portrait): WhatsApp → internal setup → loading → welcome (+ volume modal) → prerequisites
   → permissions → Stage 1 agenda with the get-ready sheets (bonnet, sit, ignition). Figma 669:30753 sections 0–3. */
(function () {
  const { A, I, esc } = U;
  const IMG = (f) => A('img/' + f);
  const WA = (f) => A('wa/' + f);
  const cfg = App.config;
  const st = App.state;

  /* ---------- WhatsApp message (669:30772) ---------- */
  const verified = (pre) => `<span class="ver"><img src="${WA(pre + '-bg.svg')}" alt=""><img class="ck" src="${WA(pre + '-a.svg')}" alt=""></span>`;
  App.screen({
    id: 'whatsapp', node: '669:30772', title: 'WhatsApp message', className: 's0-wa',
    render: () => `
      ${U.status()}
      <div class="wa-bar"><img class="back" src="${WA('back.svg')}" alt="">
        <span class="av"><img src="${I('logo-mark.svg')}" alt=""></span>
        <div class="who"><p>Anaira ${verified('ver')}</p><span>Business Account</span></div>
        <img class="more" src="${WA('more.svg')}" alt=""></div>
      <div class="wa-chat">
        <span class="date">23 April 2026</span>
        <div class="acct">
          <span class="big"><img src="${I('logo-mark.svg')}" alt=""></span>
          <p class="nm">Anaira ${verified('ver2')}</p>
          <p class="since">Business account • Joined in September, 2025</p>
          <i class="ln"></i>
          <p class="offers">You are getting offers and announcements from this business</p>
          <div class="ab"><span><img src="${WA('hand.svg')}" alt="">Stop</span><span>Profile</span></div>
        </div>
        <div class="msg"><img class="tail" src="${WA('bubble.svg')}" alt="">
          <div class="bub">
            <div class="body"><b>Hi ${esc(cfg.owner)}, your car needs a quick pre-inspection</b>
              <p>🚘 ${esc(cfg.reg)} · ${esc(cfg.model)}<br>🛡️ Policy ${esc(cfg.policy)} · renewal<br><br>📱Just about 10 minutes<br>🔊 Step by step voice guided<br><br>🌞 Start next to your car, in daylight<br>🚨 Link valid until 25 Apr, 6:00 PM</p></div>
            <p class="from">Anaira</p><p class="time">11.14 AM</p>
            <button data-go="items"><img src="${WA('link.svg')}" alt="">Start inspection</button>
            <button data-action="remind"><img src="${WA('link.svg')}" alt="">Remind later</button>
          </div>
        </div>
      </div>
      <div class="wa-input"><div class="box"><span><img src="${WA('emoji.svg')}" alt="">Type a message</span><span><img src="${WA('attach.svg')}" alt=""><img src="${WA('camera.svg')}" alt=""></span></div>
        <span class="mic"><img src="${WA('mic.svg')}" alt=""></span></div>
      ${U.home()}`,
    mount: (el) => el.querySelector('[data-action="remind"]').addEventListener('click', () => U.snack(el, "We'll remind you at 6:00 PM today")),
  });

  /* ---------- Internal demo setup (not in Figma; from V1): optional captures on/off ---------- */
  const ITEMS = [
    ['Inside the car', [
      { name: 'RC', sub: 'Photo · card or paper' }, { name: 'Odometer', sub: 'Photo' },
      { key: 'windshield', name: 'Windshield', sub: 'Video' }, { key: 'roof', name: 'Sunroof', sub: 'Video' },
    ]],
    ['Around the car', [
      { key: 'vin', name: 'VIN', sub: 'Photo' }, { key: 'engine', name: 'Engine sound', sub: 'Video · adds the bonnet steps' },
      { name: '360° walk-around', sub: 'Photos × 10' }, { name: 'Damages', sub: 'Photos, if any' },
    ]],
  ];
  App.screen({
    id: 'items', title: 'Internal · demo setup', className: 's0-items pg', scroll: true,
    render: () => U.page({
      nav: U.nav(''),
      body: `<p class="internal">Internal · Demo setup — not shown to customers</p>
        ${ITEMS.map(([sec, list]) => `
          <div class="sec"><p class="sec-h">${sec}</p><div class="rows">${list.map((it) => `
            <label class="row ${it.key ? '' : 'req'}">
              <div class="txt"><p class="name">${esc(it.name)}${it.key ? '<span class="opt">Optional</span>' : ''}</p><p class="sub">${esc(it.key ? it.sub : it.sub + ' · Required')}</p></div>
              <input type="checkbox" ${it.key ? `data-item="${it.key}" ${App.flow.has(it.key) ? 'checked' : ''}` : 'checked disabled'} aria-label="${esc(it.name)}">
            </label>`).join('')}</div></div>`).join('')}`,
      foot: U.foot('<button class="btn lg full" data-go="loading">Start demo</button>'),
    }),
    mount: (el) => el.addEventListener('change', (e) => { const k = e.target.dataset.item; if (k) st.items[k] = e.target.checked; }),
  });

  /* ---------- Loading (669:30755) ---------- */
  // number plate (Progress/Number plate loader 669:32424); on loading a light sweep runs across it (Start → End, 1.2 s)
  const plate = (size = 18, loader) => `<div class="plate-stack"><span class="plate ${loader ? 'loader' : ''}">${loader ? '<i class="sweep"><b></b><b></b></i>' : ''}<span>${esc(cfg.reg)}</span></span><p style="font-size:${size}px">${esc(cfg.model)}</p></div>`;
  App.screen({
    id: 'loading', node: '669:30755', title: 'Loading', className: 's0-load',
    render: () => `${U.status()}${U.browser()}
      <div class="ld-body"><span class="ld-logo">${U.logo()}</span>
        <div class="ld-mid"><p class="ld-t">Opening your inspection...</p>${plate(16, true)}</div></div>
      <div class="abar">${U.home()}</div>`,
    mount: () => { const t = setTimeout(() => App.go('welcome', true), 1900); return () => clearTimeout(t); },
  });

  /* ---------- Welcome (673:60308) + Volume warning (669:33710) ---------- */
  const PLAN = [['1', 'Inside the car', 'RC, odometer, windshield, sunroof', '3 min'], ['2', 'Around the car', 'VIN, engine sound, walk-around, damages', '5 min'], ['3', 'Review and submit', 'Fix anything flagged, then send', '2 min']];
  const WELCOME_VO = "Welcome. Tap Start Inspection when you're next to your car.";
  App.screen({
    id: 'welcome', node: '673:60308', title: 'Welcome (+ volume warning)', className: 's0-wel pg',
    vo: () => (st.volSeen ? WELCOME_VO : null),
    render: () => U.page({
      // the voice guide is always on: the pill is a label, not a switch
      nav: U.nav(`<span class="vo-pill"><img src="${I('volume.svg')}" alt=""><span>Voice guide</span></span>`),
      body: `<div class="wl-title"><p class="h">Let's inspect your car</p>${plate()}</div>
        <div class="wl-plan">${PLAN.map(([n, t, s, m]) => `<div class="wl-row"><span class="num">${n}</span><div class="tx"><div class="tr"><b>${t}</b><span class="time">${m}</span></div><p>${s}</p></div></div>`).join('')}</div>`,
      foot: `<p class="info-line ok"><img src="${I('circle-check-green.svg')}" alt="">Safe, secure, and guided step-by-step</p>
        ${U.foot('<button class="btn lg" data-go="prep">Start Inspection</button>')}`,
    }) + (st.volSeen ? '' : `<div class="ov"><div class="pmodal vol">
        <p class="vt">Turn up the Volume</p><p class="vs">We'll guide you with<br>voice instructions at every step.</p>
        <img class="volimg" src="${IMG('volume.png')}" alt=""><button class="btn full" data-action="vol-done">Done</button></div></div>`),
    mount: (el) => el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="vol-done"]')) {
        st.volSeen = true;
        el.querySelector('.ov').remove();
        App.VO.speak(WELCOME_VO);
      }
    }),
  });

  /* ---------- Prerequisites · Steps 1–6 (727:51221 …) → Done (727:51323) ---------- */
  const PREP = [
    { img: 'pre-key.png', t: 'Car key', s: 'Keep it with you, you will start the engine', vo: "Let's get you ready. Keep your car key with you." },
    { img: 'pre-rc.png', t: 'RC, paper or card', s: 'Registration certificate of the vehicle', vo: 'Keep your RC with you, paper or card.' },
    { img: 'pre-light.png', t: 'Good lighting', s: 'Daylight or a well-lit spot', vo: 'Park in daylight or a well-lit spot.' },
    { img: 'pre-space.png', t: 'Space Around Vehicle', s: 'At least 5 feet on all sides', vo: 'Keep at least 5 feet of space on all sides of the car.' },
    { img: 'pre-glass.png', t: 'Clear Glass', s: 'Windows and windshield clean', vo: 'Make sure the windows and windshield are clean.' },
    { img: 'pre-clean.png', t: 'Clean Vehicle', s: 'Wipe off dust so scratches show', vo: 'Wipe off dust and dirt so scratches show clearly.' },
  ];
  App.screen({
    id: 'prep', node: '727:51221', title: 'Prerequisites · steps 1–6 + done', className: 's0-prep pg',
    vo: () => { const n = st.prep || 0; return n < PREP.length ? PREP[n].vo : 'All set. Tap Continue to begin.'; },
    render: () => {
      const n = st.prep || 0, all = n >= PREP.length;
      return U.page({
        body: `${U.title(all ? 'You are all set!' : `${n}/6 Complete`, 'These quick checks help ensure<br>a smooth inspection and avoid retakes')}
          <div class="pr-card">
            <div class="tabs">${PREP.map((_, i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>
            <div class="list">${PREP.map((p, i) => {
              const cur = i === n;
              return `<div class="it ${cur ? 'cur' : ''}"><div class="ct"><span class="ic"><img src="${IMG(p.img)}" alt=""></span>
                <div class="tx"><b>${p.t}</b>${cur ? `<em>${p.s}</em>` : ''}</div>
                <img class="st" src="${I(i < n ? 'check-22.svg' : 'dashed-22.svg')}" alt=""></div>
                ${cur ? '<div class="cta"><button class="btn" data-action="done">Done</button></div>' : ''}</div>`;
            }).join('')}</div>
          </div>`,
        foot: all ? U.foot('<button class="btn lg" data-go="permissions">Continue</button>') : '',
      });
    },
    mount: (el) => el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action="done"]')) return;
      st.prep = (st.prep || 0) + 1;
      App.rerender();
    }),
  });

  /* ---------- Permissions (674:62018) · Needed / Allowed / Blocked ---------- */
  const PERMS = [
    { key: 'camera', icon: 'perm-camera.png', h: 'Camera access', s: 'To photograph documents and your car' },
    { key: 'microphone', icon: 'perm-mic.png', h: 'Microphone access', s: 'To record engine sound' },
    { key: 'location', icon: 'perm-location.png', h: 'Location access', s: 'Confirms the car was inspected where you are' },
  ];
  const NAMES = { camera: 'camera', microphone: 'microphone', location: 'location' };
  App.screen({
    id: 'permissions', node: '674:62018', title: 'Permissions (needed / allowed / blocked)', className: 's0-perm',
    vo: 'Allow access to your Camera, Microphone, and Location to start the recording.',
    render: () => {
      const s = st.permStatus || {};
      const blocked = PERMS.filter((p) => s[p.key] === 'blocked').map((p) => p.key);
      const chip = (k) => (s[k] === 'allowed' ? '<span class="chip ok">Allowed</span>' : s[k] === 'blocked' ? '<span class="chip bad">Blocked</span>' : '<span class="chip need">Needed</span>');
      return U.page({
        body: `${U.title('3 quick permissions', 'To complete your car inspection smoothly, we’ll need access to a few things on your device.')}
          <div class="pm-list">${PERMS.map((p) => `<div class="pm"><span class="ic"><img src="${IMG(p.icon)}" alt=""></span><div class="tx"><b>${p.h}</b><em>${p.s}</em></div>${chip(p.key)}</div>`).join('')}</div>`,
        foot: `<div class="pm-safe"><span class="sh"><img src="${I('shield-check.svg')}" alt=""></span><div><p>We only use this during inspection.</p>
            <p class="ok"><img src="${I('circle-check-green.svg')}" alt="">Your data is secure.</p></div></div>
          ${U.foot(`<button class="btn lg flex" data-action="allow">Allow access</button>`, 'You can change permissions anytime from your device settings')}
          ${blocked.includes('camera') ? '<button class="pm-skip" data-action="skip">Demo: continue with sample photos</button>'
            : blocked.length ? `<button class="pm-skip" data-action="skip">Continue without ${blocked.map((k) => NAMES[k]).join(' and ')}</button>` : ''}`,
      });
    },
    mount: (el) => {
      // statuses the browser already knows (granted earlier / denied) show before anything is asked
      App.grantedPermissions().then((g) => {
        if (App.current !== 'permissions') return;
        const s = st.permStatus || (st.permStatus = {});
        let changed = false;
        for (const k of Object.keys(NAMES)) {
          const v = g[k] === 'granted' ? 'allowed' : g[k] === 'denied' ? 'blocked' : null;
          if (v && s[k] !== v) { s[k] = v; changed = true; }
        }
        if (changed) App.rerender();
      });
      let busy = false;
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-action]');
        if (!a || busy) return;
        if (a.dataset.action === 'skip') return App.go('inside');
        busy = true; a.disabled = true;
        const r = await App.requestPermissions();
        st.permStatus = Object.fromEntries(Object.keys(NAMES).map((k) => [k, r[k] ? 'allowed' : 'blocked']));
        if (r.camera && r.microphone && r.location) App.go('inside'); else App.rerender();
      });
    },
  });

  /* ---------- Stage 1 · Agenda (677:63466) with the get-ready sheets: Open the bonnet (669:32171, only for engine
     sound), Get settled inside (669:32200), Prepare the vehicle (669:32256) ---------- */
  const flip = (src, cls = '') => `<img class="flip ${cls}" src="${IMG(src)}" alt="">`;
  const twoStep = (rows) => `<div class="two"><div class="nums"><span>1</span><i></i><span>2</span></div><div class="steps">${rows.map(([t, img]) => `
      <div class="stp"><p>${t}</p><div class="pic">${img}</div></div>`).join('')}</div></div>`;
  const SHEETS = {
    bonnet: {
      title: 'Open the Bonnet', vo: "Please open the bonnet. Tap I'm Ready once it's open.", cls: 'auto',
      body: () => `<div class="bonnet"><div class="bimg">${flip('car-bonnet-open.png')}</div></div>`,
    },
    sit: {
      title: 'Get Settled Inside', vo: "Sit in the driver's seat and close all the windows. Tap I'm Ready.",
      // the bonnet is only open when the engine sound is being recorded (bonnet-closed pictures otherwise)
      body: () => twoStep([['Sit on the <b>Driver’s Seat</b>', flip(App.flow.has('engine') ? 'car-door-bonnet.png' : 'car-door.png', 'car')],
        ['Close All the <b>Windows</b>', flip(App.flow.has('engine') ? 'car-bonnet-open.png' : 'car-closed.png', 'car')]]),
    },
    ignition: {
      title: 'Prepare the Vehicle', vo: "Apply the handbrake, then start the engine. Tap I'm Ready.",
      body: () => twoStep([['Apply the <b>Handbrake</b>', `<img class="ph" src="${IMG('handbrake.jpg')}" alt="">`], ['Start the <b>Engine</b>', `<img class="ph" src="${IMG('ignition.jpg')}" alt="">`]]),
    },
  };
  const sheets = () => [...(App.flow.has('engine') ? ['bonnet'] : []), 'sit', 'ignition'];
  const S1_ROWS = {
    rc: { th: 'ag-rc.png', doc: true, t: 'RC', s: () => (st.rcType === 'paper' ? 'The paper copy' : 'Card front and back, or the paper copy'), kind: 'Photo' },
    odometer: { th: 'ag-odo.jpg', t: 'Odometer', s: () => 'A clear shot of the km reading', kind: 'Photo' },
    windshield: { th: 'ag-ws.jpg', t: 'Windshield', s: () => 'Slow pan, cover entire windshield', kind: 'Video' },
    roof: { th: 'ag-roof.jpg', t: 'Sunroof', s: () => 'Slow pan, only if your car has one', kind: 'Video' },
  };
  U.agendaRow = (r) => `<div class="lrow"><span class="th ${r.doc ? 'doc' : ''}"><img src="${r.src || IMG(r.th)}" alt=""></span>
    <div class="tx"><div class="tt"><b>${r.t}</b><em>${r.s()}</em></div>
    <span class="media-badge"><img src="${I(r.kind === 'Video' ? 'video-12.svg' : 'camera-12.svg')}" alt="">${r.kind}</span></div></div>`;
  App.screen({
    id: 'inside', node: '677:63466', title: 'Stage 1 · agenda + get-ready sheets', className: 's0-inside pg',
    vo: () => { const q = sheets(), i = st.s1Sheet || 0; return i < q.length ? SHEETS[q[i]].vo : "Next, we'll capture the following items, one by one. Tap Start capturing to begin."; },
    render: () => {
      const q = sheets(), i = st.s1Sheet || 0, sh = i < q.length ? SHEETS[q[i]] : null;
      const rows = ['rc', ...App.flow.s1().map((x) => x.key).filter((k) => S1_ROWS[k] && k !== 'rcFront')];
      return U.page({
        body: `${U.title('Inside the car', 'About 3 minutes.<br>The voice guide talks you through each one.')}
          <div class="ag-list">${[...new Set(rows)].map((k) => U.agendaRow(S1_ROWS[k])).join('')}</div>`,
        foot: `<div class="ag-note"><img src="${I('info-32.svg')}" alt=""><p>You will complete these items one by one<br>with guided instructions on screen.</p></div>
          ${U.foot('<button class="btn lg" data-go="rc">Start capturing</button>')}`,
      }) + (sh ? U.sheet({ title: sh.title, body: sh.body(), cls: sh.cls }) : '');
    },
    mount: (el) => el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action="sheet-next"]')) return;
      st.s1Sheet = (st.s1Sheet || 0) + 1;
      App.rerender();
    }),
  });
})();
