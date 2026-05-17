/* ═══════════════════════════════════════════════
   TREE-EDIT.JS — полное редактирование древа семьи
   Два типа карточек: stub (родственник) и linked (страница памяти)
   Настройка связей: супруг, родители, дети
   ═══════════════════════════════════════════════ */

(function () {
  const editBtn = document.getElementById('tree-edit-btn');
  if (!editBtn) return;

  const BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';
  let isEditMode = false;
  let allNodes = []; // загруженные узлы из API

  // Текущий treeId из URL или default
  const urlParams = new URLSearchParams(window.location.search);
  let currentTreeId = urlParams.get('tree') || 'default';

  editBtn.addEventListener('click', () => {
    if (!isEditMode) enterEditMode();
    else exitEditMode();
  });

  // Кнопка "Новое древо"
  const newTreeBtn = document.getElementById('tree-new-btn');
  if (newTreeBtn) {
    newTreeBtn.addEventListener('click', () => openNewTreeModal());
  }

  function openNewTreeModal() {
    document.getElementById('tree-new-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tree-modal-overlay';
    overlay.id = 'tree-new-modal';
    overlay.innerHTML = `
      <div class="tree-modal">
        <button class="tree-modal__close" id="tnt-close">×</button>
        <h2 class="tree-modal__title">Создать новое древо</h2>
        <p style="font-family:var(--font-body);font-size:14px;color:var(--cream-dim);margin-bottom:20px;">Каждое древо — отдельная семья. Вы сможете добавлять людей и связи.</p>
        <form id="tnt-form">
          <div class="tree-modal__field">
            <label>Название древа</label>
            <input type="text" id="tnt-name" placeholder="Например: Петровы" maxlength="50" autofocus/>
          </div>
          <div class="tree-modal__actions">
            <button type="button" class="tree-modal__btn tree-modal__btn--cancel" id="tnt-cancel">Отмена</button>
            <button type="submit" class="tree-modal__btn tree-modal__btn--save">Создать</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('tnt-close').addEventListener('click', close);
    document.getElementById('tnt-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('tnt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('tnt-name').value.trim();
      if (!name) return;
      const treeId = name.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '-').replace(/-+/g, '-').slice(0, 30) || 'tree-' + Date.now();
      window.location.href = `family-tree.html?tree=${encodeURIComponent(treeId)}`;
    });

    setTimeout(() => document.getElementById('tnt-name')?.focus(), 100);
  }

  // Переключатель деревьев — загружаем список
  (async function initTreeSwitcher() {
    try {
      const res = await fetch(`${BASE}/api/family-trees`);
      const json = await res.json();
      if (!json.ok || json.data.length <= 1) return;

      const switcher = document.createElement('div');
      switcher.className = 'tree-switcher';
      switcher.innerHTML = `<label class="tree-switcher__label">Древо:</label>
        <select class="tree-switcher__select" id="tree-switcher-select">
          ${json.data.map(t => `<option value="${t}" ${t === currentTreeId ? 'selected' : ''}>${t === 'default' ? 'Основное' : t}</option>`).join('')}
        </select>`;
      const legendWrap = document.querySelector('.clan-legend-wrap');
      if (legendWrap) legendWrap.insertBefore(switcher, legendWrap.firstChild);

      document.getElementById('tree-switcher-select')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'default') window.location.href = 'family-tree.html';
        else window.location.href = `family-tree.html?tree=${encodeURIComponent(val)}`;
      });
    } catch (_) {}
  })();

  // Если кастомное дерево (не default) — скрываем статичное и показываем динамическое
  if (currentTreeId !== 'default') {
    // Скрываем статичный рендер
    const staticWrapper = document.getElementById('tree-wrapper');
    if (staticWrapper) staticWrapper.style.display = 'none';

    // Скрываем статичную легенду кланов и рендерим динамическую
    const staticLegend = document.getElementById('tree-clan-legend');
    if (staticLegend) staticLegend.innerHTML = '';
    loadAndRenderClans();

    // Создаём контейнер для динамического дерева
    const dynContainer = document.createElement('div');
    dynContainer.className = 'tree-dynamic';
    dynContainer.id = 'tree-dynamic';
    document.querySelector('.tree-section')?.appendChild(dynContainer);

    // Загружаем и рендерим узлы
    loadNodes().then(() => renderDynamicTree(dynContainer));
  } else {
    // Для default дерева тоже добавляем кнопку "+ Добавить род" в легенду
    addClanButton();
  }

  function addClanButton() {
    const legend = document.getElementById('tree-clan-legend');
    if (!legend) return;
    const btn = document.createElement('div');
    btn.className = 'clan-legend__item clan-legend__item--add';
    btn.innerHTML = `<span class="clan-legend__add-icon">+</span><div class="clan-legend__text"><strong>Добавить род</strong><span>Создать новую линию</span></div>`;
    btn.addEventListener('click', openAddClanModal);
    legend.appendChild(btn);
  }

  async function loadAndRenderClans() {
    const legend = document.getElementById('tree-clan-legend');
    if (!legend) return;

    try {
      const r = await fetch(`${BASE}/api/family-clans?treeId=${encodeURIComponent(currentTreeId)}`);
      const j = await r.json();
      if (!j.ok) return;

      legend.innerHTML = j.data.map(c => `
        <div class="clan-legend__item" data-clan="${c.id}" style="--clan-color:${c.color}">
          <span class="clan-legend__badge" style="background:${c.color};box-shadow:0 0 10px ${c.color}44;">${c.icon}</span>
          <div class="clan-legend__text">
            <strong>${c.name}</strong>
            <span>${c.description || ''}</span>
          </div>
        </div>`).join('');

      // Кнопка добавления
      addClanButton();
    } catch (_) {
      addClanButton();
    }
  }

  function openAddClanModal() {
    document.getElementById('tree-clan-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tree-modal-overlay';
    overlay.id = 'tree-clan-modal';
    overlay.innerHTML = `
      <div class="tree-modal">
        <button class="tree-modal__close" id="tcm-close">×</button>
        <h2 class="tree-modal__title">Добавить род</h2>
        <form id="tcm-form">
          <div class="tree-modal__field">
            <label>Название рода</label>
            <input type="text" id="tcm-name" placeholder="Например: Петровы" maxlength="100" required/>
          </div>
          <div class="tree-modal__field">
            <label>Описание</label>
            <input type="text" id="tcm-desc" placeholder="Врачи и учёные, военные..." maxlength="200"/>
          </div>
          <div class="tree-modal__row">
            <div class="tree-modal__field tree-modal__field--half">
              <label>Цвет</label>
              <input type="color" id="tcm-color" value="#c8a84b" style="width:100%;height:40px;border:none;border-radius:6px;cursor:pointer;"/>
            </div>
            <div class="tree-modal__field tree-modal__field--half">
              <label>Иконка</label>
              <div class="tcm-icon-picker" id="tcm-icon-picker">
                <input type="hidden" id="tcm-icon" value="✦"/>
                <div class="tcm-icon-grid">
                  <button type="button" class="tcm-icon-opt tcm-icon-opt--active" data-icon="✦">✦</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚔︎">⚔︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚕︎">⚕︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚒︎">⚒︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚓︎">⚓︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="✿">✿</button>
                  <button type="button" class="tcm-icon-opt" data-icon="♕">♕</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚖︎">⚖︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="✎">✎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="♫">♫</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⛭">⛭</button>
                  <button type="button" class="tcm-icon-opt" data-icon="☸">☸</button>
                  <button type="button" class="tcm-icon-opt" data-icon="✈︎">✈︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚡︎">⚡︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="☘︎">☘︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⛪︎">⛪︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="★">★</button>
                  <button type="button" class="tcm-icon-opt" data-icon="⚙︎">⚙︎</button>
                  <button type="button" class="tcm-icon-opt" data-icon="♥">♥</button>
                  <button type="button" class="tcm-icon-opt" data-icon="☀︎">☀︎</button>
                </div>
              </div>
            </div>
          </div>
          <div class="tree-modal__actions">
            <button type="button" class="tree-modal__btn tree-modal__btn--cancel" id="tcm-cancel">Отмена</button>
            <button type="submit" class="tree-modal__btn tree-modal__btn--save">Создать род</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('tcm-close').addEventListener('click', close);
    document.getElementById('tcm-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('tcm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('tcm-name').value.trim();
      if (!name) return;
      const color = document.getElementById('tcm-color').value;
      const icon = document.getElementById('tcm-icon').value.trim() || '✦';
      const desc = document.getElementById('tcm-desc').value.trim();

      try {
        const r = await fetch(`${BASE}/api/family-clans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color, icon, description: desc, treeId: currentTreeId }),
        });
        const j = await r.json();
        if (j.ok) window.location.reload();
        else alert(j.error || 'Ошибка');
      } catch (_) { alert('Сервер недоступен'); }
    });

    setTimeout(() => document.getElementById('tcm-name')?.focus(), 100);

    // Иконки — клик выбирает
    document.getElementById('tcm-icon-picker')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tcm-icon-opt');
      if (!btn) return;
      document.querySelectorAll('.tcm-icon-opt').forEach(b => b.classList.remove('tcm-icon-opt--active'));
      btn.classList.add('tcm-icon-opt--active');
      document.getElementById('tcm-icon').value = btn.dataset.icon;
    });
  }

  function renderDynamicTree(container) {
    if (!allNodes.length && !isEditMode) {
      container.innerHTML = `
        <div class="tree-empty">
          <p class="tree-empty__icon">🌳</p>
          <p class="tree-empty__text">Древо пока пустое</p>
          <p class="tree-empty__hint">Нажмите «Редактировать дерево» и добавьте первого человека</p>
        </div>`;
      return;
    }

    // Группируем по поколениям
    const gens = {};
    allNodes.forEach(n => {
      const g = n.generation || 0;
      if (!gens[g]) gens[g] = [];
      gens[g].push(n);
    });

    const GEN_LABELS = ['Прапрародители', 'Прародители', 'Родители', 'Наше поколение', 'Дети', 'Внуки'];
    const sorted = Object.keys(gens).map(Number).sort((a, b) => a - b);

    // Если пусто и edit mode — показываем хотя бы одно поколение
    if (!sorted.length && isEditMode) sorted.push(0);

    let html = '';

    // Кнопка "+ Поколение сверху" (младшее)
    if (isEditMode) {
      const topGen = sorted.length ? sorted[sorted.length - 1] + 1 : 4;
      html += `<button class="tree-gen-add-btn" data-gen="${topGen}" data-pos="top">+ Добавить младшее поколение</button>`;
    }

    // Рендерим от младших (сверху) к старшим (снизу)
    const reversedSorted = [...sorted].reverse();
    reversedSorted.forEach(g => {
      const label = GEN_LABELS[g] || `Поколение ${g}`;
      const people = gens[g] || [];

      html += `<div class="gen-label">${label}</div>`;
      html += `<div class="gen-row" data-gen="${g}">`;

      people.forEach(node => {
        const name = (node.full_name || node.fullName || '').replace(/\n/g, '<br/>');
        const years = node.years || '';
        const desc = node.description || '';
        const photo = node.photo_url || node.photoUrl || '';
        const linked = node.linked_profile_id || node.linkedProfileId || '';

        html += `
          <div class="tree-node tree-node--young" data-id="${node.id}">
            ${isEditMode ? `<div class="tree-node-controls"><button class="tree-node-ctrl" data-action="edit" data-id="${node.id}">✏️</button><button class="tree-node-ctrl tree-node-ctrl--del" data-action="delete" data-id="${node.id}">🗑</button></div>` : ''}
            <div class="tree-node__frame" style="--clan-color:#c8a84b">
              <div class="tree-node__photo">
                ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;"/>` : `<div class="tree-node__avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/></svg></div>`}
              </div>
            </div>
            <div class="tree-node__info">
              <div class="tree-node__name">${name || 'Без имени'}</div>
              <div class="tree-node__years">${years}</div>
              ${desc ? `<div class="tree-node__desc">${desc}</div>` : ''}
              ${linked ? `<a href="person.html?id=${linked}" class="tree-node__link">Страница памяти →</a>` : ''}
            </div>
          </div>`;
      });

      // Кнопка "+ Карточка" внутри поколения
      if (isEditMode) {
        html += `<button class="tree-gen-card-add" data-gen="${g}">+ Карточка</button>`;
      }

      html += `</div>`;
    });

    // Кнопка "+ Поколение снизу" (старшее)
    if (isEditMode) {
      const bottomGen = sorted.length ? sorted[0] - 1 : 0;
      html += `<button class="tree-gen-add-btn" data-gen="${bottomGen}" data-pos="bottom">+ Добавить старшее поколение</button>`;
    }

    container.innerHTML = html;

    // Обработчики
    if (isEditMode) {
      container.querySelectorAll('.tree-gen-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const gen = parseInt(btn.dataset.gen, 10);
          openNodeModal(null, 'stub', gen);
        });
      });
      container.querySelectorAll('.tree-gen-card-add').forEach(btn => {
        btn.addEventListener('click', () => {
          const gen = parseInt(btn.dataset.gen, 10);
          openNodeModal(null, 'stub', gen);
        });
      });
      container.querySelectorAll('.tree-node-ctrl').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          if (action === 'edit') openNodeModal(id, 'edit');
          if (action === 'delete') deleteNode(id);
        });
      });
    }
  }

  /* ══════════════════════════════════════
     EDIT MODE — вход/выход
     ══════════════════════════════════════ */
  function enterEditMode() {
    isEditMode = true;
    editBtn.textContent = '✕ Выйти из редактирования';
    editBtn.classList.add('tree-edit-btn--active');

    if (currentTreeId !== 'default') {
      // Для кастомных деревьев — перерендериваем с контролами
      const dynContainer = document.getElementById('tree-dynamic');
      if (dynContainer) renderDynamicTree(dynContainer);
      return;
    }

    // Для default дерева — кнопки на статичных узлах
    document.querySelectorAll('.tree-node').forEach(node => {
      const id = node.dataset.id;
      if (!id) return;
      const controls = document.createElement('div');
      controls.className = 'tree-node-controls';
      controls.innerHTML = `
        <button class="tree-node-ctrl" data-action="edit" data-id="${id}" title="Редактировать">✏️</button>
        <button class="tree-node-ctrl tree-node-ctrl--del" data-action="delete" data-id="${id}" title="Удалить">🗑</button>
      `;
      node.appendChild(controls);
    });

    // Плашки поколений сверху и снизу
    const treeSection = document.querySelector('.tree-section');
    if (treeSection) {
      const topBtn = document.createElement('button');
      topBtn.className = 'tree-gen-add-btn';
      topBtn.textContent = '+ Добавить младшее поколение';
      topBtn.id = 'tree-gen-top';
      topBtn.addEventListener('click', () => openNodeModal(null, 'stub', 4));
      treeSection.insertBefore(topBtn, treeSection.firstChild);

      const bottomBtn = document.createElement('button');
      bottomBtn.className = 'tree-gen-add-btn';
      bottomBtn.textContent = '+ Добавить старшее поколение';
      bottomBtn.id = 'tree-gen-bottom';
      bottomBtn.addEventListener('click', () => openNodeModal(null, 'stub', 0));
      treeSection.appendChild(bottomBtn);
    }

    const addPanel = document.createElement('div');
    addPanel.className = 'tree-add-panel';
    addPanel.id = 'tree-add-panel';
    addPanel.innerHTML = `
      <button class="tree-add-btn tree-add-btn--linked" id="tree-add-linked">+ Привязать страницу памяти</button>
      <button class="tree-add-btn" id="tree-add-stub">+ Карточка родственника</button>
    `;
    document.querySelector('.tree-section')?.appendChild(addPanel);

    document.getElementById('tree-add-stub')?.addEventListener('click', () => openNodeModal(null, 'stub'));
    document.getElementById('tree-add-linked')?.addEventListener('click', () => openNodeModal(null, 'linked'));

    document.addEventListener('click', handleEditClick);
  }

  function exitEditMode() {
    isEditMode = false;
    editBtn.textContent = '✏️ Редактировать дерево';
    editBtn.classList.remove('tree-edit-btn--active');
    document.querySelectorAll('.tree-node-controls').forEach(el => el.remove());
    document.getElementById('tree-add-panel')?.remove();
    document.getElementById('tree-gen-top')?.remove();
    document.getElementById('tree-gen-bottom')?.remove();
    document.removeEventListener('click', handleEditClick);

    if (currentTreeId !== 'default') {
      const dynContainer = document.getElementById('tree-dynamic');
      if (dynContainer) renderDynamicTree(dynContainer);
    }
  }

  function handleEditClick(e) {
    const btn = e.target.closest('.tree-node-ctrl');
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') openNodeModal(id, 'edit');
    if (action === 'delete') deleteNode(id);
  }

  async function deleteNode(id) {
    if (!confirm('Удалить этого человека из дерева?')) return;
    try {
      const res = await fetch(`${BASE}/api/family-nodes/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) window.location.reload();
      else alert(json.error || 'Ошибка удаления');
    } catch (_) { alert('Сервер недоступен'); }
  }

  /* ══════════════════════════════════════
     ЗАГРУЗКА УЗЛОВ
     ══════════════════════════════════════ */
  async function loadNodes() {
    try {
      const res = await fetch(`${BASE}/api/family-nodes?treeId=${encodeURIComponent(currentTreeId)}`);
      const json = await res.json();
      if (json.ok) allNodes = json.data;
    } catch (_) { allNodes = []; }
    return allNodes;
  }

  /* ══════════════════════════════════════
     МОДАЛКА — добавление/редактирование
     ══════════════════════════════════════ */
  async function openNodeModal(nodeId, mode, presetGen) {
    await loadNodes();
    document.getElementById('tree-node-modal')?.remove();

    // Если linked mode — показываем выбор из существующих профилей
    if (mode === 'linked') {
      openLinkedProfilePicker(presetGen);
      return;
    }

    const isNew = !nodeId || mode === 'stub';
    const isLinkedMode = false;
    const title = isNew ? (isLinkedMode ? 'Привязать страницу памяти' : 'Добавить родственника') : 'Редактировать';

    // Список узлов для выбора связей (исключаем текущий)
    const otherNodes = allNodes.filter(n => n.id !== nodeId);
    const nodeOptions = otherNodes.map(n => {
      const name = n.full_name || n.fullName || 'Без имени';
      return `<option value="${n.id}">${name}</option>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'tree-modal-overlay';
    overlay.id = 'tree-node-modal';
    document.body.appendChild(overlay);

    overlay.innerHTML = buildModalHTML(title, isLinkedMode, nodeOptions, isNew);
    setupModalEvents(overlay, nodeId, isNew, isLinkedMode);

    // Предустановка поколения
    if (presetGen !== undefined && presetGen !== null) {
      const genSel = document.getElementById('tm-gen');
      if (genSel) {
        // Если такого option нет — добавляем
        const exists = Array.from(genSel.options).some(o => o.value === String(presetGen));
        if (!exists) {
          const opt = document.createElement('option');
          opt.value = presetGen;
          opt.textContent = `Поколение ${presetGen}`;
          genSel.appendChild(opt);
        }
        genSel.value = String(presetGen);
      }
    }
  }

  function buildModalHTML(title, isLinkedMode, nodeOptions, isNew) {
    return `
      <div class="tree-modal">
        <button class="tree-modal__close" id="tm-close">×</button>
        <h2 class="tree-modal__title">${title}</h2>
        <form class="tree-modal__form" id="tm-form">

          ${isLinkedMode ? `
          <div class="tree-modal__field">
            <label>UUID страницы памяти</label>
            <input type="text" id="tm-linked" placeholder="Вставьте UUID профиля" maxlength="100"/>
            <small style="color:var(--cream-dim);font-size:11px;">Скопируйте из адресной строки: person.html?id=<b>этот-uuid</b></small>
          </div>` : ''}

          <div class="tree-modal__field">
            <label>ФИО</label>
            <input type="text" id="tm-name" placeholder="Фамилия Имя Отчество" maxlength="200"/>
          </div>
          <div class="tree-modal__field">
            <label>Годы жизни</label>
            <input type="text" id="tm-years" placeholder="1930–2000" maxlength="50"/>
          </div>
          <div class="tree-modal__field">
            <label>Кем приходится</label>
            <input type="text" id="tm-desc" placeholder="Дедушка, тётя, двоюродный брат..." maxlength="300"/>
          </div>
          <div class="tree-modal__row">
            <div class="tree-modal__field tree-modal__field--half">
              <label>Род <button type="button" class="tree-modal__inline-btn" id="tm-add-clan">+ новый</button></label>
              <select id="tm-clan"><option value="">— без рода —</option></select>
            </div>
            <div class="tree-modal__field tree-modal__field--half">
              <label>Поколение</label>
              <select id="tm-gen">
                <option value="0">Прапрародители</option>
                <option value="1">Прародители</option>
                <option value="2">Родители</option>
                <option value="3" selected>Наше поколение</option>
              </select>
            </div>
          </div>

          <div class="tree-modal__section-title">Связи</div>
          <div class="tree-modal__field">
            <label>Супруг/а</label>
            <select id="tm-spouse"><option value="">— нет —</option>${nodeOptions}</select>
          </div>
          <div class="tree-modal__field">
            <label>Родители (до 2)</label>
            <select id="tm-parents" multiple size="3"><option value="">— нет —</option>${nodeOptions}</select>
            <small style="color:var(--cream-dim);font-size:11px;">Ctrl+клик для выбора нескольких</small>
          </div>

          <div class="tree-modal__field">
            <label>Фото</label>
            <div class="tree-modal__photo-row">
              <label class="tree-modal__photo-btn"><input type="file" id="tm-photo-file" accept="image/*" hidden/><span>📷 Загрузить</span></label>
              <span id="tm-photo-status"></span>
            </div>
            <input type="hidden" id="tm-photo-url" value=""/>
          </div>

          <div class="tree-modal__actions">
            <button type="button" class="tree-modal__btn tree-modal__btn--cancel" id="tm-cancel">Отмена</button>
            <button type="submit" class="tree-modal__btn tree-modal__btn--save">${isNew ? 'Добавить' : 'Сохранить'}</button>
          </div>
          <p class="tree-modal__error" id="tm-error" style="display:none"></p>
        </form>
      </div>`;
  }

  function setupModalEvents(overlay, nodeId, isNew, isLinkedMode) {
    const close = () => overlay.remove();
    document.getElementById('tm-close').addEventListener('click', close);
    document.getElementById('tm-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Загружаем кланы в select
    loadClansIntoSelect();

    // Кнопка "Создать род"
    document.getElementById('tm-add-clan')?.addEventListener('click', () => {
      const name = window.prompt('Название рода (например: Петровы):');
      if (!name) return;
      const color = '#' + Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6, '0');
      fetch(`${BASE}/api/family-clans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, treeId: currentTreeId }),
      }).then(r => r.json()).then(j => {
        if (j.ok) loadClansIntoSelect(j.data.id);
      });
    });

    // Фото
    const photoInput = document.getElementById('tm-photo-file');
    const photoStatus = document.getElementById('tm-photo-status');
    const photoUrl = document.getElementById('tm-photo-url');
    photoInput?.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;
      photoStatus.textContent = '⏳';
      const fd = new FormData();
      fd.append('photo', file);
      try {
        const r = await fetch(`${BASE}/api/upload-photo`, { method: 'POST', body: fd });
        const j = await r.json();
        if (j.ok) { photoUrl.value = j.url; photoStatus.textContent = '✅'; }
        else photoStatus.textContent = '❌';
      } catch (_) { photoStatus.textContent = '❌'; }
    });

    // Если редактирование — заполняем поля
    if (!isNew && nodeId) fillFormFromNode(nodeId);

    // Сабмит
    document.getElementById('tm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('tm-error');
      err.style.display = 'none';

      const linkedId = document.getElementById('tm-linked')?.value?.trim() || null;
      const name = document.getElementById('tm-name').value.trim();
      const years = document.getElementById('tm-years').value.trim();
      const desc = document.getElementById('tm-desc').value.trim();
      const clan = document.getElementById('tm-clan').value;
      const gen = parseInt(document.getElementById('tm-gen').value, 10);
      const spouse = document.getElementById('tm-spouse').value || null;
      const parentsEl = document.getElementById('tm-parents');
      const parents = Array.from(parentsEl.selectedOptions).map(o => o.value).filter(Boolean).slice(0, 2);
      const photo = document.getElementById('tm-photo-url').value;

      if (!name && !linkedId) {
        err.textContent = 'Укажите ФИО или UUID страницы';
        err.style.display = 'block';
        return;
      }

      const data = {
        treeId: currentTreeId,
        fullName: name,
        years: years,
        description: desc,
        clanId: clan,
        generation: gen,
        genOrder: 0,
        ageClass: gen <= 1 ? 'old' : 'young',
        spouseId: spouse,
        parentIds: parents,
        linkedProfileId: linkedId,
        photoUrl: photo,
      };

      try {
        const url = isNew ? `${BASE}/api/family-nodes` : `${BASE}/api/family-nodes/${nodeId}`;
        const method = isNew ? 'POST' : 'PUT';
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        if (j.ok) window.location.reload();
        else { err.textContent = j.error || 'Ошибка'; err.style.display = 'block'; }
      } catch (_) { err.textContent = 'Сервер недоступен'; err.style.display = 'block'; }
    });
  }

  function fillFormFromNode(id) {
    const node = allNodes.find(n => n.id === id);
    if (!node) return;
    const name = node.full_name || node.fullName || '';
    document.getElementById('tm-name').value = name;
    document.getElementById('tm-years').value = node.years || '';
    document.getElementById('tm-desc').value = node.description || '';
    document.getElementById('tm-clan').value = node.clan_id || node.clanId || '';
    document.getElementById('tm-gen').value = (node.generation || 0).toString();
    document.getElementById('tm-photo-url').value = node.photo_url || node.photoUrl || '';
    const linked = document.getElementById('tm-linked');
    if (linked) linked.value = node.linked_profile_id || node.linkedProfileId || '';
    const spouseEl = document.getElementById('tm-spouse');
    if (spouseEl) spouseEl.value = node.spouse_id || node.spouseId || '';
    // Родители
    const parentIds = (() => { try { return JSON.parse(node.parent_ids || '[]'); } catch { return node.parentIds || []; } })();
    const parentsEl = document.getElementById('tm-parents');
    if (parentsEl && parentIds.length) {
      Array.from(parentsEl.options).forEach(o => { o.selected = parentIds.includes(o.value); });
    }
  }

  /* ══════════════════════════════════════
     ВЫБОР СУЩЕСТВУЮЩЕГО ПРОФИЛЯ
     ══════════════════════════════════════ */
  async function openLinkedProfilePicker(presetGen) {
    let profiles = [];
    try {
      const r = await fetch(`${BASE}/api/profiles`);
      const j = await r.json();
      if (j.ok && j.data) profiles = j.data.filter(p => p.name && p.name !== 'Новая страница');
    } catch (_) {}

    const overlay = document.createElement('div');
    overlay.className = 'tree-modal-overlay';
    overlay.id = 'tree-node-modal';

    let listHTML = '';
    if (profiles.length) {
      listHTML = profiles.map(p => `
        <button type="button" class="tree-profile-item" data-id="${p.id}">
          <div class="tree-profile-item__photo">${p.photo ? `<img src="${p.photo}"/>` : '<span>👤</span>'}</div>
          <div class="tree-profile-item__info">
            <div class="tree-profile-item__name">${p.name}</div>
            <div class="tree-profile-item__dates">${p.born || ''} ${p.died ? '— ' + p.died : ''}</div>
          </div>
        </button>`).join('');
    } else {
      listHTML = '<p style="color:var(--cream-dim);text-align:center;padding:20px;">Нет созданных страниц памяти</p>';
    }

    overlay.innerHTML = `
      <div class="tree-modal">
        <button class="tree-modal__close" id="tpl-close">×</button>
        <h2 class="tree-modal__title">Выберите страницу памяти</h2>
        <p style="font-family:var(--font-body);font-size:13px;color:var(--cream-dim);margin-bottom:16px;">Или создайте новую — она появится в дереве</p>
        <div class="tree-profile-list" id="tpl-list">${listHTML}</div>
        <button type="button" class="tree-add-btn tree-add-btn--linked" id="tpl-create" style="width:100%;margin-top:16px;">+ Создать новую страницу памяти</button>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('tpl-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelectorAll('.tree-profile-item').forEach(item => {
      item.addEventListener('click', async () => {
        const profileId = item.dataset.id;
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;
        const data = {
          treeId: currentTreeId,
          fullName: profile.name || '',
          years: (profile.born || '') + (profile.died ? ' — ' + profile.died : ''),
          linkedProfileId: profileId,
          generation: presetGen !== undefined ? presetGen : 3,
          ageClass: (presetGen !== undefined && presetGen <= 1) ? 'old' : 'young',
          photoUrl: profile.photo || '',
        };
        try {
          const r = await fetch(`${BASE}/api/family-nodes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          const j = await r.json();
          if (j.ok) window.location.reload();
          else alert(j.error || 'Ошибка');
        } catch (_) { alert('Сервер недоступен'); }
      });
    });

    document.getElementById('tpl-create').addEventListener('click', async () => {
      try {
        const r = await fetch(`${BASE}/api/profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: '', dates: '', main_text: '' }) });
        const j = await r.json();
        if (j.ok && j.data?.id) window.location.href = `person.html?id=${j.data.id}&edit=1`;
      } catch (_) { alert('Сервер недоступен'); }
    });
  }

  async function loadClansIntoSelect(selectValue) {
    const sel = document.getElementById('tm-clan');
    if (!sel) return;
    try {
      const r = await fetch(`${BASE}/api/family-clans?treeId=${encodeURIComponent(currentTreeId)}`);
      const j = await r.json();
      if (!j.ok) return;
      sel.innerHTML = '<option value="">— без рода —</option>' + j.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      if (selectValue) sel.value = selectValue;
    } catch (_) {}
  }

})();
