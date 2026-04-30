/* ============================================================
   TIC-TAC-TOE
   Play vs AI (minimax). Canvas-based with touch support.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const SIZE = 360, CELL = SIZE / 3;
  const W = SIZE, H = SIZE;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:20px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>You (X): <b id="tt-xwins">0</b></span><span>AI (O): <b id="tt-owins">0</b></span><span>Draw: <b id="tt-draws">0</b></span>';
  wrap.appendChild(info);

  const status = document.createElement('div');
  status.id = 'tt-status';
  status.style.cssText = 'margin-bottom:8px;font-size:16px;font-weight:600;color:#a78bfa;';
  status.textContent = 'Your turn (X)';
  wrap.appendChild(status);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;cursor:pointer;';
  wrap.appendChild(canvas);

  const btn = document.createElement('button');
  btn.textContent = 'New Game';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('tt-status');
  const xWinsEl = document.getElementById('tt-xwins');
  const oWinsEl = document.getElementById('tt-owins');
  const drawsEl = document.getElementById('tt-draws');

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  let board, currentPlayer, gameOver, xWins, oWins, draws, winLine;
  xWins = parseInt(localStorage.getItem('ttt-x') || '0');
  oWins = parseInt(localStorage.getItem('ttt-o') || '0');
  draws = parseInt(localStorage.getItem('ttt-d') || '0');
  xWinsEl.textContent = xWins;
  oWinsEl.textContent = oWins;
  drawsEl.textContent = draws;

  function init() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X'; gameOver = false; winLine = null;
    statusEl.textContent = 'Your turn (X)';
  }

  var lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function checkWinner(b) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { winner: b[l[0]], line: l };
    }
    return b.indexOf('') === -1 ? { winner: 'draw', line: null } : null;
  }

  function minimax(b, player, depth) {
    var result = checkWinner(b);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      return 0;
    }
    if (player === 'O') {
      var bestScore = -Infinity;
      for (var i = 0; i < 9; i++) {
        if (b[i] !== '') continue;
        b[i] = 'O';
        bestScore = Math.max(bestScore, minimax(b, 'X', depth + 1));
        b[i] = '';
      }
      return bestScore;
    } else {
      var bestScore = Infinity;
      for (var i = 0; i < 9; i++) {
        if (b[i] !== '') continue;
        b[i] = 'X';
        bestScore = Math.min(bestScore, minimax(b, 'O', depth + 1));
        b[i] = '';
      }
      return bestScore;
    }
  }

  function aiMove() {
    var bestScore = -Infinity, bestIdx = -1;
    for (var i = 0; i < 9; i++) {
      if (board[i] !== '') continue;
      board[i] = 'O';
      var s = minimax(board, 'X', 0);
      board[i] = '';
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      board[bestIdx] = 'O';
      var result = checkWinner(board);
      if (result) {
        gameOver = true;
        winLine = result.line;
        if (result.winner === 'O') {
          oWins++; oWinsEl.textContent = oWins; localStorage.setItem('ttt-o', oWins);
          statusEl.textContent = 'AI wins!';
        } else {
          draws++; drawsEl.textContent = draws; localStorage.setItem('ttt-d', draws);
          statusEl.textContent = 'Draw!';
        }
      } else {
        currentPlayer = 'X';
        statusEl.textContent = 'Your turn (X)';
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 3;
    for (var i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 10); ctx.lineTo(i * CELL, H - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, i * CELL); ctx.lineTo(W - 10, i * CELL); ctx.stroke();
    }

    // Marks
    for (var i = 0; i < 9; i++) {
      var r = Math.floor(i / 3), c = i % 3;
      var cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;

      if (board[i] === 'X') {
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 5;
        ctx.shadowBlur = 8; ctx.shadowColor = '#60a5fa';
        var off = CELL * 0.28;
        ctx.beginPath(); ctx.moveTo(cx - off, cy - off); ctx.lineTo(cx + off, cy + off); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + off, cy - off); ctx.lineTo(cx - off, cy + off); ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (board[i] === 'O') {
        ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 5;
        ctx.shadowBlur = 8; ctx.shadowColor = '#f472b6';
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.28, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Win line
    if (winLine) {
      var s = winLine[0], e = winLine[2];
      var sr = Math.floor(s / 3), sc = s % 3;
      var er = Math.floor(e / 3), ec = e % 3;
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 6;
      ctx.shadowBlur = 12; ctx.shadowColor = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(sc * CELL + CELL / 2, sr * CELL + CELL / 2);
      ctx.lineTo(ec * CELL + CELL / 2, er * CELL + CELL / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function handleClick(px, py) {
    if (gameOver || currentPlayer !== 'X') return;
    var c = Math.floor(px / CELL), r = Math.floor(py / CELL);
    if (c < 0 || c > 2 || r < 0 || r > 2) return;
    var idx = r * 3 + c;
    if (board[idx] !== '') return;

    board[idx] = 'X';
    var result = checkWinner(board);
    if (result) {
      gameOver = true;
      winLine = result.line;
      if (result.winner === 'X') {
        xWins++; xWinsEl.textContent = xWins; localStorage.setItem('ttt-x', xWins);
        statusEl.textContent = 'You win!';
      } else {
        draws++; drawsEl.textContent = draws; localStorage.setItem('ttt-d', draws);
        statusEl.textContent = 'Draw!';
      }
      draw(); return;
    }

    currentPlayer = 'O';
    statusEl.textContent = 'AI thinking...';
    draw();
    setTimeout(aiMove, 300);
  }

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    handleClick((e.clientX - rect.left) * W / rect.width, (e.clientY - rect.top) * H / rect.height);
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    handleClick((e.touches[0].clientX - rect.left) * W / rect.width, (e.touches[0].clientY - rect.top) * H / rect.height);
  }, { passive: false });

  btn.addEventListener('click', function () { init(); draw(); });

  init(); draw();
};
