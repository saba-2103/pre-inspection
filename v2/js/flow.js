/* V2 flow wiring: which captures run (internal Items screen), their order, stepper labels and routing.
   Onboarding (portrait) → Stage 1 inside the car (landscape) → Stage 2 around the car (landscape) → Review (portrait).
   Loaded before the screens (they read App.flow); index.html calls App.start() last. */
(function () {
  const has = (k) => !!App.state.items[k];
  const card = () => App.state.rcType !== 'paper';

  App.flow = {
    has,
    // Stage 1 · Inside the car (stepper labels from Figma 669:33512)
    s1: () => [
      ...(card()
        ? [{ key: 'rcFront', step: 'RC (Front)', label: 'RC Front', go: 'rc' }, { key: 'rcBack', step: 'RC (Back)', label: 'RC Back', go: 'rc-back' }]
        : [{ key: 'rcPaper', step: 'RC (Paper)', label: 'RC Paper', go: 'rc' }]),
      { key: 'odometer', step: 'Odometer', label: 'Odometer', go: 'odo' },
      ...(has('windshield') ? [{ key: 'windshield', step: 'Windshield', label: 'Windshield', go: 'ws' }] : []),
      ...(has('roof') ? [{ key: 'roof', step: 'Sunroof', label: 'Sunroof', go: 'roof' }] : []),
    ],
    // Stage 2 · Around the car
    s2: () => [
      ...(has('vin') ? [{ key: 'vin', step: 'VIN', label: 'VIN', go: 'vin' }] : []),
      ...(has('engine') ? [{ key: 'engine', step: 'Engine sound', label: 'Engine sound', go: 'engine' }] : []),
      { key: 'walk', step: 'Walk-around', label: 'Walk-around', go: 'walk-1' },
      { key: 'damages', step: 'Damages', label: 'Damages', go: 'damages' },
    ],
    pos(list, key) { const i = list.findIndex((x) => x.key === key); return { i: i + 1, n: list.length }; },
    // "RC Back · 2 of 5" (damages are optional, so Stage 2 counts VIN · engine · walk-around)
    label(key) {
      for (const list of [App.flow.s1(), App.flow.s2().filter((x) => x.key !== 'damages')]) {
        const i = list.findIndex((x) => x.key === key);
        if (i >= 0) return `${list[i].label} · ${i + 1} of ${list.length}`;
      }
      return '';
    },
    // next screen after an item (Stage 1 ends at "step out", Stage 2 ends at review)
    after(key) {
      const s1 = App.flow.s1(), i1 = s1.findIndex((x) => x.key === key);
      if (i1 >= 0) return i1 + 1 < s1.length ? s1[i1 + 1].go : 'step-out';
      const s2 = App.flow.s2(), i2 = s2.findIndex((x) => x.key === key);
      if (i2 >= 0) return s2[i2 + 1] ? s2[i2 + 1].go : 'review';
      return 'review';
    },
    stage2Start: () => App.flow.s2()[0].go,
  };

  // Review helper: #/__index lists every registered screen (deep links for design review).
  App.screen({
    id: '__index',
    scroll: true,
    className: 'index',
    render: () => `<div class="index-list"><h3>Anaira Pre-Inspection V2 — all screens</h3>${App.order
      .filter((id) => id !== '__index')
      .map((id) => `<a href="#/${id}">${id}${App.screens[id].title ? ' — ' + U.esc(App.screens[id].title) : ''}</a>`)
      .join('')}
      <a href="#/review?state=uploading">review?state=uploading — Review · uploading (sample)</a>
      <a href="#/review?state=attention">review?state=attention — Review · recapture (sample)</a>
      <a href="#/review?state=failed">review?state=failed — Review · uploads failed (sample)</a>
      <a href="#/review?state=good">review?state=good — Review · ready to submit (sample)</a></div>`,
  });
})();
