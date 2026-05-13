/* ═══════════════════════════════════════════════
   MEMORY PAGE — fetches from /api/people
   ═══════════════════════════════════════════════ */

(function () {
  const PER_PAGE = 9;
  let currentPage = 1;
  let totalPages  = 1;

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

  async function renderPage(page) {
    currentPage = page;
    showSkeleton();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await API.get(`/api/people?page=${page}&limit=${PER_PAGE}`);
      totalPages = data.pages || 1;

      grid.style.opacity = '0';
      grid.style.transform = 'translateY(12px)';
      setTimeout(() => {
        grid.innerHTML = data.data.map(buildCard).join('');
        grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
      }, 150);

      renderPagination();
    } catch (err) {
      grid.innerHTML = `<p style="color:var(--cream-dim);text-align:center;grid-column:1/-1;font-style:italic;">Не удалось загрузить данные.<br><small>${err.message}</small></p>`;
    }
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
    pag.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => renderPage(+btn.dataset.page)));
    pag.querySelector('#pag-prev')?.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
    pag.querySelector('#pag-next')?.addEventListener('click', () => { if (currentPage < totalPages) renderPage(currentPage + 1); });
  }

  renderPage(1);
})();
