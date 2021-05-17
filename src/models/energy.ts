import { ENERGY_COLORS, GAME_DIMENSION } from '../constants';
import Blob from './blob';
import { EnergySize } from '../enum';
import Wall from './wall';
import Point from './point';
import Globe from './globe';
import { isAABB, isOutOfMap } from '../utils';

export default class Energy extends Blob {
  constructor(id: number, walls: Wall[]) {
    const random = Math.random();
    let size: number;
    if (random <= 0.6) {
      size = EnergySize.Small;
    } else if (random > 0.6 && random <= 0.95) {
      size = EnergySize.Medium;
    } else {
      size = EnergySize.Large;
    }
    super(
      new Point(
        Math.round(Math.random() * GAME_DIMENSION),
        Math.round(Math.random() * GAME_DIMENSION)
      ),
      size
    );

    while (!this.isValidPosition(walls)) {
      this.position.x = Math.round(Math.random() * GAME_DIMENSION);
      this.position.y = Math.round(Math.random() * GAME_DIMENSION);
    }

    this.isInflate = false;
    this.initialSize = this.size;
    this.id = id;
    this.color =
      ENERGY_COLORS[Math.round(Math.random() * (ENERGY_COLORS.length - 1))];
    this.SIZE_LIMIT_RATE = 1.2;

    this.target = null;
  }

  readonly SIZE_LIMIT_RATE: number;

  id: number;
  color: string;
  initialSize: number;
  isInflate: boolean;
  target: Globe | null;

  setTarget(globe: Globe) {
    this.target = globe;
  }

  update() {
    if (this.target) {
      if (this.target.isDead) {
        this.target = null;
        this.speed.dX = 0;
        this.speed.dY = 0;
      } else {
        this.speed.dX = this.target.position.x - this.position.x;
        this.speed.dY = this.target.position.y - this.position.y;
        this.speed.setLength(5);
        this.position.add(this.speed);
        return;
      }
    }

    if (this.isInflate) {
      this.size += 0.05;
      this.isInflate = this.size < this.initialSize * this.SIZE_LIMIT_RATE;
    } else {
      this.size -= 0.05;
      this.isInflate = this.size < this.initialSize;
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      color: this.color,
    };
  }
}
