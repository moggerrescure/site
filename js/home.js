/* ═══════════════════════════════════════════════
   HOME PAGE — Stats counter, Candle, Last added
   ═══════════════════════════════════════════════ */

(function () {

  /* ── STATS counter-up animation ── */
  const nums = document.querySelectorAll('.stat__num');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  nums.forEach(n => io.observe(n));

  /* ── CANDLE ── */
  const candle = document.getElementById('candle');
  const countEl = document.getElementById('candle-count');

  if (candle && countEl) {
    const STORAGE_KEY = 'candle_count';
    let count = parseInt(localStorage.getItem(STORAGE_KEY) || '237', 10);
    countEl.textContent = count;

    /* Start lit */
    candle.classList.add('is-lit');

    let busy = false;
    function toggleCandle() {
      if (busy) return;
      busy = true;
      if (candle.classList.contains('is-lit')) {
        /* blow out — brief flicker then out */
        candle.classList.add('is-blowing');
        setTimeout(() => {
          candle.classList.remove('is-lit');
          candle.classList.remove('is-blowing');
          busy = false;
        }, 600);
      } else {
        candle.classList.add('is-lit');
        count += 1;
        localStorage.setItem(STORAGE_KEY, count);
        /* counter bump */
        countEl.textContent = count;
        countEl.classList.remove('is-bumped');
        /* force reflow */
        void countEl.offsetWidth;
        countEl.classList.add('is-bumped');
        setTimeout(() => { busy = false; }, 300);
      }
    }

    candle.addEventListener('click', toggleCandle);
    candle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCandle(); }
    });
  }

  /* ── LAST ADDED ── */
  const grid = document.getElementById('last-added-grid');
  if (grid && typeof PEOPLE !== 'undefined') {
    const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

    const recent = PEOPLE.slice(-3);
    grid.innerHTML = recent.map(p => `
      <a class="person-card person-card--mini" href="person.html?id=${p.id}">
        <div class="person-card__photo">
          <div class="person-card__photo-inner">${personSVG}</div>
        </div>
        <div class="person-card__body">
          <h3 class="person-card__name">${p.name}</h3>
          <p class="person-card__dates">${p.born} — ${p.died}</p>
          <p class="person-card__city">${p.city}</p>
        </div>
      </a>
    `).join('');
  }
})();
