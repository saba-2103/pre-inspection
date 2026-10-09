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

  App.start('whatsapp');
})();
