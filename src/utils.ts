import { GAME_DIMENSION } from './constants';
import Blob from './models/blob';
import Point from './models/point';
import Vector from './models/vector';
import Wall from './models/wall';

export function scalar(v1: Vector, v2: Vector) {
  return v1.dX * v2.dX + v1.dY * v2.dY;
}

export function distanceBlob(obj1: Blob, obj2: Blob) {
  const dX = Math.abs(obj1.position.x - obj2.position.x);
  const dY = Math.abs(obj1.position.y - obj2.position.y);
  return Math.sqrt(dX * dX + dY * dY) - obj2.size - obj1.size;
}

export function distancePoint(obj1: Point, obj2: Point) {
  const dX = Math.abs(obj1.x - obj2.x);
  const dY = Math.abs(obj1.y - obj2.y);

  return Math.sqrt(dX * dX + dY * dY);
}

export function isAABB(round: Blob, wall: Wall) {
  const dX = Math.abs(round.position.x - wall.position.x) - wall.width / 2;
  const dY = Math.abs(round.position.y - wall.position.y) - wall.height / 2;
  return dX <= round.size && dY <= round.size;
}

export function isCollision(obj1: Blob, obj2: Blob) {
  const dist = distanceBlob(obj1, obj2);
  return dist <= 0;
}

export function isOutOfMap(obj: Blob) {
  if (
    obj.position.x + obj.size >= GAME_DIMENSION ||
    obj.position.x - obj.size <= 0
  )
    return true;
  if (
    obj.position.y + obj.size >= GAME_DIMENSION ||
    obj.position.y - obj.size <= 0
  )
    return true;
  return false;
}

export function isInTriangle(obj: Blob, wall: Wall) {
  const a = wall.corners[0].position;
  const b = wall.corners[1].position;
  const c = wall.corners[2].position;
  const p = obj.position;

  const ab = a.distance(b);
  const ac = a.distance(c);

  const abWeightMargin = obj.size / ab;
  const acWeightMargin = obj.size / ac;

  const w1 =
    (a.x * (c.y - a.y) + (p.y - a.y) * (c.x - a.x) - p.x * (c.y - a.y)) /
    ((b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y));

  const w2 = (p.y - a.y - w1 * (b.y - a.y)) / (c.y - a.y);

  return (
    w1 >= -abWeightMargin &&
    w2 >= -acWeightMargin &&
    w1 + w2 <= 1 + abWeightMargin + acWeightMargin
  );
}

//https://stackoverflow.com/questions/573084/how-to-calculate-bounce-angle
export function getBounceDirection(obj: Blob, normal: Vector) {
  const speed = new Vector(obj.speed.dX, obj.speed.dY);

  const uLength =
    (speed.dX * normal.dX + speed.dY * normal.dY) /
    (normal.dX * normal.dX + normal.dY * normal.dY);
  const u = new Vector(uLength * normal.dX, uLength * normal.dY);

  speed.substract(u);
  speed.substract(u);

  //speed.setLength(1);
  return speed;
}

// export function getClosestBlob(obj:Blob, blobs:Blob[]){
//   const minDistance = 99999;
//   const closestBlob = null;
//   blobs.forEach((blob)=>{
//     distance(obj,blob);
//     if ()
//   })
// }
