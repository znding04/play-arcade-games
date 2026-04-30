/* ============================================================
   CROSSY ROAD
   Cross lanes of traffic safely. Tap/swipe/arrow to move.
   Canvas-based with endless scrolling.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const W = 360, H = 540;
  const LANE_H = 40, PLAYER_SIZE = 28;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="cr-score">0</b></span><span>Best: <b id="cr-best">0</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1a1a2e;border-radius:8px;max-width:100%;touch-action:none;';
  wrap.appendChild(canvas);

  // D-pad
  const controls = document.createElement('div');
  controls.style.cssText = 'display:grid;grid-template-columns:60px 60px 60px;grid-template-rows:50px 50px;gap:4px;margin-top:10px;';
  var ctrlDirs = [
    { label: '▲', dir: 'up', col: '2/3', row: '1/2' },
    { label: '◀', dir: 'left', col: '1/2', row: '2/3' },
    { label: '▼', dir: 'down', col: '2/3', row: '2/3' },
    { label: '▶', dir: 'right', col: '3/4', row: '2/3' }
  ];
  ctrlDirs.forEach(function (d) {
    var b = document.createElement('button');
    b.textContent = d.label;
    b.dataset.dir = d.dir;
    b.style.cssText = 'font-size:20px;border:none;border-radius:8px;background:#292524;color:#fff;cursor:pointer;grid-column:' + d.col + ';grid-row:' + d.row + ';';
    controls.appendChild(b);
  });
  wrap.appendChild(controls);

  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('cr-score');
  const bestEl = document.getElementById('cr-best');

  let best = parseInt(localStorage.getItem('crossy-best') || '0');
  bestEl.textContent = best;

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Lane types: 'safe' (grass), 'road' (cars), 'water' (logs)
  let playerX, playerY, score, running, gameOver, lanes, cameraY, maxRow, animId;

  function makeLane(row) {
    var type;
    if (row === 0) type = 'safe';
    else if (row % 4 === 0) type = 'safe';
    else type = Math.random() < 0.7 ? 'road' : 'water';

    var speed = (1 + Math.random() * 2) * (Math.random() < 0.5 ? 1 : -1);
    var obstacles = [];
    if (type === 'road') {
      var numCars = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < numCars; i++) {
        obstacles.push({ x: (W / numCars) * i + Math.random() * 40, w: 40 + Math.random() * 30 });
      }
    } else if (type === 'water') {
      var numLogs = 2 + Math.floor(Math.random() * 2);
      for (var i = 0; i < numLogs; i++) {
        obstacles.push({ x: (W / numLogs) * i + Math.random() * 30, w: 60 + Math.random() * 40 });
      }
    }

    return { row: row, type: type, speed: speed, obstacles: obstacles, color: type === 'safe' ? '#166534' : type === 'road' ? '#292524' : '#1e3a5f' };
  }

  function init() {
    playerX = W / 2; playerY = 0; score = 0; maxRow = 0;
    running = false; gameOver = false; cameraY = 0;
    scoreEl.textContent = '0';
    lanes = [];
    for (var i = -2; i < 20; i++) lanes.push(makeLane(i));
  }

  function movePlayer(dir) {
    if (gameOver) return;
    if (!running) { running = true; btn.textContent = 'Restart'; }
    if (dir === 'up') { playerY++; if (playerY > maxRow) { maxRow = playerY; score = maxRow; scoreEl.textContent = score; if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('crossy-best', best); } } }
    else if (dir === 'down') playerY = Math.max(0, playerY - 1);
    else if (dir === 'left') playerX = Math.max(PLAYER_SIZE / 2, playerX - LANE_H);
    else if (dir === 'right') playerX = Math.min(W - PLAYER_SIZE / 2, playerX + LANE_H);
  }

  function update() {
    if (!running || gameOver) return;

    // Camera follows player
    var targetCam = (playerY - 6) * LANE_H;
    cameraY += (targetCam - cameraY) * 0.1;

    // Ensure enough lanes
    while (lanes[lanes.length - 1].row < playerY + 15) {
      lanes.push(makeLane(lanes[lanes.length - 1].row + 1));
    }
    // Remove old lanes
    while (lanes.length > 30 && lanes[0].row < playerY - 10) lanes.shift();

    // Move obstacles
    lanes.forEach(function (lane) {
      lane.obstacles.forEach(function (obs) {
        obs.x += lane.speed;
        if (obs.x > W + obs.w) obs.x = -obs.w;
        if (obs.x + obs.w < -obs.w) obs.x = W;
      });
    });

    // Check collision
    var playerLane = lanes.find(function (l) { return l.row === playerY; });
    if (playerLane) {
      if (playerLane.type === 'road') {
        for (var i = 0; i < playerLane.obstacles.length; i++) {
          var obs = playerLane.obstacles[i];
          if (playerX + PLAYER_SIZE / 2 > obs.x && playerX - PLAYER_SIZE / 2 < obs.x + obs.w) {
            gameOver = true; running = false; btn.textContent = 'Try Again'; return;
          }
        }
      } else if (playerLane.type === 'water') {
        var onLog = false;
        for (var i = 0; i < playerLane.obstacles.length; i++) {
          var obs = playerLane.obstacles[i];
          if (playerX + PLAYER_SIZE / 2 > obs.x && playerX - PLAYER_SIZE / 2 < obs.x + obs.w) {
            onLog = true;
            playerX += playerLane.speed;
            break;
          }
        }
        if (!onLog) {
          gameOver = true; running = false; btn.textContent = 'Try Again'; return;
        }
      }
    }

    // Out of bounds
    if (playerX < 0 || playerX > W) {
      gameOver = true; running = false; btn.textContent = 'Try Again';
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw lanes
    lanes.forEach(function (lane) {
      var screenY = H - (lane.row * LANE_H - cameraY) - LANE_H;
      if (screenY < -LANE_H || screenY > H + LANE_H) return;

      ctx.fillStyle = lane.color;
      ctx.fillRect(0, screenY, W, LANE_H);

      // Lane markings for roads
      if (lane.type === 'road') {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(0, screenY); ctx.lineTo(W, screenY); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Obstacles
      lane.obstacles.forEach(function (obs) {
        if (lane.type === 'road') {
          ctx.fillStyle = ['#ef4444', '#3b82f6', '#f97316', '#8b5cf6'][Math.abs(Math.floor(obs.w)) % 4];
          ctx.beginPath();
          ctx.roundRect(obs.x, screenY + 6, obs.w, LANE_H - 12, 4);
          ctx.fill();
        } else if (lane.type === 'water') {
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.roundRect(obs.x, screenY + 8, obs.w, LANE_H - 16, 6);
          ctx.fill();
        }
      });
    });

    // Player (chicken)
    var pScreenY = H - (playerY * LANE_H - cameraY) - LANE_H;
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(playerX, pScreenY + LANE_H / 2, PLAYER_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(playerX + 4, pScreenY + LANE_H / 2 - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    // Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_SIZE / 2 - 2, pScreenY + LANE_H / 2);
    ctx.lineTo(playerX + PLAYER_SIZE / 2 + 5, pScreenY + LANE_H / 2 + 2);
    ctx.lineTo(playerX + PLAYER_SIZE / 2 - 2, pScreenY + LANE_H / 2 + 4);
    ctx.fill();

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
      ctx.fillText('Tap or press Start!', W / 2, H / 2 - 40);
    }
  }

  function loop() {
    update(); draw();
    animId = requestAnimationFrame(loop);
  }

  // Keyboard
  document.addEventListener('keydown', function (e) {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer('up'); break;
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer('down'); break;
      case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer('left'); break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer('right'); break;
    }
  });

  // Swipe
  var touchStartX, touchStartY;
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    if (touchStartX == null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { movePlayer('up'); return; }
    if (Math.abs(dx) > Math.abs(dy)) movePlayer(dx > 0 ? 'right' : 'left');
    else movePlayer(dy > 0 ? 'down' : 'up');
  });

  // D-pad
  controls.querySelectorAll('button').forEach(function (b) {
    function h(e) { e.preventDefault(); movePlayer(b.dataset.dir); }
    b.addEventListener('touchstart', h, { passive: false });
    b.addEventListener('mousedown', h);
  });

  btn.addEventListener('click', function () {
    init(); running = true; btn.textContent = 'Restart';
  });

  init(); draw(); loop();
};
