const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"]
  }
});
const cm = require('./cards-manager');

setInterval(() => {
  io.emit('time', new Date().toTimeString());
}, 1000);

// const players = {};

io.on('connection', (socket) => {
  socket.on('add', (name) => {
    console.log('Welcome', name);
    cm.INITPLAYER(socket.id, name);
    //io emits to all users
    io.emit('board', cm.GET());
    //socket emit to the user calling the event
    // socket.emit('you', name);
  });

  socket.on('draw', () => {
    //socket emit to the user calling the event
    socket.emit('drawn', cm.DRAW(socket.id));
  });

  socket.on('switch', (currentCard, newCard) => {
    cm.SWITCH(socket.id, currentCard, newCard);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('play', (card) => {
    cm.PLAY(socket.id, card);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
    // if (players[socket.id]) delete players[socket.id];
    cm.KICKPLAYER(socket.id);

    //io emits to all users
    io.emit('board', cm.GET());
  });

  //io emits to all users
  io.emit('board', cm.GET());

  console.log(`Socket ${socket.id} has connected`);
});

http.listen(process.env.PORT || 4444, () => {
  console.log(
    'Listening on port %d in %s mode',
    process.env.PORT || 4444,
    app.settings.env
  );
  cm.INITPLAYGROUND();
});

// cm.INITPLAYGROUND();
// cm.INITPLAYER('yolo', 'Thomas');
// cm.DRAW('yolo');
// console.log(cm.GET());
// cm.PLAY('yolo', cm.GET().players[0].revealedCards[0]);
// console.log(cm.GET());
// console.log('hand', cm.LOGHAND('yolo'));
// cm.SWITCH(
//   'yolo',
//   cm.GET().players['yolo'].hand[1],
//   cm.GET().players['yolo'].revealedCards[0]
// );
// console.log('hand', cm.LOGHAND('yolo'));
