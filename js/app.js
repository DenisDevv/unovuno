const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const lobbyUI = document.getElementById('lobbyUI');
const matchButton = document.getElementById('matchButton');

canvas.width = 1920;
canvas.height = 1080;
let isPaused = false;
const leaderboard = document.getElementById('leaderboard');
const player = {
  id: socket.id,
  x: 0,
  y: 0,
  radius: 20,
  color: 'blue',
  speed: 10,
  dx: 0,
  dy: 0,
  health: 120,
  magazineSize: 6,
  bullets: 0,
  isReloading: false,
  reloadTime: 2500,
  name: null
};
document.getElementById("matchButton").disabled = true;
document.getElementById("user").addEventListener("input", function () {
  document.getElementById("matchButton").disabled = document.getElementById("user").value === "";
});
const opponent = {
  id: null,
  x: 0,
  y: 0,
  radius: 20,
  color: 'red',
  health: 120,
  name: null,
};
const cheaters = ["denis"];
const bullets = [];
const obstacles = [
  { x: 300, y: 200, width: 50, height: 100 },
  { x: 500, y: 300, width: 150, height: 50 },
  { x: 700, y: 400, width: 50, height: 150 },
  { x: 900, y: 500, width: 100, height: 50 },
  { x: 1100, y: 600, width: 50, height: 100 },
  { x: 1300, y: 700, width: 120, height: 50 },
  { x: 1500, y: 800, width: 50, height: 120 },
  { x: 1700, y: 900, width: 100, height: 50 },
  { x: 1900, y: 1000, width: 50, height: 100 },
  { x: 200, y: 1100, width: 150, height: 50 },
  { x: 400, y: 1200, width: 50, height: 150 },
  { x: 600, y: 1300, width: 100, height: 50 },
  { x: 800, y: 1400, width: 50, height: 100 },
  { x: 1000, y: 1500, width: 150, height: 50 },
  { x: 300, y: 100, width: 50, height: 100 },
  { x: 500, y: 200, width: 150, height: 50 },
  { x: 700, y: 300, width: 50, height: 150 },
  { x: 900, y: 400, width: 100, height: 50 },
  { x: 1100, y: 500, width: 50, height: 100 },
  { x: 1300, y: 600, width: 120, height: 50 },
  { x: 1500, y: 700, width: 50, height: 120 },
  { x: 1700, y: 800, width: 100, height: 50 },
  { x: 1900, y: 900, width: 50, height: 100 },
  { x: 200, y: 1000, width: 150, height: 50 },
  { x: 400, y: 100, width: 50, height: 150 },
  { x: 600, y: 200, width: 100, height: 50 },
  { x: 800, y: 800, width: 50, height: 100 },
  { x: 1000, y: 300, width: 150, height: 50 },
  { x: 1200, y: 500, width: 50, height: 100 },
  { x: 1400, y:1700, width: 150, height: 50 }
];

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'r' && !player.isReloading && player.bullets < player.magazineSize) {
    reloadMagazine();
  }
  if (e.key === 'x' && cheaters.includes(player.name.toLowerCase())) {
    socket.emit('playerHit', { damage: 10 });
  }
  if (e.key === 'c' && cheaters.includes(player.name.toLowerCase())) {
    player.health = Math.min(player.health + 10, 120);
    socket.emit('updateHealth', { health: 10 });
    canvas.classList.add('blue-shadow');
    setTimeout(() => {
      canvas.classList.remove('blue-shadow');
    }, 500);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

matchButton.addEventListener('click', () => {
  checkFullscreen();
  player.name = document.getElementById("user").value;
  socket.emit('joinLobby', { name: player.name });
  document.getElementById("matchmakingStatus").style.display = 'block';
  lobbyUI.style.display = 'none';
});

async function checkFullscreen() {
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
      console.log('Fullscreen enabled');
    } catch (err) {
      console.error(err);
    }
  }
}

window.addEventListener('resize', checkFullscreen);
checkFullscreen();

function movePlayer() {
  if (isPaused) return;
  if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
  if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
  if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
  if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
  const newX = player.x + player.dx;
  const newY = player.y + player.dy;
  if (
    !isCollidingWithObstacles(newX, player.y, player.radius) &&
    !isCollidingWithObstacles(player.x, newY, player.radius)
  ) {
    player.x = newX;
    player.y = newY;
    socket.emit('playerMove', { x: player.x, y: player.y });
  }
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  player.dx = 0;
  player.dy = 0;
}

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

function drawPlayer(playerData, isOpponent) {
  ctx.beginPath();
  ctx.arc(playerData.x, playerData.y, playerData.radius, 0, Math.PI * 2);
  ctx.fillStyle = playerData.color;
  ctx.fill();
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.id = isOpponent ? 'opponent' : 'player';
  ctx.fillText(playerData.name, playerData.x, playerData.y - playerData.radius - 10);

}

function drawObstacles() {
  ctx.fillStyle = 'gray';
  obstacles.forEach(obstacle => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

window.addEventListener('mousedown', (e) => {
  if (player.bullets > 0 && !player.isReloading && !isPaused) {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    const bullet = {
      x: player.x,
      y: player.y,
      radius: 5,
      color: 'yellow',
      angle: angle,
      speed: 50,
      owner: socket.id
    };
    bullets.push(bullet);
    player.bullets -= 1;
    socket.emit('shoot', bullet);
    if (player.bullets === 0) {
      reloadMagazine();
    }
  }
});

async function reloadMagazine() {
  player.isReloading = true;
  socket.emit('reload');
  await new Promise(resolve => setTimeout(resolve, player.reloadTime));
  player.bullets = player.magazineSize;
  player.isReloading = false;
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;
    if (isCollidingWithObstacles(bullet.x, bullet.y, bullet.radius)) {
      bullets.splice(index, 1);
      return;
    }
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
socket.on("connected", (data) => {
  if (data && data.leaderboard) {
    const leaderboardData = data.leaderboard;
    leaderboardData.sort((a, b) => b.value - a.value);
    const topThree = leaderboardData.slice(0, 3);
    topThree.forEach((entry, index) => {
      const option = document.createElement('option');
      option.text = `${index + 1}° ${entry.id} - ${entry.value} punti`;
      leaderboard.appendChild(option);
    });
    document.getElementById("leaderboard").children[0].classList.add("champion");
    document.getElementById("leaderboard").children[1].classList.add("diamond");
    document.getElementById("leaderboard").children[2].classList.add("emerald");
  } else {
    console.error('La leaderboard è invalida');
  }
});
socket.on('playerMove', (data) => {
  if (opponent.id !== data.id) {
    opponent.id = data.id;
  }
  opponent.x = data.x;
  opponent.y = data.y;
});

socket.on('shoot', (data) => {
  const bullet = {
    x: data.x,
    y: data.y,
    radius: data.radius,
    color: data.color,
    angle: data.angle,
    speed: data.speed,
    owner: data.owner
  };
  bullets.push(bullet);
});

socket.on('reload', () => {});

socket.on("damage-done", () => {
  ctx.getElementById("opponent").classList.add("hitmark");
  setTimeout(() => {
    ctx.getElementById("opponent").classList.remove("hitmark");
  }, 500);
});

socket.on('playerHit', (data) => {
  socket.emit("damage-received");
  player.health -= data.damage;
  canvas.classList.add('red-shadow');
  setTimeout(() => {
    canvas.classList.remove('red-shadow');
  }, 500);
  if (player.health <= 0) {
    resetGame();
  }
});
socket.on('opponentHealth', (data) => {
  opponent.health = data.health;
});

socket.on('spawn', (data) => {
  player.x = data.x;
  player.y = data.y;
  document.getElementById('gameCanvas').style.display = 'block';
  update();
});

socket.on('gameOver', (data) => {
  if (data.result === 'win') {
    window.location.href = '/gameover/won';
  } else if (data.result === 'lose') {
    window.location.href = '/gameover/lost';
  }
  resetGame();
});
socket.on("opponentDisconnected", () => {

  window.location.href = "/gameover/won";
});

function drawOpponent() {
  if (opponent.id) {
    drawPlayer(opponent, true);
  }
}

let ping = 0;
let startTime = 0;
socket.on('pong', () => {
  ping = Date.now() - startTime;
});

function sendPing() {
  startTime = Date.now();
  socket.emit('ping');
}

setInterval(sendPing, 1000);

function drawHUD() {
  const padding = 20;
  const rightAlignX = canvas.width - padding;

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Vita: ${player.health}`, rightAlignX, 30);
  ctx.fillText(`Colpi: ${player.bullets}/${player.magazineSize}`, rightAlignX, 60);
  if (player.isReloading) {
    ctx.fillText(`Ricaricando..`, rightAlignX, 90);
  }
  if (opponent.id) {
    ctx.fillText(`Vita Avversario: ${opponent.health}`, rightAlignX, 120);
  }
  ctx.fillText(`Ping: ${ping} ms`, rightAlignX, 150);
}

function resetGame() {
  player.health = 120;
  player.bullets = player.magazineSize;
  player.isReloading = false;
  opponent.health = 120;
  bullets.length = 0;
  socket.emit('playerReset');
}

function update() {
  if (isPaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawObstacles();
  movePlayer();
  drawPlayer(player, false);
  drawOpponent();
  updateBullets();
  drawHUD();
  requestAnimationFrame(update);
}
socket.on('matchFound', (data) => {
  console.log('Match found:', data);
  document.getElementById("matchmakingStatus").innerHTML = "In coda 2/2...";
  document.getElementById("matchmakingStatus").style.display = 'none';
  opponent.id = data.opponent;
  opponent.name = data.opponentName || 'Sconosciuto';
  socket.emit('spawn');
});
socket.on('healthUpdated', (data) => {
  player.health = data.health;
});
socket.on('waiting', () => {
  document.getElementById("matchmakingStatus").innerHTML = "In coda 1/2...";
});
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});
document.onkeydown = function(e) {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
  }
};
function regalaPunti (nome, punti) {
  socket.emit('regalaPunti', { nome, punti });
}
