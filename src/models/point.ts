import Vector from './vector';

export default class Point {
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  x: number;
  y: number;

  add(v: Vector) {
    this.x = this.x + v.dX;
    this.y = this.y + v.dY;
  }

  distance(p: Point) {
    return Math.sqrt(
      (p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y)
    );
  }
  serialize() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
