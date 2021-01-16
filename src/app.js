const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"]
  }
});

const boards = {};

io.on('connection', (socket) => {
  let previousId;
  const safeJoin = (currentId) => {
    console.log('safeJoin');
    socket.leave(previousId);
    socket.join(currentId);
    previousId = currentId;
  };

  socket.on('get', (id) => {
    console.log('get');
    safeJoin(id);
    socket.emit('board', boards[id]);
  });

  socket.on("add", b => {
    console.log('add; your hand is:', b.hand.map(c => c.name));
    boards[b.id] = b;
    safeJoin(b.id);
    io.emit("boards", Object.keys(boards));
    socket.emit("board", b);
  });

  socket.on("edit", b => {
    console.log('edit');
    boards[b.id] = b;
    // socket.to(b.id).emit("board", b);
    socket.emit("board", b);
  });

  io.emit('boards', Object.keys(boards));

  console.log(`Socket ${socket.id} has connected`);
});

http.listen(4444, () => {
  console.log('Listening on port 4444');
});