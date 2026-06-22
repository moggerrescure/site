/**
 * Lazy Video Autoplay & Intersection Observer
 * Manages video playback to prevent browser autoplay blockages, especially on mobile/iOS,
 * by sequentially starting videos only when they enter the viewport and pausing them when they leave.
 */
(function () {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const visibleVideos = new Set();
  let playQueue = [];
  let queueTimeout = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        visibleVideos.add(video);
        if (!playQueue.includes(video) && video.paused) {
          playQueue.push(video);
          processQueue();
        }
      } else {
        visibleVideos.delete(video);
        playQueue = playQueue.filter(v => v !== video);
        video.pause();
      }
    });
  }, observerOptions);

  function processQueue() {
    if (queueTimeout) return;

    const playNext = () => {
      // Filter out videos that are no longer visible
      playQueue = playQueue.filter(v => visibleVideos.has(v));

      if (playQueue.length === 0) {
        queueTimeout = null;
        return;
      }

      const video = playQueue.shift();
      if (video && visibleVideos.has(video)) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("[Autoplay] Playback prevented for:", video.src || video.currentSrc, err);
          });
        }
      }

      // Schedule next play with a 1-second delay
      queueTimeout = setTimeout(playNext, 1000);
    };

    playNext();
  }

  // Initialize observer on DOMContentLoaded or immediately if already loaded
  function init() {
    document.querySelectorAll('video').forEach(video => {
      // Temporarily disable autoplay attribute to let our observer handle it
      video.autoplay = false;
      
      // Ensure the video plays inline and loops
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.loop = true;
      video.preload = 'auto';

      observer.observe(video);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
