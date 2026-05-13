/* ═══════════════════════════════════════════════
   HOME PAGE — Stats from API, Candle via API,
   Last added from API, scroll reveals
   ═══════════════════════════════════════════════ */

(function () {

  /* ── STATS — из API или из данных data.js ── */
  function initCounters() {
    const nums = document.querySelectorAll('.stat__num');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el     = en.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        const dur    = 1400;
        const start  = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  if (typeof API !== 'undefined') {
    API.get('/api/stats').then(res => {
      if (!res || !res.data) throw new Error();
      const map = {
        '[data-count="18"]': res.data.people,
        '[data-count="36"]': res.data.reviews,
        '[data-count="9"]' : res.data.cities,
      };
      for (const [sel, val] of Object.entries(map)) {
        if (!val) continue;
        document.querySelectorAll(`.stat__num${sel}`).forEach(el => el.dataset.count = val);
      }
    }).catch(() => {}).finally(initCounters);
  } else {
    /* No API — use data.js counts if available */
    if (typeof PEOPLE !== 'undefined') {
      const cities = new Set(PEOPLE.map(p => p.city).filter(Boolean)).size;
      document.querySelectorAll('.stat__num[data-count="18"]').forEach(el => el.dataset.count = PEOPLE.length);
      document.querySelectorAll('.stat__num[data-count="9"]').forEach(el => el.dataset.count = cities);
    }
    initCounters();
  }

  /* ── CANDLE — API с fallback на localStorage ── */
  const candle  = document.getElementById('candle');
  const countEl = document.getElementById('candle-count');
  const scene   = candle ? candle.closest('.candle-scene') : null;

  const STORAGE_KEY = 'candle_count';

  /* Load count */
  if (countEl) {
    if (typeof API !== 'undefined') {
      API.get('/api/candles').then(r => {
        if (r && r.count != null) countEl.textContent = r.count;
      }).catch(() => {
        countEl.textContent = localStorage.getItem(STORAGE_KEY) || '237';
      });
    } else {
      countEl.textContent = localStorage.getItem(STORAGE_KEY) || '237';
    }
  }

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
        /* Increment on server or localStorage */
        try {
          if (typeof API !== 'undefined') {
            const r = await API.post('/api/candles/light');
            if (r && r.count != null) {
              countEl.textContent = r.count;
              localStorage.setItem(STORAGE_KEY, r.count);
            }
          } else {
            throw new Error('no api');
          }
        } catch {
          const c = parseInt(countEl.textContent || '237') + 1;
          countEl.textContent = c;
          localStorage.setItem(STORAGE_KEY, c);
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

  /* ── FEATURED PERSON — живая карточка на главной ── */
  const featuredSection = document.getElementById('featured-person');
  if (featuredSection) {
    const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

    function renderFeatured(people) {
      /* Pick a random person who has at least one review */
      const withReviews = people.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0);
      const pool = withReviews.length ? withReviews : people;
      const p = pool[Math.floor(Math.random() * pool.length)];
      if (!p) return;
      const review = Array.isArray(p.reviews) && p.reviews[0];
      featuredSection.innerHTML = `
        <div class="featured-person__inner">
          <p class="hero__eyebrow">Одна из историй</p>
          <div class="featured-person__card">
            <div class="featured-person__photo">
              ${p.photo
                ? `<img src="${p.photo}" alt="${p.name}"/>`
                : `<div class="featured-person__avatar">${personSVG}</div>`}
            </div>
            <div class="featured-person__content">
              <h2 class="featured-person__name">${p.name}</h2>
              <p class="featured-person__meta">${p.born} — ${p.died || '...'} · ${p.city}</p>
              ${p.bio ? `<p class="featured-person__bio">${p.bio.slice(0, 160)}…</p>` : ''}
              ${review ? `
                <blockquote class="featured-person__quote">
                  <p>"${review.text}"</p>
                  <cite>${review.author}</cite>
                </blockquote>` : ''}
              <a href="person.html?id=${encodeURIComponent(p.id)}" class="featured-person__link">
                Читать историю →
              </a>
            </div>
          </div>
        </div>`;
    }

    let featuredOk = false;
    if (typeof API !== 'undefined') {
      API.get('/api/people?page=1&limit=100').then(res => {
        if (res?.data?.length) { renderFeatured(res.data); featuredOk = true; }
      }).catch(() => {});
    }
    setTimeout(() => {
      if (!featuredOk && typeof PEOPLE !== 'undefined' && PEOPLE.length)
        renderFeatured(PEOPLE);
    }, 600);
  }

  /* ── LAST ADDED — API с fallback на data.js ── */
  const lastGrid = document.getElementById('last-added-grid');
  if (lastGrid) {
    const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

    function renderLastAdded(people) {
      const recent = people.slice(-3).reverse();
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
    }

    /* Try API */
    let apiOk = false;
    if (typeof API !== 'undefined') {
      API.get('/api/people?page=1&limit=100').then(res => {
        if (res && Array.isArray(res.data) && res.data.length) {
          renderLastAdded(res.data);
          apiOk = true;
        }
      }).catch(() => {});
    }

    /* Fallback: data.js (runs immediately if API not available) */
    setTimeout(() => {
      if (!apiOk && typeof PEOPLE !== 'undefined' && PEOPLE.length) {
        renderLastAdded(PEOPLE);
      }
    }, 800);
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
