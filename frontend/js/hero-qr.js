(function () {
  const v = document.getElementById("hero-qr-video");
  const box = document.getElementById("hero-canvas-container");
  if (!v || !box) return;

  // 1. Ambient autoplay/loop
  v.loop = true;
  v.muted = true;
  v.playsInline = true;

  // 2. Optimization: Pause video when out of viewport
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
  observer.observe(box);

  // 3. Desktop drag scrubbing (only if hover pointer is supported)
  const isDesktop = window.matchMedia("(hover:hover)").matches;
  if (isDesktop) {
    box.style.cursor = "grab";
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isDragging = false;
    let targetTime = 0;
    let rafId = null;

    const updateCurrentTime = () => {
      if (isDragging) {
        v.currentTime += (targetTime - v.currentTime) * 0.25;
        rafId = requestAnimationFrame(updateCurrentTime);
      } else {
        rafId = null;
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx > 6 || dy > 6) {
          if (dx > dy) {
            isDragging = true;
            v.pause();
            box.style.cursor = "grabbing";
            if (!rafId) {
              rafId = requestAnimationFrame(updateCurrentTime);
            }
          } else {
            // Vertical movement: cancel drag and let page scroll naturally
            cleanup();
            v.play().catch(() => {});
          }
        }
        return;
      }

      const dur = v.duration || 12; // video length in seconds (12s = 360 frames at 30fps)
      const deltaX = e.clientX - startX;
      // box.clientWidth maps to full video duration
      const target = startTime + (deltaX / box.clientWidth) * dur;
      targetTime = Math.max(0, Math.min(dur, target));
    };

    const onPointerUp = () => {
      cleanup();
      box.style.cursor = "grab";
      v.play().catch(() => {});
    };

    const cleanup = () => {
      isDragging = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    box.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      startY = e.clientY;
      startTime = v.currentTime;
      targetTime = startTime;
      isDragging = false;

      v.pause();

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  }
})();
