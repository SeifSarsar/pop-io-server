import Game from './game';
import { Server, Socket } from 'socket.io';
import { GAME_CAPACITY } from './constants';

export default class GameHandler {
  constructor(io: Server) {
    this.io = io;
  }

  io: Server;
  games: Map<string, Game> = new Map();
  room: number = 0;

  join(
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number
  ) {
    if (!this.joinGame(socket, username, screenWidth, screenHeight))
      this.createGame(socket, username, screenWidth, screenHeight);
  }

  leave(socket: Socket) {
    //Leave old room
    const oldRoom = socket.rooms.values().next().value;

    socket.leave(oldRoom);
    //Remove Globe from
    if (this.games.get(oldRoom)?.leave(socket.id)) {
      this.games.delete(oldRoom);
      this.room--;
    }
  }

  joinGame(
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number
  ) {
    if (this.games.size === 0) return false;

    for (let room of this.games.keys()) {
      if (this.games.get(room)!.getNPlayers() < GAME_CAPACITY) {
        socket.join(room);

        this.games
          .get(room)
          ?.addPlayer(socket, username, screenWidth, screenHeight);
        return true;
      }
    }
    return false;
  }

  createGame(
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number
  ) {
    const game = new Game();
    socket.join(this.room.toString());
    game.addPlayer(socket, username, screenWidth, screenHeight);
    game.addBots(39);
    this.games.set(this.room.toString(), game);
    this.room++;
  }
}
