/*
 * Copyright 2005 Google Inc.
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


import {S2Region} from "./S2Region";
import {S2} from "./S2";
import {S2Point} from "./S2Point";
import {S1Angle} from "./S1Angle";
import {S2LatLngRect} from "./S2LatLngRect";
import {S2LatLng} from "./S2LatLng";
import {R1Interval} from "./R1Interval";
import {S1Interval} from "./S1Interval";
import {S2Cell} from "./S2Cell";
import Long = require('long');
/**
 * This class represents a spherical cap, i.e. a portion of a sphere cut off by
 * a plane. The cap is defined by its axis and height. This representation has
 * good numerical accuracy for very small caps (unlike the (axis,
 * min-distance-from-origin) representation), and is also efficient for
 * containment tests (unlike the (axis, angle) representation).
 *
 * Here are some useful relationships between the cap height (h), the cap
 * opening angle (theta), the maximum chord length from the cap's center (d),
 * and the radius of cap's base (a). All formulas assume a unit radius.
 *
 * h = 1 - cos(theta) = 2 sin^2(theta/2) d^2 = 2 h = a^2 + h^2
 *
 */
export class S2Cap implements S2Region {

  /**
   * Multiply a positive number by this constant to ensure that the result of a
   * floating point operation is at least as large as the true
   * infinite-precision result.
   */
  private static ROUND_UP = S2.toDecimal(1).dividedBy(new Long(1).shiftLeft(52).toString()).plus(1);

  public axis:S2Point;
  public height:decimal.Decimal;

  /**
   * Create a cap given its axis and the cap height, i.e. the maximum projected
   * distance along the cap axis from the cap center. 'axis' should be a
   * unit-length vector.
   */
  constructor(axis:S2Point, _height:number|decimal.Decimal) {
    this.axis = axis;
    this.height = S2.toDecimal(_height);
    // assert (isValid());
  }

  /**
   * Create a cap given its axis and the cap opening angle, i.e. maximum angle
   * between the axis and a point on the cap. 'axis' should be a unit-length
   * vector, and 'angle' should be between 0 and 180 degrees.
   */
  public static fromAxisAngle(axis:S2Point, angle:S1Angle):S2Cap {
    // The height of the cap can be computed as 1-cos(angle), but this isn't
    // very accurate for angles close to zero (where cos(angle) is almost 1).
    // Computing it as 2*(sin(angle/2)**2) gives much better precision.

    // assert (S2.isUnitLength(axis));
    const d = angle.radians.times(0.5).sin();
    // ecimal.sin(0.5 * angle.radians.times(0.5));
    return new S2Cap(axis, d.pow(2).times(2));

  }

  /**
   * Create a cap given its axis and its area in steradians. 'axis' should be a
   * unit-length vector, and 'area' should be between 0 and 4 * M_PI.
   */
  public static fromAxisArea(axis:S2Point, _area:number|decimal.Decimal):S2Cap {
    const area = S2.toDecimal(_area);
    // assert (S2.isUnitLength(axis));
    return new S2Cap(axis, area.dividedBy(S2.toDecimal(2).times(S2.M_PI)));
  }

  /** Return an empty cap, i.e. a cap that contains no points. */
  public static empty():S2Cap {
    return new S2Cap(new S2Point(1, 0, 0), -1);
  }

  /** Return a full cap, i.e. a cap that contains all points. */
  public static full():S2Cap {
    return new S2Cap(new S2Point(1, 0, 0), 2);
  }


  public area():decimal.Decimal {
    return Decimal.max(
        0,
        this.height
    )
        .times(S2.M_PI)
        .times(2);
    // return 2 * S2.M_PI * Math.max(0.0, this.height);
  }

  /**
   * Return the cap opening angle in radians, or a negative number for empty
   * caps.
   */
  public  angle():S1Angle {
    // This could also be computed as acos(1 - height_), but the following
    // formula is much more accurate when the cap height is small. It
    // follows from the relationship h = 1 - cos(theta) = 2 sin^2(theta/2).
    if (this.isEmpty()) {
      return new S1Angle(-1);
    }
    return new S1Angle(
        Decimal.asin(
            this.height.times(0.5).sqrt()
        )
            .times(2)
    );
  }

  /**
   * We allow negative heights (to represent empty caps) but not heights greater
   * than 2.
   */
  public isValid():boolean {
    return S2.isUnitLength(this.axis) && this.height.lte(2);
  }

  /** Return true if the cap is empty, i.e. it contains no points. */
  public  isEmpty():boolean {
    return this.height.lt(0);
  }

  /** Return true if the cap is full, i.e. it contains all points. */
  public isFull():boolean {
    return this.height.gte(2);
  }

  /**
   * Return the complement of the interior of the cap. A cap and its complement
   * have the same boundary but do not share any interior points. The complement
   * operator is not a bijection, since the complement of a singleton cap
   * (containing a single point) is the same as the complement of an empty cap.
   */
  public complement():S2Cap {
    // The complement of a full cap is an empty cap, not a singleton.
    // Also make sure that the complement of an empty cap has height 2.
    let cHeight = this.isFull() ? -1 : Decimal.max(this.height, 0).neg().plus(2);
    return new S2Cap(S2Point.neg(this.axis), cHeight);
  }

  /**
   * Return true if and only if this cap contains the given other cap (in a set
   * containment sense, e.g. every cap contains the empty cap).
   */
  public  containsCap(other:S2Cap):boolean {
    if (this.isFull() || other.isEmpty()) {
      return true;
    }
    return this.angle().radians.gte(this.axis.angle(other.axis).plus(other.angle().radians));
  }

  /**
   * Return true if and only if the interior of this cap intersects the given
   * other cap. (This relationship is not symmetric, since only the interior of
   * this cap is used.)
   */
  public interiorIntersects(other:S2Cap):boolean {
    // Interior(X) intersects Y if and only if Complement(Interior(X))
    // does not contain Y.
    return !this.complement().containsCap(other);
  }

  /**
   * Return true if and only if the given point is contained in the interior of
   * the region (i.e. the region excluding its boundary). 'p' should be a
   * unit-length vector.
   */
  public  interiorContains(p:S2Point):boolean {
    // assert (S2.isUnitLength(p));
    return this.isFull() || S2Point.sub(this.axis, p).norm2().lt(this.height.times(2));
  }

  /**
   * Increase the cap height if necessary to include the given point. If the cap
   * is empty the axis is set to the given point, but otherwise it is left
   * unchanged. 'p' should be a unit-length vector.
   */
  public addPoint(p:S2Point):S2Cap {
    // Compute the squared chord length, then convert it into a height.
    // assert (S2.isUnitLength(p));
    if (this.isEmpty()) {
      return new S2Cap(p, 0);
    } else {
      // To make sure that the resulting cap actually includes this point,
      // we need to round up the distance calculation. That is, after
      // calling cap.AddPoint(p), cap.Contains(p) should be true.
      let dist2 = S2Point.sub(this.axis, p).norm2();
      let newHeight = Decimal.max(this.height, S2Cap.ROUND_UP.times(0.5).times(dist2));
      return new S2Cap(this.axis, newHeight);
    }
  }

// Increase the cap height if necessary to include "other". If the current
// cap is empty it is set to the given other cap.
  public addCap(other:S2Cap):S2Cap {
    if (this.isEmpty()) {
      return new S2Cap(other.axis, other.height);
    } else {
      // See comments for FromAxisAngle() and AddPoint(). This could be
      // optimized by doing the calculation in terms of cap heights rather
      // than cap opening angles.
      let angle = this.axis.angle(other.axis).plus(other.angle().radians);
      if (angle.gte(S2.M_PI)) {
        return new S2Cap(this.axis, 2); //Full cap
      } else {
        let d = angle.times(0.5).sin();
        let newHeight = Decimal.max(this.height, S2Cap.ROUND_UP.times(2).times(d.pow(2)));
        return new S2Cap(this.axis, newHeight);
      }
    }
  }

// //////////////////////////////////////////////////////////////////////
// S2Region interface (see {@code S2Region} for details):
  public  getRectBound():S2LatLngRect {
    if (this.isEmpty()) {
      return S2LatLngRect.empty();
    }

    // Convert the axis to a (lat,lng) pair, and compute the cap angle.
    const axisLatLng = S2LatLng.fromPoint(this.axis);
    const capAngle = this.angle().radians;

    let allLongitudes = false;
    const lat:decimal.Decimal[] = Array(2);
    const lng:decimal.Decimal[] = Array(2);

    lng[0] = S2.toDecimal(-S2.M_PI);
    lng[1] = S2.toDecimal(S2.M_PI);

    // Check whether cap includes the south pole.
    lat[0] = axisLatLng.latRadians.minus(capAngle);
    if (lat[0].lte(-S2.M_PI_2)) {
      lat[0] = S2.toDecimal(-S2.M_PI_2);
      allLongitudes = true;
    }
    // Check whether cap includes the north pole.
    lat[1] = axisLatLng.latRadians.plus(capAngle);
    if (lat[1].gte(S2.M_PI_2)) {
      lat[1] = S2.toDecimal(S2.M_PI_2);
      allLongitudes = true;
    }
    if (!allLongitudes) {
      // Compute the range of longitudes covered by the cap. We use the law
      // of sines for spherical triangles. Consider the triangle ABC where
      // A is the north pole, B is the center of the cap, and C is the point
      // of tangency between the cap boundary and a line of longitude. Then
      // C is a right angle, and letting a,b,c denote the sides opposite A,B,C,
      // we have sin(a)/sin(A) = sin(c)/sin(C), or sin(A) = sin(a)/sin(c).
      // Here "a" is the cap angle, and "c" is the colatitude (90 degrees
      // minus the latitude). This formula also works for negative latitudes.
      //
      // The formula for sin(a) follows from the relationship h = 1 - cos(a).

      // double sinA = Math.sqrt(this.height * (2 - this.height));
      // double sinC = Math.cos(axisLatLng.lat().radians());
      const sinA = this.height.times(this.height.neg().plus(2)).sqrt();
      const sinC = axisLatLng.latRadians.cos();
      if (sinA.lte(sinC)) {
        const angleA = Decimal.asin(sinA.dividedBy(sinC));
        lng[0] = S2.IEEEremainder(axisLatLng.lngRadians.minus(angleA),
            2 * S2.M_PI);
        lng[1] = S2.IEEEremainder(axisLatLng.lngRadians.plus(angleA),
            2 * S2.M_PI);
      }
    }
    return new S2LatLngRect(
        new R1Interval(lat[0], lat[1]),
        new S1Interval(lng[0], lng[1])
    );
  }


  public containsC(cell:S2Cell):boolean {
    // If the cap does not contain all cell vertices, return false.
    // We check the vertices before taking the Complement() because we can't
    // accurately represent the complement of a very small cap (a height
    // of 2-epsilon is rounded off to 2).
    const vertices:S2Point[] = new Array(4);
    for (let k = 0; k < 4; ++k) {
      vertices[k] = cell.getVertex(k);
      if (!this.contains(vertices[k])) {
        return false;
      }
    }
    // Otherwise, return true if the complement of the cap does not intersect
    // the cell. (This test is slightly conservative, because technically we
    // want Complement().InteriorIntersects() here.)
    return !this.complement().intersects(cell, vertices);
  }

  public  mayIntersectC(cell:S2Cell):boolean {
    // If the cap contains any cell vertex, return true.
    const vertices:S2Point[] = new Array(4);
    for (let k = 0; k < 4; ++k) {
      vertices[k] = cell.getVertex(k);
      if (this.contains(vertices[k])) {
        return true;
      }
    }
    return this.intersects(cell, vertices);
  }

  /**
   * Return true if the cap intersects 'cell', given that the cap vertices have
   * alrady been checked.
   */
  public intersects(cell:S2Cell, vertices:S2Point[]):boolean {
    // Return true if this cap intersects any point of 'cell' excluding its
    // vertices (which are assumed to already have been checked).

    // If the cap is a hemisphere or larger, the cell and the complement of the
    // cap are both convex. Therefore since no vertex of the cell is contained,
    // no other interior point of the cell is contained either.
    if (this.height.gte(1)) {
      return false;
    }

    // We need to check for empty caps due to the axis check just below.
    if (this.isEmpty()) {
      return false;
    }

    // Optimization: return true if the cell contains the cap axis. (This
    // allows half of the edge checks below to be skipped.)
    if (cell.contains(this.axis)) {
      return true;
    }

    // At this point we know that the cell does not contain the cap axis,
    // and the cap does not contain any cell vertex. The only way that they
    // can intersect is if the cap intersects the interior of some edge.

    const sin2Angle = this.height.times(this.height.neg().times(2)); // sin^2(capAngle)
    for (let k = 0; k < 4; ++k) {
      let edge = cell.getEdgeRaw(k);
      let dot = this.axis.dotProd(edge);
      if (dot.gt(0)) {
        // The axis is in the interior half-space defined by the edge. We don't
        // need to consider these edges, since if the cap intersects this edge
        // then it also intersects the edge on the opposite side of the cell
        // (because we know the axis is not contained with the cell).
        continue;
      }
      // The Norm2() factor is necessary because "edge" is not normalized.
      if (dot.pow(2).gt(sin2Angle.times(edge.norm2()))) {
        return false; // Entire cap is on the exterior side of this edge.
      }
      // Otherwise, the great circle containing this edge intersects
      // the interior of the cap. We just need to check whether the point
      // of closest approach occurs between the two edge endpoints.
      const dir = S2Point.crossProd(edge, this.axis);
      if (dir.dotProd(vertices[k]).lt(0)
          && dir.dotProd(vertices[(k + 1) & 3]).gt(0)) {
        return true;
      }
    }
    return false;
  }

  public contains(p:S2Point):boolean {
    // The point 'p' should be a unit-length vector.
    // assert (S2.isUnitLength(p));
    return S2Point.sub(this.axis, p).norm2().lte(this.height.times(2));

  }

//
// /** Return true if two caps are identical. */
// public equals(that:Object ):boolean  {
//
//   if (!(that instanceof S2Cap)) {
//     return false;
//   }
//
//   S2Cap other = (S2Cap) that;
//   return (this.axis.equals(other.axis) && this.height == other.height)
//       || (isEmpty() && other.isEmpty()) || (isFull() && other.isFull());
//
// }
//
// @Override
// public int hashCode() {
//   if (isFull()) {
//     return 17;
//   } else if (isEmpty()) {
//     return 37;
//   }
//   int result = 17;
//   result = 37 * result + this.axis.hashCode();
//   long heightBits = Double.doubleToLongBits(this.height);
//   result = 37 * result + (int) ((heightBits >>> 32) ^ heightBits);
//   return result;
// }

// /////////////////////////////////////////////////////////////////////
// The following static methods are convenience functions for assertions
// and testing purposes only.

  /**
   * Return true if the cap axis and height differ by at most "max_error" from
   * the given cap "other".
   */
  public approxEquals(other:S2Cap, maxError:number = 1e-14):boolean {
    return (this.axis.aequal(other.axis, maxError) && this.height.minus(other.height).lte(maxError))
        || (this.isEmpty() && other.height.lte(maxError))
        || (other.isEmpty() && this.height.lte(maxError))
        || (this.isFull() && other.height.gte(2 - maxError))
        || (other.isFull() && this.height.gte(2 - maxError));
  }

  public toString():string {
    return "[Point = " + this.axis.toString() + " Height = " + this.height.toString() + "]";
  }
}
