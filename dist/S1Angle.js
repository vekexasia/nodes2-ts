(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", 'decimal.js', "./S2"], factory);
    }
})(function (require, exports) {
    "use strict";
    /// <reference path="../typings/globals/decimal.js/index.d.ts" />
    var Decimal = require('decimal.js');
    var S2_1 = require("./S2");
    var S1Angle = (function () {
        function S1Angle(radians) {
            this.radians = new Decimal(radians);
        }
        S1Angle.prototype.degrees = function () {
            return S2_1.S2.toDecimal(this.radians).times((180 / Math.PI));
        };
        //
        // public long e5() {
        //   return Math.round(degrees() * 1e5);
        // }
        //
        // public long e6() {
        //   return Math.round(degrees() * 1e6);
        // }
        //
        // public long e7() {
        //   return Math.round(degrees() * 1e7);
        // }
        /**
         * Return the angle between two points, which is also equal to the distance
         * between these points on the unit sphere. The points do not need to be
         * normalized.
         */
        S1Angle.fromPoints = function (x, y) {
            return new S1Angle(x.angle(y));
        };
        S1Angle.prototype.lessThan = function (that) {
            return this.radians.lt(that.radians);
        };
        S1Angle.prototype.greaterThan = function (that) {
            return this.radians.gt(that.radians);
        };
        S1Angle.prototype.lessOrEquals = function (that) {
            return this.radians.lte(that.radians);
        };
        S1Angle.prototype.greaterOrEquals = function (that) {
            return this.radians.gte(that.radians);
        };
        S1Angle.max = function (left, right) {
            return right.greaterThan(left) ? right : left;
        };
        S1Angle.min = function (left, right) {
            return right.greaterThan(left) ? left : right;
        };
        S1Angle.degrees = function (degrees) {
            var d = new Decimal(degrees);
            return new S1Angle(d.times(Math.PI / 180));
        };
        //
        // public static S1Angle e5(long e5) {
        //   return degrees(e5 * 1e-5);
        // }
        //
        // public static S1Angle e6(long e6) {
        //   // Multiplying by 1e-6 isn't quite as accurate as dividing by 1e6,
        //   // but it's about 10 times faster and more than accurate enough.
        //   return degrees(e6 * 1e-6);
        // }
        //
        // public static S1Angle e7(long e7) {
        //   return degrees(e7 * 1e-7);
        // }
        /**
         * Writes the angle in degrees with a "d" suffix, e.g. "17.3745d". By default
         * 6 digits are printed; this can be changed using setprecision(). Up to 17
         * digits are required to distinguish one angle from another.
         */
        S1Angle.prototype.toString = function () {
            return this.degrees() + "d";
        };
        S1Angle.prototype.compareTo = function (that) {
            return this.radians < that.radians ? -1 : this.radians > that.radians ? 1 : 0;
        };
        return S1Angle;
    }());
    exports.S1Angle = S1Angle;
});
//# sourceMappingURL=S1Angle.js.map