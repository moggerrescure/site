/* ═══════════════════════════════════════════════
   PAGE TRANSITIONS — Dissolve / fade between pages
   Intercepts internal link clicks and animates
   a smooth fade-to-black before navigation.
   ═══════════════════════════════════════════════ */

(function () {
  const DURATION = 500; // ms for fade animation

  /* Create the overlay element */
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  /* On page load: fade IN */
  function fadeIn() {
    document.body.classList.add('page-loaded');
    overlay.classList.add('page-transition--visible');
    /* Small delay then remove overlay */
    requestAnimationFrame(() => {
      overlay.classList.remove('page-transition--visible');
    });
  }

  /* On link click: fade OUT, then navigate */
  function fadeOut(href) {
    overlay.classList.add('page-transition--visible');
    setTimeout(() => {
      window.location.href = href;
    }, DURATION);
  }

  /* Intercept internal link clicks */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    /* Skip: external links, anchors, javascript:, mailto:, new tab */
    if (!href) return;
    if (href.startsWith('#')) return;
    if (href.startsWith('javascript:')) return;
    if (href.startsWith('mailto:')) return;
    if (href.startsWith('tel:')) return;
    if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
    if (link.target === '_blank') return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    e.preventDefault();
    fadeOut(href);
  });

  /* Handle browser back/forward */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      /* Page was restored from bfcache */
      overlay.classList.remove('page-transition--visible');
      document.body.classList.add('page-loaded');
    }
  });

  /* Trigger fade-in on load */
  if (document.readyState === 'complete') {
    fadeIn();
  } else {
    window.addEventListener('load', fadeIn);
  }
})();
