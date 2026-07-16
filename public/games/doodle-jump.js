/**
 * Doodle Jump - Vertical Platform Jumper
 * Controls: Arrow keys / A,D to move, touch/swipe on canvas
 */
(function () {
  var canvas, ctx, w, h;
  var doodle, platforms, score, highScore, gameOver, hasStarted;
  var keys = {};
  var animId, cleanupFn;
  var lastPlatformY = 0;
  var cameraY = 0;
  var touchX = null;

  // Doodle character
  function createDoodle() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 40,
      height: 44,
      facingRight: true
    };
  }

  function createPlatform(x, y, type) {
    var types = {
      normal: { color: '#85bb65', width: 70, height: 12, points: 0 },
      moving: { color: '#4169e1', width: 70, height: 12, points: 0, dir: Math.random() > 0.5 ? 1 : -1, speed: 1.5 + Math.random() * 2 },
      spring: { color: '#ff6347', width: 50, height: 12, points: 0, bounce: true },
      fragile: { color: '#daa520', width: 70, height: 12, points: 0, breakable: true, broken: false }
    };
    if (!type) {
      var r = Math.random();
      if (r < 0.05) type = 'spring';
      else if (r < 0.12) type = 'fragile';
      else if (r < 0.22) type = 'moving';
      else type = 'normal';
    }
    return {
      x: x,
      y: y,
      type: type,
      width: types[type].width,
      height: types[type].height,
      color: types[type].color,
      dir: types[type].dir || 0,
      speed: types[type].speed || 0,
      bounce: types[type].bounce || false,
      breakable: types[type].breakable || false,
      broken: false,
      springCompress: 0
    };
  }

  function generatePlatforms() {
    platforms = [];
    var floorY = h - 60;
    // Starting platform
    platforms.push(createPlatform(w / 2 - 35, floorY, 'normal'));
    lastPlatformY = floorY;

    for (var i = 0; i < 12; i++) {
      lastPlatformY -= 60 + Math.random() * 20;
      platforms.push(createPlatform(
        Math.random() * (w - 80),
        lastPlatformY,
        null
      ));
    }
  }

  function startGame() {
    score = 0;
    gameOver = false;
    hasStarted = true;
    cameraY = 0;
    generatePlatforms();
    doodle = createDoodle();
    // Place doodle on first platform
    doodle.x = w / 2 - 20;
    doodle.y = h - 100;
    doodle.vy = -8;
  }

  function update() {
    if (gameOver) return;

    // Horizontal movement
    var moveSpeed = 5;
    if (keys['ArrowLeft'] || keys['KeyA']) {
      doodle.vx = -moveSpeed;
      doodle.facingRight = false;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      doodle.vx = moveSpeed;
      doodle.facingRight = true;
    } else if (touchX !== null) {
      var centerX = canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2;
      if (touchX < centerX - 15) {
        doodle.vx = -moveSpeed;
        doodle.facingRight = false;
      } else if (touchX > centerX + 15) {
        doodle.vx = moveSpeed;
        doodle.facingRight = true;
      } else {
        doodle.vx = 0;
      }
    } else {
      doodle.vx *= 0.8;
    }

    // Apply gravity and velocity
    doodle.vy += 0.4;
    doodle.x += doodle.vx;
    doodle.y += doodle.vy;

    // Wrap horizontally
    if (doodle.x + doodle.width < 0) doodle.x = w;
    if (doodle.x > w) doodle.x = -doodle.width;

    // Move moving platforms
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (p.type === 'moving' && !p.broken) {
        p.x += p.dir * p.speed;
        if (p.x <= 0 || p.x + p.width >= w) {
          p.dir *= -1;
        }
      }
    }

    // Platform collision (only when falling)
    if (doodle.vy > 0) {
      for (var i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        if (p.broken) continue;
        var platScreenY = p.y + cameraY;

        // Check if doodle feet overlap platform
        var doodleBottom = doodle.y + doodle.height;
        var prevBottom = doodleBottom - doodle.vy;

        if (
          prevBottom <= platScreenY &&
          doodleBottom >= platScreenY &&
          doodle.x + doodle.width > p.x &&
          doodle.x < p.x + p.width
        ) {
          if (p.type === 'fragile') {
            p.broken = true;
            doodle.vy = -8;
          } else if (p.type === 'spring') {
            p.springCompress = 8;
            doodle.vy = -14;
          } else {
            doodle.vy = -9;
          }

          // Update score as doodle goes higher
          var newPotentialScore = Math.max(0, Math.floor(-(p.y) / 10));
          if (newPotentialScore > score) {
            score = newPotentialScore;
          }

          // Spring uncompress
          if (p.type === 'spring') {
            setTimeout((function(plat) {
              return function() { plat.springCompress = 0; };
            })(p), 200);
          }
        }
      }
    }

    // Camera follows doodle when going up
    var targetY = doodle.y - h * 0.35;
    if (targetY < cameraY) {
      cameraY += (targetY - cameraY) * 0.1;
    }

    // Generate new platforms above
    var topWorldY = -(cameraY + 100);
    if (lastPlatformY > topWorldY) {
      while (lastPlatformY > topWorldY) {
        lastPlatformY -= 50 + Math.random() * 30;
        platforms.push(createPlatform(
          10 + Math.random() * (w - 90),
          lastPlatformY,
          null
        ));
      }
    }

    // Remove platforms that are too far below
    platforms = platforms.filter(function(p) {
      return p.y + cameraY < h + 100;
    });

    // Update score based on height
    var heightScore = Math.max(0, Math.floor(-cameraY / 10));
    score = Math.max(score, heightScore);

    // Check game over (fell off bottom)
    var doodleScreenY = doodle.y + cameraY;
    if (doodleScreenY > h + 100) {
      gameOver = true;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem('doodleJumpHighScore', score); } catch(e) {}
      }
    }
  }

  function drawDoodle() {
    var dx = doodle.x;
    var dy = doodle.y + cameraY;
    var facing = doodle.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(dx + doodle.width / 2, dy + doodle.height / 2);
    if (doodle.vy > 3) {
      ctx.scale(1.15, 0.85);
    } else if (doodle.vy < -3) {
      ctx.scale(0.9, 1.1);
    }

    // Body
    ctx.fillStyle = '#6dbd4a';
    ctx.fillRect(-16, -22, 32, 28);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(facing * 4 - 6, -16, 8, 8);
    ctx.fillRect(facing * 4 + 2, -16, 8, 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(facing * 4 - 2, -14, 5, 5);
    ctx.fillRect(facing * 4 + 6, -14, 5, 5);

    // Mouth
    ctx.fillStyle = '#222';
    ctx.fillRect(facing * 2, -6, 12, 3);

    // Legs
    ctx.fillStyle = '#6dbd4a';
    ctx.fillRect(-12, 6, 8, 12);
    ctx.fillRect(4, 6, 8, 12);

    // Feet
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-14, 16, 12, 6);
    ctx.fillRect(2, 16, 12, 6);

    // Antenna
    ctx.strokeStyle = '#6dbd4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-4, -30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -30);
    ctx.lineTo(-6, -34);
    ctx.stroke();

    ctx.restore();
  }

  function draw() {
    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(0.5, '#b0e0e6');
    grad.addColorStop(1, '#e0f0e8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw platforms
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      var py = p.y + cameraY;
      if (py < -30 || py > h + 30) continue;

      if (p.broken) continue;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(p.x + 2, py + 3, p.width, p.height + 4);

      // Platform body
      if (p.type === 'spring' && p.springCompress > 0) {
        ctx.fillStyle = '#cc3322';
        ctx.fillRect(p.x, py + p.springCompress, p.width, p.height - p.springCompress);
        // Spring coil
        ctx.strokeStyle = '#ff6347';
        ctx.lineWidth = 2;
        for (var s = 0; s < 3; s++) {
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, py + p.height - 2 - s * 3, 3, 0, Math.PI);
          ctx.stroke();
        }
      } else {
        var platGrad = ctx.createLinearGradient(p.x, py, p.x, py + p.height);
        platGrad.addColorStop(0, p.color);
        platGrad.addColorStop(1, '#555');
        ctx.fillStyle = platGrad;

        // Rounded rect
        var r = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + r, py);
        ctx.lineTo(p.x + p.width - r, py);
        ctx.quadraticCurveTo(p.x + p.width, py, p.x + p.width, py + r);
        ctx.lineTo(p.x + p.width, py + p.height - r);
        ctx.quadraticCurveTo(p.x + p.width, py + p.height, p.x + p.width - r, py + p.height);
        ctx.lineTo(p.x + r, py + p.height);
        ctx.quadraticCurveTo(p.x, py + p.height, p.x, py + p.height - r);
        ctx.lineTo(p.x, py + r);
        ctx.quadraticCurveTo(p.x, py, p.x + r, py);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw doodle
    drawDoodle();

    // HUD
    ctx.fillStyle = '#222';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('Best: ' + highScore, 10, 50);

    if (!hasStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Doodle Jump', w / 2, h / 2 - 30);
      ctx.font = '16px monospace';
      ctx.fillText('Tap or press SPACE to start', w / 2, h / 2 + 10);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', w / 2, h / 2 - 20);
      ctx.font = '18px monospace';
      ctx.fillText('Score: ' + score, w / 2, h / 2 + 15);
      ctx.font = '14px monospace';
      ctx.fillText('Tap or press SPACE to restart', w / 2, h / 2 + 40);
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function handleKey(e) {
    keys[e.code] = e.type === 'keydown';
    if (e.code === 'Space') {
      e.preventDefault();
      if (!hasStarted || gameOver) {
        startGame();
      }
    }
  }

  function handleTouchStart(e) {
    e.preventDefault();
    if (!hasStarted || gameOver) {
      startGame();
      return;
    }
    var t = e.touches[0];
    touchX = t.clientX;
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (gameOver) return;
    var t = e.touches[0];
    touchX = t.clientX;
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    touchX = null;
  }

  function resize() {
    var container = canvas.parentElement;
    w = canvas.width = container.clientWidth || 400;
    h = canvas.height = container.clientHeight || 600;
    if (w < 200) w = 400;
    if (h < 300) h = 600;
    if (!doodle) return;
    // Keep doodle in bounds
    if (doodle.x > w) doodle.x = w - doodle.width;
  }

  window.initGame = function (container) {
    // Load high score
    try {
      highScore = parseInt(localStorage.getItem('doodleJumpHighScore')) || 0;
    } catch(e) { highScore = 0; }

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.maxWidth = '500px';
    canvas.style.margin = '0 auto';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    hasStarted = false;
    gameOver = true;
    score = 0;
    doodle = createDoodle();

    generatePlatforms();
    loop();

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      keys = {};
      touchX = null;
    };
    window.__gameCleanup = cleanupFn;
  };
})();