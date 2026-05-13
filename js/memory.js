/* ═══════════════════════════════════════════════
   MEMORY PAGE — Cards + Pagination
   Uses shared PEOPLE from data.js
   ═══════════════════════════════════════════════ */

(function () {
  const PER_PAGE = 9; /* 3 columns × 3 rows */
  let currentPage = 1;
  const totalPages = Math.ceil(PEOPLE.length / PER_PAGE);

  const grid = document.getElementById('memory-grid');
  const pag  = document.getElementById('pagination');
  if (!grid || !pag) return;

  /* SVG person silhouette */
  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  function buildCard(person) {
    return `
      <a class="person-card" href="person.html?id=${person.id}">
        <div class="person-card__photo">
          <div class="person-card__photo-inner">${personSVG}</div>
        </div>
        <div class="person-card__body">
          <h3 class="person-card__name">${person.name}</h3>
          <p class="person-card__dates">${person.born} — ${person.died}</p>
          <p class="person-card__city">${person.city}</p>
        </div>
      </a>`;
  }

  function renderPage(page) {
    currentPage = page;
    const start = (page - 1) * PER_PAGE;
    const slice = PEOPLE.slice(start, start + PER_PAGE);

    grid.style.opacity = '0';
    grid.style.transform = 'translateY(12px)';
    setTimeout(() => {
      grid.innerHTML = slice.map(buildCard).join('');
      grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      grid.style.opacity = '1';
      grid.style.transform = 'translateY(0)';
    }, 200);

    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPagination() {
    let html = '';

    html += `<button class="pagination__btn" id="pag-prev" aria-label="Назад" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="pagination__dots">···</span>`;
      }
    }

    html += `<button class="pagination__btn" id="pag-next" aria-label="Вперёд" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

    pag.innerHTML = html;

    pag.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => renderPage(+btn.dataset.page));
    });
    const prev = pag.querySelector('#pag-prev');
    const next = pag.querySelector('#pag-next');
    if (prev) prev.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
    if (next) next.addEventListener('click', () => { if (currentPage < totalPages) renderPage(currentPage + 1); });
  }

  renderPage(1);
})();
