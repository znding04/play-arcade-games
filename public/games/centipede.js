/**
 * Centipede - Classic Atari Arcade Game
 * Controls: Arrow keys or A/D to move, Space or W to shoot
 * Touch: tap left/right half of screen to move, tap center to shoot
 */
(function () {
  var canvas, ctx, w, h;
  var player, bullets, centipede, mushrooms, spider, particles;
  var score, lives, level, gameOver, gameWon;
  var keys = {};
  var lastShot = 0, shotCooldown = 300;
  var animId, cleanupFn;
  var COL = 20, ROW = 18;
  var cellW, cellH;
  var spiderTimer, spiderInterval = 5000;

  function reset() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    gameWon = false;
    bullets = [];
    particles = [];
    spider = null;
    spiderTimer = performance.now() + 2000;
    initMushrooms();
    initCentipede();
    initPlayer();
  }

  function initMushrooms() {
    mushrooms = [];
    var count = 25 + level * 5;
    while (count > 0) {
      var col = Math.floor(Math.random() * COL);
      var row = Math.floor(Math.random() * (ROW - 5)) + 4;
      var exists = mushrooms.some(function (m) { return m.col === col && m.row === row; });
      if (!exists) {
        mushrooms.push({ col: col, row: row });
        count--;
      }
    }
  }

  function initCentipede() {
    centipede = [];
    var segCount = 8 + level;
    for (var i = 0; i < segCount; i++) {
      centipede.push({
        col: COL - 2 - i,
        row: i,
        dir: 1, // 1 = right, -1 = left
        alive: true
      });
    }
  }

  function initPlayer() {
    player = {
      col: Math.floor(COL / 2),
      x: 0, y: 0,
      vx: 0,
      invincible: 0
    };
    updatePlayerPos();
  }

  function updatePlayerPos() {
    player.x = player.col * cellW + cellW / 2;
    player.y = (ROW - 1) * cellH + cellH / 2;
  }

  function shoot() {
    var now = performance.now();
    if (now - lastShot < shotCooldown) return;
    lastShot = now;
    bullets.push({
      col: player.col,
      row: ROW - 1,
      y: (ROW - 1) * cellH
    });
  }

  function update(dt) {
    if (gameOver || gameWon) return;

    dt = Math.min(dt, 50);
    var now = performance.now();

    // Player movement
    var moveSpeed = (keys['ArrowLeft'] || keys['KeyA'] || keys['a']) ? -1 : (keys['ArrowRight'] || keys['KeyD'] || keys['d']) ? 1 : 0;
    if (moveSpeed !== 0) {
      player.col += moveSpeed * dt * 0.012;
      player.col = Math.max(0, Math.min(COL - 1, player.col));
      updatePlayerPos();
    }
    if (keys['ArrowUp'] || keys['KeyW'] || keys['w'] || keys['Space']) {
      shoot();
    }

    // Player invincibility
    if (player.invincible > 0) player.invincible -= dt;

    // Bullets
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.y -= dt * 0.5;
      b.row = Math.floor(b.y / cellH);
      // Check hit centipede
      var hitCenti = false;
      for (var j = centipede.length - 1; j >= 0; j--) {
        var seg = centipede[j];
        if (seg.alive && seg.col === b.col && seg.row === b.row) {
          seg.alive = false;
          score += 10;
          mushrooms.push({ col: seg.col, row: seg.row });
          // Split centipede at this point
          if (j > 0) centipede[j - 1].dir *= -1;
          hitCenti = true;
          // Particles
          for (var p = 0; p < 5; p++) {
            particles.push({
              x: b.col * cellW + cellW / 2, y: b.y,
              vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
              life: 300, color: '#0f0'
            });
          }
          break;
        }
      }
      if (hitCenti) { bullets.splice(i, 1); continue; }
      // Check hit mushroom
      var mushIdx = -1;
      for (var k = 0; k < mushrooms.length; k++) {
        if (mushrooms[k].col === b.col && mushrooms[k].row === b.row) {
          mushIdx = k;
          break;
        }
      }
      if (mushIdx >= 0) {
        mushrooms.splice(mushIdx, 1);
        score += 1;
        for (p = 0; p < 3; p++) {
          particles.push({
            x: b.col * cellW + cellW / 2, y: b.y,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            life: 200, color: '#ff0'
          });
        }
        bullets.splice(i, 1);
        continue;
      }
      // Off screen
      if (b.row < 0) {
        bullets.splice(i, 1);
      }
    }

    // Centipede movement
    moveCentipede(dt);

    // Spider
    if (!spider && now > spiderTimer) {
      var startLeft = Math.random() > 0.5;
      spider = {
        col: startLeft ? 0 : COL - 1,
        row: ROW - 1,
        x: (startLeft ? 0 : COL - 1) * cellW + cellW / 2,
        y: (ROW - 1) * cellH + cellH / 2,
        dir: startLeft ? 1 : -1,
        speed: 0.08 + level * 0.01
      };
      spiderTimer = now + spiderInterval + Math.random() * 3000;
    }
    if (spider) {
      spider.col += spider.dir * dt * spider.speed;
      if (spider.col < -1 || spider.col > COL) {
        spider = null;
      } else {
        spider.x = spider.col * cellW + cellW / 2;
        // Check collision with player
        if (player.invincible <= 0 && Math.abs(spider.col - player.col) < 1 && spider.row === ROW - 1) {
          playerDeath();
        }
      }
    }

    // Check centipede reaching bottom
    for (var s = 0; s < centipede.length; s++) {
      var sg = centipede[s];
      if (sg.alive && sg.row >= ROW - 1) {
        // Check collision with player
        if (player.invincible <= 0 && Math.abs(sg.col - player.col) < 1.5) {
          playerDeath();
        }
      }
    }

    // Particles
    for (var q = particles.length - 1; q >= 0; q--) {
      var pt = particles[q];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(q, 1);
    }

    // Win condition
    var allDead = true;
    for (var si = 0; si < centipede.length; si++) {
      if (centipede[si].alive) { allDead = false; break; }
    }
    if (allDead) {
      level++;
      score += 100;
      mushrooms = [];
      initMushrooms();
      centipede = [];
      initCentipede();
      bullets = [];
      player.col = Math.floor(COL / 2);
      updatePlayerPos();
      player.invincible = 1500;
    }
  }

  function moveCentipede(dt) {
    if (!centipede.length) return;

    // Accumulate time for step-based movement
    if (!moveCentipede._timer) moveCentipede._timer = 0;
    moveCentipede._timer += dt;
    var stepTime = Math.max(80, 350 - level * 20);
    var steps = Math.floor(moveCentipede._timer / stepTime);
    if (steps === 0) return;
    moveCentipede._timer -= steps * stepTime;

    for (var step = 0; step < steps; step++) {
      // Move each segment
      for (var i = 0; i < centipede.length; i++) {
        var seg = centipede[i];
        if (!seg.alive) continue;

        var newCol = seg.col + seg.dir;
        var hitMush = false;
        for (var m = 0; m < mushrooms.length; m++) {
          if (mushrooms[m].col === newCol && mushrooms[m].row === seg.row) {
            hitMush = true;
            break;
          }
        }

        if (newCol < 0 || newCol >= COL || hitMush) {
          seg.dir *= -1;
          seg.row++;
          // Check mushroom above where it's about to be
          newCol = seg.col + seg.dir;
        } else {
          seg.col = newCol;
        }
      }
    }
  }

  function playerDeath() {
    lives--;
    if (lives <= 0) {
      gameOver = true;
      // End explosion particles
      for (var p = 0; p < 30; p++) {
        particles.push({
          x: player.x, y: player.y,
          vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
          life: 800 + Math.random() * 400, color: Math.random() > 0.5 ? '#f44' : '#f84'
        });
      }
      return;
    }
    bullets = [];
    player.col = Math.floor(COL / 2);
    updatePlayerPos();
    player.invincible = 2000;
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (var r = 0; r < ROW; r++) {
      for (var c = 0; c < COL; c++) {
        ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
      }
    }

    // Mushrooms
    for (var i = 0; i < mushrooms.length; i++) {
      var mx = mushrooms[i].col * cellW + cellW / 2;
      var my = mushrooms[i].row * cellH + cellH / 2;
      var mr = Math.min(cellW, cellH) * 0.35;
      ctx.fillStyle = '#b44';
      ctx.beginPath();
      for (var a = 0; a < 5; a++) {
        var angle = (a / 5) * Math.PI * 2;
        var px = mx + Math.cos(angle) * mr * 1.2;
        var py = my + Math.sin(angle) * mr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f88';
      ctx.beginPath();
      ctx.arc(mx, my - mr * 0.3, mr * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centipede
    for (var j = 0; j < centipede.length; j++) {
      var seg = centipede[j];
      if (!seg.alive) continue;
      var sx = seg.col * cellW + cellW / 2;
      var sy = seg.row * cellH + cellH / 2;
      var sr = Math.min(cellW, cellH) * 0.42;
      // Body
      ctx.fillStyle = j === 0 ? '#0f0' : '#0a0';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Eyes on head
      if (j === 0) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx - sr * 0.3, sy - sr * 0.3, sr * 0.25, 0, Math.PI * 2);
        ctx.arc(sx + sr * 0.3, sy - sr * 0.3, sr * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx - sr * 0.25, sy - sr * 0.3, sr * 0.15, 0, Math.PI * 2);
        ctx.arc(sx + sr * 0.35, sy - sr * 0.3, sr * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      // Legs
      ctx.strokeStyle = '#0a0';
      ctx.lineWidth = 1;
      for (var leg = -1; leg <= 1; leg += 2) {
        ctx.beginPath();
        ctx.moveTo(sx, sy + sr * 0.3);
        ctx.lineTo(sx + leg * sr * 0.9, sy + sr * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx, sy - sr * 0.1);
        ctx.lineTo(sx + leg * sr * 0.7, sy - sr * 0.6);
        ctx.stroke();
      }
    }

    // Spider
    if (spider) {
      var sx2 = spider.x, sy2 = spider.y;
      var sr2 = Math.min(cellW, cellH) * 0.45;
      ctx.fillStyle = '#c0f';
      ctx.beginPath();
      ctx.arc(sx2, sy2, sr2, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.strokeStyle = '#c0f';
      ctx.lineWidth = 1.2;
      for (var spleg = 0; spleg < 3; spleg++) {
        var la = -Math.PI / 3 + spleg * (Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(sx2 + Math.cos(la) * sr2 * 0.5, sy2 + Math.sin(la) * sr2 * 0.5);
        ctx.lineTo(sx2 + Math.cos(la) * sr2 * 1.8, sy2 + Math.sin(la) * sr2 * 1.8 + sr2 * 0.3);
        ctx.stroke();
      }
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(sx2 - sr2 * 0.3, sy2 - sr2 * 0.2, sr2 * 0.2, 0, Math.PI * 2);
      ctx.arc(sx2 + sr2 * 0.3, sy2 - sr2 * 0.2, sr2 * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    if (player.invincible <= 0 || Math.floor(player.invincible / 100) % 2 === 0) {
      var px2 = player.x, py2 = player.y;
      var pr = Math.min(cellW, cellH) * 0.4;
      ctx.fillStyle = '#4af';
      ctx.beginPath();
      ctx.moveTo(px2, py2 - pr);
      ctx.lineTo(px2 - pr, py2 + pr);
      ctx.lineTo(px2 + pr, py2 + pr);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8cf';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Gun tip
      ctx.fillStyle = '#8cf';
      ctx.fillRect(px2 - 3, py2 - pr - 6, 6, 8);
    }

    // Bullets
    ctx.fillStyle = '#ff0';
    for (var bi = 0; bi < bullets.length; bi++) {
      var bx = bullets[bi].col * cellW + cellW / 2;
      var by = bullets[bi].y;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (var pi = 0; pi < particles.length; pi++) {
      var p = particles[pi];
      var alpha = p.life / 500;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 18);
    ctx.textAlign = 'right';
    var hearts = '';
    for (var hi = 0; hi < lives; hi++) hearts += '♥';
    ctx.fillStyle = '#f44';
    ctx.fillText(hearts, w - 10, 18);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';
    ctx.fillText('Level ' + level, w / 2, 18);

    // Game Over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.fillText('Score: ' + score, w / 2, h / 2 + 20);
      ctx.fillText('Press ENTER to restart', w / 2, h / 2 + 50);
    }
  }

  function loop(ts) {
    var dt = loop._last ? ts - loop._last : 16;
    loop._last = ts;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  loop._last = 0;

  function handleKey(e) {
    keys[e.code] = e.type === 'keydown';
    if (e.code === 'Space' || e.code === 'ArrowUp') e.preventDefault();
    if (e.code === 'Enter' && (gameOver || gameWon)) {
      reset();
    }
  }

  function handleTouchStart(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var tx = touch.clientX - rect.left;
    var ty = touch.clientY - rect.top;
    var scaleX = w / rect.width;
    var scaleY = h / rect.height;
    tx *= scaleX;
    ty *= scaleY;
    // Top 60% = shoot; Bottom 40% = move
    if (ty < h * 0.6) {
      keys['Space'] = true;
    } else {
      if (tx < w / 3) keys['ArrowLeft'] = true;
      else if (tx > w * 2 / 3) keys['ArrowRight'] = true;
      else keys['Space'] = true;
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['Space'] = false;
  }

  function handleTouchMove(e) {
    e.preventDefault();
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['Space'] = false;
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var tx = touch.clientX - rect.left;
    var ty = touch.clientY - rect.top;
    var scaleX = w / rect.width;
    var scaleY = h / rect.height;
    tx *= scaleX;
    ty *= scaleY;
    if (ty < h * 0.6) {
      keys['Space'] = true;
    } else {
      if (tx < w / 3) keys['ArrowLeft'] = true;
      else if (tx > w * 2 / 3) keys['ArrowRight'] = true;
      else keys['Space'] = true;
    }
  }

  function resize() {
    var container = canvas.parentElement;
    var maxH = Math.min(container.clientHeight || 600, window.innerHeight * 0.8);
    w = Math.min(container.clientWidth || 600, 600);
    h = Math.max(400, maxH - 40);
    canvas.width = w;
    canvas.height = h;
    cellW = w / COL;
    cellH = h / ROW;
    updatePlayerPos();
  }

  window.initGame = function (container) {
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.maxWidth = '100%';
    canvas.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    reset();
    loop._last = 0;
    animId = requestAnimationFrame(loop);

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      if (moveCentipede._timer) moveCentipede._timer = 0;
      keys = {};
    };
    window.__gameCleanup = cleanupFn;
  };
})();