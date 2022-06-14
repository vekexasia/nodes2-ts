import {S2Point} from "./S2Point";

export class S1Angle {

  public radians: number;
  constructor(radians:number) {
    this.radians = radians;
  }


  public degrees() {
    return this.radians * 180/Math.PI;
  }

  //
  // public long e5() {
  //   return Math.round(degrees() * 1e5);
  // }
  //
  // public long e6() {
  //   return Math.round(degrees() * 1e6);
  // }
  //
  // public long e7() {
  //   return Math.round(degrees() * 1e7);
  // }

  /**
   * Return the angle between two points, which is also equal to the distance
   * between these points on the unit sphere. The points do not need to be
   * normalized.
   */
  static fromPoints(x:S2Point, y:S2Point) {
    return new S1Angle(x.angle(y));
  }

  public lessThan(that:S1Angle):boolean {
    return this.radians < (that.radians);
  }

  public greaterThan(that:S1Angle):boolean {
    return this.radians > (that.radians);
  }

  public lessOrEquals(that:S1Angle):boolean {
    return this.radians <= (that.radians);
  }

  public greaterOrEquals(that:S1Angle):boolean {
    return this.radians >= (that.radians);
  }

  public static max(left:S1Angle, right:S1Angle):S1Angle {
    return right.greaterThan(left) ? right : left;
  }

  public static min(left:S1Angle, right:S1Angle):S1Angle {
    return right.greaterThan(left) ? left : right;
  }

  public static degrees(degrees:number):S1Angle {
    return new S1Angle(degrees * (Math.PI/180));
  }

//
// public static S1Angle e5(long e5) {
//   return degrees(e5 * 1e-5);
// }
//
// public static S1Angle e6(long e6) {
//   // Multiplying by 1e-6 isn't quite as accurate as dividing by 1e6,
//   // but it's about 10 times faster and more than accurate enough.
//   return degrees(e6 * 1e-6);
// }
//
// public static S1Angle e7(long e7) {
//   return degrees(e7 * 1e-7);
// }

  /**
   * Writes the angle in degrees with a "d" suffix, e.g. "17.3745d". By default
   * 6 digits are printed; this can be changed using setprecision(). Up to 17
   * digits are required to distinguish one angle from another.
   */
  public toString():string {
    return this.degrees() + "d";
  }

  public compareTo(that:S1Angle):number {
    return this.radians < that.radians ? -1 : this.radians > that.radians ? 1 : 0;
  }
}
