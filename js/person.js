/* ═══════════════════════════════════════════════
   PERSON PAGE — API с fallback на data.js
   Uses PERSON_SVG + calcAge from data.js
   ═══════════════════════════════════════════════ */

(function () {
  const main = document.getElementById('person-main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { showNotFound(); return; }

  /* Use global PERSON_SVG from data.js, fallback inline */
  const personSVG = (typeof PERSON_SVG !== 'undefined') ? PERSON_SVG :
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

  /* ── BREADCRUMBS — inject before main ── */
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Навигация');
  breadcrumb.innerHTML = `
    <ol class="breadcrumb__list">
      <li class="breadcrumb__item"><a href="index.html" class="breadcrumb__link">Главная</a></li>
      <li class="breadcrumb__item"><a href="memory.html" class="breadcrumb__link">Страницы памяти</a></li>
      <li class="breadcrumb__item"><span class="breadcrumb__current" id="breadcrumb-name">…</span></li>
    </ol>`;
  main.parentElement.insertBefore(breadcrumb, main);

  /* skeleton */
  main.innerHTML = `
    <section class="person-page" style="opacity:0.5">
      <div class="person-header">
        <div class="person-header__photo" style="background:#1a1a1a;"></div>
        <div class="person-header__info">
          <div class="skel-line skel-line--lg" style="margin-bottom:14px;"></div>
          <div class="skel-line" style="margin-bottom:10px;"></div>
          <div class="skel-line skel-line--sm"></div>
        </div>
      </div>
    </section>`;

  function showNotFound(msg) {
    document.title = 'Не найдено — Память';
    main.innerHTML = `
      <section class="person-notfound">
        <h1>Страница не найдена</h1>
        <p>${msg || 'Мы не смогли найти эту страницу памяти.'}</p>
        <a href="memory.html" class="btn btn--ghost">← Вернуться ко всем</a>
      </section>`;
  }

  /* ── Try API, then fallback to PEOPLE ── */
  async function loadPerson() {
    /* 1. API */
    try {
      if (typeof API !== 'undefined') {
        const res = await API.get(`/api/people/${encodeURIComponent(id)}`);
        if (res && res.data) {
          render(res.data, 'api');
          return;
        }
      }
    } catch (_) {}

    /* 2. Local data.js */
    if (typeof PEOPLE !== 'undefined') {
      const found = PEOPLE.find(p => p.id === id);
      if (found) {
        /* normalise burial field */
        const person = { ...found };
        if (found.burial && typeof found.burial === 'object') {
          person.burial       = found.burial.place || '';
          person.burial_query = found.burial.query || found.burial.place || '';
        }
        /* add reviews from localStorage if any */
        const stored = (() => {
          try { return JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]'); } catch { return []; }
        })();
        person.reviews = [...(found.reviews || []), ...stored];
        render(person, 'local');
        return;
      }
    }

    showNotFound();
  }

  function render(person, source) {
    document.title = `${person.name} — Память`;

    /* Update breadcrumb */
    const bcName = document.getElementById('breadcrumb-name');
    if (bcName) bcName.textContent = person.name.split(' ').slice(0,2).join(' ');

    /* Calculate age */
    const age = typeof calcAge === 'function' ? calcAge(person.born, person.died) : null;

    let reviews = Array.isArray(person.reviews) ? person.reviews : [];

    /* If API gave us person without reviews, load local ones too */
    if (source === 'api') {
      try {
        const stored = JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]');
        if (Array.isArray(stored)) reviews = [...reviews, ...stored];
      } catch {}
    }

    const photoHtml = person.photo
      ? `<img src="${person.photo}" alt="${person.name}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>`
      : `<div class="person-header__photo-inner">${personSVG}</div>`;

    const burialPlace = person.burial || '';
    const burialQuery = person.burial_query || burialPlace;

    main.innerHTML = `
      <section class="person-page">
        <a href="memory.html" class="person-back">ко всем страницам памяти</a>

        <div class="person-header">
          <div class="person-header__photo">${photoHtml}</div>
          <div class="person-header__info">
            <p class="person-header__eyebrow">Страница памяти</p>
            <h1 class="person-header__name">${person.name}</h1>
            <p class="person-header__dates">${person.born}<span>—</span>${person.died || '...'}${age ? `<span class="person-header__age">${age} лет</span>` : ''}</p>
            <p class="person-header__city">${person.city}</p>
          </div>
        </div>

        ${person.bio ? `
        <div class="person-bio">
          <p class="person-bio__text">${person.bio}</p>
        </div>` : ''}

        <!-- REVIEWS -->
        <section class="reviews-section">
          <h2 class="person-sec-title">Воспоминания близких</h2>
          <div class="reviews-carousel" id="reviews-carousel">
            <button class="reviews-arrow reviews-arrow--prev" id="rev-prev" aria-label="Предыдущий">‹</button>
            <div class="reviews-viewport">
              <div class="reviews-track" id="reviews-track"></div>
            </div>
            <button class="reviews-arrow reviews-arrow--next" id="rev-next" aria-label="Следующий">›</button>
            <div class="reviews-dots" id="reviews-dots"></div>
          </div>

          <form class="review-form" id="review-form">
            <h3 class="review-form__title">Поделиться воспоминанием</h3>
            <div class="review-form__field">
              <input type="text" class="review-form__input" name="author"
                     placeholder="Ваше имя и кем приходитесь" required maxlength="120"/>
            </div>
            <div class="review-form__field">
              <textarea class="review-form__textarea" name="text"
                        placeholder="Ваше воспоминание..." required maxlength="2000"></textarea>
            </div>
            <button type="submit" class="review-form__submit">Сохранить воспоминание</button>
            <p class="review-form__status" id="review-status" style="display:none;text-align:center;
               margin-top:12px;font-family:var(--font-body);font-style:italic;"></p>
          </form>
        </section>

        ${burialPlace ? `
        <section class="burial-section">
          <h2 class="person-sec-title">Место захоронения</h2>
          <p class="burial-place">${burialPlace}</p>
          <div class="map-frame">
            <span class="map-frame__corner map-frame__corner--tl"></span>
            <span class="map-frame__corner map-frame__corner--tr"></span>
            <span class="map-frame__corner map-frame__corner--bl"></span>
            <span class="map-frame__corner map-frame__corner--br"></span>
            <iframe
              src="https://www.google.com/maps?q=${encodeURIComponent(burialQuery)}&output=embed"
              loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
        </section>` : ''}
      </section>`;

    /* ── Carousel ── */
    const track = document.getElementById('reviews-track');
    const dots  = document.getElementById('reviews-dots');
    const prev  = document.getElementById('rev-prev');
    const next  = document.getElementById('rev-next');
    let current = 0;

    function renderReviews() {
      if (!reviews.length) {
        track.innerHTML = `<div class="review"><div class="review__card">
          <p class="review__text" style="opacity:0.5">Пока нет воспоминаний. Будьте первым.</p>
        </div></div>`;
        dots.innerHTML = '';
        return;
      }
      track.innerHTML = reviews.map(r => `
        <div class="review">
          <div class="review__card">
            <p class="review__text">${r.text}</p>
            <p class="review__author">${r.author}</p>
          </div>
        </div>`).join('');
      dots.innerHTML = reviews.map((_, i) =>
        `<button class="reviews-dot ${i === current ? 'reviews-dot--active' : ''}" data-i="${i}"></button>`
      ).join('');
      dots.querySelectorAll('[data-i]').forEach(d =>
        d.addEventListener('click', () => { current = +d.dataset.i; update(); }));
      update();
    }

    function update() {
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.querySelectorAll('.reviews-dot').forEach((d, i) =>
        d.classList.toggle('reviews-dot--active', i === current));
    }

    prev?.addEventListener('click', () => { current = (current - 1 + reviews.length) % reviews.length; update(); });
    next?.addEventListener('click', () => { current = (current + 1) % reviews.length; update(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  prev?.click();
      if (e.key === 'ArrowRight') next?.click();
    });

    renderReviews();

    /* ── Submit review ── */
    const form   = document.getElementById('review-form');
    const status = document.getElementById('review-status');

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd     = new FormData(form);
      const author = (fd.get('author') || '').toString().trim();
      const text   = (fd.get('text')   || '').toString().trim();
      if (!author || !text) return;

      const btn = form.querySelector('.review-form__submit');
      btn.disabled   = true;
      btn.textContent = 'Сохраняем...';

      const newReview = { author, text };

      /* Try API first */
      let saved = false;
      try {
        if (typeof API !== 'undefined') {
          const res = await API.post(`/api/reviews/${encodeURIComponent(id)}`, { author, text });
          if (res && res.data) { reviews.unshift(res.data); saved = true; }
        }
      } catch (_) {}

      /* Fallback: localStorage */
      if (!saved) {
        reviews.unshift(newReview);
        try {
          const stored = JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]');
          stored.unshift(newReview);
          localStorage.setItem(`reviews_${id}`, JSON.stringify(stored));
        } catch {}
      }

      current = 0;
      form.reset();
      renderReviews();

      status.style.display = 'block';
      status.style.color   = 'var(--gold-light)';
      status.textContent   = 'Воспоминание сохранено ✦';
      setTimeout(() => { status.style.display = 'none'; }, 3000);

      document.getElementById('reviews-carousel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled    = false;
      btn.textContent = 'Сохранить воспоминание';
    });
  }

  loadPerson();
})();
