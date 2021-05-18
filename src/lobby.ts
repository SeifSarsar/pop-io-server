import Game from './game';
import { Server, Socket } from 'socket.io';
import { GAME_BOT_CAPACITY, GAME_CAPACITY } from './constants';

export default class Lobby {
  constructor(io: Server) {
    this.io = io;
  }

  io: Server;
  games: Map<string, Game> = new Map();
  nRooms: number = 0;

  join(
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number
  ) {
    socket.rooms.forEach((room) => this.leave(room, socket));
    let roomId = this.find();
    if (!roomId) roomId = this.create();

    socket.join(roomId);
    this.games
      .get(roomId)
      ?.addPlayer(roomId, socket, username, screenWidth, screenHeight);
  }

  find() {
    if (this.games.size === 0) return null;

    for (const entry of this.games.entries()) {
      if (entry[1].getNPlayers() < GAME_CAPACITY) {
        return entry[0];
      }
    }

    return null;
  }

  create() {
    const roomId = this.nRooms.toString();
    const game = new Game();
    game.addBots(0);
    this.games.set(roomId, game);
    this.nRooms++;
    return roomId;
  }

  leave(roomId: string, socket: Socket) {
    socket.leave(roomId);
    const game = this.games.get(roomId);

    if (!game) return;

    game.unWatch(socket.id);
    game.leave(socket.id);

    if (game.isDead()) {
      game.kill();
      this.games.delete(roomId);
      this.nRooms--;
    }
  }
}
