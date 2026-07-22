(function () {
  var canvas, ctx, animId, cleanupFn;
  var board = [];        // 9x9 current board (0 = empty)
  var solution = [];     // 9x9 solution
  var given = [];        // 9x9 bool: given cells
  var selected = null;   // {r, c} or null
  var gameOver = false;
  var gameWon = false;
  var difficulty = 'medium';
  var cellSize = 0;
  var gridX = 0, gridY = 0;
  var gridSize = 0;
  var noteMode = false;
  var notes = [];        // 9x9x9 bool: pencil marks
  var hoveredCell = null;

  // Number pad for touch: cells rendered below the grid
  var numPadCells = [];

  function resize() {
    var maxW = Math.min(window.innerWidth - 32, 500);
    var maxH = Math.min(window.innerHeight - 200, 600);
    gridSize = Math.min(maxW, maxH);
    cellSize = Math.floor(gridSize / 9);
    gridSize = cellSize * 9;
    gridX = 0;
    gridY = 0;
    canvas.width = gridSize;
    canvas.height = gridSize + 60; // extra space for number pad
    numPadCells = [];
    var padY = gridSize + 8;
    var padW = Math.floor(gridSize / 9);
    for (var n = 0; n < 9; n++) {
      numPadCells.push({ x: n * padW, y: padY, w: padW, h: 48, num: n + 1 });
    }
  }

  function generatePuzzle() {
    // Generate a complete valid board
    solution = Array.from({ length: 9 }, function () { return Array(9).fill(0); });
    solveSudoku(solution);
    // Copy to board
    board = solution.map(function (r) { return r.slice(); });
    // Remove cells based on difficulty
    var removeCount;
    if (difficulty === 'easy') removeCount = 36;
    else if (difficulty === 'hard') removeCount = 52;
    else removeCount = 44; // medium
    var positions = [];
    for (var i = 0; i < 81; i++) positions.push(i);
    // Fisher-Yates shuffle
    for (var i = positions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = positions[i]; positions[i] = positions[j]; positions[j] = tmp;
    }
    given = Array.from({ length: 9 }, function () { return Array(9).fill(false); });
    for (var i = 0; i < 81; i++) {
      given[Math.floor(positions[i] / 9)][positions[i] % 9] = true;
    }
    var removed = 0;
    for (var i = 0; i < 81 && removed < removeCount; i++) {
      var r = Math.floor(positions[i] / 9);
      var c = positions[i] % 9;
      board[r][c] = 0;
      given[r][c] = false;
      removed++;
    }
    notes = Array.from({ length: 9 }, function () {
      return Array.from({ length: 9 }, function () { return Array(9).fill(false); });
    });
    selected = null;
    gameOver = false;
    gameWon = false;
  }

  function solveSudoku(grid) {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          shuffle(nums);
          for (var i = 0; i < 9; i++) {
            if (isValid(grid, r, c, nums[i])) {
              grid[r][c] = nums[i];
              if (solveSudoku(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function isValid(grid, r, c, n) {
    // Row
    for (var i = 0; i < 9; i++) {
      if (grid[r][i] === n) return false;
    }
    // Column
    for (var i = 0; i < 9; i++) {
      if (grid[i][c] === n) return false;
    }
    // 3x3 box
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (grid[br + i][bc + j] === n) return false;
      }
    }
    return true;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  function isConflict(r, c, val) {
    if (val === 0) return false;
    for (var i = 0; i < 9; i++) {
      if (i !== c && board[r][i] === val) return true;
      if (i !== r && board[i][c] === val) return true;
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var rr = br + i, cc = bc + j;
        if ((rr !== r || cc !== c) && board[rr][cc] === val) return true;
      }
    }
    return false;
  }

  function checkWin() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (board[r][c] === 0 || board[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  function handleCellClick(r, c) {
    if (gameWon) return;
    if (given[r][c]) {
      selected = null;
    } else {
      selected = { r: r, c: c };
    }
  }

  function placeNumber(n) {
    if (!selected || gameWon) return;
    var r = selected.r, c = selected.c;
    if (given[r][c]) return;
    if (noteMode) {
      notes[r][c][n - 1] = !notes[r][c][n - 1];
      board[r][c] = 0;
    } else {
      board[r][c] = (board[r][c] === n) ? 0 : n;
      notes[r][c] = Array(9).fill(false);
    }
    if (!noteMode && checkWin()) {
      gameWon = true;
      gameOver = true;
    }
  }

  function handleKey(key) {
    if (gameWon) return;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      if (!selected) {
        selected = { r: 4, c: 4 };
      } else {
        var dr = 0, dc = 0;
        if (key === 'ArrowUp') dr = -1;
        if (key === 'ArrowDown') dr = 1;
        if (key === 'ArrowLeft') dc = -1;
        if (key === 'ArrowRight') dc = 1;
        selected.r = Math.max(0, Math.min(8, selected.r + dr));
        selected.c = Math.max(0, Math.min(8, selected.c + dc));
      }
      return;
    }
    if (key === 'Backspace' || key === 'Delete' || key === '0') {
      if (selected && !given[selected.r][selected.c]) {
        board[selected.r][selected.c] = 0;
        notes[selected.r][selected.c] = Array(9).fill(false);
      }
      return;
    }
    if (key === 'n' || key === 'N' || key === 'Shift') {
      noteMode = !noteMode;
      return;
    }
    var n = parseInt(key);
    if (n >= 1 && n <= 9) {
      placeNumber(n);
    }
  }

  var keysDown = {};
  function handleKeyDown(e) {
    if (keysDown[e.key]) return;
    keysDown[e.key] = true;
    handleKey(e.key);
    e.preventDefault();
  }
  function handleKeyUp(e) {
    keysDown[e.key] = false;
  }

  function getCellAt(mx, my) {
    if (my < gridSize && mx >= 0 && mx < gridSize) {
      var r = Math.floor(my / cellSize);
      var c = Math.floor(mx / cellSize);
      if (r < 9 && c < 9) return { r: r, c: c };
    }
    return null;
  }

  function getNumPadAt(mx, my) {
    for (var i = 0; i < numPadCells.length; i++) {
      var p = numPadCells[i];
      if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
        return p.num;
      }
    }
    return null;
  }

  function handleTouchStart(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (e.touches[0].clientX - rect.left) * scaleX;
    var my = (e.touches[0].clientY - rect.top) * scaleY;
    var cell = getCellAt(mx, my);
    if (cell) {
      handleCellClick(cell.r, cell.c);
      return;
    }
    var num = getNumPadAt(mx, my);
    if (num) {
      placeNumber(num);
      return;
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
  }

  function handleTouchMove(e) {
    e.preventDefault();
  }

  function handleMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;
    hoveredCell = getCellAt(mx, my);
  }

  function handleMouseLeave() {
    hoveredCell = null;
  }

  function handleClick(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;
    var cell = getCellAt(mx, my);
    if (cell) {
      handleCellClick(cell.r, cell.c);
      return;
    }
    var num = getNumPadAt(mx, my);
    if (num) {
      placeNumber(num);
      return;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, gridSize, gridSize);

    // Highlight selected cell
    if (selected) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.fillRect(selected.c * cellSize, selected.r * cellSize, cellSize, cellSize);
    }

    // Highlight same value
    if (selected && board[selected.r][selected.c] > 0) {
      var selVal = board[selected.r][selected.c];
      ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
      for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
          if (board[r][c] === selVal) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Highlight hovered cell
    if (hoveredCell && !(selected && selected.r === hoveredCell.r && selected.c === hoveredCell.c)) {
      if (!given[hoveredCell.r][hoveredCell.c]) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(hoveredCell.c * cellSize, hoveredCell.r * cellSize, cellSize, cellSize);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, gridSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(gridSize, i * cellSize);
      ctx.stroke();
    }

    // Thick lines for 3x3 boxes
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2;
    for (var i = 0; i <= 9; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, gridSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(gridSize, i * cellSize);
      ctx.stroke();
    }

    // Draw numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var val = board[r][c];
        var cx = c * cellSize + cellSize / 2;
        var cy = r * cellSize + cellSize / 2;
        if (val > 0) {
          if (given[r][c]) {
            ctx.fillStyle = '#f5f5f4';
            ctx.font = 'bold ' + Math.floor(cellSize * 0.5) + 'px sans-serif';
          } else if (isConflict(r, c, val)) {
            ctx.fillStyle = '#ef4444';
            ctx.font = Math.floor(cellSize * 0.5) + 'px sans-serif';
          } else {
            ctx.fillStyle = '#a78bfa';
            ctx.font = Math.floor(cellSize * 0.5) + 'px sans-serif';
          }
          ctx.fillText(val, cx, cy);
        } else {
          // Draw pencil marks
          var hasNotes = notes[r][c].some(function (v) { return v; });
          if (hasNotes) {
            var noteSize = cellSize / 3;
            ctx.fillStyle = '#78716c';
            ctx.font = Math.floor(noteSize * 0.55) + 'px sans-serif';
            for (var n = 0; n < 9; n++) {
              if (notes[r][c][n]) {
                var nr = Math.floor(n / 3);
                var nc = n % 3;
                var nx = c * cellSize + nc * noteSize + noteSize / 2;
                var ny = r * cellSize + nr * noteSize + noteSize / 2;
                ctx.fillText(n + 1, nx, ny);
              }
            }
          }
        }
      }
    }

    // Draw number pad
    var padY = gridSize + 8;
    var padW = Math.floor(gridSize / 9);
    for (var n = 0; n < 9; n++) {
      var px = n * padW;
      var padR = padW * 0.38;
      // Count remaining
      var count = 0;
      for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
          if (board[r][c] === n + 1) count++;
        }
      }
      var remaining = 9 - count;
      if (remaining === 0) {
        ctx.fillStyle = '#292524';
        ctx.fillRect(px + 2, padY + 2, padW - 4, 44);
      } else {
        ctx.fillStyle = '#44403c';
        ctx.fillRect(px + 2, padY + 2, padW - 4, 44);
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, padY + 2, padW - 4, 44);
      }
      ctx.fillStyle = remaining === 0 ? '#57534e' : '#f5f5f4';
      ctx.font = 'bold ' + Math.floor(padW * 0.4) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n + 1, px + padW / 2, padY + 24);
    }

    // Note mode indicator
    ctx.fillStyle = noteMode ? '#a78bfa' : '#57534e';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(noteMode ? 'NOTES: ON' : 'NOTES: OFF (press N)', gridSize - 8, gridSize - 4);

    // Win overlay
    if (gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, gridSize, gridSize);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold ' + Math.floor(cellSize * 0.8) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎉 Solved! 🎉', gridSize / 2, gridSize / 2 - 20);
      ctx.fillStyle = '#d6d3d1';
      ctx.font = Math.floor(cellSize * 0.3) + 'px sans-serif';
      ctx.fillText('Tap New Game to play again', gridSize / 2, gridSize / 2 + 30);
    }
  }

  function loop(ts) {
    draw();
    animId = requestAnimationFrame(loop);
  }

  function initGame() {
    generatePuzzle();
    resize();
    draw();
  }

  // New Game button handler
  function newGame() {
    generatePuzzle();
    resize();
  }

  function changeDifficulty(diff) {
    difficulty = diff;
    generatePuzzle();
  }

  window.initGame = function (container) {
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.maxWidth = '100%';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Add difficulty buttons
    var btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;justify-content:center;flex-wrap:wrap;';
    btnContainer.setAttribute('data-sudoku-ui', '1');

    var difficulties = ['easy', 'medium', 'hard'];
    var labels = ['Easy', 'Medium', 'Hard'];
    var buttonRefs = [];

    for (var i = 0; i < 3; i++) {
      (function (d, label) {
        var btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'padding:6px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;';
        if (d === difficulty) {
          btn.style.background = 'linear-gradient(135deg, #7c3aed, #a855f7)';
          btn.style.color = '#fff';
        } else {
          btn.style.background = '#292524';
          btn.style.color = '#a8a29e';
        }
        btn.addEventListener('click', function () {
          difficulty = d;
          buttonRefs.forEach(function (b) {
            if (b.diff === d) {
              b.btn.style.background = 'linear-gradient(135deg, #7c3aed, #a855f7)';
              b.btn.style.color = '#fff';
            } else {
              b.btn.style.background = '#292524';
              b.btn.style.color = '#a8a29e';
            }
          });
          generatePuzzle();
        });
        buttonRefs.push({ btn: btn, diff: d });
        btnContainer.appendChild(btn);
      })(difficulties[i], labels[i]);
    }

    // New Game button
    var ngBtn = document.createElement('button');
    ngBtn.textContent = 'New Game';
    ngBtn.style.cssText = 'padding:6px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:#292524;color:#a8a29e;transition:all 0.2s;';
    ngBtn.addEventListener('click', function () { generatePuzzle(); });
    ngBtn.addEventListener('mouseenter', function () { ngBtn.style.background = '#44403c'; ngBtn.style.color = '#f5f5f4'; });
    ngBtn.addEventListener('mouseleave', function () { ngBtn.style.background = '#292524'; ngBtn.style.color = '#a8a29e'; });
    btnContainer.appendChild(ngBtn);

    container.insertBefore(btnContainer, canvas);

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    initGame();
    animId = requestAnimationFrame(loop);

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      keysDown = {};
      // Remove UI elements
      if (btnContainer.parentNode) btnContainer.parentNode.removeChild(btnContainer);
      board = [];
      solution = [];
      given = [];
      notes = [];
      selected = null;
      hoveredCell = null;
      gameOver = false;
      gameWon = false;
    };
    window.__gameCleanup = cleanupFn;
  };
})();