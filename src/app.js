const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"]
  }
});

setInterval(() => {
  io.emit('time', new Date().toTimeString());
}, 1000);

const players = {};

io.on('connection', (socket) => {
  socket.on('add', (name) => {
    console.log('Welcome', name);
    players[socket.id] = {
      id: socket.id,
      name: name,
      hand: null, // NEEDS TO BE CHANGED TO STARTING HAND
    };

    //io emits to all users
    io.emit('players', Object.values(players));
    //socket emit to the user calling the event
    // socket.emit('you', name);
  });

  // socket.on('target', ({ cardID, playerID }) => {
  //   if (players[playerID]) {
  //     const targetIndex = players[playerID].targettedCards.findIndex(
  //       (CID) => CID == cardID
  //     );
  //     targetIndex >= 0
  //       ? players[playerID].targettedCards.splice(targetIndex, 1)
  //       : players[playerID].targettedCards.push(cardID);

  //     //io emits to all users
  //     io.emit('players', Object.values(players));
  //   }
  // });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
    if (players[socket.id]) delete players[socket.id];

    //io emits to all users
    io.emit('players', Object.values(players));
  });

  //io emits to all users
  io.emit('players', Object.values(players));

  console.log(`Socket ${socket.id} has connected`);
});

http.listen(process.env.PORT || 4444, () => {
  console.log(
    'Listening on port %d in %s mode',
    process.env.PORT || 4444,
    app.settings.env
  );
});