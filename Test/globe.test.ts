import Globe from '../src/models/globe';
import Vector from '../src/models/vector';
import Bullet from '../src/models/bullet';
import State from '../src/state';
import { BOT_SCREEN_SIZE } from '../src/constants';
import Point from '../src/models/point';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

class TestGlobe extends Globe {
  constructor(id: string, username: string, state: State) {
    super(null, id, username, state, BOT_SCREEN_SIZE, BOT_SCREEN_SIZE);
  }

  levelUp(): void {}

  update() {
    return false;
  }
}

describe('TestGlobe', () => {
  let instance: TestGlobe;

  beforeEach(() => {
    instance = new TestGlobe('1', 'TestBot', new State());
    instance.position.x = 0;
    instance.position.y = 0;
    instance.reloadTime = 1000;
    instance.isInvincible = false;
  });

  it('should be correctly initialized', () => {
    expect(instance.borderColor).toBeDefined();
    expect(instance.color).toBeDefined();
    expect(instance.isShooting).toBeFalsy();
    expect(instance.speed).toMatchObject(new Vector(0, 0));
    expect(instance.acceleration).toMatchObject(new Vector(0, 0));
  });

  it('should shoot 2 bullets during 2s with relaod time of 1s.', async () => {
    const shootSpy = jest.spyOn(instance, 'shoot');
    instance.startShooting();
    await delay(2000);
    instance.stopShooting();
    expect(shootSpy).toBeCalledTimes(2);
  });

  it('should not call die() if no collision occured with bullet', () => {
    const dieSpy = jest.spyOn(instance, 'die');

    const bullets = [
      new Bullet('2', 'UFO', new Point(30, 30), new Vector(0, 0), 1000),
    ];

    instance.checkBulletCollision(bullets);
    expect(dieSpy).not.toBeCalled();
  });

  it('should call die() if collision occured with bullet', () => {
    const dieSpy = jest.spyOn(instance, 'die');

    const bullets = [
      new Bullet('2', 'UFO', new Point(0, 25), new Vector(0, 0), 1000),
    ];

    instance.checkBulletCollision(bullets);
    expect(dieSpy).toBeCalled();
  });

  it('should not call die() and call deflect() if collision occured with bullet on shield', () => {
    const dieSpy = jest.spyOn(instance, 'die');
    const deflectBulletSpy = jest.spyOn(instance, 'deflectBullet');

    const bullets = [
      new Bullet('2', 'UFO', new Point(35, 0), new Vector(0, 0), 1000),
    ];

    instance.moveShield(20, 0);
    instance.checkBulletCollision(bullets);
    expect(dieSpy).not.toBeCalled();
    expect(deflectBulletSpy).toBeCalled();
  });

  it('should not call die() and call deflect() if collision occured with bullet on shield margin', () => {
    const dieSpy = jest.spyOn(instance, 'die');
    const deflectBulletSpy = jest.spyOn(instance, 'deflectBullet');

    const bullets = [
      new Bullet('2', 'UFO', new Point(35, 15), new Vector(0, 0), 1000),
    ];

    instance.moveShield(20, 0);
    instance.checkBulletCollision(bullets);
    expect(dieSpy).not.toBeCalled();
    expect(deflectBulletSpy).toBeCalled();
  });
});
