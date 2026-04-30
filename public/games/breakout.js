/* ============================================================
   BREAKOUT
   Classic brick-breaking game with paddle, ball, and bricks.
   Touch/mouse controls for paddle movement.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const W = 400, H = 500;

  // Build UI
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="bo-score">0</b></span><span>Best: <b id="bo-best">0</b></span><span>Lives: <b id="bo-lives">3</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;';
  wrap.appendChild(canvas);

  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('bo-score');
  const bestEl = document.getElementById('bo-best');
  const livesEl = document.getElementById('bo-lives');

  let best = parseInt(localStorage.getItem('breakout-best') || '0');
  bestEl.textContent = best;

  // Responsive
  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const BRICK_ROWS = 5, BRICK_COLS = 8;
  const BRICK_W = (W - 20) / BRICK_COLS, BRICK_H = 18, BRICK_PAD = 2;
  const PADDLE_W = 70, PADDLE_H = 12;
  const BALL_R = 6;

  let paddleX, ballX, ballY, ballDX, ballDY;
  let bricks, score, lives, running, gameOver, animId;

  function init() {
    paddleX = W / 2 - PADDLE_W / 2;
    ballX = W / 2; ballY = H - 50;
    ballDX = 3 * (Math.random() > 0.5 ? 1 : -1);
    ballDY = -3.5;
    score = 0; lives = 3; running = false; gameOver = false;
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    bricks = [];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({ x: 10 + c * BRICK_W, y: 40 + r * (BRICK_H + BRICK_PAD), w: BRICK_W - BRICK_PAD, h: BRICK_H, color: colors[r], alive: true });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Bricks
    bricks.forEach(function (b) {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      ctx.fill();
    });

    // Paddle
    ctx.fillStyle = '#a78bfa';
    ctx.shadowBlur = 10; ctx.shadowColor = '#a78bfa';
    ctx.beginPath();
    ctx.roundRect(paddleX, H - 30, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#f9a8d4';
    ctx.shadowBlur = 12; ctx.shadowColor = '#f9a8d4';
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = 'rgba(10,10,15,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c084fc'; ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
      ctx.font = '700 24px Courier New, monospace'; ctx.textAlign = 'center';
      ctx.fillText(bricks.every(function (b) { return !b.alive; }) ? 'YOU WIN!' : 'GAME OVER', W / 2, H / 2 - 10);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '500 14px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 18);
    }

    if (!running && !gameOver) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '600 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Press Start to Play', W / 2, H / 2 + 60);
    }
  }

  function update() {
    if (!running || gameOver) return;

    ballX += ballDX; ballY += ballDY;

    // Wall bounce
    if (ballX - BALL_R <= 0 || ballX + BALL_R >= W) ballDX = -ballDX;
    if (ballY - BALL_R <= 0) ballDY = -ballDY;

    // Paddle bounce
    if (ballY + BALL_R >= H - 30 && ballY + BALL_R <= H - 18 && ballX >= paddleX && ballX <= paddleX + PADDLE_W) {
      ballDY = -Math.abs(ballDY);
      var hit = (ballX - paddleX) / PADDLE_W - 0.5;
      ballDX = hit * 6;
    }

    // Bottom
    if (ballY > H) {
      lives--;
      livesEl.textContent = lives;
      if (lives <= 0) { gameOver = true; running = false; btn.textContent = 'Try Again'; }
      else { ballX = W / 2; ballY = H - 50; ballDX = 3 * (Math.random() > 0.5 ? 1 : -1); ballDY = -3.5; }
    }

    // Brick collision
    bricks.forEach(function (b) {
      if (!b.alive) return;
      if (ballX + BALL_R > b.x && ballX - BALL_R < b.x + b.w && ballY + BALL_R > b.y && ballY - BALL_R < b.y + b.h) {
        b.alive = false;
        ballDY = -ballDY;
        score++;
        scoreEl.textContent = score;
        if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('breakout-best', best); }
      }
    });

    // Win
    if (bricks.every(function (b) { return !b.alive; })) {
      gameOver = true; running = false; btn.textContent = 'Play Again';
    }
  }

  function loop() {
    update(); draw();
    animId = requestAnimationFrame(loop);
  }

  // Controls
  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, (e.clientX - rect.left) * scaleX - PADDLE_W / 2));
  });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, (e.touches[0].clientX - rect.left) * scaleX - PADDLE_W / 2));
  }, { passive: false });

  btn.addEventListener('click', function () {
    init(); running = true; btn.textContent = 'Restart';
  });

  init(); draw(); loop();
};
