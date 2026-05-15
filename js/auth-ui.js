/* ═══════════════════════════════════════════════
   AUTH UI — Login / Register modal
   Injects "Войти" button into nav on all pages
   ═══════════════════════════════════════════════ */

(function () {
  const nav = document.querySelector('.nav__inner');
  if (!nav) return;

  /* ── Inject auth button into nav ── */
  const authBtn = document.createElement('button');
  authBtn.className = 'nav__auth';
  updateAuthBtn();
  nav.appendChild(authBtn);

  function updateAuthBtn() {
    if (API.isLoggedIn()) {
      authBtn.textContent = 'Выйти';
      authBtn.onclick = () => { API.logout(); location.reload(); };
    } else {
      authBtn.textContent = 'Войти';
      authBtn.onclick = () => openModal('login');
    }
  }

  /* ── Modal ── */
  let mode = 'login'; // or 'register'

  function openModal(m) {
    mode = m || 'login';
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay';
    overlay.id = 'auth-overlay';

    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true">
        <button class="auth-modal__close" id="auth-close" aria-label="Закрыть">×</button>
        <h2 class="auth-modal__title" id="auth-title">${mode === 'login' ? 'Войти' : 'Регистрация'}</h2>
        <form id="auth-form">
          ${mode === 'register' ? `
          <div class="auth-modal__field">
            <input class="auth-modal__input" type="text" name="name" placeholder="Имя" required autocomplete="name"/>
          </div>` : ''}
          <div class="auth-modal__field">
            <input class="auth-modal__input" type="email" name="email" placeholder="Email" required autocomplete="email"/>
          </div>
          <div class="auth-modal__field">
            <input class="auth-modal__input" type="password" name="password" placeholder="Пароль" required minlength="6" autocomplete="current-password"/>
          </div>
          <button type="submit" class="auth-modal__submit">
            ${mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <p class="auth-modal__error" id="auth-error"></p>
        </form>
        <p class="auth-modal__switch">
          ${mode === 'login'
            ? 'Нет аккаунта? <a id="auth-switch">Зарегистрироваться</a>'
            : 'Уже есть аккаунт? <a id="auth-switch">Войти</a>'}
        </p>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('input')?.focus();

    document.getElementById('auth-close').onclick  = closeModal;
    document.getElementById('auth-switch').onclick = () => openModal(mode === 'login' ? 'register' : 'login');
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', onEsc);

    document.getElementById('auth-form').addEventListener('submit', async e => {
      e.preventDefault();
      const fd   = new FormData(e.target);
      const errEl = document.getElementById('auth-error');
      const btn   = e.target.querySelector('.auth-modal__submit');
      btn.disabled = true;
      errEl.textContent = '';

      try {
        if (mode === 'login') {
          await API.login(fd.get('email'), fd.get('password'));
        } else {
          await API.register(fd.get('name'), fd.get('email'), fd.get('password'));
        }
        closeModal();
        updateAuthBtn();
        location.reload();
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
      }
    });
  }

  function closeModal() {
    document.getElementById('auth-overlay')?.remove();
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(e) { if (e.key === 'Escape') closeModal(); }
})();
