/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * S1ChordAngle represents the angle subtended by a chord (i.e., the straight 3D Cartesian line
 * segment connecting two points on the unit sphere). Its representation makes it very efficient for
 * computing and comparing distances, but unlike S1Angle it is only capable of representing angles
 * between 0 and Pi radians. Generally, S1ChordAngle should only be used in loops where many angles
 * need to be calculated and compared. Otherwise it is simpler to use S1Angle.
 *
 * <p>S1ChordAngle also loses some accuracy as the angle approaches Pi radians. Specifically, the
 * representation of (Pi - x) radians can be expected to have an error of about (1e-15 / x), with a
 * maximum error of about 1e-7.
 */

import { S1Angle } from './S1Angle';
import { S2 } from './S2';
import { S2Point } from './S2Point';
import { checkArgument } from './utils/preconditions';
import { compareDouble } from './utils/comparison';

export class S1ChordAngle {

  /** Max value that can be returned from {@link #getLength2()}. */
  public static MAX_LENGTH2 = 4.0;

  /** The zero chord angle. */
  public static ZERO: S1ChordAngle = new S1ChordAngle(0);

  /** The chord angle of 90 degrees (a "right angle"). */
  public static RIGHT: S1ChordAngle = new S1ChordAngle(2);

  /** The chord angle of 180 degrees (a "straight angle"). This is the max finite chord angle. */
  public static STRAIGHT: S1ChordAngle = new S1ChordAngle(S1ChordAngle.MAX_LENGTH2);

  /**
   * A chord angle larger than any finite chord angle. The only valid operations on {@code INFINITY}
   * are comparisons and {@link S1Angle} conversions.
   */
  public static INFINITY: S1ChordAngle = new S1ChordAngle(Number.POSITIVE_INFINITY);

  /**
   * A chord angle smaller than {@link #ZERO}. The only valid operations on {@code NEGATIVE} are
   * comparisons and {@link S1Angle} conversions.
   */
  public static NEGATIVE: S1ChordAngle = new S1ChordAngle(-1);

  private length2: number;

  /**
   * S1ChordAngles are represented by the squared chord length, which can range from 0 to {@code
   * MAX_LENGTH2}. {@link #INFINITY} uses an infinite squared length.
   */
  public constructor(length2: number) {
    this.length2 = length2;
    checkArgument(this.isValid());
  }

  /**
   * Constructs the S1ChordAngle corresponding to the distance between the two given points. The
   * points must be unit length.
   */
  public static fromS2Point(x: S2Point, y: S2Point): S1ChordAngle {
    checkArgument(S2.isUnitLength(x));
    checkArgument(S2.isUnitLength(y));
    // The distance may slightly exceed 4.0 due to roundoff errors.
    const length2 = Math.min(S1ChordAngle.MAX_LENGTH2, x.getDistance2(y));
    return new S1ChordAngle(length2);
  }

  /**
   * Returns a new chord angle approximated from {@code angle} (see {@link
   * #getS1AngleConstructorMaxError()} for the max magnitude of the error).
   *
   * <p>Angles outside the range [0, Pi] are handled as follows:
   *
   * <ul>
   *   <li>{@link S1Angle#INFINITY} is mapped to {@link #INFINITY}
   *   <li>negative angles are mapped to {@link #NEGATIVE}
   *   <li>finite angles larger than Pi are mapped to {@link #STRAIGHT}
   * </ul>
   *
   * <p>Note that this operation is relatively expensive and should be avoided. To use {@link
   * S1ChordAngle} effectively, you should structure your code so that input arguments are converted
   * to S1ChordAngles at the beginning of your algorithm, and results are converted back to {@link
   * S1Angle}s only at the end.
   */
  public static fromS1Angle(angle: S1Angle ): S1ChordAngle {
    if (angle.radians < 0) {
      return S1ChordAngle.NEGATIVE;
    } else if (angle.equals(S1Angle.INFINITY)) {
      return S1ChordAngle.INFINITY;
    } else {
      // The chord length is 2 * sin(angle / 2).
      const length = 2 * Math.sin(0.5 * Math.min(Math.PI, angle.radians));
      return new S1ChordAngle(length * length);
    }
  }

  /**
   * Construct an S1ChordAngle from the squared chord length. Note that the argument is
   * automatically clamped to a maximum of {@code MAX_LENGTH2} to handle possible roundoff errors.
   * The argument must be non-negative.
   */
  public static fromLength2(length2: number): S1ChordAngle {
    return new S1ChordAngle(Math.min(S1ChordAngle.MAX_LENGTH2, length2));
  }

  /** Returns whether the chord distance is exactly 0. */
  public isZero(): boolean {
    return this.length2 == 0;
  }

  /** Returns whether the chord distance is negative. */
  public isNegative(): boolean {
    return this.length2 < 0;
  }

  /** Returns whether the chord distance is exactly (positive) infinity. */
  public isInfinity(): boolean {
    return this.length2 == Number.POSITIVE_INFINITY;
  }

  /** Returns true if the angle is negative or infinity. */
  public isSpecial(): boolean {
    return this.isNegative() || this.isInfinity();
  }

  /**
   * Returns true if getLength2() is within the normal range of 0 to 4 (inclusive) or the angle is
   * special.
   */
  public isValid(): boolean {
    return (this.length2 >= 0 && this.length2 <= S1ChordAngle.MAX_LENGTH2) || this.isNegative() || this.isInfinity();
  }

  /**
   * Convert the chord angle to an {@link S1Angle}. {@link #INFINITY} is converted to {@link
   * S1Angle#INFINITY}, and {@link #NEGATIVE} is converted to a negative {@link S1Angle}. This
   * operation is relatively expensive.
   */
  public toAngle(): S1Angle {
    if (this.isNegative()) {
      return S1Angle.radians(-1);
    } else if (this.isInfinity()) {
      return S1Angle.INFINITY;
    } else {
      return S1Angle.radians(2 * Math.asin(0.5 * Math.sqrt(this.length2)));
    }
  }

  /** The squared length of the chord. (Most clients will not need this.) */
  public getLength2(): number {
    return this.length2;
  }

  /**
   * Returns the smallest representable S1ChordAngle larger than this object. This can be used to
   * convert a "<" comparison to a "<=" comparison.
   *
   * <p>Note the following special cases:
   *
   * <ul>
   *   <li>NEGATIVE.successor() == ZERO
   *   <li>STRAIGHT.successor() == INFINITY
   *   <li>INFINITY.Successor() == INFINITY
   * </ul>
   */
//   public successor(): S1ChordAngle {
//     if (this.length2 >= S1ChordAngle.MAX_LENGTH2) {
//       return S1ChordAngle.INFINITY;
//     }
//     if (this.length2 < 0.0) {
//       return S1ChordAngle.ZERO;
//     }
//     return new S1ChordAngle(Platform.nextAfter(this.length2, 10.0));
//   }

  /**
   * As {@link #successor}, but returns the largest representable S1ChordAngle less than this
   * object.
   *
   * <p>Note the following special cases:
   *
   * <ul>
   *   <li>INFINITY.predecessor() == STRAIGHT
   *   <li>ZERO.predecessor() == NEGATIVE
   *   <li>NEGATIVE.predecessor() == NEGATIVE
   * </ul>
   */
//   public predecessor(): S1ChordAngle {
//     if (this.length2 <= 0.0) {
//       return S1ChordAngle.NEGATIVE;
//     }
//     if (this.length2 > S1ChordAngle.MAX_LENGTH2) {
//       return S1ChordAngle.STRAIGHT;
//     }
//     return new S1ChordAngle(Platform.nextAfter(this.length2, -10.0));
//   }

  /**
   * Returns a new S1ChordAngle whose chord distance represents the sum of the angular distances
   * represented by the 'a' and 'b' chord angles.
   *
   * <p>Note that this method is much more efficient than converting the chord angles to S1Angles
   * and adding those. It requires only one square root plus a few additions and multiplications.
   */
  public static add(a: S1ChordAngle, b: S1ChordAngle): S1ChordAngle {
    checkArgument(!a.isSpecial());
    checkArgument(!b.isSpecial());

    // Optimization for the common case where "b" is an error tolerance parameter that happens to be
    // set to zero.
    const a2 = a.length2;
    const b2 = b.length2;
    if (b2 == 0) {
      return a;
    }

    // Clamp the angle sum to at most 180 degrees.
    if (a2 + b2 >= S1ChordAngle.MAX_LENGTH2) {
      return S1ChordAngle.STRAIGHT;
    }

    // Let "a" and "b" be the (non-squared) chord lengths, and let c = a+b.
    // Let A, B, and C be the corresponding half-angles (a = 2*sin(A), etc).
    // Then the formula below can be derived from c = 2 * sin(A+B) and the relationships
    //   sin(A+B) = sin(A)*cos(B) + sin(B)*cos(A)
    //   cos(X) = sqrt(1 - sin^2(X)) .
    const x = a2 * (1 - 0.25 * b2); // isValid() => non-negative
    const y = b2 * (1 - 0.25 * a2); // isValid() => non-negative
    return new S1ChordAngle(Math.min(S1ChordAngle.MAX_LENGTH2, x + y + 2 * Math.sqrt(x * y)));
  }

  /**
   * Subtract one S1ChordAngle from another.
   *
   * <p>Note that this method is much more efficient than converting the chord angles to S1Angles
   * and adding those. It requires only one square root plus a few additions and multiplications.
   */
  public static sub(a: S1ChordAngle, b: S1ChordAngle): S1ChordAngle {
    // See comments in add(S1ChordAngle, S1ChordAngle).
    checkArgument(!a.isSpecial());
    checkArgument(!b.isSpecial());
    const a2 = a.length2;
    const b2 = b.length2;
    if (b2 == 0) {
      return a;
    }
    if (a2 <= b2) {
      return S1ChordAngle.ZERO;
    }
    const x = a2 * (1 - 0.25 * b2);
    const y = b2 * (1 - 0.25 * a2);
    return new S1ChordAngle(Math.max(0.0, x + y - 2 * Math.sqrt(x * y)));
  }

  /** Returns the smaller of the given instances. */
  public static min(a: S1ChordAngle, b: S1ChordAngle): S1ChordAngle {
    return a.length2 <= b.length2 ? a : b;
  }

  /** Returns the larger of the given instances. */
  public static max(a: S1ChordAngle, b: S1ChordAngle): S1ChordAngle {
    return a.length2 > b.length2 ? a : b;
  }

  /** Returns the square of Math.sin(toAngle().radians()), but computed more efficiently. */
  public static sin2(a: S1ChordAngle): number {
    checkArgument(!a.isSpecial());
    // Let "a" be the (non-squared) chord length, and let A be the corresponding half-angle
    // (a = 2*sin(A)). The formula below can be derived from:
    //   sin(2*A) = 2 * sin(A) * cos(A)
    //   cos^2(A) = 1 - sin^2(A)
    // This is much faster than converting to an angle and computing its sine.
    return a.length2 * (1 - 0.25 * a.length2);
  }

  /** Returns Math.sin(toAngle().radians()), but computed more efficiently. */
  public static sin(a: S1ChordAngle): number {
    return Math.sqrt(this.sin2(a));
  }

  /** Returns Math.cos(toAngle().radians()), but computed more efficiently. */
  public static cos(a: S1ChordAngle): number {
    // cos(2*A) = cos^2(A) - sin^2(A) = 1 - 2*sin^2(A)
    checkArgument(!a.isSpecial());
    return 1 - 0.5 * a.length2;
  }

  /** Returns Math.tan(toAngle().radians()), but computed more efficiently. */
  public static tan(a: S1ChordAngle): number {
    return this.sin(a) / this.cos(a);
  }

  /**
   * Returns a new S1ChordAngle that has been adjusted by the given error bound (which can be
   * positive or negative). {@code error} should be the value returned by one of the error bound
   * methods below. For example:
   *
   * <pre>
   *    {@code S1ChordAngle a = new S1ChordAngle(x, y);}
   *    {@code S1ChordAngle a1 = a.plusError(a.getS2PointConstructorMaxError());}
   * </pre>
   *
   * <p>If this {@link #isSpecial}, we return {@code this}.
   */
  public plusError(error: number): S1ChordAngle {
    return this.isSpecial() ? this : S1ChordAngle.fromLength2(Math.max(0.0, Math.min(S1ChordAngle.MAX_LENGTH2, this.length2 + error)));
  }

  /** Returns the error in {@link #fromS1Angle}. */
  public getS1AngleConstructorMaxError(): number {
    return S2.DBL_EPSILON * this.length2;
  }

  /**
   * There is a relative error of {@code 2.5 * DBL_EPSILON} when computing the squared distance,
   * plus a relative error of {@code 2 * DBL_EPSILON} and an absolute error of {@code 16 *
   * DBL_EPSILON^2} because the lengths of the input points may differ from 1 by up to {@code 2 *
   * DBL_EPSILON} each. (This is the maximum length error in {@link S2Point#normalize}).
   */
  public getS2PointConstructorMaxError(): number {
    return (4.5 * S2.DBL_EPSILON * this.length2) + (16 * S2.DBL_EPSILON * S2.DBL_EPSILON);
  }

  /** Returns the string of the closest {@link S1Angle} to this chord distance. */

  public toString(): string {
    return this.toAngle().toString();
  }

  public compareTo(that: S1ChordAngle): number {
    return compareDouble(this.length2, that.length2);
  }

  public equals(that: S1ChordAngle): boolean {
    return this.compareTo(that) === 0;
  }
}