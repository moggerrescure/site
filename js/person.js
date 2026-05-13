/* ═══════════════════════════════════════════════
   PERSON PAGE — медиа-карусель + расширенные
   воспоминания с типами (текст / фото / видео)
   ═══════════════════════════════════════════════ */

(function () {
  const main = document.getElementById('person-main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { showNotFound(); return; }

  const personSVG = (typeof PERSON_SVG !== 'undefined') ? PERSON_SVG :
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
    </svg>`;

  /* ── BREADCRUMBS ── */
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

  /* ── LOAD ── */
  async function loadPerson() {
    try {
      if (typeof API !== 'undefined') {
        const res = await API.get(`/api/people/${encodeURIComponent(id)}`);
        if (res && res.data) { render(res.data, 'api'); return; }
      }
    } catch (_) {}

    if (typeof PEOPLE !== 'undefined') {
      const found = PEOPLE.find(p => p.id === id);
      if (found) {
        const person = { ...found };
        if (found.burial && typeof found.burial === 'object') {
          person.burial       = found.burial.place || '';
          person.burial_query = found.burial.query || found.burial.place || '';
        }
        /* merge localStorage reviews */
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

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  function render(person, source) {
    document.title = `${person.name} — Память`;

    const bcName = document.getElementById('breadcrumb-name');
    if (bcName) bcName.textContent = person.name.split(' ').slice(0, 2).join(' ');

    const age = typeof calcAge === 'function' ? calcAge(person.born, person.died) : null;

    let reviews = Array.isArray(person.reviews) ? person.reviews : [];
    if (source === 'api') {
      try {
        const stored = JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]');
        if (Array.isArray(stored)) reviews = [...reviews, ...stored];
      } catch {}
    }

    /* медиа-заглушки из data.js или пустой массив */
    const media = Array.isArray(person.media) ? person.media : [];

    const photoHtml = person.photo
      ? `<img src="${person.photo}" alt="${person.name}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>`
      : `<div class="person-header__photo-inner">${personSVG}</div>`;

    const burialPlace = person.burial || '';
    const burialQuery = person.burial_query || burialPlace;

    main.innerHTML = `
      <section class="person-page">
        <a href="memory.html" class="person-back">ко всем страницам памяти</a>

        <!-- HEADER -->
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

        <!-- MEDIA GALLERY -->
        <section class="media-section">
          <h2 class="person-sec-title">Фотографии и видео</h2>
          <div class="media-carousel" id="media-carousel">
            <span class="media-counter" id="media-counter">1 / ${media.length || 1}</span>
            <button class="media-arrow media-arrow--prev" id="media-prev" aria-label="Предыдущий">‹</button>
            <div class="media-track-wrap">
              <div class="media-track" id="media-track"></div>
            </div>
            <button class="media-arrow media-arrow--next" id="media-next" aria-label="Следующий">›</button>
            <div class="media-dots" id="media-dots"></div>
          </div>
        </section>

        <!-- REVIEWS + FORM -->
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

          <!-- РАСШИРЕННАЯ ФОРМА -->
          <form class="review-form" id="review-form" enctype="multipart/form-data">
            <h3 class="review-form__title">Поделиться воспоминанием</h3>

            <!-- Тип воспоминания -->
            <div class="review-type-tabs" id="review-type-tabs">
              <button type="button" class="review-type-tab review-type-tab--active" data-type="text">
                <span class="review-type-tab__icon">✦</span> Текст
              </button>
              <button type="button" class="review-type-tab" data-type="photo">
                <span class="review-type-tab__icon">📷</span> С фотографией
              </button>
              <button type="button" class="review-type-tab" data-type="quote">
                <span class="review-type-tab__icon">❧</span> Цитата
              </button>
              <button type="button" class="review-type-tab" data-type="memory">
                <span class="review-type-tab__icon">✿</span> Яркий момент
              </button>
            </div>

            <input type="hidden" name="reviewType" id="review-type-input" value="text"/>

            <!-- Поле загрузки фото (показывается при типе photo) -->
            <div class="review-media-field" id="review-media-field">
              <label class="review-media-upload">
                <input type="file" name="reviewPhoto" id="review-photo-input" accept="image/*"/>
                <span class="review-media-upload__icon">🖼</span>
                <span>
                  <div class="review-media-upload__text">Прикрепить фотографию</div>
                  <div class="review-media-upload__hint">JPG, PNG, WEBP — до 8 МБ</div>
                </span>
              </label>
              <div class="review-media-preview" id="review-media-preview">
                <img id="review-media-preview-img" src="" alt=""/>
                <button type="button" class="review-media-preview__remove" id="review-media-remove">×</button>
              </div>
            </div>

            <div class="review-form__field">
              <input type="text" class="review-form__input" name="author"
                     placeholder="Ваше имя и кем приходитесь" required maxlength="120"/>
            </div>
            <div class="review-form__field">
              <textarea class="review-form__textarea" name="text" id="review-text"
                        placeholder="Ваше воспоминание..." required maxlength="2000"></textarea>
            </div>
            <button type="submit" class="review-form__submit">Сохранить воспоминание</button>
            <p class="review-form__status" id="review-status"
               style="display:none;text-align:center;margin-top:12px;font-family:var(--font-body);font-style:italic;"></p>
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

    /* ── INIT ALL WIDGETS ── */
    initMediaCarousel(media);
    initReviews(reviews, source);
    initReviewForm(reviews, source);
  }

  /* ════════════════════════════════════════════
     МЕДИА-КАРУСЕЛЬ
     ════════════════════════════════════════════ */
  function initMediaCarousel(media) {
    const track   = document.getElementById('media-track');
    const dots    = document.getElementById('media-dots');
    const prev    = document.getElementById('media-prev');
    const next    = document.getElementById('media-next');
    const counter = document.getElementById('media-counter');
    if (!track) return;

    /* Если нет медиа — показываем заглушки-примеры */
    const items = media.length ? media : getDefaultMedia();

    /* Добавляем кнопку «Добавить» в конец */
    const allSlides = [
      ...items,
      { type: 'add' }
    ];

    /* Сколько слайдов видно одновременно (responsive) */
    function visibleCount() {
      if (window.innerWidth < 540) return 1;
      if (window.innerWidth < 800) return 2;
      return 3;
    }

    let offset = 0;
    const SLIDE_W_PERCENT = () => 100 / visibleCount();

    function buildSlides() {
      track.innerHTML = allSlides.map((item, i) => {
        if (item.type === 'add') {
          return `
            <button class="media-add-btn" id="media-add-btn" title="Добавить медиа">
              <span class="media-add-btn__icon">+</span>
              <span>Добавить фото или видео</span>
            </button>`;
        }
        if (item.type === 'video') {
          return `
            <div class="media-slide" data-index="${i}">
              <span class="media-slide__type-badge">видео</span>
              <div class="media-slide__video-placeholder">
                <div class="media-slide__play">▶</div>
                <span class="media-slide__duration">${item.duration || '0:30'}</span>
              </div>
              <div class="media-slide__caption">${item.caption || 'Видео-воспоминание'}</div>
            </div>`;
        }
        /* photo (default) */
        const isReal = item.src && !item.src.startsWith('__placeholder');
        return `
          <div class="media-slide" data-index="${i}">
            <span class="media-slide__type-badge">фото</span>
            ${isReal
              ? `<img src="${item.src}" alt="${item.caption || ''}"
                      style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px 8px 0 0;"/>`
              : `<div class="media-slide__photo-placeholder">
                  <span class="media-slide__icon">🖼</span>
                  <span class="media-slide__label">${item.label || 'Фотография'}</span>
                </div>`}
            <div class="media-slide__caption">${item.caption || 'Фото-воспоминание'}</div>
          </div>`;
      }).join('');

      /* Ширина слайдов */
      track.querySelectorAll('.media-slide, .media-add-btn').forEach(el => {
        el.style.flex = `0 0 calc(${SLIDE_W_PERCENT()}% - ${(visibleCount() - 1) * 16 / visibleCount()}px)`;
      });
    }

    function updateCarousel() {
      const maxOffset = Math.max(0, allSlides.length - visibleCount());
      offset = Math.min(Math.max(offset, 0), maxOffset);
      const slideW = track.parentElement.offsetWidth / visibleCount();
      track.style.transform = `translateX(-${offset * (slideW + 16)}px)`;
      if (counter) counter.textContent = `${offset + 1} / ${allSlides.length}`;
      /* dots */
      if (dots) {
        const numDots = Math.max(1, allSlides.length - visibleCount() + 1);
        dots.innerHTML = Array.from({ length: numDots }, (_, i) =>
          `<button class="media-dot ${i === offset ? 'media-dot--active' : ''}" data-i="${i}"></button>`
        ).join('');
        dots.querySelectorAll('[data-i]').forEach(d =>
          d.addEventListener('click', () => { offset = +d.dataset.i; updateCarousel(); })
        );
      }
    }

    buildSlides();
    updateCarousel();

    prev?.addEventListener('click', () => { offset--; updateCarousel(); });
    next?.addEventListener('click', () => { offset++; updateCarousel(); });
    window.addEventListener('resize', () => { buildSlides(); updateCarousel(); });

    /* Кнопка «Добавить медиа» — открывает скрытый input */
    document.getElementById('media-add-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('review-photo-input');
      if (inp) {
        /* переключить форму на тип «фото» и скроллить к ней */
        const photoTab = document.querySelector('[data-type="photo"]');
        if (photoTab) photoTab.click();
        document.querySelector('.review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* Дефолтные заглушки если у человека нет медиа */
  function getDefaultMedia() {
    return [
      { type: 'photo', label: 'Портрет',        caption: 'Здесь будет семейное фото' },
      { type: 'photo', label: 'Из семейного архива', caption: 'Фото из личного альбома' },
      { type: 'video', caption: 'Видео-воспоминание',  duration: '1:24' },
      { type: 'photo', label: 'Особый момент',   caption: 'Памятный день' },
    ];
  }

  /* ════════════════════════════════════════════
     КАРУСЕЛЬ ВОСПОМИНАНИЙ
     ════════════════════════════════════════════ */
  function initReviews(reviews) {
    const track = document.getElementById('reviews-track');
    const dots  = document.getElementById('reviews-dots');
    const prev  = document.getElementById('rev-prev');
    const next  = document.getElementById('rev-next');
    let current = 0;

    const REVIEW_TYPE_LABELS = {
      text:   '✦ Текст',
      photo:  '📷 С фотографией',
      quote:  '❧ Цитата',
      memory: '✿ Яркий момент',
    };

    function renderReviews() {
      if (!reviews.length) {
        track.innerHTML = `<div class="review"><div class="review__card">
          <p class="review__text" style="opacity:0.5">Пока нет воспоминаний. Будьте первым.</p>
        </div></div>`;
        dots.innerHTML = '';
        return;
      }

      track.innerHTML = reviews.map(r => {
        const typeBadge = r.reviewType && r.reviewType !== 'text'
          ? `<span class="review__type-badge">${REVIEW_TYPE_LABELS[r.reviewType] || r.reviewType}</span>`
          : '';
        const photoBlock = r.photoDataUrl
          ? `<img class="review__media-img" src="${r.photoDataUrl}" alt="фото к воспоминанию"/>`
          : '';
        return `
          <div class="review">
            <div class="review__card">
              ${typeBadge}
              ${photoBlock}
              <p class="review__text">${r.text}</p>
              <p class="review__author">${r.author}</p>
            </div>
          </div>`;
      }).join('');

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

    /* Вернуть функцию для перерендера (после добавления) */
    return { renderReviews, reviews, setCurrent: v => { current = v; } };
  }

  /* ════════════════════════════════════════════
     РАСШИРЕННАЯ ФОРМА
     ════════════════════════════════════════════ */
  function initReviewForm(reviews, source) {
    const form        = document.getElementById('review-form');
    const status      = document.getElementById('review-status');
    const typeInput   = document.getElementById('review-type-input');
    const mediaField  = document.getElementById('review-media-field');
    const photoInput  = document.getElementById('review-photo-input');
    const preview     = document.getElementById('review-media-preview');
    const previewImg  = document.getElementById('review-media-preview-img');
    const removeBtn   = document.getElementById('review-media-remove');
    const textarea    = document.getElementById('review-text');
    if (!form) return;

    let selectedPhotoDataUrl = null;

    /* ── Тип-вкладки ── */
    const TYPE_PLACEHOLDERS = {
      text:   'Напишите своё воспоминание...',
      photo:  'Подпишите фотографию или расскажите что на ней...',
      quote:  'Любимое выражение или слова, которые вы запомнили...',
      memory: 'Расскажите о ярком моменте, который вы не забудете...',
    };

    document.querySelectorAll('.review-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.review-type-tab').forEach(t => t.classList.remove('review-type-tab--active'));
        tab.classList.add('review-type-tab--active');
        const type = tab.dataset.type;
        typeInput.value = type;
        /* Показываем/скрываем поле фото */
        if (type === 'photo') {
          mediaField.classList.add('is-visible');
        } else {
          mediaField.classList.remove('is-visible');
          /* сброс фото если переключились */
          selectedPhotoDataUrl = null;
          if (photoInput) photoInput.value = '';
          preview?.classList.remove('is-visible');
        }
        if (textarea) textarea.placeholder = TYPE_PLACEHOLDERS[type] || TYPE_PLACEHOLDERS.text;
      });
    });

    /* ── Превью фото ── */
    photoInput?.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        selectedPhotoDataUrl = e.target.result;
        if (previewImg)  previewImg.src = selectedPhotoDataUrl;
        preview?.classList.add('is-visible');
      };
      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', () => {
      selectedPhotoDataUrl = null;
      if (photoInput) photoInput.value = '';
      if (previewImg) previewImg.src = '';
      preview?.classList.remove('is-visible');
    });

    /* ════════════════════════════════════════════
       МОДАЛКА ПАРОЛЯ — показывается ПЕРЕД сохранением
       ════════════════════════════════════════════ */

    /**
     * Показывает модальное окно с запросом пароля.
     * @returns {Promise<string>} резолвится с введённым паролем
     *                            или реджектится если пользователь закрыл.
     */
    function showCodeModal() {
      return new Promise((resolve, reject) => {
        /* Убираем старую если есть */
        document.getElementById('code-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'code-overlay';
        overlay.id        = 'code-overlay';
        overlay.innerHTML = `
          <div class="code-modal" role="dialog" aria-modal="true" aria-labelledby="code-title">
            <button class="code-modal__close" id="code-close" aria-label="Закрыть">×</button>
            <span class="code-modal__icon">🔒</span>
            <h2 class="code-modal__title" id="code-title">Код доступа</h2>
            <p class="code-modal__sub">
              Для сохранения воспоминания введите<br/>
              8-значный код, который вы получили.
            </p>
            <div class="code-modal__input-wrap">
              <input
                type="text"
                id="code-input"
                class="code-modal__input"
                placeholder="••••••••"
                maxlength="8"
                inputmode="text"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <p class="code-modal__error" id="code-error"></p>
            <p class="code-modal__hint">Введите <span id="code-len">0</span> / 8 символов</p>
            <button class="code-modal__submit" id="code-submit" disabled>
              Подтвердить
            </button>
            <p class="code-modal__footer">
              Ещё нет кода?
              <a href="mailto:admin@memory.site">Обратитесь к администратору</a>
            </p>
          </div>`;

        document.body.appendChild(overlay);

        const input    = document.getElementById('code-input');
        const errEl    = document.getElementById('code-error');
        const submitBtn= document.getElementById('code-submit');
        const lenEl    = document.getElementById('code-len');
        const closeBtn = document.getElementById('code-close');

        /* Фокус на поле */
        setTimeout(() => input?.focus(), 80);

        /* Обновляем счётчик и кнопку */
        input.addEventListener('input', () => {
          const len = input.value.trim().length;
          if (lenEl) lenEl.textContent = len;
          submitBtn.disabled = len < 8;
          /* сбрасываем ошибку при вводе */
          input.classList.remove('code-modal__input--error');
          errEl.textContent = '';
        });

        /* Закрытие — reject */
        function close() {
          overlay.remove();
          reject(new Error('cancelled'));
        }
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function onEsc(e) {
          if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
        });

        /* Кнопка ripple */
        submitBtn.addEventListener('mousemove', e => {
          const r = submitBtn.getBoundingClientRect();
          submitBtn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
          submitBtn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
        });

        /* ── Проверка пароля ── */
        async function tryCode() {
          const code = input.value.trim();
          if (code.length < 8) return;

          submitBtn.disabled = true;
          submitBtn.textContent = '';
          submitBtn.classList.add('code-modal__submit--loading');
          submitBtn.textContent = 'Проверяем';
          errEl.textContent = '';

          let valid = false;

          /* 1. Спрашиваем сервер */
          try {
            if (typeof API !== 'undefined') {
              const res = await API.post(
                `/api/people/${encodeURIComponent(id)}/verify-code`,
                { code }
              );
              valid = res && res.ok === true;
            }
          } catch (_) {
            /* Если сервер недоступен — пробуем локальный fallback */
          }

          /* 2. Оффлайн-фоллбэк: проверяем в localStorage (для демо) */
          if (!valid) {
            const localCode = localStorage.getItem(`person_code_${id}`) || 'MEMORYOK';
            valid = (code === localCode);
          }

          submitBtn.classList.remove('code-modal__submit--loading');

          if (valid) {
            /* Успех — анимация и закрытие */
            overlay.querySelector('.code-modal')?.classList.add('code-modal--success');
            submitBtn.textContent = '✓ Принято';
            submitBtn.style.background = 'linear-gradient(135deg,#3a8a5a,#5ab87a)';
            setTimeout(() => {
              overlay.remove();
              resolve(code);
            }, 600);
          } else {
            /* Ошибка */
            input.classList.add('code-modal__input--error');
            errEl.textContent = 'Неверный код. Попробуйте ещё раз.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Подтвердить';
            input.focus();
            /* Убираем класс ошибки через 0.4s чтобы анимация могла снова сработать */
            setTimeout(() => input.classList.remove('code-modal__input--error'), 600);
          }
        }

        submitBtn.addEventListener('click', tryCode);
        input.addEventListener('keydown', e => { if (e.key === 'Enter' && !submitBtn.disabled) tryCode(); });
      });
    }

    /* ── Submit — сначала пароль, потом сохранение ── */
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd     = new FormData(form);
      const author = (fd.get('author') || '').toString().trim();
      const text   = (fd.get('text')   || '').toString().trim();
      const rType  = (fd.get('reviewType') || 'text').toString();
      if (!author || !text) return;

      /* ── Запрашиваем пароль ── */
      try {
        await showCodeModal();
      } catch (_) {
        /* Пользователь закрыл — просто выходим */
        return;
      }

      const btn = form.querySelector('.review-form__submit');
      btn.disabled    = true;
      btn.textContent = 'Сохраняем...';

      const newReview = {
        author,
        text,
        reviewType: rType,
        ...(selectedPhotoDataUrl ? { photoDataUrl: selectedPhotoDataUrl } : {}),
      };

      /* Try API */
      let saved = false;
      try {
        if (typeof API !== 'undefined') {
          const res = await API.post(`/api/reviews/${encodeURIComponent(id)}`, { author, text });
          if (res && res.data) {
            reviews.unshift({ ...res.data, reviewType: rType, photoDataUrl: selectedPhotoDataUrl });
            saved = true;
          }
        }
      } catch (_) {}

      /* Fallback localStorage (включая фото как dataUrl) */
      if (!saved) {
        reviews.unshift(newReview);
        try {
          const stored = JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]');
          stored.unshift(newReview);
          localStorage.setItem(`reviews_${id}`, JSON.stringify(stored));
        } catch {}
      }

      /* Если добавили фото — также показываем в медиа-карусели */
      if (selectedPhotoDataUrl) {
        addToMediaCarousel(selectedPhotoDataUrl, author);
      }

      /* Сброс формы */
      form.reset();
      typeInput.value = 'text';
      selectedPhotoDataUrl = null;
      preview?.classList.remove('is-visible');
      mediaField?.classList.remove('is-visible');
      document.querySelectorAll('.review-type-tab').forEach((t, i) =>
        t.classList.toggle('review-type-tab--active', i === 0));
      if (textarea) textarea.placeholder = TYPE_PLACEHOLDERS.text;

      /* Перерендер карусели воспоминаний */
      initReviews(reviews);

      status.style.display = 'block';
      status.style.color   = 'var(--gold-light)';
      status.textContent   = 'Воспоминание сохранено ✦';
      setTimeout(() => { status.style.display = 'none'; }, 3500);

      document.getElementById('reviews-carousel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled    = false;
      btn.textContent = 'Сохранить воспоминание';
    });
  }

  /* Добавляет новое фото в медиа-карусель на лету */
  function addToMediaCarousel(dataUrl, caption) {
    const track = document.getElementById('media-track');
    if (!track) return;
    const addBtn = document.getElementById('media-add-btn');
    const slide = document.createElement('div');
    slide.className = 'media-slide';
    slide.innerHTML = `
      <span class="media-slide__type-badge">фото</span>
      <img src="${dataUrl}" alt="${caption}"
           style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px 8px 0 0;"/>
      <div class="media-slide__caption">${caption}</div>`;
    /* вставляем перед кнопкой «Добавить» */
    if (addBtn) track.insertBefore(slide, addBtn);
    else track.appendChild(slide);
  }

  loadPerson();
})();
