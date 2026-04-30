/* ============================================================
   MEMORY CARD GAME
   Flip cards to find matching pairs. Touch-friendly.
   Uses canvas for rendering.
   ============================================================ */
window.initGame = function (container) {
  container.innerHTML = '';
  const W = 400, H = 480;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;user-select:none;';

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;gap:24px;margin-bottom:8px;font-size:14px;';
  info.innerHTML = '<span>Moves: <b id="mm-moves">0</b></span><span>Pairs: <b id="mm-pairs">0</b>/8</span><span>Best: <b id="mm-best">-</b></span>';
  wrap.appendChild(info);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'background:#1c1917;border-radius:8px;max-width:100%;touch-action:none;cursor:pointer;';
  wrap.appendChild(canvas);

  const btn = document.createElement('button');
  btn.textContent = 'New Game';
  btn.style.cssText = 'margin-top:10px;padding:10px 32px;font-size:16px;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;cursor:pointer;';
  wrap.appendChild(btn);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const movesEl = document.getElementById('mm-moves');
  const pairsEl = document.getElementById('mm-pairs');
  const bestEl = document.getElementById('mm-best');

  let bestMoves = localStorage.getItem('memory-best');
  bestEl.textContent = bestMoves || '-';

  function resize() {
    const maxW = container.clientWidth - 48;
    const s = Math.min(1, maxW / W);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Grid: 4x4 = 16 cards = 8 pairs
  const GRID_COLS = 4, GRID_ROWS = 4;
  const PAD = 12, CARD_W = (W - PAD * 5) / GRID_COLS, CARD_H = (H - PAD * 5) / GRID_ROWS;
  const symbols = ['🍎', '🍊', '🍋', '🍇', '🍓', '🐱', '🐶', '🌟'];

  let cards, flipped, matched, moves, pairs, locked;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function init() {
    var deck = shuffle(symbols.concat(symbols).slice());
    cards = [];
    for (var r = 0; r < GRID_ROWS; r++) {
      for (var c = 0; c < GRID_COLS; c++) {
        cards.push({
          row: r, col: c,
          symbol: deck[r * GRID_COLS + c],
          x: PAD + c * (CARD_W + PAD),
          y: PAD + r * (CARD_H + PAD),
          flipped: false, matched: false
        });
      }
    }
    flipped = []; matched = 0; moves = 0; pairs = 0; locked = false;
    movesEl.textContent = '0'; pairsEl.textContent = '0/8';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    cards.forEach(function (card) {
      if (card.matched) {
        // Matched card
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, CARD_W, CARD_H, 8);
        ctx.fill();
        ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(card.symbol, card.x + CARD_W / 2, card.y + CARD_H / 2);
      } else if (card.flipped) {
        // Flipped card (face up)
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, CARD_W, CARD_H, 8);
        ctx.fill();
        ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, CARD_W, CARD_H, 8);
        ctx.stroke();
        ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(card.symbol, card.x + CARD_W / 2, card.y + CARD_H / 2);
      } else {
        // Face down
        ctx.fillStyle = '#7c3aed';
        ctx.shadowBlur = 6; ctx.shadowColor = '#7c3aed';
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, CARD_W, CARD_H, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '600 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', card.x + CARD_W / 2, card.y + CARD_H / 2);
      }
    });

    if (pairs === 8) {
      ctx.fillStyle = 'rgba(10,10,15,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22c55e'; ctx.shadowBlur = 16; ctx.shadowColor = '#22c55e';
      ctx.font = '700 28px Courier New, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', W / 2, H / 2 - 15);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 16px sans-serif';
      ctx.fillText('Moves: ' + moves, W / 2, H / 2 + 20);
    }
  }

  function handleClick(px, py) {
    if (locked || pairs === 8) return;

    // Find card
    var card = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (px >= c.x && px <= c.x + CARD_W && py >= c.y && py <= c.y + CARD_H) {
        if (!c.flipped && !c.matched) { card = c; break; }
      }
    }
    if (!card) return;

    card.flipped = true;
    flipped.push(card);
    draw();

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = moves;
      locked = true;

      if (flipped[0].symbol === flipped[1].symbol) {
        flipped[0].matched = true;
        flipped[1].matched = true;
        pairs++;
        pairsEl.textContent = pairs + '/8';
        flipped = [];
        locked = false;
        draw();

        if (pairs === 8) {
          if (!bestMoves || moves < parseInt(bestMoves)) {
            bestMoves = moves;
            bestEl.textContent = bestMoves;
            localStorage.setItem('memory-best', bestMoves);
          }
        }
      } else {
        setTimeout(function () {
          flipped[0].flipped = false;
          flipped[1].flipped = false;
          flipped = [];
          locked = false;
          draw();
        }, 800);
      }
    }
  }

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    handleClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width, scaleY = H / rect.height;
    handleClick((e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY);
  }, { passive: false });

  btn.addEventListener('click', function () {
    init(); draw();
  });

  init(); draw();
};
