import { BULLET_SIZE } from '../constants';
import Blob from './blob';
import { isAABB, isCollision, isInTriangle, isOutOfMap } from '../utils';
import Wall from './wall';
import Point from './point';
import Vector from './vector';

export default class Bullet extends Blob {
  constructor(
    globeId: string,
    globeUsername: string,
    position: Point,
    speed: Vector,
    life: number
  ) {
    super(position, BULLET_SIZE, speed);

    this.globeId = globeId;
    this.globeUsername = globeUsername;
    this.lifeTimeout = setTimeout(() => {
      this.die();
    }, life);
  }

  globeId: string;
  globeUsername: string;

  lifeTimeout: NodeJS.Timeout;
  isDying = false;
  opacity = 1;
  lastBounceTime: number = 0;

  isValidPosition(walls: Wall[]) {
    if (isOutOfMap(this)) return false;

    for (const wall of walls) {
      if (
        (wall.corners.length === 4 && isAABB(this, wall)) ||
        (wall.corners.length === 3 && isInTriangle(this, wall))
      )
        return false;
    }

    return true;
  }

  checkBulletCollision(bullets: Bullet[]) {
    bullets.forEach((bullet) => {
      if (this !== bullet && isCollision(this, bullet)) {
        this.die();
        bullet.die();
      }
    });
  }

  blur() {
    this.opacity -= 0.2;
    this.color = this.color.replace(/[^,]+(?=\))/, this.opacity.toString());

    if (this.opacity <= 0) this.isDead = true;
  }

  die() {
    this.isDying = true;
    clearTimeout(this.lifeTimeout);
  }

  checkWallCollision(walls: Wall[]) {
    walls.forEach((wall) => {
      if (wall.edges.length > 1 && isAABB(this, wall)) {
        if (
          wall.edges.length === 4 ||
          (wall.edges.length === 3 && isInTriangle(this, wall))
        ) {
          this.bounce(wall);
        }
      } else if (wall.edges[0].isIntersect(this)) {
        this.bounce(wall);
      }
    });
  }

  bounce(wall: Wall) {
    let bounceDirection: Vector | null = null;
    bounceDirection = wall.getBounceDirectionEdge(this);
    if (bounceDirection) {
      bounceDirection.setLength(this.speed.getLength());
      this.speed = bounceDirection;
      return;
    }

    bounceDirection = wall.getBounceDirectionCorner(this);
    if (bounceDirection) {
      bounceDirection.setLength(this.speed.getLength());
      this.speed = bounceDirection;
      return;
    }
  }

  update(bullets: Bullet[], walls: Wall[]) {
    if (this.isDying) {
      this.blur();
    } else if (!this.isDead) {
      this.position.add(this.speed);
      this.checkBulletCollision(bullets);
      this.checkWallCollision(walls);
    }

    return this.isDead;
  }

  serialize() {
    return super.serialize();
  }
}
