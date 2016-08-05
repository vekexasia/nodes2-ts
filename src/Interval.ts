export abstract class Interval {
  public lo:number;
  public hi:number;

  constructor(public lo:number, public hi:number) {

  }

  /** Return true if the interval is empty, i.e. it contains no points. */

  public abstract isEmpty():boolean;

  /**
   * Return the center of the interval. For empty intervals, the result is
   * arbitrary.
   */
  public abstract getCenter():number;

  /**
   * Return the length of the interval. The length of an empty interval is
   * negative.
   */
  public abstract getLength():number;

  public abstract contains(p:number):boolean;

  public abstract interiorContains(p:number):boolean;

  public  toString():string {
    return "[" + this.lo + ", " + this.hi + "]";
  }


  /**
   * Return true if two intervals contains the same set of points.
   */
  public equals(that:any):boolean {
    if (typeof(that) === typeof(this)) {
      return this.lo == that.lo && this.hi == that.hi;
    }
    return false;
  }


}