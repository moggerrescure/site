/* ═══════════════════════════════════════════════
   FAMILY TREE — Braided SVG threads + clan colours
   Bottom = oldest, Top = youngest
   Click node → highlight lineage OR open person page
   ═══════════════════════════════════════════════ */

(function () {

  /* ═══════════ CLAN DEFINITIONS ═══════════
     Each clan gets a colour, icon and display name.
     Every person carries a clanId.
  */
  const CLANS = {
    ivanov:   { name: 'Род Ивановых',   color: '#c8a84b', colorDim: '#6b5a22', icon: '⚔', desc: 'Потомственные инженеры и военные' },
    smirnov:  { name: 'Род Смирновых',  color: '#7ec8b4', colorDim: '#2e6b5e', icon: '⚕', desc: 'Врачи и учёные' },
    kozlov:   { name: 'Род Козловых',   color: '#c87e7e', colorDim: '#6b2e2e', icon: '✦', desc: 'Архитекторы и строители' },
  };

  /* ═══════════ GENERATIONS ═══════════
     clanId → determines colour of the card border & thread
     personId → links to person page (matches data.js ids)
  */
  const GENERATIONS = [
    {
      label: 'Прапрародители',
      ageClass: 'old',
      people: [
        { id: 'g0p0', name: 'Иванов\nНиколай', years: '1880–1951', spouseOf: 'g0p1', clanId: 'ivanov',  personPageId: 'ivanov-nikolai' },
        { id: 'g0p1', name: 'Иванова\nМария',   years: '1883–1960', spouseOf: 'g0p0', clanId: 'ivanov',  personPageId: 'ivanova-maria' },
        { id: 'g0p2', name: 'Смирнов\nВасилий', years: '1878–1945', spouseOf: 'g0p3', clanId: 'smirnov', personPageId: 'smirnov-petr' },
        { id: 'g0p3', name: 'Смирнова\nАнна',   years: '1882–1950', spouseOf: 'g0p2', clanId: 'smirnov', personPageId: 'smirnova-anna' },
      ],
      childrenMap: { 'g0p0': ['g1p0'], 'g0p2': ['g1p2'] }
    },
    {
      label: 'Прародители',
      ageClass: 'old',
      people: [
        { id: 'g1p0', name: 'Иванов\nПётр',    years: '1910–1978', spouseOf: 'g1p1', clanId: 'ivanov',  personPageId: 'ivanov-nikolai' },
        { id: 'g1p1', name: 'Иванова\nНина',    years: '1914–1983', spouseOf: 'g1p0', clanId: 'ivanov',  personPageId: 'ivanova-maria' },
        { id: 'g1p2', name: 'Смирнов\nАлексей', years: '1908–1970', spouseOf: 'g1p3', clanId: 'smirnov', personPageId: 'smirnov-petr' },
        { id: 'g1p3', name: 'Смирнова\nТатьяна',years: '1912–1980', spouseOf: 'g1p2', clanId: 'smirnov', personPageId: 'smirnova-anna' },
      ],
      childrenMap: { 'g1p0': ['g2p0'], 'g1p2': ['g2p2'] }
    },
    {
      label: 'Родители',
      ageClass: 'young',
      people: [
        { id: 'g2p0', name: 'Иванов\nСергей',   years: '1945–2010', spouseOf: 'g2p1', clanId: 'ivanov',  personPageId: 'ivanov-nikolai' },
        { id: 'g2p1', name: 'Иванова\nОльга',    years: '1948–2015', spouseOf: 'g2p0', clanId: 'ivanov',  personPageId: 'ivanova-maria' },
        { id: 'g2p2', name: 'Смирнов\nДмитрий',  years: '1943–2005', spouseOf: 'g2p3', clanId: 'smirnov', personPageId: 'smirnov-petr' },
        { id: 'g2p3', name: 'Смирнова\nЕлена',   years: '1947–2018', spouseOf: 'g2p2', clanId: 'smirnov', personPageId: 'smirnova-anna' },
      ],
      childrenMap: { 'g2p0': ['g3p0', 'g3p1'], 'g2p2': ['g3p2'] }
    },
    {
      label: 'Наше поколение',
      ageClass: 'young',
      people: [
        { id: 'g3p0', name: 'Иванов\nМихаил',  years: '1972–',  spouseOf: 'g3p3', clanId: 'ivanov',  personPageId: 'ivanov-nikolai' },
        { id: 'g3p1', name: 'Иванова\nЮлия',   years: '1975–',  spouseOf: null,   clanId: 'ivanov',  personPageId: 'ivanova-maria' },
        { id: 'g3p2', name: 'Смирнова\nКсения', years: '1970–', spouseOf: null,   clanId: 'smirnov', personPageId: 'smirnova-anna' },
        { id: 'g3p3', name: 'Козлова\nАлина',   years: '1974–', spouseOf: 'g3p0', clanId: 'kozlov',  personPageId: 'kozlova-lyudmila' },
      ],
      childrenMap: {}
    },
  ];

  /* flat id→person map */
  const personById = {};
  GENERATIONS.forEach(g => g.people.forEach(p => { personById[p.id] = p; }));

  /* ── DOM SETUP ── */
  const wrapper = document.getElementById('tree-wrapper');
  const svgEl   = document.getElementById('tree-threads');
  const gensEl  = document.getElementById('tree-generations');
  if (!wrapper || !svgEl || !gensEl) return;

  const nodeEls   = {};
  const threadEls = {};

  const personSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
  </svg>`;

  /* ── BUILD CLAN LEGEND ── */
  const legendWrap = document.getElementById('tree-clan-legend');
  if (legendWrap) {
    legendWrap.innerHTML = Object.entries(CLANS).map(([id, c]) => `
      <div class="clan-legend__item" data-clan="${id}">
        <span class="clan-legend__badge" style="background:${c.color};box-shadow:0 0 10px ${c.color}44;">${c.icon}</span>
        <div class="clan-legend__text">
          <strong>${c.name}</strong>
          <span>${c.desc}</span>
        </div>
      </div>`).join('');

    legendWrap.querySelectorAll('[data-clan]').forEach(item => {
      item.addEventListener('click', () => {
        const cid = item.dataset.clan;
        filterByClan(cid === activeClan ? null : cid);
        legendWrap.querySelectorAll('[data-clan]').forEach(el =>
          el.classList.toggle('clan-legend__item--active', el.dataset.clan === cid && cid !== activeClan));
      });
    });
  }

  /* ── BUILD GENERATION ROWS ── */
  const reversed = [...GENERATIONS].reverse();

  reversed.forEach((gen, ri) => {
    const genIndex = GENERATIONS.length - 1 - ri;
    const rowWrap  = document.createElement('div');

    const lbl = document.createElement('div');
    lbl.className = 'gen-label';
    lbl.textContent = gen.label;
    rowWrap.appendChild(lbl);

    const row = document.createElement('div');
    row.className = 'gen-row';
    row.dataset.genIndex = genIndex;

    gen.people.forEach(person => {
      const clan = CLANS[person.clanId] || CLANS.ivanov;
      const node = document.createElement('div');
      node.className = `tree-node tree-node--${gen.ageClass} tree-node--clan-${person.clanId}`;
      node.dataset.id     = person.id;
      node.dataset.clan   = person.clanId;
      node.tabIndex       = 0;

      const nameParts = person.name.split('\n');
      const clanIcon  = clan.icon;

      node.innerHTML = `
        <div class="tree-node__frame" title="${nameParts.join(' ')}"
             style="--clan-color:${clan.color};--clan-dim:${clan.colorDim}">
          <span class="tree-node__clan-badge" title="${clan.name}">${clanIcon}</span>
          <div class="tree-node__photo">
            <div class="tree-node__avatar">${personSVG}</div>
          </div>
        </div>
        <div class="tree-node__info">
          <div class="tree-node__name">${nameParts[0]}<br/>${nameParts[1] || ''}</div>
          <div class="tree-node__years">${person.years}</div>
          <div class="tree-node__clan-name" style="color:${clan.color}">${clan.name}</div>
        </div>`;

      row.appendChild(node);
      nodeEls[person.id] = node;
    });

    rowWrap.appendChild(row);
    gensEl.appendChild(rowWrap);
  });

  /* ── RELATIONSHIP GRAPH ── */
  const parentsOf  = {};
  const childrenOf = {};
  const spouseOf   = {};

  GENERATIONS.forEach(gen => {
    gen.people.forEach(p => { if (p.spouseOf) spouseOf[p.id] = p.spouseOf; });
    Object.entries(gen.childrenMap || {}).forEach(([parentId, kids]) => {
      childrenOf[parentId] = (childrenOf[parentId] || []).concat(kids);
      const sp = spouseOf[parentId];
      if (sp) childrenOf[sp] = (childrenOf[sp] || []).concat(kids);
      kids.forEach(k => {
        parentsOf[k] = parentsOf[k] || [];
        if (!parentsOf[k].includes(parentId)) parentsOf[k].push(parentId);
        if (sp && !parentsOf[k].includes(sp)) parentsOf[k].push(sp);
      });
    });
  });

  function getAncestors(id, acc = new Set()) {
    (parentsOf[id] || []).forEach(p => { if (!acc.has(p)) { acc.add(p); getAncestors(p, acc); } });
    return acc;
  }
  function getDescendants(id, acc = new Set()) {
    (childrenOf[id] || []).forEach(c => { if (!acc.has(c)) { acc.add(c); getDescendants(c, acc); } });
    return acc;
  }

  /* ── THREAD DRAWING ── */
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

  function braidedPath(x1, y1, x2, y2, strands = 3, amplitude = 6) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(16, Math.floor(len / 8));
    const paths = [];
    for (let s = 0; s < strands; s++) {
      const phase = (s / strands) * Math.PI * 2;
      let d = `M ${x1} ${y1}`;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t, py = y1 + dy * t;
        const nx = -dy / len, ny = dx / len;
        const wave = Math.sin(t * Math.PI * 3 + phase) * amplitude;
        d += ` L ${(px + nx * wave).toFixed(2)} ${(py + ny * wave).toFixed(2)}`;
      }
      paths.push(d);
    }
    return paths;
  }

  function createThread(d, color, width, delay) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.classList.add('thread-path');
    path.dataset.delay = delay;
    return path;
  }

  /* derive clan thread colours */
  function clanColors(clanId) {
    const c = CLANS[clanId] || CLANS.ivanov;
    return [c.color, c.colorDim, c.color + 'bb'];
  }

  function drawThreads() {
    svgEl.innerHTML = '';
    for (const k in threadEls) delete threadEls[k];

    const wh = wrapper.offsetHeight, ww = wrapper.offsetWidth;
    svgEl.setAttribute('viewBox', `0 0 ${ww} ${wh}`);
    svgEl.setAttribute('width', ww);
    svgEl.setAttribute('height', wh);

    let delay = 0.1;

    GENERATIONS.forEach((gen, gi) => {
      /* Spouse connections */
      gen.people.forEach(person => {
        if (person.spouseOf && person.id < person.spouseOf) {
          const a = nodeEls[person.id], b = nodeEls[person.spouseOf];
          if (!a || !b) return;

          const ca = getFrameCenter(a), cb = getFrameCenter(b);
          const x1 = Math.min(ca.right, cb.right);
          const x2 = Math.max(ca.left,  cb.left);
          const y  = (ca.y + cb.y) / 2;

          const colors = clanColors(person.clanId);
          const strands = braidedPath(x1, y, x2, y, 4, 5);
          const key = `spouse:${person.id}::${person.spouseOf}`;
          threadEls[key] = [];
          strands.forEach((d, si) => {
            const path = createThread(d, colors[si % colors.length], 1.2, delay);
            path.dataset.kind = 'spouse';
            path.dataset.a    = person.id;
            path.dataset.b    = person.spouseOf;
            path.dataset.clan = person.clanId;
            svgEl.appendChild(path);
            threadEls[key].push(path);
          });
          delay += 0.05;
        }
      });

      if (gi + 1 >= GENERATIONS.length) return;

      /* Parent → child */
      Object.entries(gen.childrenMap || {}).forEach(([parentId, childIds]) => {
        const parentEl = nodeEls[parentId];
        if (!parentEl) return;
        const cp = getFrameCenter(parentEl);
        const parentClan = personById[parentId]?.clanId || 'ivanov';

        childIds.forEach(childId => {
          const childEl = nodeEls[childId];
          if (!childEl) return;
          const cc = getFrameCenter(childEl);

          const colors = clanColors(parentClan);
          const strands = braidedPath(cp.x, cp.top, cc.x, cc.bottom, 3, 4);
          const key = `parent:${parentId}->${childId}`;
          threadEls[key] = [];
          strands.forEach((d, si) => {
            const path = createThread(d, colors[si % colors.length], 1.4, delay);
            path.dataset.kind = 'parent';
            path.dataset.a    = parentId;
            path.dataset.b    = childId;
            path.dataset.clan = parentClan;
            svgEl.appendChild(path);
            threadEls[key].push(path);
          });
          delay += 0.12;
        });
      });
    });

    /* Animate draw */
    requestAnimationFrame(() => {
      svgEl.querySelectorAll('.thread-path').forEach(p => {
        const len = p.getTotalLength ? p.getTotalLength() : 1000;
        p.setAttribute('stroke-dasharray', len);
        p.setAttribute('stroke-dashoffset', len);
        const del = parseFloat(p.dataset.delay || 0);
        p.style.transition = `stroke-dashoffset 1.8s ease ${del}s, stroke 0.5s, stroke-width 0.5s, opacity 0.4s`;
        requestAnimationFrame(() => { p.style.strokeDashoffset = '0'; });
      });
    });

    if (activeClan) applyFilter(activeClan);
  }

  /* ── CLAN FILTER ── */
  let activeClan = null;

  function filterByClan(clanId) {
    activeClan = clanId;
    clearHighlight();
    applyFilter(clanId);
  }

  function applyFilter(clanId) {
    Object.values(nodeEls).forEach(el => {
      if (!clanId || el.dataset.clan === clanId)
        el.classList.remove('tree-node--clan-dim');
      else
        el.classList.add('tree-node--clan-dim');
    });
    svgEl.querySelectorAll('.thread-path').forEach(p => {
      if (!clanId || p.dataset.clan === clanId)
        p.classList.remove('thread-path--clan-dim');
      else
        p.classList.add('thread-path--clan-dim');
    });
  }

  /* ── LINEAGE HIGHLIGHT ── */
  let highlightedId = null;

  function clearHighlight() {
    highlightedId = null;
    wrapper.classList.remove('has-highlight');
    Object.values(nodeEls).forEach(el =>
      el.classList.remove('tree-node--active','tree-node--ancestor','tree-node--descendant','tree-node--dim'));
    svgEl.querySelectorAll('.thread-path').forEach(p =>
      p.classList.remove('thread-path--active','thread-path--dim'));
    if (activeClan) applyFilter(activeClan);
  }

  function highlight(id) {
    if (highlightedId === id) { clearHighlight(); return; }
    clearHighlight();
    highlightedId = id;
    wrapper.classList.add('has-highlight');

    const ancestors   = getAncestors(id);
    const descendants = getDescendants(id);
    const spouse      = spouseOf[id];
    const lineageSet  = new Set([id, ...ancestors, ...descendants]);
    if (spouse) lineageSet.add(spouse);

    Object.entries(nodeEls).forEach(([nid, el]) => {
      if (nid === id || nid === spouse)  el.classList.add('tree-node--active');
      else if (ancestors.has(nid))       el.classList.add('tree-node--ancestor');
      else if (descendants.has(nid))     el.classList.add('tree-node--descendant');
      else                               el.classList.add('tree-node--dim');
    });

    svgEl.querySelectorAll('.thread-path').forEach(p => {
      const isActive = lineageSet.has(p.dataset.a) && lineageSet.has(p.dataset.b);
      p.classList.add(isActive ? 'thread-path--active' : 'thread-path--dim');
    });
  }

  /* ── CLICK: single tap = highlight, double tap = open page ── */
  const clickTimers = {};
  Object.entries(nodeEls).forEach(([id, el]) => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (clickTimers[id]) {
        // double click → navigate
        clearTimeout(clickTimers[id]);
        delete clickTimers[id];
        const person = personById[id];
        if (person?.personPageId) {
          window.location.href = `person.html?id=${person.personPageId}`;
        }
      } else {
        clickTimers[id] = setTimeout(() => {
          delete clickTimers[id];
          highlight(id);
        }, 260);
      }
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const person = personById[id];
        if (person?.personPageId) window.location.href = `person.html?id=${person.personPageId}`;
      }
      if (e.key === ' ')      { e.preventDefault(); highlight(id); }
      if (e.key === 'Escape') clearHighlight();
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.tree-node') && !e.target.closest('.clan-legend__item')) clearHighlight();
  });

  /* ── TOOLTIP on hover ── */
  const tooltip = document.createElement('div');
  tooltip.className = 'tree-tooltip';
  tooltip.style.cssText = 'position:fixed;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:200';
  document.body.appendChild(tooltip);

  Object.entries(nodeEls).forEach(([id, el]) => {
    const person = personById[id];
    const clan   = person ? CLANS[person.clanId] : null;
    el.addEventListener('mouseenter', ev => {
      if (!clan) return;
      tooltip.innerHTML = `
        <div class="tree-tooltip__inner">
          <span class="tree-tooltip__icon">${clan.icon}</span>
          <strong>${clan.name}</strong>
          <span>${person.name.replace('\n',' ')}</span>
          <span class="tree-tooltip__hint">Двойной клик → страница памяти</span>
        </div>`;
      tooltip.style.opacity = '1';
      tooltip.style.left    = ev.clientX + 14 + 'px';
      tooltip.style.top     = ev.clientY - 10 + 'px';
    });
    el.addEventListener('mousemove', ev => {
      tooltip.style.left = ev.clientX + 14 + 'px';
      tooltip.style.top  = ev.clientY - 10 + 'px';
    });
    el.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
  });

  window.addEventListener('load',   () => setTimeout(drawThreads, 300));
  window.addEventListener('resize', () => setTimeout(drawThreads, 200));
})();
