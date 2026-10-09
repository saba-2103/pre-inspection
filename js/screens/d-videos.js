/* Group D — Video recordings (Windshield, Rooftop glass, Engine sound) + VIN photo + Close bonnet.
   Figma: "4 / Stage 1 …Windshield (O), Rooftop (O)" and Stage 2 VIN (O), Engine Sound (O), Close Bonnet (O). */
(function () {
  const { A } = C;
  const S1 = ['RC (Front)', 'RC (Back)', 'Odometer', 'Windshield', 'Rooftop Glass'];
  const S2 = ['VIN', 'Engine Sound', 'Exterior Walkthrough', 'Damages'];
  const NO_CUTOUT = { left: 0, top: 0, width: 0, height: 0, shade: '', ring: false };
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  /* ---------- Video record screen (ready → countdown → recording) ---------- */
  // Video Modal (343:35019 / 346:36206 / 371:38319): photo + subtle gradient w/ 2px backdrop blur
  const videoModal = (title, img) => ({ title, button: 'Capture', bgHtml: `<img class="vm-img" src="${img}" alt=""><div class="vm-grad"></div>` });

  const recordScreen = (o, withInstr) => () => C.captureScreen({
    stepper: o.stepper,
    cutout: NO_CUTOUT,
    zoom: false,
    badge: o.badge,
    shutterLabel: 'Record\nVideo',
    shutterIcon: A('d/videocam.svg'),
    instruction: withInstr ? videoModal(o.instrTitle, o.modalImg) : null,
    extra: '<div class="countdown" hidden><p>3</p></div>',
  });

  /* Real recording: 3-2-1 countdown → MediaRecorder (audio when granted) → stop (button / auto) → store → next */
  function mountRecorder(el, o) {
    const off = C.mountCapture(el, { key: o.key, next: o.next, accept: 'video/*', customShutter: true, fallbackImg: o.bg, onDismiss: o.onDismiss });
    const col = el.querySelector('.capture-col');
    const shut = col.querySelector('.shutter');
    const icon = shut.querySelector('img');
    const label = col.querySelector('.shutter-label');
    col.insertAdjacentHTML('afterbegin', '<div class="rec-timer" hidden>0:00</div>');
    const timer = col.querySelector('.rec-timer');
    const cd = el.querySelector('.countdown');
    const min = o.minSec || 0, max = o.maxSec || 90;
    let state = 'ready', t0 = 0, iv = 0, dead = false;
    const tos = [];
    const set = (s) => { state = s; el.dataset.rec = s; };
    set('ready');

    const reset = () => {
      tos.forEach(clearTimeout); clearInterval(iv); cd.hidden = true; timer.hidden = true;
      icon.src = A('d/videocam.svg'); label.textContent = 'Record\nVideo'; shut.classList.remove('wait'); set('ready');
    };
    async function start() {
      if (!App.Camera.stream || !App.Camera.stream.active) { try { await App.Camera.start(); } catch (e) { return; } }
      App.VO.stop(); // keep the voice-over out of the recording
      set('starting'); label.textContent = 'Starting\nRecording...';
      let n = 3; cd.firstElementChild.textContent = n; cd.hidden = false;
      const tick = () => {
        if (dead) return;
        if (--n > 0) { cd.firstElementChild.textContent = n; tos.push(setTimeout(tick, 1000)); } else begin();
      };
      tos.push(setTimeout(tick, 1000));
    }
    function begin() {
      cd.hidden = true;
      try { t0 = App.Camera.startRecording(); } catch (e) { console.warn(e); return reset(); }
      set('recording'); icon.src = A('d/stop.svg'); label.textContent = 'Stop\nRecording'; timer.hidden = false;
      update(); iv = setInterval(update, 200);
    }
    function update() {
      const s = (Date.now() - t0) / 1000;
      timer.textContent = fmt(s);
      shut.classList.toggle('wait', s < min); // e.g. engine sound: hold at least 10 s
      if (s >= max) stop(true);
    }
    async function stop(force) {
      if (state !== 'recording') return;
      if (!force && (Date.now() - t0) / 1000 < min) return;
      set('saving'); clearInterval(iv);
      const cap = await App.Camera.stopRecording();
      if (dead || !cap) return;
      App.state.captures[o.key] = cap;
      App.go(o.next);
    }
    el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action="shutter"]')) return;
      if (state === 'ready') start(); else if (state === 'recording') stop();
    });
    return () => {
      dead = true; tos.forEach(clearTimeout); clearInterval(iv);
      if (App.Camera.isRecording()) App.Camera.stopRecording(); // discard an unfinished take
      if (off) off();
    };
  }

  /* ---------- Recorded (inline player) + fullscreen preview ---------- */
  const controls = (big, fs, sample) => `
    <div class="vctl">
      <button class="vplay" data-action="vplay" aria-label="Play / pause"><img src="${A(`d/pause${big ? 24 : 16}.svg`)}" alt=""></button>
      <div class="vbar"><div class="vfill" style="width:${sample.fill}"></div></div>
      <p class="vtime">${sample.time}</p>
      ${fs ? `<button class="vfs" data-go="${fs}" aria-label="Full screen"><img src="${A('d/fullscreen.svg')}" alt=""></button>` : ''}
    </div>`;
  const player = (key, fallback) => {
    const cap = App.capture(key);
    return cap && cap.kind === 'video' ? `<video src="${cap.url}" playsinline preload="auto"></video>` : `<img src="${fallback}" alt="">`;
  };

  function mountPlayer(el, key, big) {
    const v = el.querySelector('video');
    if (!v) return null;
    const cap = App.capture(key);
    const btn = el.querySelector('.vplay img'), fill = el.querySelector('.vfill'), time = el.querySelector('.vtime');
    const dur = () => (isFinite(v.duration) && v.duration > 0 ? v.duration : cap.duration || 0);
    const paint = () => {
      const d = dur();
      fill.style.width = d ? `${Math.min(100, (v.currentTime / d) * 100)}%` : '0';
      time.textContent = `${fmt(v.currentTime)}/${fmt(d)}`;
      btn.src = A(`d/${v.paused ? 'play' : 'pause'}${big ? 24 : 16}.svg`);
    };
    ['timeupdate', 'play', 'pause', 'ended', 'loadedmetadata'].forEach((t) => v.addEventListener(t, paint));
    const toggle = () => (v.paused ? v.play().catch(() => {}) : v.pause());
    el.querySelector('.vplay').addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    el.querySelector('.vbar').addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (dur()) v.currentTime = ((e.clientX - r.left) / r.width) * dur();
    });
    paint();
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    return () => { v.pause(); v.removeAttribute('src'); v.load(); };
  }

  const recordedScreen = (o) => () => `
    ${C.header({ stepper: o.stepper, chrome: false })}
    <div class="vbox">${player(o.key, o.bg)}<div class="vgrad"></div>${controls(false, o.fs, o.sample)}</div>
    ${C.footer({ cls: 'captured-footer', buttons: [
      { label: 'Retake', variant: 'outline', go: o.retake },
      { label: 'Next', next: o.next },
    ] })}`;

  const fsScreen = (o) => () => `
    <div class="header">${C.statusBar()}</div>
    <div class="vmedia">${player(o.key, o.bg)}<div class="vgrad"></div>${controls(true, null, { time: '0:04/0:52', fill: '30px' })}</div>
    <button class="close" data-go="${o.close}" aria-label="Close"><img src="${A('core/x.svg')}" alt=""></button>`;

  /* ---------- Register a full video item: instr / record / recorded / fs ---------- */
  function videoItem(o) {
    const S = o.rotate;
    App.screen({
      id: o.p + '-instr', node: o.nodes.instr, title: o.titles.instr, orientation: 'landscape', className: `capture d-vid d-${o.p}`, rotate: S,
      vo: o.vo.instr,
      render: recordScreen(o, true),
      mount: (el) => mountRecorder(el, { ...o, next: o.p + '-recorded', onDismiss: () => App.go(o.p + '-record', true) }),
    });
    App.screen({
      id: o.p + '-record', node: o.nodes.record, title: o.titles.record, orientation: 'landscape', className: `capture d-vid d-${o.p}`, rotate: S,
      vo: o.vo.record,
      render: recordScreen(o, false),
      mount: (el) => mountRecorder(el, { ...o, next: o.p + '-recorded' }),
    });
    App.screen({
      id: o.p + '-recorded', node: o.nodes.recorded, title: o.titles.recorded, orientation: 'landscape', className: `d-vrec d-${o.p}`, rotate: S,
      render: recordedScreen({ stepper: C.steps(o.labels, o.step, { captured: true }), key: o.key, bg: o.bg, fs: o.p + '-fs', retake: o.p + '-record', next: o.next, sample: o.sample }),
      mount: (el) => mountPlayer(el, o.key, false),
    });
    App.screen({
      id: o.p + '-fs', node: o.nodes.fs, title: o.titles.fs, orientation: 'landscape', className: `fs d-vfs d-${o.p}`, rotate: S,
      render: fsScreen({ key: o.key, bg: o.bg, close: o.p + '-recorded' }),
      mount: (el) => mountPlayer(el, o.key, true),
    });
  }

  // Windshield (O): 46:6858 / 136:41496 (+ countdown 140:44022, recording 140:43651) / 140:43295 / 516:32005
  videoItem({
    p: 'ws', key: 'windshield', rotate: 'rotate-s1', labels: S1, step: 3, stepper: C.steps(S1, 3), next: 'roof-instr',
    nodes: { instr: '46:6858', record: '136:41496', recorded: '140:43295', fs: '516:32005' },
    titles: { instr: 'Windshield - Instruction (O)', record: 'Windshield - Record (O)', recorded: 'Windshield - Recorded (O)', fs: 'Windshield - Recorded (O) Preview' },
    vo: { instr: '"Now, record the windshield."', record: '"Tap Record and move slowly from left to right."' },
    badge: 'Fit the Windshield in frame and tap on the shutter', instrTitle: 'Capture Windshield',
    modalImg: A('d/ws-modal.jpg'), bg: A('d/ws-bg.jpg'), sample: { time: '0:04/0:52', fill: '30px' },
  });

  // Rooftop glass / sunroof (O): 46:7131 / 136:41842 (+ 140:44035, 140:43664) / 140:43305 / 516:32261
  videoItem({
    p: 'roof', key: 'roof', rotate: 'rotate-s1', labels: S1, step: 4, stepper: C.steps(S1, 4), next: 's2-context',
    nodes: { instr: '46:7131', record: '136:41842', recorded: '140:43305', fs: '516:32261' },
    titles: { instr: 'Rooftop Glass - Instruction (O)', record: 'Rooftop Glass - Record (O)', recorded: 'Rooftop Glass - Recorded (O)', fs: 'Rooftop Glass - Recorded (O) Preview' },
    vo: { instr: '"Now, record the sunroof."', record: '"Tap Record and move slowly from front to back."' },
    badge: 'Fit the Rooftop Glass in frame and tap on the shutter', instrTitle: 'Capture Rooftop Glass',
    modalImg: A('d/roof-modal.jpg'), bg: A('d/roof-bg.jpg'), sample: { time: '0:09/0:21', fill: '50%' },
  });

  // Engine sound (O): 343:34510 / 343:35123 (+ 343:34498, 343:34504) / 343:34487 / 516:32296 — hold ≥ 10 s
  videoItem({
    p: 'engine', key: 'engine', rotate: 'rotate-s2', labels: S2, step: 1, stepper: C.steps(S2, 1), next: 'bonnet-close', minSec: 10,
    nodes: { instr: '343:34510', record: '343:35123', recorded: '343:34487', fs: '516:32296' },
    titles: { instr: 'Engine Sound - Instruction (O)', record: 'Engine Sound - Record (O)', recorded: 'Engine Sound - Recorded (O)', fs: 'Engine Sound - Recorded (O) Preview' },
    vo: { instr: '"Now, record the engine sound."', record: '"Keep it inside the frame and tap Record. Hold for atleast 10 seconds"' },
    badge: 'Fit the Engine in frame and tap on the shutter', instrTitle: 'Record Engine Sound',
    modalImg: A('d/engine-modal.jpg'), bg: A('d/engine-bg.jpg'), sample: { time: '0:09/0:21', fill: '50%' },
  });

  /* ---------- VIN (O) — photo ---------- */
  const VIN_CUT = { left: 185, top: 134, width: 480, height: 180, radius: 20 }; // Overlay 47:7814 window
  const vinModal = `
    <div class="instr-overlay" data-instr>
      <div class="instr-modal vin-modal">
        <div class="vm-head"><p class="t">Capture VIN</p><p class="s">You can find them in one of these spots</p></div>
        <div class="vm-pic"><img src="${A('d/vin-spots.png')}" alt=""></div>
        <button class="btn btn-primary btn-modal" data-action="dismiss-instr">Capture</button>
      </div>
    </div>`;
  const vinCapture = (withInstr) => () => C.captureScreen({
    stepper: C.steps(S2, 0), cutout: VIN_CUT, zoom: false,
    badge: 'Fit the VIN in frame and tap on the shutter',
    extra: withInstr ? vinModal : '',
  });
  App.screen({
    id: 'vin-instr', node: '47:7857', title: 'VIN - Instruction (O)', orientation: 'landscape', className: 'capture d-vin', rotate: 'rotate-s2',
    vo: '"Now, capture the VIN or chassis number. Check under the bonnet, near the front glass, or on the door frame."',
    render: vinCapture(true),
    mount: (el) => C.mountCapture(el, { key: 'vin', next: 'vin-captured', fallbackImg: A('d/vin-sample.jpg'), onDismiss: () => App.go('vin-capture', true) }),
  });
  App.screen({
    id: 'vin-capture', node: '153:45440', title: 'VIN - Capture (O)', orientation: 'landscape', className: 'capture d-vin', rotate: 'rotate-s2',
    vo: '"Keep it inside the frame and tap Capture."',
    render: vinCapture(false),
    mount: (el) => C.mountCapture(el, { key: 'vin', next: 'vin-captured', fallbackImg: A('d/vin-sample.jpg') }),
  });
  App.screen({
    id: 'vin-captured', node: '153:45980', title: 'VIN - Captured (O)', orientation: 'landscape', className: 'captured d-vin', rotate: 'rotate-s2',
    render: () => C.capturedScreen({ stepper: C.steps(S2, 0, { captured: true }), key: 'vin', fs: 'vin-fs', retake: 'vin-capture', next: 'engine-instr', fallback: A('d/vin-sample.jpg') }),
  });
  App.screen({
    id: 'vin-fs', node: '516:32092', title: 'VIN - Captured (O) Preview', orientation: 'landscape', className: 'fs d-vin', rotate: 'rotate-s2',
    render: () => C.fsScreen({ key: 'vin', close: 'vin-captured', fallback: A('d/vin-sample.jpg') }),
  });

  /* ---------- Close Bonnet (O) — 346:37498, shown over the 360° capture screen ---------- */
  App.screen({
    id: 'bonnet-close', node: '346:37498', title: 'Close Bonnet - Instruction (O)', orientation: 'landscape', className: 'd-bonnet', rotate: 'rotate-s2',
    vo: `"Please close the bonnet. Tap 'I'm Ready' once it's closed."`,
    render: () => `
      <div class="header">${C.statusBar()}</div>
      <img class="bon-bg" src="${A('d/bonnet-bg.jpg')}" alt="">
      <div class="instr-overlay">
        <div class="instr-modal bon-modal">
          <p class="t">Close the Bonnet</p>
          <div class="vm-pic"><img src="${A('d/bonnet-car.png')}" alt=""></div>
          <button class="btn btn-primary btn-modal" data-go="v360-instr">I'm Ready</button>
        </div>
      </div>`,
  });
})();
