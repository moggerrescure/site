/* QR-Память v2 — взаимодействия (без тяжёлых частиц/3D) */
(function(){
  'use strict';

  /* ── NAV: scroll state + burger ── */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.nav__burger');
  if (burger && nav){
    burger.addEventListener('click', function(){
      var open = nav.classList.toggle('menu-open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav__links a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('menu-open'); burger.classList.remove('open'); });
    });
  }
  window.addEventListener('scroll', function(){
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
  }, {passive:true});

  /* ── REVEAL on scroll — robust (scroll/resize/load handler, no IO quirks).
     Hidden state is gated on html.js, so this can only ever reveal. ── */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  function revealInView(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = reveals.length - 1; i >= 0; i--){
      var el = reveals[i], r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0){
        el.classList.add('in');
        reveals.splice(i, 1);
      }
    }
  }
  revealInView();
  requestAnimationFrame(revealInView);
  window.addEventListener('scroll', revealInView, {passive:true});
  window.addEventListener('resize', revealInView);
  window.addEventListener('load', revealInView);
  /* safety net: never leave content hidden */
  setTimeout(function(){ reveals.forEach(function(el){ el.classList.add('in'); }); }, 2200);

  /* ── COUNTERS ── */
  function plural(n, forms){
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }
  var PL = {
    people:['страница памяти','страницы памяти','страниц памяти'],
    cities:['город','города','городов'],
    generations:['поколение','поколения','поколений'],
    reviews:['воспоминание','воспоминания','воспоминаний']
  };
  function runCount(el){
    var target = parseInt(el.dataset.count, 10) || 0;
    var label = el.parentElement.querySelector('.stat__l');
    var dur = 1400, t0 = performance.now();
    (function tick(now){
      var p = Math.min((now - t0)/dur, 1);
      var v = Math.round(target * (1 - Math.pow(1-p,3)));
      el.textContent = v;
      if (label && PL[el.dataset.stat]) label.textContent = plural(v, PL[el.dataset.stat]);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ runCount(en.target); cio.unobserve(en.target); } });
    }, {threshold:0.5});
    document.querySelectorAll('.stat__n').forEach(function(el){ cio.observe(el); });
  } else {
    document.querySelectorAll('.stat__n').forEach(runCount);
  }

  /* ── CANDLE ── */
  var candle = document.getElementById('candle');
  var countEl = document.getElementById('candle-count');
  if (candle && countEl){
    var KEY = 'qrm_candles_v2';
    candle.classList.add('lit');
    countEl.textContent = localStorage.getItem(KEY) || '238';
    var busy = false;
    function toggle(){
      if (busy) return; busy = true;
      if (candle.classList.contains('lit')){
        candle.classList.remove('lit');
        setTimeout(function(){ busy = false; }, 300);
      } else {
        candle.classList.add('lit');
        var c = (parseInt(countEl.textContent,10)||238) + 1;
        countEl.textContent = c; localStorage.setItem(KEY, c);
        countEl.animate ? countEl.animate([{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:450,easing:'ease'}) : 0;
        setTimeout(function(){ busy = false; }, 300);
      }
    }
    candle.addEventListener('click', toggle);
    candle.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
  }

  /* ── REAL QR on the plaque (qrious if available, else CSS fallback stays) ── */
  function drawQR(){
    var holder = document.getElementById('plaque-qr');
    if (!holder || typeof QRious === 'undefined') return;
    var fb = holder.querySelector('.qr-fallback');
    var canvas = document.createElement('canvas');
    holder.insertBefore(canvas, fb);
    if (fb) fb.remove();
    new QRious({ element:canvas, value:'https://qr-memory.by/', size:216, backgroundAlpha:0, foreground:'#16120a', level:'M' });
  }
  if (document.readyState !== 'loading') drawQR();
  else document.addEventListener('DOMContentLoaded', drawQR);
})();
