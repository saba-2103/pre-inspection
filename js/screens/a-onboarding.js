/* Group A — Entry & Onboarding. Figma: header "0 / Entry" and "1 / Onboarding". */
(function () {
  const { A, esc } = C;

  /* ---------- WhatsApp message (2:1418) — entry point ---------- */
  App.screen({
    id: 'whatsapp',
    node: '2:1418',
    title: 'WhatsApp Message',
    orientation: 'portrait',
    className: 'wa',
    render: () => `
      <div class="wa-status">${C.statusBar()}</div>
      <div class="wa-bar">
        <img class="ic24" src="${A('a/waBack.svg')}" alt="">
        <div class="biz">
          <div class="biz-logo"><img src="${A('core/logo.svg')}" alt=""></div>
          <div class="biz-text">
            <div class="biz-name"><p>ACME General Insurance</p><img src="${A('a/waVerified.svg')}" alt=""></div>
            <p class="biz-sub">Business Account</p>
          </div>
        </div>
        <img class="ic24" src="${A('a/waMore.svg')}" alt="">
      </div>
      <div class="wa-chat">
        <div class="wa-stack">
          <div class="wa-date"><span>23 April 2026</span></div>
          <div class="wa-info">
            <div class="wa-card">
              <div class="wa-card-top">
                <div class="wa-card-id">
                  <div class="wa-card-logo"><img src="${A('core/logo.svg')}" alt=""></div>
                  <div class="wa-card-names">
                    <div class="n"><p>ACME General Insurance</p><img src="${A('a/waVerifiedLg.svg')}" alt=""></div>
                    <p class="s">Business account • Joined in September, 2025</p>
                  </div>
                </div>
                <div class="wa-line"></div>
              </div>
              <div class="wa-card-bottom">
                <p>You are getting offers and announcements from this business</p>
                <div class="wa-pills">
                  <div class="pill"><img src="${A('a/waHand.svg')}" alt=""><span>Stop</span></div>
                  <div class="pill"><span>Profile</span></div>
                </div>
              </div>
            </div>
          </div>
          <div class="wa-msg">
            <div class="tail"><img src="${A('a/waTail.svg')}" alt=""></div>
            <div class="bubble">
              <div class="body">
                <p><b>Dear Customer,</b></p><p>&#8203;</p>
                <p>To continue your policy process, please complete a quick self-inspection of your vehicle.</p><p>&#8203;</p>
                <p>It’s simple, guided, and takes just a few minutes. ✅</p><p>&#8203;</p>
                <p><b>Click on Open Link to get started!</b></p>
              </div>
              <p class="foot">ACME General Insurance</p>
              <p class="time">11.14 AM</p>
              <a class="link" data-go="items" role="button"><img src="${A('a/waLink.svg')}" alt=""><span>Open Link</span></a>
            </div>
            <div class="gap"></div>
          </div>
        </div>
      </div>
      <div class="wa-input">
        <div class="field">
          <div class="l"><img class="ic24" src="${A('a/waEmoji.svg')}" alt=""><span>Type a message</span></div>
          <div class="r"><img class="ic24" src="${A('a/waAttach.svg')}" alt=""><img class="ic24" src="${A('a/waCamera.svg')}" alt=""></div>
        </div>
        <div class="mic"><img src="${A('a/waMic.svg')}" alt=""></div>
      </div>
      ${C.homeIndicator()}`,
    // short phones: keep the latest message (and its Open Link button) in view, like WhatsApp does
    mount: (el) => { const chat = el.querySelector('.wa-chat'); chat.scrollTop = chat.scrollHeight; },
  });

  /* ---------- Inspection items — INTERNAL demo setup (not in Figma, not customer-facing; no VO).
     Mandatory items locked on, optional flows can be switched off. The rest of the flow follows this
     (App.state.items / C.has); Engine Sound is the only reason to open the bonnet. ---------- */
  const ITEMS = [
    ['Interior', [
      { name: 'RC', sub: 'Photo · card or paper' },
      { name: 'Odometer Reading', sub: 'Photo' },
      { key: 'windshield', name: 'Windshield', sub: 'Video' },
      { key: 'roof', name: 'Rooftop Glass', sub: 'Video' },
    ]],
    ['Exterior', [
      { key: 'vin', name: 'VIN', sub: 'Photo' },
      { key: 'engine', name: 'Engine Sound', sub: 'Video · adds open / close bonnet steps' },
      { name: '360° Walkaround', sub: 'Video' },
      { name: 'Damages', sub: 'Photos' },
    ]],
  ];
  App.screen({
    id: 'items', title: 'Inspection Items (internal setup)', orientation: 'portrait', className: 'a-items', scroll: true,
    render: () => `
      ${C.header({ ctas: false })}
      <div class="body">
        <p class="internal">Internal · Demo setup — not shown to customers</p>
        ${ITEMS.map(([sec, list]) => `
          <div class="sec">
            <p class="sec-h">${sec}</p>
            <div class="rows">${list.map((it) => `
              <label class="row ${it.key ? '' : 'req'}">
                <div class="txt"><p class="name">${esc(it.name)}</p><p class="sub">${esc(it.key ? it.sub : it.sub + ' · Required')}</p></div>
                <input type="checkbox" ${it.key ? `data-item="${it.key}" ${C.has(it.key) ? 'checked' : ''}` : 'checked disabled'} aria-label="${esc(it.name)}">
              </label>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="foot">${C.footer({ buttons: [{ label: 'Start Demo', go: 'loading' }] })}</div>`,
    mount: (el) => {
      el.addEventListener('change', (e) => {
        const k = e.target.dataset.item;
        if (k) App.state.items[k] = e.target.checked;
      });
    },
  });

  /* ---------- Loading (2:1402 start, 536:34632 submit) ---------- */
  const loadingHtml = (text) => (ctx) => `
    <div class="header">${C.statusBar()}${C.chromeUI()}</div>
    <div class="body">
      <img class="brand" src="${A('core/logo.svg')}" alt="ACME">
      <div class="col">
        <div class="plate"><div class="shine"><i></i><i></i></div><p>${esc(ctx.config.reg)}</p></div>
        <p class="msg">${esc(text)}</p>
      </div>
    </div>
    ${C.homeIndicator()}`;
  const autoAdvance = (to, ms) => () => { const t = setTimeout(() => App.go(to, true), ms); return () => clearTimeout(t); };

  App.screen({
    id: 'loading', node: '2:1402', title: 'Loading Screen', orientation: 'portrait', className: 'loading-a',
    render: loadingHtml('Preparing your inspection...'),
    mount: autoAdvance('volume', 2000),
  });
  App.screen({
    id: 'loading-final', node: '536:34632', title: 'Loading Screen', orientation: 'portrait', className: 'loading-a', rotate: 'rotate-review',
    render: loadingHtml('Submitting your inspection...'),
    mount: autoAdvance('success', 2500),
  });

  /* ---------- Welcome (516:22300) ---------- */
  const welcomeHtml = (ctx) => `
      <div class="welcome-fade"></div>
      ${C.header({})}
      <div class="body">
        <div class="hero">
          <p class="title">Welcome to<br>ACME General Insurance<br>Car Pre-Inspection</p>
          <div class="plate-card"><div class="plate">${esc(ctx.config.reg)}</div></div>
          <div class="content">
            <div class="copy">
              <p class="h">Let’s inspect your car!</p>
              <p class="s">This quick check helps us process your policy faster.</p>
            </div>
            <div class="badges">
              <div class="badge"><img src="${A('core/stopwatch.svg')}" alt=""><span>~10 minutes</span></div>
              <div class="badge"><img src="${A('core/bolt.svg')}" alt=""><span>No app needed</span></div>
            </div>
          </div>
        </div>
        <div class="steps-card">
          <div class="icons">
            ${['scan', 'analyze', 'policy'].map((k, i) => `
              <div class="col"><div class="line ${i === 0 ? 'none' : ''}"></div><div class="tile"><img src="${A('a/welcome-' + k + '.png')}" alt=""></div><div class="line ${i === 2 ? 'none' : ''}"></div></div>`).join('')}
          </div>
          <div class="texts">
            <div><p class="h">Scan</p><p class="s">You’ll scan your car using your camera</p></div>
            <div><p class="h">Analyze</p><p class="s">We’ll instantly analyze the details</p></div>
            <div><p class="h">Policy</p><p class="s">Your policy process moves forward</p></div>
          </div>
        </div>
      </div>
      ${C.footer({
        before: `<div class="info-line"><img src="${A('core/checkCircle.svg')}" alt=""><p>Safe, secure, and guided step-by-step</p></div>`,
        buttons: [{ label: 'Start Inspection', go: 'prereq-1' }],
      })}`;

  App.screen({
    id: 'welcome',
    node: '516:22300',
    title: 'Welcome Screen',
    orientation: 'portrait',
    className: 'welcome',
    render: (ctx) => welcomeHtml(ctx),
  });

  /* ---------- Volume warning (516:22323) = Welcome + modal ---------- */
  App.screen({
    id: 'volume',
    node: '516:22323',
    title: 'Volume Warning Screen',
    orientation: 'portrait',
    className: 'welcome volume',
    render: (ctx) => `
      ${welcomeHtml(ctx)}
      <div class="vol-overlay">
        <div class="vol-modal" role="dialog" aria-label="Turn up the Volume">
          <div class="vol-copy">
            <p class="t">Turn up the Volume</p>
            <p class="d">We'll guide you with<br>voice instructions at every step.</p>
          </div>
          <div class="vol-img"><img src="${A('a/volume-speaker.png')}" alt=""></div>
          <div class="vol-foot"><button class="btn btn-primary btn-modal" data-action="vol-done">Done</button></div>
        </div>
      </div>`,
    mount: (el) => {
      el.querySelector('[data-action="vol-done"]').addEventListener('click', () => {
        // user gesture: make sure voice-over is on and the speech engine is unlocked
        if (App.VO.muted) App.VO.toggle();
        try { if (window.speechSynthesis) speechSynthesis.resume(); } catch (e) {}
        App.go('welcome');
      });
    },
  });

  /* ---------- Prerequisites (77:9413, 104:32557, 104:32733, 104:32876, 104:33020, 104:33164, done 104:33838) ---------- */
  const PRE = [
    { icon: 'key', title: 'Vehicle Key', desc: 'Required to access and inspect your vehicle', vo: '“Let\'s get you ready. Please keep your vehicle key ready."', node: '77:9413' },
    { icon: 'rc', title: 'RC Copy', desc: 'Registration certificate of the vehicle', vo: '"Keep your RC with you."', node: '104:32557' },
    { icon: 'light', title: 'Good lighting', desc: 'Perform inspection in daylight', vo: '"Park your vehicle in good light."', node: '104:32733' },
    { icon: 'space', title: 'Space Around Vehicle', desc: 'Ensure ~5 ft space around the car', vo: '"Keep atleast 5 feet space on all sides."', node: '104:32876' },
    { icon: 'glass', title: 'Clear Glass', desc: 'Clean all windows & windshield', vo: '"Make sure the glass is clean and clear."', node: '104:33020' },
    { icon: 'clean', title: 'Clean Vehicle', desc: 'Dust free surface for clear photos', vo: '"Clean off all dust and dirt."', node: '104:33164' },
  ];
  const N = PRE.length;
  const stepId = (i) => (i < N ? 'prereq-' + (i + 1) : 'prereq-done');

  // cur = index of the open item (0..5), or N for the "all set" state
  const prereqHtml = (cur) => {
    const title = cur === 0 ? 'Let’s get you ready!' : cur === N ? 'You are all set! ' : `${cur}/${N} Complete`;
    const filled = Math.min(cur + 1, N);
    const icon = (it) => `<div class="pi-icon"><img src="${A('a/prereq-' + it.icon + '.png')}" alt=""></div>`;
    const items = PRE.map((it, i) => {
      if (i === cur) {
        return `
          <div class="pi open">
            <div class="pi-row">
              ${icon(it)}
              <div class="pi-body"><p class="h">${esc(it.title)}</p><p class="s">${esc(it.desc)}</p></div>
              <img class="pi-state" src="${A('a/dashedCircle.svg')}" alt="Pending">
            </div>
            <div class="pi-cta"><button class="btn btn-primary pi-done" data-go="${stepId(i + 1)}">Done</button></div>
          </div>`;
      }
      return `
          <div class="pi">
            <div class="pi-row">
              ${icon(it)}
              <div class="pi-body"><p class="h">${esc(it.title)}</p></div>
              <img class="pi-state" src="${A('a/' + (i < cur ? 'checkCircle' : 'dashedCircle') + '.svg')}" alt="${i < cur ? 'Done' : 'Pending'}">
            </div>
          </div>`;
    }).join('');
    return `
      <div class="prereq-fade"></div>
      ${C.header({})}
      <div class="body">
        <div class="titles">
          <p class="h">${esc(title)}</p>
          <p class="s">These quick checks help ensure<br>a smooth inspection and avoid retakes</p>
        </div>
        <div class="card">
          <div class="tabs">${PRE.map((_, i) => `<div class="${i < filled ? 'on' : ''}"></div>`).join('')}</div>
          <div class="list">${items}</div>
        </div>
      </div>
      ${cur === N ? C.footer({ buttons: [{ label: 'Continue', go: 'permissions' }] }) : ''}`;
  };

  PRE.forEach((it, i) => App.screen({
    id: stepId(i),
    node: it.node,
    title: 'Prerequisites - Step ' + (i + 1),
    orientation: 'portrait',
    className: 'prereq',
    vo: it.vo,
    render: () => prereqHtml(i),
    mount: (el) => { const open = el.querySelector('.pi.open'); if (open) open.scrollIntoView({ block: 'nearest' }); },
  }));
  App.screen({
    id: 'prereq-done',
    node: '104:33838',
    title: 'Prerequisites - Done',
    orientation: 'portrait',
    className: 'prereq done',
    vo: '"All set. Let\'s begin the inspection."',
    render: () => prereqHtml(N),
  });
})();
