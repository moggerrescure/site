/* ═══════════════════════════════════════════════
   FAMILY TREE — Braided SVG thread connections
   Bottom = oldest, Top = youngest
   ═══════════════════════════════════════════════ */

(function () {
  /* ── FAMILY DATA ──
     Generations ordered BOTTOM→TOP  (index 0 = oldest)
     Each person has an optional spouse.
     children[] = indices in the NEXT generation (gen+1)
  */
  const GENERATIONS = [
    /* Gen 0 — great-grandparents (wooden frames, bottom) */
    {
      label: 'Прапрародители',
      ageClass: 'old',
      people: [
        { id: 'g0p0', name: 'Иванов\nНиколай', years: '1880–1951', spouseOf: 'g0p1' },
        { id: 'g0p1', name: 'Иванова\nМария',   years: '1883–1960', spouseOf: 'g0p0' },
        { id: 'g0p2', name: 'Смирнов\nВасилий', years: '1878–1945', spouseOf: 'g0p3' },
        { id: 'g0p3', name: 'Смирнова\nАнна',   years: '1882–1950', spouseOf: 'g0p2' },
      ],
      childrenMap: {
        'g0p0': ['g1p0'],
        'g0p2': ['g1p1'],
      }
    },
    /* Gen 1 — grandparents */
    {
      label: 'Прародители',
      ageClass: 'old',
      people: [
        { id: 'g1p0', name: 'Иванов\nПётр',   years: '1910–1978', spouseOf: 'g1p1' },
        { id: 'g1p1', name: 'Иванова\nНина',   years: '1914–1983', spouseOf: 'g1p0' },
        { id: 'g1p2', name: 'Смирнов\nАлексей', years: '1908–1970', spouseOf: 'g1p3' },
        { id: 'g1p3', name: 'Смирнова\nТатьяна', years: '1912–1980', spouseOf: 'g1p2' },
      ],
      childrenMap: {
        'g1p0': ['g2p0'],
        'g1p2': ['g2p1'],
      }
    },
    /* Gen 2 — parents */
    {
      label: 'Родители',
      ageClass: 'young',
      people: [
        { id: 'g2p0', name: 'Иванов\nСергей',  years: '1945–2010', spouseOf: 'g2p1' },
        { id: 'g2p1', name: 'Иванова\nОльга',   years: '1948–2015', spouseOf: 'g2p0' },
        { id: 'g2p2', name: 'Смирнов\nДмитрий', years: '1943–2005', spouseOf: 'g2p3' },
        { id: 'g2p3', name: 'Смирнова\nЕлена',  years: '1947–2018', spouseOf: 'g2p2' },
      ],
      childrenMap: {
        'g2p0': ['g3p0', 'g3p1'],
        'g2p2': ['g3p2'],
      }
    },
    /* Gen 3 — current generation (paper frames, top) */
    {
      label: 'Наше поколение',
      ageClass: 'young',
      people: [
        { id: 'g3p0', name: 'Иванов\nМихаил',   years: '1972–', spouseOf: 'g3p3' },
        { id: 'g3p1', name: 'Иванова\nЮлия',     years: '1975–', spouseOf: null   },
        { id: 'g3p2', name: 'Смирнова\nКсения',  years: '1970–', spouseOf: null   },
        { id: 'g3p3', name: 'Козлова\nАлина',    years: '1974–', spouseOf: 'g3p0' },
      ],
      childrenMap: {}
    },
  ];

  /* ── DOM SETUP ── */
  const wrapper    = document.getElementById('tree-wrapper');
  const svgEl      = document.getElementById('tree-threads');
  const gensEl     = document.getElementById('tree-generations');
  if (!wrapper || !svgEl || !gensEl) return;

  /* Map id → DOM node */
  const nodeEls = {};

  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  /* Build generations — reversed so Gen0 is at bottom */
  const reversed = [...GENERATIONS].reverse();

  reversed.forEach((gen, ri) => {
    const genIndex = GENERATIONS.length - 1 - ri; /* original index */

    const rowWrap = document.createElement('div');

    const lbl = document.createElement('div');
    lbl.className = 'gen-label';
    lbl.textContent = gen.label;
    rowWrap.appendChild(lbl);

    const row = document.createElement('div');
    row.className = 'gen-row';
    row.dataset.genIndex = genIndex;

    gen.people.forEach(person => {
      const node = document.createElement('div');
      node.className = `tree-node tree-node--${gen.ageClass}`;
      node.dataset.id = person.id;

      const nameParts = person.name.split('\n');

      node.innerHTML = `
        <div class="tree-node__frame" title="${nameParts.join(' ')}">
          <div class="tree-node__photo">
            <div class="tree-node__avatar">${personSVG}</div>
          </div>
        </div>
        <div class="tree-node__info">
          <div class="tree-node__name">${nameParts[0]}<br/>${nameParts[1] || ''}</div>
          <div class="tree-node__years">${person.years}</div>
        </div>`;

      row.appendChild(node);
      nodeEls[person.id] = node;
    });

    rowWrap.appendChild(row);
    gensEl.appendChild(rowWrap);
  });

  /* ── THREAD DRAWING ── */

  function getCenter(el) {
    const wRect = wrapper.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left - wRect.left + eRect.width  / 2,
      y: eRect.top  - wRect.top  + eRect.height / 2,
    };
  }

  function getFrameCenter(el) {
    const frame = el.querySelector('.tree-node__frame');
    const wRect = wrapper.getBoundingClientRect();
    const fRect = frame.getBoundingClientRect();
    return {
      x: fRect.left - wRect.left + fRect.width  / 2,
      y: fRect.top  - wRect.top  + fRect.height / 2,
      top:    fRect.top  - wRect.top,
      bottom: fRect.bottom - wRect.top,
      left:   fRect.left - wRect.left,
      right:  fRect.right - wRect.left,
    };
  }

  /* Braided path between two points */
  function braidedPath(x1, y1, x2, y2, strands = 3, amplitude = 6) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(16, Math.floor(len / 8));
    const paths = [];

    for (let s = 0; s < strands; s++) {
      const phase = (s / strands) * Math.PI * 2;
      let d = `M ${x1} ${y1}`;

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;

        /* perpendicular offset */
        const nx = -dy / len;
        const ny =  dx / len;
        const wave = Math.sin(t * Math.PI * 3 + phase) * amplitude;

        d += ` L ${(px + nx * wave).toFixed(2)} ${(py + ny * wave).toFixed(2)}`;
      }
      paths.push(d);
    }
    return paths;
  }

  function createThread(d, color, width, delay, dashLen) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');

    const totalLen = 1000; /* approximate */
    if (dashLen) {
      path.setAttribute('stroke-dasharray', dashLen);
    }
    path.setAttribute('stroke-dasharray', totalLen);
    path.setAttribute('stroke-dashoffset', totalLen);
    path.style.transition = `stroke-dashoffset 1.8s ease ${delay}s`;
    path.classList.add('thread-path');
    return path;
  }

  /* Colors for braided threads */
  const THREAD_COLORS = ['#c8a84b', '#8a7035', '#e2c97e'];
  const SPOUSE_COLORS = ['#c8a84b', '#6a5020', '#e2c97e', '#a08030'];

  function drawThreads() {
    svgEl.innerHTML = '';

    /* Set SVG size to wrapper */
    const wh = wrapper.offsetHeight;
    const ww = wrapper.offsetWidth;
    svgEl.setAttribute('viewBox', `0 0 ${ww} ${wh}`);
    svgEl.setAttribute('width', ww);
    svgEl.setAttribute('height', wh);

    let delay = 0.1;

    GENERATIONS.forEach((gen, gi) => {
      /* 1. Spouse connection (horizontal braid) */
      gen.people.forEach(person => {
        if (person.spouseOf && person.id < person.spouseOf) {
          const a = nodeEls[person.id];
          const b = nodeEls[person.spouseOf];
          if (!a || !b) return;

          const ca = getFrameCenter(a);
          const cb = getFrameCenter(b);

          /* Connect right edge of A to left edge of B (or vice-versa) */
          const x1 = Math.min(ca.right, cb.right);
          const x2 = Math.max(ca.left,  cb.left);
          const y  = (ca.y + cb.y) / 2;

          const strands = braidedPath(x1, y, x2, y, 4, 5);
          strands.forEach((d, si) => {
            const path = createThread(d, SPOUSE_COLORS[si % SPOUSE_COLORS.length], 1.2, delay, null);
            svgEl.appendChild(path);
          });
          delay += 0.05;
        }
      });

      /* 2. Parent→Child vertical threads */
      const childGen = gi + 1;
      if (childGen >= GENERATIONS.length) return;

      Object.entries(gen.childrenMap || {}).forEach(([parentId, childIds]) => {
        const parentEl = nodeEls[parentId];
        if (!parentEl) return;
        const cp = getFrameCenter(parentEl);

        childIds.forEach(childId => {
          const childEl = nodeEls[childId];
          if (!childEl) return;
          const cc = getFrameCenter(childEl);

          /* top of parent (going up since DOM is reversed — actually bottom of frame in visual) */
          const x1 = cp.x;
          const y1 = cp.top; /* top edge of frame */
          const x2 = cc.x;
          const y2 = cc.bottom; /* bottom edge of child frame */

          const strands = braidedPath(x1, y1, x2, y2, 3, 4);
          strands.forEach((d, si) => {
            const path = createThread(d, THREAD_COLORS[si % THREAD_COLORS.length], 1.4, delay, null);
            svgEl.appendChild(path);
          });
          delay += 0.12;
        });
      });
    });

    /* Trigger animations */
    requestAnimationFrame(() => {
      svgEl.querySelectorAll('.thread-path').forEach(p => {
        const len = p.getTotalLength ? p.getTotalLength() : 1000;
        p.setAttribute('stroke-dasharray', len);
        p.setAttribute('stroke-dashoffset', len);
        requestAnimationFrame(() => {
          p.style.strokeDashoffset = '0';
        });
      });
    });
  }

  /* Draw after layout settles */
  window.addEventListener('load', () => {
    setTimeout(drawThreads, 300);
  });

  window.addEventListener('resize', () => {
    setTimeout(drawThreads, 200);
  });
})();
