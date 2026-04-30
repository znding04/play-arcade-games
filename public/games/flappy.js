/* ============================================================
   FLAPPY BIRD
   Tap-to-flap bird avoiding pipes. One-touch mechanic.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const W = 320, H = 480;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="fl-score">0</b></span><span>Best: <b id="fl-best">0</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:linear-gradient(180deg,#1a1a2e,#16213e);border-radius:8px;max-width:100%;touch-action:none;cursor:pointer;';
  wrap.appendChild(canvas);

  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('fl-score');
  const bestEl = document.getElementById('fl-best');

  let best = parseInt(localStorage.getItem('flappy-best') || '0');
  bestEl.textContent = best;

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const GRAVITY = 0.4, FLAP = -7, PIPE_W = 50, GAP = 130, PIPE_SPEED = 2.5;
  const BIRD_SIZE = 18;

  let birdY, birdVel, pipes, score, running, gameOver, animId, frameCount;

  function init() {
    birdY = H / 2; birdVel = 0;
    pipes = []; score = 0; frameCount = 0;
    running = false; gameOver = false;
    scoreEl.textContent = '0';
  }

  function flap() {
    if (gameOver) return;
    if (!running) { running = true; btn.textContent = 'Restart'; }
    birdVel = FLAP;
  }

  function update() {
    if (!running || gameOver) return;
    frameCount++;

    birdVel += GRAVITY;
    birdY += birdVel;

    // Spawn pipes
    if (frameCount % 90 === 0) {
      var topH = 60 + Math.random() * (H - GAP - 120);
      pipes.push({ x: W, topH: topH, scored: false });
    }

    // Move pipes
    for (var i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;
      // Score
      if (!pipes[i].scored && pipes[i].x + PIPE_W < 50) {
        pipes[i].scored = true;
        score++;
        scoreEl.textContent = score;
        if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('flappy-best', best); }
      }
      if (pipes[i].x + PIPE_W < 0) pipes.splice(i, 1);
    }

    // Collision
    var birdX = 50;
    if (birdY < 0 || birdY + BIRD_SIZE > H) { endGame(); return; }
    for (var j = 0; j < pipes.length; j++) {
      var p = pipes[j];
      if (birdX + BIRD_SIZE > p.x && birdX < p.x + PIPE_W) {
        if (birdY < p.topH || birdY + BIRD_SIZE > p.topH + GAP) { endGame(); return; }
      }
    }
  }

  function endGame() {
    gameOver = true; running = false;
    btn.textContent = 'Try Again';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Pipes
    pipes.forEach(function (p) {
      ctx.fillStyle = '#22c55e';
      ctx.shadowBlur = 6; ctx.shadowColor = '#22c55e';
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      ctx.fillRect(p.x - 4, p.topH - 20, PIPE_W + 8, 20);
      // Bottom pipe
      var bottomY = p.topH + GAP;
      ctx.fillRect(p.x, bottomY, PIPE_W, H - bottomY);
      ctx.fillRect(p.x - 4, bottomY, PIPE_W + 8, 20);
      ctx.shadowBlur = 0;
    });

    // Bird
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 12; ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(50 + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(50 + BIRD_SIZE / 2 + 4, birdY + BIRD_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(50 + BIRD_SIZE, birdY + BIRD_SIZE / 2);
    ctx.lineTo(50 + BIRD_SIZE + 8, birdY + BIRD_SIZE / 2 + 2);
    ctx.lineTo(50 + BIRD_SIZE, birdY + BIRD_SIZE / 2 + 5);
    ctx.fill();

    // Ground line
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();

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
      ctx.fillText('Tap or Click to Flap!', W / 2, H / 2 + 60);
    }
  }

  function loop() {
    update(); draw();
    animId = requestAnimationFrame(loop);
  }

  // Controls
  canvas.addEventListener('click', flap);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); flap(); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); }
  });

  btn.addEventListener('click', function () {
    init(); running = true; btn.textContent = 'Restart';
  });

  init(); draw(); loop();
};
