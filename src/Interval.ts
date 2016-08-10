import {S2} from "./S2";
export abstract class Interval {
  public lo:decimal.Decimal;
  public hi:decimal.Decimal;

  constructor(lo:number|decimal.Decimal, hi:number|decimal.Decimal) {
    this.lo = S2.toDecimal(lo);
    this.hi = S2.toDecimal(hi);
  }

  /** Return true if the interval is empty, i.e. it contains no points. */

  public abstract isEmpty():boolean;

  /**
   * Return the center of the interval. For empty intervals, the result is
   * arbitrary.
   */
  public abstract getCenter():decimal.Decimal;

  /**
   * Return the length of the interval. The length of an empty interval is
   * negative.
   */
  public abstract getLength():decimal.Decimal;

  public abstract contains(p:number|decimal.Decimal):boolean;

  public abstract interiorContains(p:number|decimal.Decimal):boolean;

  public  toString():string {
    return "[" + this.lo.toString() + ", " + this.hi.toString() + "]";
  }


  /**
   * Return true if two intervals contains the same set of points.
   */
  public equals(that:any):boolean {
    if (typeof(that) === typeof(this)) {
      return this.lo .eq(that.lo) && this.hi.eq(that.hi);
    }
    return false;
  }


}