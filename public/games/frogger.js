/**
 * Frogger - Classic Road Crossing Game
 * Controls: Arrow keys to move, reach the top to score
 */
(function () {
  var canvas, ctx, w, h;
  var frog, lanes, logs, turtles, cars;
  var score, lives, gameOver;
  var keys = {};
  var animId;
  var cleanupFn;
  var gridSize = 40;
  var cols, rows;

  function createFrog(x, y) {
    return {
      x: x !== undefined ? x : cols * gridSize / 2,
      y: y !== undefined ? y : (rows - 1) * gridSize,
      size: gridSize * 0.8,
      laneIndex: rows - 1,
      safe: false,
      moving: false
    };
  }

  function initLanes() {
    lanes = [];
    cars = [];
    logs = [];
    turtles = [];

    // Lane types: 0=road, 1=water, 2=grass, 3=goal
    var laneTypes = [
      { type: 'goal' },
      { type: 'water', speed: 1.5, dir: -1, objects: 'log' },
      { type: 'water', speed: 2, dir: 1, objects: 'log' },
      { type: 'water', speed: 1, dir: -1, objects: 'turtle' },
      { type: 'grass' },
      { type: 'road', speed: 2.5, dir: 1, objects: 'car' },
      { type: 'road', speed: 3, dir: -1, objects: 'car' },
      { type: 'road', speed: 2, dir: 1, objects: 'truck' },
      { type: 'road', speed: 4, dir: -1, objects: 'car' },
      { type: 'grass' },
      { type: 'grass' },
      { type: 'goal' },
    ];

    var y = gridSize;
    for (var i = 0; i < laneTypes.length; i++) {
      var lane = { y: y, type: laneTypes[i].type };
      if (laneTypes[i].type === 'road') {
        lane.speed = laneTypes[i].speed;
        lane.dir = laneTypes[i].dir;
        lane.objects = [];
        var numCars = 2 + Math.floor(Math.random() * 2);
        var spacing = w / numCars;
        for (var j = 0; j < numCars; j++) {
          var carType = laneTypes[i].objects === 'truck' ? 'truck' : 'car';
          lane.objects.push({
            x: j * spacing + Math.random() * spacing * 0.3,
            y: y + 5,
            width: carType === 'truck' ? gridSize * 2.5 : gridSize * 1.5,
            height: gridSize * 0.6,
            speed: lane.speed * lane.dir,
            type: carType
          });
        }
        cars.push(lane);
      } else if (laneTypes[i].type === 'water') {
        lane.speed = laneTypes[i].speed;
        lane.dir = laneTypes[i].dir;
        lane.objects = [];
        var numLogs = 2 + Math.floor(Math.random() * 2);
        var spacing = w / numLogs;
        var objType = laneTypes[i].objects;
        for (var j = 0; j < numLogs; j++) {
          lane.objects.push({
            x: j * spacing + Math.random() * spacing * 0.3,
            y: y + 5,
            width: objType === 'log' ? gridSize * 3 : gridSize * 2.5,
            height: gridSize * 0.7,
            speed: lane.speed * lane.dir,
            type: objType
          });
        }
        if (objType === 'log') {
          logs.push(lane);
        } else {
          turtles.push(lane);
        }
      }
      lanes.push(lane);
      y += gridSize;
    }
  }

  function startGame() {
    cols = Math.floor(w / gridSize);
    rows = lanes ? lanes.length + 2 : 14;
    score = 0;
    lives = 3;
    gameOver = false;
    frog = createFrog();
    initLanes();
  }

  function moveFrog(dir) {
    if (frog.moving || gameOver) return;
    var newX = frog.x;
    var newY = frog.y;

    switch(dir) {
      case 'up':
        newY -= gridSize;
        frog.laneIndex = Math.max(0, frog.laneIndex - 1);
        break;
      case 'down':
        newY += gridSize;
        frog.laneIndex = Math.min(rows - 1, frog.laneIndex + 1);
        break;
      case 'left':
        newX -= gridSize;
        break;
      case 'right':
        newX += gridSize;
        break;
    }

    // Boundary check
    if (newX < 0 || newX > w - frog.size || newY < gridSize || newY > h - gridSize) return;

    frog.x = newX;
    frog.y = newY;
    frog.moving = true;
    frog.safe = false;

    setTimeout(function() { frog.moving = false; }, 100);

    // Check if reached goal
    if (frog.y <= gridSize * 2) {
      score += 100;
      frog = createFrog();
      // Speed up slightly
      for (var i = 0; i < lanes.length; i++) {
        if (lanes[i].speed) {
          lanes[i].speed *= 1.02;
          for (var j = 0; j < lanes[i].objects.length; j++) {
            lanes[i].objects[j].speed = lanes[i].speed * (lanes[i].dir || 1);
          }
        }
      }
    }
  }

  function update() {
    if (gameOver) return;

    // Handle input
    if (keys['ArrowUp'] || keys['KeyW']) moveFrog('up');
    if (keys['ArrowDown'] || keys['KeyS']) moveFrog('down');
    if (keys['ArrowLeft'] || keys['KeyA']) moveFrog('left');
    if (keys['ArrowRight'] || keys['KeyD']) moveFrog('right');

    // Update cars
    for (var i = 0; i < cars.length; i++) {
      var lane = cars[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        obj.x += obj.speed;
        if (obj.x > w) obj.x = -obj.width;
        if (obj.x + obj.width < 0) obj.x = w;

        // Collision check
        if (frog.y === lane.y && frog.x + frog.size > obj.x && frog.x < obj.x + obj.width) {
          die();
          return;
        }
      }
    }

    // Update logs
    var onLog = false;
    for (var i = 0; i < logs.length; i++) {
      var lane = logs[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        obj.x += obj.speed;
        if (obj.x > w) obj.x = -obj.width;
        if (obj.x + obj.width < 0) obj.x = w;

        // Check if frog is on this log
        if (frog.y === lane.y && frog.x + frog.size > obj.x && frog.x < obj.x + obj.width) {
          onLog = true;
          frog.x += obj.speed;
          break;
        }
      }
    }

    // Update turtles
    for (var i = 0; i < turtles.length; i++) {
      var lane = turtles[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        obj.x += obj.speed;
        if (obj.x > w) obj.x = -obj.width;
        if (obj.x + obj.width < 0) obj.x = w;

        // Check if frog is on this turtle
        if (frog.y === lane.y && frog.x + frog.size > obj.x && frog.x < obj.x + obj.width) {
          onLog = true;
          frog.x += obj.speed;
          break;
        }
      }
    }

    // Boundary check for water lanes
    if (frog.y > gridSize * 3 && frog.y < h - gridSize) {
      var laneType = lanes[frog.laneIndex - 1] ? lanes[frog.laneIndex - 1].type : 'road';
      if (laneType === 'water' && !onLog) {
        die();
        return;
      }
    }

    // Frog went off screen on log
    if (frog.x < -frog.size || frog.x > w) {
      die();
      return;
    }
  }

  function die() {
    lives--;
    if (lives <= 0) {
      gameOver = true;
    } else {
      frog = createFrog();
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw lanes
    var y = gridSize;
    for (var i = 0; i < lanes.length; i++) {
      var lane = lanes[i];
      switch(lane.type) {
        case 'water':
          ctx.fillStyle = '#0f4c75';
          ctx.fillRect(0, lane.y, w, gridSize);
          break;
        case 'road':
          ctx.fillStyle = '#3d3d3d';
          ctx.fillRect(0, lane.y, w, gridSize);
          // Road markings
          ctx.strokeStyle = '#f1f1f1';
          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(0, lane.y + gridSize / 2);
          ctx.lineTo(w, lane.y + gridSize / 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'grass':
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(0, lane.y, w, gridSize);
          break;
        case 'goal':
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, lane.y, w, gridSize);
          // Goal indicators
          for (var gx = 0; gx < w; gx += gridSize) {
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(gx + 5, lane.y + 5, gridSize - 10, gridSize - 10);
          }
          break;
      }
      y += gridSize;
    }

    // Draw logs
    ctx.fillStyle = '#8B4513';
    for (var i = 0; i < logs.length; i++) {
      var lane = logs[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        // Log detail
        ctx.strokeStyle = '#654321';
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }
    }

    // Draw turtles
    for (var i = 0; i < turtles.length; i++) {
      var lane = turtles[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        // Draw turtle shell
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath();
        ctx.ellipse(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.ellipse(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 3, obj.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw cars
    for (var i = 0; i < cars.length; i++) {
      var lane = cars[i];
      for (var j = 0; j < lane.objects.length; j++) {
        var obj = lane.objects[j];
        // Car body
        ctx.fillStyle = obj.type === 'truck' ? '#e74c3c' : ['#3498db', '#e67e22', '#9b59b6', '#1abc9c'][j % 4];
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        // Windows
        ctx.fillStyle = '#85c1e9';
        if (obj.dir > 0) {
          ctx.fillRect(obj.x + 5, obj.y + 5, obj.width * 0.2, obj.height - 10);
        } else {
          ctx.fillRect(obj.x + obj.width * 0.75, obj.y + 5, obj.width * 0.2, obj.height - 10);
        }
      }
    }

    // Draw frog
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(frog.x + frog.size / 2, frog.y + frog.size / 2, frog.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(frog.x + frog.size * 0.3, frog.y + frog.size * 0.3, frog.size * 0.15, 0, Math.PI * 2);
    ctx.arc(frog.x + frog.size * 0.7, frog.y + frog.size * 0.3, frog.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(frog.x + frog.size * 0.3, frog.y + frog.size * 0.3, frog.size * 0.08, 0, Math.PI * 2);
    ctx.arc(frog.x + frog.size * 0.7, frog.y + frog.size * 0.3, frog.size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Draw HUD
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, gridSize);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Score: ' + score, 10, 28);
    ctx.fillText('Lives: ' + lives, w - 100, 28);

    // Game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText('Score: ' + score, w / 2, h / 2 + 20);
      ctx.fillText('Press ENTER to restart', w / 2, h / 2 + 60);
      ctx.textAlign = 'left';
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function handleKey(e) {
    keys[e.code] = e.type === 'keydown';
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'Enter' && gameOver) {
      startGame();
    }
  }

  function resize() {
    var container = canvas.parentElement;
    w = canvas.width = container.clientWidth;
    h = canvas.height = container.clientHeight;
    gridSize = Math.max(30, Math.min(50, h / 16));
    if (frog) {
      frog.x = Math.min(frog.x, w - frog.size);
      frog.y = Math.min(frog.y, h - frog.size);
    }
  }

  window.initGame = function (container) {
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);

    startGame();
    loop();

    cleanupFn = function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      keys = {};
    };
    window.__gameCleanup = cleanupFn;
  };
})();
