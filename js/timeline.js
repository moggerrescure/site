/* ═══════════════════════════════════════════════
   TIMELINE — Family chronicle
   • Auto-events from PEOPLE data
   • Historical events of Russia/USSR
   • User custom events (localStorage)
   • Filters: type + decade
   • Life-span counter per person
   • Add-event form
   ═══════════════════════════════════════════════ */

(function () {
  const wrap = document.getElementById('timeline');
  if (!wrap) return;

  /* ── RUSSIA / USSR HISTORICAL EVENTS ── */
  const HISTORY = [
    { year: 1905, title: 'Первая русская революция',    desc: 'Волнения по всей стране',                 icon: '🏛' },
    { year: 1914, title: 'Первая мировая война',         desc: 'Россия вступает в войну',                 icon: '⚔' },
    { year: 1917, title: 'Революция 1917 года',          desc: 'Смена власти, рождение СССР',             icon: '🔴' },
    { year: 1922, title: 'Образование СССР',             desc: 'Новое государство',                       icon: '⭐' },
    { year: 1941, title: 'Великая Отечественная война',  desc: 'Вся страна встала на защиту Родины',      icon: '🎖' },
    { year: 1945, title: 'День Победы',                  desc: '9 мая — конец войны',                     icon: '🕊' },
    { year: 1957, title: 'Спутник',                      desc: 'СССР запускает первый спутник Земли',     icon: '🛰' },
    { year: 1961, title: 'Полёт Гагарина',               desc: 'Человек впервые вышел в космос',          icon: '🚀' },
    { year: 1986, title: 'Авария на ЧАЭС',               desc: 'Чернобыль меняет эпоху',                  icon: '☢' },
    { year: 1991, title: 'Распад СССР',                  desc: 'Страна меняется навсегда',                icon: '📌' },
    { year: 1998, title: 'Экономический кризис',         desc: 'Дефолт, цены взлетели',                   icon: '📉' },
    { year: 2000, title: 'Новое тысячелетие',            desc: 'Россия входит в XXI век',                 icon: '🌅' },
  ];

  /* ── PARSE YEAR ── */
  function parseYear(s) {
    const m = (s || '').match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ── CALC AGE ── */
  function lifeYears(born, died) {
    const b = parseYear(born), d = parseYear(died) || new Date().getFullYear();
    return (b && d) ? d - b : null;
  }

  /* ── LOAD CUSTOM EVENTS ── */
  const STORAGE_KEY = 'memory_custom_events';
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveCustom(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  }

  /* ── BUILD EVENT LIST ── */
  function buildEvents() {
    const events = [];

    /* From PEOPLE */
    (typeof PEOPLE !== 'undefined' ? PEOPLE : []).forEach(p => {
      const by = parseYear(p.born), dy = parseYear(p.died);
      const age = lifeYears(p.born, p.died);
      if (by) events.push({
        year: by, type: 'birth', person: p,
        title: 'Родился / Родилась',
        subtitle: p.name,
        city: p.city,
        age: null,
      });
      if (dy) events.push({
        year: dy, type: 'death', person: p,
        title: 'Ушёл из жизни / Ушла из жизни',
        subtitle: p.name,
        city: p.city,
        age: age,
      });
    });

    /* Historical */
    HISTORY.forEach(h => events.push({
      year: h.year, type: 'history',
      title: h.title,
      subtitle: h.desc,
      city: '',
      icon: h.icon,
    }));

    /* Custom */
    loadCustom().forEach(c => events.push({ ...c, type: c.type || 'custom' }));

    events.sort((a, b) => a.year - b.year);
    return events;
  }

  /* ── ICONS ── */
  const ICON = {
    birth:   '✿',
    death:   '✦',
    history: '❧',
    custom:  '★',
    era:     '❧',
  };

  /* ── RENDER ONE EVENT ── */
  function buildEventHTML(e, i) {
    const side       = i % 2 === 0 ? 'left' : 'right';
    const icon       = e.icon || ICON[e.type] || '◆';
    const personLink = e.person
      ? `<a class="timeline__link" href="person.html?id=${e.person.id}">страница памяти →</a>`
      : '';
    const ageTag = e.age
      ? `<span class="timeline__age">${e.age} лет прожито</span>`
      : '';
    const cityHtml = e.city
      ? `<span class="timeline__city">${e.city}</span>`
      : '';
    const customDel = e.type === 'custom'
      ? `<button class="timeline__del" data-id="${e.id}" title="Удалить">×</button>`
      : '';
    const histClass = e.type === 'history' ? ' timeline__card--history' : '';

    return `
      <article class="timeline__item timeline__item--${side} timeline__item--${e.type}"
               data-type="${e.type}" data-year="${e.year}">
        <div class="timeline__marker">
          <span class="timeline__marker-icon">${icon}</span>
        </div>
        <div class="timeline__card${histClass}">
          ${customDel}
          <div class="timeline__year">${e.year}</div>
          <h3 class="timeline__title">${e.title}</h3>
          <p class="timeline__subtitle">${e.subtitle}</p>
          <div class="timeline__meta">
            ${cityHtml}
            ${ageTag}
          </div>
          ${personLink}
        </div>
      </article>`;
  }

  /* ── STATS BAR ── */
  function buildStats(events) {
    const births   = events.filter(e => e.type === 'birth').length;
    const deaths   = events.filter(e => e.type === 'death').length;
    const custom   = events.filter(e => e.type === 'custom').length;
    const histEv   = events.filter(e => e.type === 'history').length;
    const allAges  = events.filter(e => e.age).map(e => e.age);
    const avgAge   = allAges.length
      ? Math.round(allAges.reduce((s,a) => s+a, 0) / allAges.length)
      : '—';
    const maxAge   = allAges.length ? Math.max(...allAges) : '—';
    const span     = events.length
      ? events[events.length-1].year - events[0].year
      : 0;

    return `
      <div class="tl-stats">
        <div class="tl-stat"><span>${births}</span><small>рождений</small></div>
        <div class="tl-stat"><span>${deaths}</span><small>уходов</small></div>
        <div class="tl-stat"><span>${avgAge}</span><small>средний возраст</small></div>
        <div class="tl-stat"><span>${maxAge}</span><small>макс. возраст</small></div>
        <div class="tl-stat"><span>${span}</span><small>лет охвата</small></div>
        <div class="tl-stat"><span>${histEv}</span><small>событий истории</small></div>
        <div class="tl-stat"><span>${custom}</span><small>свои события</small></div>
      </div>`;
  }

  /* ── DECADE LIST ── */
  function getDecades(events) {
    const d = new Set(events.map(e => Math.floor(e.year / 10) * 10));
    return [...d].sort((a,b) => a-b);
  }

  /* ── MAIN RENDER ── */
  let activeType   = 'all';
  let activeDecade = 'all';

  function render() {
    const allEvents = buildEvents();

    /* Insert stats */
    let statsEl = document.getElementById('tl-stats-bar');
    if (!statsEl) {
      statsEl = document.createElement('div');
      statsEl.id = 'tl-stats-bar';
      wrap.parentElement.insertBefore(statsEl, wrap);
    }
    statsEl.innerHTML = buildStats(allEvents);

    /* Build / update filters */
    let filtersEl = document.getElementById('tl-filters');
    if (!filtersEl) {
      filtersEl = document.createElement('div');
      filtersEl.id = 'tl-filters';
      statsEl.after(filtersEl);
    }

    const decades = getDecades(allEvents);
    filtersEl.innerHTML = `
      <div class="tl-filters">
        <div class="tl-filters__group">
          <span class="tl-filters__label">Тип</span>
          ${['all','birth','death','history','custom'].map(t => `
            <button class="tl-filter-btn ${activeType===t?'tl-filter-btn--active':''}" data-ftype="${t}">
              ${t==='all'?'Все':t==='birth'?'Рождения':t==='death'?'Уходы':t==='history'?'История страны':'Мои события'}
            </button>`).join('')}
        </div>
        <div class="tl-filters__group">
          <span class="tl-filters__label">Период</span>
          <button class="tl-filter-btn ${activeDecade==='all'?'tl-filter-btn--active':''}" data-fdecade="all">Все годы</button>
          ${decades.map(d => `
            <button class="tl-filter-btn ${activeDecade==d?'tl-filter-btn--active':''}" data-fdecade="${d}">
              ${d}–${d+9}
            </button>`).join('')}
        </div>
      </div>`;

    filtersEl.querySelectorAll('[data-ftype]').forEach(btn => {
      btn.addEventListener('click', () => { activeType = btn.dataset.ftype; render(); });
    });
    filtersEl.querySelectorAll('[data-fdecade]').forEach(btn => {
      btn.addEventListener('click', () => { activeDecade = btn.dataset.fdecade === 'all' ? 'all' : parseInt(btn.dataset.fdecade); render(); });
    });

    /* Filter events */
    const filtered = allEvents.filter(e => {
      const typeOk   = activeType === 'all' || e.type === activeType;
      const decadeOk = activeDecade === 'all' || Math.floor(e.year / 10) * 10 === activeDecade;
      return typeOk && decadeOk;
    });

    /* Clear and rebuild timeline items */
    wrap.querySelectorAll('.timeline__item').forEach(el => el.remove());

    if (!filtered.length) {
      wrap.insertAdjacentHTML('beforeend',
        `<p style="text-align:center;color:var(--cream-dim);font-style:italic;padding:60px 0;">
           Нет событий для выбранных фильтров</p>`);
    } else {
      wrap.insertAdjacentHTML('beforeend', filtered.map(buildEventHTML).join(''));
    }

    /* Delete custom events */
    wrap.querySelectorAll('.timeline__del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const arr = loadCustom().filter(ev => ev.id !== id);
        saveCustom(arr);
        render();
      });
    });

    /* Scroll reveal */
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    wrap.querySelectorAll('.timeline__item').forEach(el => io.observe(el));
  }

  /* ── ADD EVENT FORM ── */
  function buildForm() {
    const formSection = document.getElementById('tl-add-form');
    if (!formSection) return;

    formSection.innerHTML = `
      <div class="tl-add-form__inner">
        <h2 class="tl-add-form__title">Добавить событие</h2>
        <p class="tl-add-form__sub">Свадьба, переезд, важная дата — то, чего нет в общих данных</p>
        <form id="tl-form">
          <div class="tl-form-row">
            <div class="tl-form-field">
              <label>Год *</label>
              <input type="number" name="year" min="1800" max="2100" placeholder="1978" required class="tl-input"/>
            </div>
            <div class="tl-form-field">
              <label>Тип</label>
              <select name="type" class="tl-input">
                <option value="custom">Событие семьи</option>
                <option value="birth">Рождение</option>
                <option value="death">Уход</option>
              </select>
            </div>
          </div>
          <div class="tl-form-field">
            <label>Заголовок *</label>
            <input type="text" name="title" placeholder="Переезд в Москву" required class="tl-input" maxlength="80"/>
          </div>
          <div class="tl-form-field">
            <label>Описание</label>
            <input type="text" name="subtitle" placeholder="Короткое описание события" class="tl-input" maxlength="160"/>
          </div>
          <div class="tl-form-row">
            <div class="tl-form-field">
              <label>Город</label>
              <input type="text" name="city" placeholder="Санкт-Петербург" class="tl-input" maxlength="60"/>
            </div>
            <div class="tl-form-field">
              <label>Иконка</label>
              <input type="text" name="icon" placeholder="🏠" class="tl-input tl-input--icon" maxlength="4"/>
            </div>
          </div>
          <button type="submit" class="tl-submit">Добавить в летопись</button>
          <p class="tl-form__status" id="tl-status" style="display:none"></p>
        </form>
      </div>`;

    document.getElementById('tl-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd  = new FormData(e.target);
      const ev  = {
        id:       Date.now().toString(36),
        year:     parseInt(fd.get('year'), 10),
        type:     fd.get('type') || 'custom',
        title:    (fd.get('title') || '').trim(),
        subtitle: (fd.get('subtitle') || '').trim(),
        city:     (fd.get('city')    || '').trim(),
        icon:     (fd.get('icon')    || '').trim() || '★',
      };
      if (!ev.year || !ev.title) return;

      const arr = loadCustom();
      arr.push(ev);
      saveCustom(arr);

      e.target.reset();
      const status = document.getElementById('tl-status');
      status.style.display = 'block';
      status.textContent   = `✦ "${ev.title}" добавлено в ${ev.year} году`;
      setTimeout(() => { status.style.display = 'none'; }, 3000);

      activeType   = 'all';
      activeDecade = 'all';
      render();
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* INIT */
  render();
  buildForm();
})();
