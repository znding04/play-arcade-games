/* ============================================================
   TETRIS
   Falling-block puzzle with neon pieces, ghost preview, next-
   piece display, level progression, and line clears. Main canvas
   is 300x600 (10x20); next-piece preview is 100x100.
   ============================================================ */
window.initGame = function (container) {
    container.innerHTML = '';
    const COLS = 10, ROWS = 20, CELL = 30;
    const W = COLS * CELL, H = ROWS * CELL;
    const NEXT_W = 100, NEXT_H = 100;

    // --- Build UI ---
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;gap:18px;align-items:center;margin-bottom:10px;';

    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;flex-direction:column;gap:6px;font-size:14px;';
    stats.innerHTML = '<span>Score: <b id="tetris-score">0</b></span><span>Level: <b id="tetris-level">1</b></span><span>Lines: <b id="tetris-lines">0</b></span>';
    top.appendChild(stats);

    const nextWrap = document.createElement('div');
    nextWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;font-size:12px;color:#a8a29e;';
    nextWrap.innerHTML = '<div style="margin-bottom:4px;">Next</div>';
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = NEXT_W; nextCanvas.height = NEXT_H;
    nextCanvas.style.cssText = 'background:#1c1917;border-radius:6px;';
    nextWrap.appendChild(nextCanvas);
    top.appendChild(nextWrap);

    wrap.appendChild(top);

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;';
    wrap.appendChild(canvas);

    const btn = document.createElement('button');
    btn.textContent = 'Start';
    btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
    wrap.appendChild(btn);

    // D-pad with rotate + drop
    const dpad = document.createElement('div');
    dpad.style.cssText = 'margin-top:14px;display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:6px;';
    [['', 'up', 'drop'], ['left', 'down', 'right'], ['', '', '']].forEach(function (row) {
        row.forEach(function (d) {
            const cell = document.createElement('div');
            if (!d) { dpad.appendChild(cell); return; }
            const b = document.createElement('button');
            b.dataset.tetris = d;
            b.textContent = { up: '↻', down: '▼', left: '◀', right: '▶', drop: '⤓' }[d];
            b.style.cssText = 'width:100%;height:100%;border:none;border-radius:8px;background:#3f3f46;color:#fff;font-size:18px;cursor:pointer;touch-action:none;';
            dpad.appendChild(b);
        });
    });
    wrap.appendChild(dpad);

    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:8px;font-size:12px;color:#a8a29e;';
    hint.textContent = '← → move · ↑ rotate · ↓ soft drop · Enter hard drop · Space pause';
    wrap.appendChild(hint);

    container.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    const scoreEl = wrap.querySelector('#tetris-score');
    const levelEl = wrap.querySelector('#tetris-level');
    const linesEl = wrap.querySelector('#tetris-lines');

    function resizeCanvas() {
        const maxW = container.clientWidth - 48;
        const w = Math.min(W, maxW);
        canvas.style.width = w + 'px';
        canvas.style.height = (w * 2) + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const SHAPES = {
        I: { blocks: [[[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]]], color: '#0ff' },
        O: { blocks: [[[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]]], color: '#667eea' },
        T: { blocks: [[[0,0],[0,1],[0,2],[1,1]], [[0,0],[1,0],[2,0],[1,1]], [[1,0],[1,1],[1,2],[0,1]], [[0,0],[1,0],[2,0],[1,-1]]], color: '#c084fc' },
        S: { blocks: [[[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]], [[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]]], color: '#4ade80' },
        Z: { blocks: [[[0,0],[0,1],[1,1],[1,2]], [[0,1],[1,0],[1,1],[2,0]], [[0,0],[0,1],[1,1],[1,2]], [[0,1],[1,0],[1,1],[2,0]]], color: '#f87171' },
        J: { blocks: [[[0,0],[1,0],[1,1],[1,2]], [[0,0],[0,1],[1,0],[2,0]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[2,-1]]], color: '#764ba2' },
        L: { blocks: [[[0,2],[1,0],[1,1],[1,2]], [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,0]], [[0,0],[0,1],[1,1],[2,1]]], color: '#fb923c' }
    };
    const SHAPE_KEYS = Object.keys(SHAPES);

    let board, current, next, pos, rotation, score, level, lines, running, paused, gameOver;
    let dropInterval, dropTimer, lastTime, rafId;

    function randomPiece() {
        const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
        return { key, shape: SHAPES[key] };
    }
    function getBlocks(piece, rot) { return piece.shape.blocks[rot % piece.shape.blocks.length]; }
    function isValid(piece, rot, r, c) {
        const blocks = getBlocks(piece, rot);
        for (let i = 0; i < blocks.length; i++) {
            const nr = r + blocks[i][0];
            const nc = c + blocks[i][1];
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
            if (board[nr][nc]) return false;
        }
        return true;
    }
    function lock() {
        const blocks = getBlocks(current, rotation);
        for (let i = 0; i < blocks.length; i++) {
            const r = pos.r + blocks[i][0];
            const c = pos.c + blocks[i][1];
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) board[r][c] = current.shape.color;
        }
    }
    function clearLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(function (cell) { return cell !== null; })) {
                board.splice(r, 1);
                board.unshift(new Array(COLS).fill(null));
                cleared++; r++;
            }
        }
        return cleared;
    }
    const LINE_SCORES = [0, 100, 300, 500, 800];
    function ghostRow() {
        let gr = pos.r;
        while (isValid(current, rotation, gr + 1, pos.c)) gr++;
        return gr;
    }

    function init() {
        board = [];
        for (let r = 0; r < ROWS; r++) board.push(new Array(COLS).fill(null));
        score = 0; level = 1; lines = 0;
        scoreEl.textContent = '0'; levelEl.textContent = '1'; linesEl.textContent = '0';
        running = true; paused = false; gameOver = false;
        dropInterval = 1000; dropTimer = 0; lastTime = 0;
        current = randomPiece(); next = randomPiece();
        rotation = 0;
        pos = { r: 0, c: Math.floor(COLS / 2) - 1 };
        drawNext();
    }

    function spawnPiece() {
        current = next;
        next = randomPiece();
        rotation = 0;
        pos = { r: 0, c: Math.floor(COLS / 2) - 1 };
        if (!isValid(current, rotation, pos.r, pos.c)) {
            gameOver = true; running = false;
            btn.textContent = 'Try Again';
        }
        drawNext();
    }

    function moveLeft() { if (isValid(current, rotation, pos.r, pos.c - 1)) pos.c--; }
    function moveRight() { if (isValid(current, rotation, pos.r, pos.c + 1)) pos.c++; }
    function moveDown() {
        if (isValid(current, rotation, pos.r + 1, pos.c)) { pos.r++; return true; }
        return false;
    }
    function hardDrop() {
        while (isValid(current, rotation, pos.r + 1, pos.c)) { pos.r++; score += 2; }
        lockAndAdvance();
    }
    function rotate() {
        const newRot = (rotation + 1) % 4;
        if (isValid(current, newRot, pos.r, pos.c)) rotation = newRot;
        else if (isValid(current, newRot, pos.r, pos.c - 1)) { rotation = newRot; pos.c--; }
        else if (isValid(current, newRot, pos.r, pos.c + 1)) { rotation = newRot; pos.c++; }
        else if (isValid(current, newRot, pos.r - 1, pos.c)) { rotation = newRot; pos.r--; }
    }
    function lockAndAdvance() {
        lock();
        const cleared = clearLines();
        if (cleared > 0) {
            lines += cleared;
            score += LINE_SCORES[Math.min(cleared, 4)] * level;
            level = Math.floor(lines / 10) + 1;
            dropInterval = Math.max(100, 1000 - (level - 1) * 80);
            scoreEl.textContent = score;
            levelEl.textContent = level;
            linesEl.textContent = lines;
        }
        scoreEl.textContent = score;
        spawnPiece();
    }

    function drawCell(c, x, y, size, color, glow) {
        if (glow) { c.shadowBlur = 12; c.shadowColor = color; }
        c.fillStyle = color;
        c.beginPath(); c.roundRect(x + 1, y + 1, size - 2, size - 2, 3); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,0.1)';
        c.fillRect(x + 2, y + 2, size - 4, 3);
    }

    function drawBoard() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
        for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }

        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
            if (board[r][c]) drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c], true);
        }
        if (!current || gameOver) return;

        const gr = ghostRow();
        const ghostBlocks = getBlocks(current, rotation);
        for (let i = 0; i < ghostBlocks.length; i++) {
            const r = gr + ghostBlocks[i][0];
            const c = pos.c + ghostBlocks[i][1];
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.beginPath(); ctx.roundRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2, 3); ctx.fill();
            }
        }
        const blocks = getBlocks(current, rotation);
        for (let i = 0; i < blocks.length; i++) {
            const r = pos.r + blocks[i][0];
            const c = pos.c + blocks[i][1];
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) drawCell(ctx, c * CELL, r * CELL, CELL, current.shape.color, true);
        }
    }

    function drawNext() {
        const size = 20;
        nextCtx.clearRect(0, 0, NEXT_W, NEXT_H);
        const blocks = getBlocks(next, 0);
        let minR = 4, maxR = 0, minC = 4, maxC = 0;
        for (let i = 0; i < blocks.length; i++) {
            minR = Math.min(minR, blocks[i][0]);
            maxR = Math.max(maxR, blocks[i][0]);
            minC = Math.min(minC, blocks[i][1]);
            maxC = Math.max(maxC, blocks[i][1]);
        }
        const pieceH = maxR - minR + 1;
        const pieceW = maxC - minC + 1;
        const offX = (NEXT_W - pieceW * size) / 2 - minC * size;
        const offY = (NEXT_H - pieceH * size) / 2 - minR * size;
        for (let i = 0; i < blocks.length; i++) {
            const x = offX + blocks[i][1] * size;
            const y = offY + blocks[i][0] * size;
            drawCell(nextCtx, x, y, size, next.shape.color, false);
        }
    }

    function drawOverlay(msg) {
        ctx.fillStyle = 'rgba(10,10,15,0.65)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#c084fc';
        ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
        ctx.font = '700 24px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg, W / 2, H / 2 - 10);
        ctx.shadowBlur = 0;
        if (gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '500 14px -apple-system,BlinkMacSystemFont,sans-serif';
            ctx.fillText('Score: ' + score, W / 2, H / 2 + 18);
        }
    }

    function drawIdle() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
        for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }
        const demo = [
            { r: 18, c: 0, color: '#0ff' }, { r: 18, c: 1, color: '#0ff' }, { r: 18, c: 2, color: '#0ff' }, { r: 18, c: 3, color: '#0ff' },
            { r: 19, c: 0, color: '#764ba2' }, { r: 19, c: 1, color: '#764ba2' }, { r: 19, c: 2, color: '#667eea' }, { r: 19, c: 3, color: '#667eea' },
            { r: 19, c: 4, color: '#c084fc' }, { r: 19, c: 5, color: '#c084fc' }, { r: 19, c: 6, color: '#c084fc' },
            { r: 18, c: 5, color: '#c084fc' },
            { r: 19, c: 7, color: '#4ade80' }, { r: 19, c: 8, color: '#4ade80' }, { r: 18, c: 8, color: '#4ade80' }, { r: 18, c: 9, color: '#4ade80' }
        ];
        for (let i = 0; i < demo.length; i++) drawCell(ctx, demo[i].c * CELL, demo[i].r * CELL, CELL, demo[i].color, true);
        const t = [[12, 4], [12, 5], [12, 6], [13, 5]];
        for (let i = 0; i < t.length; i++) drawCell(ctx, t[i][1] * CELL, t[i][0] * CELL, CELL, '#c084fc', true);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '600 18px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press Start to Play', W / 2, H / 2 - 40);
    }

    function loop(time) {
        if (!running) return;
        rafId = requestAnimationFrame(loop);
        if (paused) { drawBoard(); drawOverlay('PAUSED'); return; }
        const delta = time - lastTime;
        lastTime = time;
        dropTimer += delta;
        if (dropTimer >= dropInterval) {
            dropTimer = 0;
            if (!moveDown()) lockAndAdvance();
        }
        drawBoard();
        if (gameOver) drawOverlay('GAME OVER');
    }

    btn.addEventListener('click', function () {
        init();
        btn.textContent = 'Restart';
        cancelAnimationFrame(rafId);
        lastTime = performance.now();
        dropTimer = 0;
        rafId = requestAnimationFrame(loop);
    });

    function onKeyDown(e) {
        if (!running) return;
        if (e.key === ' ') {
            e.preventDefault();
            if (gameOver) return;
            paused = !paused;
            if (!paused) { lastTime = performance.now(); dropTimer = 0; }
            return;
        }
        if (paused || gameOver) return;
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); moveLeft(); break;
            case 'ArrowRight': case 'd': case 'D': e.preventDefault(); moveRight(); break;
            case 'ArrowDown': case 's': case 'S': e.preventDefault(); moveDown(); score += 1; scoreEl.textContent = score; break;
            case 'ArrowUp': case 'w': case 'W': e.preventDefault(); rotate(); break;
            case 'Enter': e.preventDefault(); hardDrop(); break;
        }
    }
    document.addEventListener('keydown', onKeyDown);

    dpad.querySelectorAll('[data-tetris]').forEach(function (b) {
        function handle(e) {
            e.preventDefault();
            if (!running || paused || gameOver) return;
            const d = b.dataset.tetris;
            if (d === 'left') moveLeft();
            if (d === 'right') moveRight();
            if (d === 'down') { moveDown(); score += 1; scoreEl.textContent = score; }
            if (d === 'up') rotate();
            if (d === 'drop') hardDrop();
        }
        b.addEventListener('touchstart', handle, { passive: false });
        b.addEventListener('mousedown', handle);
    });

    drawIdle();
    nextCtx.clearRect(0, 0, NEXT_W, NEXT_H);

    window.__gameCleanup = function () {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('keydown', onKeyDown);
    };
};
