/* ═══════════════════════════════════════════════════════════
 *  ADMIN PANEL — Disputes / Merge / Legacy claims
 * ═══════════════════════════════════════════════════════════ */
'use strict';
(function () {

  if (!document.getElementById('admin-styles')) {
    const s = document.createElement('style');
    s.id = 'admin-styles';
    s.textContent = `
      .ad-tabs { display: flex; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.10); margin-bottom: 22px; flex-wrap: wrap; }
      .ad-tab {
        font-family: 'Inter',sans-serif; font-size: 0.9rem; padding: 11px 22px; cursor: pointer;
        background: transparent; border: none; border-bottom: 2px solid transparent;
        color: rgba(255,255,255,0.55); transition: all 0.2s;
      }
      .ad-tab:hover { color: rgba(255,255,255,0.85); }
      .ad-tab--active { color: #d8b96b; border-bottom-color: #d8b96b; }
      .ad-tab__count {
        display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px;
        background: rgba(216,185,107,0.15); color: #d8b96b; font-size: 0.72rem; vertical-align: 2px;
      }
      .ad-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
      .ad-filter-select {
        padding: 6px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
        border-radius: 5px; color: #eee; font-family: 'Inter',sans-serif; font-size: 0.85rem;
      }
      .ad-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px; padding: 16px 18px; margin-bottom: 12px; }
      .ad-card__head { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; margin-bottom: 8px; }
      .ad-card__id { font-family: 'Monaco',monospace; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
      .ad-card__date { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
      .ad-card__row { padding: 4px 0; font-size: 0.88rem; color: rgba(255,255,255,0.85); }
      .ad-card__label { color: rgba(255,255,255,0.5); margin-right: 8px; }
      .ad-card__quote { background: rgba(255,255,255,0.03); padding: 8px 12px; border-left: 2px solid rgba(216,185,107,0.3);
        margin: 8px 0; font-style: italic; color: rgba(255,255,255,0.8); font-size: 0.88rem; line-height: 1.45; white-space: pre-wrap; }
      .ad-card__actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
      .ad-btn {
        font-family: 'Inter',sans-serif; font-size: 0.82rem; padding: 7px 14px; border-radius: 5px;
        border: 1px solid; background: transparent; cursor: pointer; transition: all 0.2s;
      }
      .ad-btn--primary { border-color: rgba(216,185,107,0.5); color: #d8b96b; }
      .ad-btn--primary:hover { background: rgba(216,185,107,0.10); border-color: rgba(216,185,107,0.85); }
      .ad-btn--success { border-color: rgba(125,201,154,0.5); color: #7dc99a; }
      .ad-btn--success:hover { background: rgba(125,201,154,0.10); border-color: rgba(125,201,154,0.85); }
      .ad-btn--danger { border-color: rgba(214,128,128,0.5); color: #d68080; }
      .ad-btn--danger:hover { background: rgba(214,128,128,0.10); border-color: rgba(214,128,128,0.85); }
      .ad-btn--ghost { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.7); }
      .ad-btn--ghost:hover { background: rgba(255,255,255,0.05); }
      .ad-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .ad-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 0.72rem;
        border: 1px solid; letter-spacing: 0.04em; vertical-align: 1px; }
      .ad-badge--OPEN, .ad-badge--PENDING, .ad-badge--PENDING_OWNERS, .ad-badge--PENDING_ADMIN
        { color: #e0c060; border-color: rgba(224,192,96,0.4); }
      .ad-badge--UNDER_REVIEW { color: #80b0d8; border-color: rgba(128,176,216,0.4); }
      .ad-badge--RESOLVED_ACCEPTED, .ad-badge--APPROVED, .ad-badge--ACTIVE
        { color: #7dc99a; border-color: rgba(125,201,154,0.4); }
      .ad-badge--RESOLVED_REJECTED, .ad-badge--REJECTED, .ad-badge--TRIGGERED
        { color: #d68080; border-color: rgba(214,128,128,0.4); }
      .ad-badge--WITHDRAWN, .ad-badge--CANCELLED, .ad-badge--EXPIRED, .ad-badge--REVOKED
        { color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.2); }
      .ad-badge--EXECUTED, .ad-badge--TRANSFERRED { color: #9090e0; border-color: rgba(144,144,224,0.4); }
      .ad-empty { color: rgba(255,255,255,0.45); font-style: italic; padding: 26px; text-align: center; }
      .ad-error { color: #d68080; font-size: 0.85rem; margin: 8px 0; }
      .ad-ops { margin-top: 18px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 6px; }
      .ad-ops__title { font-size: 0.82rem; color: rgba(255,255,255,0.6); margin: 0 0 8px; }

      .ad-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display:flex; align-items:center; justify-content:center; z-index: 10000; padding:16px; }
      .ad-modal { background: #131313; border: 1px solid rgba(216,185,107,0.20); border-radius: 12px; max-width: 520px; width: 100%; padding: 26px; }
      .ad-modal__title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.4rem; color: #d8b96b; margin: 0 0 14px; }
      .ad-modal__textarea { width:100%; padding: 10px 12px; box-sizing:border-box; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius:6px; color:#eee; font-family:'Inter',sans-serif; font-size: 0.9rem; min-height: 110px; resize: vertical; }
      .ad-modal__actions { display:flex; gap:10px; justify-content:flex-end; margin-top: 16px; }
    `;
    document.head.appendChild(s);
  }

  const root = document.getElementById('admin-content');
  if (!root) return;

  /* ───── Admin gate ───── */
  function ensureAdmin() {
    if (typeof API === 'undefined' || !API.isLoggedIn || !API.isLoggedIn()) {
      root.innerHTML = `<div class="ad-empty">Войдите как администратор.</div>`;
      setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      return false;
    }
    const u = API.getUser ? API.getUser() : null;
    if (!u || u.role !== 'ADMIN') {
      root.innerHTML = `<div class="ad-empty">Доступ только для администраторов.</div>`;
      setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      return false;
    }
    return true;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('ru-RU', { dateStyle:'medium', timeStyle:'short' }); }
    catch (_) { return '—'; }
  }
  function badge(st) { return `<span class="ad-badge ad-badge--${escapeHtml(st)}">${escapeHtml(st)}</span>`; }

  /* ───── Modal helper ───── */
  function promptModal({ title, label, placeholder, btnLabel = 'Подтвердить', btnClass = 'ad-btn--primary', minLen = 0 }) {
    return new Promise((resolve) => {
      const o = document.createElement('div'); o.className = 'ad-modal-overlay';
      o.innerHTML = `
        <div class="ad-modal">
          <h2 class="ad-modal__title">${escapeHtml(title)}</h2>
          ${label ? `<p style="color:rgba(255,255,255,0.7);font-size:0.86rem;margin:0 0 8px;">${escapeHtml(label)}</p>` : ''}
          <textarea class="ad-modal__textarea" placeholder="${escapeHtml(placeholder || '')}"></textarea>
          <p class="ad-error" id="m-err"></p>
          <div class="ad-modal__actions">
            <button class="ad-btn ad-btn--ghost" id="m-cancel">Отмена</button>
            <button class="ad-btn ${btnClass}" id="m-ok">${escapeHtml(btnLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(o);
      const ta = o.querySelector('textarea');
      const err = o.querySelector('#m-err');
      function close(v) { o.remove(); resolve(v); }
      o.querySelector('#m-cancel').addEventListener('click', () => close(null));
      o.querySelector('#m-ok').addEventListener('click', () => {
        const v = ta.value.trim();
        if (minLen && v.length < minLen) { err.textContent = `Минимум ${minLen} символов`; return; }
        close(v);
      });
      o.addEventListener('click', e => { if (e.target === o) close(null); });
      setTimeout(() => ta.focus(), 50);
    });
  }

  /* ═════════ State ═════════ */
  const state = {
    activeTab: localStorage.getItem('admin_active_tab') || 'disputes',
    disputesFilter: 'OPEN',
    mergeFilter: 'PENDING_OWNERS',
  };

  /* ═════════ DISPUTES ═════════ */
  async function loadDisputes() {
    const qs = new URLSearchParams();
    if (state.disputesFilter && state.disputesFilter !== 'ALL') qs.set('status', state.disputesFilter);
    const r = await API.get(`/api/disputes?${qs.toString()}`);
    return (r && r.rows) || r?.disputes || r?.data || [];
  }

  function renderDispute(d) {
    const reasonLabels = {
      WRONG_INFO:'Неверная информация', INAPPROPRIATE:'Оскорбительный контент',
      OWNERSHIP_CLAIM:'Запрос на ownership', DUPLICATE:'Дубликат', OTHER:'Прочее',
    };
    const canStartReview = d.status === 'OPEN';
    const canResolve = d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
    return `
      <div class="ad-card" data-id="${escapeHtml(d.id)}">
        <div class="ad-card__head">
          ${badge(d.status)}
          <span style="color:#d8b96b;">${escapeHtml(reasonLabels[d.reason] || d.reason)}</span>
          <span class="ad-card__date">${fmtDate(d.createdAt)}</span>
          <span class="ad-card__id">${escapeHtml(d.id)}</span>
        </div>
        <div class="ad-card__row"><span class="ad-card__label">Профиль:</span>
          ${d.profile ? `<a href="person.html?id=${encodeURIComponent(d.profile.slug)}" target="_blank" style="color:#d8b96b;">${escapeHtml(d.profile.title || d.profile.slug)}</a>` : escapeHtml(d.profileId)}
        </div>
        <div class="ad-card__row"><span class="ad-card__label">От:</span>
          ${d.reporter ? escapeHtml(`${d.reporter.displayName || ''} <${d.reporter.email || ''}>`) : escapeHtml(d.reporterId)}
        </div>
        ${d.duplicateOfProfile ? `<div class="ad-card__row"><span class="ad-card__label">Оригинал:</span>
          <a href="person.html?id=${encodeURIComponent(d.duplicateOfProfile.slug)}" target="_blank" style="color:#d8b96b;">${escapeHtml(d.duplicateOfProfile.title || d.duplicateOfProfile.slug)}</a></div>` : ''}
        ${d.description ? `<div class="ad-card__quote">${escapeHtml(d.description)}</div>` : ''}
        ${d.resolution ? `<div class="ad-card__row"><span class="ad-card__label">Решение:</span>${escapeHtml(d.resolution)}</div>` : ''}
        ${d.mergeRequestId ? `<div class="ad-card__row"><span class="ad-card__label">Связанный merge:</span><code style="color:#9090e0;">${escapeHtml(d.mergeRequestId)}</code></div>` : ''}
        <div class="ad-card__actions">
          ${canStartReview ? `<button class="ad-btn ad-btn--ghost" data-act="review">В работу</button>` : ''}
          ${canResolve ? `
            <button class="ad-btn ad-btn--success" data-act="accept">Принять</button>
            <button class="ad-btn ad-btn--danger"  data-act="reject">Отклонить</button>
          ` : ''}
        </div>
      </div>`;
  }

  async function disputeAction(id, act) {
    if (act === 'review') {
      await API.patch(`/api/disputes/${id}/status`, { status: 'UNDER_REVIEW' });
    } else {
      const resolution = await promptModal({
        title: act === 'accept' ? 'Принять заявку' : 'Отклонить заявку',
        label: 'Опишите решение (фиксируется в аудите). Минимум 5 символов.',
        placeholder: act === 'accept' ? 'Удалил профиль / передал owner / создал merge' : 'Отклоняю как необоснованную: …',
        btnLabel: act === 'accept' ? 'Принять' : 'Отклонить',
        btnClass: act === 'accept' ? 'ad-btn--success' : 'ad-btn--danger',
        minLen: 5,
      });
      if (resolution == null) return;
      await API.post(`/api/disputes/${id}/resolve`, { status: act, resolution });
    }
    await render();
  }

  /* ═════════ MERGE REQUESTS ═════════ */
  async function loadMerges() {
    const qs = new URLSearchParams();
    if (state.mergeFilter && state.mergeFilter !== 'ALL') qs.set('status', state.mergeFilter);
    const r = await API.get(`/api/merge-requests?${qs.toString()}`);
    return (r && r.rows) || r?.requests || r?.data || [];
  }
  function renderMerge(m) {
    const canOwnerAppr = m.status === 'PENDING_OWNERS';
    const canAdminAppr = m.status === 'PENDING_ADMIN';
    const canExecute   = m.status === 'APPROVED';
    const canReject    = ['PENDING_OWNERS','PENDING_ADMIN','APPROVED'].includes(m.status);
    return `
      <div class="ad-card" data-id="${escapeHtml(m.id)}">
        <div class="ad-card__head">
          ${badge(m.status)}
          <span class="ad-card__date">${fmtDate(m.createdAt)}</span>
          <span class="ad-card__id">${escapeHtml(m.id)}</span>
        </div>
        <div class="ad-card__row"><span class="ad-card__label">Source (исчезнет):</span>
          ${m.sourceProfile ? `<a href="person.html?id=${encodeURIComponent(m.sourceProfile.slug)}" target="_blank" style="color:#d68080;">${escapeHtml(m.sourceProfile.fullName || m.sourceProfile.slug)}</a>` : escapeHtml(m.sourceProfileId)}
        </div>
        <div class="ad-card__row"><span class="ad-card__label">Target (примет всё):</span>
          ${m.targetProfile ? `<a href="person.html?id=${encodeURIComponent(m.targetProfile.slug)}" target="_blank" style="color:#7dc99a;">${escapeHtml(m.targetProfile.fullName || m.targetProfile.slug)}</a>` : escapeHtml(m.targetProfileId)}
        </div>
        <div class="ad-card__row"><span class="ad-card__label">Source owner:</span>
          ${m.sourceOwnerApprovedAt ? `✓ ${fmtDate(m.sourceOwnerApprovedAt)}` : '—'}
        </div>
        <div class="ad-card__row"><span class="ad-card__label">Target owner:</span>
          ${m.targetOwnerApprovedAt ? `✓ ${fmtDate(m.targetOwnerApprovedAt)}` : '—'}
        </div>
        ${m.reason ? `<div class="ad-card__quote">${escapeHtml(m.reason)}</div>` : ''}
        ${m.rejectionReason ? `<div class="ad-card__row"><span class="ad-card__label">Причина отклонения:</span>${escapeHtml(m.rejectionReason)}</div>` : ''}
        <div class="ad-card__actions">
          ${canOwnerAppr ? `<button class="ad-btn ad-btn--ghost" data-act="owner-approve">Approve as owner</button>` : ''}
          ${canAdminAppr ? `<button class="ad-btn ad-btn--success" data-act="admin-approve">Admin Approve</button>` : ''}
          ${canExecute   ? `<button class="ad-btn ad-btn--primary" data-act="execute">⚡ Execute merge</button>` : ''}
          ${canReject    ? `<button class="ad-btn ad-btn--danger"  data-act="reject">Отклонить</button>` : ''}
        </div>
      </div>`;
  }

  async function mergeAction(id, act) {
    if (act === 'owner-approve') await API.post(`/api/merge-requests/${id}/owner-approve`, {});
    else if (act === 'admin-approve') await API.post(`/api/merge-requests/${id}/admin-approve`, {});
    else if (act === 'execute') {
      if (!confirm('Выполнить merge сейчас? Source профиль будет soft-deleted, все связи перенесены. Действие необратимо без ручного rollback.')) return;
      await API.post(`/api/merge-requests/${id}/execute`, {});
    }
    else if (act === 'reject') {
      const reason = await promptModal({
        title: 'Отклонить запрос на объединение',
        label: 'Причина (опционально).',
        placeholder: 'Профили принадлежат разным людям…',
        btnLabel: 'Отклонить', btnClass: 'ad-btn--danger',
      });
      if (reason == null) return;
      await API.post(`/api/merge-requests/${id}/reject`, { reason });
    }
    await render();
  }

  /* ═════════ LEGACY CLAIMS ═════════ */
  async function loadClaims() {
    const r = await API.get('/api/admin/legacy-claims');
    return (r && r.rows) || [];
  }
  function renderClaim(c) {
    return `
      <div class="ad-card" data-id="${escapeHtml(c.id)}">
        <div class="ad-card__head">
          ${badge(c.status)}
          <span class="ad-card__date">${fmtDate(c.createdAt)}</span>
          <span class="ad-card__id">${escapeHtml(c.id)}</span>
        </div>
        ${c.legacyContact && c.legacyContact.owner ? `<div class="ad-card__row"><span class="ad-card__label">Владелец:</span>${escapeHtml((c.legacyContact.owner.displayName||'') + ' <' + (c.legacyContact.owner.email||'') + '>')}</div>` : ''}
        ${c.claimant ? `<div class="ad-card__row"><span class="ad-card__label">Наследник:</span>${escapeHtml((c.claimant.displayName||'') + ' <' + (c.claimant.email||'') + '>')}</div>` : ''}
        ${c.legacyContact && c.legacyContact.triggeredAt ? `<div class="ad-card__row"><span class="ad-card__label">Триггер:</span>${fmtDate(c.legacyContact.triggeredAt)}</div>` : ''}
        ${c.evidence ? `<div class="ad-card__quote">${escapeHtml(c.evidence)}</div>` : ''}
        ${c.reviewNotes ? `<div class="ad-card__row"><span class="ad-card__label">Заметки:</span>${escapeHtml(c.reviewNotes)}</div>` : ''}
        ${c.status === 'PENDING' ? `
          <div class="ad-card__actions">
            <button class="ad-btn ad-btn--success" data-act="approve">⚡ Approve (перенесёт профили)</button>
            <button class="ad-btn ad-btn--danger"  data-act="reject">Reject</button>
          </div>
        ` : ''}
      </div>`;
  }
  async function claimAction(id, act) {
    if (act === 'approve') {
      if (!confirm('Одобрить заявку? Все профили владельца перейдут наследнику. Действие необратимо.')) return;
      const notes = await promptModal({
        title: 'Одобрить заявку',
        label: 'Заметки (опционально, фиксируется в аудите).',
        placeholder: 'Свидетельство о смерти проверено по реестру.',
        btnLabel: 'Approve', btnClass: 'ad-btn--success',
      });
      if (notes == null) return;
      await API.post(`/api/admin/legacy-claims/${id}/approve`, { notes });
    } else {
      const notes = await promptModal({
        title: 'Отклонить заявку',
        label: 'Заметки (опционально).',
        placeholder: 'Документы не подтверждают родство.',
        btnLabel: 'Reject', btnClass: 'ad-btn--danger',
      });
      if (notes == null) return;
      await API.post(`/api/admin/legacy-claims/${id}/reject`, { notes });
    }
    await render();
  }

  /* ═════════ LEGACY OPS ═════════ */
  async function runTriggerCheck() {
    if (!confirm('Запустить cron вручную (проверить неактивных владельцев)?')) return;
    try { const r = await API.post('/api/admin/legacy/trigger-check', {});
      alert('Готово: ' + JSON.stringify(r.data || r, null, 2));
    } catch (e) { alert('Ошибка: ' + e.message); }
  }
  async function runExpire() {
    if (!confirm('Просрочить старые PENDING claims (>30 дней)?')) return;
    try { const r = await API.post('/api/admin/legacy/expire-claims', {});
      alert('Готово: ' + JSON.stringify(r.data || r, null, 2));
    } catch (e) { alert('Ошибка: ' + e.message); }
  }

  /* ═════════ Render orchestrator ═════════ */
  async function render() {
    if (!ensureAdmin()) return;
    root.innerHTML = `
      <div class="ad-tabs">
        <button class="ad-tab ${state.activeTab==='disputes'?'ad-tab--active':''}" data-tab="disputes">Споры</button>
        <button class="ad-tab ${state.activeTab==='merge'?'ad-tab--active':''}" data-tab="merge">Объединения</button>
        <button class="ad-tab ${state.activeTab==='legacy'?'ad-tab--active':''}" data-tab="legacy">Наследование</button>
      </div>
      <div id="ad-panel"><div class="audit-loader">Загрузка…</div></div>
    `;
    root.querySelectorAll('.ad-tab').forEach(t => t.addEventListener('click', () => {
      state.activeTab = t.dataset.tab;
      localStorage.setItem('admin_active_tab', state.activeTab);
      render();
    }));

    const panel = document.getElementById('ad-panel');
    try {
      if (state.activeTab === 'disputes') {
        const items = await loadDisputes();
        panel.innerHTML = `
          <div class="ad-filters">
            <span style="color:rgba(255,255,255,0.55);font-size:0.85rem;">Статус:</span>
            <select class="ad-filter-select" id="f-disp">
              ${['OPEN','UNDER_REVIEW','RESOLVED_ACCEPTED','RESOLVED_REJECTED','WITHDRAWN','ALL']
                .map(s => `<option value="${s}" ${state.disputesFilter===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          ${items.length ? items.map(renderDispute).join('') : '<div class="ad-empty">Споров нет.</div>'}
        `;
        document.getElementById('f-disp').addEventListener('change', e => { state.disputesFilter = e.target.value; render(); });
        panel.querySelectorAll('.ad-card').forEach(card => {
          card.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', async () => {
            b.disabled = true;
            try { await disputeAction(card.dataset.id, b.dataset.act); }
            catch (e) { alert('Ошибка: ' + e.message); b.disabled = false; }
          }));
        });
      } else if (state.activeTab === 'merge') {
        const items = await loadMerges();
        panel.innerHTML = `
          <div class="ad-filters">
            <span style="color:rgba(255,255,255,0.55);font-size:0.85rem;">Статус:</span>
            <select class="ad-filter-select" id="f-mer">
              ${['PENDING_OWNERS','PENDING_ADMIN','APPROVED','EXECUTED','REJECTED','CANCELLED','ALL']
                .map(s => `<option value="${s}" ${state.mergeFilter===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          ${items.length ? items.map(renderMerge).join('') : '<div class="ad-empty">Запросов нет.</div>'}
        `;
        document.getElementById('f-mer').addEventListener('change', e => { state.mergeFilter = e.target.value; render(); });
        panel.querySelectorAll('.ad-card').forEach(card => {
          card.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', async () => {
            b.disabled = true;
            try { await mergeAction(card.dataset.id, b.dataset.act); }
            catch (e) { alert('Ошибка: ' + e.message); b.disabled = false; }
          }));
        });
      } else {
        const items = await loadClaims();
        panel.innerHTML = `
          ${items.length ? items.map(renderClaim).join('') : '<div class="ad-empty">PENDING заявок нет.</div>'}
          <div class="ad-ops">
            <p class="ad-ops__title">Ручные операции (для тестирования крона)</p>
            <div class="ad-card__actions">
              <button class="ad-btn ad-btn--ghost" id="ops-trigger">Запустить проверку неактивных</button>
              <button class="ad-btn ad-btn--ghost" id="ops-expire">Просрочить старые claims</button>
            </div>
          </div>
        `;
        document.getElementById('ops-trigger').addEventListener('click', runTriggerCheck);
        document.getElementById('ops-expire').addEventListener('click', runExpire);
        panel.querySelectorAll('.ad-card').forEach(card => {
          card.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', async () => {
            b.disabled = true;
            try { await claimAction(card.dataset.id, b.dataset.act); }
            catch (e) { alert('Ошибка: ' + e.message); b.disabled = false; }
          }));
        });
      }
    } catch (e) {
      panel.innerHTML = `<div class="ad-error">${escapeHtml(e.message || 'Ошибка загрузки')}</div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
