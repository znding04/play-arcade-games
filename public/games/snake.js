/* ============================================================
   SNAKE
   Grid-based snake with gradient body, glow on head/food, and
   wall/self collision. Runs at 110ms per step.
   ============================================================ */
window.initGame = function (container) {
    container.innerHTML = '';
    const SIZE = 400, CELL = 20;
    const COLS = SIZE / CELL, ROWS = SIZE / CELL;
    const SPEED = 110;

    // --- Build UI ---
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

    const info = document.createElement('div');
    info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
    info.innerHTML = '<span>Score: <b id="snake-score">0</b></span><span>Best: <b id="snake-best">0</b></span>';
    wrap.appendChild(info);

    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;';
    wrap.appendChild(canvas);

    const btn = document.createElement('button');
    btn.textContent = 'Start';
    btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
    wrap.appendChild(btn);

    // D-pad
    const dpad = document.createElement('div');
    dpad.style.cssText = 'margin-top:14px;display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:6px;';
    const dpadHTML = [
        ['', 'up', ''],
        ['left', '', 'right'],
        ['', 'down', '']
    ];
    dpadHTML.forEach(function (row, ri) {
        row.forEach(function (d, ci) {
            const cell = document.createElement('div');
            if (!d) { dpad.appendChild(cell); return; }
            const b = document.createElement('button');
            b.dataset.snake = d;
            b.textContent = { up: '▲', down: '▼', left: '◀', right: '▶' }[d];
            b.style.cssText = 'width:100%;height:100%;border:none;border-radius:8px;background:#3f3f46;color:#fff;font-size:18px;cursor:pointer;touch-action:none;';
            dpad.appendChild(b);
        });
    });
    wrap.appendChild(dpad);

    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:8px;font-size:12px;color:#a8a29e;';
    hint.textContent = 'Arrows / WASD · Space to pause';
    wrap.appendChild(hint);

    container.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('#snake-score');
    const bestEl = wrap.querySelector('#snake-best');

    function resizeCanvas() {
        const maxW = container.clientWidth - 48;
        const w = Math.min(SIZE, maxW);
        canvas.style.width = w + 'px';
        canvas.style.height = w + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let snake, dir, nextDir, food, score, best = parseInt(localStorage.getItem('snake-best') || '0');
    bestEl.textContent = best;
    let running = false, paused = false, gameOver = false;
    let intervalId;

    function init() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        gameOver = false;
        paused = false;
        scoreEl.textContent = '0';
        placeFood();
    }

    function placeFood() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (snake.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
        food = pos;
    }

    function step() {
        if (paused || gameOver) return;
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(); return; }
        if (snake.some(function (s) { return s.x === head.x && s.y === head.y; })) { endGame(); return; }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreEl.textContent = score;
            if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('snake-best', best); }
            placeFood();
        } else {
            snake.pop();
        }
        draw();
    }

    function endGame() {
        gameOver = true;
        running = false;
        clearInterval(intervalId);
        btn.textContent = 'Try Again';
        draw();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke(); }
        for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke(); }
    }

    function draw() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        drawGrid();

        ctx.shadowBlur = 14; ctx.shadowColor = '#c084fc';
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let i = 0; i < snake.length; i++) {
            const s = snake[i];
            const t = i / snake.length;
            const r = Math.round(102 + (118 - 102) * t);
            const g = Math.round(126 + (75 - 126) * t);
            const b = Math.round(234 + (162 - 234) * t);
            if (i === 0) { ctx.shadowBlur = 12; ctx.shadowColor = '#667eea'; }
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.beginPath();
            ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        if (paused) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '600 18px -apple-system,BlinkMacSystemFont,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', SIZE / 2, SIZE / 2);
        }
        if (gameOver) {
            ctx.fillStyle = 'rgba(10,10,15,0.6)';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.fillStyle = '#c084fc';
            ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
            ctx.font = '700 24px Courier New, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', SIZE / 2, SIZE / 2 - 10);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '500 14px -apple-system,BlinkMacSystemFont,sans-serif';
            ctx.fillText('Score: ' + score, SIZE / 2, SIZE / 2 + 18);
        }
    }

    function drawIdle() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        drawGrid();
        const demo = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
        for (let i = 0; i < demo.length; i++) {
            ctx.fillStyle = i === 0 ? '#667eea' : '#764ba2';
            ctx.beginPath();
            ctx.roundRect(demo[i].x * CELL + 1, demo[i].y * CELL + 1, CELL - 2, CELL - 2, 4);
            ctx.fill();
        }
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(14 * CELL + CELL / 2, 10 * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '600 18px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press Start to Play', SIZE / 2, SIZE / 2 + 60);
    }

    btn.addEventListener('click', function () {
        init();
        running = true;
        btn.textContent = 'Restart';
        clearInterval(intervalId);
        draw();
        intervalId = setInterval(step, SPEED);
    });

    function onKeyDown(e) {
        if (e.key === ' ' && running && !gameOver) { e.preventDefault(); paused = !paused; draw(); return; }
        if (!running || paused || gameOver) return;
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': if (dir.y !== 1) nextDir = { x: 0, y: -1 }; e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S': if (dir.y !== -1) nextDir = { x: 0, y: 1 }; e.preventDefault(); break;
            case 'ArrowLeft': case 'a': case 'A': if (dir.x !== 1) nextDir = { x: -1, y: 0 }; e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': if (dir.x !== -1) nextDir = { x: 1, y: 0 }; e.preventDefault(); break;
        }
    }
    document.addEventListener('keydown', onKeyDown);

    dpad.querySelectorAll('[data-snake]').forEach(function (b) {
        function handle(e) {
            e.preventDefault();
            if (!running || paused || gameOver) return;
            const d = b.dataset.snake;
            if (d === 'up' && dir.y !== 1) nextDir = { x: 0, y: -1 };
            if (d === 'down' && dir.y !== -1) nextDir = { x: 0, y: 1 };
            if (d === 'left' && dir.x !== 1) nextDir = { x: -1, y: 0 };
            if (d === 'right' && dir.x !== -1) nextDir = { x: 1, y: 0 };
        }
        b.addEventListener('touchstart', handle, { passive: false });
        b.addEventListener('mousedown', handle);
    });

    drawIdle();

    window.__gameCleanup = function () {
        running = false;
        clearInterval(intervalId);
        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('keydown', onKeyDown);
    };
};
