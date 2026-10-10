/* V2 · Stage 0 · Start (portrait): WhatsApp → internal setup → loading → welcome → have these ready → permissions
   → get into position → inside the car (turn sideways to begin). Figma page "V2", section 648:21099. */
(function () {
  const { A, esc } = U;
  const S0 = (f) => A('s0/' + f);
  const cfg = App.config;
  const snack = (el, text) => {
    const s = document.createElement('div');
    s.className = 'snack'; s.textContent = text;
    el.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  };

  /* ---------- 01 WhatsApp invite (648:21129) ---------- */
  App.screen({
    id: 'whatsapp', title: '01 · WhatsApp invite', className: 's0-wa',
    render: () => `
      ${U.status()}
      <div class="wa-bar"><img class="back" src="${S0('wa-back.svg')}" alt=""><div class="av"><img src="${A('core/logo.svg')}" alt=""></div>
        <div class="who"><p>ACME General Insurance</p><span>Verified business</span></div></div>
      <div class="wa-chat">
        <div class="wa-msg">
          <div class="pic"><img src="${S0('wa-car.png')}" alt=""></div>
          <p class="t">Hi Rahul, your car needs a quick pre-inspection</p>
          <div class="facts">
            <p><img src="${S0('wa-ic-car.svg')}" alt="">${esc(cfg.reg)} · ${esc(cfg.model)}</p>
            <p><img src="${S0('wa-ic-policy.svg')}" alt="">Policy ${esc(cfg.policy)} · renewal</p>
            <p><img src="${S0('wa-ic-clock.svg')}" alt="">About 10 minutes, on this phone</p>
            <p><img src="${S0('wa-ic-pin.svg')}" alt="">Start next to your car, in daylight</p>
            <p><img src="${S0('wa-ic-bell.svg')}" alt="">Link valid until 25 Apr, 6:00 PM</p>
          </div>
          <p class="time">11:14 AM</p>
        </div>
        <button class="wa-btn" data-go="items"><img src="${S0('wa-link.svg')}" alt="">Start inspection</button>
        <button class="wa-btn" data-action="remind"><img src="${S0('wa-remind.svg')}" alt="">Remind me this evening</button>
      </div>
      <div class="wa-input"><span>Message</span></div>`,
    mount: (el) => el.querySelector('[data-action="remind"]').addEventListener('click', () => snack(el, "We'll remind you at 6:00 PM today")),
  });

  /* ---------- Internal demo setup (not in Figma; from V1): optional captures on/off ---------- */
  const ITEMS = [
    ['Interior', [
      { name: 'RC', sub: 'Photo · card or paper' }, { name: 'Odometer Reading', sub: 'Photo' },
      { key: 'windshield', name: 'Windshield', sub: 'Video' }, { key: 'roof', name: 'Sunroof', sub: 'Video' },
    ]],
    ['Exterior', [
      { key: 'vin', name: 'VIN', sub: 'Photo' }, { key: 'engine', name: 'Engine Sound', sub: 'Video · adds the bonnet steps' },
      { name: '360° Walk-around', sub: 'Photos × 10' }, { name: 'Damages', sub: 'Photos · tagged on a car map' },
    ]],
  ];
  App.screen({
    id: 'items', title: 'Internal · demo setup', className: 's0-items', scroll: true,
    render: () => `
      ${U.status()}
      <div class="it-top"><img src="${A('core/logo.svg')}" alt="ACME"></div>
      <div class="it-body">
        <p class="internal">Internal · Demo setup — not shown to customers</p>
        ${ITEMS.map(([sec, list]) => `
          <div class="sec"><p class="sec-h">${sec}</p><div class="rows">${list.map((it) => `
            <label class="row ${it.key ? '' : 'req'}">
              <div class="txt"><p class="name">${esc(it.name)}${it.key ? '<span class="opt">Optional</span>' : ''}</p><p class="sub">${esc(it.key ? it.sub : it.sub + ' · Required')}</p></div>
              <input type="checkbox" ${it.key ? `data-item="${it.key}" ${App.flow.has(it.key) ? 'checked' : ''}` : 'checked disabled'} aria-label="${esc(it.name)}">
            </label>`).join('')}</div></div>`).join('')}
      </div>
      <div class="it-foot"><button class="btn" data-go="loading">Start Demo</button></div>`,
    mount: (el) => el.addEventListener('change', (e) => { const k = e.target.dataset.item; if (k) App.state.items[k] = e.target.checked; }),
  });

  /* ---------- 02 Loading (648:21181) ---------- */
  App.screen({
    id: 'loading', title: '02 · Loading', className: 's0-load',
    render: () => `${U.status()}${U.browser()}
      <div class="ld-body"><img class="ld-logo" src="${A('core/logo.svg')}" alt="ACME">
        <p class="ld-t">Opening your inspection</p><p class="ld-s">${esc(cfg.reg)} · ${esc(cfg.model)}</p>
        <div class="ld-bar"><i></i></div></div>
      <p class="ld-foot">Secure link from ACME General Insurance</p>`,
    mount: () => { const t = setTimeout(() => App.go('welcome', true), 1900); return () => clearTimeout(t); },
  });

  /* ---------- 03 Welcome (648:21300): vehicle card, the plan, voice toggle replaces the volume modal ---------- */
  App.screen({
    id: 'welcome', title: '03 · Welcome', className: 's0-wel', scroll: true,
    render: () => `${U.status()}${U.browser()}
      ${U.top(`<button class="voice" data-action="voice"><img src="${S0('ic-voice.svg')}" alt=""><span>Voice guide</span><i class="sw ${App.VO.muted ? '' : 'on'}"><b></b></i></button>`)}
      <div class="pbody">
        <div class="card veh"><div class="vpic"><img src="${S0('wa-car.png')}" alt=""></div>
          <div class="vtx"><span class="plate">${esc(cfg.reg)}</span><p>${esc(cfg.model)} · 2022 · Policy renewal</p></div></div>
        ${U.head("Let's inspect your car", 'About 10 minutes, all on this phone. Stay next to your car from start to finish.')}
        <div class="card plan">
          ${[['1', 'Inside the car', 'RC, odometer, windshield, sunroof', '3 min'], ['2', 'Around the car', 'VIN, engine sound, walk-around, damages', '5 min'], ['3', 'Review and submit', 'Fix anything flagged, then send', '2 min']]
            .map(([n, t, s, m], i) => `${i ? '<i class="divider"></i>' : ''}<div class="pl"><span class="num">${n}</span><div class="pt"><p>${t}</p><span>${s}</span></div><em>${m}</em></div>`).join('')}
        </div>
        <div class="note-box"><img src="${S0('ic-voice-note.svg')}" alt=""><p>A voice will guide each step, with captions on screen. Turn your volume up.</p></div>
      </div>
      <div class="pfoot"><button class="btn" data-go="ready">Start inspection</button>
        <p class="safe"><img src="${S0('ic-shield-ok.svg')}" alt="">Photos are used only for this inspection</p></div>`,
    mount: (el) => el.querySelector('[data-action="voice"]').addEventListener('click', (e) => {
      App.VO.setMuted(!App.VO.muted);
      e.currentTarget.querySelector('.sw').classList.toggle('on', !App.VO.muted);
    }),
  });

  /* ---------- 04 Have these ready (648:21362): six items on one screen, ticks optional ---------- */
  const PREP = [
    ['BRING', [['prep-key', 'Car key', 'To start the engine'], ['prep-rc', 'RC, paper or card', 'Registration certificate']]],
    ['WHERE', [['prep-light', 'Daylight or a bright spot', 'Avoid shade and night'], ['prep-space', '5 ft clear around the car', 'So you can walk around it']]],
    ['CAR', [['prep-glass', 'Clean glass', 'Windshield and sunroof'], ['prep-dust', 'Wipe off dust', 'So scratches show clearly']]],
  ];
  App.screen({
    id: 'ready', title: '04 · Have these ready', className: 's0-ready', scroll: true,
    render: () => `${U.status()}${U.browser()}
      <div class="pbody">
        ${U.head('Have these ready', "A minute of prep now saves retakes later. Tick them off, or just tap I'm ready.")}
        ${PREP.map(([g, rows]) => `<div class="card grp"><p class="gh">${g}</p>${rows.map(([img, t, s]) => `
          <label class="pr"><span class="pi"><img src="${S0(img + '.png')}" alt=""></span><span class="pt"><b>${t}</b><em>${s}</em></span><input type="checkbox" aria-label="${esc(t)}"></label>`).join('')}</div>`).join('')}
      </div>
      <div class="pfoot"><button class="btn" data-go="permissions">I'm ready</button><button class="link" data-action="later">Not with your car? Remind me later</button></div>`,
    mount: (el) => el.querySelector('[data-action="later"]').addEventListener('click', () => snack(el, "We'll send the link again on WhatsApp")),
  });

  /* ---------- 05 Permissions (648:21425) + 05b blocked (648:21527): live status, fix steps, location skippable ---------- */
  const PERMS = [
    { key: 'camera', icon: 'perm-camera.png', h: 'Camera', s: 'To photograph documents and your car' },
    { key: 'microphone', icon: 'perm-mic.png', h: 'Microphone', s: 'To record engine sound' },
    { key: 'location', icon: 'perm-location.png', h: 'Location', s: 'Confirms the car was inspected where you are' },
  ];
  const NAMES = { camera: 'Camera', microphone: 'Microphone', location: 'Location' };
  const list = (arr) => { const a = arr.map((x, i) => (i ? x.toLowerCase() : x)); return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || ''; };
  App.screen({
    id: 'permissions', title: '05 · Permissions', className: 's0-perm', scroll: true,
    render: () => {
      const st = App.state.permStatus || {};
      const blocked = PERMS.filter((p) => st[p.key] === 'blocked').map((p) => p.key);
      const on = PERMS.filter((p) => st[p.key] === 'allowed').map((p) => NAMES[p.key]);
      const chip = (k) => (st[k] === 'allowed' ? '<span class="chip ok">Allowed</span>' : st[k] === 'blocked' ? '<span class="chip bad">Blocked</span>' : '<span class="chip need">Needed</span>');
      const b = blocked[0];
      return `${U.status()}${U.browser()}${U.top()}
      <div class="pbody">
        ${blocked.length
          ? U.head('Almost there', `${list(blocked.map((k) => NAMES[k]))} ${blocked.length > 1 ? 'are' : 'is'} still blocked.${on.length ? ` ${list(on)} ${on.length > 1 ? 'are' : 'is'} on.` : ''}`)
          : U.head(`Allow ${PERMS.length} things`, 'Your browser will ask for each one. They are used only during this inspection.')}
        <div class="card plist">${PERMS.map((p, i) => `${i ? '<i class="divider"></i>' : ''}
          <div class="prow"><span class="pi"><img src="${S0(p.icon)}" alt=""></span><div class="pt"><b>${p.h}</b><em>${p.s}</em></div>${chip(p.key)}</div>`).join('')}</div>
        ${b ? `<div class="fix"><p class="fh"><img src="${S0('ic-warn-red.svg')}" alt="">Turn ${NAMES[b].toLowerCase()} back on</p>
          <p><i>1</i><span>Tap the <b>lock icon</b> next to the address above</span></p>
          <p><i>2</i><span>Open <b>Permissions</b></span></p>
          <p><i>3</i><span>Set <b>${NAMES[b]}</b> to Allow, then tap Try again</span></p></div>` : ''}
      </div>
      <div class="pfoot">
        ${blocked.length ? `<button class="btn" data-action="allow">Try again</button>
          ${!blocked.includes('camera') ? `<button class="link" data-action="skip">Continue without ${blocked.map((k) => NAMES[k].toLowerCase()).join(' and ')}</button>
          <p class="foot-note">Your inspection may need a manual check.</p>` : `<p class="foot-note">The camera is needed for every step.</p>
          <button class="link demo" data-action="skip">Demo: continue with sample photos</button>`}`
          : `<button class="btn" data-action="allow">Allow access</button><p class="foot-note">Photos and location stay with this inspection only.</p>`}
      </div>`;
    },
    mount: (el) => {
      // statuses the browser already knows (granted earlier / denied) show before anything is asked
      App.grantedPermissions().then((g) => {
        if (App.current !== 'permissions') return;
        const st = App.state.permStatus || (App.state.permStatus = {});
        let changed = false;
        for (const k of Object.keys(NAMES)) {
          const v = g[k] === 'granted' ? 'allowed' : g[k] === 'denied' ? 'blocked' : null;
          if (v && st[k] !== v) { st[k] = v; changed = true; }
        }
        if (changed) App.rerender();
      });
      let busy = false;
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-action]');
        if (!a || busy) return;
        if (a.dataset.action === 'skip') return App.go('position');
        busy = true; a.disabled = true;
        const r = await App.requestPermissions();
        App.state.permStatus = Object.fromEntries(Object.keys(NAMES).map((k) => [k, r[k] ? 'allowed' : 'blocked']));
        if (r.camera && r.microphone && r.location) App.go('position'); else App.rerender();
      });
    },
  });

  /* ---------- 06 Get into position (648:21588): one checklist for in-car setup; bonnet stays closed ---------- */
  App.screen({
    id: 'position', title: '06 · Get into position', className: 's0-pos', scroll: true,
    render: () => `${U.status()}${U.browser()}${U.top(U.pill('Stage 1 of 3 · Inside the car'))}
      <div class="pbody">
        ${U.head('Get into position', "Four quick things in the driver's seat, then we start with your documents.")}
        <div class="pics"><span><img src="${S0('pos-door-open.png')}" alt=""></span><span><img src="${S0('pos-closed.png')}" alt=""></span></div>
        <div class="card plist">${[['pos-ic-seat', "Sit in the driver's seat", 'Phone in hand, door closed'], ['pos-ic-window', 'Close all the windows', 'Reflections and wind noise spoil the shots'],
          ['pos-ic-brake', 'Apply the handbrake', 'The engine will be running'], ['pos-ic-key', 'Start the engine', 'The dashboard lights up the odometer']]
          .map(([ic, t, s], i) => `${i ? '<i class="divider"></i>' : ''}<div class="prow"><span class="ic"><img src="${S0(ic + '.svg')}" alt=""></span><div class="pt"><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>
        ${App.flow.has('engine') ? `<div class="note-box"><img src="${S0('pos-ic-bonnet.svg')}" alt=""><p>Leave the bonnet closed for now. We'll ask you to open it right before the engine sound.</p></div>` : ''}
      </div>
      <div class="pfoot"><button class="btn" data-go="inside">I'm in position</button></div>`,
  });

  /* ---------- 07 Inside the car (648:21647): stage preview; turning the phone sideways starts it ---------- */
  const S1_ROWS = {
    rc: ['s0/ag-rc.png', 'RC', () => (App.state.rcType === 'paper' ? 'The paper copy, or switch to card' : 'Front and back, or the paper copy'), 'photo', 'Photo'],
    odometer: ['photo/odo.jpg', 'Odometer', () => 'A clear shot of the km reading', 'photo', 'Photo'],
    windshield: ['photo/ws.jpg', 'Windshield', () => 'Slow pan, left to right', 'video', 'Video · 10 s'],
    roof: ['photo/roof.jpg', 'Sunroof', () => 'Only if your car has one', 'video', 'Video · 10 s'],
  };
  App.screen({
    id: 'inside', title: '07 · Inside the car · rotate', className: 's0-inside', scroll: true,
    turnTo: 'landscape', next: () => 'rc',
    render: () => {
      const s1 = App.flow.s1();
      const rows = ['rc', ...s1.map((x) => x.key).filter((k) => S1_ROWS[k])];
      return `${U.status()}${U.browser()}${U.top(U.pill('Stage 1 of 3'))}
      <div class="pbody">
        ${U.head('Inside the car', `${s1.length} captures · about 3 minutes. The voice guide talks you through each one.`)}
        <div class="card plist">${rows.map((k, i) => { const [img, t, s, kind, lab] = S1_ROWS[k]; return `${i ? '<i class="divider"></i>' : ''}
          <div class="prow"><span class="th"><img src="${A(img)}" alt=""></span><div class="pt"><b>${t}</b><em>${s()}</em></div><span class="kind"><img src="${S0('ic-' + kind + '.svg')}" alt="">${lab}</span></div>`; }).join('')}</div>
        <div class="turn"><span class="tbox"><img src="${S0('ic-rotate.svg')}" alt=""></span><p class="tt">Turn your phone sideways to begin</p><p class="ts">We start as soon as it's in landscape</p></div>
      </div>
      <div class="pfoot"><button class="link" data-action="locked">Rotation locked? Start anyway</button></div>`;
    },
    mount: (el) => el.querySelector('[data-action="locked"]').addEventListener('click', () => { App.state.rotLock = true; App.go('rc'); }),
  });
})();
