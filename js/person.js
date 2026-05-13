/* ═══════════════════════════════════════════════
   PERSON PAGE — fetches from /api/people/:id
   Reviews posted to /api/reviews/:personId
   ═══════════════════════════════════════════════ */

(function () {
  const main = document.getElementById('person-main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showNotFound();
    return;
  }

  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  /* ── Skeleton while loading ── */
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

  API.get(`/api/people/${encodeURIComponent(id)}`)
    .then(res => render(res.data))
    .catch(err => showNotFound(err.message));

  function showNotFound(msg = '') {
    document.title = 'Не найдено — Память';
    main.innerHTML = `
      <section class="person-notfound">
        <h1>Страница не найдена</h1>
        <p>${msg || 'Мы не смогли найти эту страницу памяти.'}</p>
        <a href="memory.html" class="btn btn--ghost">← Вернуться ко всем</a>
      </section>`;
  }

  function render(person) {
    document.title = `${person.name} — Память`;
    let reviews = Array.isArray(person.reviews) ? person.reviews : [];

    const photoHtml = person.photo
      ? `<img src="${person.photo}" alt="${person.name}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>`
      : `<div class="person-header__photo-inner">${personSVG}</div>`;

    main.innerHTML = `
      <section class="person-page">
        <a href="memory.html" class="person-back">ко всем страницам памяти</a>

        <div class="person-header">
          <div class="person-header__photo">${photoHtml}</div>
          <div class="person-header__info">
            <p class="person-header__eyebrow">Страница памяти</p>
            <h1 class="person-header__name">${person.name}</h1>
            <p class="person-header__dates">${person.born}<span>—</span>${person.died || '...'}</p>
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
              <input type="text" class="review-form__input" name="author" placeholder="Ваше имя и кем приходитесь" required maxlength="120"/>
            </div>
            <div class="review-form__field">
              <textarea class="review-form__textarea" name="text" placeholder="Ваше воспоминание..." required maxlength="2000"></textarea>
            </div>
            <button type="submit" class="review-form__submit">Сохранить воспоминание</button>
            <p class="review-form__status" id="review-status" style="display:none;text-align:center;margin-top:12px;font-family:var(--font-body);font-style:italic;"></p>
          </form>
        </section>

        <!-- MAP -->
        ${person.burial ? `
        <section class="burial-section">
          <h2 class="person-sec-title">Место захоронения</h2>
          <p class="burial-place">${person.burial}</p>
          <div class="map-frame">
            <span class="map-frame__corner map-frame__corner--tl"></span>
            <span class="map-frame__corner map-frame__corner--tr"></span>
            <span class="map-frame__corner map-frame__corner--bl"></span>
            <span class="map-frame__corner map-frame__corner--br"></span>
            <iframe
              src="https://www.google.com/maps?q=${encodeURIComponent(person.burial_query || person.burial)}&output=embed"
              loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
        </section>` : ''}

        ${API.isLoggedIn() ? `
        <section class="upload-section">
          <h2 class="person-sec-title">Загрузить фотографию</h2>
          <form class="upload-form" id="upload-form">
            <label class="upload-label">
              <input type="file" name="photo" accept="image/*" id="upload-input" style="display:none"/>
              <span class="upload-btn">Выбрать фото</span>
              <span class="upload-filename" id="upload-filename">файл не выбран</span>
            </label>
            <button type="submit" class="review-form__submit" style="margin-top:16px;">Загрузить</button>
            <p class="review-form__status" id="upload-status" style="display:none;text-align:center;margin-top:12px;font-family:var(--font-body);font-style:italic;"></p>
          </form>
        </section>` : ''}

      </section>`;

    /* ── Carousel ── */
    const track  = document.getElementById('reviews-track');
    const dots   = document.getElementById('reviews-dots');
    const prev   = document.getElementById('rev-prev');
    const next   = document.getElementById('rev-next');
    let current  = 0;

    function renderReviews() {
      if (!reviews.length) {
        track.innerHTML = `<div class="review"><div class="review__card"><p class="review__text" style="opacity:0.5">Пока нет воспоминаний. Будьте первым.</p></div></div>`;
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
      dots.querySelectorAll('[data-i]').forEach(d => d.addEventListener('click', () => { current = +d.dataset.i; update(); }));
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
      const fd = new FormData(form);
      const author = (fd.get('author') || '').toString().trim();
      const text   = (fd.get('text')   || '').toString().trim();
      if (!author || !text) return;

      const btn = form.querySelector('.review-form__submit');
      btn.disabled = true;
      btn.textContent = 'Сохраняем...';

      try {
        const res = await API.post(`/api/reviews/${encodeURIComponent(id)}`, { author, text });
        reviews.unshift(res.data);
        current = 0;
        form.reset();
        renderReviews();
        status.style.display = 'block';
        status.style.color   = 'var(--gold-light)';
        status.textContent   = 'Воспоминание сохранено ✦';
        setTimeout(() => { status.style.display = 'none'; }, 3000);
        document.getElementById('reviews-carousel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        status.style.display = 'block';
        status.style.color   = '#e08060';
        status.textContent   = 'Ошибка: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить воспоминание';
      }
    });

    /* ── Upload photo (auth required) ── */
    const uploadInput    = document.getElementById('upload-input');
    const uploadFilename = document.getElementById('upload-filename');
    const uploadForm     = document.getElementById('upload-form');
    const uploadStatus   = document.getElementById('upload-status');

    uploadInput?.addEventListener('change', () => {
      uploadFilename.textContent = uploadInput.files[0]?.name || 'файл не выбран';
    });

    uploadForm?.addEventListener('submit', async e => {
      e.preventDefault();
      const file = uploadInput?.files[0];
      if (!file) return;
      const btn = uploadForm.querySelector('.review-form__submit');
      btn.disabled = true;
      btn.textContent = 'Загружаем...';

      try {
        const formData = new FormData();
        formData.append('photo', file);
        const res = await API.upload(`/api/people/${encodeURIComponent(id)}/photo`, formData);
        uploadStatus.style.display = 'block';
        uploadStatus.style.color   = 'var(--gold-light)';
        uploadStatus.textContent   = 'Фото загружено ✦';
        /* Reload page to show new photo */
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        uploadStatus.style.display = 'block';
        uploadStatus.style.color   = '#e08060';
        uploadStatus.textContent   = 'Ошибка: ' + err.message;
        btn.disabled = false;
        btn.textContent = 'Загрузить';
      }
    });
  }
})();
