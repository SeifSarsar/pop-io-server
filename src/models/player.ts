import Bullet from './bullet';
import Energy from './energy';
import Wall from './wall';
import { Socket } from 'socket.io';
import State from '../state';
import Splash from './splash';
import Globe from './globe';

export default class Player extends Globe {
  constructor(
    socket: Socket,
    username: string,
    screenWidth: number,
    screenHeight: number,
    state: State
  ) {
    super(socket, socket.id, username, state, screenWidth, screenHeight);
    this.socket = socket;
  }

  getNearbyObjects() {
    const globes = Array.from(this.state.globes.values()).filter(
      (g: Globe) => g !== this && !g.isDead && this.canSee(g)
    );
    const bullets = this.state.bullets.filter((b: Bullet) => this.canSee(b));
    const energies = this.state.energies.filter((e: Energy) => this.canSee(e));

    const walls = this.state.walls.filter((w: Wall) => this.canSeeWall(w));

    const splashes = this.state.splashes.filter((s: Splash) => this.canSee(s));

    return {
      globes,
      bullets,
      energies,
      walls,
      splashes,
    };
  }

  update() {
    const state = this.getNearbyObjects();
    this.socket?.emit(
      'update',
      this.createUpdate(
        state.globes,
        state.bullets,
        state.energies,
        state.walls,
        state.splashes
      )
    );

    this.updateGlobe(state.globes, state.bullets, state.energies, state.walls);
    return this.isDead;
  }

  createUpdate(
    nearbyGlobes: Globe[],
    nearbyBullets: Bullet[],
    nearbyEnergies: Energy[],
    nearbyWalls: Wall[],
    nearbySplashes: Splash[]
  ) {
    return {
      me: this.serialize(),
      globes: nearbyGlobes.map((globe) => globe.serialize()),
      bullets: nearbyBullets.map((bullet) => bullet.serialize()),
      energies: nearbyEnergies.map((energy) => energy.serialize()),
      walls: nearbyWalls.map((wall) => wall.serialize()),
      splashes: nearbySplashes.map((splash) => splash.serialize()),
    };
  }

  levelUp(): void {
    if (this.lvl === this.MAX_LEVEL) return;

    if (this.xp > this.getTotalXPByLevel(this.lvl)) {
      //level up
      const nextLevel = this.getLevelByTotalXP(this.xp);
      this.points += nextLevel - this.lvl;
      this.lvl = nextLevel;
    }

    const xpLeft = this.getTotalXPByLevel(this.lvl) - this.xp;
    const xpByLevel = this.getXPByLevel(this.lvl);
    this.socket?.emit(
      'level',
      this.points,
      this.lvl,
      Math.floor((100 * (xpByLevel - xpLeft)) / xpByLevel)
    );
  }
}
