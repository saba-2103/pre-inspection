/* Shared UI components (HTML string builders) — mirror Figma components. */
(function () {
  const A = (p) => 'assets/' + p;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const C = (window.C = { esc, A });

  /* Device chrome — only visible in the desktop phone frame (.device-only) */
  C.statusBar = () => `
    <div class="status-bar device-only"><p class="time">08:15</p><img src="${A('core/statusIcons.svg')}" alt=""></div>`;

  C.chromeUI = () => `
    <div class="chrome-ui device-only">
      <img class="ic" src="${A('core/chromeHome.svg')}" alt="">
      <div class="cu-address"><div class="cu-content"><img src="${A('core/chromeSite.svg')}" alt=""><p class="cu-url">acmeinsurance.in<span>/pre-inspection/</span></p></div></div>
      <div class="cu-right"><img class="ic" src="${A('core/chromePlus.svg')}" alt=""><img class="ic" src="${A('core/chromeTabs.svg')}" alt=""><img class="ic" src="${A('core/chromeMore.svg')}" alt=""></div>
    </div>`;

  C.homeIndicator = () => `<div class="home-indicator device-only"><div class="home-bar"></div></div>`;

  /* Stepper: items = [{label, state:'done'|'current'|'todo', captured?:bool}] */
  C.stepper = (items) => {
    if (!items || !items.length) return '';
    const icon = { done: 'radioDone', current: 'radioCurrent', todo: 'radioDefault' };
    return `<div class="stepper">${items
      .map((it, i) => {
        const ic = it.captured ? 'radioDone' : icon[it.state];
        return `${i ? '<div class="step-line"></div>' : ''}<div class="step ${it.state}${it.captured ? ' captured' : ''}"><img src="${A('core/' + ic + '.svg')}" alt=""><span>${esc(it.label)}</span></div>`;
      })
      .join('')}</div>`;
  };

  /* Build stepper items from labels: steps(['RC (Front)','RC (Back)','Odometer'], 2, {captured:true}) */
  C.steps = (labels, current, o = {}) =>
    labels.map((label, i) => ({ label, state: i < current ? 'done' : i === current ? 'current' : 'todo', captured: i === current && !!o.captured }));

  /* Stage stepper labels for the items picked on the Items screen (RC path follows the chosen RC type) */
  C.has = (k) => !!App.state.items[k];
  C.stage1 = () => [...(App.state.rcType === 'paper' ? ['RC Paper'] : ['RC (Front)', 'RC (Back)']), 'Odometer',
    ...(C.has('windshield') ? ['Windshield'] : []), ...(C.has('roof') ? ['Rooftop Glass'] : [])];
  C.stage2 = () => [...(C.has('vin') ? ['VIN'] : []), ...(C.has('engine') ? ['Engine Sound'] : []), 'Exterior Walkthrough', 'Damages'];
  C.stageSteps = (stage, label, o) => { const l = stage === 1 ? C.stage1() : C.stage2(); return C.steps(l, l.indexOf(label), o); };

  C.ctas = () => `
    <div class="rhs">
      <button class="icon-btn" data-action="vo-replay" aria-label="Replay instructions"><img src="${A('core/restart.svg')}" alt=""></button>
      <button class="icon-btn" data-action="vo-toggle" aria-label="Voice instructions on/off"><img src="${A('core/volume.svg')}" alt="">
        <svg class="ring" viewBox="0 0 40 40"><circle class="track" cx="20" cy="20" r="19.2"/><circle class="bar" cx="20" cy="20" r="19.2" style="stroke-dasharray:0 200"/></svg>
      </button>
    </div>`;

  /* Header = status bar + (portrait) browser bar + navbar.
     opts: {stepper:[...], chrome:true (portrait default), ctas:true, dark:false (done steps white on camera), logo:true} */
  C.header = (opts = {}) => {
    const { stepper, chrome = true, ctas = true, dark = false, logo = true, extraClass = '' } = opts;
    return `
    <div class="header ${dark ? 'on-dark' : ''} ${extraClass}">
      ${C.statusBar()}
      ${chrome ? C.chromeUI() : ''}
      <div class="navbar">
        <div class="lhs">${logo ? `<img src="${A('core/logo.svg')}" alt="ACME">` : ''}</div>
        ${C.stepper(stepper)}
        ${ctas ? C.ctas() : '<div class="rhs"></div>'}
      </div>
    </div>`;
  };

  /* Button: {label, go?:'screen-id', next?:'screen-id' (honours App.state.returnTo), action?:'name', variant:'primary'|'outline', disabled?, cls?} */
  C.button = (b) => {
    if (!b) return '';
    const v = b.variant || 'primary';
    const attrs = [b.go ? `data-go="${b.go}"` : '', b.next ? `data-next="${b.next}"` : '', b.action ? `data-action="${b.action}"` : '', b.disabled ? 'disabled' : ''].join(' ');
    return `<button class="btn btn-${v} ${b.cls || ''}" ${attrs}>${esc(b.label)}</button>`;
  };

  /* Footer: {buttons:[...], before:'html above buttons', homebar:true, cls} */
  C.footer = (o = {}) => `
    <div class="footer ${o.cls || ''}">
      ${o.before || ''}
      ${o.buttons && o.buttons.length ? `<div class="footer-row">${o.buttons.map(C.button).join('')}</div>` : ''}
      ${o.homebar === false ? '' : '<div class="home-bar device-only"></div>'}
    </div>`;

  /* Media element for a capture object or fallback image */
  C.media = (cap, fallback, extra = '') => {
    if (cap && cap.kind === 'video') return `<video src="${cap.url}" playsinline muted controls ${extra}></video>`;
    if (cap) return `<img src="${cap.url}" alt="">`;
    return fallback ? `<img src="${fallback}" alt="">` : '';
  };

  /* ---------- Landscape capture screen ----------
     o = {stepper, cutout:{left,top,width,height,radius,border,right?}, badge, shutterLabel, shutterIcon, zoom:true,
          instruction:{title, image(s), button}, extra:'html', fallbackImg} */
  C.captureScreen = (o) => {
    // default = Figma capture Overlay (2:1608): #212529 @70% with a 660x272 r20 window + 2px white@30% ring
    const c = Object.assign({ left: 94, top: 93, width: 660, height: 272, radius: 20, shade: 'rgba(33,37,41,.7)', ring: true }, o.cutout || {});
    // offsets are from the 850×390 design; anchor them to the centre so the window stays centred on wider/taller phones
    // with `right`, the window stretches between fixed side margins (wide phones get a wider window)
    const x = c.right != null ? `left:${c.left}px;right:${c.right}px;` : `left:calc(50% + ${c.left - 425}px);width:${c.width}px;`;
    const cut = `${x}top:calc(50% + ${c.top - 195}px);height:${c.height}px;border-radius:${c.radius || 0}px;${c.border ? `border:${c.border};` : ''}${c.shade ? `box-shadow:0 0 0 3000px ${c.shade};` : 'box-shadow:none;'}`; // no shade → no dimming at all (video screens)
    return `
      <div class="cam-slot"></div>
      <div class="cutout ${c.ring ? 'ring' : ''}" style="${cut}"></div>
      ${o.overlayHtml || ''}
      ${C.header({ stepper: o.stepper, chrome: false, dark: true })}
      <div class="capture-col">
        <button class="shutter" data-action="shutter" aria-label="${esc(o.shutterLabel || 'Capture')}"><img src="${o.shutterIcon || A('core/camera.svg')}" alt=""></button>
        <p class="shutter-label">${esc(o.shutterLabel || 'Capture')}</p>
        ${o.zoom === false ? '' : `<div class="zoom">${[1, 2, 3].map((z) => `<button data-zoom="${z}" class="${(App.Camera.zoom || 1) === z ? 'on' : ''}">${z}x</button>`).join('')}</div>`}
      </div>
      ${C.homeIndicator()}
      ${o.badge ? `<div class="info-badge">${esc(o.badge)}</div>` : ''}
      ${o.extra || ''}
      ${o.instruction ? C.instruction(o.instruction) : ''}`;
  };

  /* Instruction modal shown over the live camera. inst = {title, image, imageStyle, overlayImage, button:'Capture'} */
  C.instruction = (inst) => `
    <div class="instr-overlay" data-instr>
      <div class="instr-modal">
        <div class="bg">${inst.bgHtml || `<img src="${inst.image}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${inst.imageStyle || ''}">`}</div>
        <p class="title">${esc(inst.title)}</p>
        <button class="btn btn-primary btn-modal" data-action="dismiss-instr">${esc(inst.button || 'Capture')}</button>
      </div>
    </div>`;

  /* Wire a capture screen. opts = {key, next:'screen-id' | fn(cap), multi:false, onShot(cap)}
     Photo: shutter grabs the .cutout region of the live camera. */
  C.mountCapture = (el, opts) => {
    const slot = el.querySelector('.cam-slot');
    const cutout = el.querySelector('.cutout');
    App.Camera.attach(slot, { fallbackImg: opts.fallbackImg, accept: opts.accept });
    const save = (cap) => {
      if (opts.multi) App.state.damages.push(cap);
      else if (opts.key) App.state.captures[opts.key] = cap;
      if (opts.onShot) opts.onShot(cap);
      if (opts.next) typeof opts.next === 'function' ? opts.next(cap) : App.go(opts.next);
    };
    el.addEventListener('click', async (e) => {
      const z = e.target.closest('[data-zoom]');
      if (z) {
        App.Camera.setZoom(+z.dataset.zoom);
        el.querySelectorAll('[data-zoom]').forEach((b) => b.classList.toggle('on', b === z));
        return;
      }
      if (e.target.closest('[data-action="dismiss-instr"]')) {
        el.querySelector('[data-instr]')?.remove();
        if (opts.onDismiss) opts.onDismiss();
        return;
      }
      if (e.target.closest('[data-action="shutter"]') && !opts.customShutter) {
        try {
          flash(el);
          save(await App.Camera.snap(slot, cutout));
        } catch (err) { console.warn(err); }
      }
    });
    el.addEventListener('change', async (e) => {
      if (e.target.matches('.cam-error input[type=file]') && e.target.files[0]) save(await App.Camera.fromFile(e.target.files[0]));
    });
    return () => App.Camera.video && App.Camera.video.remove();
  };

  function flash(el) {
    const f = document.createElement('div');
    f.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:.8;z-index:50;transition:opacity .25s;pointer-events:none';
    el.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => (f.style.opacity = '0')));
    setTimeout(() => f.remove(), 300);
  }
  C.flash = flash;

  /* ---------- Captured (landscape review of one capture) ----------
     o = {stepper, key, fs:'screen-id', retake:'screen-id', next:'screen-id', nextLabel, retakeLabel, fallback, imgStyle} */
  C.capturedScreen = (o) => {
    const cap = App.capture(o.key);
    return `
      ${C.header({ stepper: o.stepper, chrome: false })}
      <div class="captured-img" ${o.fs ? `data-go="${o.fs}"` : ''}>${C.media(cap, o.fallback)}</div>
      ${C.footer({ cls: 'captured-footer', buttons: [
        { label: o.retakeLabel || 'Retake', variant: 'outline', go: o.retake },
        { label: o.nextLabel || 'Next', next: o.next, action: o.nextAction },
      ] })}`;
  };

  /* ---------- Fullscreen preview ---------- o = {key, close:'screen-id', fallback} */
  C.fsScreen = (o) => {
    const cap = App.capture(o.key);
    return `
      <div class="header">${C.statusBar()}</div>
      <div class="media">${C.media(cap, o.fallback, 'autoplay')}</div>
      <button class="close" data-go="${o.close}" aria-label="Close"><img src="${A('core/x.svg')}" alt=""></button>`;
  };
})();
