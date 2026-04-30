/* ============================================================
   MINESWEEPER
   Classic puzzle: reveal cells, avoid mines, flag suspects.
   Canvas-based with touch support (tap=reveal, long-press=flag).
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const COLS = 10, ROWS = 10, MINES = 12;
  const CELL = 36;
  const W = COLS * CELL, H = ROWS * CELL;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:20px;margin-bottom:8px;font-size:14px;align-items:center;';
  info.innerHTML = '<span>Mines: <b id="ms-mines">12</b></span><span>Time: <b id="ms-time">0</b>s</span><span>Best: <b id="ms-best">-</b></span>';

  const flagToggle = document.createElement('button');
  flagToggle.textContent = '🚩 Flag Mode: OFF';
  flagToggle.style.cssText = 'padding:6px 14px;font-size:13px;font-weight:600;border:none;border-radius:6px;background:#292524;color:#fff;cursor:pointer;margin-left:8px;';
  info.appendChild(flagToggle);
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;cursor:pointer;';
  wrap.appendChild(canvas);

  const hint = document.createElement('p');
  hint.textContent = 'Tap to reveal. Toggle Flag Mode or long-press to flag.';
  hint.style.cssText = 'font-size:12px;color:#78716c;margin-top:6px;text-align:center;';
  wrap.appendChild(hint);

  const btn = document.createElement('button');
  btn.textContent = 'New Game';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const minesEl = document.getElementById('ms-mines');
  const timeEl = document.getElementById('ms-time');
  const bestEl = document.getElementById('ms-best');

  let bestTime = localStorage.getItem('minesweeper-best');
  bestEl.textContent = bestTime ? bestTime + 's' : '-';

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  let grid, revealed, flagged, gameOver, won, flagMode, timer, elapsed, firstClick;

  function init() {
    grid = []; revealed = []; flagged = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = []; revealed[r] = []; flagged[r] = [];
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = 0; revealed[r][c] = false; flagged[r][c] = false;
      }
    }
    gameOver = false; won = false; flagMode = false;
    flagToggle.textContent = '🚩 Flag Mode: OFF';
    elapsed = 0; firstClick = true;
    clearInterval(timer);
    timeEl.textContent = '0';
    minesEl.textContent = MINES;
  }

  function placeMines(safeR, safeC) {
    var placed = 0;
    while (placed < MINES) {
      var r = Math.floor(Math.random() * ROWS);
      var c = Math.floor(Math.random() * COLS);
      if (grid[r][c] === -1) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      grid[r][c] = -1; placed++;
    }
    // Count neighbors
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        if (grid[rr][cc] === -1) continue;
        var count = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            var nr = rr + dr, nc = cc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === -1) count++;
          }
        }
        grid[rr][cc] = count;
      }
    }
  }

  function reveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (grid[r][c] === 0) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          reveal(r + dr, c + dc);
        }
      }
    }
  }

  function checkWin() {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] !== -1 && !revealed[r][c]) return false;
      }
    }
    return true;
  }

  var numColors = ['', '#3b82f6', '#22c55e', '#ef4444', '#7c3aed', '#b91c1c', '#06b6d4', '#000', '#78716c'];

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = c * CELL, y = r * CELL;

        if (revealed[r][c]) {
          ctx.fillStyle = '#292524';
          ctx.fillRect(x, y, CELL - 1, CELL - 1);

          if (grid[r][c] === -1) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, CELL / 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (grid[r][c] > 0) {
            ctx.fillStyle = numColors[grid[r][c]];
            ctx.font = '700 18px Courier New, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(grid[r][c], x + CELL / 2, y + CELL / 2);
          }
        } else {
          ctx.fillStyle = '#44403c';
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, CELL - 3, CELL - 3, 3);
          ctx.fill();

          if (flagged[r][c]) {
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🚩', x + CELL / 2, y + CELL / 2);
          }
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
    }
    for (var j = 0; j <= ROWS; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(W, j * CELL); ctx.stroke();
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(10,10,15,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = won ? '#22c55e' : '#ef4444';
      ctx.shadowBlur = 16; ctx.shadowColor = ctx.fillStyle;
      ctx.font = '700 24px Courier New, monospace'; ctx.textAlign = 'center';
      ctx.fillText(won ? 'YOU WIN!' : 'BOOM!', W / 2, H / 2 - 10);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '500 14px sans-serif';
      ctx.fillText('Time: ' + elapsed + 's', W / 2, H / 2 + 18);
    }
  }

  function handleClick(px, py, isFlag) {
    if (gameOver) return;
    var c = Math.floor(px / CELL), r = Math.floor(py / CELL);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

    if (isFlag || flagMode) {
      if (!revealed[r][c]) {
        flagged[r][c] = !flagged[r][c];
        var flagCount = 0;
        flagged.forEach(function (row) { row.forEach(function (f) { if (f) flagCount++; }); });
        minesEl.textContent = MINES - flagCount;
      }
      draw(); return;
    }

    if (flagged[r][c]) { draw(); return; }

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      timer = setInterval(function () { elapsed++; timeEl.textContent = elapsed; }, 1000);
    }

    if (grid[r][c] === -1) {
      // Reveal all mines
      for (var rr = 0; rr < ROWS; rr++) for (var cc = 0; cc < COLS; cc++) if (grid[rr][cc] === -1) revealed[rr][cc] = true;
      gameOver = true; won = false; clearInterval(timer);
      draw(); return;
    }

    reveal(r, c);

    if (checkWin()) {
      gameOver = true; won = true; clearInterval(timer);
      if (!bestTime || elapsed < parseInt(bestTime)) {
        bestTime = elapsed;
        bestEl.textContent = bestTime + 's';
        localStorage.setItem('minesweeper-best', bestTime);
      }
    }

    draw();
  }

  // Click
  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    handleClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY, false);
  });

  // Right click = flag
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    handleClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY, true);
  });

  // Touch: tap = reveal, long press = flag
  var touchTimer = null, touchHandled = false;
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    touchHandled = false;
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    var px = (e.touches[0].clientX - rect.left) * scaleX;
    var py = (e.touches[0].clientY - rect.top) * scaleY;
    touchTimer = setTimeout(function () {
      touchHandled = true;
      handleClick(px, py, true);
    }, 500);
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    clearTimeout(touchTimer);
    if (touchHandled) return;
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    handleClick((e.changedTouches[0].clientX - rect.left) * scaleX, (e.changedTouches[0].clientY - rect.top) * scaleY, false);
  });

  flagToggle.addEventListener('click', function () {
    flagMode = !flagMode;
    flagToggle.textContent = '🚩 Flag Mode: ' + (flagMode ? 'ON' : 'OFF');
    flagToggle.style.background = flagMode ? '#7c3aed' : '#292524';
  });

  btn.addEventListener('click', function () { init(); draw(); });

  init(); draw();
};
