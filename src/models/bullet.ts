import { BULLET_SIZE } from '../constants';
import Blob from './blob';
import { isAABB, isCollision } from '../utils';
import Wall from './wall';
import Point from './point';
import Vector from './vector';

export default class Bullet extends Blob {
  constructor(globeId: string, position: Point, speed: Vector, life: number) {
    super(position, BULLET_SIZE, speed);

    this.globeId = globeId;
    this.lifeTimeout = setTimeout(() => {
      this.die();
    }, life);
  }

  globeId: string;
  lifeTimeout: NodeJS.Timeout;
  isDying = false;
  opacity = 1;

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
    let bounceDirection: Vector | null = null;
    walls.forEach((wall) => {
      if (
        (wall.edges.length > 1 && isAABB(this, wall)) ||
        (wall.edges.length === 1 && wall.edges[0].isIntersect(this))
      ) {
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
    });
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
