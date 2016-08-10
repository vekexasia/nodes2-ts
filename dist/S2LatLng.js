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
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S1Angle", "./S2Point", "./S2", 'decimal.js'], factory);
    }
})(function (require, exports) {
    "use strict";
    var S1Angle_1 = require("./S1Angle");
    var S2Point_1 = require("./S2Point");
    var S2_1 = require("./S2");
    var Decimal = require('decimal.js');
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
            this.latRadians = S2_1.S2.toDecimal(latRadians);
            this.lngRadians = S2_1.S2.toDecimal(lngRadians);
        }
        Object.defineProperty(S2LatLng.prototype, "latDegrees", {
            get: function () {
                return new S1Angle_1.S1Angle(this.latRadians).degrees();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(S2LatLng.prototype, "lngDegrees", {
            get: function () {
                return new S1Angle_1.S1Angle(this.lngRadians).degrees();
            },
            enumerable: true,
            configurable: true
        });
        // Clamps the latitude to the range [-90, 90] degrees, and adds or subtracts
        // a multiple of 360 degrees to the longitude if necessary to reduce it to
        // the range [-180, 180].
        /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
        S2LatLng.prototype.toPoint = function () {
            var phi = this.latRadians;
            var theta = this.lngRadians;
            var cosphi = Decimal.cos(phi);
            return new S2Point_1.S2Point(Decimal.cos(theta).times(cosphi), Decimal.sin(theta).times(cosphi), Decimal.sin(phi));
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
            return new S2LatLng(Decimal.max(-S2_1.S2.M_PI_2, Decimal.min(S2_1.S2.M_PI_2, this.latRadians)), S2_1.S2.IEEEremainder(this.lngRadians, S2_1.S2.toDecimal(2).times(S2_1.S2.M_PI)));
            // return new S2LatLng(Math.max(-S2.M_PI_2, Math.min(S2.M_PI_2, this.latRadians)),
            //     S2.IEEEremainder(this.lngRadians, 2 * S2.M_PI));
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
            return this.latRadians.abs().lte(S2_1.S2.M_PI_2) &&
                this.lngRadians.abs().lte(S2_1.S2.M_PI);
        };
        /**
         * Scales this point by the given scaling factor.
         * Note that there is no guarantee that the new point will be <em>valid</em>.
         */
        S2LatLng.prototype.mul = function (m) {
            return new S2LatLng(this.latRadians.times(m), this.lngRadians.times(m));
        };
        S2LatLng.latitude = function (p) {
            // We use atan2 rather than asin because the input vector is not necessarily
            // unit length, and atan2 is much more accurate than asin near the poles.
            return new S1Angle_1.S1Angle(Decimal.atan2(p.z, p.x.pow(2)
                .plus(p.y.pow(2))
                .sqrt()));
        };
        S2LatLng.longitude = function (p) {
            // Note that atan2(0, 0) is defined to be zero.
            return new S1Angle_1.S1Angle(Decimal.atan2(p.y, p.x));
        };
        S2LatLng.prototype.equals = function (other) {
            return other.latRadians === this.latRadians && other.lngRadians === this.lngRadians;
        };
        /**
         * Generates n LatLngs given a distance in km and the number of points wanted.
         * Generated points will be returned in a Clockwise order starting from North.
         * @param _distanceInKm
         * @param nPoints
         * @returns {S2LatLng[]}
         */
        S2LatLng.prototype.pointsAtDistance = function (_distanceInKm, nPoints) {
            var _this = this;
            if (nPoints === void 0) { nPoints = 4; }
            var dinstanceInM = S2_1.S2.toDecimal(_distanceInKm).times(1000);
            var distToRadius = dinstanceInM.dividedBy(S2LatLng.EARTH_RADIUS_METERS);
            return Array.apply(null, new Array(nPoints)) // create an array filled of undefined!
                .map(function (p, idx) {
                return S2_1.S2.toDecimal(360).dividedBy(nPoints).times(idx);
            })
                .map(function (bearingDegree) { return S1Angle_1.S1Angle.degrees(bearingDegree).radians; })
                .map(function (bearingRadians) {
                var newLat = _this.latRadians.sin()
                    .times(distToRadius.cos())
                    .plus(_this.latRadians.cos()
                    .times(distToRadius.sin())
                    .times(bearingRadians.cos())).asin();
                var newLng = _this.lngRadians
                    .plus(Decimal.atan2(bearingRadians.sin()
                    .times(distToRadius.sin())
                    .times(_this.latRadians.cos()), distToRadius.cos()
                    .minus(_this.latRadians.sin().times(newLat.sin()))));
                return new S2LatLng(newLat, newLng);
            });
        };
        S2LatLng.prototype.getEarthDistance = function (other) {
            return this.getDistance(other).radians.times(S2LatLng.EARTH_RADIUS_METERS);
        };
        S2LatLng.prototype.getDistance = function (other) {
            // This implements the Haversine formula, which is numerically stable for
            // small distances but only gets about 8 digits of precision for very large
            // distances (e.g. antipodal points). Note that 8 digits is still accurate
            // to within about 10cm for a sphere the size of the Earth.
            //
            // This could be fixed with another sin() and cos() below, but at that point
            // you might as well just convert both arguments to S2Points and compute the
            // distance that way (which gives about 15 digits of accuracy for all
            // distances).
            var dLat = other.latRadians.minus(this.latRadians).times(0.5).sin();
            var dLng = other.lngRadians.minus(this.lngRadians).times(0.5).sin();
            var x = dLat.pow(2)
                .plus(dLng.pow(2)
                .times(this.latRadians.cos())
                .times(other.latRadians.cos()));
            // double x = dlat * dlat + dlng * dlng * Math.cos(lat1) * Math.cos(lat2);
            return new S1Angle_1.S1Angle(S2_1.S2.toDecimal(2)
                .times(Decimal.atan2(x.sqrt(), Decimal.max(0, x.neg().plus(1))
                .sqrt())));
            // Return the distance (measured along the surface of the sphere) to the
            // given S2LatLng. This is mathematically equivalent to:
            //
            // S1Angle::FromRadians(ToPoint().Angle(o.ToPoint())
            //
            // but this implementation is slightly more efficient.
        };
        S2LatLng.prototype.toString = function () {
            return "(" + this.latRadians + ", " + this.lngRadians + ")";
        };
        S2LatLng.prototype.toStringDegrees = function () {
            return "(" + this.latDegrees + ", " + this.lngDegrees + ")";
        };
        S2LatLng.prototype.toGEOJSON = function () {
            return {
                type: 'Feature',
                geometry: {
                    type: "Point",
                    coordinates: [this.lngDegrees.toNumber(), this.latDegrees.toNumber()]
                },
                properties: {}
            };
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
});
//# sourceMappingURL=S2LatLng.js.map