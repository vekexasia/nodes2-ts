import {Interval} from "./Interval";
import {S2} from "./S2";
import {Decimal} from 'decimal.js';
export class S1Interval extends Interval {

  constructor(lo:number|Decimal, hi:number|Decimal, checked:boolean = false) {
    super(lo, hi);
    if (!checked) {
      if (this.lo.eq(-S2.M_PI) && !this.hi.eq(S2.M_PI)) {
        this.lo = S2.toDecimal(S2.M_PI);
      }
      if (this.hi.eq(-S2.M_PI) && !this.lo.eq(S2.M_PI)) {
        this.hi = S2.toDecimal(S2.M_PI);
      }
    }
  }

  /**
   * An interval is valid if neither bound exceeds Pi in absolute value, and the
   * value -Pi appears only in the Empty() and Full() intervals.
   */
  isValid():boolean {
    return this.lo.abs().lte(S2.M_PI) && this.hi.abs().lte(S2.M_PI)
        && !(this.lo.eq(-S2.M_PI) && !this.hi.eq(S2.M_PI))
        && !(this.hi.eq(-S2.M_PI) && !this.lo.eq(S2.M_PI));
    // return (Math.abs(this.lo) <= S2.M_PI && Math.abs(this.hi) <= S2.M_PI
    // && !(this.lo == -S2.M_PI && this.hi != S2.M_PI) && !(this.hi == -S2.M_PI && this.lo != S2.M_PI));
  }

  /** Return true if the interval contains all points on the unit circle. */
  isFull() {
    // console.log(this.hi.minus(this.lo).eq(2 * S2.M_PI));
    return this.hi.minus(this.lo).eq(2 * S2.M_PI)
  }


  /** Return true if the interval is empty, i.e. it contains no points. */
  public  isEmpty() {
    return this.lo.minus(this.hi).eq(2 * S2.M_PI);
  }


  /* Return true if this.lo > this.hi. (This is true for empty intervals.) */
  public isInverted():boolean {
    return this.lo.gt(this.hi);
  }


  /**
   * Return the midpoint of the interval. For full and empty intervals, the
   * result is arbitrary.
   */
  public getCenter():Decimal {
    let center = this.lo.plus(this.hi).dividedBy(2);
    // let center = 0.5 * (this.lo + this.hi);
    if (!this.isInverted()) {
      return center;
    }
    // Return the center in the range (-Pi, Pi].
    return (center.lte(0)) ? (center.plus(S2.M_PI)) : (center.minus(S2.M_PI));
  }


  /**
   * Return the length of the interval. The length of an empty interval is
   * negative.
   */
  public getLength():Decimal {
    let length = this.hi.minus(this.lo);
    if (length.gte(0)) {
      return length;
    }
    length = length.plus(2 * S2.M_PI);
    // Empty intervals have a negative length.
    return (length.gt(0)) ? length : S2.toDecimal(-1);
  }

  /**
   * Return the complement of the interior of the interval. An interval and its
   * complement have the same boundary but do not share any interior values. The
   * complement operator is not a bijection, since the complement of a singleton
   * interval (containing a single value) is the same as the complement of an
   * empty interval.
   */
  public complement():S1Interval {
    if (this.lo.eq(this.hi)) {
      return S1Interval.full(); // Singleton.
    }
    return new S1Interval(this.hi, this.lo, true); // Handles
    // empty and
    // full.
  }

  /** Return true if the interval (which is closed) contains the point 'p'. */
  public contains(_p:number|Decimal):boolean {
    let p = S2.toDecimal(_p);
    // Works for empty, full, and singleton intervals.
    // assert (Math.abs(p) <= S2.M_PI);
    if (p.eq(-S2.M_PI)) {
      p = S2.toDecimal(S2.M_PI);
    }
    return this.fastContains(p);
  }

  /**
   * Return true if the interval (which is closed) contains the point 'p'. Skips
   * the normalization of 'p' from -Pi to Pi.
   *
   */
  public fastContains(_p:number|Decimal):boolean {
    const p = S2.toDecimal(_p);
    if (this.isInverted()) {
      return (p.gte(this.lo) || p.lte(this.hi)) && !this.isEmpty();
    } else {
      return p.gte(this.lo) && p.lte(this.hi);
    }
  }

  /** Return true if the interior of the interval contains the point 'p'. */
  public interiorContains(_p:number|Decimal):boolean {
    // Works for empty, full, and singleton intervals.
    // assert (Math.abs(p) <= S2.M_PI);
    let p = S2.toDecimal(_p);
    if (p.eq(-S2.M_PI)) {
      p = S2.toDecimal(S2.M_PI);
    }

    if (this.isInverted()) {
      return p.gt(this.lo) || p.lt(this.hi);
    } else {
      return (p.gt(this.lo) && p.lt(this.hi)) || this.isFull();
    }
  }

  /**
   * Return true if the interval contains the given interval 'y'. Works for
   * empty, full, and singleton intervals.
   */
  public containsI(y:S1Interval):boolean {
    // It might be helpful to compare the structure of these tests to
    // the simpler Contains(number) method above.

    if (this.isInverted()) {
      if (y.isInverted()) {
        return y.lo.gte(this.lo) && y.hi.lte(this.hi);
      }
      return (y.lo.gte(this.lo) || y.hi.lte(this.hi)) && !this.isEmpty();
    } else {
      if (y.isInverted()) {
        return this.isFull() || y.isEmpty();
      }
      return y.lo.gte(this.lo) && y.hi.lte(this.hi);
    }
  }

  /**
   * Returns true if the interior of this interval contains the entire interval
   * 'y'. Note that x.InteriorContains(x) is true only when x is the empty or
   * full interval, and x.InteriorContains(S1Interval(p,p)) is equivalent to
   * x.InteriorContains(p).
   */
  public interiorContainsI(y:S1Interval):boolean {
    if (this.isInverted()) {
      if (!y.isInverted()) {
        return this.lo.gt(this.lo) || y.hi.lt(this.hi);
      }
      return (y.lo.gt(this.lo) && y.hi.lt(this.hi)) || y.isEmpty();
    } else {
      if (y.isInverted()) {
        return this.isFull() || y.isEmpty();
      }
      return (y.lo.gt(this.lo) && y.hi.lt(this.hi)) || this.isFull();
    }
  }

  /**
   * Return true if the two intervals contain any points in common. Note that
   * the point +/-Pi has two representations, so the intervals [-Pi,-3] and
   * [2,Pi] intersect, for example.
   */
  public intersects(y:S1Interval):boolean {
    if (this.isEmpty() || y.isEmpty()) {
      return false;
    }
    if (this.isInverted()) {
      // Every non-empty inverted interval contains Pi.
      return y.isInverted() || y.lo.lte(this.hi) || y.hi.gte(this.lo);
    } else {
      if (y.isInverted()) {
        return y.lo.lte(this.hi) || y.hi.gte(this.lo);
      }
      return y.lo.lte(this.hi) && y.hi.gte(this.lo);
    }
  }

  /**
   * Return true if the interior of this interval contains any point of the
   * interval 'y' (including its boundary). Works for empty, full, and singleton
   * intervals.
   */
  public interiorIntersects(y:S1Interval):boolean {
    if (this.isEmpty() || y.isEmpty() || this.lo.eq(this.hi)) {
      return false;
    }
    if (this.isInverted()) {
      return y.isInverted() || y.lo.lt(this.hi) || y.hi.gt(this.lo);
    } else {
      if (y.isInverted()) {
        return y.lo.lt(this.hi) || y.hi.gt(this.lo);
      }
      return (y.lo.lt(this.hi) && y.hi.gt(this.lo)) || this.isFull();
    }
  }

  /**
   * Expand the interval by the minimum amount necessary so that it contains the
   * given point "p" (an angle in the range [-Pi, Pi]).
   */
  public addPoint(_p:number|Decimal):S1Interval {
    let p = S2.toDecimal(_p);
    // assert (Math.abs(p) <= S2.M_PI);
    if (p.eq(-S2.M_PI)) {
      p = S2.toDecimal(S2.M_PI);
    }

    if (this.fastContains(p)) {
      return new S1Interval(this.lo, this.hi);
    }

    if (this.isEmpty()) {
      return S1Interval.fromPoint(p);
    } else {
      // Compute distance from p to each endpoint.
      let dlo = S1Interval.positiveDistance(p, this.lo);
      let dhi = S1Interval.positiveDistance(this.hi, p);
      if (dlo.lt(dhi)) {
        return new S1Interval(p, this.hi);
      } else {
        return new S1Interval(this.lo, p);
      }
      // Adding a point can never turn a non-full interval into a full one.
    }
  }

  /**
   * Return an interval that contains all points within a distance "radius" of
   * a point in this interval. Note that the expansion of an empty interval is
   * always empty. The radius must be non-negative.
   */
  public  expanded(_radius:number|Decimal):S1Interval {
    const radius = S2.toDecimal(_radius);
    const radiusN = S2.toDecimal(_radius).toNumber();
    // assert (radius >= 0);
    if (this.isEmpty()) {
      return this;
    }

    // Check whether this interval will be full after expansion, allowing
    // for a 1-bit rounding error when computing each endpoint.
    if (this.getLength().plus(radiusN * 2).gte(2*S2.M_PI-1e-15)) {
      return S1Interval.full();
    }

    // NOTE(dbeaumont): Should this remainder be 2 * M_PI or just M_PI ??
    let lo = S2.IEEEremainder(this.lo.minus(radius), 2 * S2.M_PI);
    let hi = S2.IEEEremainder(this.hi.plus(radius), 2 * S2.M_PI);
    if (lo.eq(-S2.M_PI)) {
      lo = S2.toDecimal(S2.M_PI);
    }
    return new S1Interval(lo, hi);
  }

  /**
   * Return the smallest interval that contains this interval and the given
   * interval "y".
   */
  public  union(y:S1Interval):S1Interval {
    // The y.is_full() case is handled correctly in all cases by the code
    // below, but can follow three separate code paths depending on whether
    // this interval is inverted, is non-inverted but contains Pi, or neither.

    if (y.isEmpty()) {
      return this;
    }
    if (this.fastContains(y.lo)) {
      if (this.fastContains(y.hi)) {
        // Either this interval contains y, or the union of the two
        // intervals is the Full() interval.
        if (this.containsI(y)) {
          return this; // is_full() code path
        }
        return S1Interval.full();
      }
      return new S1Interval(this.lo, this.hi, true);
    }
    if (this.fastContains(y.hi)) {
      return new S1Interval(y.lo, this.hi, true);
    }

    // This interval contains neither endpoint of y. This means that either y
    // contains all of this interval, or the two intervals are disjoint.
    if (this.isEmpty() || y.fastContains(this.lo)) {
      return y;
    }

    // Check which pair of endpoints are closer together.
    let dlo = S1Interval.positiveDistance(y.hi, this.lo);
    let dhi = S1Interval.positiveDistance(this.hi, y.lo);
    if (dlo < dhi) {
      return new S1Interval(y.lo, this.hi, true);
    } else {
      return new S1Interval(this.lo, y.hi, true);
    }
  }

  /**
   * Return the smallest interval that contains the intersection of this
   * interval with "y". Note that the region of intersection may consist of two
   * disjoint intervals.
   */
  public intersection(y:S1Interval):S1Interval {
    // The y.is_full() case is handled correctly in all cases by the code
    // below, but can follow three separate code paths depending on whether
    // this interval is inverted, is non-inverted but contains Pi, or neither.

    if (y.isEmpty()) {
      return S1Interval.empty();
    }
    if (this.fastContains(y.lo)) {
      if (this.fastContains(y.hi)) {
        // Either this interval contains y, or the region of intersection
        // consists of two disjoint subintervals. In either case, we want
        // to return the shorter of the two original intervals.
        if (y.getLength().lt(this.getLength())) {
          return y; // is_full() code path
        }
        return this;
      }
      return new S1Interval(y.lo, this.hi, true);
    }
    if (this.fastContains(y.hi)) {
      return new S1Interval(this.lo, y.hi, true);
    }

    // This interval contains neither endpoint of y. This means that either y
    // contains all of this interval, or the two intervals are disjoint.

    if (y.fastContains(this.lo)) {
      return this; // is_empty() okay here
    }
    // assert (!intersects(y));
    return S1Interval.empty();
  }

  /**
   * Return true if the length of the symmetric difference between the two
   * intervals is at most the given tolerance.
   */
  public approxEquals(y:S1Interval, maxError:number=1e-9):boolean {
    if (this.isEmpty()) {
      return y.getLength().lte(maxError);
    }
    if (y.isEmpty()) {
      return this.getLength().lte(maxError);
    }

    return S2.IEEEremainder(y.lo.minus(this.lo), 2 * S2.M_PI).abs()
            .plus(S2.IEEEremainder(y.hi.minus(this.hi), 2 * S2.M_PI).abs())
            .lte(maxError);
  }



  static empty():S1Interval {
    return new S1Interval(S2.M_PI, -S2.M_PI, true);
  }

  static full():S1Interval {
    return new S1Interval(-S2.M_PI, S2.M_PI, true);
  }

  static fromPoint(_p:number|Decimal):S1Interval {
    let p = S2.toDecimal(_p);
    if (p.eq(-S2.M_PI)) {
      p = S2.toDecimal(S2.M_PI);
    }
    return new S1Interval(p, p, true);
  }


  /**
   * Convenience method to construct the minimal interval containing the two
   * given points. This is equivalent to starting with an empty interval and
   * calling AddPoint() twice, but it is more efficient.
   */
  static fromPointPair(_p1:number|Decimal, _p2:number|Decimal):S1Interval {
    // assert (Math.abs(p1) <= S2.M_PI && Math.abs(p2) <= S2.M_PI);
    let p1 = S2.toDecimal(_p1);
    let p2 = S2.toDecimal(_p2);
    if (p1.eq(-S2.M_PI)) {
      p1 = S2.toDecimal(S2.M_PI);
    }
    if (p2.eq(-S2.M_PI)) {
      p2 = S2.toDecimal(S2.M_PI);
    }
    if (S1Interval.positiveDistance(p1, p2).lte(S2.M_PI)) {
      return new S1Interval(p1, p2, true);
    } else {
      return new S1Interval(p2, p1, true);
    }
  }

  /**
   * Compute the distance from "a" to "b" in the range [0, 2*Pi). This is
   * equivalent to (drem(b - a - S2.M_PI, 2 * S2.M_PI) + S2.M_PI), except that
   * it is more numerically stable (it does not lose precision for very small
   * positive distances).
   */
  public static positiveDistance(_a:number|Decimal, _b:number|Decimal):Decimal {
    const a = S2.toDecimal(_a);
    const b = S2.toDecimal(_b);
    let d = b.minus(a);
    if (d .gte(0)) {
      return d;
    }
    // We want to ensure that if b == Pi and a == (-Pi + eps),
    // the return result is approximately 2*Pi and not zero.
    return b.plus(S2.M_PI).minus(a.minus(S2.M_PI));
  }

}
