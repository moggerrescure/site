(function () {
  const v = document.getElementById("hero-qr-video");
  const box = document.getElementById("hero-canvas-container");
  if (!v) return;

  // Плавный авто-цикл, без вращения по нажатию.
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.setAttribute("webkit-playsinline", "");

  // Экономия: пауза, когда блок вне экрана.
  const target = box || v;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.2 }
  );
  observer.observe(target);

  // Подстраховка для автоплея (iOS/первый кадр).
  v.play().catch(() => {});
})();
