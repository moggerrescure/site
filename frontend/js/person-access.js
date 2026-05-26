'use strict';
/* ═══════════════════════════════════════════════
   PERSON-ACCESS.JS — UI выдачи доступа к профилю (Frontend G)
   Кнопка «👥 Доступ» появляется только если data.canManageAccess === true
   Открывает модал со списком грантов и формой добавления.
   ═══════════════════════════════════════════════ */
(function () {
    const params = new URLSearchParams(window.location.search);
    const idOrSlug = params.get('id');
    if (!idOrSlug) return;
    if (typeof API === 'undefined' || !API.isLoggedIn || !API.isLoggedIn()) return;

    let profileCache = null;
    let canManage    = false;

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, m =>
            ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])
        );
    }

    async function init() {
        try {
            const r = await API.get('/api/profiles/' + encodeURIComponent(idOrSlug));
            profileCache = r && r.data ? r.data : null;
            if (!profileCache) return;
            canManage = !!profileCache.canManageAccess;
            if (!canManage) return;
            injectButton();
        } catch (e) {
            // профиль может быть приватный и недоступен — ничего не показываем
        }
    }

    function injectButton() {
        // ждём пока появится edit-panel ИЛИ создаём собственный контейнер
        function attach() {
            const editPanel = document.getElementById('edit-panel');
            const host = editPanel || (function () {
                let host = document.getElementById('access-panel');
                if (!host) {
                    host = document.createElement('div');
                    host.id = 'access-panel';
                    host.className = 'edit-panel access-panel';
                    document.body.appendChild(host);
                }
                return host;
            })();
            if (document.getElementById('access-toggle-btn')) return;
            const btn = document.createElement('button');
            btn.id = 'access-toggle-btn';
            btn.className = 'edit-panel__btn access-toggle-btn';
            btn.type = 'button';
            btn.innerHTML = '👥 Доступ';
            btn.addEventListener('click', openModal);
            host.appendChild(btn);
        }
        if (document.readyState === 'complete') setTimeout(attach, 600);
        else window.addEventListener('load', () => setTimeout(attach, 600));
    }

    /* ─── modal ─── */
    function openModal() {
        if (document.getElementById('access-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'access-modal';
        modal.className = 'access-modal';
        modal.innerHTML =
            '<div class="access-modal__backdrop" data-close="1"></div>' +
            '<div class="access-modal__panel" role="dialog" aria-modal="true">' +
              '<div class="access-modal__header">' +
                '<h2 class="access-modal__title">Доступ к странице</h2>' +
                '<button class="access-modal__close" data-close="1" aria-label="Закрыть">×</button>' +
              '</div>' +
              '<div class="access-modal__body">' +
                '<form class="access-form" id="access-add-form">' +
                  '<input type="email" id="access-email" placeholder="email пользователя" required class="access-form__input"/>' +
                  '<label class="access-form__checkbox">' +
                    '<input type="checkbox" id="access-canedit"/> <span>Может редактировать</span>' +
                  '</label>' +
                  '<button type="submit" class="access-form__submit">+ Выдать доступ</button>' +
                '</form>' +
                '<div class="access-form__error" id="access-form-error" style="display:none"></div>' +
                '<div class="access-list" id="access-list"><div class="access-list__loading">Загрузка…</div></div>' +
              '</div>' +
            '</div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target.dataset && e.target.dataset.close) closeModal();
        });
        document.addEventListener('keydown', escHandler);
        document.getElementById('access-add-form').addEventListener('submit', onAdd);
        loadGrants();
    }

    function escHandler(e) {
        if (e.key === 'Escape') closeModal();
    }

    function closeModal() {
        const m = document.getElementById('access-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', escHandler);
    }

    async function loadGrants() {
        const list = document.getElementById('access-list');
        if (!list) return;
        list.innerHTML = '<div class="access-list__loading">Загрузка…</div>';
        try {
            const r = await API.get('/api/profiles/' + encodeURIComponent(idOrSlug) + '/access');
            const grants = (r && r.data) || r.grants || [];
            renderGrants(grants);
        } catch (e) {
            list.innerHTML = '<div class="access-list__empty">Ошибка: ' + esc(e.message || 'не удалось загрузить') + '</div>';
        }
    }

    function renderGrants(grants) {
        const list = document.getElementById('access-list');
        if (!list) return;
        if (!grants.length) {
            list.innerHTML = '<div class="access-list__empty">Пока никто не приглашён.</div>';
            return;
        }
        list.innerHTML = grants.map(g => {
            const u = g.user || {};
            const name = u.displayName || u.email || u.id || 'Без имени';
            return '' +
                '<div class="access-row" data-user-id="' + esc(u.id) + '">' +
                  '<div class="access-row__info">' +
                    '<div class="access-row__name">' + esc(name) + '</div>' +
                    '<div class="access-row__email">' + esc(u.email || '') + '</div>' +
                  '</div>' +
                  '<label class="access-row__toggle">' +
                    '<input type="checkbox" data-action="toggle-canedit"' + (g.canEdit ? ' checked' : '') + '/>' +
                    '<span>Редактирование</span>' +
                  '</label>' +
                  '<button class="access-row__remove" data-action="remove" type="button" title="Отозвать доступ">×</button>' +
                '</div>';
        }).join('');

        list.querySelectorAll('.access-row').forEach(row => {
            const userId = row.dataset.userId;
            row.querySelector('[data-action="toggle-canedit"]').addEventListener('change', async (e) => {
                const cb = e.currentTarget;
                cb.disabled = true;
                try {
                    await API.patch('/api/profiles/' + encodeURIComponent(idOrSlug) + '/access/' + encodeURIComponent(userId),
                        { canEdit: cb.checked });
                } catch (err) {
                    cb.checked = !cb.checked;
                    alert('Не удалось изменить: ' + (err.message || ''));
                } finally {
                    cb.disabled = false;
                }
            });
            row.querySelector('[data-action="remove"]').addEventListener('click', async () => {
                if (!confirm('Отозвать доступ?')) return;
                try {
                    await API.del('/api/profiles/' + encodeURIComponent(idOrSlug) + '/access/' + encodeURIComponent(userId));
                    row.remove();
                    if (!document.querySelectorAll('.access-row').length) renderGrants([]);
                } catch (err) {
                    alert('Не удалось отозвать: ' + (err.message || ''));
                }
            });
        });
    }

    async function onAdd(e) {
        e.preventDefault();
        const email = (document.getElementById('access-email').value || '').trim();
        const canEdit = !!document.getElementById('access-canedit').checked;
        const errEl = document.getElementById('access-form-error');
        errEl.style.display = 'none';
        if (!email || !email.includes('@')) {
            errEl.textContent = 'Введите корректный email';
            errEl.style.display = 'block';
            return;
        }
        const submit = e.target.querySelector('.access-form__submit');
        submit.disabled = true;
        const oldText = submit.textContent;
        submit.textContent = '⏳ Добавляю...';
        try {
            await API.post('/api/profiles/' + encodeURIComponent(idOrSlug) + '/access',
                { userEmail: email, canEdit });
            document.getElementById('access-email').value = '';
            document.getElementById('access-canedit').checked = false;
            await loadGrants();
        } catch (err) {
            errEl.textContent = err.message || 'Не удалось выдать доступ';
            errEl.style.display = 'block';
        } finally {
            submit.disabled = false;
            submit.textContent = oldText;
        }
    }

    init();
})();
