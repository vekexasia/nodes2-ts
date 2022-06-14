import {S2Point} from "./S2Point";
import {S2Metric} from "./S2Metric";
import Long = require('long');

export class S2 {

  public static M_PI = Math.PI;
  public static M_1_PI = 1.0 / Math.PI;
  public static M_PI_2 = Math.PI / 2.0;
  public static M_PI_4 = Math.PI / 4.0;
  public static M_SQRT2 = Math.sqrt(2);
  public static M_E = Math.E;
  // the axis directions are reversed).
  public static SWAP_MASK = 0x01;
  public static INVERT_MASK = 0x02;

  // Number of bits in the mantissa of a double.
  private static EXPONENT_SHIFT = 52;
  // Mask to extract the exponent from a double.
  private static EXPONENT_MASK = Long.fromString('0x7ff0000000000000', true, 16);
  /** Mapping from cell orientation + Hilbert traversal to IJ-index. */
  public static POS_TO_ORIENTATION = [S2.SWAP_MASK, 0, 0, S2.INVERT_MASK + S2.SWAP_MASK];

  public static POS_TO_IJ = [
    // 0 1 2 3
    [0, 1, 3, 2], // canonical order: (0,0), (0,1), (1,1), (1,0)
    [0, 2, 3, 1], // axes swapped: (0,0), (1,0), (1,1), (0,1)
    [3, 2, 0, 1], // bits inverted: (1,1), (1,0), (0,0), (0,1)
    [3, 1, 0, 2], // swapped & inverted: (1,1), (0,1), (0,0), (1,0)
  ];
  static MAX_LEVEL = 30;

  public static IEEEremainder(f1:number, f2:number): number {
    const r = f1 % f2;

    if (isNaN(r) || r == (f2) || r <= (Math.abs(f2) / 2)) {
      return r;
    } else {
      return (f1 >= (0) ? 1 : -1) * (r - f2);
    }
  }

  /**
   * Return true if the given point is approximately unit length (this is mainly
   * useful for assertions).
   */
  public static isUnitLength(p:S2Point):boolean {
    return Math.abs(p.norm2() - 1) <= (1e-15);
  }

  /**
   * If v is non-zero, return an integer {@code exp} such that
   * {@code (0.5 <= |v|*2^(-exp) < 1)}. If v is zero, return 0.
   *
   * <p>Note that this arguably a bad definition of exponent because it makes
   * {@code exp(9) == 4}. In decimal this would be like saying that the
   * exponent of 1234 is 4, when in scientific 'exponent' notation 1234 is
   * {@code 1.234 x 10^3}.
   *
   * TODO(dbeaumont): Replace this with "DoubleUtils.getExponent(v) - 1" ?
   */
  static exp(v:number /*double*/):number {
    if (v == 0) {
      return 0;
    }
    // IT should always be ((int)log(2,v))+1;
    const start = Math.floor(Math.log(v)/Math.log(2));
    for(let i= start; i<start+10; i++) {
      const curVal = Math.abs(v) * Math.pow(2,-i);
      if (curVal >= 0.5 && curVal < 1 ) {
        return i;
      }
    }
    throw new Error('method not written yet');
    // return (int)((S2.EXPONENT_MASK & bits) >> S2.EXPONENT_SHIFT) - 1022;
  }

  /**
   * Return a vector "c" that is orthogonal to the given unit-length vectors "a"
   * and "b". This function is similar to a.CrossProd(b) except that it does a
   * better job of ensuring orthogonality when "a" is nearly parallel to "b",
   * and it returns a non-zero result even when a == b or a == -b.
   *
   *  It satisfies the following properties (RCP == RobustCrossProd):
   *
   *  (1) RCP(a,b) != 0 for all a, b (2) RCP(b,a) == -RCP(a,b) unless a == b or
   * a == -b (3) RCP(-a,b) == -RCP(a,b) unless a == b or a == -b (4) RCP(a,-b)
   * == -RCP(a,b) unless a == b or a == -b
   */
  static robustCrossProd(a:S2Point, b:S2Point):S2Point {
    // The direction of a.CrossProd(b) becomes unstable as (a + b) or (a - b)
    // approaches zero. This leads to situations where a.CrossProd(b) is not
    // very orthogonal to "a" and/or "b". We could fix this using Gram-Schmidt,
    // but we also want b.RobustCrossProd(a) == -b.RobustCrossProd(a).
    //
    // The easiest fix is to just compute the cross product of (b+a) and (b-a).
    // Given that "a" and "b" are unit-length, this has good orthogonality to
    // "a" and "b" even if they differ only in the lowest bit of one component.

    // assert (isUnitLength(a) && isUnitLength(b));
    const x = S2Point.crossProd(S2Point.add(b, a), S2Point.sub(b, a));
    if (!x.equals(new S2Point(0, 0, 0))) {
      return x;
    }
    // The only result that makes sense mathematically is to return zero, but
    // we find it more convenient to return an arbitrary orthogonal vector.
    return a.ortho();
  }

  /**
   * Return the area of triangle ABC. The method used is about twice as
   * expensive as Girard's formula, but it is numerically stable for both large
   * and very small triangles. The points do not need to be normalized. The area
   * is always positive.
   *
   *  The triangle area is undefined if it contains two antipodal points, and
   * becomes numerically unstable as the length of any edge approaches 180
   * degrees.
   */
  static area(a:S2Point, b:S2Point, c:S2Point) {
    // This method is based on l'Huilier's theorem,
    //
    // tan(E/4) = sqrt(tan(s/2) tan((s-a)/2) tan((s-b)/2) tan((s-c)/2))
    //
    // where E is the spherical excess of the triangle (i.e. its area),
    // a, b, c, are the side lengths, and
    // s is the semiperimeter (a + b + c) / 2 .
    //
    // The only significant source of error using l'Huilier's method is the
    // cancellation error of the terms (s-a), (s-b), (s-c). This leads to a
    // *relative* error of about 1e-16 * s / min(s-a, s-b, s-c). This compares
    // to a relative error of about 1e-15 / E using Girard's formula, where E is
    // the true area of the triangle. Girard's formula can be even worse than
    // this for very small triangles, e.g. a triangle with a true area of 1e-30
    // might evaluate to 1e-5.
    //
    // So, we prefer l'Huilier's formula unless dmin < s * (0.1 * E), where
    // dmin = min(s-a, s-b, s-c). This basically includes all triangles
    // except for extremely long and skinny ones.
    //
    // Since we don't know E, we would like a conservative upper bound on
    // the triangle area in terms of s and dmin. It's possible to show that
    // E <= k1 * s * sqrt(s * dmin), where k1 = 2*sqrt(3)/Pi (about 1).
    // Using this, it's easy to show that we should always use l'Huilier's
    // method if dmin >= k2 * s^5, where k2 is about 1e-2. Furthermore,
    // if dmin < k2 * s^5, the triangle area is at most k3 * s^4, where
    // k3 is about 0.1. Since the best case error using Girard's formula
    // is about 1e-15, this means that we shouldn't even consider it unless
    // s >= 3e-4 or so.

    // We use volatile doubles to force the compiler to truncate all of these
    // quantities to 64 bits. Otherwise it may compute a value of dmin > 0
    // simply because it chose to spill one of the intermediate values to
    // memory but not one of the others.
    const sa = b.angle(c);
    const sb = c.angle(a);
    const sc = a.angle(b);
    const s = sa+ (sb)+ (sc) * (0.5);
    // 0.5 * (sa + sb + sc);
    if (s >= (3e-4)) {
      // Consider whether Girard's formula might be more accurate.
      const s2 = s * 2;
      const dmin = s - Math.max(
              sa,
              sb,
              sc
          );
      if (dmin < (s2 * s2 * (s) * (1e-2))) {
        // This triangle is skinny enough to consider Girard's formula.
        const area = S2.girardArea(a, b, c);
        if (dmin < (s * (area * (0.1)))) {
          return area;
        }
      }
    }
    // Use l'Huilier's formula.
    return 4 * (
            Math.atan(
                Math.sqrt(
                    Math.max(
                        0.0,
                        Math.tan(s * (0.5))
                             * (Math.tan(s - (sa) * (0.5)))
                             * (Math.tan(s - (sb) * (0.5)))
                             * (Math.tan(s - (sc) * (0.5)))
                    )
                )
            )
        )
  }


  /**
   * Return the area of the triangle computed using Girard's formula. This is
   * slightly faster than the Area() method above is not accurate for very small
   * triangles.
   */
  static girardArea(a:S2Point, b:S2Point, c:S2Point) {
    // This is equivalent to the usual Girard's formula but is slightly
    // more accurate, faster to compute, and handles a == b == c without
    // a special case.

    const ab = S2Point.crossProd(a, b);
    const bc = S2Point.crossProd(b, c);
    const ac = S2Point.crossProd(a, c);
    return Math.max(
        0,
        ab.angle(ac) - ab.angle(bc) + bc.angle(ac)
    );
  }

  /**
   * Return true if the points A, B, C are strictly counterclockwise. Return
   * false if the points are clockwise or colinear (i.e. if they are all
   * contained on some great circle).
   *
   *  Due to numerical errors, situations may arise that are mathematically
   * impossible, e.g. ABC may be considered strictly CCW while BCA is not.
   * However, the implementation guarantees the following:
   *
   *  If SimpleCCW(a,b,c), then !SimpleCCW(c,b,a) for all a,b,c.
   *
   * In other words, ABC and CBA are guaranteed not to be both CCW
   */
  public static simpleCCW(a:S2Point, b:S2Point, c:S2Point):boolean {
    // We compute the signed volume of the parallelepiped ABC. The usual
    // formula for this is (AxB).C, but we compute it here using (CxA).B
    // in order to ensure that ABC and CBA are not both CCW. This follows
    // from the following identities (which are true numerically, not just
    // mathematically):
    //
    // (1) x.CrossProd(y) == -(y.CrossProd(x))
    // (2) (-x).DotProd(y) == -(x.DotProd(y))

    return S2Point.crossProd(c, a).dotProd(b) > 0;
  }

  /**
   *
   * Return true if edge AB crosses CD at a point that is interior to both
   * edges. Properties:
   *
   *  (1) SimpleCrossing(b,a,c,d) == SimpleCrossing(a,b,c,d) (2)
   * SimpleCrossing(c,d,a,b) == SimpleCrossing(a,b,c,d)
   */
  public static  simpleCrossing(a:S2Point, b:S2Point, c:S2Point, d:S2Point):boolean {
    // We compute SimpleCCW() for triangles ACB, CBD, BDA, and DAC. All
    // of these triangles need to have the same orientation (CW or CCW)
    // for an intersection to exist. Note that this is slightly more
    // restrictive than the corresponding definition for planar edges,
    // since we need to exclude pairs of line segments that would
    // otherwise "intersect" by crossing two antipodal points.

    const ab = S2Point.crossProd(a, b);
    const cd = S2Point.crossProd(c, d);
    const acb = ab.dotProd(c) * -1;
    const cbd = cd.dotProd(b) * -1;
    const bda = ab.dotProd(d);
    const dac = cd.dotProd(a);

    return (acb * (cbd) > (0)) && (cbd * (bda) > (0)) && (bda * (dac) > (0));
  }

  static Metric = S2Metric
}

export { S2Metric };
