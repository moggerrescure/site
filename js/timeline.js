/* ═══════════════════════════════════════════════
   TIMELINE — Family chronicle built from PEOPLE
   ═══════════════════════════════════════════════ */

(function () {
  const wrap = document.getElementById('timeline');
  if (!wrap) return;

  /* Build events from PEOPLE */
  const events = [];

  function parseYear(dateStr) {
    const m = dateStr.match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  }

  PEOPLE.forEach(p => {
    const by = parseYear(p.born);
    const dy = parseYear(p.died);
    if (by) events.push({
      year: by, type: 'birth', person: p,
      title: 'Родился / Родилась',
      subtitle: `${p.name}`,
      city: p.city,
    });
    if (dy) events.push({
      year: dy, type: 'death', person: p,
      title: 'Ушёл из жизни / Ушла из жизни',
      subtitle: `${p.name}`,
      city: p.city,
    });
  });

  /* Add some historical family milestones */
  const extra = [
    { year: 1941, type: 'era', title: 'Начало войны', subtitle: 'Многие члены семьи уходят на фронт', city: '' },
    { year: 1945, type: 'era', title: 'День Победы', subtitle: 'Семья встречает конец войны', city: '' },
    { year: 1961, type: 'era', title: 'Полёт Гагарина', subtitle: 'Эпоха большой надежды', city: '' },
    { year: 1991, type: 'era', title: 'Новое время', subtitle: 'Страна меняется, семья остаётся', city: '' },
  ];
  events.push(...extra);

  /* Sort ascending by year */
  events.sort((a, b) => a.year - b.year);

  /* Symbols */
  const ICON = {
    birth: '✿',
    death: '✦',
    era:   '❧',
  };

  function buildEvent(e, i) {
    const side = i % 2 === 0 ? 'left' : 'right';
    const personLink = e.person
      ? `<a class="timeline__link" href="person.html?id=${e.person.id}">открыть страницу памяти →</a>`
      : '';
    const cityHtml = e.city
      ? `<span class="timeline__city">${e.city}</span>`
      : '';

    return `
      <article class="timeline__item timeline__item--${side} timeline__item--${e.type}" style="--i:${i}">
        <div class="timeline__marker">
          <span class="timeline__marker-icon">${ICON[e.type]}</span>
        </div>
        <div class="timeline__card">
          <div class="timeline__year">${e.year}</div>
          <h3 class="timeline__title">${e.title}</h3>
          <p class="timeline__subtitle">${e.subtitle}</p>
          ${cityHtml}
          ${personLink}
        </div>
      </article>`;
  }

  wrap.insertAdjacentHTML('beforeend', events.map(buildEvent).join(''));

  /* Fade-in on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });

  wrap.querySelectorAll('.timeline__item').forEach(el => io.observe(el));
})();
