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

const boards = {};

io.on('connection', (socket) => {
  const generateName = () => {
    const adjs = [
      'Fancy',
      'Terrifying',
      'Amazing',
      'True',
      'Fake',
      'Dark',
      'Divine',
      'Half',
      'Headless',
      'Sneaky',
      'A Fucking',
    ];
    const noms = [
      'Unicorn',
      'Kitten',
      'Mage',
      'Troll',
      'Goblin',
      'Genuis',
      'Asshole',
      'Dickhead',
      'Elf',
      'Dwarf',
      'Goat',
    ];

    return (
      adjs[Math.floor(Math.random() * adjs.length)] +
      ' ' +
      noms[Math.floor(Math.random() * noms.length)]
    );
  };

  socket.on('add', (b) => {
    b.player.id = socket.id;
    b.player.name = b.player.name ? b.player.name : generateName();

    console.log(
      'Welcome',
      b.player.name,
      '! Your hand is:',
      b.hand.map((c) => c.name)
    );
    boards[socket.id] = b;

    //io emits to all users
    io.emit('boards', Object.values(boards));
    //socket emit to the user calling the event
    socket.emit('you', b.player.name);
  });

  socket.on('edit', (b) => {
    boards[socket.id] = b;

    //io emits to all users
    io.emit('boards', Object.values(boards));
  });
  
  socket.on('target', ({ cardID, playerID }) => {
    console.log('targetting', cardID, playerID);
    // const found = boards.find((b) => b.player.id == playerID);
    if (boards[playerID]) {
      console.log('targetting found');
      const targetIndex = boards[playerID].targettedCards.findIndex(
        (CID) => CID == cardID
      );
      targetIndex >= 0
        ? boards[playerID].targettedCards.splice(targetIndex, 1)
        : boards[playerID].targettedCards.push(cardID);

      //io emits to all users
      io.emit('boards', Object.values(boards));
    }
  });
  
  socket.on('disconnect', function () {
    console.log('Got disconnect!');
    if (boards[socket.id]) delete boards[socket.id];

    //io emits to all users
    io.emit('boards', Object.values(boards));
  });

  io.emit('boards', Object.values(boards));

  console.log(`Socket ${socket.id} has connected`);
});

http.listen(process.env.PORT || 4444, () => {
  console.log(
    'Listening on port %d in %s mode',
    process.env.PORT || 4444,
    app.settings.env
  );
});