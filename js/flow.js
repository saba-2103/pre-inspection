/* Flow wiring + review index. Screen ids are documented in FLOW.md. */
(function () {
  // Review helper: #/__index lists every registered screen (deep links for design review).
  App.screen({
    id: '__index',
    orientation: 'portrait',
    scroll: true,
    render: () => `<div class="index-list"><h3>ACME Pre-Inspection — all screens</h3>${App.order
      .filter((id) => id !== '__index')
      .map((id) => `<a href="#/${id}">${id}${App.screens[id].title ? ' — ' + C.esc(App.screens[id].title) : ''}</a>`)
      .join('')}</div>`,
  });

  // Routing around optional items (Items screen). The bonnet is only opened (and closed) for Engine Sound.
  const has = C.has;
  App.route = {
    afterPermissions: () => (has('engine') ? 's1-bonnet' : 's1-sit'),
    afterOdometer: () => (has('windshield') ? 'ws-instr' : has('roof') ? 'roof-instr' : 's2-context'),
    afterWindshield: () => (has('roof') ? 'roof-instr' : 's2-context'),
    stage2: () => (has('vin') ? 'vin-instr' : has('engine') ? 'engine-instr' : 'v360-instr'),
    afterVin: () => (has('engine') ? 'engine-instr' : 'v360-instr'),
  };

  // Orientation lock: every screen without its own prompt gets the generic one, so a portrait screen
  // stays portrait (behind "Please rotate your phone") when the phone is sideways, and vice versa.
  App.order.forEach((id) => {
    const def = App.screens[id];
    if (def.rotate || id === '__index' || /^rotate-/.test(id)) return;
    def.rotate = def.orientation === 'portrait' ? 'rotate-review' : 'rotate-s1';
  });

  App.start('whatsapp');
})();
