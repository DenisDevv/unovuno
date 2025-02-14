const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { QuickDB } = require("quick.db");
const db = new QuickDB();
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
    let leaderboard = await db.all();
    if (!leaderboard) {
      leaderboard = [];
    }
    console.log('Leaderboard data:', leaderboard); // Log the leaderboard data
    await socket.emit('connected', { leaderboard });
    socket.on('joinLobby', async (playerData) => {
      try {
        lobby.push({ id: socket.id, name: playerData.name });
        socket.emit('waiting');
        if (lobby.length >= 2) {
          const player1 = lobby.shift();
          const player2 = lobby.shift();
          const spawn1 = spawnPoints[0];
          const spawn2 = spawnPoints[1];
          players[player1.id] = { health: 120, opponent: player2.id, name: player1.name };
          players[player2.id] = { health: 120, opponent: player1.id, name: player2.name };
          io.to(player1.id).emit('matchFound', { opponent: player2.id, opponentName: player2.name });
          io.to(player2.id).emit('matchFound', { opponent: player1.id, opponentName: player1.name });
          io.to(player1.id).emit('spawn', spawn1);
          io.to(player2.id).emit('spawn', spawn2);
        }
      } catch (error) {
        console.error('Errore nel joinLobby:', error);
      }
    });

    socket.on('playerMove', async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('playerMove', { id: socket.id, x: data.x, y: data.y });
        }
      } catch (error) {
        console.error('Errore nel playerMove:', error);
      }
    });

    socket.on('shoot', async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('shoot', data);
        }
      } catch (error) {
        console.error('Errore nel shoot:', error);
      }
    });

    socket.on('reload', async () => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit('reload');
        }
      } catch (error) {
        console.error('Errore nel reload:', error);
      }
    });

    socket.on('playerHit', async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId && players[opponentId]) {
          players[opponentId].health -= data.damage;
          if (players[opponentId].health < 0) players[opponentId].health = 0;
          await io.to(opponentId).emit('playerHit', { damage: data.damage });
          await io.to(socket.id).emit('opponentHealth', { health: players[opponentId].health });
          if (players[opponentId].health <= 0) {
            await io.to(socket.id).emit('gameOver', { result: 'win' });
            console.log("Vittoria di", players[socket.id]);
            await db.add(`${players[socket.id].name}`, 100);
            await io.to(opponentId).emit('gameOver', { result: 'lose' });
            players[socket.id].health = 120;
            players[opponentId].health = 120;
          }
        }
      } catch (error) {
        console.error('Errore nel playerHit:', error);
      }
    });
    socket.on('updateHealth', async (data) => {
      try {
        if (players[socket.id]) {
          players[socket.id].health = Math.min(players[socket.id].health + data.health, 120);
          io.to(socket.id).emit('healthUpdated', { health: players[socket.id].health });

          const opponentId = players[socket.id]?.opponent;
          if (opponentId) {
            io.to(opponentId).emit('opponentHealth', { health: players[socket.id].health });
          }
        }
      } catch (error) {
        console.error('Errore nel updateHealth:', error);
      }
    });
    socket.on('playerReset', async () => {
      try {
        if (players[socket.id]) {
          players[socket.id].health = 120;
          io.to(socket.id).emit('resetConfirmed');
        }
      } catch (error) {
        console.error('Errore nel playerReset:', error);
      }
    });

    socket.on("regalaPunti", async (data) =>{
      await db.add(`${data.nome}`, data.punti);
    })
    socket.on("damage-received", async (data) => {
      try {
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          io.to(opponentId).emit("damage-done", data);
        }
      } catch (error) {
        console.error('Errore nel damage-received:', error);
      }
    });

    socket.on('ping', async () => {
      try {
        socket.emit('pong');
      } catch (error) {
        console.error('Errore nel ping:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        console.log('Player disconnesso:', socket.id);
        lobby = lobby.filter(id => id !== socket.id);
        const opponentId = players[socket.id]?.opponent;
        if (opponentId) {
          await db.add(`${players[opponentId].name}`, 50);
          io.to(opponentId).emit('opponentDisconnected');
          players[opponentId].health = 120;
          delete players[opponentId].opponent;
        }
        delete players[socket.id];
      } catch (error) {
        console.error('Errore nel disconnect:', error);
      }
    });
  } catch (error) {
    console.error("Errore nel tentativo di connessione:", error);
  }
});

app.get("/gameover/won", async (req, res) => {
  try {
    res.sendFile(__dirname + "/won.html");
  } catch (error) {
    console.error('Errore nel /gameover/won:', error);
    res.status(500).send('Server Error');
  }
});

app.get("/gameover/lost", async (req, res) => {
  try {
    res.sendFile(__dirname + "/lost.html");
  } catch (error) {
    console.error('Errore nel /gameover/lost:', error);
    res.status(500).send('Errore Server');
  }
});

server.listen(3000, '0.0.0.0', async () => {
  try {
    console.log('Il server è in esecuzione nella porta 3000');
  } catch (error) {
    console.error("Errore nell'avviare il server:", error);
  }
});
