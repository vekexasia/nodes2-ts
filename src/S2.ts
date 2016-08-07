///<reference path="../typings/index.d.ts"/>

import {S2Point} from "./S2Point";


const Long = require('long');
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
  public static  POS_TO_ORIENTATION = [S2.SWAP_MASK, 0, 0, S2.INVERT_MASK + S2.SWAP_MASK];

  public static POS_TO_IJ = [
    // 0 1 2 3
    [0, 1, 3, 2], // canonical order: (0,0), (0,1), (1,1), (1,0)
    [0, 2, 3, 1], // axes swapped: (0,0), (1,0), (1,1), (0,1)
    [3, 2, 0, 1], // bits inverted: (1,1), (1,0), (0,0), (0,1)
    [3, 1, 0, 2], // swapped & inverted: (1,1), (0,1), (0,0), (1,0)
  ];
  static MAX_LEVEL = 30;

  public static IEEEremainder(f1:decimal.Decimal, f2:decimal.Decimal) {
    let r = f1.mod(f2);

    if (/*isNaN(r) ||*/ r.eq(f2) || r.lessThanOrEqualTo(f2.abs().dividedBy(2))) {
      return r;
    } else {
      return (f1.gte(0)?new Decimal(1):new Decimal(-1)).times(r.minus(f2));
    }
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
    //TODO: HMM?
    // bits = Double.doubleToLongBits(v);
    // return S2.EXPONENT_MASK.and(bits).shiftRight(S2.EXPONENT_SHIFT).sub(1022);
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
    let x = S2Point.crossProd(S2Point.add(b, a), S2Point.sub(b, a));
    if (!x.equals(new S2Point(0, 0, 0))) {
      return x;
    }
    // The only result that makes sense mathematically is to return zero, but
    // we find it more convenient to return an arbitrary orthogonal vector.
    return a.ortho();
  }


}

/**
 * Defines an area or a length cell metric.
 */
export class S2_Metric {

  /**
   * Defines a cell metric of the given dimension (1 == length, 2 == area).
   */
  public constructor(private _dim:number, private _deriv:number) {
  }

  deriv() {
    return this._deriv;
  }

  dim() {
    return this._dim;
  }

  /** Return the value of a metric for cells at the given level. */
  public getValue(level:number):number {
    return 0;
    // return StrictMath.scalb(deriv, dim * (1 - level));
  }

  /**
   * Return the level at which the metric has approximately the given value.
   * For example, S2::kAvgEdge.GetClosestLevel(0.1) returns the level at which
   * the average cell edge length is approximately 0.1. The return value is
   * always a valid level.
   */
  public getClosestLevel(/*double*/value:number):number {
    return this.getMinLevel(S2.M_SQRT2 * value);
  }

  /**
   * Return the minimum level such that the metric is at most the given value,
   * or S2CellId::kMaxLevel if there is no such level. For example,
   * S2::kMaxDiag.GetMinLevel(0.1) returns the minimum level such that all
   * cell diagonal lengths are 0.1 or smaller. The return value is always a
   * valid level.
   */
  public getMinLevel(value:number /*double*/):number /*int*/ {
    if (value <= 0) {
      return S2.MAX_LEVEL;
    }

    // This code is equivalent to computing a floating-point "level"
    // value and rounding up.
    let exponent = S2.exp(value / ((1 << this.dim()) * this.deriv()));
    let level = Math.max(0,
        Math.min(S2.MAX_LEVEL, -((exponent - 1) >> (this.dim() - 1))));
    // assert (level == S2CellId.MAX_LEVEL || getValue(level) <= value);
    // assert (level == 0 || getValue(level - 1) > value);
    return level;
  }

  /**
   * Return the maximum level such that the metric is at least the given
   * value, or zero if there is no such level. For example,
   * S2.kMinWidth.GetMaxLevel(0.1) returns the maximum level such that all
   * cells have a minimum width of 0.1 or larger. The return value is always a
   * valid level.
   */
  public getMaxLevel(value:number /*double*/):number {
    if (value <= 0) {
      return S2.MAX_LEVEL;
    }

    // This code is equivalent to computing a floating-point "level"
    // value and rounding down.
    let exponent = S2.exp((1 << this.dim()) * this.deriv() / value);
    let level = Math.max(0,
        Math.min(S2.MAX_LEVEL, ((exponent - 1) >> (this.dim() - 1))));
    // assert (level == 0 || getValue(level) >= value);
    // assert (level == S2CellId.MAX_LEVEL || getValue(level + 1) < value);
    return level;
  }
}