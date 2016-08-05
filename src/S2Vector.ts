import {S2Point} from "./S2Point";
/**
 * R2Vector represents a vector in the two-dimensional space. It defines the
 * basic geometrical operations for 2D vectors, e.g. cross product, addition,
 * norm, comparison etc.
 *
 */
export class R2Vector {
  constructor(private _x:number, private _y:number) {

  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }


  public get(index:number):number {
    if (index > 1) {
      throw new Error(`Index out fo bounds error ${index}`);
    }
    return index == 0 ? this._x : this._y;
  }

  static fromPointFace(p:S2Point, face:number): R2Vector {
    return p.toR2Vector(face);
  }
  public static  add(p1:R2Vector, p2:R2Vector):R2Vector {
    return new R2Vector(p1._x + p2._x, p1._y + p2._y);
  }

  public static mul(p:R2Vector, m:number):R2Vector {
    return new R2Vector(m * p._x, m * p._y);
  }

  public norm2():number {
    return (this.x * this.x) + (this.y * this.y);
  }

  public static dotProd(p1:R2Vector, p2:R2Vector):number {
    return (p1.x * p2.x) + (p1.y * p2.y);
  }

  public dotProd(that:R2Vector):number {
    return R2Vector.dotProd(this, that);
  }

  public crossProd(that:R2Vector):number {
    return this.x * that.y - this.y * that.x;
  }

  public lessThan(vb:R2Vector):boolean {
    if (this.x < vb.x) {
      return true;
    }
    if (vb.x < this.x) {
      return false;
    }
    if (this.y < vb.y) {
      return true;
    }
    return false;
  }

//
// @Override
// public boolean equals(Object that) {
//   if (!(that instanceof R2Vector)) {
//     return false;
//   }
//   R2Vector thatPoint = (R2Vector) that;
//   return this.x == thatPoint.x && this.y == thatPoint.y;
// }

// /**
//  * Calcualates hashcode based on stored coordinates. Since we want +0.0 and
//  * -0.0 to be treated the same, we ignore the sign of the coordinates.
//  */
// @Override
// public int hashCode() {
//   long value = 17;
//   value += 37 * value + Double.doubleToLongBits(Math.abs(x));
//   value += 37 * value + Double.doubleToLongBits(Math.abs(y));
//   return (int) (value ^ (value >>> 32));
// }
//

  public static fromSTVector(stVector: R2Vector):R2Vector{
    return new R2Vector(
      R2Vector.singleStTOUV(stVector.x),
      R2Vector.singleStTOUV(stVector.y)
    );
    
  }
  private static singleStTOUV(s:number) {
    if (s >= 0) {
      return (1 / 3.) * ((1 + s) * (1 + s) - 1);
    } else {
      return (1 / 3.) * (1 - (1 - s) * (1 - s));
    }

  }
  private static singleToST(x) {
    if (x >= 0) {
      return 0.5 * Math.sqrt(1 + 3 * x);
    } else {
      return 1 - 0.5 * Math.sqrt(1 - 3 * x);
    }
  }

  public toPoint(face:number) {
    switch (face) {
      case 0:
        return new S2Point(1, this.x, this.y);
      case 1:
        return new S2Point(-this.x, 1, this.y);
      case 2:
        return new S2Point(-this.x, -this.y, 1);
      case 3:
        return new S2Point(-1, -this.y, -this.x);
      case 4:
        return new S2Point(this.y, -1, -this.x);
      default:
        return new S2Point(this.y, this.x, -1);
    }
  }

  public toSt(which) {
    return which == 0?R2Vector.singleToST(this.x): R2Vector.singleToST(this.y);
  }
  public toString():string {
    return "(" + this.x + ", " + this.y + ")";
  }

}