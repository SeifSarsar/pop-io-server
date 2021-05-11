import Edge from './edge';
import Blob from './blob';
import Point from './point';
import Vector from './vector';

export class Corner {
  constructor(position: Point) {
    this.position = position;
  }

  position: Point;
  edge1: Edge;
  edge2: Edge;

  isIntersect(obj: Blob) {
    if (this.position.distance(obj.position) <= obj.size) {
      return this;
    }
    return null;
  }
  getNormal() {
    const normal1 = this.edge1.getNormal();
    const normal2 = this.edge2.getNormal();
    const vector = new Vector(normal1.dX + normal2.dX, normal1.dY + normal2.dY);
    const length = vector.getLength();
    vector.dX = vector.dX / length;
    vector.dY = vector.dY / length;
    return vector;
  }
}
