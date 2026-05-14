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

        <!-- ЛИАНА ПАМЯТИ -->
        <section class="vine-section" id="vine-section">
          <h2 class="person-sec-title">Лиана памяти</h2>
          <p class="vine-subtitle">Воспоминания близких, переплетённые временем</p>
          <div class="vine-layout" id="vine-layout">
            <div class="vine-rope-wrap" id="vine-rope-wrap">
              <svg class="vine-rope-svg" id="vine-rope-svg" viewBox="0 0 60 1000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <!-- канат будет построен через JS -->
              </svg>
            </div>
            <div class="vine-cards" id="vine-cards"></div>
          </div>
        </section>

        <!-- ФОРМА ДОБАВЛЕНИЯ -->
        <section class="reviews-section" id="reviews-section">
          <h2 class="person-sec-title">Поделиться воспоминанием</h2>

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
    initVine(reviews, media, source);
    initReviewForm(reviews, source);
  }

  /* ════════════════════════════════════════════
     ЛИАНА ПАМЯТИ
     ════════════════════════════════════════════ */
  function initVine(reviews, media, source) {
    const layout   = document.getElementById('vine-layout');
    const cardsEl  = document.getElementById('vine-cards');
    const ropeSvg  = document.getElementById('vine-rope-svg');
    if (!layout || !cardsEl || !ropeSvg) return;

    const REVIEW_TYPE_LABELS = {
      text:   '✦ Текст',
      photo:  '📷 Фотография',
      quote:  '❧ Цитата',
      memory: '✿ Яркий момент',
    };

    /* Объединяем медиа и отзывы в единый список карточек */
    const defaultMedia = [
      { kind: 'media', type: 'photo', label: 'Из семейного архива', caption: 'Фото из личного альбома' },
      { kind: 'media', type: 'photo', label: 'Особый момент',       caption: 'Памятный день' },
      { kind: 'media', type: 'video', caption: 'Видео-воспоминание', duration: '1:24' },
    ];
    const mediaCards = (media.length ? media : defaultMedia).map(m => ({ kind: 'media', ...m }));
    const reviewCards = reviews.map(r => ({ kind: 'review', ...r }));
    const allCards = [...mediaCards, ...reviewCards];

    /* ── Рисуем карточки ── */
    function buildCard(item, idx) {
      const side = idx % 2 === 0 ? 'left' : 'right';

      let inner = '';
      if (item.kind === 'media') {
        if (item.type === 'video') {
          /* Видео: превью слева + инфо справа */
          inner = `
            <div class="vine-card__split">
              <div class="vine-card__split-media">
                <div class="vine-card__media vine-card__media--video">
                  <div class="vine-card__play">▶</div>
                  <span class="vine-card__duration">${item.duration || '0:30'}</span>
                </div>
              </div>
              <div class="vine-card__split-info">
                <span class="vine-card__type-tag">видео</span>
                <p class="vine-card__caption">${item.caption || 'Видео-воспоминание'}</p>
              </div>
            </div>`;
        } else {
          const isReal = item.src && !item.src.startsWith('__placeholder');
          /* Фото: изображение слева + инфо справа */
          inner = `
            <div class="vine-card__split">
              <div class="vine-card__split-media">
                <div class="vine-card__media vine-card__media--photo">
                  ${isReal
                    ? `<img src="${item.src}" alt="${item.caption || ''}" class="vine-card__img"/>`
                    : `<span class="vine-card__photo-icon">🖼</span>
                       <span class="vine-card__photo-label">${item.label || 'Фотография'}</span>`}
                </div>
              </div>
              <div class="vine-card__split-info">
                <span class="vine-card__type-tag">фото</span>
                <p class="vine-card__caption">${item.caption || 'Фото-воспоминание'}</p>
              </div>
            </div>`;
        }
      } else {
        /* review — если есть фото: слева фото, справа текст+автор */
        const badge = item.reviewType && item.reviewType !== 'text'
          ? `<span class="vine-card__type-badge">${REVIEW_TYPE_LABELS[item.reviewType] || ''}</span>`
          : '';
        if (item.photoDataUrl) {
          inner = `
            <div class="vine-card__split">
              <div class="vine-card__split-media">
                <img src="${item.photoDataUrl}" alt="фото" class="vine-card__split-img"/>
              </div>
              <div class="vine-card__split-info">
                ${badge}
                <p class="vine-card__text">${item.text}</p>
                <p class="vine-card__author">${item.author}</p>
              </div>
            </div>`;
        } else {
          /* Без фото — просто текст на всю ширину */
          inner = `
            <div class="vine-card__text-only">
              ${badge}
              <p class="vine-card__text">${item.text}</p>
              <p class="vine-card__author">${item.author}</p>
            </div>`;
        }
      }

      return `
        <div class="vine-card vine-card--${side}" data-vine-idx="${idx}">
          <div class="vine-card__inner">
            ${inner}
          </div>
          <div class="vine-card__connector vine-card__connector--${side}"></div>
          <div class="vine-card__knot vine-card__knot--${side}"></div>
        </div>`;
    }

    if (!allCards.length) {
      cardsEl.innerHTML = `<p class="vine-empty">Воспоминания пока не добавлены. Будьте первым.</p>`;
    } else {
      cardsEl.innerHTML = allCards.map((c, i) => buildCard(c, i)).join('');
    }

    /* ── Строим SVG-нить ── */
    function buildRope() {
      const totalCards = allCards.length || 1;
      const cardH      = 280; /* высота карточки + gap */
      const totalH     = Math.max(600, totalCards * cardH + 200);

      ropeSvg.setAttribute('viewBox', `0 0 40 ${totalH}`);
      ropeSvg.style.height = totalH + 'px';
      layout.style.minHeight = totalH + 'px';

      const cx = 20;

      /* Тонкая нить — плавная кривая Безье с лёгкими изгибами */
      let threadPath = `M ${cx} 0`;
      const segments = Math.ceil(totalH / 80);
      for (let i = 0; i < segments; i++) {
        const y0 = i * 80;
        const y1 = (i + 1) * 80;
        const offset = (i % 2 === 0) ? 3 : -3;
        threadPath += ` C ${cx + offset} ${y0 + 26}, ${cx - offset} ${y0 + 54}, ${cx} ${y1}`;
      }

      /* Узелки — маленькие бриллианты на каждой карточке */
      const knotsHTML = allCards.map((_, i) => {
        const y = 80 + i * cardH;
        return `
          <g class="vine-knot" data-knot-idx="${i}" cursor="pointer">
            <circle cx="${cx}" cy="${y}" r="10" fill="transparent"/>
            <path d="M ${cx} ${y-5} L ${cx+4} ${y} L ${cx} ${y+5} L ${cx-4} ${y} Z"
              class="vine-knot-diamond" fill="url(#threadGlowGrad)" stroke="url(#threadGrad)"
              stroke-width="0.5"/>
            <circle cx="${cx}" cy="${y}" r="1.5" fill="#fff" opacity="0.8"/>
          </g>`;
      }).join('');

      /* Верхний якорь — маленький крест */
      const capHTML = `
        <line x1="${cx-6}" y1="12" x2="${cx+6}" y2="12" stroke="url(#threadGrad)" stroke-width="1" opacity="0.7"/>
        <line x1="${cx}" y1="6" x2="${cx}" y2="18" stroke="url(#threadGrad)" stroke-width="1" opacity="0.7"/>
        <circle cx="${cx}" cy="12" r="2.5" fill="none" stroke="url(#threadGrad)" stroke-width="1" opacity="0.9"/>`;

      /* Нижний якорь */
      const endHTML = `
        <path d="M ${cx-5} ${totalH-14} L ${cx+5} ${totalH-14} L ${cx} ${totalH-6} Z"
          fill="none" stroke="url(#threadGrad)" stroke-width="1" opacity="0.6"/>`;

      ropeSvg.innerHTML = `
        <defs>
          <linearGradient id="threadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#f5e6a3" stop-opacity="1"/>
            <stop offset="30%"  stop-color="#e2c97e" stop-opacity="0.9"/>
            <stop offset="70%"  stop-color="#c8a84b" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#8a7035" stop-opacity="0.4"/>
          </linearGradient>
          <linearGradient id="threadGlowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#fff9e6" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#c8a84b" stop-opacity="0.3"/>
          </linearGradient>
          <filter id="threadGlow" x="-200%" y="-10%" width="500%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="diamondGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        ${capHTML}
        <!-- Нить с glow -->
        <path d="${threadPath}" fill="none" stroke="rgba(200,168,75,0.15)"
          stroke-width="4" stroke-linecap="round"/>
        <path d="${threadPath}" fill="none" stroke="url(#threadGrad)"
          stroke-width="1.2" stroke-linecap="round" filter="url(#threadGlow)"/>
        <path d="${threadPath}" fill="none" stroke="rgba(255,240,180,0.6)"
          stroke-width="0.4" stroke-linecap="round" stroke-dasharray="2 8"/>
        ${knotsHTML}
        ${endHTML}`;

      /* Позиционируем карточки рядом с узелками */
      const cardEls = cardsEl.querySelectorAll('.vine-card');
      cardEls.forEach((el, i) => {
        const y = 80 + i * cardH - 80;
        el.style.top = y + 'px';
      });
    }

    buildRope();

    /* Пересчёт при ресайзе */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildRope, 120);
    });

    /* ── Scroll-reveal анимация ── */
    function initScrollReveal() {
      const cards = cardsEl.querySelectorAll('.vine-card');
      if (!cards.length) return;

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vine-card--visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      cards.forEach(c => io.observe(c));
    }
    initScrollReveal();

    /* ── Анимация сжатия каната при клике ── */
    const ropeWrap = document.getElementById('vine-rope-wrap');
    ropeWrap?.addEventListener('click', (e) => {
      /* Находим ближайший узелок */
      const knot = e.target.closest('.vine-knot');
      if (knot) {
        knot.classList.remove('vine-knot--squeeze');
        void knot.offsetWidth; /* reflow */
        knot.classList.add('vine-knot--squeeze');
        knot.addEventListener('animationend', () =>
          knot.classList.remove('vine-knot--squeeze'), { once: true });
        return;
      }
      /* Клик по самому SVG — сжимаем весь канат */
      ropeSvg.classList.remove('vine-rope--squeeze');
      void ropeSvg.offsetWidth;
      ropeSvg.classList.add('vine-rope--squeeze');
      ropeSvg.addEventListener('animationend', () =>
        ropeSvg.classList.remove('vine-rope--squeeze'), { once: true });
    });

    /* ── Публичный метод для добавления карточки ── */
    window._vineAddCard = function(review) {
      reviews.push(review);
      allCards.push({ kind: 'review', ...review });
      const idx  = allCards.length - 1;
      const html = buildCard({ kind: 'review', ...review }, idx);
      cardsEl.insertAdjacentHTML('beforeend', html);
      buildRope();
      /* reveal нового элемента */
      const newEl = cardsEl.querySelector(`[data-vine-idx="${idx}"]`);
      if (newEl) {
        setTimeout(() => newEl.classList.add('vine-card--visible'), 50);
        newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
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

      /* Если добавили фото — оно войдёт в лиану через newReview */

      /* Сброс формы */
      form.reset();
      typeInput.value = 'text';
      selectedPhotoDataUrl = null;
      preview?.classList.remove('is-visible');
      mediaField?.classList.remove('is-visible');
      document.querySelectorAll('.review-type-tab').forEach((t, i) =>
        t.classList.toggle('review-type-tab--active', i === 0));
      if (textarea) textarea.placeholder = TYPE_PLACEHOLDERS.text;

      /* Перерендер лианы */
      if (typeof window._vineAddCard === 'function') {
        window._vineAddCard(newReview);
      }

      status.style.display = 'block';
      status.style.color   = 'var(--gold-light)';
      status.textContent   = 'Воспоминание сохранено ✦';
      setTimeout(() => { status.style.display = 'none'; }, 3500);

      document.getElementById('vine-section')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      btn.disabled    = false;
      btn.textContent = 'Сохранить воспоминание';
    });
  }

  loadPerson();
})();
