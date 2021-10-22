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
let playerClaimingVictory = { id: null, name: null };
let playersRestart = [];

io.on('connection', (socket) => {
  socket.on('add', (name) => {
    if (cm.INITPLAYER(socket.id, name)) {
      io.emit('board', cm.GET());
      socket.emit('recover', socket.id);
    } else {
      io.emit('board', cm.GET());
      socket.emit('you', socket.id);
    }

    //socket emit to the user calling the event
    socket.emit('turn', cm.GETPLAYERID(playersTurn));
  });

  socket.on('reset', (id) => {
    cm.RESETPLAYER(id, socket.id);
    socket.emit('you', socket.id);
    //io emits to all users
    io.emit('board', cm.GET());
  })

  socket.on('draw', (fromGrave) => {
    if (cm.GETPLAYERID(playersTurn) == socket.id) {
      cm.DRAW(socket.id, fromGrave);
      //io emits to all users
      io.emit('board', cm.GET());
    } else socket.emit('warning', "Ce n'est pas votre tour !");
  });

  socket.on('play', ({card, stealing}) => {
    let shouldPassTurn = false;
    // Handle pass turn
    if (cm.GETPLAYERID(playersTurn) == socket.id && card.name != 'KS') {
      const player = cm.GETPLAYERBYID(socket.id);
      const hasRevealedCards = (player && player.revealedCards) ?
      !!player.revealedCards.length
      : false;
      shouldPassTurn = (hasRevealedCards || stealing);
    }
    //

    const ev = stealing ? 
      cm.STEAL(socket.id, card)
      : cm.PLAY(socket.id, card);

    if (ev) {
      socket.emit('showCard', card.id);
      if (ev.factor) socket.emit(ev.name, ev.factor);
      if (shouldPassTurn) next();
    } else {
      socket.emit('warning', "Il n'est pas possible de faire cette action maintenant");
    }
    //io emits to all users
    io.emit('board', cm.GET());
  });

  socket.on('next', () => next());

  next = () => {
    if (++playersTurn >= cm.GETNBPLAYERS()) playersTurn = 0;

    const playerID = cm.GETPLAYERID(playersTurn);
    if (playerID == playerClaimingVictory.id) {
      io.emit('displayScores', cm.COUNTPOINTS(playerID));
      playerClaimingVictory = { id: null, name: null };
    } else io.emit('turn', playerID);
  }

  socket.on('claimVictory', () => {
    const player = cm.GETPLAYERBYID(socket.id);
    if (player != null) {
      if (playerClaimingVictory.name == null) {
        playerClaimingVictory = { id: socket.id, name: player.name };
        io.emit('warning', player.name + ' annonce sa présumée victoire !');
      } else {
        const message =
          playerClaimingVictory.id == socket.id
            ? 'Vous avez déjà annoncé votre victoire !'
            : playerClaimingVictory.name + ' a déjà annoncé avant toi !';
        socket.emit('warning', message);
      }
    } else {
      socket.emit('warning', 'Une erreur est survenue, joueur inexistant :/');
    }
  });

  socket.on('restart', () => {
    const player = cm.GETPLAYERBYID(socket.id);
    if (player != null) {
      if (playersRestart.includes(socket.id)) {
        socket.emit('warning', 'Vous avez déjà annoncé vouloir rejouer');
      } else {
        io.emit('warning', playerClaimingVictory.name + ' veut rejouer !');
        playersRestart.push(socket.id);

        if (playersRestart.length >= cm.GETNBPLAYERS()) {
          cm.INITPLAYGROUND();
          io.emit('board', cm.GET());
          playersRestart = [];
        }
      }
    } else {
      socket.emit('warning', 'Une erreur est survenue, joueur inexistant :/');
    }
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
    cm.KICKPLAYER(socket.id);
    //io emits to all users
    io.emit('board', cm.GET());

    // refresh players turn check
    if (playersTurn >= cm.GETNBPLAYERS()) playersTurn = 0;
    io.emit('turn', cm.GETPLAYERID(playersTurn));

    // refresh play again check
    if (playersRestart.length >= cm.GETNBPLAYERS()) {
      cm.INITPLAYGROUND();
      io.emit('board', cm.GET());
      playersRestart = [];
    }
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

