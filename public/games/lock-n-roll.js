/* ============================================================
   LOCK-N-ROLL DICE PUZZLE GAME
   Roll 4 dice, place on a 4x4 grid, score combinations.
   Uses canvas for rendering. Touch-friendly.

   Rules based on the original jayisgames Lock-n-Roll:
   - 15 scoring groups (rows, columns, diagonals, quads, corners)
   - 4 clearing combos (color+number patterns)
   - Jokers earned at 250-point thresholds, 25% penalty per joker
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';

  var W = 400, H = 560;
  var COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308','#ffffff','#1e1e1e'];
  var COLOR_NAMES = ['red','blue','green','yellow','white','black'];
  var CELL = 80, PAD = 10, GRID_X = (W - 4 * CELL) / 2, GRID_Y = 140;
  var BTN_H = 44;

  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  var info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:4px;font-size:14px;';
  info.innerHTML = '<span>Score: <b id="lnr-score">0</b></span><span>Best: <b id="lnr-best">0</b></span><span>Jokers: <b id="lnr-jokers">0</b></span>';
  wrap.appendChild(info);

  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1a1a1a;border-radius:8px;max-width:100%;touch-action:none;cursor:pointer;';
  wrap.appendChild(canvas);

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;margin-top:10px;';

  var rollBtn = document.createElement('button');
  rollBtn.textContent = 'Roll Dice';
  rollBtn.style.cssText = 'padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  btnRow.appendChild(rollBtn);

  var jokerBtn = document.createElement('button');
  jokerBtn.textContent = 'Use Joker';
  jokerBtn.style.cssText = 'padding:10px 24px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#ca8a04,#f59e0b);color:#fff;cursor:pointer;opacity:0.5;';
  btnRow.appendChild(jokerBtn);

  wrap.appendChild(btnRow);

  // Rules "?" button (top-right corner)
  wrap.style.position = 'relative';
  var rulesBtn = document.createElement('button');
  rulesBtn.textContent = '?';
  rulesBtn.style.cssText = 'position:absolute;top:0;right:0;width:30px;height:30px;border-radius:50%;background:#8b5cf6;color:#fff;border:none;cursor:pointer;font-weight:bold;font-size:16px;z-index:10;';
  rulesBtn.onclick = function() {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    var content = document.createElement('div');
    content.style.cssText = 'background:#1a1a1a;color:#fff;padding:20px;border-radius:10px;max-width:500px;max-height:80vh;overflow-y:auto;';
    content.innerHTML = '<h2 style="margin-top:0;color:#8b5cf6;">Lock-n-Roll Rules</h2>'
      + '<h3>Prime Combos (Clear):</h3>'
      + '<ul style="font-size:14px;line-height:1.6;">'
      + '<li>Same color + same number = 100 pts</li>'
      + '<li>Same color + diff numbers (1-4) = 80 pts</li>'
      + '<li>Diff colors + same number = 70 pts</li>'
      + '<li>Diff colors + diff numbers (1-4) = 60 pts</li>'
      + '</ul>'
      + '<h3>Scoring Only (No Clear):</h3>'
      + '<ul style="font-size:14px;line-height:1.6;">'
      + '<li>4 same number = 30 pts</li>'
      + '<li>4 same color = 30 pts</li>'
      + '<li>3 same number/color = 15 pts</li>'
      + '<li>Pairs = 5-10 pts</li>'
      + '</ul>'
      + '<h3>Joker:</h3>'
      + '<p style="font-size:14px;">Earned at 250 pts, max 3. Each joker reduces combo value by 25%.</p>';
    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'background:#8b5cf6;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;margin-top:10px;font-size:14px;';
    closeBtn.onclick = function() { modal.remove(); };
    content.appendChild(closeBtn);
    modal.appendChild(content);
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  };
  wrap.appendChild(rulesBtn);

  container.appendChild(wrap);

  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('lnr-score');
  var bestEl = document.getElementById('lnr-best');
  var jokersEl = document.getElementById('lnr-jokers');

  // 15 scoring groups: rows(4) + columns(4) + diagonals(2) + 2x2 quads(4) + corners(1)
  var GROUPS = [];
  // Rows
  for (var r = 0; r < 4; r++) GROUPS.push([r*4, r*4+1, r*4+2, r*4+3]);
  // Columns
  for (var c = 0; c < 4; c++) GROUPS.push([c, c+4, c+8, c+12]);
  // Diagonals
  GROUPS.push([0, 5, 10, 15]);
  GROUPS.push([3, 6, 9, 12]);
  // 2x2 Quadrants
  GROUPS.push([0, 1, 4, 5]);
  GROUPS.push([2, 3, 6, 7]);
  GROUPS.push([8, 9, 12, 13]);
  GROUPS.push([10, 11, 14, 15]);
  // Four corners
  GROUPS.push([0, 3, 12, 15]);

  // State
  var state = {
    grid: new Array(16).fill(null),
    dice: [],
    score: 0,
    bestScore: parseInt(localStorage.getItem('lnr-best') || '0'),
    jokers: 0,
    gameOver: false,
    phase: 'roll',
    selectedDie: -1,
    placingJoker: false,
    comboAnim: null
  };

  bestEl.textContent = state.bestScore;

  function resize() {
    var maxW = container.clientWidth - 48;
    var s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  function randInt(n) { return Math.floor(Math.random() * n); }

  function rollDice() {
    if (state.phase !== 'roll' || state.gameOver) return;
    state.dice = [];
    for (var i = 0; i < 4; i++) {
      state.dice.push({
        number: randInt(4) + 1,
        color: COLOR_NAMES[randInt(6)],
        placed: false
      });
    }
    state.phase = 'place';
    state.selectedDie = -1;
    state.placingJoker = false;
    draw();
  }

  function placeDie(dieIndex, cellIndex) {
    if (state.grid[cellIndex] !== null) return false;
    var die = state.dice[dieIndex];
    if (!die || die.placed) return false;
    state.grid[cellIndex] = { number: die.number, color: die.color, joker: false };
    die.placed = true;
    state.selectedDie = -1;

    if (state.dice.every(function(d) { return d.placed; })) {
      checkAndClearCombinations();
      if (isGameOver()) {
        state.gameOver = true;
      } else {
        state.phase = 'roll';
      }
    }
    draw();
    return true;
  }

  function placeJoker(cellIndex) {
    if (state.grid[cellIndex] !== null) return false;
    if (state.jokers <= 0) return false;
    state.jokers--;
    jokersEl.textContent = state.jokers;
    state.grid[cellIndex] = { number: 0, color: 'joker', joker: true };
    state.placingJoker = false;
    jokerBtn.style.opacity = state.jokers > 0 ? '1' : '0.5';

    if (state.phase === 'place' && state.dice.every(function(d) { return d.placed; })) {
      checkAndClearCombinations();
      if (isGameOver()) {
        state.gameOver = true;
      } else {
        state.phase = 'roll';
      }
    } else {
      checkAndClearCombinations();
      if (isGameOver() && state.phase === 'roll') {
        state.gameOver = true;
      }
    }
    draw();
    return true;
  }

  // Evaluate a group of 4 cells for the best combination
  function evaluateGroup(indices) {
    var cells = indices.map(function(i) { return state.grid[i]; });
    // All 4 cells must be filled to score
    if (cells.some(function(c) { return c === null; })) return null;

    var jokerCount = cells.filter(function(c) { return c.joker; }).length;
    var nonJoker = cells.filter(function(c) { return !c.joker; });
    var numbers = nonJoker.map(function(c) { return c.number; });
    var colors = nonJoker.map(function(c) { return c.color; });

    // Determine number pattern
    var numPattern = getNumberPattern(numbers, jokerCount);
    // Determine color pattern
    var colorPattern = getColorPattern(colors, jokerCount);

    // Check the 4 clearing combinations first (color+number combos)
    var clearing = checkClearingCombo(numPattern, colorPattern, numbers, colors, jokerCount);
    if (clearing) {
      var pts = Math.round(clearing.points * Math.pow(0.75, jokerCount));
      return { indices: indices, points: pts, type: clearing.type, clear: true };
    }

    // Non-clearing: evaluate number and color patterns independently, take best of each
    var numScore = scoreNumberPattern(numPattern, numbers, jokerCount);
    var colScore = scoreColorPattern(colorPattern, colors, jokerCount);
    var totalPoints = numScore.points + colScore.points;

    if (totalPoints === 0) return null;

    var pts2 = Math.round(totalPoints * Math.pow(0.75, jokerCount));
    var typeParts = [];
    if (numScore.type) typeParts.push(numScore.type);
    if (colScore.type) typeParts.push(colScore.type);

    return { indices: indices, points: pts2, type: typeParts.join(' + '), clear: false };
  }

  function getNumberPattern(numbers, jokers) {
    if (numbers.length === 0) return { allSame: true, allDiff: true, threeKind: true, twoPair: true, pair: true };
    var counts = {};
    numbers.forEach(function(n) { counts[n] = (counts[n] || 0) + 1; });
    var vals = Object.values(counts).sort(function(a,b) { return b - a; });
    var distinct = Object.keys(counts).length;

    return {
      allSame: vals[0] + jokers >= 4,
      allDiff: distinct + jokers >= 4 && distinct === numbers.length, // each number unique among non-jokers
      threeKind: vals[0] + jokers >= 3,
      twoPair: checkTwoPairsPattern(vals, jokers),
      pair: vals[0] + jokers >= 2
    };
  }

  function checkTwoPairsPattern(vals, jokers) {
    if (vals.length >= 2 && vals[0] >= 2 && vals[1] >= 2) return true;
    if (vals.length >= 2 && vals[0] >= 2 && jokers >= 1) return true;
    if (vals.length >= 2 && jokers >= 2) return true;
    if (vals.length === 1 && jokers >= 2) return true;
    return false;
  }

  function getColorPattern(colors, jokers) {
    if (colors.length === 0) return { allSame: true, allDiff: true, threeKind: true, twoPair: true, pair: true };
    var counts = {};
    colors.forEach(function(c) { counts[c] = (counts[c] || 0) + 1; });
    var vals = Object.values(counts).sort(function(a,b) { return b - a; });
    var distinct = Object.keys(counts).length;

    return {
      allSame: vals[0] + jokers >= 4,
      allDiff: distinct + jokers >= 4 && distinct === colors.length,
      threeKind: vals[0] + jokers >= 3,
      twoPair: checkTwoPairsPattern(vals, jokers),
      pair: vals[0] + jokers >= 2
    };
  }

  function checkAllDiffNumbers(numbers, jokers) {
    var unique = [];
    numbers.forEach(function(n) { if (unique.indexOf(n) < 0) unique.push(n); });
    return unique.length + jokers >= 4 && unique.length === numbers.length;
  }

  function checkAllDiffColors(colors, jokers) {
    var unique = [];
    colors.forEach(function(c) { if (unique.indexOf(c) < 0) unique.push(c); });
    return unique.length + jokers >= 4 && unique.length === colors.length;
  }

  function checkClearingCombo(numPattern, colorPattern, numbers, colors, jokers) {
    // 1. Same color + same number (100 pts)
    if (colorPattern.allSame && numPattern.allSame) {
      return { points: 100, type: 'Same Color+Number' };
    }
    // 2. Same color + all different numbers (80 pts)
    if (colorPattern.allSame && checkAllDiffNumbers(numbers, jokers)) {
      return { points: 80, type: 'Same Color+Diff Numbers' };
    }
    // 3. All different colors + same number (70 pts)
    if (checkAllDiffColors(colors, jokers) && numPattern.allSame) {
      return { points: 70, type: 'Diff Colors+Same Number' };
    }
    // 4. All different colors + all different numbers (60 pts)
    if (checkAllDiffColors(colors, jokers) && checkAllDiffNumbers(numbers, jokers)) {
      return { points: 60, type: 'Diff Colors+Diff Numbers' };
    }
    return null;
  }

  function scoreNumberPattern(numPattern, numbers, jokers) {
    // Best non-clearing number pattern (not already caught by clearing combos)
    if (numPattern.allSame) return { points: 30, type: '4 Same Number' };
    if (numPattern.threeKind) return { points: 15, type: '3 Same Number' };
    if (numPattern.twoPair) return { points: 10, type: '2 Pairs (Num)' };
    if (numPattern.pair) return { points: 5, type: 'Pair (Num)' };
    return { points: 0, type: '' };
  }

  function scoreColorPattern(colorPattern, colors, jokers) {
    if (colorPattern.allSame) return { points: 30, type: '4 Same Color' };
    if (colorPattern.threeKind) return { points: 15, type: '3 Same Color' };
    if (colorPattern.twoPair) return { points: 10, type: '2 Pairs (Col)' };
    if (colorPattern.pair) return { points: 5, type: 'Pair (Col)' };
    return { points: 0, type: '' };
  }

  function findCombinations() {
    var combos = [];
    GROUPS.forEach(function(indices) {
      var result = evaluateGroup(indices);
      if (result) combos.push(result);
    });
    return combos;
  }

  function checkAndClearCombinations() {
    var combos = findCombinations();
    if (combos.length === 0) return;

    var totalPoints = 0;
    combos.forEach(function(combo) {
      totalPoints += combo.points;
      if (combo.clear) {
        combo.indices.forEach(function(idx) { state.grid[idx] = null; });
      }
    });

    var prevScore = state.score;
    state.score += totalPoints;

    // Award jokers for crossing 250-point thresholds
    var prevThreshold = Math.floor(prevScore / 250);
    var newThreshold = Math.floor(state.score / 250);
    if (newThreshold > prevThreshold) {
      var earned = newThreshold - prevThreshold;
      state.jokers = Math.min(state.jokers + earned, 3);
      jokersEl.textContent = state.jokers;
      jokerBtn.style.opacity = state.jokers > 0 ? '1' : '0.5';
    }

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem('lnr-best', String(state.bestScore));
      bestEl.textContent = state.bestScore;
    }
    scoreEl.textContent = state.score;

    // Show combo animation
    state.comboAnim = { combos: combos, time: Date.now() };
    setTimeout(function() { state.comboAnim = null; draw(); }, 1200);
  }

  function isGameOver() {
    if (state.phase === 'place') return false;
    var empty = 0;
    for (var i = 0; i < 16; i++) {
      if (state.grid[i] === null) empty++;
    }
    return empty === 0;
  }

  function resetGame() {
    state.grid = new Array(16).fill(null);
    state.dice = [];
    state.score = 0;
    state.jokers = 0;
    state.gameOver = false;
    state.phase = 'roll';
    state.selectedDie = -1;
    state.placingJoker = false;
    state.comboAnim = null;
    scoreEl.textContent = '0';
    jokersEl.textContent = '0';
    jokerBtn.style.opacity = '0.5';
    draw();
  }

  // --- Drawing ---
  function drawDieFace(x, y, size, number, color, selected, isJoker) {
    var colorIdx = COLOR_NAMES.indexOf(color);
    var fillColor = isJoker ? '#f59e0b' : (colorIdx >= 0 ? COLORS[colorIdx] : '#888');

    // Die body
    ctx.fillStyle = '#f5f5f4';
    ctx.shadowBlur = selected ? 8 : 3;
    ctx.shadowColor = selected ? '#a855f7' : 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Colored border
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 6);
    ctx.stroke();

    if (isJoker) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold ' + Math.floor(size * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('J', x + size/2, y + size/2);
      return;
    }

    // Pips
    var cx = x + size/2, cy = y + size/2;
    var off = size * 0.22;
    var pipR = size * 0.07;
    ctx.fillStyle = color === 'white' ? '#333' : fillColor;
    var pips = [];
    if (number === 1) pips = [[0,0]];
    else if (number === 2) pips = [[-off,-off],[off,off]];
    else if (number === 3) pips = [[-off,-off],[0,0],[off,off]];
    else if (number === 4) pips = [[-off,-off],[off,-off],[-off,off],[off,off]];

    pips.forEach(function(p) {
      ctx.beginPath();
      ctx.arc(cx + p[0], cy + p[1], pipR, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    // Dice tray area
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.roundRect(10, 10, W - 20, 120, 10);
    ctx.fill();

    // Phase label
    ctx.fillStyle = '#a3a3a3';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (state.phase === 'roll' && !state.gameOver) {
      ctx.fillText('Press Roll to start', 20, 16);
    } else if (state.phase === 'place') {
      ctx.fillText('Tap a die, then tap a cell to place it', 20, 16);
    }

    // Draw rolled dice in tray
    var dieSize = 54;
    var trayY = 42;
    for (var d = 0; d < state.dice.length; d++) {
      var die = state.dice[d];
      if (die.placed) continue;
      var dx = 30 + d * (dieSize + 16);
      drawDieFace(dx, trayY, dieSize, die.number, die.color, d === state.selectedDie, false);
    }

    // Joker placement indicator
    if (state.placingJoker) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('Tap cell for Joker', W - 20, 16);
    }

    // Grid
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var gx = GRID_X + c * CELL;
        var gy = GRID_Y + r * CELL;
        var idx = r * 4 + c;

        // Cell bg
        ctx.fillStyle = '#262626';
        ctx.beginPath();
        ctx.roundRect(gx + 2, gy + 2, CELL - 4, CELL - 4, 6);
        ctx.fill();

        // Cell border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(gx + 2, gy + 2, CELL - 4, CELL - 4, 6);
        ctx.stroke();

        // Die in cell
        var cell = state.grid[idx];
        if (cell) {
          drawDieFace(gx + 8, gy + 8, CELL - 16, cell.number, cell.color, false, cell.joker);
        }
      }
    }

    // Combo animation
    if (state.comboAnim) {
      var elapsed = Date.now() - state.comboAnim.time;
      var alpha = Math.max(0, 1 - elapsed / 1200);
      state.comboAnim.combos.forEach(function(combo) {
        ctx.fillStyle = 'rgba(147, 51, 234, ' + (alpha * 0.4) + ')';
        combo.indices.forEach(function(idx) {
          var cr = Math.floor(idx / 4), cc = idx % 4;
          var gx = GRID_X + cc * CELL, gy = GRID_Y + cr * CELL;
          ctx.beginPath();
          ctx.roundRect(gx + 2, gy + 2, CELL - 4, CELL - 4, 6);
          ctx.fill();
        });
        // Show combo text
        var midIdx = combo.indices[Math.floor(combo.indices.length / 2)];
        var mr = Math.floor(midIdx / 4), mc = midIdx % 4;
        var tx = GRID_X + mc * CELL + CELL / 2;
        var ty = GRID_Y + mr * CELL + CELL / 2 - elapsed * 0.02;
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+' + combo.points, tx, ty);
      });
    }

    // Game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(10,10,15,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 16; ctx.shadowColor = '#ef4444';
      ctx.font = '700 32px Courier New, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '500 20px sans-serif';
      ctx.fillText('Score: ' + state.score, W / 2, H / 2 + 10);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '14px sans-serif';
      ctx.fillText('Tap Roll to play again', W / 2, H / 2 + 40);
    }
  }

  // --- Input handling ---
  function handleCanvasClick(px, py) {
    if (state.gameOver) return;

    // Check tray dice click
    if (state.phase === 'place' && !state.placingJoker) {
      var dieSize = 54;
      var trayY = 42;
      for (var d = 0; d < state.dice.length; d++) {
        if (state.dice[d].placed) continue;
        var dx = 30 + d * (dieSize + 16);
        if (px >= dx && px <= dx + dieSize && py >= trayY && py <= trayY + dieSize) {
          state.selectedDie = d;
          draw();
          return;
        }
      }
    }

    // Check grid cell click
    if (py >= GRID_Y && py < GRID_Y + 4 * CELL && px >= GRID_X && px < GRID_X + 4 * CELL) {
      var col = Math.floor((px - GRID_X) / CELL);
      var row = Math.floor((py - GRID_Y) / CELL);
      var cellIdx = row * 4 + col;

      if (state.placingJoker) {
        placeJoker(cellIdx);
        return;
      }

      if (state.phase === 'place' && state.selectedDie >= 0) {
        placeDie(state.selectedDie, cellIdx);
        return;
      }
    }
  }

  function getCanvasCoords(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    var clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('click', function(e) {
    var pos = getCanvasCoords(e);
    handleCanvasClick(pos.x, pos.y);
  });
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var pos = getCanvasCoords(e);
    handleCanvasClick(pos.x, pos.y);
  }, { passive: false });

  rollBtn.addEventListener('click', function() {
    if (state.gameOver) {
      resetGame();
      return;
    }
    rollDice();
  });

  jokerBtn.addEventListener('click', function() {
    if (state.jokers <= 0 || state.gameOver) return;
    state.placingJoker = !state.placingJoker;
    state.selectedDie = -1;
    draw();
  });

  // Cleanup
  window.__gameCleanup = function() {
    window.removeEventListener('resize', resize);
  };

  draw();
};
