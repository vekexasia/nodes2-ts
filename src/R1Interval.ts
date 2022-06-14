import {Interval} from "./Interval";
import {S2} from "./S2";
/**
 * An R1Interval represents a closed interval on a unit circle (also known as a
 * 1-dimensional sphere). It is capable of representing the empty interval
 * (containing no points), the full interval (containing all points), and
 * zero-length intervals (containing a single point).
 *
 *  Points are represented by the angle they make with the positive x-axis in
 * the range [-Pi, Pi]. An interval is represented by its lower and upper bounds
 * (both inclusive, since the interval is closed). The lower bound may be
 * greater than the upper bound, in which case the interval is "inverted" (i.e.
 * it passes through the point (-1, 0)).
 *
 *  Note that the point (-1, 0) has two valid representations, Pi and -Pi. The
 * normalized representation of this point internally is Pi, so that endpoints
 * of normal intervals are in the range (-Pi, Pi]. However, we take advantage of
 * the point -Pi to construct two special intervals: the Full() interval is
 * [-Pi, Pi], and the Empty() interval is [Pi, -Pi].
 *
 */

export class R1Interval extends Interval {

  /** Return true if the interval is empty, i.e. it contains no points. */
  public isEmpty() {
    return this.lo > this.hi;
  }

  public getCenter() {
    return (this.lo + this.hi)/2;
  }

  public getLength() {
    return this.hi - this.lo;
  }

  public contains(p:number):boolean {
    return p >= this.lo && p <= this.hi;

  }

  /** Return true if the interior of the interval contains the point 'p'. */
  public interiorContains(p:number):boolean {
    return p > this.lo && p < this.hi;
  }

  /**
   * Return true if the interval contains the given interval 'y'. Works for
   * empty, full, and singleton intervals.
   */
  public containsI(y:R1Interval):boolean {
    if (y.isEmpty()) {
      return true;
    }
    return y.lo >= this.lo && y.hi <= this.hi;
  }


  public interiorContainsI(y:R1Interval):boolean {
    if (y.isEmpty()) {
      return true;
    }
    return y.lo > this.lo && y.hi < this.hi;
  }

  /**
   * Return true if this interval intersects the given interval, i.e. if they
   * have any points in common.
   */
  public intersects(y:R1Interval):boolean {
    if (this.lo <= y.lo) {
      return y.lo <= (this.hi) && y.lo <= (y.hi);
    } else {
      return this.lo <= (y.hi) && this.lo <= (this.hi);
    }
  }

  /**
   * Return true if the interior of this interval intersects any point of the
   * given interval (including its boundary).
   */
  public interiorIntersects(y:R1Interval):boolean {
    return y.lo < (this.hi) && this.lo < (y.hi) && this.lo < (this.hi) && y.lo <= (y.hi);
  }

  /** Expand the interval so that it contains the given point "p". */
  public addPoint(p:number):R1Interval {
    if (this.isEmpty()) {
      return R1Interval.fromPoint(p);
    } else if (p < (this.lo)) {
      return new R1Interval(p, this.hi);
    } else if (p > (this.hi)) {
      return new R1Interval(this.lo, p);
    } else {
      return new R1Interval(this.lo, this.hi);
    }
  }

  /**
   * Return an interval that contains all points with a distance "radius" of a
   * point in this interval. Note that the expansion of an empty interval is
   * always empty.
   */
  public expanded(radius:number):R1Interval {
    // assert (radius >= 0);
    if (this.isEmpty()) {
      return this;
    }
    return new R1Interval(this.lo - radius, this.hi + radius);
  }

  /**
   * Return the smallest interval that contains this interval and the given
   * interval "y".
   */
  public union(y:R1Interval):R1Interval {
    if (this.isEmpty()) {
      return y;
    }
    if (y.isEmpty()) {
      return this;
    }
    return new R1Interval(
        Math.min(this.lo, y.lo),
        Math.max(this.hi, y.hi)
    );
  }

  /**
   * Return the intersection of this interval with the given interval. Empty
   * intervals do not need to be special-cased.
   */
  public intersection(y:R1Interval):R1Interval {
    return new R1Interval(
        Math.max(this.lo, y.lo),
        Math.min(this.hi, y.hi)
    );
  }

  /**
   * Return true if the length of the symmetric difference between the two
   * intervals is at most the given tolerance.
   */
  public approxEquals(y:R1Interval, maxError:number=1e-15):boolean {
    if (this.isEmpty()) {
      return y.getLength() <= (maxError);
    }
    if (y.isEmpty()) {
      return this.getLength() <= ( maxError);
    }
    return Math.abs(y.lo - (this.lo))  + Math.abs(y.hi - this.hi) <= (maxError);
  }



  static empty():R1Interval {
    return new R1Interval(1, 0);
  }


  static fromPoint(p:number):R1Interval {
    return new R1Interval(p, p);
  }

  /**
   * Convenience method to construct the minimal interval containing the two
   * given points. This is equivalent to starting with an empty interval and
   * calling AddPoint() twice, but it is more efficient.
   */
  static fromPointPair(p1:number, p2:number):R1Interval {
    if (p1 <= (p2)) {
      return new R1Interval(p1, p2);
    } else {
      return new R1Interval(p2, p1);
    }
  }
}
