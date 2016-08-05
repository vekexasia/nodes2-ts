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

  constructor(public latRadians:number, public lngRadians:number) {
  }

// Clamps the latitude to the range [-90, 90] degrees, and adds or subtracts
  // a multiple of 360 degrees to the longitude if necessary to reduce it to
  // the range [-180, 180].
  /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
  public  toPoint():S2Point {
    const phi = this.latRadians;
    const theta = this.lngRadians;
    const cosphi = Math.cos(phi);
    return new S2Point(Math.cos(theta) * cosphi, Math.sin(theta) * cosphi, Math.sin(phi));
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
  public normalized():S2LatLng  {
  // drem(x, 2 * S2.M_PI) reduces its argument to the range
  // [-S2.M_PI, S2.M_PI] inclusive, which is what we want here.
  return new S2LatLng(Math.max(-S2.M_PI_2, Math.min(S2.M_PI_2, this.latRadians)),
      S2.IEEEremainder(this.lngRadians, 2 * S2.M_PI));
}

  public static fromDegrees(latDegrees:number, lngDegrees:number):S2LatLng {
    return new S2LatLng(S1Angle.degrees(latDegrees).radians, S1Angle.degrees(lngDegrees).radians);
  }

  static fromPoint(p:S2Point) {
    return new S2LatLng(S2LatLng.latitude(p).radians, S2LatLng.longitude(p).radians);
  }

  /**
   * Return true if the latitude is between -90 and 90 degrees inclusive and the
   * longitude is between -180 and 180 degrees inclusive.
   */
  public isValid():boolean {
    return Math.abs(this.latRadians) <= S2.M_PI_2 && Math.abs(this.lngRadians) <= S2.M_PI;
  }

  public static latitude(p:S2Point) {
    // We use atan2 rather than asin because the input vector is not necessarily
    // unit length, and atan2 is much more accurate than asin near the poles.
    return new S1Angle(
        Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y))
    );
  }

  public static longitude(p:S2Point):S1Angle {
    // Note that atan2(0, 0) is defined to be zero.
    return new S1Angle(Math.atan2(p.y, p.x));
  }


}
