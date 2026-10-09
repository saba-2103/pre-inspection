/* Group B — Permissions, Stage instructions & agendas, rotate prompts.
   Figma headers "2 / Permissions", "3 / Stage 1 - Instructions & Agenda", "5 / Stage 2 - Instructions & Agenda". */
(function () {
  const { A, esc } = C;
  const B = (f) => A('b/' + f);

  /* ---------- Permissions (42:4656) + error states (2:1526, 516:31730) ---------- */
  const PERMS = [
    { key: 'camera', icon: 'perm-camera.png', h: 'Camera access', s: 'Used to scan your car and documents during inspection' },
    { key: 'microphone', icon: 'perm-mic.png', h: 'Microphone access', s: 'Helps us record the inspection clearly as you move around your car' },
    { key: 'location', icon: 'perm-location.png', h: 'Location access', s: 'Used to verify inspection location for security purposes' },
  ];
  const radio = (on) => B(on ? 'radioChecked.svg' : 'radioDefault.svg');

  const permissionsHtml = (granted = {}) => `
    ${C.header({})}
    <div class="body">
      <div class="title-block">
        <p class="h">We need a few quick permissions</p>
        <p class="s">To complete your car inspection smoothly, we’ll need access to a few things on your device.</p>
      </div>
      <div class="list">
        ${PERMS.map((p) => `
          <div class="item" data-action="allow">
            <div class="tile"><img src="${B(p.icon)}" alt=""></div>
            <div class="txt"><p class="ih">${p.h}</p><p class="is">${p.s}</p></div>
            <img class="radio" data-perm="${p.key}" src="${radio(granted[p.key])}" alt="">
          </div>`).join('')}
      </div>
    </div>
    <div class="badge-wrap">
      <div class="secure">
        <img class="shield" src="${B('shield.svg')}" alt="">
        <div class="col">
          <p class="t">We only use this during inspection.</p>
          <div class="ok"><img src="${A('core/checkCircle.svg')}" alt=""><p>Your data is secure.</p></div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="fcol">
        <div class="footer-row">${C.button({ label: 'Allow All Access', action: 'allow' })}</div>
        <p class="note">You can change permissions anytime from your device settings</p>
      </div>
      <div class="home-bar device-only"></div>
    </div>`;

  // Ask the browser for camera+mic, then location; tick the granted rows; route on the camera result.
  const mountPermissions = (el) => {
    let busy = false, timer = 0;
    el.addEventListener('click', async (e) => {
      if (busy || !e.target.closest('[data-action="allow"]')) return;
      busy = true;
      el.querySelectorAll('.btn').forEach((b) => b.classList.add('disabled'));
      const res = await App.requestPermissions();
      el.querySelectorAll('[data-perm]').forEach((r) => { r.src = radio(res[r.dataset.perm]); });
      timer = setTimeout(() => {
        if (res.camera) App.go(App.route.afterPermissions());
        else if (App.current === 'permissions-error') App.rerender();
        else App.go('permissions-error');
      }, 700);
    });
    return () => clearTimeout(timer);
  };

  App.screen({
    id: 'permissions', node: '42:4656', title: 'Permissions', orientation: 'portrait', className: 'b-perm',
    vo: '“Allow access to your Camera, Microphone, and Location to start the recording.”',
    render: () => permissionsHtml({}),
    mount: (el) => {
      // tick what the browser already allows (e.g. camera + mic granted earlier, only location left)
      App.grantedPermissions().then((g) => el.querySelectorAll('[data-perm]').forEach((r) => { if (g[r.dataset.perm]) r.src = radio(true); }));
      return mountPermissions(el);
    },
  });
  // Error = not every permission was granted; rows show the real result. Opened directly → Figma 2:1526 (location missing).
  App.screen({
    id: 'permissions-error', node: '2:1526', title: 'Permissions - Error', orientation: 'portrait', className: 'b-perm',
    render: (ctx) => permissionsHtml('camera' in ctx.state.permissions ? ctx.state.permissions : { camera: true, microphone: true }),
    mount: mountPermissions,
  });
  // Variant 516:31730 — only camera granted (mic + location missing). Review-only id.
  App.screen({
    id: 'permissions-error-2', node: '516:31730', title: 'Permissions - Error (mic + location missing)', orientation: 'portrait', className: 'b-perm',
    render: () => permissionsHtml({ camera: true }),
    mount: mountPermissions,
  });

  /* ---------- Mock Android permission dialogs (review only; real phones show the browser prompt) ---------- */
  const DIALOGS = [
    ['camera', '2:1558', 'dlg_cam.svg', 'to take pictures and record video?'],
    ['mic', '2:1572', 'dlg_mic.svg', 'to record audio?'],
    ['location', '2:1586', 'dlg_loc.svg', 'to access this device\'s location?'],
  ];
  DIALOGS.forEach(([k, node, icon, text]) => App.screen({
    id: 'perm-dialog-' + k, node, title: 'Permissions - ' + k[0].toUpperCase() + k.slice(1), orientation: 'portrait', className: 'b-perm b-dlg',
    render: () => `${permissionsHtml({})}
      <div class="dlg-ov">
        <div class="dlg">
          <div class="dlg-top"><img src="${B(icon)}" alt=""><p>Allow <b>Google</b> ${esc(text)}</p></div>
          <div class="dlg-btns">
            <button data-go="permissions">While using the app</button>
            <button data-go="permissions">Only This Time</button>
            <button data-go="permissions">Don't Allow</button>
          </div>
        </div>
      </div>`,
  }));

  /* ---------- Agendas (Stage 1: 132:37475 / 332:32893, Stage 2: 143:44294 / 332:33295) ---------- */
  const S1_ITEMS = [
    { name: 'RC', sub: 'Supports both card and paper', img: 'ag-rc.png', tile: true },
    { name: 'Odometer Reading', sub: 'Photo', img: 'ag-odo.png' },
    { name: 'Windshield', sub: 'Video', img: 'ag-ws.png', opt: 'windshield' },
    { name: 'Rooftop Glass', sub: 'Video', img: 'ag-roof.png', opt: 'roof' },
  ];
  const S2_ITEMS = [
    { name: 'VIN', sub: 'Photo', img: 'ag-vin.png', opt: 'vin' },
    { name: 'Engine Noise', sub: 'Video', img: 'ag-engine.png', opt: 'engine' },
    { name: '360° Walkaround', sub: 'Video', img: 'ag-360.png' },
  ];
  const agendaHtml = (stage) => {
    const s2 = stage === 2;
    const items = (s2 ? S2_ITEMS : S1_ITEMS).filter((i) => !i.opt || C.has(i.opt));
    return `
      <div class="ag-fade"></div>
      ${C.header({})}
      <div class="body ${s2 ? 's2' : ''}">
        ${s2 ? `<div class="rec"><img src="${B('recDot.svg')}" alt=""><span>RECORDING STILL IN PROGRESS</span></div>` : ''}
        <div class="stack">
          <div class="title-block">
            <p class="h">${s2 ? 'Exterior' : 'Interior'} Capture</p>
            <p class="s">We will record the following items in this stage</p>
          </div>
          <div class="list">
            ${items.map((i) => `
              <div class="item">
                <div class="thumb ${i.tile ? 'tile' : ''}"><img src="${B(i.img)}" alt=""></div>
                <div class="meta">
                  <div class="txt"><p class="name">${esc(i.name)}</p><p class="sub">${esc(i.sub)}</p></div>
                  <div class="status">To be captured</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="badge-wrap">
        <div class="hint"><img src="${B('info.svg')}" alt=""><p>You will complete these items one by one<br>with guided instructions on screen.</p></div>
      </div>
      ${C.footer({ buttons: [s2
        ? { label: 'Continue Inspection', go: App.route.stage2() }
        : { label: 'Start Inspection', go: 'rc-type' }] })}`;
  };

  App.screen({
    id: 's1-agenda', node: '132:37475', title: 'Stage 1 - Agenda', orientation: 'portrait', className: 'b-ag',
    vo: '“Next, we\'ll capture the following items, one by one. Tap \'Start Inspection\' to begin."',
    render: () => agendaHtml(1),
  });
  App.screen({
    id: 's2-agenda', node: '143:44294', title: 'Stage 2 - Agenda', orientation: 'portrait', className: 'b-ag', rotate: 'rotate-s2-portrait',
    vo: '“Next, we\'ll capture the following items, one by one. Tap Continue Inspection\' to begin."',
    render: () => agendaHtml(2),
  });

  /* ---------- Stage 1 instruction sheets over the agenda (46:5913, 46:6097 / 476:42740, 46:6272) ---------- */
  const sheet = (title, body, cta, next, cls = '') => `
    <div class="b-ov">
      <div class="sheet ${cls}">
        <div class="grab"></div>
        <p class="st">${title}</p>
        ${body}
        <div class="cta"><p>${cta}</p><button class="btn btn-primary btn-modal" data-go="${next}">I’m Ready</button></div>
      </div>
    </div>`;
  const steps = (list) => `
    <div class="bsteps">${list.map(([pre, bold, img, cls], i) => `
      <div class="bstep">
        <div class="bnum"><span>${i + 1}</span></div>
        <div class="content">
          <p class="sh"><span>${pre}</span><b>${bold}</b></p>
          <div class="sb ${cls || ''}"><img src="${B(img)}" alt=""></div>
        </div>
      </div>`).join('')}
    </div>`;

  App.screen({
    id: 's1-bonnet', node: '46:5913', title: 'Instruction - Bonnet (Optional)', orientation: 'portrait', className: 'b-ag b-instr',
    vo: '"Please open the bonnet. Tap \'I\'m Ready\' once it\'s open."',
    render: () => agendaHtml(1) + sheet('Open the Bonnet', `<div class="bonnet"><img src="${B('bonnet-car.png')}" alt=""></div>`,
      'Tap I\'m Ready when done', 's1-sit', 'hug'),
  });
  // Bonnet opened for Engine Sound → 46:6097; no bonnet step → 476:42740 (bonnet-closed car).
  App.screen({
    id: 's1-sit', node: '46:6097', title: 'Instruction - Sit & Roll Up Windows', orientation: 'portrait', className: 'b-ag b-instr',
    vo: '"Please sit in the driver\'s seat. Close all the windows."',
    render: (ctx) => {
      const o = C.has('engine');
      return agendaHtml(1) + sheet('Get Settled Inside', steps([
        ['Sit on the ', 'Driver’s Seat', o ? 'sit-seat.png' : 'sit-seat-closed.png'],
        [o ? 'Close All the ' : 'Roll Up All the ', 'Windows', o ? 'sit-windows.png' : 'sit-windows-closed.png'],
      ]), o ? 'Tap I\'m Ready when done' : 'Click done when you are ready!', 's1-ignition');
    },
  });
  App.screen({
    id: 's1-ignition', node: '46:6272', title: 'Instruction - Start Ignition', orientation: 'portrait', className: 'b-ag b-instr',
    vo: '"Please apply the handbrake. Now start the engine."',
    render: () => agendaHtml(1) + sheet('Prepare the Vehicle', steps([
      ['Apply the ', 'Handbrake', 'ign-handbrake.jpg', 'photo'],
      ['Start the ', 'Engine', 'ign-engine.jpg', 'photo'],
    ]), 'Tap I\'m Ready when done', 's1-agenda'),
  });

  /* ---------- Stage 2 context: get out of the car (77:9803) ---------- */
  App.screen({
    id: 's2-context', node: '77:9803', title: 'Instruction - Get out of car', orientation: 'portrait', className: 'b-ag b-instr', rotate: 'rotate-s2-portrait',
    vo: '"Please step out of the car. Recording is still on. Tap Done once you\'re outside."',
    render: () => `${agendaHtml(2)}
      <div class="b-ov">
        <div class="ctx-modal">
          <p class="st">Move out of the car</p>
          <div class="cb"><img src="${B(C.has('engine') ? 'ctx-car.png' : 'sit-seat-closed.png')}" alt=""></div>
          <div class="cta"><p>Click done when you are ready!</p><button class="btn btn-primary btn-modal" data-go="s2-agenda">Done</button></div>
        </div>
      </div>`,
  });

  /* ---------- Rotate prompts ----------
     The backdrop is the screen the user is trying to reach (rendered without mounting), rotated as in Figma. */
  const backdrop = (fallbackId, selfId) => {
    const id = App.current && App.current !== selfId && App.screens[App.current] ? App.current : fallbackId;
    const def = App.screens[id];
    if (!def) return '';
    try {
      const html = def.render({ def, state: App.state, config: App.config, go: App.go, back: App.back, C, Camera: App.Camera, VO: App.VO });
      const land = def.orientation === 'landscape';
      return `<div class="rot-bg ${land ? 'land' : 'port'}"><div class="screen ${def.className || ''}" data-o="${def.orientation}">${html}</div></div>`;
    } catch (e) { console.warn(e); return ''; }
  };
  const rotateModal = () => `
    <div class="rot-ov"><div class="rot-modal">
      <p>Please rotate your phone</p>
      <div class="ic"><img src="${B('rotatePhone.svg')}" alt=""></div>
    </div></div>`;

  // Fit the rotated backdrop to the actual stage size (phones are taller/shorter than the 850×390 design).
  const fitBackdrop = (el) => {
    const bg = el.querySelector('.rot-bg');
    if (!bg) return;
    const W = el.clientWidth, H = el.clientHeight;
    Object.assign(bg.style, { width: H + 'px', height: W + 'px', margin: `${-W / 2}px 0 0 ${-H / 2}px` });
  };

  // Portrait frames (phone held upright while a landscape stage runs): 150:45265, 155:65376
  [['rotate-s1', '150:45265', 'Stage 1 - Wrong Orientation', 'rc-front-capture'],
   ['rotate-s2', '155:65376', 'Stage 2 - Wrong Orientation', 'vin-capture']].forEach(([id, node, title, fb]) => App.screen({
    id, node, title, orientation: 'portrait', className: 'b-rot b-rot-p',
    render: () => backdrop(fb, id) + rotateModal(),
    mount: fitBackdrop,
  }));
  // Landscape frames (phone held sideways on a portrait screen): 143:44412, 155:67255
  [['rotate-s2-portrait', '143:44412', 'Stage 2 - Wrong Orientation', 's2-agenda'],
   ['rotate-review', '155:67255', 'Review - Wrong Orientation', 'review']].forEach(([id, node, title, fb]) => App.screen({
    id, node, title, orientation: 'landscape', className: 'b-rot b-rot-l',
    render: () => backdrop(fb, id) + rotateModal(),
    mount: fitBackdrop,
  }));
})();
