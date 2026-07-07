/**
 * Connect Four (四子棋) - Classic Two-Player Strategy Game
 * Drop colored discs into columns to connect 4 in a row.
 * Controls: Click/tap on a column to drop a disc.
 */
(function () {
  var canvas, ctx, container;
  var COLS = 7;
  var ROWS = 6;
  var CELL = 70;
  var PADDING = 2;
  var BOARD_TOP = 50;
  var BOARD_LEFT;
  var W, H;

  var board = [];       // 2D array: board[row][col], 0=empty, 1=red, 2=yellow
  var currentPlayer = 1; // 1 = Red, 2 = Yellow
  var gameOver = false;
  var winner = 0;
  var scores = [0, 0];  // scores[0] = Red wins, scores[1] = Yellow wins
  var animId;
  var hoveringCol = -1;
  var dropAnim = null;  // { col, row, player, y }
  var winCells = [];    // winning cell positions [{row, col}, ...]

  var PLAYER_COLORS = [null, '#e74c3c', '#f1c40f'];
  var PLAYER_COLORS_LIGHT = [null, '#ff6b6b', '#ffe066'];
  var PLAYER_NAMES = [null, 'Red', 'Yellow'];
  var PLAYER_EMOJI = [null, '🔴', '🟡'];

  // Button definitions
  var buttonReset = null;

  function initContainer() {
    W = COLS * (CELL + PADDING) + PADDING;
    H = BOARD_TOP + ROWS * (CELL + PADDING) + 60;
    BOARD_LEFT = PADDING;

    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.cursor = 'pointer';
    container.appendChild(canvas);

    ctx = canvas.getContext('2d');

    // Reset button
    buttonReset = {
      x: W / 2 - 50,
      y: H - 48,
      w: 100,
      h: 36,
      label: 'New Game',
      color: '#8b5cf6'
    };
  }

  function initBoard() {
    board = [];
    for (var r = 0; r < ROWS; r++) {
      board.push(new Array(COLS).fill(0));
    }
    currentPlayer = 1;
    gameOver = false;
    winner = 0;
    winCells = [];
    dropAnim = null;
  }

  function getLowestEmptyRow(col) {
    for (var r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) return r;
    }
    return -1; // column full
  }

  function checkWin(row, col) {
    var player = board[row][col];
    if (player === 0) return false;

    var directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var cells = [{ row: row, col: col }];

      // Check positive direction
      for (var i = 1; i < 4; i++) {
        var r = row + dr * i;
        var c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.push({ row: r, col: c });
        } else {
          break;
        }
      }

      // Check negative direction
      for (var i = 1; i < 4; i++) {
        var r = row - dr * i;
        var c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.unshift({ row: r, col: c });
        } else {
          break;
        }
      }

      if (cells.length >= 4) {
        winCells = cells.slice(0, 4);
        return true;
      }
    }
    return false;
  }

  function isBoardFull() {
    for (var c = 0; c < COLS; c++) {
      if (board[0][c] === 0) return false;
    }
    return true;
  }

  function makeMove(col) {
    if (gameOver || dropAnim) return;

    var row = getLowestEmptyRow(col);
    if (row === -1) return; // column full

    // Start drop animation
    dropAnim = { col: col, row: row, player: currentPlayer, y: BOARD_TOP + PADDING - CELL };
  }

  function finishMove() {
    if (!dropAnim) return;
    var col = dropAnim.col;
    var row = dropAnim.row;
    var player = dropAnim.player;
    board[row][col] = player;
    dropAnim = null;

    if (checkWin(row, col)) {
      winner = player;
      gameOver = true;
      scores[player - 1]++;
    } else if (isBoardFull()) {
      gameOver = true;
      winner = 0; // tie
    } else {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
  }

  function resetGame() {
    initBoard();
    hoveringCol = -1;
  }

  function drawBoard() {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, W, H);

    // Draw board background
    ctx.fillStyle = '#2563eb';
    var bx = BOARD_LEFT;
    var by = BOARD_TOP;
    var bw = COLS * (CELL + PADDING) + PADDING;
    var bh = ROWS * (CELL + PADDING) + PADDING;
    roundRect(ctx, bx, by, bw, bh, 10, true, false);

    // Draw holes
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cx = BOARD_LEFT + c * (CELL + PADDING) + PADDING + CELL / 2;
        var cy = BOARD_TOP + r * (CELL + PADDING) + PADDING + CELL / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1c1917';
        ctx.fill();
      }
    }

    // Draw placed discs
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c] !== 0) {
          var cx = BOARD_LEFT + c * (CELL + PADDING) + PADDING + CELL / 2;
          var cy = BOARD_TOP + r * (CELL + PADDING) + PADDING + CELL / 2;
          drawDisc(cx, cy, CELL / 2 - 2, board[r][c]);
        }
      }
    }

    // Highlight winning cells
    if (gameOver && winner !== 0) {
      for (var i = 0; i < winCells.length; i++) {
        var wc = winCells[i];
        var cx = BOARD_LEFT + wc.col * (CELL + PADDING) + PADDING + CELL / 2;
        var cy = BOARD_TOP + wc.row * (CELL + PADDING) + PADDING + CELL / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    // Draw drop animation
    if (dropAnim) {
      var dx = BOARD_LEFT + dropAnim.col * (CELL + PADDING) + PADDING + CELL / 2;
      drawDisc(dx, dropAnim.y, CELL / 2 - 2, dropAnim.player);
    }

    // Draw hover indicator
    if (!gameOver && !dropAnim && hoveringCol >= 0 && hoveringCol < COLS) {
      var hx = BOARD_LEFT + hoveringCol * (CELL + PADDING) + PADDING + CELL / 2;
      var hy = BOARD_TOP + PADDING + CELL / 2;
      ctx.globalAlpha = 0.4;
      drawDisc(hx, hy - CELL, CELL / 2 - 2, currentPlayer);
      ctx.globalAlpha = 1;
    }

    // Draw status line and scores
    var statusY = BOARD_TOP + ROWS * (CELL + PADDING) + PADDING + 28;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px -apple-system, sans-serif';

    if (gameOver) {
      if (winner === 0) {
        ctx.fillStyle = '#a8a29e';
        ctx.fillText('🤝 Tie!', W / 2, statusY);
      } else {
        ctx.fillStyle = PLAYER_COLORS[winner];
        ctx.fillText(PLAYER_EMOJI[winner] + ' ' + PLAYER_NAMES[winner] + ' Wins!', W / 2, statusY);
      }
    } else {
      ctx.fillStyle = PLAYER_COLORS[currentPlayer];
      ctx.fillText(PLAYER_EMOJI[currentPlayer] + ' ' + PLAYER_NAMES[currentPlayer] + "'s Turn", W / 2, statusY);
    }

    // Draw scores on top
    ctx.font = '14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = PLAYER_COLORS[1];
    ctx.fillText('🔴 ' + scores[0], BOARD_LEFT + 8, BOARD_TOP - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = PLAYER_COLORS[2];
    ctx.fillText(scores[1] + ' 🟡', BOARD_LEFT + bw - 8, BOARD_TOP - 12);

    // Draw reset button
    ctx.textAlign = 'center';
    ctx.fillStyle = buttonReset.color;
    roundRect(ctx, buttonReset.x, buttonReset.y, buttonReset.w, buttonReset.h, 8, true, false);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.fillText(buttonReset.label, buttonReset.x + buttonReset.w / 2, buttonReset.y + 24);
  }

  function drawDisc(x, y, r, player) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, PLAYER_COLORS_LIGHT[player]);
    grad.addColorStop(1, PLAYER_COLORS[player]);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function getClickPos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function handleClick(e) {
    var pos = getClickPos(e);

    // Check reset button
    if (pos.x >= buttonReset.x && pos.x <= buttonReset.x + buttonReset.w &&
        pos.y >= buttonReset.y && pos.y <= buttonReset.y + buttonReset.h) {
      resetGame();
      return;
    }

    if (gameOver || dropAnim) return;

    // Determine which column was clicked
    var bw = BOARD_LEFT + COLS * (CELL + PADDING);
    if (pos.x < BOARD_LEFT || pos.x > bw) return;
    if (pos.y < BOARD_TOP || pos.y > BOARD_TOP + ROWS * (CELL + PADDING) + PADDING) return;

    var col = Math.floor((pos.x - BOARD_LEFT) / (CELL + PADDING));
    if (col < 0) col = 0;
    if (col >= COLS) col = COLS - 1;
    makeMove(col);
  }

  function handleMouseMove(e) {
    if (gameOver || dropAnim) {
      hoveringCol = -1;
      return;
    }
    var pos = getClickPos(e);
    var bw = BOARD_LEFT + COLS * (CELL + PADDING);
    if (pos.x < BOARD_LEFT || pos.x > bw) {
      hoveringCol = -1;
    } else {
      hoveringCol = Math.floor((pos.x - BOARD_LEFT) / (CELL + PADDING));
      if (hoveringCol < 0) hoveringCol = 0;
      if (hoveringCol >= COLS) hoveringCol = COLS - 1;
    }
  }

  function handleMouseLeave() {
    hoveringCol = -1;
  }

  function gameLoop() {
    // Update drop animation
    if (dropAnim) {
      var targetY = BOARD_TOP + dropAnim.row * (CELL + PADDING) + PADDING + CELL / 2;
      var speed = 12; // pixels per frame
      dropAnim.y += speed;
      if (dropAnim.y >= targetY) {
        dropAnim.y = targetY;
        finishMove();
      }
    }

    drawBoard();
    animId = requestAnimationFrame(gameLoop);
  }

  // Cleanup function
  function cleanup() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }

  // Public init function
  window.initGame = function (elem) {
    container = elem;
    // Clear any previous content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    initContainer();
    initBoard();
    gameLoop();

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  };

  window.__gameCleanup = cleanup;
})();