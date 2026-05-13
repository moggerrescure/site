/* ═══════════════════════════════════════════════
   HOME PAGE — Stats, Candle, Featured person,
   Last added. Uses PERSON_SVG + calcAge from data.js
   ═══════════════════════════════════════════════ */

(function () {

  /* ── STATS ── */
  function initCounters() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        const dur = 1400, start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat__num').forEach(n => io.observe(n));
  }

  if (typeof API !== 'undefined') {
    API.get('/api/stats').then(res => {
      if (!res?.data) return;
      const map = {
        '[data-count="18"]': res.data.people,
        '[data-count="36"]': res.data.reviews,
        '[data-count="9"]' : res.data.cities,
      };
      for (const [sel, val] of Object.entries(map)) {
        if (val) document.querySelectorAll(`.stat__num${sel}`).forEach(el => el.dataset.count = val);
      }
    }).catch(() => {
      /* fallback from data.js */
      if (typeof PEOPLE !== 'undefined') {
        const cities = new Set(PEOPLE.map(p => p.city).filter(Boolean)).size;
        document.querySelectorAll('.stat__num[data-count="18"]').forEach(el => el.dataset.count = PEOPLE.length);
        document.querySelectorAll('.stat__num[data-count="9"]').forEach(el => el.dataset.count = cities);
      }
    }).finally(initCounters);
  } else {
    if (typeof PEOPLE !== 'undefined') {
      const cities = new Set(PEOPLE.map(p => p.city).filter(Boolean)).size;
      document.querySelectorAll('.stat__num[data-count="18"]').forEach(el => el.dataset.count = PEOPLE.length);
      document.querySelectorAll('.stat__num[data-count="9"]').forEach(el => el.dataset.count = cities);
    }
    initCounters();
  }

  /* ── CANDLE ── */
  const candle  = document.getElementById('candle');
  const countEl = document.getElementById('candle-count');
  const scene   = candle?.closest('.candle-scene');
  const STORE   = 'candle_count';

  if (countEl) {
    (typeof API !== 'undefined'
      ? API.get('/api/candles').then(r => { if (r?.count != null) countEl.textContent = r.count; })
      : Promise.reject()
    ).catch(() => { countEl.textContent = localStorage.getItem(STORE) || '237'; });
  }

  if (candle && countEl) {
    candle.classList.add('is-lit');
    scene?.classList.add('is-lit');

    let busy = false;
    async function toggleCandle() {
      if (busy) return; busy = true;
      if (candle.classList.contains('is-lit')) {
        candle.classList.add('is-blowing');
        scene?.classList.remove('is-lit');
        setTimeout(() => { candle.classList.remove('is-lit', 'is-blowing'); busy = false; }, 700);
      } else {
        candle.classList.add('is-lit');
        scene?.classList.add('is-lit');
        try {
          const r = await API.post('/api/candles/light');
          if (r?.count != null) { countEl.textContent = r.count; localStorage.setItem(STORE, r.count); }
        } catch {
          const c = parseInt(countEl.textContent || '237') + 1;
          countEl.textContent = c; localStorage.setItem(STORE, c);
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

  /* ── FEATURED PERSON — race-condition-free ──
     rendered is a flag. Once set true by either path, other path won't run. */
  const featuredSection = document.getElementById('featured-person');
  if (featuredSection) {
    let rendered = false;

    function renderFeatured(people) {
      if (rendered) return;
      rendered = true;
      const withReviews = people.filter(p => Array.isArray(p.reviews) && p.reviews.length);
      const pool = withReviews.length ? withReviews : people;
      const p = pool[Math.floor(Math.random() * pool.length)];
      if (!p) return;
      const review = p.reviews?.[0];
      const age = typeof calcAge === 'function' ? calcAge(p.born, p.died) : null;
      featuredSection.innerHTML = `
        <div class="featured-person__inner">
          <p class="hero__eyebrow">Одна из историй</p>
          <div class="featured-person__card">
            <div class="featured-person__photo">
              ${p.photo ? `<img src="${p.photo}" alt="${p.name}"/>`
                        : `<div class="featured-person__avatar">${PERSON_SVG}</div>`}
            </div>
            <div class="featured-person__content">
              <h2 class="featured-person__name">${p.name}</h2>
              <p class="featured-person__meta">${p.born} — ${p.died || '...'}${age ? ` · ${age} лет` : ''} · ${p.city}</p>
              ${p.bio ? `<p class="featured-person__bio">${p.bio.slice(0, 160)}…</p>` : ''}
              ${review ? `<blockquote class="featured-person__quote"><p>"${review.text}"</p><cite>${review.author}</cite></blockquote>` : ''}
              <a href="person.html?id=${encodeURIComponent(p.id)}" class="featured-person__link">Читать историю →</a>
            </div>
          </div>
        </div>`;
    }

    /* Try API first */
    if (typeof API !== 'undefined') {
      API.get('/api/people?page=1&limit=100')
        .then(res => { if (res?.data?.length) renderFeatured(res.data); })
        .catch(() => {});
    }
    /* Fallback after 700ms if API didn't render */
    setTimeout(() => {
      if (!rendered && typeof PEOPLE !== 'undefined' && PEOPLE.length) renderFeatured(PEOPLE);
    }, 700);
  }

  /* ── LAST ADDED ── */
  const lastGrid = document.getElementById('last-added-grid');
  if (lastGrid) {
    function renderLastAdded(people) {
      lastGrid.innerHTML = people.slice(-3).reverse().map(p => `
        <a class="person-card" href="person.html?id=${encodeURIComponent(p.id)}">
          <div class="person-card__photo">
            ${p.photo
              ? `<img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>`
              : `<div class="person-card__photo-inner">${PERSON_SVG}</div>`}
          </div>
          <div class="person-card__body">
            <h3 class="person-card__name">${p.name}</h3>
            <p class="person-card__dates">${p.born} — ${p.died || '...'}</p>
            <p class="person-card__city">${p.city}</p>
          </div>
        </a>`).join('');
    }

    let apiOk = false;
    if (typeof API !== 'undefined') {
      API.get('/api/people?page=1&limit=100')
        .then(res => { if (res?.data?.length) { renderLastAdded(res.data); apiOk = true; } })
        .catch(() => {});
    }
    setTimeout(() => {
      if (!apiOk && typeof PEOPLE !== 'undefined' && PEOPLE.length) renderLastAdded(PEOPLE);
    }, 800);
  }

  /* ── SCROLL REVEALS (home page only) ── */
  const revealSelectors = [
    '.featured-person__card', '.stats__inner', '.candle-scene',
    '.candle-section__sub', '.last-added__grid', '.pullquote',
  ];
  revealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add(sel.includes('grid') || sel.includes('stats') ? 'fx-stagger' : 'fx-reveal');
    });
  });

  const revIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); revIO.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fx-reveal, .fx-stagger').forEach(el => revIO.observe(el));

  /* Button ripple */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

})();
