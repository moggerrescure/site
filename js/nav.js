/* ═══════════════════════════════════════════════
   NAV — burger menu + page transitions
   Runs on every page
   ═══════════════════════════════════════════════ */
(function () {

  /* ── BURGER MENU ── */
  const nav = document.querySelector('.nav__inner');
  if (nav) {
    const burger = document.createElement('button');
    burger.className = 'nav__burger';
    burger.setAttribute('aria-label', 'Меню');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = `<span></span><span></span><span></span>`;
    nav.appendChild(burger);

    const links = document.querySelector('.nav__links');
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('nav__links--open');
      burger.classList.toggle('nav__burger--open', open);
      burger.setAttribute('aria-expanded', open);
    });

    /* close on link click */
    links?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('nav__links--open');
        burger.classList.remove('nav__burger--open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    /* close on outside click */
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        links?.classList.remove('nav__links--open');
        burger.classList.remove('nav__burger--open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

    /* Nav scroll darkening */
    const onScroll = () => nav.closest('.nav')?.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── PAGE FADE TRANSITIONS ── */
  document.body.classList.add('page-loaded');

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('javascript') ||
        a.target === '_blank') return;

    a.addEventListener('click', e => {
      /* allow ctrl/cmd+click to open new tab */
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.remove('page-loaded');
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 280);
    });
  });

})();
