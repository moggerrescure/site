/* ═══════════════════════════════════════════════════════════
 *  DISPUTES UI (person.html)
 *  ─────────────────────────────────────────────────────────
 *  - Кнопка "Оспорить" видна авторизованным НЕ-владельцам.
 *  - Модал с reason (5 вариантов) + description (мин 10) +
 *    duplicateOfSlug (для DUPLICATE).
 *  - POST /api/profiles/:slug/disputes
 *  - При OWNERSHIP_CLAIM показывает hint про автоматическое
 *    создание merge request владельцу.
 *  - При DUPLICATE auto-creates pending merge request.
 * ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!document.getElementById('disputes-styles')) {
    const s = document.createElement('style');
    s.id = 'disputes-styles';
    s.textContent = `
      .dispute-btn-wrap { margin: 18px 0 0; }
      .dispute-btn {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
        padding: 8px 18px;
        border-radius: 6px;
        border: 1px solid rgba(200, 90, 90, 0.45);
        background: transparent;
        color: #d68080;
        cursor: pointer;
        transition: all 0.2s;
      }
      .dispute-btn:hover { background: rgba(200, 90, 90, 0.10); border-color: rgba(200, 90, 90, 0.75); }
      .dispute-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.72);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; padding: 16px;
      }
      .dispute-modal {
        background: #131313; border: 1px solid rgba(200, 168, 75, 0.20);
        border-radius: 12px; max-width: 540px; width: 100%;
        padding: 28px 26px; color: #eee; max-height: 90vh; overflow-y: auto;
      }
      .dispute-modal__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.6rem; font-weight: 500; color: #d8b96b;
        margin: 0 0 8px;
      }
      .dispute-modal__sub {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem; color: rgba(255,255,255,0.55);
        margin: 0 0 20px; line-height: 1.5;
      }
      .dispute-modal__field { margin-bottom: 14px; }
      .dispute-modal__label {
        display: block; font-size: 0.82rem; color: rgba(255,255,255,0.7);
        margin-bottom: 6px; font-family: var(--font-body, 'Inter', sans-serif);
      }
      .dispute-modal__input, .dispute-modal__select, .dispute-modal__textarea {
        width: 100%; padding: 9px 12px; box-sizing: border-box;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
        border-radius: 6px; color: #eee; font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.9rem;
      }
      .dispute-modal__textarea { min-height: 110px; resize: vertical; line-height: 1.4; }
      .dispute-modal__input:focus, .dispute-modal__select:focus, .dispute-modal__textarea:focus {
        outline: none; border-color: rgba(216,185,107,0.5);
      }
      .dispute-modal__hint {
        font-size: 0.78rem; color: rgba(255,255,255,0.45);
        margin: 4px 0 0; line-height: 1.4;
      }
      .dispute-modal__actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
      .dispute-modal__btn {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.88rem; padding: 9px 20px; border-radius: 6px;
        border: 1px solid; background: transparent; cursor: pointer;
        transition: all 0.2s;
      }
      .dispute-modal__btn--cancel { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
      .dispute-modal__btn--cancel:hover { background: rgba(255,255,255,0.05); }
      .dispute-modal__btn--submit { border-color: rgba(216,185,107,0.5); color: #d8b96b; }
      .dispute-modal__btn--submit:hover { background: rgba(216,185,107,0.10); border-color: rgba(216,185,107,0.8); }
      .dispute-modal__btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .dispute-modal__error {
        font-size: 0.82rem; color: #d68080; margin-top: 10px;
        min-height: 1.2em;
      }
      .dispute-modal__success {
        font-size: 0.95rem; color: #7dc99a; text-align: center;
        padding: 24px 0 8px;
      }
    `;
    document.head.appendChild(s);
  }

  const REASON_LABELS = {
    WRONG_INFO:      'Неверная информация в профиле',
    INAPPROPRIATE:   'Оскорбительный / неуместный контент',
    OWNERSHIP_CLAIM: 'Я родственник — прошу передать владение',
    DUPLICATE:       'Это дубликат другого профиля',
    OTHER:           'Другая причина',
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function openModal(slug, profileName) {
    if (document.querySelector('.dispute-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'dispute-modal-overlay';
    overlay.innerHTML = `
      <div class="dispute-modal" role="dialog" aria-modal="true">
        <h2 class="dispute-modal__title">Оспорить страницу</h2>
        <p class="dispute-modal__sub">${escapeHtml(profileName || 'Эта страница памяти')} — выберите причину и опишите суть проблемы. Заявка попадёт на рассмотрение администратору.</p>
        <form id="dispute-form">
          <div class="dispute-modal__field">
            <label class="dispute-modal__label" for="d-reason">Причина</label>
            <select class="dispute-modal__select" id="d-reason" name="reason" required>
              ${Object.keys(REASON_LABELS).map(k => `<option value="${k}">${escapeHtml(REASON_LABELS[k])}</option>`).join('')}
            </select>
          </div>
          <div class="dispute-modal__field" id="d-dup-wrap" style="display:none;">
            <label class="dispute-modal__label" for="d-dup">Slug или ID оригинального профиля</label>
            <input class="dispute-modal__input" id="d-dup" name="duplicateOfProfileId" placeholder="например: ivan-petrov-1234"/>
            <p class="dispute-modal__hint">Это slug из URL оригинальной страницы (часть после <code>/p/</code> или <code>?id=</code>).</p>
          </div>
          <div class="dispute-modal__field" id="d-owner-hint" style="display:none;">
            <p class="dispute-modal__hint" style="color:rgba(216,185,107,0.7);">⓵ После одобрения админом владельцу профиля будет автоматически отправлен запрос на передачу.</p>
          </div>
          <div class="dispute-modal__field">
            <label class="dispute-modal__label" for="d-desc">Описание (минимум 10 символов)</label>
            <textarea class="dispute-modal__textarea" id="d-desc" name="description" required minlength="10" maxlength="4000" placeholder="Опишите суть проблемы…"></textarea>
          </div>
          <p class="dispute-modal__error" id="d-error"></p>
          <div class="dispute-modal__actions">
            <button type="button" class="dispute-modal__btn dispute-modal__btn--cancel" id="d-cancel">Отмена</button>
            <button type="submit" class="dispute-modal__btn dispute-modal__btn--submit" id="d-submit">Отправить заявку</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    const reasonEl = document.getElementById('d-reason');
    const dupWrap  = document.getElementById('d-dup-wrap');
    const ownerHint= document.getElementById('d-owner-hint');
    function syncFields() {
      const v = reasonEl.value;
      dupWrap.style.display   = v === 'DUPLICATE' ? '' : 'none';
      ownerHint.style.display = v === 'OWNERSHIP_CLAIM' ? '' : 'none';
      document.getElementById('d-dup').required = v === 'DUPLICATE';
    }
    reasonEl.addEventListener('change', syncFields);
    syncFields();

    function close() { overlay.remove(); document.removeEventListener('keydown', onEsc); }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('d-cancel').addEventListener('click', close);
    document.addEventListener('keydown', onEsc);

    document.getElementById('dispute-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = document.getElementById('d-error');
      const btn = document.getElementById('d-submit');
      errEl.textContent = '';
      btn.disabled = true;
      try {
        const body = {
          reason: fd.get('reason'),
          description: fd.get('description'),
        };
        if (body.reason === 'DUPLICATE') {
          const dup = (fd.get('duplicateOfProfileId') || '').toString().trim();
          if (!dup) throw new Error('Укажите slug или ID оригинала');
          body.duplicateOfProfileId = dup;
        }
        const r = await API.post(`/api/profiles/${encodeURIComponent(slug)}/disputes`, body);
        const d = (r && r.data) || {};
        const isMerge = body.reason === 'DUPLICATE' && d.mergeRequestId;
        overlay.querySelector('.dispute-modal').innerHTML = `
          <h2 class="dispute-modal__title">Заявка отправлена</h2>
          <p class="dispute-modal__success">✓ Спасибо. Администратор рассмотрит заявку в ближайшее время.${isMerge ? '<br/><br/><span style="color:rgba(216,185,107,0.7);font-size:0.85rem;">Параллельно создан запрос на объединение профилей.</span>' : ''}</p>
          <div class="dispute-modal__actions">
            <button class="dispute-modal__btn dispute-modal__btn--submit" id="d-close-ok">Понятно</button>
          </div>`;
        document.getElementById('d-close-ok').addEventListener('click', close);
      } catch (err) {
        errEl.textContent = err.message || 'Не удалось отправить';
        btn.disabled = false;
      }
    });
  }

  function mount(slug, profileName) {
    const header = document.querySelector('.person-header__info');
    if (!header) return;
    if (header.querySelector('.dispute-btn-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'dispute-btn-wrap';
    wrap.innerHTML = `<button class="dispute-btn" type="button">⚠ Оспорить страницу</button>`;
    wrap.querySelector('button').addEventListener('click', () => openModal(slug, profileName));
    header.appendChild(wrap);
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('id');
    if (!slug) return;
    if (typeof API === 'undefined' || !API.isLoggedIn || !API.isLoggedIn()) return;

    // Wait for person-header to render (max ~8s)
    const t0 = Date.now();
    while (!document.querySelector('.person-header__info') ||
           document.querySelector('.person-header__info .skel-line')) {
      if (Date.now() - t0 > 8000) return;
      await new Promise(r => setTimeout(r, 150));
    }

    // Check if current user is owner — don't show button for own profile
    try {
      const r = await API.get(`/api/profiles/${encodeURIComponent(slug)}`);
      const p = (r && (r.data || r)) || {};
      if (p.isOwner) return;
      const name = p.fullName || p.name || '';
      mount(slug, name);
    } catch (e) {
      // 404/403 — page not loaded for us; do nothing
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
