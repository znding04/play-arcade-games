/* ============================================================
   LOCK-N-ROLL DICE PUZZLE GAME
   Roll 4 dice, place on a 4x4 grid, score combinations.
   Uses canvas for rendering. Touch-friendly.
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
  container.appendChild(wrap);

  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('lnr-score');
  var bestEl = document.getElementById('lnr-best');
  var jokersEl = document.getElementById('lnr-jokers');

  // State
  var state = {
    grid: new Array(16).fill(null),
    dice: [],
    score: 0,
    bestScore: parseInt(localStorage.getItem('lnr-best') || '0'),
    jokers: 0,
    jokersPending: 0,
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
        number: randInt(6) + 1,
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

    // If in place phase and all dice placed, check combos
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

  // Combination detection: check rows and columns
  function findCombinations() {
    var combos = [];
    var lines = [];
    // Rows
    for (var r = 0; r < 4; r++) {
      lines.push([r*4, r*4+1, r*4+2, r*4+3]);
    }
    // Columns
    for (var c = 0; c < 4; c++) {
      lines.push([c, c+4, c+8, c+12]);
    }

    lines.forEach(function(indices) {
      var cells = indices.map(function(i) { return state.grid[i]; });
      var filled = cells.filter(function(c) { return c !== null; });
      if (filled.length < 2) return;

      // Get effective numbers (jokers adapt)
      var nonJoker = filled.filter(function(c) { return !c.joker; });

      // --- Number combinations ---
      // Four of a kind
      if (filled.length === 4) {
        var nums = nonJoker.map(function(c) { return c.number; });
        var jokerCount = filled.length - nonJoker.length;
        if (checkNOfAKind(nums, 4, jokerCount)) {
          combos.push({ indices: indices.slice(), points: 60, type: '4 of a Kind' });
          return;
        }
        // Straights
        var straight = checkStraight(nums, jokerCount);
        if (straight) {
          combos.push({ indices: indices.slice(), points: straight.points, type: straight.name });
          return;
        }
        // Full house
        if (checkFullHouse(nums, jokerCount)) {
          combos.push({ indices: indices.slice(), points: 50, type: 'Full House' });
          return;
        }
        // Two pairs
        if (checkTwoPairs(nums, jokerCount)) {
          combos.push({ indices: indices.slice(), points: 25, type: 'Two Pairs' });
          return;
        }
        // Same color quad
        var colors = nonJoker.map(function(c) { return c.color; });
        if (checkSameColor(colors, 4, jokerCount)) {
          combos.push({ indices: indices.slice(), points: 90, type: 'Color Quad' });
          return;
        }
      }

      // Three of a kind / triple color (check subsets of 3)
      if (filled.length >= 3) {
        var found3 = false;
        var subsets3 = getSubsets(indices, 3, state.grid);
        for (var s = 0; s < subsets3.length; s++) {
          var sub = subsets3[s];
          var sNJ = sub.cells.filter(function(c) { return !c.joker; });
          var sJC = sub.cells.length - sNJ.length;
          var sNums = sNJ.map(function(c) { return c.number; });
          if (checkNOfAKind(sNums, 3, sJC)) {
            combos.push({ indices: sub.indices.slice(), points: 30, type: '3 of a Kind' });
            found3 = true; break;
          }
        }
        if (!found3) {
          for (var s2 = 0; s2 < subsets3.length; s2++) {
            var sub2 = subsets3[s2];
            var sNJ2 = sub2.cells.filter(function(c) { return !c.joker; });
            var sJC2 = sub2.cells.length - sNJ2.length;
            var sColors = sNJ2.map(function(c) { return c.color; });
            if (checkSameColor(sColors, 3, sJC2)) {
              combos.push({ indices: sub2.indices.slice(), points: 45, type: 'Color Triple' });
              break;
            }
          }
        }
      }

      // Pairs (check subsets of 2) — only if no bigger combo found on this line
      var lineHasCombo = combos.some(function(co) {
        return co.indices.some(function(ci) { return indices.indexOf(ci) >= 0; });
      });
      if (!lineHasCombo && filled.length >= 2) {
        var subsets2 = getSubsets(indices, 2, state.grid);
        var foundPair = false;
        for (var p = 0; p < subsets2.length; p++) {
          var sp = subsets2[p];
          var pNJ = sp.cells.filter(function(c) { return !c.joker; });
          var pJC = sp.cells.length - pNJ.length;
          var pNums = pNJ.map(function(c) { return c.number; });
          if (checkNOfAKind(pNums, 2, pJC)) {
            combos.push({ indices: sp.indices.slice(), points: 10, type: 'Pair' });
            foundPair = true; break;
          }
        }
        if (!foundPair) {
          for (var p2 = 0; p2 < subsets2.length; p2++) {
            var sp2 = subsets2[p2];
            var pNJ2 = sp2.cells.filter(function(c) { return !c.joker; });
            var pJC2 = sp2.cells.length - pNJ2.length;
            var pColors = pNJ2.map(function(c) { return c.color; });
            if (checkSameColor(pColors, 2, pJC2)) {
              combos.push({ indices: sp2.indices.slice(), points: 15, type: 'Color Pair' });
              break;
            }
          }
        }
      }
    });

    // Deduplicate: pick best combo per cell
    return deduplicateCombos(combos);
  }

  function getSubsets(indices, size, grid) {
    var result = [];
    var filled = [];
    for (var i = 0; i < indices.length; i++) {
      if (grid[indices[i]] !== null) filled.push(indices[i]);
    }
    if (filled.length < size) return result;
    // Generate combinations of `size` from filled
    function combine(start, current) {
      if (current.length === size) {
        result.push({
          indices: current.slice(),
          cells: current.map(function(i) { return grid[i]; })
        });
        return;
      }
      for (var i = start; i < filled.length; i++) {
        current.push(filled[i]);
        combine(i + 1, current);
        current.pop();
      }
    }
    combine(0, []);
    return result;
  }

  function checkNOfAKind(nums, n, jokers) {
    if (nums.length + jokers < n) return false;
    if (nums.length === 0) return jokers >= n;
    var counts = {};
    nums.forEach(function(num) { counts[num] = (counts[num] || 0) + 1; });
    var maxCount = 0;
    for (var k in counts) { if (counts[k] > maxCount) maxCount = counts[k]; }
    return maxCount + jokers >= n;
  }

  function checkSameColor(colors, n, jokers) {
    if (colors.length + jokers < n) return false;
    if (colors.length === 0) return jokers >= n;
    var counts = {};
    colors.forEach(function(c) { counts[c] = (counts[c] || 0) + 1; });
    var maxCount = 0;
    for (var k in counts) { if (counts[k] > maxCount) maxCount = counts[k]; }
    return maxCount + jokers >= n;
  }

  function checkStraight(nums, jokers) {
    var straights = [
      { seq: [1,2,3,4], points: 40, name: 'Straight 1-4' },
      { seq: [2,3,4,5], points: 50, name: 'Straight 2-5' },
      { seq: [3,4,5,6], points: 60, name: 'Straight 3-6' }
    ];
    var allNums = nums.slice();
    for (var i = straights.length - 1; i >= 0; i--) {
      var seq = straights[i].seq;
      var missing = 0;
      var used = allNums.slice();
      for (var j = 0; j < seq.length; j++) {
        var idx = used.indexOf(seq[j]);
        if (idx >= 0) { used.splice(idx, 1); }
        else { missing++; }
      }
      if (missing <= jokers) return straights[i];
    }
    return null;
  }

  function checkFullHouse(nums, jokers) {
    // 3 of one + 2 of another (among 4 dice, need joker for 5th? No: 4 cells, full house = 3+1 doesn't work)
    // Actually with 4 cells: we check for 3+1 pattern boosted by joker, or 2+2 boosted
    var total = nums.length + jokers;
    if (total < 4) return false;
    var counts = {};
    nums.forEach(function(n) { counts[n] = (counts[n] || 0) + 1; });
    var vals = Object.keys(counts).map(function(k) { return counts[k]; }).sort(function(a,b) { return b-a; });
    if (vals.length < 1) return false;
    // Need at least 2 distinct values, or jokers fill in
    if (vals.length >= 2) {
      // Try: boost top to 3, second to at least 1 (remaining jokers)
      var j = jokers;
      var a = vals[0], b = vals[1];
      if (a >= 3 && b >= 1) return true;
      if (a >= 2 && b >= 1 && a + j >= 3) return true;
      if (a >= 2 && b + (j - Math.max(0, 3 - a)) >= 1) {
        var neededA = Math.max(0, 3 - a);
        if (neededA <= j && b >= 1) return true;
      }
    }
    if (vals.length === 1 && jokers >= 1) {
      // One number repeated, joker becomes the other
      if (vals[0] >= 3 && jokers >= 1) return true;
      if (vals[0] >= 2 && jokers >= 2) return true; // joker boosts to 3, joker becomes 2nd
      if (vals[0] >= 1 && jokers >= 3) return true;
    }
    return false;
  }

  function checkTwoPairs(nums, jokers) {
    var counts = {};
    nums.forEach(function(n) { counts[n] = (counts[n] || 0) + 1; });
    var pairCount = 0;
    for (var k in counts) { if (counts[k] >= 2) pairCount++; }
    if (pairCount >= 2) return true;
    if (pairCount === 1 && jokers >= 2) return true;
    if (pairCount === 0) {
      // Need jokers to form pairs
      var singles = Object.keys(counts).length;
      if (singles >= 2 && jokers >= 2) return true;
    }
    return false;
  }

  function deduplicateCombos(combos) {
    // Sort by points descending, greedily pick non-overlapping
    combos.sort(function(a, b) { return b.points - a.points; });
    var used = {};
    var result = [];
    combos.forEach(function(combo) {
      var overlap = combo.indices.some(function(i) { return used[i]; });
      if (!overlap) {
        result.push(combo);
        combo.indices.forEach(function(i) { used[i] = true; });
      }
    });
    return result;
  }

  function checkAndClearCombinations() {
    var combos = findCombinations();
    if (combos.length === 0) return;

    var totalPoints = 0;
    combos.forEach(function(combo) {
      totalPoints += combo.points;
      combo.indices.forEach(function(idx) { state.grid[idx] = null; });
    });

    var prevScore = state.score;
    state.score += totalPoints;

    // Award jokers for crossing 100-point thresholds
    var prevThreshold = Math.floor(prevScore / 100);
    var newThreshold = Math.floor(state.score / 100);
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
    return empty < 4;
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
    else if (number === 5) pips = [[-off,-off],[off,-off],[0,0],[-off,off],[off,off]];
    else if (number === 6) pips = [[-off,-off],[off,-off],[-off,0],[off,0],[-off,off],[off,off]];

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
