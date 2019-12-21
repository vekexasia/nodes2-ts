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

import {S1Angle} from "./S1Angle";
import {S2Point} from "./S2Point";
import {S2} from "./S2";
/**
 * This class represents a point on the unit sphere as a pair of
 * latitude-longitude coordinates. Like the rest of the "geometry" package, the
 * intent is to represent spherical geometry as a mathematical abstraction, so
 * functions that are specifically related to the Earth's geometry (e.g.
 * easting/northing conversions) should be put elsewhere.
 *
 */
export class S2LatLng {

  /**
   * Approximate "effective" radius of the Earth in meters.
   */
  public static EARTH_RADIUS_METERS = 6367000.0;

  /** The center point the lat/lng coordinate system. */
  public static CENTER = new S2LatLng(0.0, 0.0);

  public latRadians: number;
  public lngRadians: number;

  constructor(latRadians:number, lngRadians:number) {
    this.latRadians = latRadians;
    this.lngRadians = lngRadians;
  }

  get latDegrees() {
    return new S1Angle(this.latRadians).degrees();
  }

  get lngDegrees() {
    return new S1Angle(this.lngRadians).degrees();
  }

// Clamps the latitude to the range [-90, 90] degrees, and adds or subtracts
  // a multiple of 360 degrees to the longitude if necessary to reduce it to
  // the range [-180, 180].
  /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
  public  toPoint():S2Point {
    const phi = this.latRadians;
    const theta = this.lngRadians;
    const cosphi = Math.cos(phi);

    return new S2Point(
        Math.cos(theta) * (cosphi),
        Math.sin(theta)* (cosphi),
        Math.sin(phi));
  }

  /**
   * Returns a new S2LatLng based on this instance for which {@link #isValid()}
   * will be {@code true}.
   * <ul>
   * <li>Latitude is clipped to the range {@code [-90, 90]}
   * <li>Longitude is normalized to be in the range {@code [-180, 180]}
   * </ul>
   * <p>If the current point is valid then the returned point will have the same
   * coordinates.
   */
  public normalized():S2LatLng {
    // drem(x, 2 * S2.M_PI) reduces its argument to the range
    // [-S2.M_PI, Math.atan2PI] inclusive, which is what we want here.
    return new S2LatLng(
        Math.max(
            -S2.M_PI_2,
            Math.min(
                S2.M_PI_2,
                this.latRadians
            )
        ),
        S2.IEEEremainder(
            this.lngRadians,
            2* (S2.M_PI)
        )
    );
    // return new S2LatLng(Math.max(-S2.M_PI_2, Math.min(S2.M_PI_2, this.latRadians)),
    //     S2.IEEEremainder(this.lngRadians, 2 * S2.M_PI));
  }

  public static fromDegrees(latDegrees:number, lngDegrees:number):S2LatLng {

    return new S2LatLng(S1Angle.degrees(latDegrees).radians, S1Angle.degrees(lngDegrees).radians);
  }

  static fromPoint(p:S2Point) {
    return new S2LatLng(
        S2LatLng.latitude(p).radians,
        S2LatLng.longitude(p).radians
    );
  }

  /**
   * Return true if the latitude is between -90 and 90 degrees inclusive and the
   * longitude is between -180 and 180 degrees inclusive.
   */
  public isValid():boolean {
    return Math.abs(this.latRadians) <= (S2.M_PI_2) &&
        Math.abs(this.lngRadians) <= (S2.M_PI);

  }


  /**
   * Scales this point by the given scaling factor.
   * Note that there is no guarantee that the new point will be <em>valid</em>.
   */
  public  mul(m:number):S2LatLng {
    return new S2LatLng(this.latRadians* (m), this.lngRadians* (m));
  }

  public static latitude(p:S2Point) {
    // We use atan2 rather than asin because the input vector is not necessarily
    // unit length, and atan2 is much more accurate than asin near the poles.
    return new S1Angle(Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y)));
  }

  public static longitude(p:S2Point):S1Angle {
    // Note that atan2(0, 0) is defined to be zero.
    return new S1Angle(Math.atan2(p.y, p.x));
  }

  equals(other:S2LatLng):boolean {
    return other.latRadians === this.latRadians && other.lngRadians === this.lngRadians;
  }

  pointAtDistance(distanceInKM:number, bearingRadians:number) {
    const distanceInM = distanceInKM * 1000;
    const distanceToRadius = distanceInM / (S2LatLng.EARTH_RADIUS_METERS);

    const newLat = Math.asin(Math.sin(this.latRadians) * Math.cos(distanceToRadius)
        + (
          Math.cos(this.latRadians) * Math.sin(distanceToRadius) * Math.cos(bearingRadians)
      ));
    const newLng = this.lngRadians +  Math.atan2(
                Math.sin(bearingRadians)
                    * (Math.sin(distanceToRadius))
                    * (Math.cos(this.latRadians)),
                Math.cos(distanceToRadius) - (Math.sin(this.latRadians) * Math.sin(newLat)
            )
        );
    return new S2LatLng(newLat, newLng);
  }

  /**
   * Generates n LatLngs given a distance in km and the number of points wanted.
   * Generated points will be returned in a Clockwise order starting from North.
   * @param _distanceInKm
   * @param nPoints
   * @returns {S2LatLng[]}
   */
  pointsAtDistance(_distanceInKm:number, nPoints:number=4):S2LatLng[] {
    return Array.apply(null, new Array(nPoints)) // create an array filled of undefined!
        .map((p, idx) => 360 / nPoints * idx)
        .map(bearingDegree => S1Angle.degrees(bearingDegree).radians)
        .map(bearingRadians => this.pointAtDistance(_distanceInKm, bearingRadians));

  }

  getEarthDistance(other:S2LatLng) {
    return this.getDistance(other).radians * (S2LatLng.EARTH_RADIUS_METERS);
  }

  getDistance(other:S2LatLng):S1Angle {
    // This implements the Haversine formula, which is numerically stable for
    // small distances but only gets about 8 digits of precision for very large
    // distances (e.g. antipodal points). Note that 8 digits is still accurate
    // to within about 10cm for a sphere the size of the Earth.
    //
    // This could be fixed with another sin() and cos() below, but at that point
    // you might as well just convert both arguments to S2Points and compute the
    // distance that way (which gives about 15 digits of accuracy for all
    // distances).

    const dLat = Math.sin((other.latRadians - this.latRadians)*0.5);
    const dLng = Math.sin((other.lngRadians - this.lngRadians)*0.5);
    const x = dLat*dLat + dLng*dLng * Math.cos(this.latRadians) * Math.cos(other.latRadians);

    return new S1Angle(
        2
            * (
                Math.atan2(
                    Math.sqrt(x),
                    Math.sqrt(
                      Math.max(
                          0,
                        (x * -1) + 1
                      )
                    )
                )
            )
    );
    // Return the distance (measured along the surface of the sphere) to the
    // given S2LatLng. This is mathematically equivalent to:
    //
    // S1Angle::FromRadians(ToPoint().Angle(o.ToPoint())
    //
    // but this implementation is slightly more efficient.
  }

  public  toString():string {
    return "(" + this.latRadians + ", " + this.lngRadians + ")";
  }

  public toStringDegrees():string {
    return "(" + this.latDegrees + ", " + this.lngDegrees + ")";
  }

  public toGEOJSON() {
    return {
      type: 'Feature',
      geometry: {
        type: "Point",
        coordinates: [this.lngDegrees, this.latDegrees]
      },
      properties: {}

    }
  }
}
