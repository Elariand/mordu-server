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
let playersTurn = 0;

io.on('connection', (socket) => {
  socket.on('add', (name) => {
    console.log('Welcome', name);
    // players[socket.id] = name;
    cm.INITPLAYER(socket.id, name);
    cm.INITPLAYER('zero', 'Zed');
    cm.INITPLAYER('one', 'Yi');
    cm.INITPLAYER('two', 'Shen');
    //io emits to all users
    io.emit('board', cm.GET());
    //socket emit to the user calling the event
    socket.emit('you', socket.id);
    socket.emit('turn', cm.GETPLAYERID(playersTurn));
  });

  socket.on('draw', () => {
    cm.DRAW(socket.id);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('switch', ({ currentCard, newCard }) => {
    cm.SWITCH(socket.id, currentCard, newCard);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('play', (card) => {
    cm.PLAY(socket.id, card);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('next', () => {
    if (++playersTurn >= cm.GETNBPLAYERS()) playersTurn = 0;
    //io emits to all users
    io.emit('turn', cm.GETPLAYERID(playersTurn));

    console.log("It's player", playersTurn, 'turn.');
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
    // if (players[socket.id]) delete players[socket.id];
    cm.KICKPLAYER(socket.id);
    cm.KICKPLAYER('zero');
    cm.KICKPLAYER('one');
    cm.KICKPLAYER('two');

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
});

