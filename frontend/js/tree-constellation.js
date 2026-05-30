/* ═══════════════════════════════════════════════
   CONSTELLATION FAMILY TREE — Canvas Overlay Effect
   Adds a glowing cosmic/starfield background,
   pulsing galaxy halos behind cards, and animated
   energy flow particles tracing the family branches.
   ═══════════════════════════════════════════════ */

(function () {
  const wrapper = document.getElementById('tree-wrapper');
  if (!wrapper) return;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'tree-constellation-canvas';
  wrapper.insertBefore(canvas, wrapper.firstChild);

  const ctx = canvas.getContext('2d');

  let W, H;
  let bgStars = [];
  let nodeCenters = {};
  let pathParticles = [];

  // Handle sizing
  function resize() {
    W = wrapper.offsetWidth;
    H = wrapper.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    
    // Reinitialize background stars
    initBgStars();
  }

  function initBgStars() {
    bgStars = [];
    const count = Math.floor((W * H) / 22000) || 50;
    for (let i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.4,
        alpha: Math.random(),
        speed: 0.004 + Math.random() * 0.012,
        twinkle: Math.random() < 0.35
      });
    }
  }

  // Update card positions
  function updateNodeCenters() {
    nodeCenters = {};
    const wRect = wrapper.getBoundingClientRect();
    const nodes = wrapper.querySelectorAll('.tree-node');
    
    nodes.forEach(node => {
      const id = node.dataset.id;
      const frame = node.querySelector('.tree-node__frame');
      if (!frame || !id) return;
      
      const fRect = frame.getBoundingClientRect();
      const scaleX = wRect.width / wrapper.offsetWidth || 1;
      const scaleY = wRect.height / wrapper.offsetHeight || 1;
      
      nodeCenters[id] = {
        x: (fRect.left - wRect.left) / scaleX + (fRect.width / scaleX) / 2,
        y: (fRect.top - wRect.top) / scaleY + (fRect.height / scaleY) / 2,
        r: (fRect.width / scaleX) / 2,
        color: frame.style.getPropertyValue('--clan-color') || '#c8a84b'
      };
    });
  }

  // Manage particles along paths
  function updatePathParticles() {
    const paths = document.querySelectorAll('#tree-threads path');
    const activePaths = new Set();
    
    paths.forEach((path, index) => {
      // Use the 'd' attribute as unique key
      const id = path.getAttribute('d') || index.toString();
      activePaths.add(id);
      
      // If we don't have particles for this path, seed some
      let pathData = pathParticles.find(p => p.id === id);
      if (!pathData) {
        let length = 0;
        try { length = path.getTotalLength(); } catch (e) {}
        
        pathData = {
          id: id,
          pathElement: path,
          length: length,
          particles: []
        };
        
        // Spawn 1-2 particles per path at random starting positions
        if (length > 10) {
          const numParticles = Math.random() < 0.5 ? 1 : 2;
          for (let k = 0; k < numParticles; k++) {
            pathData.particles.push({
              progress: Math.random(),
              speed: (0.7 + Math.random() * 0.9) / (length || 100), // speed of flow
              size: Math.random() * 1.4 + 0.9,
              alpha: 0.35 + Math.random() * 0.65,
              color: path.getAttribute('stroke') || '#c8a84b'
            });
          }
        }
        pathParticles.push(pathData);
      } else {
        // Update length in case layout shifted
        try { pathData.length = pathData.pathElement?.getTotalLength() || pathData.length; } catch (e) {}
      }
    });

    // Remove stale paths
    pathParticles = pathParticles.filter(p => activePaths.has(p.id));
  }

  // Animation loop
  function loop() {
    ctx.clearRect(0, 0, W, H);
    
    // Draw background stars
    bgStars.forEach(star => {
      if (star.twinkle) {
        star.alpha += star.speed;
        if (star.alpha > 0.85 || star.alpha < 0.15) star.speed *= -1;
      }
      ctx.fillStyle = `rgba(243, 233, 200, ${star.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw glowing halos and orbits behind nodes
    updateNodeCenters();
    
    Object.values(nodeCenters).forEach(node => {
      // Glow halo
      const grad = ctx.createRadialGradient(node.x, node.y, node.r * 0.5, node.x, node.y, node.r * 1.9);
      grad.addColorStop(0, `${node.color}2c`);
      grad.addColorStop(0.5, `${node.color}0f`);
      grad.addColorStop(1, `${node.color}00`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // Dotted orbit ring rotating
      ctx.strokeStyle = `${node.color}22`;
      ctx.lineWidth = 0.75;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      // Second wider solid ring
      ctx.strokeStyle = `${node.color}0c`;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 1.55, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw animated energy flow particles along SVG paths
    updatePathParticles();
    
    pathParticles.forEach(pathData => {
      if (pathData.length < 5) return;
      
      pathData.particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0.0;
          p.size = Math.random() * 1.4 + 0.9;
          p.alpha = 0.35 + Math.random() * 0.65;
        }

        try {
          const pt = pathData.pathElement.getPointAtLength(p.progress * pathData.length);
          
          // Draw particle glow
          const glowGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, p.size * 4.5);
          glowGrad.addColorStop(0, `${p.color}ff`);
          glowGrad.addColorStop(0.4, `${p.color}55`);
          glowGrad.addColorStop(1, `${p.color}00`);
          
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, p.size * 4.5, 0, Math.PI * 2);
          ctx.fill();
        } catch (e) {}
      });
    });

    requestAnimationFrame(loop);
  }

  // Setup
  resize();
  window.addEventListener('resize', resize);
  
  // Start loop after short delay to ensure page elements are laid out
  setTimeout(() => {
    updateNodeCenters();
    loop();
  }, 400);

  // Periodically update node centers in case of edits or folds
  setInterval(updateNodeCenters, 1200);

})();
