/* ═══════════════════════════════════════════════════════════
 *  REVIEW MODERATION (owner / admin only)
 *  ──────────────────────────────────────────────────────────
 *  - При загрузке страницы /person.html?id=<slug>
 *    тихо ходит в GET /api/reviews/:id/pending.
 *  - 200 → рисует панель «На модерации» с кнопками
 *      «Одобрить» (PUT /api/reviews/:id/approve)
 *      «Отклонить» (PUT /api/reviews/:id/reject)
 *  - 401 / 403 / 404 → ничего не показывает.
 *  - Требует наличия глобального API (api.js) для базового URL,
 *    но работает через fetch, чтобы не зависеть от API.put.
 * ═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Стили (inject один раз) ─────────────────────────── */
    if (!document.getElementById('review-moderation-styles')) {
        const style = document.createElement('style');
        style.id = 'review-moderation-styles';
        style.textContent = `
.moderation-section {
    margin: 48px 0 32px;
    padding: 28px 26px;
    border: 1px solid rgba(200, 168, 75, 0.22);
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.04) 0%, rgba(0, 0, 0, 0) 100%);
    border-radius: 12px;
}
.moderation-section__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 18px;
    flex-wrap: wrap;
}
.moderation-section__title {
    font-family: var(--font-display, 'Cormorant Garamond', serif);
    font-size: 1.55rem;
    font-weight: 500;
    color: #d8b96b;
    margin: 0;
    letter-spacing: 0.02em;
}
.moderation-section__counter {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.85rem;
    color: rgba(216, 185, 107, 0.7);
    padding: 4px 10px;
    border: 1px solid rgba(216, 185, 107, 0.3);
    border-radius: 999px;
}
.moderation-section__hint {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.55);
    margin: 0 0 18px;
    line-height: 1.5;
}
.moderation-empty {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-style: italic;
    color: rgba(255, 255, 255, 0.45);
    padding: 18px 4px;
    text-align: center;
}
.moderation-card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 18px 18px 14px;
    margin-bottom: 14px;
    transition: opacity 0.4s, transform 0.4s;
}
.moderation-card[data-state="processing"] { opacity: 0.5; pointer-events: none; }
.moderation-card[data-state="done"]       { opacity: 0; transform: translateY(-8px); pointer-events: none; }
.moderation-card__type {
    display: inline-block;
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.75rem;
    color: rgba(200, 168, 75, 0.85);
    padding: 2px 8px;
    border: 1px solid rgba(200, 168, 75, 0.25);
    border-radius: 4px;
    margin-bottom: 10px;
    letter-spacing: 0.04em;
}
.moderation-card__author {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
    margin-bottom: 6px;
}
.moderation-card__date {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
    margin-bottom: 10px;
}
.moderation-card__text {
    font-family: var(--font-body, 'Inter', sans-serif);
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-bottom: 12px;
}
.moderation-card__media { margin: 10px 0 14px; }
.moderation-card__media img,
.moderation-card__media video {
    max-width: 100%;
    max-height: 280px;
    border-radius: 4px;
    display: block;
}
.moderation-card__media audio { width: 100%; }
.moderation-card__actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}
.moderation-card__btn {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.85rem;
    padding: 8px 18px;
    border-radius: 6px;
    border: 1px solid;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}
.moderation-card__btn--approve {
    border-color: rgba(90, 184, 122, 0.5);
    color: #7dc99a;
}
.moderation-card__btn--approve:hover {
    background: rgba(90, 184, 122, 0.12);
    border-color: rgba(90, 184, 122, 0.8);
}
.moderation-card__btn--reject {
    border-color: rgba(200, 90, 90, 0.5);
    color: #d68080;
}
.moderation-card__btn--reject:hover {
    background: rgba(200, 90, 90, 0.12);
    border-color: rgba(200, 90, 90, 0.8);
}
.moderation-card__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.moderation-card__error {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.8rem;
    color: #d68080;
    margin-top: 8px;
}
`;
        document.head.appendChild(style);
    }

    let personId = new URLSearchParams(window.location.search).get('id');
    if (!personId) {
        const m = location.pathname.match(/\/p\/([^/?#]+)/i);
        if (m) personId = decodeURIComponent(m[1]);
    }
    if (!personId) return;

    // Используем API из api.js — он сам подставляет JWT через fetch-interceptor.
    // API.get / API.put бросают исключение на не-2xx, поэтому ловим и нормализуем.
    async function apiCall(method, path) {
        if (typeof API === 'undefined') return { ok: false, status: 0, data: null };
        try {
            const fn = method === 'GET' ? API.get : (method === 'PUT' ? API.put : null);
            if (!fn) return { ok: false, status: 0, data: null };
            const data = await fn.call(API, path);
            return { ok: true, status: 200, data };
        } catch (e) {
            // API.req кидает Error c сообщением вида "HTTP 403" или текстом из json.error
            const msg = (e && e.message) || '';
            const m = msg.match(/HTTP (\d+)/);
            const status = m ? parseInt(m[1], 10) : 500;
            return { ok: false, status, data: { error: msg } };
        }
    }

    const TYPE_LABEL = {
        text:   '✦ Текст',
        photo:  '📷 Фото',
        audio:  '🎙 Аудио',
        video:  '🎥 Видео',
        quote:  '❧ Цитата',
        memory: '✿ Момент',
    };

    function resolveMedia(src) {
        if (!src) return '';
        if (typeof API !== 'undefined' && typeof API.resolveUrl === 'function') {
            return API.resolveUrl(src);
        }
        return src;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
        } catch (_) { return ''; }
    }

    function buildCard(review) {
        const type = review.reviewType || 'text';
        const media = review.photoDataUrl || review.mediaUrl || '';
        let mediaHtml = '';
        if (media) {
            const url = resolveMedia(media);
            if (type === 'audio')      mediaHtml = `<div class="moderation-card__media"><audio src="${escapeHtml(url)}" controls></audio></div>`;
            else if (type === 'video') mediaHtml = `<div class="moderation-card__media"><video src="${escapeHtml(url)}" controls></video></div>`;
            else                       mediaHtml = `<div class="moderation-card__media"><img src="${escapeHtml(url)}" alt="" loading="lazy"/></div>`;
        }
        return `
<div class="moderation-card" data-review-id="${escapeHtml(review.id)}">
    <span class="moderation-card__type">${escapeHtml(TYPE_LABEL[type] || TYPE_LABEL.text)}</span>
    <div class="moderation-card__author">${escapeHtml(review.author || 'Аноним')}</div>
    <div class="moderation-card__date">${escapeHtml(formatDate(review.createdAt))}</div>
    <div class="moderation-card__text">${escapeHtml(review.text || '')}</div>
    ${mediaHtml}
    <div class="moderation-card__actions">
        <button class="moderation-card__btn moderation-card__btn--approve" data-action="approve">Одобрить</button>
        <button class="moderation-card__btn moderation-card__btn--reject"  data-action="reject">Отклонить</button>
    </div>
    <div class="moderation-card__error" style="display:none;"></div>
</div>`;
    }

    function updateCounter(section) {
        const counter = section.querySelector('.moderation-section__counter');
        const remaining = section.querySelectorAll('.moderation-card:not([data-state="done"])').length;
        if (counter) counter.textContent = remaining + ' ожидает';
        if (remaining === 0) {
            const list = section.querySelector('.moderation-section__list');
            if (list && !list.querySelector('.moderation-empty')) {
                list.innerHTML = '<p class="moderation-empty">Новых воспоминаний на модерации нет.</p>';
            }
        }
    }

    async function handleAction(card, action) {
        const id = card.dataset.reviewId;
        const errEl = card.querySelector('.moderation-card__error');
        const buttons = card.querySelectorAll('.moderation-card__btn');
        errEl.style.display = 'none';
        errEl.textContent = '';
        buttons.forEach(b => b.disabled = true);
        card.dataset.state = 'processing';

        try {
            const res = await apiCall('PUT', `/api/reviews/${encodeURIComponent(id)}/${action}`);
            if (!res.ok) {
                const msg = (res.data && res.data.error) || `Ошибка ${res.status}`;
                throw new Error(msg);
            }
            // success — анимация ухода
            card.dataset.state = 'done';
            setTimeout(() => {
                const section = card.closest('.moderation-section');
                card.remove();
                if (section) updateCounter(section);

                // если одобрили — добавим карточку в основной список (если виджет доступен)
                if (action === 'approve' && typeof window._addMemoryCard === 'function' && res.data && res.data.data) {
                    try { window._addMemoryCard(res.data.data); } catch (_) {}
                }
            }, 420);
        } catch (e) {
            buttons.forEach(b => b.disabled = false);
            card.dataset.state = '';
            errEl.textContent = e.message || 'Не удалось выполнить действие';
            errEl.style.display = 'block';
        }
    }

    function mount(pending) {
        const memoriesSection = document.getElementById('memories-section');
        if (!memoriesSection) return;
        // не вставляем дважды
        if (memoriesSection.parentElement.querySelector('.moderation-section')) return;

        const section = document.createElement('section');
        section.className = 'moderation-section';
        section.innerHTML = `
<div class="moderation-section__header">
    <h2 class="moderation-section__title">На модерации</h2>
    <span class="moderation-section__counter">${pending.length} ожидает</span>
</div>
<p class="moderation-section__hint">Видно только владельцу страницы и администраторам. Одобренные воспоминания появятся в общем списке ниже.</p>
<div class="moderation-section__list">
    ${pending.length ? pending.map(buildCard).join('') : '<p class="moderation-empty">Новых воспоминаний на модерации нет.</p>'}
</div>`;
        memoriesSection.parentElement.insertBefore(section, memoriesSection);

        section.addEventListener('click', (e) => {
            const btn = e.target.closest('.moderation-card__btn');
            if (!btn) return;
            const card = btn.closest('.moderation-card');
            const action = btn.dataset.action;
            if (card && (action === 'approve' || action === 'reject')) {
                handleAction(card, action);
            }
        });
    }

    /* ── Init: ждём пока person.js нарисует #memories-section ── */
    async function init() {
        // не дергаем сервер если пользователь точно не залогинен
        try {
            if (typeof API !== 'undefined' && typeof API.isLoggedIn === 'function' && !API.isLoggedIn()) {
                return;
            }
        } catch (_) {}

        // ждём появления #memories-section (максимум ~8s)
        const t0 = Date.now();
        while (!document.getElementById('memories-section')) {
            if (Date.now() - t0 > 8000) return;
            await new Promise(r => setTimeout(r, 150));
        }

        const res = await apiCall('GET', `/api/reviews/${encodeURIComponent(personId)}/pending`);
        if (!res.ok) return; // 401/403/404 — молча
        const list = (res.data && Array.isArray(res.data.data)) ? res.data.data : [];
        mount(list);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
