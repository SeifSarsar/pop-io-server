import Blob from './blob';
import Point from './point';
import { distancePoint, scalar } from '../utils';
import Vector from './vector';

export default class Edge {
  constructor(p1: Point, p2: Point) {
    this.p1 = p1;
    this.p2 = p2;
  }
  p1: Point;
  p2: Point;

  distance(position: Point) {
    const objVector = new Vector(
      position.x - this.p1.x,
      position.y - this.p1.y
    );

    const edgeVector = new Vector(this.p2.x - this.p1.x, this.p2.y - this.p1.y);

    const vectorScalar = scalar(objVector, edgeVector);

    const projUnit =
      vectorScalar /
      (edgeVector.dX * edgeVector.dX + edgeVector.dY * edgeVector.dY);

    const projVector = new Vector(
      edgeVector.dX * projUnit,
      edgeVector.dY * projUnit
    );

    const objVectorLength = objVector.getLength();
    const edgeVectorLength = edgeVector.getLength();

    const contact = new Point(
      this.p1.x + projVector.dX,
      this.p1.y + projVector.dY
    );

    if (
      Math.round(
        distancePoint(this.p1, contact) + distancePoint(this.p2, contact)
      ) !== Math.round(edgeVectorLength)
    ) {
      return null;
    }

    const projVectorLength = projVector.getLength();
    //Pythagore
    return Math.sqrt(
      objVectorLength * objVectorLength - projVectorLength * projVectorLength
    );
  }
  isIntersect(obj: Blob) {
    const distance = this.distance(obj.position);

    if (distance && distance < obj.size) {
      return this;
    }
    return null;
  }

  getNormal() {
    const vector = new Vector(this.p2.x - this.p1.x, this.p2.y - this.p1.y);

    const length = vector.getLength();
    vector.dX = vector.dX / length;
    vector.dY = vector.dY / length;
    vector.rotate(-Math.PI / 2);
    return vector;
  }

  serialize() {
    return {
      p1: this.p1.serialize(),
      p2: this.p2.serialize(),
    };
  }
}
