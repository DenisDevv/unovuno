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

io.on('connection', async (socket) => {
  try {
    console.log('New player connected:', socket.id);

    socket.on('joinLobby', async (playerData) => {
      try {
        lobby.push({ id: socket.id, name: playerData.name });
        socket.emit('waiting');
        if (lobby.length >= 2) {
          const player1 = lobby.shift();
          const player2 = lobby.shift();
          const spawn1 = spawnPoints[0];
          const spawn2 = spawnPoints[1];
          players[player1.id] = { health: 120, opponent: player2.id };
          players[player2.id] = { health: 120, opponent: player1.id };
          io.to(player1.id).emit('matchFound', { opponent: player2.id, opponentName: player2.name });
          io.to(player2.id).emit('matchFound', { opponent: player1.id, opponentName: player1.name });
          io.to(player1.id).emit('spawn', spawn1);
          io.to(player2.id).emit('spawn', spawn2);
        }
      } catch (error) {
        console.error('Error in joinLobby:', error);
      }
    });

    socket.on('playerMove', async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('playerMove', { id: socket.id, x: data.x, y: data.y });
        }
      } catch (error) {
        console.error('Error in playerMove:', error);
      }
    });

    socket.on('shoot', async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('shoot', data);
        }
      } catch (error) {
        console.error('Error in shoot:', error);
      }
    });

    socket.on('reload', async () => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('reload');
        }
      } catch (error) {
        console.error('Error in reload:', error);
      }
    });

    socket.on('playerHit', async (data) => {
      try {
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
      } catch (error) {
        console.error('Error in playerHit:', error);
      }
    });
    socket.on("updateHealth", async (data) => {
      try {
        if (socket.id) {
          io.to(socket.id).emit('opponentHealth', { health: data.health });
        }
      } catch (error) {
        console.error('Error in updateHealth:', error);
      }
    });
    socket.on('playerReset', async () => {
      try {
        if (players[socket.id]) {
          players[socket.id].health = 120;
          io.to(socket.id).emit('resetConfirmed');
        }
      } catch (error) {
        console.error('Error in playerReset:', error);
      }
    });

    socket.on('ping', async () => {
      try {
        socket.emit('pong');
      } catch (error) {
        console.error('Error in ping:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        console.log('Player disconnected:', socket.id);
        lobby = lobby.filter(id => id !== socket.id);
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('opponentDisconnected');
          players[opponentId].health = 120;
          delete players[opponentId].opponent;
        }
        delete players[socket.id];
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
  } catch (error) {
    console.error('Error with connection event:', error);
  }
});

app.get("/gameover/won", async (req, res) => {
  try {
    res.sendFile(__dirname + "/won.html");
  } catch (error) {
    console.error('Error in /gameover/won route:', error);
    res.status(500).send('Server Error');
  }
});

app.get("/gameover/lost", async (req, res) => {
  try {
    res.sendFile(__dirname + "/lost.html");
  } catch (error) {
    console.error('Error in /gameover/lost route:', error);
    res.status(500).send('Server Error');
  }
});

server.listen(3000, '0.0.0.0', async () => {
  try {
    console.log('Server is running on port 3000');
  } catch (error) {
    console.error('Error starting server:', error);
  }
});
