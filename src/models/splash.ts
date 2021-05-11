import { GLOBE_SIZE } from '../constants';
import { distancePoint } from '../utils';
import Blob from './blob';
import Edge from './edge';
import Globe from './globe';
import Point from './point';
import Vector from './vector';

export default class Splash {
  constructor(globe: Globe) {
    this.size = 0;
    this.color = globe.borderColor;
    this.position = globe.position;
    this.initialize();
  }

  readonly N_LINES = 6;
  readonly LINE_MAX_LENGTH = 20;

  position: Point;
  size: number;
  color: string;

  lines: Edge[] = [];
  directions: Vector[] = [];

  isExpanding = true;
  isDead = false;

  initialize() {
    const angleInterval = (2 * Math.PI) / this.N_LINES;

    for (let i = 0; i < this.N_LINES; i++) {
      const lineDir = new Vector(GLOBE_SIZE, 0);
      lineDir.rotate(i * angleInterval);
      const line = new Edge(
        new Point(this.position.x + lineDir.dX, this.position.y + lineDir.dY),
        new Point(this.position.x + lineDir.dX, this.position.y + lineDir.dY)
      );
      this.lines.push(line);

      lineDir.setLength(2);
      this.directions.push(lineDir);
    }
  }

  update() {
    if (this.isDead) return true;

    if (this.size >= this.LINE_MAX_LENGTH) this.isExpanding = false;

    this.lines.forEach((line: Edge, index: number) => {
      if (this.isExpanding) {
        line.p2.add(this.directions[index]);
      } else {
        line.p1.add(this.directions[index]);
      }
      this.size = distancePoint(line.p1, line.p2);

      if (!this.isDead && this.size <= 0 && this.isExpanding === false) {
        this.isDead = true;
      }
    });

    return this.isDead;
  }

  serialize() {
    return {
      color: this.color,
      lines: this.lines.map((line: Edge) => line.serialize()),
    };
  }
}
