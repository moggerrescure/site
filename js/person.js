/* ═══════════════════════════════════════════════
   PERSON PAGE — Individual memorial page
   ═══════════════════════════════════════════════ */

(function () {
  const main = document.getElementById('person-main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const person = id ? findPerson(id) : null;

  if (!person) {
    main.innerHTML = `
      <section class="person-notfound">
        <h1>Страница не найдена</h1>
        <p>К сожалению, мы не смогли найти эту страницу памяти.</p>
        <a href="memory.html" class="btn btn--ghost">← Вернуться ко всем</a>
      </section>`;
    return;
  }

  /* update page title */
  document.title = `${person.name} — Память`;

  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  /* ── BUILD PAGE ── */
  main.innerHTML = `
    <section class="person-page">

      <a href="memory.html" class="person-back">ко всем страницам памяти</a>

      <!-- HEADER -->
      <div class="person-header">
        <div class="person-header__photo">
          <div class="person-header__photo-inner">${personSVG}</div>
        </div>
        <div class="person-header__info">
          <p class="person-header__eyebrow">Страница памяти</p>
          <h1 class="person-header__name">${person.name}</h1>
          <p class="person-header__dates">${person.born}<span>—</span>${person.died}</p>
          <p class="person-header__city">${person.city}</p>
        </div>
      </div>

      <!-- BIO -->
      <div class="person-bio">
        <p class="person-bio__text">${person.bio}</p>
      </div>

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

        <!-- Leave a review -->
        <form class="review-form" id="review-form">
          <h3 class="review-form__title">Поделиться воспоминанием</h3>
          <div class="review-form__field">
            <input type="text" class="review-form__input" name="author" placeholder="Ваше имя и кем приходитесь" required />
          </div>
          <div class="review-form__field">
            <textarea class="review-form__textarea" name="text" placeholder="Ваше воспоминание о человеке..." required></textarea>
          </div>
          <button type="submit" class="review-form__submit">Сохранить воспоминание</button>
        </form>
      </section>

      <!-- BURIAL / MAP -->
      <section class="burial-section">
        <h2 class="person-sec-title">Место захоронения</h2>
        <p class="burial-place">${person.burial.place}</p>

        <div class="map-frame">
          <span class="map-frame__corner map-frame__corner--tl"></span>
          <span class="map-frame__corner map-frame__corner--tr"></span>
          <span class="map-frame__corner map-frame__corner--bl"></span>
          <span class="map-frame__corner map-frame__corner--br"></span>
          <iframe
            src="https://www.google.com/maps?q=${encodeURIComponent(person.burial.query)}&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen>
          </iframe>
        </div>
      </section>

    </section>
  `;

  /* ── CAROUSEL ── */
  const reviews = [...person.reviews];

  /* Store locally-added reviews in localStorage per-person */
  const storageKey = `reviews_${person.id}`;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) reviews.push(...stored);
  } catch (e) { /* ignore */ }

  const track = document.getElementById('reviews-track');
  const dotsWrap = document.getElementById('reviews-dots');
  const prevBtn = document.getElementById('rev-prev');
  const nextBtn = document.getElementById('rev-next');

  let current = 0;

  function renderReviews() {
    track.innerHTML = reviews.map(r => `
      <div class="review">
        <div class="review__card">
          <p class="review__text">${r.text}</p>
          <p class="review__author">${r.author}</p>
        </div>
      </div>
    `).join('');

    dotsWrap.innerHTML = reviews.map((_, i) =>
      `<button class="reviews-dot ${i === current ? 'reviews-dot--active' : ''}" data-i="${i}" aria-label="Отзыв ${i+1}"></button>`
    ).join('');

    dotsWrap.querySelectorAll('[data-i]').forEach(d => {
      d.addEventListener('click', () => { current = +d.dataset.i; update(); });
    });

    update();
  }

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap.querySelectorAll('.reviews-dot').forEach((d, i) =>
      d.classList.toggle('reviews-dot--active', i === current)
    );
  }

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + reviews.length) % reviews.length;
    update();
  });
  nextBtn.addEventListener('click', () => {
    current = (current + 1) % reviews.length;
    update();
  });

  /* Keyboard nav */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  /* ── FORM HANDLING ── */
  const form = document.getElementById('review-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const author = (fd.get('author') || '').toString().trim();
    const text   = (fd.get('text')   || '').toString().trim();
    if (!author || !text) return;

    const newReview = { author, text };
    reviews.push(newReview);

    /* save locally */
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      stored.push(newReview);
      localStorage.setItem(storageKey, JSON.stringify(stored));
    } catch (e) {}

    form.reset();
    current = reviews.length - 1;
    renderReviews();

    /* scroll carousel into view */
    document.getElementById('reviews-carousel').scrollIntoView({
      behavior: 'smooth', block: 'center'
    });
  });

  renderReviews();
})();
