/*
 * layout.js — единый источник общей шапки и подвала сайта QR-Память.
 *
 * Как подключать на странице:
 *   1) В начале <body> поставить плейсхолдер:  <div id="site-header"></div>
 *      и сразу после него:  <script src="js/layout.js?v=1"></script>
 *   2) Перед </body> (где нужен футер):  <div id="site-footer"></div>
 *
 * Меняешь меню/футер/логотип только здесь — на всех страницах обновится автоматически.
 * Скрипты auth-ui.js / nav.js работают: шапка содержит .nav__inner и .nav__links.
 */
(function () {
  'use strict';

  // Инициализация темы на страницах памяти и конструктора
  (function initTheme() {
    var path = window.location.pathname;
    var isMemoryOrEditor = path.indexOf('/person.html') !== -1 || 
                           path.indexOf('/ai-constructor.html') !== -1 ||
                           path.indexOf('/p/') === 0;

    if (isMemoryOrEditor) {
      var savedTheme = 'dark';
      try { savedTheme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
      if (savedTheme === 'light') {
        document.documentElement.classList.add('theme-light');
        if (document.body) document.body.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
        if (document.body) document.body.classList.remove('theme-light');
      }
    } else {
      document.documentElement.classList.remove('theme-light');
      if (document.body) document.body.classList.remove('theme-light');
    }
  })();


  // Залогинен ли пользователь (токен кладёт auth-ui.js; логин/логаут делают reload,
  // поэтому проверки на этапе загрузки достаточно).
  var loggedIn = false;
  try { loggedIn = !!localStorage.getItem('memory_jwt'); } catch (e) {}

  // Блог и Вопросы показываем только гостям; залогиненным — не захламляем меню.
  var GUEST_LINKS = loggedIn ? '' :
    '<li><a href="blog.html" class="nav__link" data-path="blog.html">Блог</a></li>' +
    '<li><a href="faq.html" class="nav__link" data-path="faq.html">Вопросы</a></li>';

  var HEADER =
    '<nav class="nav"><div class="nav__inner">' +
      '<a href="/" class="nav__logo" aria-label="QR-Память — на главную">' +
        '<img src="assets-v2/logo-tree-cut.webp" alt="" width="360" height="369" />' +
        '<span class="nav__logo-script">QR-Память</span>' +
      '</a>' +
      '<ul class="nav__links">' +
        '<li><a href="/" class="nav__link" data-path="index.html">Главная</a></li>' +
        '<li><a href="memory.html" class="nav__link" data-path="memory.html">Страницы памяти</a></li>' +
        '<li><a href="family-tree.html?tree=default" class="nav__link" data-path="family-tree.html">Древо семьи</a></li>' +
        '<li><a href="timeline.html" class="nav__link" data-path="timeline.html">Летопись</a></li>' +
        GUEST_LINKS +
      '</ul>' +
    '</div></nav>';

  var FOOTER =
    '<footer class="footer"><div class="footer__top">' +
      '<div class="footer__logo-wrap">' +
        '<span class="footer__logo">QR-Память</span>' +
        '<span class="footer__tagline">Пронесём историю вашей семьи сквозь века</span>' +
      '</div>' +
      '<nav class="footer__nav" aria-label="Навигация сайта">' +
        '<a href="/" class="footer__nav-link">Главная</a>' +
        '<a href="memory.html" class="footer__nav-link">Страницы памяти</a>' +
        '<a href="family-tree.html?tree=default" class="footer__nav-link">Древо семьи</a>' +
        '<a href="timeline.html" class="footer__nav-link">Летопись</a>' +
        '<a href="blog.html" class="footer__nav-link">Блог</a>' +
        '<a href="faq.html" class="footer__nav-link">Вопросы и ответы</a>' +
        '<a href="about.html" class="footer__nav-link">О сервисе</a>' +
      '</nav>' +
    '</div><div class="footer__bottom"><div class="footer__inner">' +
      '<p class="footer__copy">© 2024–2026 QR-Память · Беларусь</p>' +
      '<p class="footer__copy">' +
        '<a href="privacy.html" class="footer__copy-link">Политика конфиденциальности</a> · ' +
        '<a href="terms.html" class="footer__copy-link">Условия</a>' +
      '</p>' +
    '</div></div></footer>';

  function fill(id, html) {
    var el = document.getElementById(id);
    if (el && el.getAttribute('data-filled') !== '1') {
      el.innerHTML = html;
      el.setAttribute('data-filled', '1');
      return true;
    }
    return false;
  }

  function markActive() {
    var p = location.pathname.split('/').pop();
    if (!p) p = 'index.html';
    var links = document.querySelectorAll('#site-header [data-path]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('data-path') === p) {
        links[i].classList.add('nav__link--active');
      }
    }
  }

  function injectThemeToggle() {
    var path = window.location.pathname;
    var isMemoryOrEditor = path.indexOf('/person.html') !== -1 || 
                           path.indexOf('/ai-constructor.html') !== -1 ||
                           path.indexOf('/p/') === 0;
                           
    if (!isMemoryOrEditor) return;
    if (document.getElementById('theme-toggle')) return;

    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('title', 'Переключить тему');
    btn.setAttribute('aria-label', 'Переключить тему');
    btn.innerHTML = 
      '<svg class="theme-icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
      '</svg>' +
      '<svg class="theme-icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">' +
        '<circle cx="12" cy="12" r="5"></circle>' +
        '<line x1="12" y1="1" x2="12" y2="3"></line>' +
        '<line x1="12" y1="21" x2="12" y2="23"></line>' +
        '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
        '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
        '<line x1="1" y1="12" x2="3" y2="12"></line>' +
        '<line x1="21" y1="12" x2="23" y2="12"></line>' +
        '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
        '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
      '</svg>';
    document.body.appendChild(btn);

    var darkIcon = btn.querySelector('.theme-icon-dark');
    var lightIcon = btn.querySelector('.theme-icon-light');

    function applyTheme(theme) {
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
        if (darkIcon) darkIcon.style.display = 'none';
        if (lightIcon) lightIcon.style.display = 'block';
      } else {
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
        if (darkIcon) darkIcon.style.display = 'block';
        if (lightIcon) lightIcon.style.display = 'none';
      }
      window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: theme } }));
    }

    var savedTheme = 'dark';
    try { savedTheme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
    applyTheme(savedTheme);

    btn.addEventListener('click', function () {
      var currentTheme = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
      var newTheme = currentTheme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme', newTheme); } catch (e) {}
      applyTheme(newTheme);
    });
  }

  function mountHeader() { if (fill('site-header', HEADER)) markActive(); }
  function mountFooter() { fill('site-footer', FOOTER); }

  mountHeader();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mountHeader();
      mountFooter();
      injectThemeToggle();
    });
  } else {
    mountFooter();
    injectThemeToggle();
  }
})();

