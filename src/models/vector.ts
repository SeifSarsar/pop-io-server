export default class Vector {
  constructor(dX: number, dY: number) {
    this.dX = dX;
    this.dY = dY;
  }
  dX: number;
  dY: number;

  setX(x: number) {
    this.dX = x;
  }
  setY(y: number) {
    this.dY = y;
  }
  rotate(angle: number) {
    const oldX = this.dX;
    const oldY = this.dY;
    this.dX = oldX * Math.cos(angle) - oldY * Math.sin(angle);
    this.dY = oldX * Math.sin(angle) + oldY * Math.cos(angle);
  }

  invert() {
    this.dX = -this.dX;
    this.dY = -this.dY;
  }
  add(v: Vector) {
    this.dX = this.dX + v.dX;
    this.dY = this.dY + v.dY;
  }

  substract(v: Vector) {
    this.dX = this.dX - v.dX;
    this.dY = this.dY - v.dY;
  }

  setLength(length: number) {
    const oldLength = this.getLength();

    this.dX *= length / oldLength;
    this.dY *= length / oldLength;
  }

  resize(length: number) {
    const oldLength = this.getLength();

    this.dX = (this.dX * length) / oldLength;
    this.dY = (this.dY * length) / oldLength;
  }

  getLength() {
    return Math.sqrt(this.dX * this.dX + this.dY * this.dY);
  }
}
