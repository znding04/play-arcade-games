/* ============================================================
   2048
   Slide-and-merge puzzle on a 4x4 grid. Keyboard, d-pad, and
   swipe gestures supported. Rendered on canvas to be self-
   contained (no external CSS required).
   ============================================================ */
window.initGame = function (container) {
    container.innerHTML = '';
    const N = 4;
    const SIZE = 400;
    const PAD = 8;
    const CELL = (SIZE - PAD * (N + 1)) / N;

    // --- Build UI ---
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

    const info = document.createElement('div');
    info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
    info.innerHTML = '<span>Score: <b id="g2048-score">0</b></span><span>Best: <b id="g2048-best">0</b></span>';
    wrap.appendChild(info);

    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;';
    wrap.appendChild(canvas);

    const btn = document.createElement('button');
    btn.textContent = 'New Game';
    btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
    wrap.appendChild(btn);

    const dpad = document.createElement('div');
    dpad.style.cssText = 'margin-top:14px;display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:6px;';
    [['', 'up', ''], ['left', '', 'right'], ['', 'down', '']].forEach(function (row) {
        row.forEach(function (d) {
            const cell = document.createElement('div');
            if (!d) { dpad.appendChild(cell); return; }
            const b = document.createElement('button');
            b.dataset.g2048 = d;
            b.textContent = { up: '▲', down: '▼', left: '◀', right: '▶' }[d];
            b.style.cssText = 'width:100%;height:100%;border:none;border-radius:8px;background:#3f3f46;color:#fff;font-size:18px;cursor:pointer;touch-action:none;';
            dpad.appendChild(b);
        });
    });
    wrap.appendChild(dpad);

    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:8px;font-size:12px;color:#a8a29e;';
    hint.textContent = 'Arrows / WASD · swipe on canvas';
    wrap.appendChild(hint);

    container.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('#g2048-score');
    const bestEl = wrap.querySelector('#g2048-best');

    function resizeCanvas() {
        const maxW = container.clientWidth - 48;
        const w = Math.min(SIZE, maxW);
        canvas.style.width = w + 'px';
        canvas.style.height = w + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Tile colors keyed by value (capped at 2048).
    const TILE_COLORS = {
        2: ['#3f3f46', '#fff'],
        4: ['#52525b', '#fff'],
        8: ['#7c3aed', '#fff'],
        16: ['#9333ea', '#fff'],
        32: ['#a855f7', '#fff'],
        64: ['#c026d3', '#fff'],
        128: ['#db2777', '#fff'],
        256: ['#e11d48', '#fff'],
        512: ['#f59e0b', '#fff'],
        1024: ['#eab308', '#1c1917'],
        2048: ['#22c55e', '#1c1917']
    };
    function tileColor(v) { return TILE_COLORS[v > 2048 ? 2048 : v] || ['#22c55e', '#1c1917']; }

    let grid, score, best = parseInt(localStorage.getItem('g2048-best') || '0'), gameOverState = false;
    bestEl.textContent = best;

    function init() {
        grid = Array.from({ length: N }, function () { return [0, 0, 0, 0]; });
        score = 0;
        gameOverState = false;
        scoreEl.textContent = '0';
        addRandom(); addRandom();
        render();
    }

    function addRandom() {
        const empty = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] === 0) empty.push({ r, c });
        if (!empty.length) return;
        const cell = empty[Math.floor(Math.random() * empty.length)];
        grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, 0, SIZE, SIZE);

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const x = PAD + c * (CELL + PAD);
                const y = PAD + r * (CELL + PAD);
                const v = grid[r][c];
                const [bg, fg] = v ? tileColor(v) : ['#3f3f46', '#fff'];
                ctx.fillStyle = bg;
                ctx.beginPath(); ctx.roundRect(x, y, CELL, CELL, 8); ctx.fill();
                if (v) {
                    ctx.fillStyle = fg;
                    const fontSize = v < 100 ? 36 : v < 1000 ? 30 : 24;
                    ctx.font = '700 ' + fontSize + 'px -apple-system,BlinkMacSystemFont,sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(v), x + CELL / 2, y + CELL / 2);
                }
            }
        }

        if (gameOverState) {
            ctx.fillStyle = 'rgba(10,10,15,0.65)';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.fillStyle = '#c084fc';
            ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
            ctx.font = '700 28px Courier New, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', SIZE / 2, SIZE / 2 - 8);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '500 14px -apple-system,BlinkMacSystemFont,sans-serif';
            ctx.fillText('Score: ' + score, SIZE / 2, SIZE / 2 + 22);
        }
    }

    function slide(row) {
        const arr = row.filter(function (v) { return v !== 0; });
        const result = [];
        let i = 0;
        while (i < arr.length) {
            if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
                const merged = arr[i] * 2;
                result.push(merged);
                score += merged;
                i += 2;
            } else { result.push(arr[i]); i++; }
        }
        while (result.length < N) result.push(0);
        return result;
    }

    function move(direction) {
        if (gameOverState) return false;
        const oldGrid = grid.map(function (r) { return r.slice(); });

        if (direction === 'left') {
            for (let r = 0; r < N; r++) grid[r] = slide(grid[r]);
        } else if (direction === 'right') {
            for (let r = 0; r < N; r++) grid[r] = slide(grid[r].slice().reverse()).reverse();
        } else if (direction === 'up') {
            for (let c = 0; c < N; c++) {
                let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
                col = slide(col);
                for (let r = 0; r < N; r++) grid[r][c] = col[r];
            }
        } else if (direction === 'down') {
            for (let c = 0; c < N; c++) {
                let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
                col = slide(col);
                for (let r = 0; r < N; r++) grid[3 - r][c] = col[r];
            }
        }

        let changed = false;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] !== oldGrid[r][c]) changed = true;

        if (changed) {
            addRandom();
            scoreEl.textContent = score;
            if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('g2048-best', best); }
            if (isGameOver()) gameOverState = true;
            render();
        }
        return changed;
    }

    function isGameOver() {
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++) {
                if (grid[r][c] === 0) return false;
                if (c < N - 1 && grid[r][c] === grid[r][c + 1]) return false;
                if (r < N - 1 && grid[r][c] === grid[r + 1][c]) return false;
            }
        return true;
    }

    btn.addEventListener('click', init);

    function onKeyDown(e) {
        if (gameOverState) return;
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move('up'); break;
            case 'ArrowDown': case 's': case 'S': e.preventDefault(); move('down'); break;
            case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move('left'); break;
            case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move('right'); break;
        }
    }
    document.addEventListener('keydown', onKeyDown);

    dpad.querySelectorAll('[data-g2048]').forEach(function (b) {
        function handle(e) { e.preventDefault(); move(b.dataset.g2048); }
        b.addEventListener('touchstart', handle, { passive: false });
        b.addEventListener('mousedown', handle);
    });

    // Swipe on canvas
    let startX, startY;
    function onTouchStart(e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
    function onTouchEnd(e) {
        if (startX === undefined) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < 30) { startX = undefined; return; }
        if (ax > ay) move(dx > 0 ? 'right' : 'left');
        else move(dy > 0 ? 'down' : 'up');
        startX = undefined;
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    init();

    window.__gameCleanup = function () {
        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('keydown', onKeyDown);
    };
};
