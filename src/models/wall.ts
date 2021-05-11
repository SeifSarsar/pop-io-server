import Blob from './blob';
import { getBounceDirection, scalar } from '../utils';
import Point from './point';
import { Corner } from './corner';
import Edge from './edge';
import Vector from './vector';

export default class Wall {
  constructor(x: number, y: number) {
    this.position = new Point(x, y);
    this.currentPoint = new Point(x, y);
    this.currentCorner = new Corner(new Point(x, y));
  }

  position: Point;
  currentCorner: Corner;
  currentPoint: Point;
  //nPoints: number;
  edges: Edge[] = [];
  corners: Corner[] = [];
  //start
  width: number = 0;
  height: number = 0;

  getBounceDirectionEdge(obj: Blob, realistic = true) {
    for (const edge of this.edges) {
      const collidingEdge = edge.isIntersect(obj);
      if (collidingEdge) {
        const objVector = new Vector(
          obj.position.x - this.position.x,
          obj.position.y - this.position.y
        );
        const normal = collidingEdge.getNormal();
        if (scalar(objVector, normal) < 0) normal.invert();

        if (realistic) {
          return getBounceDirection(obj, normal);
        }
        return normal;
      }
    }
    return null;
  }

  getBounceDirectionCorner(obj: Blob) {
    for (const corner of this.corners) {
      const collidingCorner = corner.isIntersect(obj);

      if (collidingCorner) {
        const objVector = new Vector(
          obj.position.x - this.position.x,
          obj.position.y - this.position.y
        );
        const normal = collidingCorner.getNormal();
        if (scalar(objVector, normal) < 0) normal.invert();

        return normal;
      }
    }
    return null;
  }

  go(dX: number, dY: number) {
    const nextPoint = new Point(
      this.currentPoint.x + dX,
      this.currentPoint.y + dY
    );

    if (nextPoint.x < this.position.x) {
      // next position left of most left position
      this.width += this.position.x - nextPoint.x;
      this.position.x = nextPoint.x;
    } else if (nextPoint.x > this.position.x + this.width) {
      // next position further than most left position + width
      this.width += nextPoint.x - this.position.x;
    }

    if (nextPoint.y < this.position.y) {
      this.height += this.position.y - nextPoint.y;
      this.position.y = nextPoint.y;
    } else if (nextPoint.y > this.position.y + this.height) {
      this.height += nextPoint.y - this.position.y;
    }

    const edge = new Edge(this.currentPoint, nextPoint);
    this.edges.push(edge);

    this.currentCorner.edge2 = edge;
    this.corners.push(this.currentCorner);

    const nextCorner = new Corner(nextPoint);
    nextCorner.edge1 = edge;

    this.currentPoint = nextPoint;

    this.currentCorner = nextCorner;
  }

  close() {
    if (this.edges.length > 1) {
      const firstEdge = this.edges[0];
      const nextEdge = new Edge(this.currentPoint, firstEdge.p1);
      this.edges.push(nextEdge);

      this.currentCorner.edge2 = nextEdge;
      this.corners.push(this.currentCorner);
      this.corners[0].edge1 = nextEdge;
    }

    //Set position to center
    this.position = new Point(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
  }

  serialize() {
    return {
      edges: this.edges.map((edge) => edge.serialize()),
    };
  }
}
