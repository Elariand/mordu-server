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

let playersTurn = 0;

io.on('connection', (socket) => {
  socket.on('add', (name) => {
    cm.INITPLAYER(socket.id, name);
    //io emits to all users
    io.emit('board', cm.GET());
    //socket emit to the user calling the event
    socket.emit('you', socket.id);
    socket.emit('turn', cm.GETPLAYERID(playersTurn));
  });

  socket.on('draw', (fromGrave) => {
    if (cm.GETPLAYERID(playersTurn) == socket.id) {
      cm.DRAW(socket.id, fromGrave);
      //io emits to all users
      io.emit('board', cm.GET());
    } else socket.emit('warning', "Ce n'est pas votre tour !");
  });

  socket.on('play', (card) => {
    const ev = cm.PLAY(socket.id, card);
    //socket emit to the user calling the event
    if (ev) socket.emit(ev.name, ev.factor);
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('next', () => {
    if (++playersTurn >= cm.GETNBPLAYERS()) playersTurn = 0;
    //io emits to all users
    io.emit('turn', cm.GETPLAYERID(playersTurn));
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
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
  // cm.INITPLAYER('yolo', 'Thomas');
  // cm.DRAW('yolo');
  // console.log(cm.GET());
  // cm.PLAY('yolo', cm.GET().players[0].revealedCards[0]);
  // console.log(cm.GET());
  // console.log('hand', cm.LOGHAND('yolo'));
});

