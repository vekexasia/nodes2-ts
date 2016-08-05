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
"use strict";
var S1Angle_1 = require("./S1Angle");
var S2Point_1 = require("./S2Point");
var S2_1 = require("./S2");
/**
 * This class represents a point on the unit sphere as a pair of
 * latitude-longitude coordinates. Like the rest of the "geometry" package, the
 * intent is to represent spherical geometry as a mathematical abstraction, so
 * functions that are specifically related to the Earth's geometry (e.g.
 * easting/northing conversions) should be put elsewhere.
 *
 */
var S2LatLng = (function () {
    function S2LatLng(latRadians, lngRadians) {
        this.latRadians = latRadians;
        this.lngRadians = lngRadians;
    }
    // Clamps the latitude to the range [-90, 90] degrees, and adds or subtracts
    // a multiple of 360 degrees to the longitude if necessary to reduce it to
    // the range [-180, 180].
    /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
    S2LatLng.prototype.toPoint = function () {
        var phi = this.latRadians;
        var theta = this.lngRadians;
        var cosphi = Math.cos(phi);
        return new S2Point_1.S2Point(Math.cos(theta) * cosphi, Math.sin(theta) * cosphi, Math.sin(phi));
    };
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
    S2LatLng.prototype.normalized = function () {
        // drem(x, 2 * S2.M_PI) reduces its argument to the range
        // [-S2.M_PI, S2.M_PI] inclusive, which is what we want here.
        return new S2LatLng(Math.max(-S2_1.S2.M_PI_2, Math.min(S2_1.S2.M_PI_2, this.latRadians)), S2_1.S2.IEEEremainder(this.lngRadians, 2 * S2_1.S2.M_PI));
    };
    S2LatLng.fromDegrees = function (latDegrees, lngDegrees) {
        return new S2LatLng(S1Angle_1.S1Angle.degrees(latDegrees).radians, S1Angle_1.S1Angle.degrees(lngDegrees).radians);
    };
    S2LatLng.fromPoint = function (p) {
        return new S2LatLng(S2LatLng.latitude(p).radians, S2LatLng.longitude(p).radians);
    };
    /**
     * Return true if the latitude is between -90 and 90 degrees inclusive and the
     * longitude is between -180 and 180 degrees inclusive.
     */
    S2LatLng.prototype.isValid = function () {
        return Math.abs(this.latRadians) <= S2_1.S2.M_PI_2 && Math.abs(this.lngRadians) <= S2_1.S2.M_PI;
    };
    S2LatLng.latitude = function (p) {
        // We use atan2 rather than asin because the input vector is not necessarily
        // unit length, and atan2 is much more accurate than asin near the poles.
        return new S1Angle_1.S1Angle(Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y)));
    };
    S2LatLng.longitude = function (p) {
        // Note that atan2(0, 0) is defined to be zero.
        return new S1Angle_1.S1Angle(Math.atan2(p.y, p.x));
    };
    /**
     * Approximate "effective" radius of the Earth in meters.
     */
    S2LatLng.EARTH_RADIUS_METERS = 6367000.0;
    /** The center point the lat/lng coordinate system. */
    S2LatLng.CENTER = new S2LatLng(0.0, 0.0);
    return S2LatLng;
}());
exports.S2LatLng = S2LatLng;
