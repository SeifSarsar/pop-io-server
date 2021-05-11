import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import GameHandler from './game-handler';
const port = process.env.PORT || 3000;

const server = createServer();
server.listen(port);
console.log(`Server listening on port ${port}`);

const clientURL = 'https://pop-io-client.herokuapp.com/'; //'http://localhost:8080'
const io = new Server(server, {
  cors: {
    origin: clientURL,
    methods: ['GET', 'POST'],
  },
});

const gameHandler = new GameHandler(io);

io.on('connection', (socket: Socket) => {
  socket.on('join', (data: any) => {
    gameHandler.join(
      socket,
      data.username,
      data.screenWidth,
      data.screenHeight
    );
  });

  socket.on('leave', () => {
    gameHandler.leave(socket);
  });
});
