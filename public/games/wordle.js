(function () {
  'use strict';

  var canvas, ctx, animId, cleanupFn;
  var CELL = 56, GAP = 6, COLS = 5, ROWS = 6;
  var BOARD_X, BOARD_Y, KEYBOARD_Y;
  var W = 400, H = 600;

  // Game state
  var guesses = [];
  var currentGuess = '';
  var targetWord = '';
  var gameOver = false;
  var gameWon = false;
  var messageText = '';
  var messageTimer = 0;
  var shakeTimer = 0;
  var shakeRow = -1;
  var revealRow = -1;
  var revealCol = -1;
  var revealTimer = 0;

  // Word list
  var words = [
    'ABOUT','ABOVE','ACTOR','ADMIT','ADOPT','ADULT','AFTER','AGAIN','AGENT','AGREE',
    'AHEAD','ALARM','ALBUM','ALIEN','ALIGN','ALIVE','ALLEY','ALLOW','ALONE','ALONG',
    'ALTER','AMONG','AMPLE','ANGEL','ANGER','ANGLE','ANGRY','ANIME','ANKLE','APART',
    'APPLE','APPLY','ARENA','ARGUE','ARISE','ARMOR','ARRAY','ARROW','ASIDE','ASSET',
    'AVOID','AWARD','AWARE','BADGE','BASIC','BASIN','BATCH','BEACH','BEARD','BEAST',
    'BEGIN','BEING','BELOW','BENCH','BIRTH','BLACK','BLADE','BLAME','BLAND','BLANK',
    'BLAST','BLAZE','BLEED','BLEND','BLESS','BLIND','BLINK','BLISS','BLOCK','BLOOM',
    'BLOWN','BLUES','BOARD','BONUS','BOOST','BOUND','BRAIN','BRAND','BRAVE','BREAD',
    'BREAK','BREED','BRICK','BRIEF','BROAD','BROWN','BRUSH','BUILD','BUNCH','BURNT',
    'BURST','BUYER','CABIN','CANDY','CARGO','CARRY','CATCH','CAUSE','CHAIN','CHAIR',
    'CHAOS','CHARM','CHART','CHASE','CHEAP','CHECK','CHESS','CHEST','CHIEF','CHILD',
    'CHILL','CHINA','CHUNK','CIVIL','CLAIM','CLASH','CLASS','CLEAN','CLEAR','CLERK',
    'CLIMB','CLING','CLOCK','CLONE','CLOSE','CLOTH','CLOUD','COACH','COAST','COLOR',
    'COMIC','CORAL','COULD','COUNT','COURT','COVER','CRACK','CRAFT','CRANE','CRASH',
    'CRAZY','CREAM','CREEK','CRIME','CROSS','CROWD','CROWN','CRUEL','CRUSH','CURVE',
    'CYCLE','DAILY','DANCE','DEATH','DEBUG','DELAY','DELTA','DEMON','DENSE','DEPTH',
    'DEVIL','DIARY','DIRTY','DOUBT','DOUGH','DOZEN','DRAFT','DRAIN','DRAMA','DRAWN',
    'DREAM','DRESS','DRIFT','DRINK','DRIVE','DROWN','DRYER','EARLY','EARTH','EIGHT',
    'ELBOW','ELDER','ELECT','ELITE','EMAIL','EMPTY','ENEMY','ENJOY','ENTER','ENTRY',
    'EQUAL','ERROR','EVENT','EVERY','EXACT','EXILE','EXIST','EXTRA','FAIRY','FAITH',
    'FALSE','FANCY','FATAL','FAULT','FEAST','FENCE','FERRY','FEVER','FIBER','FIELD',
    'FIFTY','FIGHT','FINAL','FIRST','FLAME','FLASH','FLEET','FLESH','FLOAT','FLOOD',
    'FLOOR','FLOUR','FLUID','FLUSH','FOCUS','FORCE','FORGE','FORTH','FORUM','FOUND',
    'FRAME','FRANK','FRAUD','FRESH','FRONT','FROST','FROZE','FRUIT','FULLY','FUNNY',
    'GHOST','GIANT','GIVEN','GLASS','GLOBE','GLOOM','GLORY','GLOVE','GRACE','GRADE',
    'GRAIN','GRAND','GRANT','GRAPH','GRASP','GRASS','GRAVE','GREAT','GREEN','GREET',
    'GRIEF','GRIND','GROSS','GROUP','GROVE','GROWN','GUARD','GUESS','GUEST','GUIDE',
    'GUILT','HAPPY','HARSH','HEART','HEAVY','HEDGE','HELLO','HENCE','HERBS','HONOR',
    'HORSE','HOTEL','HOUSE','HUMAN','HUMOR','HURRY','IDEAL','IMAGE','IMPLY','INDEX',
    'INNER','INPUT','ISSUE','IVORY','JEWEL','JOINT','JOKER','JUDGE','JUICE','KEEPS',
    'KNIFE','KNOCK','KNOWN','LABEL','LARGE','LASER','LATER','LAUGH','LAYER','LEARN',
    'LEASE','LEAVE','LEGAL','LEMON','LEVEL','LEVER','LIGHT','LIMIT','LINER','LIVER',
    'LOCAL','LOGIC','LOOSE','LORRY','LOVER','LOWER','LOYAL','LUCKY','LUNAR','LUNCH',
    'MAGIC','MAJOR','MAKER','MANOR','MAPLE','MARCH','MATCH','MAYBE','MAYOR','MEDAL',
    'MEDIA','MERCY','MERGE','MERIT','METAL','METER','MIGHT','MINOR','MINUS','MIXED',
    'MODEL','MONEY','MONTH','MORAL','MOTOR','MOUNT','MOUSE','MOUTH','MOVIE','MUSIC',
    'NAIVE','NERVE','NEVER','NIGHT','NINJA','NOBLE','NOISE','NORTH','NOTED','NOVEL',
    'NURSE','NYLON','OCCUR','OCEAN','OFTEN','OLIVE','ONSET','OPERA','ORBIT','ORDER',
    'OTHER','OUGHT','OUTER','OWNER','OXIDE','PAINT','PANEL','PANIC','PAPER','PATCH',
    'PAUSE','PEACE','PENNY','PHASE','PHONE','PHOTO','PIANO','PIECE','PILOT','PINCH',
    'PIXEL','PIZZA','PLACE','PLAIN','PLANE','PLANT','PLATE','PLAZA','PLEAD','PLUCK',
    'PLUMB','PLUSH','POINT','POLAR','POUND','POWER','PRESS','PRICE','PRIDE','PRIME',
    'PRINT','PRIOR','PRIZE','PROBE','PROOF','PROSE','PROUD','PROVE','PSALM','PULSE',
    'PUPIL','PURSE','QUEEN','QUERY','QUEST','QUEUE','QUICK','QUIET','QUITE','QUOTA',
    'QUOTE','RADIO','RAISE','RALLY','RANCH','RANGE','RAPID','RATIO','REACH','REACT',
    'READY','REALM','REBEL','REFER','REIGN','RELAX','REPLY','RIDER','RIDGE','RIFLE',
    'RIGHT','RIGID','RISKY','RIVAL','RIVER','ROBIN','ROCKY','ROMAN','ROUGE','ROUGH',
    'ROUND','ROUTE','ROYAL','RULER','RURAL','SAINT','SALAD','SAUCE','SCALE','SCARE',
    'SCENE','SCOPE','SCORE','SCOUT','SENSE','SERVE','SEVEN','SHADE','SHAFT','SHAKE',
    'SHALL','SHAME','SHAPE','SHARE','SHARK','SHARP','SHEER','SHEET','SHELF','SHELL',
    'SHIFT','SHINE','SHIRT','SHOCK','SHOOT','SHORE','SHORT','SHOUT','SIGHT','SINCE',
    'SIXTY','SKILL','SKULL','SLASH','SLATE','SLAVE','SLEEP','SLICE','SLIDE','SLOPE',
    'SMALL','SMART','SMILE','SMITH','SMOKE','SNAKE','SOLAR','SOLID','SOLVE','SORRY',
    'SOUND','SOUTH','SPACE','SPARE','SPEAK','SPEED','SPELL','SPEND','SPICE','SPILL',
    'SPINE','SPORT','SPRAY','SQUAD','STACK','STAFF','STAGE','STAKE','STALE','STALL',
    'STAMP','STAND','STARE','START','STATE','STAYS','STEAK','STEAL','STEAM','STEEL',
    'STEEP','STEER','STERN','STICK','STIFF','STILL','STOCK','STONE','STOOD','STORE',
    'STORM','STORY','STOVE','STUFF','STYLE','SUGAR','SUITE','SUNNY','SUPER','SURGE',
    'SWAMP','SWEAR','SWEAT','SWEEP','SWEET','SWEPT','SWIFT','SWING','SWORD','SWORE',
    'TABLE','TASTE','TEACH','TEETH','THANK','THEME','THERE','THICK','THIEF','THING',
    'THINK','THIRD','THOSE','THREE','THREW','THROW','THUMB','TIGER','TIGHT','TIMER',
    'TIRED','TITLE','TODAY','TOKEN','TOPIC','TOTAL','TOUCH','TOUGH','TOWEL','TOWER',
    'TOXIC','TRACE','TRACK','TRADE','TRAIL','TRAIN','TRAIT','TRASH','TREAT','TREND',
    'TRIAL','TRIBE','TRICK','TRIED','TROOP','TRUCK','TRULY','TRUMP','TRUNK','TRUST',
    'TRUTH','TUMOR','TWICE','TWIST','ULTRA','UNCLE','UNDER','UNION','UNITE','UNITY',
    'UNTIL','UPPER','UPSET','URBAN','USAGE','USUAL','VALID','VALUE','VIDEO','VIGOR',
    'VIRUS','VISIT','VITAL','VIVID','VOCAL','VOICE','VOTER','WAGON','WASTE','WATCH',
    'WATER','WEARY','WEAVE','WHEAT','WHEEL','WHERE','WHICH','WHILE','WHITE','WHOLE',
    'WHOSE','WIDER','WIDOW','WOMAN','WOMEN','WORLD','WORRY','WORSE','WORST','WORTH',
    'WOULD','WOUND','WRATH','WRITE','WRONG','WROTE','YACHT','YIELD','YOUNG','YOUTH'
  ];

  // Keyboard layout
  var keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['↵','Z','X','C','V','B','N','M','⌫']
  ];

  // Track which letters have been used
  var letterStates = {}; // 'correct', 'present', 'absent', or undefined

  var colors = {
    bg: '#1c1917',
    tileEmpty: '#292524',
    tileBorder: '#44403c',
    correct: '#16a34a',
    present: '#ca8a04',
    absent: '#57534e',
    keyInactive: '#78716c',
    keyText: '#e7e5e4',
    text: '#e7e5e4',
    accent: '#a78bfa'
  };

  function pickWord() {
    return words[Math.floor(Math.random() * words.length)];
  }

  function resetGame() {
    guesses = [];
    currentGuess = '';
    targetWord = pickWord();
    gameOver = false;
    gameWon = false;
    messageText = '';
    messageTimer = 0;
    shakeTimer = 0;
    shakeRow = -1;
    revealRow = -1;
    revealCol = -1;
    revealTimer = 0;
    letterStates = {};
  }

  function layout() {
    var cw = canvas.width;
    var ch = canvas.height;
    BOARD_X = (cw - COLS * (CELL + GAP) + GAP) / 2;
    BOARD_Y = Math.max(20, (ch - 500) / 2 - 40);
    KEYBOARD_Y = Math.min(BOARD_Y + ROWS * (CELL + GAP) + 30, ch - 210);
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width;
    var h = Math.min(rect.height, window.innerHeight - 80);
    if (h < 500) h = 500;
    W = w; H = h;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function drawRoundRect(x, y, w, h, r) {
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
  }

  function getTileColor(letter, col) {
    if (letter === targetWord[col]) return colors.correct;
    if (targetWord.indexOf(letter) !== -1) {
      // Count how many times this letter appears and hasn't been accounted for
      var correctCount = 0;
      for (var i = 0; i < COLS; i++) {
        if (guessWord[i] === targetWord[i] && guessWord[i] === letter) correctCount++;
      }
      var presentCount = 0;
      for (var j = 0; j <= col; j++) {
        if (guessWord[j] === letter && targetWord[j] !== letter) presentCount++;
      }
      var totalInTarget = 0;
      for (var k = 0; k < COLS; k++) {
        if (targetWord[k] === letter) totalInTarget++;
      }
      if (presentCount <= totalInTarget - correctCount) return colors.present;
      return colors.absent;
    }
    return colors.absent;
  }

  function drawTile(x, y, letter, color) {
    ctx.save();
    if (color) {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    } else {
      ctx.fillStyle = letter ? colors.tileEmpty : colors.tileEmpty;
      ctx.strokeStyle = colors.tileBorder;
    }
    drawRoundRect(x, y, CELL, CELL, 4);
    ctx.fill();
    if (!color || (color === colors.absent && !letter)) {
      ctx.stroke();
    }

    if (letter) {
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 24px "SF Mono", "Menlo", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.toUpperCase(), x + CELL / 2, y + CELL / 2 + 1);
    }
    ctx.restore();
  }

  function drawBoard() {
    // Draw all guesses
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = BOARD_X + c * (CELL + GAP);
        var y = BOARD_Y + r * (CELL + GAP);

        var shaking = (shakeRow === r && shakeTimer > 0);
        if (shaking) {
          var offset = Math.sin(shakeTimer * 0.8) * 8 * (shakeTimer / 30);
          x += offset;
        }

        var letter = '';
        var color = null;

        if (r < guesses.length) {
          letter = guesses[r][c];
          // Check if this row is being revealed
          if (revealRow === r && revealCol > c) {
            color = getTileColor(letter, c);
          } else if (revealRow === r && revealCol === c && revealTimer > 0) {
            // Flipping animation
            var progress = Math.min(1, (30 - revealTimer) / 15);
            if (progress > 0.5) {
              // Show revealed color
              color = getTileColor(letter, c);
              ctx.save();
              var cy = y + CELL / 2;
              var scale = 1 - Math.abs((progress - 0.75) * 4);
              ctx.translate(x + CELL / 2, cy);
              ctx.scale(1, Math.max(0, scale));
              ctx.translate(-(x + CELL / 2), -cy);
              drawTile(x, y, letter, color);
              ctx.restore();
              continue;
            } else {
              // First half of flip - shrink
              ctx.save();
              var cy2 = y + CELL / 2;
              var scale2 = 1 - Math.abs((progress - 0.25) * 4);
              ctx.translate(x + CELL / 2, cy2);
              ctx.scale(1, Math.max(0, scale2));
              ctx.translate(-(x + CELL / 2), -cy2);
              drawTile(x, y, letter, null);
              ctx.restore();
              continue;
            }
          } else if (revealRow === r && revealCol === c && revealTimer <= 0) {
            color = getTileColor(letter, c);
          }
        } else if (r === guesses.length) {
          if (c < currentGuess.length) {
            letter = currentGuess[c];
          }
        }

        drawTile(x, y, letter, color);
      }
    }
  }

  function drawKeyboard() {
    var keyW = (W - 20) / 10 - 4;
    var keyH = 44;

    for (var ri = 0; ri < keyboardRows.length; ri++) {
      var row = keyboardRows[ri];
      var rowWidth = row.length * (keyW + 4) - 4;
      var startX = (W - rowWidth) / 2;

      // Special handling for middle/enter rows
      if (ri === 1) startX = (W - rowWidth) / 2 + keyW / 2;
      if (ri === 2) {
        // Enter key is wider
        rowWidth = (keyW * 1.5) + 4 + (row.length - 2) * (keyW + 4) + (keyW * 1.5);
        startX = (W - rowWidth) / 2;
      }

      var x = startX;
      for (var ci = 0; ci < row.length; ci++) {
        var key = row[ci];
        var kw = keyW;
        if ((ri === 2 && ci === 0) || (ri === 2 && ci === row.length - 1)) {
          kw = keyW * 1.5;
        }

        var y = KEYBOARD_Y + ri * (keyH + 6);

        // Key color based on letter state
        var keyColor = colors.keyInactive;
        if (letterStates[key] === 'correct') keyColor = colors.correct;
        else if (letterStates[key] === 'present') keyColor = colors.present;
        else if (letterStates[key] === 'absent') keyColor = colors.absent;

        drawRoundRect(x, y, kw, keyH, 4);
        ctx.fillStyle = keyColor;
        ctx.fill();

        ctx.fillStyle = colors.keyText;
        ctx.font = 'bold 14px "SF Mono", "Menlo", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, x + kw / 2, y + keyH / 2 + 1);

        x += kw + 4;
      }
    }
  }

  function drawTitle() {
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WORDLE', W / 2, BOARD_Y - 10);
  }

  function drawMessage() {
    if (messageTimer <= 0) return;
    var alpha = Math.min(1, messageTimer / 10);
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(messageText, W / 2, KEYBOARD_Y - 15);
  }

  function draw() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);
    drawTitle();
    drawBoard();
    drawKeyboard();
    drawMessage();
  }

  function submitGuess() {
    if (gameOver) return;
    if (currentGuess.length !== COLS) return;
    if (words.indexOf(currentGuess) === -1) {
      showMessage('Not in word list');
      shakeRow = guesses.length;
      shakeTimer = 30;
      return;
    }

    var guess = currentGuess;
    guesses.push(guess);
    currentGuess = '';
    revealRow = guesses.length - 1;
    revealCol = -1;
    revealTimer = 30; // flip animation duration

    // Check win
    if (guess === targetWord) {
      gameWon = true;
      setTimeout(function () {
        gameOver = true;
        var rowNum = guesses.length;
        var msgs = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
        showMessage(msgs[rowNum - 1] || 'You win!');
      }, 600);
    } else if (guesses.length >= ROWS) {
      setTimeout(function () {
        gameOver = true;
        showMessage(targetWord);
      }, 600);
    }

    // Update letter states
    for (var i = 0; i < COLS; i++) {
      var l = guess[i];
      if (l === targetWord[i]) {
        letterStates[l] = 'correct';
      } else if (targetWord.indexOf(l) !== -1 && letterStates[l] !== 'correct') {
        letterStates[l] = 'present';
      } else if (letterStates[l] !== 'correct' && letterStates[l] !== 'present') {
        letterStates[l] = 'absent';
      }
    }
  }

  function showMessage(msg) {
    messageText = msg;
    messageTimer = 120;
  }

  function handleKey(key) {
    if (gameOver) return;

    if (key === 'Enter' || key === '↵') {
      submitGuess();
    } else if (key === 'Backspace' || key === '⌫' || key === 'Delete') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
      }
    } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < COLS) {
      currentGuess += key.toUpperCase();
    }
  }

  function getKeyAt(x, y) {
    var keyW = (W - 20) / 10 - 4;
    var keyH = 44;

    for (var ri = 0; ri < keyboardRows.length; ri++) {
      var row = keyboardRows[ri];
      var rowWidth = row.length * (keyW + 4) - 4;
      var startX = (W - rowWidth) / 2;
      if (ri === 1) startX = (W - rowWidth) / 2 + keyW / 2;

      var cx = startX;
      for (var ci = 0; ci < row.length; ci++) {
        var kw = keyW;
        if ((ri === 2 && ci === 0) || (ri === 2 && ci === row.length - 1)) {
          kw = keyW * 1.5;
        }
        var cy = KEYBOARD_Y + ri * (keyH + 6);
        if (x >= cx && x <= cx + kw && y >= cy && y <= cy + keyH) {
          return row[ci];
        }
        cx += kw + 4;
      }
    }
    return null;
  }

  function handleTouchStart(e) {
    e.preventDefault();
    if (gameOver) {
      // Tap top area to restart
      var touch = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var tx = touch.clientX - rect.left;
      var ty = touch.clientY - rect.top;
      if (ty < BOARD_Y - 20) {
        resetGame();
      }
      return;
    }
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var tx = touch.clientX - rect.left;
    var ty = touch.clientY - rect.top;

    var key = getKeyAt(tx, ty);
    if (key) {
      handleKey(key);
    }
  }

  function handleKeyDown(e) {
    if (gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        resetGame();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
      }
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < COLS) {
      e.preventDefault();
      currentGuess += e.key.toUpperCase();
    }
  }

  function loop(ts) {
    // Update animations
    if (shakeTimer > 0) shakeTimer--;
    if (messageTimer > 0) messageTimer--;
    if (revealTimer > 0) {
      revealTimer--;
      if (revealTimer === 0 && revealCol < COLS - 1) {
        revealCol++;
        revealTimer = 30;
      } else if (revealTimer === 0 && revealCol >= COLS - 1) {
        revealRow = -1;
        revealCol = -1;
      } else if (revealTimer <= 15 && revealCol < COLS) {
        // Start of reveal for this col
        if (revealCol === -1) revealCol = 0;
      }
    }

    draw();
    animId = requestAnimationFrame(loop);
  }

  window.initGame = function (container) {
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.maxWidth = '100%';
    canvas.style.touchAction = 'manipulation';
    canvas.style.cursor = 'pointer';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resetGame();
    resize();
    layout();

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    animId = requestAnimationFrame(loop);

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      guesses = [];
      currentGuess = '';
      letterStates = {};
    };
    window.__gameCleanup = cleanupFn;
  };
})();