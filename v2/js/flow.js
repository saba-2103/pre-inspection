/* V2 flow wiring: which captures run (internal Items screen), their order, progress counts and routing.
   Stage 0 portrait setup → Stage 1 landscape inside the car → Stage 2 landscape around the car → Stage 3 portrait review.
   Loaded before the screens (they read App.flow); index.html calls App.start() last. */
(function () {
  const has = (k) => !!App.state.items[k];
  const card = () => App.state.rcType !== 'paper';

  // Stage item lists drive the "<item> · i of n" progress pills
  App.flow = {
    has,
    s1: () => [
      ...(card() ? [{ key: 'rcFront', label: 'RC front', go: 'rc' }, { key: 'rcBack', label: 'RC back', go: 'rc-back' }] : [{ key: 'rcPaper', label: 'Paper RC', go: 'rc' }]),
      { key: 'odometer', label: 'Odometer', go: 'odo' },
      ...(has('windshield') ? [{ key: 'windshield', label: 'Windshield', go: 'ws' }] : []),
      ...(has('roof') ? [{ key: 'roof', label: 'Sunroof', go: 'roof' }] : []),
    ],
    s2: () => [
      ...(has('vin') ? [{ key: 'vin', label: 'VIN', go: 'vin' }] : []),
      ...(has('engine') ? [{ key: 'engine', label: 'Engine sound', go: 'engine' }] : []),
      { key: 'walk', label: 'Walk-around', go: 'walk-1' },
    ],
    pos(list, key) { const i = list.findIndex((x) => x.key === key); return { i: i + 1, n: list.length }; },
    // next screen after an item (Stage 1 ends at "step out", Stage 2 runs into the walk-around)
    after(key) {
      const s1 = App.flow.s1(), i1 = s1.findIndex((x) => x.key === key || (key === 'rcFront' && x.key === 'rcPaper'));
      if (i1 >= 0) return i1 + 1 < s1.length ? s1[i1 + 1].go : 'step-out';
      const s2 = App.flow.s2(), i2 = s2.findIndex((x) => x.key === key);
      if (i2 >= 0) return s2[i2 + 1] ? s2[i2 + 1].go : 'damages';
      return 'review';
    },
    stage2Start: () => App.flow.s2()[0].go,
  };

  // Review helper: #/__index lists every registered screen (deep links for design review).
  App.screen({
    id: '__index',
    scroll: true,
    className: 'index',
    render: () => `<div class="index-list"><h3>ACME Pre-Inspection V2 — all screens</h3>${App.order
      .filter((id) => id !== '__index')
      .map((id) => `<a href="#/${id}">${id}${App.screens[id].title ? ' — ' + U.esc(App.screens[id].title) : ''}</a>`)
      .join('')}
      <a href="#/review?state=attention">review?state=attention — Review · needs attention (sample)</a>
      <a href="#/review?state=good">review?state=good — Review · all good (sample)</a></div>`,
  });

})();
