import { isAABB, isOutOfMap } from '../utils';
import Point from './point';
import Vector from './vector';
import Wall from './wall';

export default abstract class Blob {
  constructor(
    position: Point,
    size: number,
    speed = new Vector(0, 0),
    color = 'rgba(255,255,255,1)'
  ) {
    this.position = position;
    this.size = size;
    this.speed = speed;
    this.color = color;
  }

  position: Point;
  speed: Vector;
  isDead = false;
  size: number;
  color: string;

  isValidPosition(walls: Wall[]) {
    if (isOutOfMap(this)) return false;
    for (const wall of walls) {
      if (isAABB(this, wall)) {
        return false;
      }
    }
    return true;
  }

  serialize() {
    return {
      position: this.position.serialize(),
      size: this.size,
      color: this.color,
    };
  }
}
