import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Lobby from './lobby';
const port = process.env.PORT || 3000;

const server = createServer();
server.listen(port);
console.log(`Server listening on port ${port}`);

const clientURL = 'https://pop-io-client.herokuapp.com';
//const clientURL = 'http://localhost:8080';
const io = new Server(server, {
  cors: {
    origin: clientURL,
    methods: ['GET', 'POST'],
  },
});

const lobby = new Lobby(io);

io.on('connection', (socket: Socket) => {
  socket.on('join', (data: any) => {
    lobby.join(socket, data.username, data.screenWidth, data.screenHeight);
  });

  socket.on('leave', (roomId) => {
    lobby.leave(roomId, socket);
  });
});
