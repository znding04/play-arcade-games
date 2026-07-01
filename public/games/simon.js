/**
 * Simon - Classic Memory Game
 * Controls: Click or press keys (Q/W/E/A) to repeat the pattern
 * A challenging memory game where you repeat an ever-growing sequence.
 */
(function () {
  var canvas, ctx, container;
  var W = 400, H = 480;
  var tiles = [];
  var sequence = [];
  var playerIndex = 0;
  var level = 1;
  var score = 0;
  var gameOver = false;
  var playerTurn = false;
  var isPlaying = false;
  var animId;
  var cleanupFn;

  // Colors for each tile (top-left, top-right, bottom-right, bottom-left)
  var COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];
  var COLORS_LIT = ['#ff6b6b', '#69f0a4', '#64b5f6', '#ffe066'];
  var KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x'];

  function initTiles() {
    tiles = [];
    var cx = W / 2, cy = H / 2 - 20;
    var positions = [
      { x: cx - 75, y: cy - 75 },  // top-left
      { x: cx + 5,   y: cy - 75 },  // top-right
      { x: cx + 5,   y: cy + 5  },  // bottom-right
      { x: cx - 75, y: cy + 5  },  // bottom-left
    ];
    for (var i = 0; i < 4; i++) {
      tiles.push({
        x: positions[i].x,
        y: positions[i].y,
        w: 70,
        h: 70,
        color: COLORS[i],
        litColor: COLORS_LIT[i],
        lit: false,
        index: i
      });
    }
  }

  function createButton(x, y, w, h, label, color) {
    return { x, y, w, h, label, color };
  }

  var startBtn = { x: W / 2 - 60, y: H - 70, w: 120, h: 44, label: 'START', color: '#9b59b6' };

  function drawRoundedRect(x, y, w, h, r, fillColor) {
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
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function draw() {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SIMON', W / 2, 38);

    // Score & Level
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Score: ' + score + '   Level: ' + level, W / 2, 64);

    // Status
    var statusText = '';
    if (gameOver) {
      statusText = 'GAME OVER! Score: ' + score;
      ctx.fillStyle = '#e74c3c';
    } else if (playerTurn) {
      statusText = 'Your turn... (' + (playerIndex + 1) + '/' + sequence.length + ')';
      ctx.fillStyle = '#2ecc71';
    } else if (isPlaying) {
      statusText = 'Watch the pattern...';
      ctx.fillStyle = '#f39c12';
    } else {
      statusText = 'Press START';
      ctx.fillStyle = '#888';
    }
    ctx.font = '14px system-ui';
    ctx.fillText(statusText, W / 2, 84);

    // Tiles
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      var fillColor = t.lit ? t.litColor : t.color;
      ctx.shadowColor = t.lit ? fillColor : 'transparent';
      ctx.shadowBlur = t.lit ? 20 : 0;
      drawRoundedRect(t.x, t.y, t.w, t.h, 10, fillColor);
      ctx.shadowBlur = 0;
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 20, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Start button (only when not started)
    if (!isPlaying && !gameOver && sequence.length === 0) {
      drawRoundedRect(startBtn.x, startBtn.y, startBtn.w, startBtn.h, 8, startBtn.color);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(startBtn.label, W / 2, H - 41);
    }

    // Instructions
    ctx.fillStyle = '#555';
    ctx.font = '12px system-ui';
    ctx.fillText('Keys: Q W E A  |  Touch: tap tiles', W / 2, H - 10);
  }

  function loop() {
    animId = requestAnimationFrame(loop);
    draw();
  }

  function addToSequence() {
    sequence.push(Math.floor(Math.random() * 4));
  }

  function lightUp(index, duration) {
    return new Promise(function (resolve) {
      tiles[index].lit = true;
      playTone(index);
      setTimeout(function () {
        tiles[index].lit = false;
        resolve();
      }, duration);
    });
  }

  function playTone(index) {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var audioCtx = new AudioContext();
      var freqs = [261.63, 329.63, 392.00, 523.25];
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freqs[index];
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  }

  function playFailTone() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var audioCtx = new AudioContext();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }

  async function playSequence() {
    isPlaying = true;
    playerTurn = false;
    await new Promise(function (r) { setTimeout(r, 500); });
    for (var i = 0; i < sequence.length; i++) {
      await lightUp(sequence[i], 400);
      await new Promise(function (r) { setTimeout(r, 150); });
    }
    isPlaying = false;
    playerTurn = true;
    playerIndex = 0;
  }

  function handleInput(index) {
    if (!playerTurn || gameOver) return;

    tiles[index].lit = true;
    playTone(index);
    setTimeout(function () { tiles[index].lit = false; }, 200);

    if (sequence[playerIndex] === index) {
      playerIndex++;
      if (playerIndex === sequence.length) {
        // Level complete
        score += level * 10;
        level++;
        playerTurn = false;
        setTimeout(function () {
          addToSequence();
          playSequence();
        }, 800);
      }
    } else {
      // Wrong
      gameOver = true;
      playerTurn = false;
      playFailTone();
    }
  }

  function startGame() {
    sequence = [];
    playerIndex = 0;
    level = 1;
    score = 0;
    gameOver = false;
    playerTurn = false;
    isPlaying = false;
    initTiles();
    addToSequence();
    playSequence();
  }

  function getTileAt(x, y) {
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
        return i;
      }
    }
    // Check start button
    if (!isPlaying && !gameOver && sequence.length === 0) {
      if (x >= startBtn.x && x <= startBtn.x + startBtn.w &&
          y >= startBtn.y && y <= startBtn.y + startBtn.h) {
        return 'start';
      }
    }
    return -1;
  }

  function handleClick(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    var tile = getTileAt(x, y);
    if (tile === 'start') {
      startGame();
    } else if (tile >= 0) {
      handleInput(tile);
    }
  }

  function handleKey(e) {
    var key = e.key.toLowerCase();
    var map = { 'q': 0, 'w': 1, 'e': 2, 'a': 3, 's': 4, 'd': 5, 'z': 6, 'x': 7 };
    // For 4-tile simon, use Q/W/E/A or 1/2/3/4
    if (key === 'q') handleInput(0);
    else if (key === 'w') handleInput(1);
    else if (key === 'e') handleInput(2);
    else if (key === 'a') handleInput(3);
    else if (key === 's') handleInput(1);
    else if (key === 'd') handleInput(2);
    else if (key === '1') handleInput(0);
    else if (key === '2') handleInput(1);
    else if (key === '3') handleInput(2);
    else if (key === '4') handleInput(3);
  }

  function resize() {
    if (!container) return;
    var maxW = Math.min(W, container.clientWidth - 32);
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * H / W) + 'px';
  }

  window.initGame = function (cont) {
    container = cont;
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.cursor = 'pointer';
    canvas.style.borderRadius = '12px';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    initTiles();
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);

    loop();

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
    window.__gameCleanup = cleanupFn;
  };
})();
