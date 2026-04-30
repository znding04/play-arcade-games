/* ============================================================
   SPACE INVADERS
   Classic alien-shooting game. Move left/right, shoot bullets.
   Touch controls with on-screen buttons.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const W = 400, H = 500;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="si-score">0</b></span><span>Best: <b id="si-best">0</b></span><span>Level: <b id="si-level">1</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#0a0a0f;border-radius:8px;max-width:100%;touch-action:none;';
  wrap.appendChild(canvas);

  // Touch controls
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:12px;margin-top:10px;';
  ['◀ Left', '🔫 Fire', 'Right ▶'].forEach(function (label, i) {
    var b = document.createElement('button');
    b.textContent = label;
    b.dataset.action = ['left', 'fire', 'right'][i];
    b.style.cssText = 'padding:12px 20px;font-size:14px;font-weight:600;border:none;border-radius:8px;background:#292524;color:#fff;cursor:pointer;flex:1;';
    controls.appendChild(b);
  });
  wrap.appendChild(controls);

  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('si-score');
  const bestEl = document.getElementById('si-best');
  const levelEl = document.getElementById('si-level');

  let best = parseInt(localStorage.getItem('space-invaders-best') || '0');
  bestEl.textContent = best;

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // State
  const PLAYER_W = 36, PLAYER_H = 20;
  const ALIEN_W = 28, ALIEN_H = 20, ALIEN_COLS = 8, ALIEN_ROWS = 4;
  const BULLET_W = 3, BULLET_H = 10;

  let playerX, bullets, alienBullets, aliens, alienDir, alienSpeed, dropDown;
  let score, level, running, gameOver, animId, keys, shootCooldown;

  function init() {
    playerX = W / 2 - PLAYER_W / 2;
    bullets = []; alienBullets = []; keys = {};
    alienDir = 1; alienSpeed = 1; dropDown = false;
    score = 0; level = 1; shootCooldown = 0;
    running = false; gameOver = false;
    scoreEl.textContent = '0'; levelEl.textContent = '1';
    createAliens();
  }

  function createAliens() {
    aliens = [];
    var colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6'];
    for (var r = 0; r < ALIEN_ROWS; r++) {
      for (var c = 0; c < ALIEN_COLS; c++) {
        aliens.push({
          x: 30 + c * (ALIEN_W + 10),
          y: 40 + r * (ALIEN_H + 12),
          alive: true,
          color: colors[r]
        });
      }
    }
  }

  function update() {
    if (!running || gameOver) return;
    shootCooldown = Math.max(0, shootCooldown - 1);

    // Player movement
    if (keys.left) playerX = Math.max(0, playerX - 5);
    if (keys.right) playerX = Math.min(W - PLAYER_W, playerX + 5);
    if (keys.fire && shootCooldown === 0) {
      bullets.push({ x: playerX + PLAYER_W / 2, y: H - 40 });
      shootCooldown = 12;
    }

    // Bullets
    for (var i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= 6;
      if (bullets[i].y < 0) { bullets.splice(i, 1); continue; }
      // Hit alien?
      for (var j = 0; j < aliens.length; j++) {
        if (aliens[j].alive && bullets[i] &&
          bullets[i].x > aliens[j].x && bullets[i].x < aliens[j].x + ALIEN_W &&
          bullets[i].y > aliens[j].y && bullets[i].y < aliens[j].y + ALIEN_H) {
          aliens[j].alive = false;
          bullets.splice(i, 1);
          score += 10;
          scoreEl.textContent = score;
          if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('space-invaders-best', best); }
          break;
        }
      }
    }

    // Alien bullets
    for (var k = alienBullets.length - 1; k >= 0; k--) {
      alienBullets[k].y += 4;
      if (alienBullets[k].y > H) { alienBullets.splice(k, 1); continue; }
      // Hit player?
      if (alienBullets[k].x > playerX && alienBullets[k].x < playerX + PLAYER_W &&
        alienBullets[k].y > H - 35 && alienBullets[k].y < H - 15) {
        gameOver = true; running = false; btn.textContent = 'Try Again'; return;
      }
    }

    // Move aliens
    var hitEdge = false;
    var liveAliens = aliens.filter(function (a) { return a.alive; });
    liveAliens.forEach(function (a) {
      a.x += alienDir * alienSpeed;
      if (a.x <= 0 || a.x + ALIEN_W >= W) hitEdge = true;
    });
    if (hitEdge) {
      alienDir = -alienDir;
      liveAliens.forEach(function (a) { a.y += 14; });
    }

    // Alien shoot
    if (Math.random() < 0.02 && liveAliens.length > 0) {
      var shooter = liveAliens[Math.floor(Math.random() * liveAliens.length)];
      alienBullets.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H });
    }

    // Aliens reach bottom?
    liveAliens.forEach(function (a) {
      if (a.y + ALIEN_H >= H - 40) { gameOver = true; running = false; btn.textContent = 'Try Again'; }
    });

    // All dead? Next level
    if (liveAliens.length === 0) {
      level++; levelEl.textContent = level;
      alienSpeed = Math.min(3, 1 + level * 0.3);
      createAliens();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Player
    ctx.fillStyle = '#60a5fa';
    ctx.shadowBlur = 10; ctx.shadowColor = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_W / 2, H - 35);
    ctx.lineTo(playerX, H - 15);
    ctx.lineTo(playerX + PLAYER_W, H - 15);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bullets
    ctx.fillStyle = '#fbbf24';
    bullets.forEach(function (b) { ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H); });

    // Alien bullets
    ctx.fillStyle = '#ef4444';
    alienBullets.forEach(function (b) { ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H); });

    // Aliens
    aliens.forEach(function (a) {
      if (!a.alive) return;
      ctx.fillStyle = a.color;
      ctx.fillRect(a.x, a.y, ALIEN_W, ALIEN_H);
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(a.x + 6, a.y + 6, 4, 4);
      ctx.fillRect(a.x + ALIEN_W - 10, a.y + 6, 4, 4);
      // Legs
      ctx.fillStyle = a.color;
      ctx.fillRect(a.x + 2, a.y + ALIEN_H, 4, 4);
      ctx.fillRect(a.x + ALIEN_W - 6, a.y + ALIEN_H, 4, 4);
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(10,10,15,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c084fc'; ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
      ctx.font = '700 24px Courier New, monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '500 14px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 18);
    }

    if (!running && !gameOver) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '600 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Press Start to Play', W / 2, H / 2 + 60);
    }
  }

  function loop() {
    update(); draw();
    animId = requestAnimationFrame(loop);
  }

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); keys.fire = true; }
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp') keys.fire = false;
  });

  // Touch buttons
  controls.querySelectorAll('button').forEach(function (b) {
    function start(e) { e.preventDefault(); keys[b.dataset.action] = true; }
    function end(e) { e.preventDefault(); keys[b.dataset.action] = false; }
    b.addEventListener('touchstart', start, { passive: false });
    b.addEventListener('touchend', end, { passive: false });
    b.addEventListener('mousedown', start);
    b.addEventListener('mouseup', end);
    b.addEventListener('mouseleave', end);
  });

  btn.addEventListener('click', function () {
    init(); running = true; btn.textContent = 'Restart';
  });

  init(); draw(); loop();
};
