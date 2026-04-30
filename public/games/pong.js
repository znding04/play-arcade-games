/* ============================================================
   PONG
   Two-paddle game with AI opponent, particle effects, and
   progressive ball speed. Canvas resolution is fixed at 760x400;
   CSS scales it responsively.
   ============================================================ */
window.initGame = function (container) {
    container.innerHTML = '';
    const W = 760, H = 400;

    // --- Build UI ---
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

    const info = document.createElement('div');
    info.style.cssText = 'display:flex;gap:48px;margin-bottom:8px;font-size:18px;font-weight:600;';
    info.innerHTML = '<span>Player: <b id="pong-score-l">0</b></span><span>AI: <b id="pong-score-r">0</b></span>';
    wrap.appendChild(info);

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;';
    wrap.appendChild(canvas);

    const btn = document.createElement('button');
    btn.textContent = 'Start';
    btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
    wrap.appendChild(btn);

    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:8px;font-size:12px;color:#a8a29e;';
    hint.textContent = 'W/S to move · Space to pause';
    wrap.appendChild(hint);

    container.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    const scoreLeftEl = wrap.querySelector('#pong-score-l');
    const scoreRightEl = wrap.querySelector('#pong-score-r');

    // --- Responsive sizing ---
    function resizeCanvas() {
        const maxW = container.clientWidth - 48;
        const aspect = W / H;
        const w = Math.min(W, maxW);
        canvas.style.width = w + 'px';
        canvas.style.height = (w / aspect) + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- Constants ---
    const PADDLE_W = 12, PADDLE_H = 80, PADDLE_SPEED = 6, BALL_R = 8;
    const COL_PADDLE_L = '#667eea';
    const COL_PADDLE_R = '#764ba2';
    const COL_BALL = '#c084fc';
    const COL_NET = 'rgba(255, 255, 255, 0.06)';

    // --- State ---
    let running = false, paused = false;
    let scoreL = 0, scoreR = 0;
    const left = { x: 20, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, dy: 0 };
    const right = { x: W - 20 - PADDLE_W, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, dy: 0 };
    let ball = { x: W / 2, y: H / 2, dx: 4.5, dy: 3, speed: 4.5 };
    let particles = [];
    let rafId;

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            particles.push({ x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 1, decay: Math.random() * 0.03 + 0.02, color, r: Math.random() * 3 + 1 });
        }
    }
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.dx; p.y += p.dy; p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }
    function drawParticles() {
        for (const p of particles) {
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    let aiReact = 0;
    function updateAI() {
        aiReact++;
        if (aiReact % 3 !== 0) return;
        const center = right.y + right.h / 2;
        const target = ball.y + (Math.random() - 0.5) * 20;
        const diff = target - center;
        right.dy = Math.abs(diff) > 4 ? (diff > 0 ? 1 : -1) * PADDLE_SPEED * 0.85 : 0;
    }

    function resetBall(dir) {
        ball.x = W / 2; ball.y = H / 2; ball.speed = 4.5;
        const angle = (Math.random() - 0.5) * Math.PI / 3;
        ball.dx = Math.cos(angle) * ball.speed * dir;
        ball.dy = Math.sin(angle) * ball.speed;
    }

    function drawGlowRect(x, y, w, h, color) {
        ctx.shadowBlur = 18; ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
        ctx.shadowBlur = 0;
    }
    function drawNet() {
        ctx.fillStyle = COL_NET;
        for (let y = 8; y < H; y += 20) ctx.fillRect(W / 2 - 1, y, 2, 10);
    }
    function drawBall() {
        ctx.shadowBlur = 22; ctx.shadowColor = COL_BALL;
        ctx.fillStyle = COL_BALL;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
    function drawMessage(msg) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '600 18px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(msg, W / 2, H / 2);
    }

    function update() {
        left.y = Math.max(0, Math.min(H - PADDLE_H, left.y + left.dy));
        right.y = Math.max(0, Math.min(H - PADDLE_H, right.y + right.dy));
        updateAI();
        spawnParticles(ball.x, ball.y, COL_BALL, 1);
        ball.x += ball.dx; ball.y += ball.dy;

        if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }
        if (ball.y + BALL_R >= H) { ball.y = H - BALL_R; ball.dy = -Math.abs(ball.dy); }

        // Paddle bounce: pure reflection — flip dx, keep dy unchanged.
        // Apply a small uniform speed-up to both components so direction is preserved.
        if (ball.dx < 0 && ball.x - BALL_R <= left.x + left.w && ball.x - BALL_R >= left.x && ball.y >= left.y && ball.y <= left.y + left.h) {
            ball.dx = Math.abs(ball.dx);
            ball.speed = Math.min(ball.speed + 0.15, 9);
            const mag = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) || 1;
            const k = ball.speed / mag;
            ball.dx *= k; ball.dy *= k;
            spawnParticles(left.x + left.w, ball.y, COL_PADDLE_L, 12);
        }
        if (ball.dx > 0 && ball.x + BALL_R >= right.x && ball.x + BALL_R <= right.x + right.w && ball.y >= right.y && ball.y <= right.y + right.h) {
            ball.dx = -Math.abs(ball.dx);
            ball.speed = Math.min(ball.speed + 0.15, 9);
            const mag = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) || 1;
            const k = ball.speed / mag;
            ball.dx *= k; ball.dy *= k;
            spawnParticles(right.x, ball.y, COL_PADDLE_R, 12);
        }

        if (ball.x < -BALL_R) { scoreR++; scoreRightEl.textContent = scoreR; spawnParticles(0, ball.y, COL_PADDLE_R, 30); resetBall(1); }
        if (ball.x > W + BALL_R) { scoreL++; scoreLeftEl.textContent = scoreL; spawnParticles(W, ball.y, COL_PADDLE_L, 30); resetBall(-1); }

        updateParticles();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        drawNet();
        drawParticles();
        drawGlowRect(left.x, left.y, left.w, left.h, COL_PADDLE_L);
        drawGlowRect(right.x, right.y, right.w, right.h, COL_PADDLE_R);
        drawBall();
        if (paused) drawMessage('PAUSED');
    }

    function drawIdle() {
        ctx.clearRect(0, 0, W, H);
        drawNet();
        drawGlowRect(left.x, H / 2 - PADDLE_H / 2, left.w, left.h, COL_PADDLE_L);
        drawGlowRect(right.x, H / 2 - PADDLE_H / 2, right.w, right.h, COL_PADDLE_R);
        ctx.shadowBlur = 22; ctx.shadowColor = COL_BALL;
        ctx.fillStyle = COL_BALL;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        drawMessage('Press Start to Play');
    }

    function loop() {
        if (!running) return;
        if (!paused) update();
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function startGame() {
        scoreL = 0; scoreR = 0;
        scoreLeftEl.textContent = '0'; scoreRightEl.textContent = '0';
        left.y = H / 2 - PADDLE_H / 2;
        right.y = H / 2 - PADDLE_H / 2;
        particles = []; paused = false;
        resetBall(1);
        running = true;
        btn.textContent = 'Restart';
        cancelAnimationFrame(rafId);
        loop();
    }

    btn.addEventListener('click', startGame);

    // --- Keyboard ---
    const keys = {};
    function onKeyDown(e) {
        keys[e.key] = true;
        if (e.key === ' ' && running) { e.preventDefault(); paused = !paused; }
        updateKeysMovement();
    }
    function onKeyUp(e) {
        keys[e.key] = false;
        updateKeysMovement();
    }
    function updateKeysMovement() {
        left.dy = 0;
        if (keys['w'] || keys['W']) left.dy = -PADDLE_SPEED;
        if (keys['s'] || keys['S']) left.dy = PADDLE_SPEED;
        if (keys['ArrowUp'] || keys['ArrowDown']) {
            right.dy = 0;
            if (keys['ArrowUp']) right.dy = -PADDLE_SPEED;
            if (keys['ArrowDown']) right.dy = PADDLE_SPEED;
        }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // --- Touch: drag on canvas to move left paddle ---
    function onTouchMove(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleY = H / rect.height;
        const y = (e.touches[0].clientY - rect.top) * scaleY;
        left.y = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
    }
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    drawIdle();

    window.__gameCleanup = function () {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('touchmove', onTouchMove);
    };
};
