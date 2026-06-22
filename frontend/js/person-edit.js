/* ═══════════════════════════════════════════════
   PERSON-EDIT.JS — мост к единому конструктору
   Создание И редактирование страницы памяти теперь живут в ОДНОМ
   конструкторе: ai-constructor.html (POST для новой страницы,
   ?id=… + PUT для редактирования существующей).
   Этот файл лишь показывает на странице памяти кнопку «Редактировать»,
   которая открывает тот конструктор в режиме редактирования.
   ═══════════════════════════════════════════════ */

(function () {
  const params = new URLSearchParams(window.location.search);
  let id = params.get('id');
  if (!id) {
    const m = location.pathname.match(/\/p\/([^/?#]+)/i);
    if (m) id = decodeURIComponent(m[1]);
  }
  if (!id) return;

  const autoEdit = params.get('edit') === '1';

  function goToEditor() {
    window.location.href = `ai-constructor.html?id=${encodeURIComponent(id)}`;
  }

  function initEditPanel() {
    if (document.getElementById('edit-panel')) return;
    const panel = document.createElement('div');
    panel.className = 'edit-panel';
    panel.id = 'edit-panel';
    panel.innerHTML = '<button class="edit-panel__btn" id="edit-toggle-btn">✏️ Редактировать</button>';
    document.body.appendChild(panel);
    document.getElementById('edit-toggle-btn').addEventListener('click', goToEditor);
  }

  function checkReadyAndInit() {
    if (document.querySelector('.person-header__name')) {
      // Прямой вход в редактирование (?edit=1) — сразу в конструктор.
      if (autoEdit) {
        window.location.replace(`ai-constructor.html?id=${encodeURIComponent(id)}`);
        return;
      }
      initEditPanel();
    } else {
      setTimeout(checkReadyAndInit, 100);
    }
  }

  if (document.readyState === 'complete') {
    checkReadyAndInit();
  } else {
    window.addEventListener('load', checkReadyAndInit);
  }
})();
