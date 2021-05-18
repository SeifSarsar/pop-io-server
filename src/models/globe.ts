import Bullet from './bullet';
import {
  BULLET_SPEED,
  GAME_DIMENSION,
  GLOBE_RELOAD,
  GLOBE_SIZE,
  GLOBE_SPEED,
  DECELERATION,
  BULLET_LIFE,
  SHIELD_OFFSET,
  SHIELD_SIZE,
  GLOBE_COLORS,
  BULLET_SHOOT_OFFSET,
  DEFLECT_OFFSET,
  DEATH_OFFSET,
} from '../constants';
import Blob from './blob';
import Energy from './energy';
import { Direction, EnergySize, Skill } from '../enum';
import { distanceBlob, isAABB, isCollision } from '../utils';
import Wall from './wall';
import State from '../state';
import Point from './point';
import Vector from './vector';
import Splash from './splash';
import Edge from './edge';
import { Socket } from 'socket.io';

export default abstract class Globe extends Blob {
  constructor(
    socket: Socket | null,
    id: string,
    username: string,
    state: State,
    screenWidth: number,
    screenHeight: number
  ) {
    super(
      new Point(
        Math.round(Math.random() * GAME_DIMENSION),
        Math.round(Math.random() * GAME_DIMENSION)
      ),
      GLOBE_SIZE
    );
    this.socket = socket;
    this.id = id;
    this.username = username;

    this.state = state;

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    const colors =
      GLOBE_COLORS[Math.round(Math.random() * (GLOBE_COLORS.length - 1))];

    this.borderColor = colors[0];
    this.color = colors[1];

    while (!this.isValidPosition(this.state.walls)) {
      this.position.x = Math.round(Math.random() * GAME_DIMENSION);
      this.position.y = Math.round(Math.random() * GAME_DIMENSION);
    }

    this.startInvincibility();
  }

  readonly MAX_LEVEL = 15;

  socket: Socket | null;
  id: string;
  borderColor: string;
  state: State;
  username: string;
  acceleration = new Vector(0, 0);
  mouseVector = new Vector(GLOBE_SIZE, 0);

  shieldSize = SHIELD_SIZE;
  speedLimit = GLOBE_SPEED;
  bulletSpeed = BULLET_SPEED;
  reloadTime = GLOBE_RELOAD;
  bulletLife = BULLET_LIFE;

  shieldOffset = SHIELD_OFFSET;

  isShooting = false;
  isReloading = false;
  shieldStart = -this.shieldSize / 2;
  shieldEnd = this.shieldSize / 2;

  reloadTimeout: NodeJS.Timeout;

  screenWidth: number;
  screenHeight: number;

  directions: Set<Direction> = new Set();

  isInvincible = true;

  xp = 0;
  kills = 0;
  lvl = 1;
  points = 0;

  abstract update(): boolean;
  abstract levelUp(): void;

  resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  updateGlobe(
    nearbyGlobes: Globe[],
    nearbyBullets: Bullet[],
    nearbyEnergies: Energy[],
    nearbyWalls: Wall[]
  ) {
    if (!this.isDead) {
      this.speed.add(this.acceleration);
      this.position.add(this.speed);

      this.applyFriction();

      if (this.speed.getLength() > this.speedLimit)
        this.speed.setLength(this.speedLimit);

      //add serialize function
      this.checkGlobeCollision(nearbyGlobes);
      this.checkBulletCollision(nearbyBullets);
      this.checkEnergyCollision(nearbyEnergies);
      this.checkWallCollision(nearbyWalls);
    }
  }

  moveShield(dX: number, dY: number) {
    this.mouseVector.dX = dX;
    this.mouseVector.dY = dY;

    const angle = Math.atan2(this.mouseVector.dY, this.mouseVector.dX);

    this.shieldStart = angle - this.shieldSize / 2;
    this.shieldEnd = angle + this.shieldSize / 2;
  }

  //Change color opacity
  startInvincibility() {
    let opacity = 1;
    let isIncreasing = true;
    const color = this.color;
    const interval = setInterval(() => {
      if (isIncreasing) opacity += 0.1;
      else opacity -= 0.1;

      if (opacity <= 0.5) isIncreasing = true;
      else if (opacity >= 0.9) isIncreasing = false;

      this.color = this.color.replace(/[\d\.]+\)$/g, `${opacity})`);
    }, 40);

    setTimeout(() => {
      this.isInvincible = false;
      this.color = color;
      clearInterval(interval);
    }, 3500);
  }

  startShooting() {
    if (this.isDead || this.isInvincible) return;

    this.isShooting = true;
    if (!this.isReloading) {
      this.shoot();
      this.isReloading = true;
      this.reloadTimeout = setTimeout(() => {
        this.isReloading = false;
        if (this.isShooting) this.startShooting();
      }, this.reloadTime);
    }
  }

  stopShooting() {
    this.isShooting = false;
  }

  canSee(obj: Blob | Splash) {
    const distanceX = Math.abs(this.position.x - obj.position.x) - obj.size;
    const distanceY = Math.abs(this.position.y - obj.position.y) - obj.size;

    return (
      distanceX < this.screenWidth / 2 && distanceY < this.screenHeight / 2
    );
  }

  canSeeWall(wall: Wall) {
    if (wall.edges.length === 1) return this.canSeeLimitEdge(wall.edges[0]);

    const distanceX =
      Math.abs(this.position.x - wall.position.x) - wall.width / 2;
    const distanceY =
      Math.abs(this.position.y - wall.position.y) - wall.height / 2;

    return (
      distanceX < this.screenWidth / 2 && distanceY < this.screenHeight / 2
    );
  }

  canSeeLimitEdge(edge: Edge) {
    //Horizontal
    if (edge.p1.y === edge.p2.y) {
      const distance = Math.abs(this.position.y - edge.p1.y);
      return distance < this.screenHeight / 2;
    }
    //Vertical
    if (edge.p1.x === edge.p2.x) {
      const distance = Math.abs(this.position.x - edge.p1.x);
      return distance < this.screenWidth / 2;
    }
  }

  shoot() {
    const bulletDirection = new Vector(
      this.mouseVector.dX,
      this.mouseVector.dY
    );

    bulletDirection.setLength(BULLET_SHOOT_OFFSET);
    const bulletPosition = new Point(this.position.x, this.position.y);
    bulletPosition.add(bulletDirection);

    bulletDirection.setLength(this.bulletSpeed);

    const bullet = new Bullet(
      this.id,
      bulletPosition,
      bulletDirection,
      this.bulletLife
    );

    if (bullet.isValidPosition(this.state.walls)) {
      this.state.bullets.push(bullet);
      this.shootAnimation();
    } else bullet.die();
  }

  shootAnimation() {
    let isIncreasing = true;
    const interval = setInterval(() => {
      if (isIncreasing) this.shieldOffset++;
      else {
        this.shieldOffset--;
      }

      if (this.shieldOffset === 12) isIncreasing = false;
      else if (this.shieldOffset === SHIELD_OFFSET) clearInterval(interval);
    }, 10);
  }

  setAim(dX: number, dY: number) {
    if (Math.abs(dX) <= this.size && Math.abs(dY) <= this.size) return;
    this.moveShield(dX, dY);
  }

  applyFriction() {
    if (this.acceleration.dX === 0 && Math.abs(this.speed.dX) > 0) {
      this.speed.dX *= DECELERATION;
      if (Math.abs(this.speed.dX) < 0.2) this.speed.dX = 0;
    }
    if (this.acceleration.dY === 0 && Math.abs(this.speed.dY) > 0) {
      this.speed.dY *= DECELERATION;
      if (Math.abs(this.speed.dY) < 0.2) this.speed.dY = 0;
    }
  }

  checkGlobeCollision(globes: Globe[]) {
    globes.forEach((globe) => {
      if (!globe.isDead && isCollision(this, globe)) {
        //O.2 is shield margin to deflect bullet
        const normal = new Vector(
          this.position.x - globe.position.x,
          this.position.y - globe.position.y
        );
        //Normal is bounce direction
        normal.setLength(1);
        this.bounce(normal);
      }
    });
  }

  checkBulletCollision(bullets: Bullet[]) {
    bullets.forEach((bullet) => {
      if (bullet.isDead || this.isDead) return;
      const dist = distanceBlob(this, bullet);
      if (dist <= DEFLECT_OFFSET) {
        if (this.isInvincible) {
          bullet.die();
        } else {
          //Globe dead
          if (dist < DEATH_OFFSET) {
            this.die(bullet);
            return;
          }

          let bulletAngle = Math.atan2(
            bullet.position.y - this.position.y,
            bullet.position.x - this.position.x
          );

          //O.2 is shield margin to deflect bullet
          if (
            bulletAngle >= this.shieldStart - 0.2 &&
            bulletAngle <= this.shieldEnd + 0.2
          ) {
            this.deflectBullet(bullet);
          }
        }
      }
    });
  }

  deflectBullet(bullet: Bullet) {
    bullet.globeId = this.id;
    bullet.speed.setX(this.mouseVector.dX);
    bullet.speed.setY(this.mouseVector.dY);
    bullet.speed.setLength(BULLET_SPEED);
  }

  checkEnergyCollision(nearbyEnergies: Energy[]) {
    nearbyEnergies.forEach((energy) => {
      if (distanceBlob(this, energy) <= SHIELD_OFFSET) {
        this.addEnergyXP(energy);
        const newEnergy = new Energy(energy.id, this.state.walls);
        this.state.energies[energy.id] = newEnergy;
      } else if (distanceBlob(this, energy) <= SHIELD_OFFSET) {
        energy.setTarget(this);
      }
    });
  }

  die(bullet: Bullet) {
    if (this.isDead) return;

    bullet.die();
    clearTimeout(this.reloadTimeout);

    this.isDead = true;
    this.isShooting = false;
    this.size = 0;

    this.state.splashes.push(new Splash(this));

    const globe = this.state.globes.get(bullet.globeId);
    if (!globe) return;

    if (this.id === globe.id) this.socket?.emit('die', this.xp, this.kills);
    else this.socket?.emit('die', this.xp, this.kills, globe.username);

    if (globe.isDead) {
      globe.socket?.emit('kill', `You have popped yourself!`);
    } else {
      globe.addGlobeXP(this);
      globe.socket?.emit('kill', `You have popped ${this.username}!`);
    }
  }

  bounce(direction: Vector) {
    this.speed.dX = direction.dX * this.speedLimit * 2;
    this.speed.dY = direction.dY * this.speedLimit * 2;
    this.position.add(this.speed);
  }

  checkWallCollision(walls: Wall[]) {
    let bounceDirection: Vector | null = null;
    walls.forEach((wall) => {
      if (
        (wall.edges.length > 1 && isAABB(this, wall)) ||
        (wall.edges.length === 1 && wall.edges[0].isIntersect(this))
      ) {
        bounceDirection = wall.getBounceDirectionEdge(this, false);
        if (bounceDirection) {
          this.bounce(bounceDirection);
          return;
        }

        bounceDirection = wall.getBounceDirectionCorner(this);
        if (bounceDirection) {
          this.bounce(bounceDirection);
          return;
        }
      }
    });
  }

  updateSkill(skill: string) {
    this.usePoint();
    switch (skill) {
      case Skill.Shield:
        this.shieldSize += 0.1;
        this.shieldStart -= 0.05;
        this.shieldEnd += 0.05;
        break;
      case Skill.Speed:
        this.speedLimit += 0.2;
        break;

      case Skill.Reload:
        this.reloadTime -= 100;
        break;

      case Skill.Bullet:
        this.bulletLife += 400;
        break;
    }
    this.socket?.emit('level', this.points);
  }

  serialize() {
    return {
      ...super.serialize(),
      id: this.id,
      shieldStart: this.shieldStart,
      shieldEnd: this.shieldEnd,
      shieldOffset: this.shieldOffset,
      borderColor: this.borderColor,
      username: this.username,
    };
  }

  serializeLeaderboard(rank: number) {
    return {
      id: this.id,
      rank,
      username: this.username,
      xp: this.xp,
      kills: this.kills,
    };
  }

  usePoint() {
    this.points = this.points === 0 ? 0 : this.points - 1;
  }

  addEnergyXP(energy: Energy) {
    switch (energy.initialSize) {
      case EnergySize.Small:
        this.xp += 5;
        break;
      case EnergySize.Medium:
        this.xp += 10;
        break;
      case EnergySize.Large:
        this.xp += 20;
        break;
    }
    this.levelUp();
  }

  addGlobeXP(globe: Globe) {
    this.xp += Math.round(globe.getTotalXPByLevel(globe.lvl) / 2);
    this.kills++;
    this.levelUp();
  }

  getLevelByTotalXP(xp: number) {
    for (let i = 1; i < this.MAX_LEVEL; i++) {
      xp -= this.getXPByLevel(i);
      if (xp < 0) return i;
    }
    return this.MAX_LEVEL;
  }

  getXPByLevel(lvl: number) {
    return 20 + 5 * Math.pow(lvl, 2);
  }

  getTotalXPByLevel(lvl: number) {
    let total = 0;
    for (let i = 1; i <= lvl; i++) {
      total += this.getXPByLevel(i);
    }
    return total;
  }
}
