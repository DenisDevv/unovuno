const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('./'));

let lobby = [];
const spawnPoints = [
  { x: 100, y: 100 }, // Top-left corner
  { x: 1820, y: 980 }, // Bottom-right corner (1920x1080 minus player radius)
];

// Player states
const players = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  // Handle joining lobby
  socket.on('joinLobby', () => {
    lobby.push(socket.id);
    socket.emit('waiting');
    if (lobby.length >= 2) {
      const player1 = lobby.shift();
      const player2 = lobby.shift();

      // Assign spawn locations
      const spawn1 = spawnPoints[0];
      const spawn2 = spawnPoints[1];

      // Initialize player states
      players[player1] = { health: 100, opponent: player2 };
      players[player2] = { health: 100, opponent: player1 };

      // Notify both players
      io.to(player1).emit('matchFound', { opponent: player2 });
      io.to(player2).emit('matchFound', { opponent: player1 });

      // Assign spawn locations
      io.to(player1).emit('spawn', spawn1);
      io.to(player2).emit('spawn', spawn2);
    }
  });

  // Handle player movement
  socket.on('playerMove', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('playerMove', { id: socket.id, x: data.x, y: data.y });
    }
  });

  // Handle shooting
  socket.on('shoot', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('shoot', data);
    }
  });

  // Handle reloading
  socket.on('reload', () => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('reload');
    }
  });

  // Handle player hit
  socket.on('playerHit', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId && players[opponentId]) {
      players[opponentId].health -= data.damage;
      // Ensure health doesn't drop below 0
      if (players[opponentId].health < 0) players[opponentId].health = 0;

      // Emit updated health to both players
      io.to(opponentId).emit('playerHit', { damage: data.damage });
      io.to(socket.id).emit('opponentHealth', { health: players[opponentId].health });

      // Check for game over
      if (players[opponentId].health <= 0) {
        io.to(socket.id).emit('gameOver', { result: 'win' });
        io.to(opponentId).emit('gameOver', { result: 'lose' });
        // Reset player states
        players[socket.id].health = 100;
        players[opponentId].health = 100;
      }
    }
  });

  // Handle reset
  socket.on('playerReset', () => {
    if (players[socket.id]) {
      players[socket.id].health = 100;
      io.to(socket.id).emit('resetConfirmed');
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    // Remove from lobby if present
    lobby = lobby.filter(id => id !== socket.id);
    // Notify opponent if any
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('opponentDisconnected');
      // Reset opponent's health
      players[opponentId].health = 100;
      // Remove opponent's reference
      delete players[opponentId].opponent;
    }
    delete players[socket.id];
  });
});
app.get("/gameover", (req, res) => {
  res.sendFile(__dirname + "/gameover.html");
});
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
