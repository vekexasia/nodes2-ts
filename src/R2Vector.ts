import {S2Point} from "./S2Point";
import {Decimal} from './decimal';
import {S2} from "./S2";

/**
 * R2Vector represents a vector in the two-dimensional space. It defines the
 * basic geometrical operations for 2D vectors, e.g. cross product, addition,
 * norm, comparison etc.
 *
 */
export class R2Vector {
  private _x: decimal.Decimal;
  private _y: decimal.Decimal;
  constructor(_x:number|decimal.Decimal, _y:number|decimal.Decimal) {
    this._x = new Decimal(_x) as decimal.Decimal;
    this._y = new Decimal(_y) as decimal.Decimal;
    // this._x = new Decimal(_x) as decimal.Decimal;
    // this._y = new Decimal(_y) as decimal.Decimal;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }


  public get(index:number):decimal.Decimal{
    if (index > 1) {
      throw new Error(`Index out fo bounds error ${index}`);
    }
    return index == 0 ? this._x : this._y;
  }

  static fromPointFace(p:S2Point, face:number): R2Vector {
    return p.toR2Vector(face);
  }
  public static  add(p1:R2Vector, p2:R2Vector):R2Vector {
    return new R2Vector(p1._x.plus(p2._x), p1._y.plus(p2._y));
  }

  public static mul(p:R2Vector, _m:number|decimal.Decimal):R2Vector {
    const m:decimal.Decimal = new Decimal(_m) as decimal.Decimal;
    return new R2Vector(m.times(p._x), m.times(p._y));
  }

  public norm2():decimal.Decimal {
    return this.x.pow(2).plus(this.y.pow(2));
  }

  public static dotProd(p1:R2Vector, p2:R2Vector):decimal.Decimal {
    return p1.x.times(p2.x).plus(p1.y.times(p2.y));
  }

  public dotProd(that:R2Vector):decimal.Decimal {
    return R2Vector.dotProd(this, that);
  }

  public crossProd(that:R2Vector):decimal.Decimal {
    return this.x.times(that.y).minus(this.y.times(that.x));
  }

  public lessThan(vb:R2Vector):boolean {
    if (this.x.lt(vb.x)) {
      return true;
    }
    if (vb.x.lt(this.x)) {
      return false;
    }
    if (this.y.lt(vb.y)) {
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

  // from S2Projections.stToUV (QUADRATIC)
  public static singleStTOUV(_s:number|decimal.Decimal):decimal.Decimal {
    const s = S2.toDecimal(_s);
    if (s.gte(0)) {
      return S2.toDecimal(1)
              .dividedBy(3)
              .times(
                  s.plus(1).pow(2).minus(1)
              );
      // return (1 / 3.) * ((1 + s) * (1 + s) - 1);
    } else {
      return S2.toDecimal(1)
          .dividedBy(3)
          .times(
              S2.toDecimal(1)
                  .minus(S2.toDecimal(1).minus(s).pow(2)
                  )
          );
      // return (1 / 3.) * (1 - (1 - s) * (1 - s));
    }

  }
  public static singleUVToST(_x:number|decimal.Decimal) {
    const x = S2.toDecimal(_x);
    if (x.gte(0)) {
      return Decimal.sqrt(x.times(3).plus(1)).minus(1);
    } else {
      return S2.toDecimal(1)
          .minus(
              Decimal.sqrt(
                  S2.toDecimal(1).minus(x.times(3)
              )
              )
          )
    }
  }

  /**
   * To be used only if this vector is representing uv.
   * @param face
   * @returns {S2Point}
   */
  public toPoint(face:number) {
    switch (face) {
      case 0:
        return new S2Point(1, this.x, this.y);
      case 1:
        return new S2Point(this.x.neg(), 1, this.y);
      case 2:
        return new S2Point(this.x.neg(), this.y.neg(), 1);
      case 3:
        return new S2Point(-1, this.y.neg(), this.x.neg());
      case 4:
        return new S2Point(this.y, -1, this.x.neg());
      default:
        return new S2Point(this.y, this.x, -1);
    }
  }

  public toSt(which) {
    return which == 0?R2Vector.singleUVToST(this.x): R2Vector.singleUVToST(this.y);
  }
  public toString():string {
    return "(" + this.x.toString() + ", " + this.y.toString() + ")";
  }

}