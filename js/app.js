const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const lobbyUI = document.getElementById('lobbyUI');
const matchButton = document.getElementById('matchButton');
const fullscreenWarning = document.getElementById('fullscreenWarning');

canvas.width = 1920;
canvas.height = 1080;

// Declare isPaused before its usage
let isPaused = false;

// Player object
const player = {
  id: socket.id,
  x: 0,
  y: 0,
  radius: 20,
  color: 'blue',
  speed: 5,
  dx: 0,
  dy: 0,
  health: 100,
  magazineSize: 12,
  bullets: 12,
  isReloading: false,
  reloadTime: 2000,
};

// Opponent object
const opponent = {
  id: null,
  x: 0,
  y: 0,
  radius: 20,
  color: 'red',
  health: 100,
};

// Bullets array
const bullets = [];

// Map obstacles (15 total)
const obstacles = [
  { x: 150, y: 150, width: 100, height: 20 },
  { x: 300, y: 300, width: 20, height: 100 },
  { x: 500, y: 100, width: 150, height: 20 },
  { x: 700, y: 400, width: 20, height: 150 },
  { x: 200, y: 500, width: 100, height: 20 },
  { x: 600, y: 200, width: 20, height: 100 },
  { x: 400, y: 250, width: 120, height: 20 },
  { x: 650, y: 350, width: 20, height: 120 },
  { x: 250, y: 450, width: 100, height: 20 },
  { x: 550, y: 150, width: 20, height: 100 },
  { x: 350, y: 500, width: 150, height: 20 },
  { x: 450, y: 100, width: 20, height: 150 },
  { x: 750, y: 300, width: 100, height: 20 },
  { x: 100, y: 400, width: 20, height: 100 },
  { x: 600, y: 50, width: 150, height: 20 },
];

// Spawn points
const spawnPoints = {
  player: { x: 100, y: 100 }, // Top-left corner
  opponent: { x: 1820, y: 980 }, // Bottom-right corner (1920x1080 minus player radius)
};

// Handle keyboard input
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  // Reload on 'r' key press
  if (e.key === 'r' && !player.isReloading && player.bullets < player.magazineSize) {
    reloadMagazine();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Join matchmaking lobby
matchButton.addEventListener('click', () => {
  socket.emit('joinLobby');
  lobbyUI.style.display = 'none';
});

// Handle Fullscreen Requirement
function checkFullscreen() {
  if (window.innerWidth < 1920 || window.innerHeight < 1080) {
    pauseGame();
    fullscreenWarning.style.display = 'flex';
  } else {
    resumeGame();
    fullscreenWarning.style.display = 'none';
  }
}

window.addEventListener('resize', checkFullscreen);

// Initial check
checkFullscreen();

// Pause and Resume Game
function pauseGame() {
  isPaused = true;
}

function resumeGame() {
  if (isPaused) {
    isPaused = false;
    update();
  }
}

// Move player based on keys pressed
function movePlayer() {
  if (isPaused) return;

  if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
  if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
  if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
  if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;

  const newX = player.x + player.dx;
  const newY = player.y + player.dy;

  // Check collision with map obstacles
  if (
    !isCollidingWithObstacles(newX, player.y, player.radius) &&
    !isCollidingWithObstacles(player.x, newY, player.radius)
  ) {
    player.x = newX;
    player.y = newY;
    socket.emit('playerMove', { x: player.x, y: player.y });
  }

  // Boundary checks
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  player.dx = 0;
  player.dy = 0;
}

// Check collision with obstacles
function isCollidingWithObstacles(x, y, radius) {
  for (let obstacle of obstacles) {
    if (
      x + radius > obstacle.x &&
      x - radius < obstacle.x + obstacle.width &&
      y + radius > obstacle.y &&
      y - radius < obstacle.y + obstacle.height
    ) {
      return true;
    }
  }
  return false;
}

// Draw player on the canvas
function drawPlayer(playerData) {
  ctx.beginPath();
  ctx.arc(playerData.x, playerData.y, playerData.radius, 0, Math.PI * 2);
  ctx.fillStyle = playerData.color;
  ctx.fill();
  ctx.closePath();
}

// Draw obstacles
function drawObstacles() {
  ctx.fillStyle = 'gray';
  obstacles.forEach(obstacle => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

// Handle shooting
window.addEventListener('mousedown', (e) => {
  if (player.bullets > 0 && !player.isReloading && !isPaused) {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    const bullet = {
      x: player.x,
      y: player.y,
      radius: 5,
      color: 'yellow',
      angle: angle,
      speed: 10,
      owner: socket.id,
    };
    bullets.push(bullet);
    player.bullets -= 1;
    socket.emit('shoot', bullet);

    // If magazine is empty after shooting, start reloading
    if (player.bullets === 0) {
      reloadMagazine();
    }
  }
});

// Reload magazine
function reloadMagazine() {
  player.isReloading = true;
  socket.emit('reload');

  setTimeout(() => {
    player.bullets = player.magazineSize;
    player.isReloading = false;
  }, player.reloadTime);
}

// Update and draw bullets
function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;

    // Check collision with obstacles
    if (isCollidingWithObstacles(bullet.x, bullet.y, bullet.radius)) {
      bullets.splice(index, 1);
      return;
    }

    // Check collision with opponent
    if (opponent.id && bullet.owner !== opponent.id) {
      const dist = Math.hypot(bullet.x - opponent.x, bullet.y - opponent.y);
      if (dist < bullet.radius + opponent.radius) {
        bullets.splice(index, 1);
        socket.emit('playerHit', { damage: 10 });
        return;
      }
    }

    // Remove bullets that go off-screen
    if (
      bullet.x < 0 || bullet.x > canvas.width ||
      bullet.y < 0 || bullet.y > canvas.height
    ) {
      bullets.splice(index, 1);
    }
  });

  bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = bullet.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Handle opponent movement
socket.on('playerMove', (data) => {
  if (opponent.id !== data.id) {
    opponent.id = data.id;
  }
  opponent.x = data.x;
  opponent.y = data.y;
});

// Handle shooting from opponent
socket.on('shoot', (data) => {
  const bullet = {
    x: data.x,
    y: data.y,
    radius: data.radius,
    color: data.color,
    angle: data.angle,
    speed: data.speed,
    owner: data.owner,
  };
  bullets.push(bullet);
});

// Handle opponent reloading
socket.on('reload', () => {
  // Optional: Add visual feedback for opponent reloading
});

// Handle opponent hit
socket.on('playerHit', (data) => {
  // Check if the hit was on this player
  player.health -= data.damage;
  if (player.health <= 0) {
    alert('You Lose!');
    resetGame();
    window.location.href = '/gameover';
  }
  // Optionally, update opponent's health if needed
});

// Handle opponent's health update
socket.on('opponentHealth', (data) => {
  opponent.health = data.health;
});

// Handle spawning
socket.on('spawn', (data) => {
  player.x = data.x;
  player.y = data.y;
  document.getElementById('gameCanvas').style.display = 'block';
  update();
});

// Handle game over
socket.on('gameOver', (data) => {
  if (data.result === 'win') {
    alert('You Win!');
    window.location.href = '/gameover';
  } else if (data.result === 'lose') {
    alert('You Lose!');
    window.location.href = '/gameover';
  }
  resetGame();
});

// Draw opponent
function drawOpponent() {
  if (opponent.id) {
    drawPlayer(opponent);
  }
}

// Health HUD and Ammo HUD
function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Health: ${player.health}`, 20, 30);
  ctx.fillText(`Bullets: ${player.bullets}/${player.magazineSize}`, 20, 60);
  if (player.isReloading) {
    ctx.fillText(`Reloading...`, 20, 90);
  }
  if (opponent.id) {
    ctx.fillText(`Opponent Health: ${opponent.health}`, 20, 120);
  }
}

// Reset game
function resetGame() {
  player.health = 100;
  player.bullets = player.magazineSize;
  player.isReloading = false;
  opponent.health = 100;
  bullets.length = 0;
  socket.emit('playerReset');
}

// Game loop
function update() {
  if (isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawObstacles();
  movePlayer();
  drawPlayer(player);
  drawOpponent();
  updateBullets();
  drawHUD();
  requestAnimationFrame(update);
}

// Start the game when a match is found
socket.on('matchFound', (data) => {
  console.log('Match found with:', data.opponent);
  opponent.id = data.opponent;
  socket.emit('spawn');
});

// Handle waiting state
socket.on('waiting', () => {
  console.log('Waiting for an opponent...');
});
