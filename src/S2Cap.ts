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
import {S1ChordAngle} from "./S1ChordAngle";
import { Platform } from './Platform';
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
   private static ROUND_UP = 1/new Long(1).shiftLeft(52).toNumber() + 1;

  public axis: S2Point;
  public radius: S1ChordAngle;


  /**
   * Create a cap given its axis and the cap height, i.e. the maximum projected
   * distance along the cap axis from the cap center. 'axis' should be a
   * unit-length vector.
   */
  constructor(axis:S2Point, radius: S1ChordAngle) {
    this.axis = axis;
    this.radius = radius;
    // assert (isValid());
  }

  public static fromAxisChord(center: S2Point, radius: S1ChordAngle): S2Cap {
    return new S2Cap(center, radius);
  }

  /**
   * Create a cap given its axis and the cap height, i.e. the maximum projected distance along the
   * cap axis from the cap center. 'axis' should be a unit-length vector.
   */
  public static fromAxisHeight(axis: S2Point, height: number): S2Cap {
    // assert (S2.isUnitLength(axis));
    return new S2Cap(axis, S1ChordAngle.fromLength2(2 * height));
  }

  /**
   * Create a cap given its axis and the cap opening angle, i.e. maximum angle
   * between the axis and a point on the cap. 'axis' should be a unit-length
   * vector, and 'angle' should be between 0 and 180 degrees.
   */
  public static fromAxisAngle(axis:S2Point, angle:S1Angle): S2Cap {
    // The "min" calculation below is necessary to handle S1Angle.INFINITY.
    // assert (S2.isUnitLength(axis));

    return this.fromAxisChord(
      axis, S1ChordAngle.fromS1Angle(S1Angle.radians(Math.min(angle.radians, S2.M_PI))));
  }

  /**
   * Create a cap given its axis and its area in steradians. 'axis' should be a unit-length vector,
   * and 'area' should be between 0 and 4 * M_PI.
   */
  public static fromAxisArea(axis:S2Point, area:number):S2Cap {
    // assert (S2.isUnitLength(axis));
    return new S2Cap(axis, S1ChordAngle.fromLength2(area / S2.M_PI));
  }

  /** Return an empty cap, i.e. a cap that contains no points. */
  public static empty(): S2Cap {
    return new S2Cap(S2Point.X_POS, S1ChordAngle.NEGATIVE);
  }

  /** Return a full cap, i.e. a cap that contains all points. */
  public static full(): S2Cap {
    return new S2Cap(S2Point.X_POS, S1ChordAngle.STRAIGHT);
  }

  getCapBound():S2Cap {
    return this;
  }

  public height(): number {
    return 0.5 * this.radius.getLength2();
  }

  public area() {
    return 2 * S2.M_PI * Math.max(0.0, this.height());
  }

  /**
   * Returns the cap radius as an S1Angle. Since the cap angle is stored internally as an
   * S1ChordAngle, this method requires a trigonometric operation and may yield a slightly different
   * result than the value passed to {@link #fromAxisAngle(S2Point, S1Angle)}.
   */
  public angle():S1Angle {
    return this.radius.toAngle();
  }

  /**
   * Returns true if the axis is {@link S2#isUnitLength unit length}, and the angle is less than Pi.
   *
   * <p>Negative angles or heights are valid, and represent empty caps.
   */
  public isValid():boolean {
    return S2.isUnitLength(this.axis) && this.radius.getLength2() <= 4;
  }

  /** Return true if the cap is empty, i.e. it contains no points. */
  public isEmpty():boolean {
    return this.radius.isNegative();
  }

  /** Return true if the cap is full, i.e. it contains all points. */
  public isFull():boolean {
    return S1ChordAngle.STRAIGHT.equals(this.radius);
  }

  /**
   * Return the complement of the interior of the cap. A cap and its complement have the same
   * boundary but do not share any interior points. The complement operator is not a bijection,
   * since the complement of a singleton cap (containing a single point) is the same as the
   * complement of an empty cap.
   */
  public complement():S2Cap {
    // The complement of a full cap is an empty cap, not a singleton.
    // Also make sure that the complement of an empty cap is full.
    if (this.isFull()) {
      return S2Cap.empty();
    }
    if (this.isEmpty()) {
      return S2Cap.full();
    }
    return S2Cap.fromAxisChord(S2Point.neg(this.axis), S1ChordAngle.fromLength2(4 - this.radius.getLength2()));
  }

  /**
   * Return true if and only if this cap contains the given other cap (in a set
   * containment sense, e.g. every cap contains the empty cap).
   */
  public containsCap(other:S2Cap):boolean {
    if (this.isFull() || other.isEmpty()) {
      return true;
    } else {
      const axialDistance = S1ChordAngle.fromS2Point(this.axis, other.axis);
      return this.radius.compareTo(S1ChordAngle.add(axialDistance, other.radius)) >= 0;
    }
  }

  /**
   * Return true if and only if the interior of this cap intersects the given other cap. (This
   * relationship is not symmetric, since only the interior of this cap is used.)
   */
  public interiorIntersects(other:S2Cap):boolean {
    // Interior(X) intersects Y if and only if Complement(Interior(X))
    // does not contain Y.
    return !this.complement().containsCap(other);
  }

  /**
   * Return true if and only if the given point is contained in the interior of the region (i.e. the
   * region excluding its boundary). 'p' should be a unit-length vector.
   */
  public interiorContains(p:S2Point):boolean {
    // assert (S2.isUnitLength(p));
    return this.isFull() || S1ChordAngle.fromS2Point(this.axis, p).compareTo(this.radius) < 0;
  }

  /**
   * Increase the cap radius if necessary to include the given point. If the cap is empty the axis
   * is set to the given point, but otherwise it is left unchanged.
   *
   * @param p must be {@link S2#isUnitLength unit length}
   */
  public addPoint(p:S2Point):S2Cap {
    // assert (S2.isUnitLength(p));
    if (this.isEmpty()) {
      return new S2Cap(p, S1ChordAngle.ZERO);
    } else {
      // After adding p to this cap, we require that the result contains p. However we don't need to
      // do anything special to achieve this because contains() does exactly the same distance
      // calculation that we do here.
      return new S2Cap(
          this.axis, S1ChordAngle.fromLength2(Math.max(this.radius.getLength2(), this.axis.getDistance2(p))));
    }
  }

// Increase the cap height if necessary to include "other". If the current
// cap is empty it is set to the given other cap.
  public addCap(other:S2Cap):S2Cap {
    if (this.isEmpty()) {
      return other;
    } else if (other.isEmpty()) {
      return this;
    } else {
      // We round up the distance to ensure that the cap is actually contained.
      // TODO(user): Do some error analysis in order to guarantee this.
      const dist = S1ChordAngle.add(S1ChordAngle.fromS2Point(this.axis, other.axis), other.radius);
      const roundedUp = dist.plusError(S2.DBL_EPSILON * dist.getLength2());
      return new S2Cap(this.axis, S1ChordAngle.max(this.radius, roundedUp));
    }
  }

// //////////////////////////////////////////////////////////////////////
// S2Region interface (see {@code S2Region} for details):
  public getRectBound():S2LatLngRect {
    if (this.isEmpty()) {
      return S2LatLngRect.empty();
    }
    if (this.isFull()) {
      return S2LatLngRect.full();
    }

    // Convert the axis to a (lat,lng) pair, and compute the cap angle.
    const axisLatLng = S2LatLng.fromPoint(this.axis);
    const capAngle = this.angle().radians;

    let allLongitudes = false;
    const lat = [];
    const lng = [];
    lng[0] = -S2.M_PI;
    lng[1] = S2.M_PI;

    // Check whether cap includes the south pole.
    lat[0] = axisLatLng.lat().radians - capAngle;
    if (lat[0] <= -S2.M_PI_2) {
      lat[0] = -S2.M_PI_2;
      allLongitudes = true;
    }
    // Check whether cap includes the north pole.
    lat[1] = axisLatLng.lat().radians + capAngle;
    if (lat[1] >= S2.M_PI_2) {
      lat[1] = S2.M_PI_2;
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
      const sinA = S1ChordAngle.sin(this.radius);
      const sinC = Math.cos(axisLatLng.lat().radians);
      if (sinA <= sinC) {
        const angleA = Math.asin(sinA / sinC);
        lng[0] = Platform.IEEEremainder(axisLatLng.lng().radians - angleA, 2 * S2.M_PI);
        lng[1] = Platform.IEEEremainder(axisLatLng.lng().radians + angleA, 2 * S2.M_PI);
      }
    }
    return new S2LatLngRect(new R1Interval(lat[0], lat[1]), new S1Interval(lng[0], lng[1]));
  }

  // public mayIntersectC(cell:S2Cell):boolean {
  //   const toRet = this._mayIntersectC(cell);
  //   console.log("intersects? ",toRet, cell.id.pos().toString(16), cell.level);
  //   return toRet;
  // }
  public mayIntersectC(cell:S2Cell):boolean {
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
  public intersects(cell:S2Cell, vertices:S2Point[]): boolean {
    // Return true if this cap intersects any point of 'cell' excluding its
    // vertices (which are assumed to already have been checked).

    // If the cap is a hemisphere or larger, the cell and the complement of the
    // cap are both convex. Therefore since no vertex of the cell is contained,
    // no other interior point of the cell is contained either.
    if (this.radius.compareTo(S1ChordAngle.RIGHT) >= 0) {
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

    const sin2Angle = S1ChordAngle.sin2(this.radius);
    for (let k = 0; k < 4; ++k) {
      const edge = cell.getEdgeRaw(k);
      const dot = this.axis.dotProd(edge);
      if (dot > 0) {
        // The axis is in the interior half-space defined by the edge. We don't
        // need to consider these edges, since if the cap intersects this edge
        // then it also intersects the edge on the opposite side of the cell
        // (because we know the axis is not contained with the cell).
        continue;
      }
      // The Norm2() factor is necessary because "edge" is not normalized.
      if (dot * dot > sin2Angle * edge.norm2()) {
        return false; // Entire cap is on the exterior side of this edge.
      }
      // Otherwise, the great circle containing this edge intersects
      // the interior of the cap. We just need to check whether the point
      // of closest approach occurs between the two edge endpoints.
      const dir = S2Point.crossProd(edge, this.axis);
      if (dir.dotProd(vertices[k]) < 0 && dir.dotProd(vertices[(k + 1) & 3]) > 0) {
        return true;
      }
    }
    return false;
  }

  public contains(p:S2Point):boolean {
    // The point 'p' should be a unit-length vector.
    // assert (S2.isUnitLength(p));
    return S1ChordAngle.fromS2Point(this.axis, p).compareTo(this.radius) <= 0;
  }

  public containsC(cell: S2Cell): boolean {
    // If the cap does not contain all cell vertices, return false.
    // We check the vertices before taking the Complement() because we can't
    // accurately represent the complement of a very small cap (a height
    // of 2-epsilon is rounded off to 2).
    const vertices = [];
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
    const r2 = this.radius.getLength2();
    const otherR2 = other.radius.getLength2();

    return (S2.approxEqualsPointError(this.axis, other.axis, maxError) && Math.abs(r2 - otherR2) <= maxError)
        || (this.isEmpty() && otherR2 <= maxError)
        || (other.isEmpty() && r2 <= maxError)
        || (this.isFull() && otherR2 >= 2 - maxError)
        || (other.isFull() && r2 >= 2 - maxError);
  }

  public toString():string {
    return "[Point = " + this.axis + " Radius = " + this.radius + "]";
  }

  public toGEOJSON(){
    return this.getRectBound().toGEOJSON();
  }
}
