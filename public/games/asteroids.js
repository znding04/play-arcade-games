/**
 * Asteroids - Classic Space Shooter
 * Controls: Arrow keys or WASD to rotate/thrust, Space to shoot
 */
(function () {
  var canvas, ctx, w, h;
  var ship, asteroids, bullets, particles;
  var score, lives, level, gameOver, gameWon;
  var keys = {};
  var lastShot = 0;
  var animId;
  var cleanupFn;

  // Poly shape for the ship
  function createShip() {
    return {
      x: w / 2,
      y: h / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: 14,
      thrusting: false,
      rotAngle: 0
    };
  }

  // Random asteroid size
  function newAsteroid(x, y, size) {
    var r = size === 'large' ? 50 : size === 'medium' ? 28 : 14;
    var speed = size === 'large' ? 1.5 : size === 'medium' ? 2.5 : 3.5;
    var angle = Math.random() * Math.PI * 2;
    return {
      x: x !== undefined ? x : Math.random() * w,
      y: y !== undefined ? y : Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: r,
      size: size,
      angle: 0,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      vertices: generateAsteroidVertices(r)
    };
  }

  function generateAsteroidVertices(r) {
    var verts = [];
    var n = 8 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var d = r * (0.75 + Math.random() * 0.5);
      verts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d });
    }
    return verts;
  }

  function createBullet(x, y, angle, vx, vy) {
    return { x: x, y: y, vx: vx, vy: vy, life: 60 };
  }

  function createParticle(x, y, color) {
    return {
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 30 + Math.random() * 20,
      color: color || '#fff'
    };
  }

  function wrap(obj) {
    if (obj.x < -obj.radius) obj.x = w + obj.radius;
    if (obj.x > w + obj.radius) obj.x = -obj.radius;
    if (obj.y < -obj.radius) obj.y = h + obj.radius;
    if (obj.y > h + obj.radius) obj.y = -obj.radius;
  }

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function initAsteroids() {
    asteroids = [];
    for (var i = 0; i < 4 + level; i++) {
      var a = newAsteroid();
      // Spawn away from ship
      while (dist(a, ship) < 120) {
        a.x = Math.random() * w;
        a.y = Math.random() * h;
      }
      asteroids.push(a);
    }
  }

  function startLevel() {
    bullets = [];
    particles = [];
    initAsteroids();
  }

  function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    gameWon = false;
    ship = createShip();
    startLevel();
  }

  function drawShip(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();
    if (s.thrusting) {
      ctx.strokeStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(-20 - Math.random() * 8, 0);
      ctx.lineTo(-8, 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
    for (var i = 1; i < a.vertices.length; i++) {
      ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(b) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life / 50;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function update() {
    if (gameOver || gameWon) return;

    // Ship rotation
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.06;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.06;

    // Thrust
    ship.thrusting = keys['ArrowUp'] || keys['KeyW'];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * 0.12;
      ship.vy += Math.sin(ship.angle) * 0.12;
    }

    // Friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    wrap(ship);

    // Shooting
    if (keys['Space'] && Date.now() - lastShot > 150) {
      lastShot = Date.now();
      var speed = 10;
      bullets.push(createBullet(
        ship.x + Math.cos(ship.angle) * 20,
        ship.y + Math.sin(ship.angle) * 20,
        ship.angle,
        Math.cos(ship.angle) * speed + ship.vx * 0.5,
        Math.sin(ship.angle) * speed + ship.vy * 0.5
      ));
    }

    // Update bullets
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 || b.x < 0 || b.x > w || b.y < 0 || b.y > h) {
        bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (var j = 0; j < asteroids.length; j++) {
      var a = asteroids[j];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotSpeed;
      wrap(a);
    }

    // Bullet-asteroid collision
    for (var k = bullets.length - 1; k >= 0; k--) {
      for (var m = asteroids.length - 1; m >= 0; m--) {
        if (dist(bullets[k], asteroids[m]) < asteroids[m].radius) {
          // Explosion particles
          for (var p = 0; p < 8; p++) {
            particles.push(createParticle(asteroids[m].x, asteroids[m].y, '#aaa'));
          }
          // Split asteroid
          var oldA = asteroids[m];
          var newSize = oldA.size === 'large' ? 'medium' : oldA.size === 'medium' ? 'small' : null;
          if (newSize) {
            asteroids.push(newAsteroid(oldA.x, oldA.y, newSize));
            asteroids.push(newAsteroid(oldA.x, oldA.y, newSize));
          }
          score += oldA.size === 'large' ? 20 : oldA.size === 'medium' ? 50 : 100;
          asteroids.splice(m, 1);
          bullets.splice(k, 1);
          break;
        }
      }
    }

    // Update particles
    for (var q = particles.length - 1; q >= 0; q--) {
      var pt = particles[q];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particles.splice(q, 1);
    }

    // Ship-asteroid collision
    for (var r = 0; r < asteroids.length; r++) {
      if (dist(ship, asteroids[r]) < asteroids[r].radius + ship.radius - 4) {
        for (var sp = 0; sp < 15; sp++) {
          particles.push(createParticle(ship.x, ship.y, '#fff'));
        }
        lives--;
        if (lives <= 0) {
          gameOver = true;
        } else {
          ship = createShip();
          bullets = [];
        }
        break;
      }
    }

    // Next level
    if (asteroids.length === 0) {
      level++;
      if (level > 5) {
        gameWon = true;
      } else {
        ship = createShip();
        startLevel();
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw stars
    ctx.fillStyle = '#334';
    for (var i = 0; i < 80; i++) {
      var sx = ((i * 137.5) % w);
      var sy = ((i * 97.3) % h);
      ctx.fillRect(sx, sy, 1, 1);
    }

    for (var j = 0; j < asteroids.length; j++) drawAsteroid(asteroids[j]);
    for (var k = 0; k < bullets.length; k++) drawBullet(bullets[k]);
    for (var l = 0; l < particles.length; l++) drawParticle(particles[l]);

    if (!gameOver && !gameWon) drawShip(ship);

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 12, 28);
    ctx.textAlign = 'right';
    ctx.fillText('LIVES: ' + '❤'.repeat(lives), w - 12, 28);
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL ' + level, w / 2, 28);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('Score: ' + score, w / 2, h / 2 + 20);
      ctx.fillText('Press ENTER to restart', w / 2, h / 2 + 60);
    }

    if (gameWon) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', w / 2, h / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('Final Score: ' + score, w / 2, h / 2 + 20);
      ctx.fillText('Press ENTER to restart', w / 2, h / 2 + 60);
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function handleKey(e) {
    keys[e.code] = e.type === 'keydown';
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'Enter' && (gameOver || gameWon)) {
      startGame();
    }
  }

  function resize() {
    var container = canvas.parentElement;
    w = canvas.width = container.clientWidth;
    h = canvas.height = container.clientHeight;
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
