/* ═══════════════════════════════════════════════
   MEMORY PAGE — API с fallback на data.js
   ═══════════════════════════════════════════════ */

(function () {
  const PER_PAGE = 9;
  let currentPage = 1;
  let totalPages  = 1;
  let allPeople   = [];

  const grid = document.getElementById('memory-grid');
  const pag  = document.getElementById('pagination');
  if (!grid || !pag) return;

  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  function photoEl(person) {
    if (person.photo) {
      return `<img src="${person.photo}" alt="${person.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>`;
    }
    return `<div class="person-card__photo-inner">${personSVG}</div>`;
  }

  function buildCard(person) {
    return `
      <a class="person-card" href="person.html?id=${encodeURIComponent(person.id)}">
        <div class="person-card__photo">${photoEl(person)}</div>
        <div class="person-card__body">
          <h3 class="person-card__name">${person.name}</h3>
          <p class="person-card__dates">${person.born} — ${person.died || '...'}</p>
          <p class="person-card__city">${person.city}</p>
        </div>
      </a>`;
  }

  function showSkeleton() {
    grid.innerHTML = Array(PER_PAGE).fill(`
      <div class="person-card person-card--skeleton">
        <div class="person-card__photo skel-block"></div>
        <div class="person-card__body">
          <div class="skel-line skel-line--lg"></div>
          <div class="skel-line"></div>
          <div class="skel-line skel-line--sm"></div>
        </div>
      </div>`).join('');
  }

  /* Render a slice of allPeople for given page */
  function renderSlice(page) {
    currentPage = page;
    totalPages  = Math.ceil(allPeople.length / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const slice = allPeople.slice(start, start + PER_PAGE);

    grid.style.opacity   = '0';
    grid.style.transform = 'translateY(12px)';
    setTimeout(() => {
      grid.innerHTML = slice.map(buildCard).join('');
      grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      grid.style.opacity    = '1';
      grid.style.transform  = 'translateY(0)';
    }, 150);

    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPagination() {
    let html = `<button class="pagination__btn" id="pag-prev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="pagination__dots">···</span>`;
      }
    }
    html += `<button class="pagination__btn" id="pag-next" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

    pag.innerHTML = html;
    pag.querySelectorAll('[data-page]').forEach(btn =>
      btn.addEventListener('click', () => renderSlice(+btn.dataset.page)));
    pag.querySelector('#pag-prev')?.addEventListener('click', () => {
      if (currentPage > 1) renderSlice(currentPage - 1);
    });
    pag.querySelector('#pag-next')?.addEventListener('click', () => {
      if (currentPage < totalPages) renderSlice(currentPage + 1);
    });
  }

  /* ── INIT: try API first, fallback to PEOPLE from data.js ── */
  async function init() {
    showSkeleton();

    /* Try API (works when Node server is running on port 3000) */
    try {
      if (typeof API !== 'undefined') {
        const data = await API.get('/api/people?page=1&limit=100');
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          allPeople = data.data;
          renderSlice(1);
          return;
        }
      }
    } catch (_) { /* API not available — use local data */ }

    /* Fallback: use PEOPLE from data.js */
    if (typeof PEOPLE !== 'undefined' && PEOPLE.length) {
      allPeople = PEOPLE;
      renderSlice(1);
    } else {
      grid.innerHTML = `<p style="color:var(--cream-dim);text-align:center;grid-column:1/-1;font-style:italic;padding:60px 0;">
        Нет данных для отображения.</p>`;
    }
  }

  init();
})();
