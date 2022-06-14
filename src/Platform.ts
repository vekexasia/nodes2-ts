const exponent = require('math-float64-exponent');
export class Platform {
  public static IEEEremainder(f1: number, f2: number): number {
    // let r = f1 % f2;

    // if (isNaN(r) || r == (f2) || r <= (Math.abs(f2) / 2)) {
    //   return r;
    // } else {
    //   return (f1 >= (0) ? 1 : -1) * (r - f2);
    // }

    if (Number.isNaN(f1)) {
      return f1;
    }

    if (Number.isNaN(f2)) {
      return f2
    }

    if ((f2 === Number.POSITIVE_INFINITY || f2 === Number.NEGATIVE_INFINITY) && Number.isFinite(f1)) {
      return f1;
    }

    return f1 - (Math.round(f1 / f2) * f2);
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
  public static getExponent(v:number ):number {
    // if (v == 0) {
    //   return 0;
    // }
    // // IT should always be ((int)log(2,v))+1;
    // const start = Math.floor(Math.log(v)/Math.log(2));
    // for(let i= start; i<start+10; i++) {
    //   const curVal = Math.abs(v) * Math.pow(2,-i);
    //   if (curVal >= 0.5 && curVal < 1 ) {
    //     return i;
    //   }
    // }
    // throw new Error('method not written yet');
    // // return (int)((S2.EXPONENT_MASK & bits) >> S2.EXPONENT_SHIFT) - 1022;
    return exponent(v);
  }
}