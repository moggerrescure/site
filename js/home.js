/* ═══════════════════════════════════════════════
   HOME PAGE — Stats from API, Candle via API,
   Last added from API, scroll reveals
   ═══════════════════════════════════════════════ */

(function () {

  /* ── STATS — fetch real numbers from server ── */
  API.get('/api/stats').then(res => {
    const map = {
      '.stat__num[data-count="18"]': res.data.people,
      '.stat__num[data-count="36"]': res.data.reviews,
      '.stat__num[data-count="9"]' : res.data.cities,
      '.stat__num[data-count="4"]' : null, /* generations stays hardcoded */
    };
    for (const [sel, val] of Object.entries(map)) {
      if (val === null) continue;
      const el = document.querySelector(sel);
      if (el) el.dataset.count = val;
    }
    initCounters();
  }).catch(() => initCounters()); /* fallback: animate hardcoded values */

  function initCounters() {
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
  }

  /* ── CANDLE — synced with server ── */
  const candle  = document.getElementById('candle');
  const countEl = document.getElementById('candle-count');
  const scene   = candle ? candle.closest('.candle-scene') : null;

  /* Load real count from server */
  API.get('/api/candles').then(r => {
    if (countEl) countEl.textContent = r.count;
  }).catch(() => {});

  if (candle && countEl) {
    candle.classList.add('is-lit');
    if (scene) scene.classList.add('is-lit');

    let busy = false;
    async function toggleCandle() {
      if (busy) return;
      busy = true;
      if (candle.classList.contains('is-lit')) {
        candle.classList.add('is-blowing');
        if (scene) scene.classList.remove('is-lit');
        setTimeout(() => {
          candle.classList.remove('is-lit', 'is-blowing');
          busy = false;
        }, 700);
      } else {
        candle.classList.add('is-lit');
        if (scene) scene.classList.add('is-lit');
        /* Increment on server */
        try {
          const r = await API.post('/api/candles/light');
          countEl.textContent = r.count;
        } catch {
          countEl.textContent = parseInt(countEl.textContent || '0') + 1;
        }
        countEl.classList.remove('is-bumped');
        void countEl.offsetWidth;
        countEl.classList.add('is-bumped');
        busy = false;
      }
    }

    candle.addEventListener('click', toggleCandle);
    candle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCandle(); }
    });
  }

  /* ── LAST ADDED — from API ── */
  const lastGrid = document.getElementById('last-added-grid');
  if (lastGrid) {
    const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

    /* Get last 3: fetch page that shows the last entries */
    API.get('/api/people?page=1&limit=100').then(res => {
      const recent = res.data.slice(-3).reverse();
      lastGrid.innerHTML = recent.map(p => `
        <a class="person-card" href="person.html?id=${encodeURIComponent(p.id)}">
          <div class="person-card__photo">
            ${p.photo
              ? `<img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>`
              : `<div class="person-card__photo-inner">${personSVG}</div>`}
          </div>
          <div class="person-card__body">
            <h3 class="person-card__name">${p.name}</h3>
            <p class="person-card__dates">${p.born} — ${p.died || '...'}</p>
            <p class="person-card__city">${p.city}</p>
          </div>
        </a>`).join('');
    }).catch(() => {
      /* Fallback: hide section */
      lastGrid.closest('section')?.style.setProperty('display', 'none');
    });
  }

})();


/* ═══════════════════════════════════════════════
   SITE-WIDE: Scroll reveals + nav scroll state
   ═══════════════════════════════════════════════ */
(function () {
  const revealSelectors = [
    '.section-title', '.features__grid', '.candle-scene',
    '.candle-section__sub', '.candle-section__counter',
    '.last-added__grid', '.pullquote', '.stats__inner',
  ];
  revealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (sel.includes('grid') || sel.includes('stats__inner')) el.classList.add('fx-stagger');
      else el.classList.add('fx-reveal');
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fx-reveal, .fx-stagger').forEach(el => io.observe(el));

  /* Nav scroll */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Button ripple */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });
})();
