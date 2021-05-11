import { Direction } from './enum';
import Globe from './models/globe';

export default class Controller {
  constructor() {}
  keyDown(globe: Globe | undefined, direction: Direction) {
    if (!globe || globe.isDead) return;

    globe.directions.add(direction);

    const acceleration = globe.speedLimit / 4;

    if (direction === Direction.Up) {
      globe.acceleration.dY = globe.directions.has(Direction.Down)
        ? 0
        : -acceleration;
    } else if (direction === Direction.Right) {
      globe.acceleration.dX = globe.directions.has(Direction.Left)
        ? 0
        : acceleration;
    } else if (direction === Direction.Down) {
      globe.acceleration.dY = globe.directions.has(Direction.Up)
        ? 0
        : acceleration;
    } else if (direction === Direction.Left) {
      globe.acceleration.dX = globe.directions.has(Direction.Right)
        ? 0
        : -acceleration;
    }
  }

  keyUp(globe: Globe | undefined, direction: Direction) {
    if (!globe || globe.isDead) return;

    const acceleration = globe.speedLimit / 4;

    globe.directions.delete(direction);

    if (direction === Direction.Up) {
      globe.acceleration.dY = globe.directions.has(Direction.Down)
        ? acceleration
        : 0;
    } else if (direction === Direction.Right) {
      globe.acceleration.dX = globe.directions.has(Direction.Left)
        ? -acceleration
        : 0;
    } else if (direction === Direction.Down) {
      globe.acceleration.dY = globe.directions.has(Direction.Up)
        ? -acceleration
        : 0;
    } else if (direction === Direction.Left) {
      globe.acceleration.dX = globe.directions.has(Direction.Right)
        ? acceleration
        : 0;
    }
  }

  mousedown(globe: Globe | undefined) {
    if (!globe || globe.isDead) return;

    globe.startShooting();
  }

  mouseup(globe: Globe | undefined) {
    if (!globe || globe.isDead) return;

    globe.stopShooting();
  }
}
