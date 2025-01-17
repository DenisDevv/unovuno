const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('./'));

let lobby = [];
const spawnPoints = [
  { x: 100, y: 100 },
  { x: 1720, y: 780 },
];

const players = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinLobby', () => {
    lobby.push(socket.id);
    socket.emit('waiting');
    if (lobby.length >= 2) {
      const player1 = lobby.shift();
      const player2 = lobby.shift();
      const spawn1 = spawnPoints[0];
      const spawn2 = spawnPoints[1];
      players[player1] = { health: 120, opponent: player2 };
      players[player2] = { health: 120, opponent: player1 };
      io.to(player1).emit('matchFound', { opponent: player2 });
      io.to(player2).emit('matchFound', { opponent: player1 });
      io.to(player1).emit('spawn', spawn1);
      io.to(player2).emit('spawn', spawn2);
    }
  });

  socket.on('playerMove', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('playerMove', { id: socket.id, x: data.x, y: data.y });
    }
  });

  socket.on('shoot', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('shoot', data);
    }
  });

  socket.on('reload', () => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('reload');
    }
  });

  socket.on('playerHit', (data) => {
    const opponentId = players[socket.id]?.opponent;
    if (opponentId && players[opponentId]) {
      players[opponentId].health -= data.damage;
      if (players[opponentId].health < 0) players[opponentId].health = 0;
      io.to(opponentId).emit('playerHit', { damage: data.damage });
      io.to(socket.id).emit('opponentHealth', { health: players[opponentId].health });
      if (players[opponentId].health <= 0) {
        io.to(socket.id).emit('gameOver', { result: 'win' });
        io.to(opponentId).emit('gameOver', { result: 'lose' });
        players[socket.id].health = 120;
        players[opponentId].health = 120;
      }
    }
  });

  socket.on('playerReset', () => {
    if (players[socket.id]) {
      players[socket.id].health = 120;
      io.to(socket.id).emit('resetConfirmed');
    }
  });
  socket.on('ping', () => {
    socket.emit('pong');
  });
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    lobby = lobby.filter(id => id !== socket.id);
    const opponentId = players[socket.id]?.opponent;
    if (opponentId) {
      io.to(opponentId).emit('opponentDisconnected');
      players[opponentId].health = 120;
      delete players[opponentId].opponent;
    }
    delete players[socket.id];
  });
});
app.get("/gameover/won", (req, res) => {
  res.sendFile(__dirname + "/won.html");
});
app.get("/gameover/lost", (req, res) => {
  res.sendFile(__dirname + "/lost.html");
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});
