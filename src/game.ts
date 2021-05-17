import { Direction, Skill } from './enum';
import { Socket } from 'socket.io';
import {
  BOT_NAMES,
  GAME_BOT_CAPACITY,
  GAME_DIMENSION,
  N_ENERGY,
  TRIANGLE_WALL_SIZE,
} from './constants';
import Controller from './controller';
import Energy from './models/energy';
import Globe from './models/globe';
import State from './state';
import Wall from './models/wall';
import Player from './models/player';
import Bot from './models/bot';

export default class Game {
  constructor() {
    this.createWalls();
    this.createEnergies();

    this.updateInterval = setInterval(this.update.bind(this), 1000 / 60);

    this.leaderboardInterval = setInterval(
      this.updateLeaderboard.bind(this),
      3000
    );
  }

  updateInterval: NodeJS.Timeout;
  leaderboardInterval: NodeJS.Timeout;

  private state = new State();
  private controller = new Controller();

  private resizeListener = this.resize.bind(this);

  private keydownListener = this.keydown.bind(this);

  private keyupListener = this.keyup.bind(this);

  private mousemoveListener = this.mousemove.bind(this);

  private mousedownListener = this.mousedown.bind(this);

  private mouseupListener = this.mouseup.bind(this);

  private skillListener = this.skill.bind(this);

  private nPlayers = 0;
  private nBots = 0;

  private watchers: Map<string, Player> = new Map();

  update() {
    this.state.globes.forEach((globe: Globe) => {
      if (globe.update()) {
        if (globe instanceof Player) {
          this.leave(globe.id);
          this.watchers.set(globe.id, globe);
        } else if (globe instanceof Bot) {
          this.state.globes.delete(globe.id);
          this.nBots--;
        }
        if (this.nBots < GAME_BOT_CAPACITY) {
          //Repopulate bots
          const spots = 1 + GAME_BOT_CAPACITY - this.nPlayers - this.nBots;
          if (spots > 0) {
            this.addBots(spots);
          }
        }
      }
    });

    this.state.bullets.forEach((bullet, index) => {
      if (bullet.update(this.state.bullets, this.state.walls)) {
        this.state.bullets.splice(index, 1);
      }
    });

    this.state.energies.forEach((energy) => {
      energy.update();
    });

    this.state.splashes.forEach((splash, index) => {
      if (splash.update()) this.state.splashes.splice(index, 1);
    });

    this.watchers.forEach((watcher) => {
      watcher.update();
    });
  }

  getGlobes() {
    return this.state.globes;
  }

  updateLeaderboard() {
    let globes = Array.from(this.state.globes.values()).filter(
      (g: Globe) => !g.isDead
    );

    //Sort by xp and get only top 5 players
    const sortedGlobes = globes.sort((globe1: Globe, globe2: Globe) => {
      if (globe1.xp < globe2.xp) return 1;
      if (globe1.xp > globe2.xp) return -1;
      return 0;
    });

    const leaderboardGlobes = sortedGlobes
      .slice(0, 5)
      .map((g, index) => g.serializeLeaderboard(index + 1));

    this.state.globes.forEach((globe: Globe) => {
      //Verify if globe is in leaderboard
      if (globe instanceof Player) {
        for (const leaderboardGlobe of leaderboardGlobes) {
          if (globe.id === leaderboardGlobe.id) {
            globe.socket?.emit('leaderboard', leaderboardGlobes);
            return;
          }
        }

        //Add player to leaderboard
        for (let i = 4; i < sortedGlobes.length; i++) {
          if (globe.id === sortedGlobes[i].id) {
            globe.socket?.emit('leaderboard', [
              ...leaderboardGlobes,
              globe.serializeLeaderboard(i + 1),
            ]);
            return;
          }
        }
      }
    });
  }

  createWalls() {
    this.createLimitWalls();
    this.createTriangleWalls();
    this.createOutRectangleWalls();
    this.createInRectangleWalls();
    this.createInSquareWalls();
  }

  createLimitWalls() {
    const topWall = new Wall(0, 0);
    topWall.go(GAME_DIMENSION, 0);
    topWall.close();
    this.state.walls.push(topWall);

    const rightWall = new Wall(GAME_DIMENSION, 0);
    rightWall.go(0, GAME_DIMENSION);
    rightWall.close();
    this.state.walls.push(rightWall);

    const bottomWall = new Wall(GAME_DIMENSION, GAME_DIMENSION);
    bottomWall.go(-GAME_DIMENSION, 0);
    bottomWall.close();
    this.state.walls.push(bottomWall);

    const leftWall = new Wall(0, GAME_DIMENSION);
    leftWall.go(0, -GAME_DIMENSION);
    leftWall.close();
    this.state.walls.push(leftWall);
  }

  createInSquareWalls() {
    const size = 100;

    const topLeft = new Wall(1445, 1445);
    topLeft.go(size, 0);
    topLeft.go(0, size);
    topLeft.go(-size, 0);
    topLeft.close();
    this.state.walls.push(topLeft);

    const topRight = new Wall(2485, 1445);
    topRight.go(size, 0);
    topRight.go(0, size);
    topRight.go(-size, 0);
    topRight.close();
    this.state.walls.push(topRight);

    const bottomLeft = new Wall(1445, 2485);
    bottomLeft.go(size, 0);
    bottomLeft.go(0, size);
    bottomLeft.go(-size, 0);
    bottomLeft.close();
    this.state.walls.push(bottomLeft);

    const bottomRight = new Wall(2485, 2485);
    bottomRight.go(size, 0);
    bottomRight.go(0, size);
    bottomRight.go(-size, 0);
    bottomRight.close();
    this.state.walls.push(bottomRight);
  }

  createInRectangleWalls() {
    const length = 720;
    const space = 320;
    const width = 70;

    let x = 925;
    for (let i = 0; i < 3; i++) {
      let y = 1120;
      const verticalW1 = new Wall(x + 1040 * i, y);
      verticalW1.go(width, 0);
      verticalW1.go(0, length);
      verticalW1.go(-width, 0);
      verticalW1.close();
      this.state.walls.push(verticalW1);

      const horizontalW1 = new Wall(y, x + 1040 * i);
      horizontalW1.go(length, 0);
      horizontalW1.go(0, width);
      horizontalW1.go(-length, 0);
      horizontalW1.close();
      this.state.walls.push(horizontalW1);

      y += length + space;
      const verticalW2 = new Wall(x + 1040 * i, y);
      verticalW2.go(width, 0);
      verticalW2.go(0, length);
      verticalW2.go(-width, 0);
      verticalW2.close();
      this.state.walls.push(verticalW2);

      const horizontalW2 = new Wall(y, x + 1040 * i);
      horizontalW2.go(length, 0);
      horizontalW2.go(0, width);
      horizontalW2.go(-length, 0);
      horizontalW2.close();
      this.state.walls.push(horizontalW2);
    }
  }

  createTriangleWalls() {
    const topLeft = new Wall(350, 350);
    topLeft.go(TRIANGLE_WALL_SIZE, 0);
    topLeft.go(-TRIANGLE_WALL_SIZE, TRIANGLE_WALL_SIZE);
    topLeft.close();
    this.state.walls.push(topLeft);

    const topRight = new Wall(GAME_DIMENSION - 350, 350);
    topRight.go(-TRIANGLE_WALL_SIZE, 0);
    topRight.go(TRIANGLE_WALL_SIZE, TRIANGLE_WALL_SIZE);
    topRight.close();
    this.state.walls.push(topRight);

    const bottomRight = new Wall(GAME_DIMENSION - 350, GAME_DIMENSION - 350);
    bottomRight.go(-TRIANGLE_WALL_SIZE, 0);
    bottomRight.go(TRIANGLE_WALL_SIZE, -TRIANGLE_WALL_SIZE);
    bottomRight.close();
    this.state.walls.push(bottomRight);

    const bottomLeft = new Wall(350, GAME_DIMENSION - 350);
    bottomLeft.go(TRIANGLE_WALL_SIZE, 0);
    bottomLeft.go(-TRIANGLE_WALL_SIZE, -TRIANGLE_WALL_SIZE);
    bottomLeft.close();
    this.state.walls.push(bottomLeft);
  }

  createOutRectangleWalls() {
    const space = 200;
    const length = 320;
    const width = 70;
    for (let i = 0; i < 5; i++) {
      const upWall = new Wall(800 + i * (length + space), 350);
      upWall.go(length, 0);
      upWall.go(0, width);
      upWall.go(-length, 0);
      upWall.close();

      this.state.walls.push(upWall);

      const leftWall = new Wall(350, 800 + i * (length + space));
      leftWall.go(0, length); //down
      leftWall.go(width, 0); //right
      leftWall.go(0, -length); //right
      leftWall.close();
      this.state.walls.push(leftWall);

      const rightWall = new Wall(
        GAME_DIMENSION - 350,
        800 + i * (length + space)
      );
      rightWall.go(0, length); //down
      rightWall.go(-width, 0); //right
      rightWall.go(0, -length); //right
      rightWall.close();
      this.state.walls.push(rightWall);

      const downWall = new Wall(
        800 + i * (length + space),
        GAME_DIMENSION - 350
      );
      downWall.go(length, 0);
      downWall.go(0, -width);
      downWall.go(-length, 0);
      downWall.close();
      this.state.walls.push(downWall);
    }
  }

  createEnergies() {
    for (let i = 0; i < N_ENERGY; i++) {
      const energy = new Energy(i, this.state.walls);
      this.state.energies.push(energy);
    }
  }

  addPlayer(
    roomId: string,
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number
  ) {
    this.addListeners(socket);

    const player = new Player(
      socket,
      username,
      screenWidth,
      screenHeight,
      this.state
    );

    this.state.globes.set(socket.id, player);
    const state = player.getNearbyObjects();

    player.socket?.emit(
      'start',
      roomId,
      player.createUpdate(
        state.globes,
        state.bullets,
        state.energies,
        state.walls,
        state.splashes
      )
    );
    this.nPlayers++;
  }

  addBots(n: number) {
    for (let i = 0; i < n; i++) {
      const id = (Date.now() + i).toString();
      const username = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const bot = new Bot(id, username, this.state);
      this.state.globes.set(id, bot);
    }
    this.nBots += n;
  }

  getNBots() {
    return this.nBots;
  }

  getNGlobes() {
    return this.state.globes.size;
  }

  getNPlayers() {
    return this.nPlayers;
  }

  addListeners(socket: Socket) {
    socket.on('resize', this.resizeListener);

    socket.on('keydown', this.keydownListener);

    socket.on('keyup', this.keyupListener);

    socket.on('mousemove', this.mousemoveListener);

    socket.on('mousedown', this.mousedownListener);

    socket.on('mouseup', this.mouseupListener);

    socket.on('skill', this.skillListener);
  }

  resize(id: string, data: any) {
    const screenWidth = data.screenWidth;
    const screenHeight = data.screenHeight;

    const globe = this.state.globes.get(id);

    if (globe) globe.resize(screenWidth, screenHeight);
  }

  keydown(id: string, direction: Direction) {
    this.controller.keyDown(this.state.globes.get(id), direction);
  }

  keyup(id: string, direction: Direction) {
    this.controller.keyUp(this.state.globes.get(id), direction);
  }

  mousemove(id: string, data: any) {
    this.state.globes.get(id)?.setAim(data.dX, data.dY);
  }

  mousedown(id: string) {
    this.controller.mousedown(this.state.globes.get(id));
  }

  mouseup(id: string) {
    this.controller.mouseup(this.state.globes.get(id));
  }

  skill(id: string, skill: Skill) {
    this.state.globes.get(id)?.updateSkill(skill);
  }

  unWatch(id: string) {
    this.watchers.delete(id);
  }

  //Returns true if 0 players left
  leave(id: string) {
    if (!this.state.globes.has(id)) return;
    const player = this.state.globes.get(id) as Player;

    //Remove game listeners
    player.socket?.off('resize', this.resizeListener);

    player.socket?.off('keydown', this.keydownListener);

    player.socket?.off('keyup', this.keyupListener);

    player.socket?.off('mousemove', this.mousemoveListener);

    player.socket?.off('mousedown', this.mousedownListener);

    player.socket?.off('mouseup', this.mouseupListener);

    player.socket?.off('skill', this.skillListener);

    this.state.globes.delete(id);
    this.nPlayers--;
  }

  isDead() {
    return this.nPlayers === 0 && this.watchers.size === 0;
  }

  kill() {
    if (this.isDead()) {
      clearInterval(this.updateInterval);
      clearInterval(this.leaderboardInterval);
    }
  }
}
