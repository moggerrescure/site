/* ═══════════════════════════════════════════════════════
   TREE-EDIT.JS — Динамическое дерево семьи с localStorage
   Хранилище: all_trees, tree_nodes_{id}, tree_connections_{id}
   ═══════════════════════════════════════════════════════ */


(function () {

  /* ── КЛЮЧИ localStorage ── */
  const KEY_ALL_TREES   = 'all_trees';
  const KEY_ACTIVE_TREE = 'active_tree_id';
  function keyNodes(id)  { return 'tree_nodes_'       + id; }
  function keyConns(id)  { return 'tree_connections_' + id; }

  /* ── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ localStorage ── */
  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  /* ── ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ── ТЕСТОВЫЕ ДАННЫЕ ПО УМОЛЧАНИЮ ── */
  function createDefaultTree() {
    const treeId = 'default';
    const trees = [{ id: treeId, name: 'Основное дерево', color: '#c8a84b' }];
    lsSet(KEY_ALL_TREES, trees);
    lsSet(KEY_ACTIVE_TREE, treeId);

    const nodes = [
      { id: 'n1', name: 'Иванов Николай', years: '1880–1951', gender: 'male',
        clanId: 'ivanov', clanName: 'Род Ивановых', clanColor: '#c8a84b',
        personPageId: 'ivanov-nikolai', photo: null, x: 100, y: 50 },
      { id: 'n2', name: 'Иванова Мария', years: '1883–1960', gender: 'female',
        clanId: 'ivanov', clanName: 'Род Ивановых', clanColor: '#c8a84b',
        personPageId: 'ivanova-maria', photo: null, x: 280, y: 50 },
      { id: 'n3', name: 'Иванов Пётр', years: '1910–1978', gender: 'male',
        clanId: 'ivanov', clanName: 'Род Ивановых', clanColor: '#c8a84b',
        personPageId: 'ivanov-nikolai', photo: null, x: 190, y: 260 },
    ];
    lsSet(keyNodes(treeId), nodes);

    const conns = [
      { id: 'c1', fromId: 'n1', toId: 'n2', type: 'spouse', color: '#c8a84b' },
      { id: 'c2', fromId: 'n1', toId: 'n3', type: 'parent', color: '#c8a84b' },
    ];
    lsSet(keyConns(treeId), conns);
    return treeId;
  }

  /* ── ПОЛУЧИТЬ АКТИВНОЕ ДЕРЕВО ── */
  function getActiveTreeId() {
    let id = localStorage.getItem(KEY_ACTIVE_TREE);
    if (!id) id = createDefaultTree();
    const trees = lsGet(KEY_ALL_TREES) || [];
    if (!trees.find(t => t.id === id)) id = createDefaultTree();
    return id;
  }

  /* ── ПОЛУЧИТЬ ВСЕ ДЕРЕВЬЯ ── */
  function getAllTrees() {
    return lsGet(KEY_ALL_TREES) || [];
  }

  /* ── ПОЛУЧИТЬ УЗЛЫ ДЕРЕВА ── */
  function getNodes(treeId) {
    return lsGet(keyNodes(treeId)) || [];
  }

  /* ── ПОЛУЧИТЬ СВЯЗИ ДЕРЕВА ── */
  function getConns(treeId) {
    return lsGet(keyConns(treeId)) || [];
  }

  /* ── СОХРАНИТЬ УЗЛЫ ── */
  function saveNodes(treeId, nodes) {
    lsSet(keyNodes(treeId), nodes);
  }

  /* ── СОХРАНИТЬ СВЯЗИ ── */
  function saveConns(treeId, conns) {
    lsSet(keyConns(treeId), conns);
  }



  /* ══════════════════════════════════════════════
     РЕЖИМ РЕДАКТИРОВАНИЯ И СОСТОЯНИЕ
  ══════════════════════════════════════════════ */
  let editMode = false;
  let connectMode = false;
  let connectFirst = null; // первая выбранная карточка при соединении

  /* ── ПЕРЕКЛЮЧАТЕЛЬ ДЕРЕВЬЕВ (дропдаун) ── */
  function initSwitcher() {
    const sel = document.getElementById('tree-switcher-select');
    if (!sel) return;
    const trees  = getAllTrees();
    const active = getActiveTreeId();
    sel.innerHTML = trees.map(t =>
      `<option value="${t.id}" ${t.id === active ? 'selected' : ''}>${t.name}</option>`
    ).join('');
    sel.addEventListener('change', () => {
      lsSet(KEY_ACTIVE_TREE, sel.value);
      renderTree();
    });
  }

  /* ── ОБНОВИТЬ ДРОПДАУН БЕЗ ПОТЕРИ ВЫБОРА ── */
  function refreshSwitcher() {
    const sel = document.getElementById('tree-switcher-select');
    if (!sel) return;
    const trees  = getAllTrees();
    const active = getActiveTreeId();
    sel.innerHTML = trees.map(t =>
      `<option value="${t.id}" ${t.id === active ? 'selected' : ''}>${t.name}</option>`
    ).join('');
  }

  /* ── КНОПКА РЕЖИМА РЕДАКТИРОВАНИЯ ── */
  function initEditBtn() {
    const btn = document.getElementById('btn-edit-mode');
    if (!btn) return;
    btn.addEventListener('click', () => {
      editMode = !editMode;
      const wrapper = document.getElementById('tree-dynamic-wrapper');
      if (wrapper) wrapper.classList.toggle('tree-edit-mode', editMode);
      btn.textContent = editMode ? '✅ Готово' : '✏️ Редактировать';
      // Выходим из режима соединения при выходе из редактирования
      if (!editMode) {
        connectMode = false;
        connectFirst = null;
        const btnConn = document.getElementById('btn-connect-cards');
        if (btnConn) btnConn.textContent = '🔗 Соединить карточки';
      }
    });
  }

  /* ── КНОПКА ДОБАВЛЕНИЯ ВЕТВИ ── */
  function initAddBranchBtn() {
    const btn = document.getElementById('btn-add-branch');
    if (!btn) return;
    btn.addEventListener('click', () => openAddNodeModal());
  }

  /* ── КНОПКА НОВОГО ДЕРЕВА ── */
  function initNewTreeBtn() {
    const btn = document.getElementById('btn-new-tree');
    if (!btn) return;
    btn.addEventListener('click', () => openNewTreeModal());
  }

  /* ── КНОПКА СОЕДИНИТЬ КАРТОЧКИ ── */
  function initConnectBtn() {
    const btn = document.getElementById('btn-connect-cards');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!editMode) {
        // Включаем режим редактирования автоматически
        editMode = true;
        const wrapper = document.getElementById('tree-dynamic-wrapper');
        if (wrapper) wrapper.classList.add('tree-edit-mode');
        const editBtn = document.getElementById('btn-edit-mode');
        if (editBtn) editBtn.textContent = '✅ Готово';
      }
      connectMode = !connectMode;
      connectFirst = null;
      btn.textContent = connectMode ? '❌ Отмена соединения' : '🔗 Соединить карточки';
      // подсветка контейнера
      const wrapper = document.getElementById('tree-dynamic-wrapper');
      if (wrapper) wrapper.classList.toggle('tree-connect-mode', connectMode);
    });
  }



  /* ══════════════════════════════════════════════
     SVG ЛИНИИ СВЯЗЕЙ
  ══════════════════════════════════════════════ */

  /**
   * Рисует все связи между узлами в SVG.
   * parent-связь: S-кривая Безье от центра низа исходной до центра верха целевой.
   * spouse-связь: горизонтальная линия на уровне центров карточек.
   */
  function drawConnections(treeId) {
    const svg = document.getElementById('tree-dynamic-svg');
    const container = document.getElementById('tree-dynamic-container');
    if (!svg || !container) return;
    svg.innerHTML = '';

    const conns = getConns(treeId);
    if (!conns.length) return;

    conns.forEach(conn => {
      const fromEl = container.querySelector(`[data-node-id="${conn.fromId}"]`);
      const toEl   = container.querySelector(`[data-node-id="${conn.toId}"]`);
      if (!fromEl || !toEl) return;

      const cRect = container.getBoundingClientRect();

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // Центры относительно контейнера
      const fx = fRect.left - cRect.left + fRect.width  / 2;
      const fy = fRect.top  - cRect.top  + fRect.height / 2;
      const tx = tRect.left - cRect.left + tRect.width  / 2;
      const ty = tRect.top  - cRect.top  + tRect.height / 2;

      const fBottom = fRect.top  - cRect.top  + fRect.height;
      const tTop    = tRect.top  - cRect.top;

      const color = conn.color || '#c8a84b';
      const path  = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('opacity', '0.75');

      let d = '';
      if (conn.type === 'spouse') {
        // Горизонтальная линия на уровне центров
        const x1 = Math.min(fx, tx);
        const x2 = Math.max(fx, tx);
        d = `M ${x1} ${fy} L ${x2} ${ty}`;
        path.setAttribute('stroke-dasharray', '6 4');
      } else {
        // S-кривая Безье: центр низа from → центр верха to
        const cx1 = fx;
        const cy1 = fBottom;
        const cx2 = tx;
        const cy2 = tTop;
        const mid = (cy1 + cy2) / 2;
        d = `M ${cx1} ${cy1} C ${cx1} ${mid} ${cx2} ${mid} ${cx2} ${cy2}`;
      }

      path.setAttribute('d', d);
      svg.appendChild(path);
    });
  }



  /* ══════════════════════════════════════════════
     ЛЕГЕНДА РОДОВ (КЛАНОВ)
  ══════════════════════════════════════════════ */

  function renderLegend(treeId) {
    const legendEl = document.getElementById('tree-dynamic-legend');
    if (!legendEl) return;

    const nodes = getNodes(treeId);

    // Собираем уникальные кланы
    const clansMap = {};
    nodes.forEach(n => {
      if (n.clanName && !clansMap[n.clanName]) {
        clansMap[n.clanName] = n.clanColor || '#c8a84b';
      }
    });

    const entries = Object.entries(clansMap);
    if (!entries.length) {
      legendEl.innerHTML = '';
      return;
    }

    legendEl.innerHTML = entries.map(([name, color]) => `
      <div class="tree-legend__clan-item" data-clan-id="${name.replace(/\s+/g,'_')}">
        <div class="tree-legend__clan-label">${name}</div>
        <span class="tree-legend__line" style="background:${color};display:inline-block;width:48px;height:3px;border-radius:2px;"></span>
      </div>`).join('');
  }



  /* ══════════════════════════════════════════════
     РЕНДЕР УЗЛОВ ДЕРЕВА
  ══════════════════════════════════════════════ */

  // SVG-силуэт человека
  const AVATAR_SVG_MALE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="12" cy="7" r="4" fill="currentColor" opacity="0.7"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="currentColor" opacity="0.5"/>
  </svg>`;
  const AVATAR_SVG_FEMALE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="12" cy="7" r="4" fill="currentColor" opacity="0.7"/>
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="currentColor" opacity="0.5"/>
    <path d="M10 17 Q12 19 14 17" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
  </svg>`;

  /**
   * Раскладка узлов по сетке, если у узла нет координат x/y.
   * Простая сетка: 3 колонки.
   */
  function autoLayout(nodes) {
    const COLS      = 3;
    const CARD_W    = 160;
    const CARD_H    = 160;
    const GAP_X     = 40;
    const GAP_Y     = 60;
    const START_X   = 40;
    const START_Y   = 40;

    return nodes.map((n, i) => {
      if (typeof n.x === 'number' && typeof n.y === 'number') return n;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return { ...n, x: START_X + col * (CARD_W + GAP_X), y: START_Y + row * (CARD_H + GAP_Y) };
    });
  }

  /**
   * Строит HTML одной карточки узла.
   */
  function buildNodeCard(node) {
    const color  = node.clanColor || '#c8a84b';
    const avatar = node.photo
      ? `<img src="${node.photo}" alt="${node.name}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;"/>`
      : (node.gender === 'female' ? AVATAR_SVG_FEMALE : AVATAR_SVG_MALE);

    return `
      <div class="tree-node tree-node--dynamic"
           data-node-id="${node.id}"
           style="position:absolute;left:${node.x}px;top:${node.y}px;
                  --clan-color:${color};width:150px;cursor:pointer;">
        <div class="tree-node__edit-btns tree-node--edit-btns">
          <button class="tree-node__edit-btn tree-node__edit-btn--edit" data-action="edit" data-node-id="${node.id}" title="Редактировать">✏️</button>
          <button class="tree-node__edit-btn tree-node__edit-btn--del"  data-action="del"  data-node-id="${node.id}" title="Удалить">🗑</button>
        </div>
        <div class="tree-node__frame" style="--clan-color:${color};--clan-dim:${color}88;border-color:${color}66;text-align:center;padding:12px 8px 8px;">
          <div class="tree-node__photo" style="display:flex;justify-content:center;align-items:center;height:54px;color:${color};">
            ${avatar}
          </div>
        </div>
        <div class="tree-node__info" style="text-align:center;padding:6px 4px 4px;">
          <div class="tree-node__name" style="font-size:12px;line-height:1.3;">${node.name}</div>
          <div class="tree-node__years" style="font-size:11px;opacity:0.6;">${node.years || ''}</div>
          <div class="tree-node__clan-name" style="font-size:10px;color:${color};opacity:0.8;">${node.clanName || ''}</div>
        </div>
      </div>`;
  }

  /**
   * Главный рендер: очищает контейнер, рисует все узлы и связи, обновляет легенду.
   */
  function renderTree() {
    const container = document.getElementById('tree-dynamic-container');
    if (!container) return;

    const treeId = getActiveTreeId();
    let nodes    = getNodes(treeId);
    nodes        = autoLayout(nodes);

    container.innerHTML = nodes.map(buildNodeCard).join('');

    // Вешаем обработчики на кнопки edit/del
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const nodeId = btn.dataset.nodeId;
        if (action === 'del')  handleDeleteNode(nodeId, treeId);
        if (action === 'edit') handleEditNode(nodeId, treeId);
      });
    });

    // Обработчик клика по карточке (режим соединения)
    container.querySelectorAll('.tree-node--dynamic').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('[data-action]')) return; // клик по кнопке — не считаем
        if (!connectMode) return;
        const nodeId = card.dataset.nodeId;
        handleConnectClick(nodeId, treeId);
      });
    });

    // Рисуем SVG-линии после рендера (нужен layout)
    requestAnimationFrame(() => {
      drawConnections(treeId);
    });

    renderLegend(treeId);
    refreshSwitcher();
  }



  /* ══════════════════════════════════════════════
     УДАЛЕНИЕ УЗЛА
  ══════════════════════════════════════════════ */

  function handleDeleteNode(nodeId, treeId) {
    const nodes = getNodes(treeId);
    const node  = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const confirmed = window.confirm(`Удалить «${node.name}» из дерева?`);
    if (!confirmed) return;

    // Удаляем узел
    const newNodes = nodes.filter(n => n.id !== nodeId);
    saveNodes(treeId, newNodes);

    // Удаляем все связанные соединения
    const conns    = getConns(treeId);
    const newConns = conns.filter(c => c.fromId !== nodeId && c.toId !== nodeId);
    saveConns(treeId, newConns);

    // Перерисовываем
    renderTree();

    // Пытаемся удалить через API (игнорируем ошибки)
    const apiId = node.personPageId || node.id;
    fetch(`/api/family-nodes/${apiId}`, { method: 'DELETE' }).catch(() => {});
  }

  /* ══════════════════════════════════════════════
     РЕДАКТИРОВАНИЕ УЗЛА
  ══════════════════════════════════════════════ */

  function handleEditNode(nodeId, treeId) {
    const nodes = getNodes(treeId);
    const node  = nodes.find(n => n.id === nodeId);
    if (!node) return;
    openEditNodeModal(node, treeId);
  }

  /* ══════════════════════════════════════════════
     РЕЖИМ СОЕДИНЕНИЯ КАРТОЧЕК
  ══════════════════════════════════════════════ */

  function handleConnectClick(nodeId, treeId) {
    if (!connectFirst) {
      connectFirst = nodeId;
      // Подсвечиваем первую выбранную карточку
      const container = document.getElementById('tree-dynamic-container');
      if (container) {
        container.querySelectorAll('.tree-node--dynamic').forEach(c => {
          c.style.outline = c.dataset.nodeId === nodeId
            ? '2px solid #c8a84b'
            : '';
        });
      }
    } else {
      if (connectFirst === nodeId) {
        connectFirst = null;
        clearConnectHighlight();
        return;
      }
      // Открываем диалог выбора типа связи
      openConnectionModal(connectFirst, nodeId, treeId);
      connectFirst = null;
      clearConnectHighlight();
    }
  }

  function clearConnectHighlight() {
    const container = document.getElementById('tree-dynamic-container');
    if (!container) return;
    container.querySelectorAll('.tree-node--dynamic').forEach(c => {
      c.style.outline = '';
    });
  }



  /* ══════════════════════════════════════════════
     МОДАЛЬНЫЕ ОКНА (создаются динамически через JS)
  ══════════════════════════════════════════════ */

  /* ── Стили для модалок (инжектируем один раз) ── */
  function injectModalStyles() {
    if (document.getElementById('tree-edit-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'tree-edit-modal-styles';
    style.textContent = `
      .te-overlay {
        position: fixed; inset: 0; z-index: 9000;
        background: rgba(0,0,0,0.72);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .te-modal {
        background: #111; border: 1px solid rgba(200,168,75,0.35);
        border-radius: 12px; padding: 28px 32px 24px;
        min-width: 320px; max-width: 480px; width: 90vw;
        box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        position: relative;
      }
      .te-modal__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 20px; color: #e2c97e;
        margin: 0 0 18px; text-align: center;
      }
      .te-modal__close {
        position: absolute; top: 12px; right: 14px;
        background: none; border: none; color: #888;
        font-size: 20px; cursor: pointer; line-height: 1;
      }
      .te-modal__close:hover { color: #e2c97e; }
      .te-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
      .te-field label { font-size: 12px; color: #a89060; letter-spacing: 0.05em; }
      .te-field input, .te-field select, .te-field textarea {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(200,168,75,0.25);
        border-radius: 6px; color: #e2c97e;
        padding: 8px 12px; font-size: 14px;
        font-family: var(--font-ui, 'Inter', sans-serif);
        transition: border-color 0.2s;
      }
      .te-field input:focus, .te-field select:focus {
        outline: none; border-color: rgba(200,168,75,0.6);
      }
      .te-field input[type="color"] { height: 38px; padding: 2px 4px; cursor: pointer; }
      .te-modal__btns { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
      .te-btn {
        padding: 9px 20px; border-radius: 6px; cursor: pointer;
        font-size: 13px; font-family: var(--font-ui, 'Inter', sans-serif);
        transition: all 0.2s; border: 1px solid rgba(200,168,75,0.3);
      }
      .te-btn--primary {
        background: rgba(200,168,75,0.2); color: #e2c97e;
      }
      .te-btn--primary:hover { background: rgba(200,168,75,0.35); border-color: rgba(200,168,75,0.6); }
      .te-btn--cancel {
        background: transparent; color: #888;
      }
      .te-btn--cancel:hover { color: #e2c97e; }
    `;
    document.head.appendChild(style);
  }

  /* ── Создать overlay + modal, вернуть оба ── */
  function createModal(titleText) {
    injectModalStyles();
    const overlay = document.createElement('div');
    overlay.className = 'te-overlay';
    const modal = document.createElement('div');
    modal.className = 'te-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'te-modal__close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => overlay.remove());

    const title = document.createElement('h2');
    title.className = 'te-modal__title';
    title.textContent = titleText;

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return { overlay, modal };
  }

  /* ── Поле формы ── */
  function field(labelText, inputEl) {
    const wrap = document.createElement('div');
    wrap.className = 'te-field';
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    wrap.appendChild(lbl);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function input(type, placeholder, value) {
    const el = document.createElement('input');
    el.type  = type || 'text';
    if (placeholder) el.placeholder = placeholder;
    if (value !== undefined && value !== null) el.value = value;
    return el;
  }

  function select(optionsMap, selectedVal) {
    const el = document.createElement('select');
    Object.entries(optionsMap).forEach(([val, label]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      if (val === selectedVal) opt.selected = true;
      el.appendChild(opt);
    });
    return el;
  }



  /* ── МОДАЛЬНОЕ ОКНО: ДОБАВИТЬ УЗЕЛ ── */
  function openAddNodeModal() {
    const { overlay, modal } = createModal('Добавить участника дерева');

    const inpName     = input('text',  'Иванов Иван Иванович', '');
    const inpYears    = input('text',  '1900–1980', '');
    const selGender   = select({ male: 'Мужской', female: 'Женский' }, 'male');
    const inpClanName = input('text',  'Род Ивановых', '');
    const inpClanClr  = input('color', '', '#c8a84b');
    inpClanClr.value  = '#c8a84b';
    const inpPageId   = input('text',  'ivanov-ivan (необязательно)', '');

    modal.appendChild(field('Имя *', inpName));
    modal.appendChild(field('Годы жизни (например 1900–1980)', inpYears));
    modal.appendChild(field('Пол', selGender));
    modal.appendChild(field('Название рода', inpClanName));
    modal.appendChild(field('Цвет рода', inpClanClr));
    modal.appendChild(field('ID страницы памяти (опционально)', inpPageId));

    const btns = document.createElement('div');
    btns.className = 'te-modal__btns';

    const btnCancel = document.createElement('button');
    btnCancel.className  = 'te-btn te-btn--cancel';
    btnCancel.textContent = 'Отмена';
    btnCancel.addEventListener('click', () => overlay.remove());

    const btnOk = document.createElement('button');
    btnOk.className  = 'te-btn te-btn--primary';
    btnOk.textContent = 'Добавить';
    btnOk.addEventListener('click', () => {
      const name = inpName.value.trim();
      if (!name) { inpName.focus(); return; }

      const treeId = getActiveTreeId();
      const nodes  = getNodes(treeId);

      const newNode = {
        id:           uid(),
        name:         name,
        years:        inpYears.value.trim(),
        gender:       selGender.value,
        clanName:     inpClanName.value.trim(),
        clanColor:    inpClanClr.value,
        personPageId: inpPageId.value.trim() || null,
        photo:        null,
        // Координаты: ставим правее последней карточки или по умолчанию
        x: nodes.length ? Math.max(...nodes.map(n => (n.x || 0) + 170)) : 40,
        y: 40,
      };

      nodes.push(newNode);
      saveNodes(treeId, nodes);
      overlay.remove();
      renderTree();
    });

    btns.appendChild(btnCancel);
    btns.appendChild(btnOk);
    modal.appendChild(btns);
    inpName.focus();
  }

  /* ── МОДАЛЬНОЕ ОКНО: РЕДАКТИРОВАТЬ УЗЕЛ ── */
  function openEditNodeModal(node, treeId) {
    const { overlay, modal } = createModal('Редактировать участника');

    const inpName     = input('text',  'Имя',     node.name     || '');
    const inpYears    = input('text',  '1900–',   node.years    || '');
    const selGender   = select({ male: 'Мужской', female: 'Женский' }, node.gender || 'male');
    const inpClanName = input('text',  'Род',     node.clanName || '');
    const inpClanClr  = input('color', '',        node.clanColor || '#c8a84b');
    inpClanClr.value  = node.clanColor || '#c8a84b';
    const inpPageId   = input('text',  'id (опционально)', node.personPageId || '');

    modal.appendChild(field('Имя *', inpName));
    modal.appendChild(field('Годы жизни', inpYears));
    modal.appendChild(field('Пол', selGender));
    modal.appendChild(field('Название рода', inpClanName));
    modal.appendChild(field('Цвет рода', inpClanClr));
    modal.appendChild(field('ID страницы памяти', inpPageId));

    const btns = document.createElement('div');
    btns.className = 'te-modal__btns';

    const btnCancel = document.createElement('button');
    btnCancel.className  = 'te-btn te-btn--cancel';
    btnCancel.textContent = 'Отмена';
    btnCancel.addEventListener('click', () => overlay.remove());

    const btnOk = document.createElement('button');
    btnOk.className  = 'te-btn te-btn--primary';
    btnOk.textContent = 'Сохранить';
    btnOk.addEventListener('click', () => {
      const name = inpName.value.trim();
      if (!name) { inpName.focus(); return; }

      const nodes = getNodes(treeId);
      const idx   = nodes.findIndex(n => n.id === node.id);
      if (idx === -1) { overlay.remove(); return; }

      nodes[idx] = {
        ...nodes[idx],
        name:         name,
        years:        inpYears.value.trim(),
        gender:       selGender.value,
        clanName:     inpClanName.value.trim(),
        clanColor:    inpClanClr.value,
        personPageId: inpPageId.value.trim() || null,
      };

      saveNodes(treeId, nodes);
      overlay.remove();
      renderTree();
    });

    btns.appendChild(btnCancel);
    btns.appendChild(btnOk);
    modal.appendChild(btns);
    inpName.focus();
  }



  /* ── МОДАЛЬНОЕ ОКНО: СОЗДАТЬ НОВОЕ ДЕРЕВО ── */
  function openNewTreeModal() {
    const { overlay, modal } = createModal('Создать новое дерево');

    const inpName  = input('text',  'Название дерева / рода', '');
    const inpColor = input('color', '', '#c8a84b');
    inpColor.value = '#c8a84b';

    modal.appendChild(field('Название *', inpName));
    modal.appendChild(field('Цвет дерева', inpColor));

    const btns = document.createElement('div');
    btns.className = 'te-modal__btns';

    const btnCancel = document.createElement('button');
    btnCancel.className  = 'te-btn te-btn--cancel';
    btnCancel.textContent = 'Отмена';
    btnCancel.addEventListener('click', () => overlay.remove());

    const btnOk = document.createElement('button');
    btnOk.className  = 'te-btn te-btn--primary';
    btnOk.textContent = 'Создать';
    btnOk.addEventListener('click', () => {
      const name = inpName.value.trim();
      if (!name) { inpName.focus(); return; }

      const newId = uid();
      const trees = getAllTrees();
      trees.push({ id: newId, name, color: inpColor.value });
      lsSet(KEY_ALL_TREES, trees);
      lsSet(KEY_ACTIVE_TREE, newId);
      // Пустые узлы и связи для нового дерева
      saveNodes(newId, []);
      saveConns(newId, []);

      overlay.remove();
      renderTree();
    });

    btns.appendChild(btnCancel);
    btns.appendChild(btnOk);
    modal.appendChild(btns);
    inpName.focus();
  }

  /* ── МОДАЛЬНОЕ ОКНО: ТИП СВЯЗИ МЕЖДУ КАРТОЧКАМИ ── */
  function openConnectionModal(fromId, toId, treeId) {
    const nodes   = getNodes(treeId);
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode   = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    const { overlay, modal } = createModal('Создать связь');

    const desc = document.createElement('p');
    desc.style.cssText = 'color:#a89060;font-size:13px;text-align:center;margin-bottom:16px;';
    desc.textContent   = `${fromNode.name} → ${toNode.name}`;
    modal.appendChild(desc);

    const selType   = select({ parent: 'Родитель → Ребёнок', spouse: 'Супруги' }, 'parent');
    const inpColor  = input('color', '', fromNode.clanColor || '#c8a84b');
    inpColor.value  = fromNode.clanColor || '#c8a84b';

    modal.appendChild(field('Тип связи', selType));
    modal.appendChild(field('Цвет линии', inpColor));

    const btns = document.createElement('div');
    btns.className = 'te-modal__btns';

    const btnCancel = document.createElement('button');
    btnCancel.className  = 'te-btn te-btn--cancel';
    btnCancel.textContent = 'Отмена';
    btnCancel.addEventListener('click', () => overlay.remove());

    const btnOk = document.createElement('button');
    btnOk.className  = 'te-btn te-btn--primary';
    btnOk.textContent = 'Соединить';
    btnOk.addEventListener('click', () => {
      const conns = getConns(treeId);
      // Проверяем дубликат
      const dup = conns.find(c =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId   && c.toId === fromId)
      );
      if (dup) {
        overlay.remove();
        return;
      }
      conns.push({
        id:     uid(),
        fromId: fromId,
        toId:   toId,
        type:   selType.value,
        color:  inpColor.value,
      });
      saveConns(treeId, conns);
      overlay.remove();
      renderTree();
    });

    btns.appendChild(btnCancel);
    btns.appendChild(btnOk);
    modal.appendChild(btns);
  }



  /* ══════════════════════════════════════════════
     ПЕРЕТАСКИВАНИЕ КАРТОЧЕК (drag-and-drop)
     Позволяет свободно двигать карточки мышью.
  ══════════════════════════════════════════════ */

  /**
   * Навешивает drag на контейнер через делегирование.
   * Карточку можно перетаскивать только вне кнопок.
   */
  function initDrag() {
    const container = document.getElementById('tree-dynamic-container');
    if (!container) return;

    let dragging  = null;
    let startX    = 0;
    let startY    = 0;
    let origLeft  = 0;
    let origTop   = 0;

    container.addEventListener('mousedown', e => {
      const card = e.target.closest('.tree-node--dynamic');
      if (!card) return;
      if (e.target.closest('[data-action]')) return; // не перетаскиваем за кнопки
      e.preventDefault();

      dragging = card;
      startX   = e.clientX;
      startY   = e.clientY;
      origLeft = parseInt(card.style.left, 10) || 0;
      origTop  = parseInt(card.style.top,  10) || 0;
      card.style.zIndex = '100';
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, origLeft + dx);
      const newTop  = Math.max(0, origTop  + dy);
      dragging.style.left = newLeft + 'px';
      dragging.style.top  = newTop  + 'px';
      // Перерисовываем линии в реальном времени
      drawConnections(getActiveTreeId());
    });

    window.addEventListener('mouseup', e => {
      if (!dragging) return;
      const nodeId = dragging.dataset.nodeId;
      const newLeft = parseInt(dragging.style.left, 10) || 0;
      const newTop  = parseInt(dragging.style.top,  10) || 0;
      dragging.style.zIndex = '';
      dragging = null;

      // Сохраняем новые координаты в localStorage
      const treeId = getActiveTreeId();
      const nodes  = getNodes(treeId);
      const idx    = nodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) {
        nodes[idx] = { ...nodes[idx], x: newLeft, y: newTop };
        saveNodes(treeId, nodes);
      }
    });
  }

  /* ══════════════════════════════════════════════
     ИНИЦИАЛИЗАЦИЯ
  ══════════════════════════════════════════════ */

  function init() {
    // Убеждаемся, что есть активное дерево (создаём дефолтное если нет)
    getActiveTreeId();

    initSwitcher();
    initEditBtn();
    initAddBranchBtn();
    initNewTreeBtn();
    initConnectBtn();
    initDrag();

    renderTree();

    // Перерисовываем линии при ресайзе окна
    window.addEventListener('resize', () => {
      drawConnections(getActiveTreeId());
    });
  }

  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
