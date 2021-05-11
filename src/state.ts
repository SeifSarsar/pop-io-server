import Bot from './models/bot';
import Bullet from './models/bullet';
import Energy from './models/energy';
import Globe from './models/globe';
import Splash from './models/splash';
import Wall from './models/wall';

export default class State {
  constructor() {}

  globes: Map<string, Globe> = new Map();
  bullets: Bullet[] = [];
  walls: Wall[] = [];
  energies: Energy[] = [];
  splashes: Splash[] = [];
}
