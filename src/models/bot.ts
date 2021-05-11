import { BOT_AIM_ANGLE_OFFSET, BOT_AIM_SPEED } from '../constants';
import { Skill } from '../enum';
import State from '../state';
import { distancePoint, scalar } from '../utils';
import Blob from './blob';
import Bullet from './bullet';
import Energy from './energy';
import Globe from './globe';
import Vector from './vector';
import Wall from './wall';

export default class Bot extends Globe {
  constructor(id: string, username: string, state: State) {
    super(id, username, state, 900, 900);
  }

  targetEnergy: Energy | null = null;
  targetGlobe: Globe | null = null;

  emit() {}
  resize() {}

  levelUp(): void {
    if (this.lvl === this.MAX_LEVEL) return;

    if (this.xp >= this.getTotalXPByLevel(this.lvl)) {
      //level up
      const nextLevel = this.getLevelByTotalXP(this.xp);
      this.points += nextLevel - this.lvl;
      this.lvl = nextLevel;
    }

    const skills = Object.keys(Skill);
    while (this.points > 0)
      this.updateSkill(
        skills[Math.floor(Math.random() * skills.length)].toLowerCase()
      );
  }

  getNearbyObjects() {
    const bullets = this.state.bullets.filter((b: Bullet) => this.canSee(b));
    const energies = this.state.energies.filter((e: Energy) => this.canSee(e));

    const walls = this.state.walls
      .filter((w: Wall) => this.canSeeWall(w))
      .sort((a, b) => {
        const distanceA = distancePoint(this.position, a.position);
        const distanceB = distancePoint(this.position, b.position);

        if (distanceA < distanceB) {
          return -1;
        } else return 1;
      });

    const globes = Array.from(this.state.globes.values()).filter(
      (g: Globe) =>
        g !== this &&
        !g.isDead &&
        this.canSee(g) &&
        !this.detectObstacle(g, walls, false)
    );
    return {
      globes,
      bullets,
      energies,
      walls,
    };
  }
  update() {
    if (this.isDead === false) {
      const state = this.getNearbyObjects();
      this.updateGlobe(
        state.globes,
        state.bullets,
        state.energies,
        state.walls
      );
      this.react(state.globes, state.energies, state.walls);
    }

    return this.isDead;
  }

  react(nearbyGlobes: Globe[], nearbyEnergies: Energy[], nearbyWalls: Wall[]) {
    this.setTargetEnergy(nearbyEnergies);
    this.setTargetGlobe(nearbyGlobes);

    this.moveTowardTarget(nearbyWalls);
    this.aimTarget();
    this.shootTarget();
  }

  aimTarget() {
    const target = this.targetGlobe ? this.targetGlobe : this.targetEnergy;

    if (!target) return;

    const dX = target.position.x - this.position.x;
    const dY = target.position.y - this.position.y;

    const diffX = dX - this.mouseVector.dX;
    const diffY = dY - this.mouseVector.dY;

    //20 is speed of shield rotation
    const nextX = diffX / BOT_AIM_SPEED + this.mouseVector.dX;
    const nextY = diffY / BOT_AIM_SPEED + this.mouseVector.dY;

    this.moveShield(nextX, nextY);
  }

  shootTarget() {
    if (!this.targetGlobe) {
      this.stopShooting();
      return;
    }

    const targetVector = new Vector(
      this.targetGlobe.position.x - this.position.x,
      this.targetGlobe.position.y - this.position.y
    );

    //verify angle
    const value = scalar(this.mouseVector, targetVector);
    const perfectValue = scalar(targetVector, targetVector); //value when aiming perfectly

    if (
      value / perfectValue > Math.cos(BOT_AIM_ANGLE_OFFSET) &&
      !this.isShooting
    ) {
      this.startShooting();
    } else {
      this.stopShooting();
    }
  }

  //Cohen sutherland
  detectObstacle(target: Blob, walls: Wall[], shouldAvoid = true) {
    for (const wall of walls) {
      const wallLeft = wall.position.x - wall.width / 2;
      const wallRight = wall.position.x + wall.width / 2;
      const wallTop = wall.position.y - wall.height / 2;
      const wallBottom = wall.position.y + wall.height / 2;

      let botPosition = 0;
      if (this.position.x < wallLeft) botPosition |= 1;
      else if (this.position.x > wallRight) botPosition |= 2;

      if (this.position.y > wallBottom) botPosition |= 4;
      else if (this.position.y < wallTop) botPosition |= 8;

      let targetPosition = 0;
      if (target.position.x < wallLeft) targetPosition |= 1;
      else if (target.position.x > wallRight) targetPosition |= 2;

      if (target.position.y > wallBottom) targetPosition |= 4;
      else if (target.position.y < wallTop) targetPosition |= 8;

      if ((botPosition & targetPosition) === 0) {
        //Player in corner
        if (shouldAvoid)
          this.avoidObstacle(wall, target, botPosition, targetPosition);

        return true;
      }
    }
    return false;
  }

  avoidObstacle(
    wall: Wall,
    target: Blob,
    botPosition: number,
    targetPosition: number
  ) {
    const wallLeft = wall.position.x - wall.width / 2;
    const wallRight = wall.position.x + wall.width / 2;
    const wallTop = wall.position.y - wall.height / 2;
    const wallBottom = wall.position.y + wall.height / 2;
    //There is an obstacle
    if (
      botPosition === 9 ||
      botPosition === 10 ||
      botPosition === 6 ||
      botPosition === 5
    ) {
      //Target is left/right
      if (targetPosition === 1 || targetPosition === 2) {
        const dX = target.position.x - this.position.x;
        this.acceleration.dX = Math.sign(dX) * (this.speedLimit / 4);
        this.acceleration.dY = 0;
      } else {
        /*if (targetPosition === 4 || targetPosition === 8)*/
        //Target is top/bottom
        const dY = target.position.y - this.position.y;
        this.acceleration.dX = 0;
        this.acceleration.dY = Math.sign(dY) * (this.speedLimit / 4);
      }
    } else if ((botPosition | targetPosition) === 3) {
      //Player and target are side by side horizontally
      const dY =
        Math.abs(wallTop - this.position.y) < wall.height / 2
          ? wallTop - this.position.y
          : wallBottom - this.position.y;
      this.acceleration.dX = 0;
      this.acceleration.dY = Math.sign(dY) * (this.speedLimit / 4);
    } else if ((botPosition | targetPosition) === 12) {
      //Player and target are side by side vertically
      const dX =
        Math.abs(wallLeft - this.position.x) < wall.width / 2
          ? wallLeft - this.position.x
          : wallRight - this.position.x;
      this.acceleration.dX = Math.sign(dX) * (this.speedLimit / 4);
      this.acceleration.dY = 0;
    } else {
      if (botPosition === 1 || botPosition === 2) {
        const dY = target.position.y - this.position.y;
        this.acceleration.dX = 0;
        this.acceleration.dY = Math.sign(dY) * (this.speedLimit / 4);
      } else if (botPosition === 4 || botPosition === 8) {
        const dX = target.position.x - this.position.x;
        this.acceleration.dX = Math.sign(dX) * (this.speedLimit / 4);
        this.acceleration.dY = 0;
      }
    }
  }

  moveTowardTarget(walls: Wall[]) {
    if (!this.targetEnergy || this.detectObstacle(this.targetEnergy, walls))
      return;

    let dX = this.targetEnergy.position.x - this.position.x;
    let dY = this.targetEnergy.position.y - this.position.y;

    if (Math.abs(dX) > this.size) {
      this.acceleration.dX = (Math.sign(dX) * this.speedLimit) / 4;
    } else {
      this.acceleration.dX = 0;
    }

    if (Math.abs(dY) > this.size) {
      this.acceleration.dY = (Math.sign(dY) * this.speedLimit) / 4;
    } else {
      this.acceleration.dY = 0;
    }
  }

  setTargetGlobe(globes: Globe[]) {
    if (this.targetGlobe && globes.includes(this.targetGlobe)) return;

    this.targetGlobe = null;

    if (globes.length > 0) {
      this.targetGlobe = globes[Math.round(Math.random() * globes.length)];
    }
  }

  setTargetEnergy(energies: Energy[]) {
    if (this.targetEnergy && energies.includes(this.targetEnergy)) return;

    this.targetEnergy = null;

    if (energies.length > 0) {
      this.targetEnergy = energies[Math.round(Math.random() * energies.length)];
    }
  }
}
