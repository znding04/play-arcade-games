/* ============================================================
   PAC-MAN (simplified)
   Eat dots, avoid ghosts on a grid-based maze.
   Touch/swipe and D-pad controls.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const CELL = 20, COLS = 19, ROWS = 21;
  const W = COLS * CELL, H = ROWS * CELL;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="pm-score">0</b></span><span>Best: <b id="pm-best">0</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#000;border-radius:8px;max-width:100%;touch-action:none;';
  wrap.appendChild(canvas);

  // D-pad
  const dpad = document.createElement('div');
  dpad.style.cssText = 'display:grid;grid-template-columns:50px 50px 50px;grid-template-rows:50px 50px;gap:4px;margin-top:10px;';
  var dirs = [
    { label: '▲', dir: 'up', col: '2/3', row: '1/2' },
    { label: '◀', dir: 'left', col: '1/2', row: '2/3' },
    { label: '▶', dir: 'right', col: '3/4', row: '2/3' },
    { label: '▼', dir: 'down', col: '2/3', row: '2/3' }
  ];
  dirs.forEach(function (d) {
    var b = document.createElement('button');
    b.textContent = d.label;
    b.dataset.dir = d.dir;
    b.style.cssText = 'font-size:20px;border:none;border-radius:8px;background:#292524;color:#fff;cursor:pointer;grid-column:' + d.col + ';grid-row:' + d.row + ';';
    dpad.appendChild(b);
  });
  wrap.appendChild(dpad);

  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('pm-score');
  const bestEl = document.getElementById('pm-best');

  let best = parseInt(localStorage.getItem('pacman-best') || '0');
  bestEl.textContent = best;

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Simple maze layout: 1=wall, 0=path, 2=dot
  var mazeTemplate = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  let maze, pacX, pacY, pacDir, nextDir, ghosts, score, running, gameOver, stepTimer;
  var STEP = 150;

  function init() {
    maze = mazeTemplate.map(function (row) {
      return row.map(function (c) { return c === 0 ? 2 : c; });
    });
    pacX = 9; pacY = 15; pacDir = { x: 0, y: 0 }; nextDir = { x: 0, y: 0 };
    score = 0; running = false; gameOver = false;
    scoreEl.textContent = '0';
    ghosts = [
      { x: 8, y: 9, color: '#ef4444', dx: 1, dy: 0 },
      { x: 9, y: 9, color: '#f472b6', dx: -1, dy: 0 },
      { x: 10, y: 9, color: '#38bdf8', dx: 0, dy: -1 },
      { x: 9, y: 8, color: '#fb923c', dx: 0, dy: 1 }
    ];
  }

  function canMove(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      // Tunnel
      if (y === 9 && (x < 0 || x >= COLS)) return true;
      return false;
    }
    return maze[y][x] !== 1;
  }

  function step() {
    if (!running || gameOver) return;

    // Try next direction first
    var nx = pacX + nextDir.x, ny = pacY + nextDir.y;
    if (canMove(nx, ny)) { pacDir = { x: nextDir.x, y: nextDir.y }; }
    nx = pacX + pacDir.x; ny = pacY + pacDir.y;

    if (canMove(nx, ny)) {
      pacX = nx; pacY = ny;
      // Tunnel wrap
      if (pacX < 0) pacX = COLS - 1;
      if (pacX >= COLS) pacX = 0;
      // Eat dot
      if (maze[pacY] && maze[pacY][pacX] === 2) {
        maze[pacY][pacX] = 0;
        score += 10;
        scoreEl.textContent = score;
        if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('pacman-best', best); }
      }
    }

    // Move ghosts
    ghosts.forEach(function (g) {
      var possibleDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      // Filter valid and non-reverse
      var valid = possibleDirs.filter(function (d) {
        if (d.x === -g.dx && d.y === -g.dy) return false;
        return canMove(g.x + d.x, g.y + d.y);
      });
      if (valid.length === 0) {
        valid = possibleDirs.filter(function (d) { return canMove(g.x + d.x, g.y + d.y); });
      }
      if (valid.length > 0) {
        // Bias toward pac-man
        valid.sort(function (a, b) {
          var da = Math.abs(g.x + a.x - pacX) + Math.abs(g.y + a.y - pacY);
          var db = Math.abs(g.x + b.x - pacX) + Math.abs(g.y + b.y - pacY);
          return da - db;
        });
        var chosen = Math.random() < 0.5 ? valid[0] : valid[Math.floor(Math.random() * valid.length)];
        g.dx = chosen.x; g.dy = chosen.y;
        g.x += g.dx; g.y += g.dy;
        if (g.x < 0) g.x = COLS - 1;
        if (g.x >= COLS) g.x = 0;
      }

      // Collision
      if (g.x === pacX && g.y === pacY) {
        gameOver = true; running = false; btn.textContent = 'Try Again';
      }
    });

    // Win check
    var dotsLeft = 0;
    maze.forEach(function (row) { row.forEach(function (c) { if (c === 2) dotsLeft++; }); });
    if (dotsLeft === 0 && !gameOver) {
      gameOver = true; running = false; btn.textContent = 'Play Again';
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Maze
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (maze[r][c] === 1) {
          ctx.fillStyle = '#1e3a5f';
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        } else if (maze[r][c] === 2) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Pac-Man
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    var angle = 0;
    if (pacDir.x === 1) angle = 0;
    else if (pacDir.x === -1) angle = Math.PI;
    else if (pacDir.y === -1) angle = -Math.PI / 2;
    else if (pacDir.y === 1) angle = Math.PI / 2;
    ctx.arc(pacX * CELL + CELL / 2, pacY * CELL + CELL / 2, CELL / 2 - 2, angle + 0.3, angle + Math.PI * 2 - 0.3);
    ctx.lineTo(pacX * CELL + CELL / 2, pacY * CELL + CELL / 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ghosts
    ghosts.forEach(function (g) {
      ctx.fillStyle = g.color;
      ctx.beginPath();
      var gx = g.x * CELL + CELL / 2, gy = g.y * CELL + CELL / 2;
      ctx.arc(gx, gy - 2, CELL / 2 - 2, Math.PI, 0);
      ctx.lineTo(gx + CELL / 2 - 2, gy + CELL / 2 - 2);
      // Wavy bottom
      ctx.lineTo(gx + CELL / 4, gy + CELL / 4);
      ctx.lineTo(gx, gy + CELL / 2 - 2);
      ctx.lineTo(gx - CELL / 4, gy + CELL / 4);
      ctx.lineTo(gx - CELL / 2 + 2, gy + CELL / 2 - 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(gx - 4, gy - 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 4, gy - 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(gx - 3, gy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 5, gy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(10,10,15,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c084fc'; ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
      ctx.font = '700 24px Courier New, monospace'; ctx.textAlign = 'center';
      var dotsLeft = 0;
      maze.forEach(function (row) { row.forEach(function (c) { if (c === 2) dotsLeft++; }); });
      ctx.fillText(dotsLeft === 0 ? 'YOU WIN!' : 'GAME OVER', W / 2, H / 2 - 10);
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

  function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Controls
  function setDir(d) {
    if (d === 'up') nextDir = { x: 0, y: -1 };
    if (d === 'down') nextDir = { x: 0, y: 1 };
    if (d === 'left') nextDir = { x: -1, y: 0 };
    if (d === 'right') nextDir = { x: 1, y: 0 };
  }

  document.addEventListener('keydown', function (e) {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': setDir('up'); e.preventDefault(); break;
      case 'ArrowDown': case 's': case 'S': setDir('down'); e.preventDefault(); break;
      case 'ArrowLeft': case 'a': case 'A': setDir('left'); e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D': setDir('right'); e.preventDefault(); break;
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
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
    else setDir(dy > 0 ? 'down' : 'up');
  });

  // D-pad buttons
  dpad.querySelectorAll('button').forEach(function (b) {
    function h(e) { e.preventDefault(); setDir(b.dataset.dir); }
    b.addEventListener('touchstart', h, { passive: false });
    b.addEventListener('mousedown', h);
  });

  btn.addEventListener('click', function () {
    clearInterval(stepTimer);
    init(); running = true; btn.textContent = 'Restart';
    stepTimer = setInterval(step, STEP);
  });

  init(); draw(); gameLoop();
};
