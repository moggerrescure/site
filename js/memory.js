/* ═══════════════════════════════════════════════
   MEMORY PAGE — Cards + Pagination
   ═══════════════════════════════════════════════ */

(function () {
  /* ── Demo data — 18 people ── */
  const PEOPLE = [
    { name: 'Иванова Мария Петровна',    born: '12.03.1918', died: '05.11.1987', city: 'Москва'        },
    { name: 'Иванов Николай Семёнович',  born: '30.07.1915', died: '22.04.1978', city: 'Москва'        },
    { name: 'Смирнова Анна Васильевна',  born: '08.09.1942', died: '14.02.2003', city: 'Санкт-Петербург'},
    { name: 'Смирнов Пётр Иванович',     born: '11.01.1940', died: '30.06.1999', city: 'Санкт-Петербург'},
    { name: 'Козлов Виктор Андреевич',   born: '25.12.1955', died: '18.08.2015', city: 'Казань'        },
    { name: 'Козлова Людмила Фёдоровна', born: '03.06.1958', died: '01.03.2020', city: 'Казань'        },
    { name: 'Орлова Нина Дмитриевна',    born: '17.11.1963', died: '09.09.2019', city: 'Новосибирск'   },
    { name: 'Орлов Сергей Алексеевич',   born: '22.04.1961', died: '14.12.2021', city: 'Новосибирск'   },
    { name: 'Попова Галина Юрьевна',     born: '05.02.1938', died: '27.07.1995', city: 'Екатеринбург'  },
    { name: 'Попов Андрей Николаевич',   born: '14.08.1936', died: '11.05.1993', city: 'Екатеринбург'  },
    { name: 'Фёдорова Ольга Сергеевна',  born: '29.10.1972', died: '03.01.2022', city: 'Ростов-на-Дону'},
    { name: 'Фёдоров Дмитрий Иванович',  born: '07.03.1970', died: '16.11.2023', city: 'Ростов-на-Дону'},
    { name: 'Морозова Татьяна Кузьминична', born: '21.06.1925', died: '30.04.1998', city: 'Воронеж'    },
    { name: 'Морозов Василий Петрович',  born: '10.09.1923', died: '22.08.1991', city: 'Воронеж'       },
    { name: 'Жукова Светлана Григорьевна', born: '15.01.1948', died: '08.06.2007', city: 'Самара'      },
    { name: 'Жуков Игорь Константинович',  born: '09.07.1945', died: '25.02.2011', city: 'Самара'      },
    { name: 'Лебедева Зинаида Михайловна', born: '02.05.1930', died: '17.12.2004', city: 'Уфа'         },
    { name: 'Лебедев Александр Фёдорович', born: '28.11.1928', died: '04.09.2001', city: 'Уфа'         },
  ];

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
      <article class="person-card">
        <div class="person-card__photo">
          <div class="person-card__photo-inner">${personSVG}</div>
        </div>
        <div class="person-card__body">
          <h3 class="person-card__name">${person.name}</h3>
          <p class="person-card__dates">${person.born} — ${person.died}</p>
          <p class="person-card__city">${person.city}</p>
        </div>
      </article>`;
  }

  function renderPage(page) {
    currentPage = page;
    const start = (page - 1) * PER_PAGE;
    const slice = PEOPLE.slice(start, start + PER_PAGE);

    /* Animate out → in */
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(12px)';
    setTimeout(() => {
      grid.innerHTML = slice.map(buildCard).join('');
      grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      grid.style.opacity = '1';
      grid.style.transform = 'translateY(0)';
    }, 200);

    renderPagination();
  }

  function renderPagination() {
    let html = '';

    /* Prev arrow */
    html += `<button class="pagination__btn" id="pag-prev" aria-label="Назад" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    /* Pages */
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

    /* Next arrow */
    html += `<button class="pagination__btn" id="pag-next" aria-label="Вперёд" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

    pag.innerHTML = html;

    /* Events */
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
