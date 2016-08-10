var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./Interval", "./S2", 'decimal.js'], factory);
    }
})(function (require, exports) {
    "use strict";
    var Interval_1 = require("./Interval");
    var S2_1 = require("./S2");
    var Decimal = require('decimal.js');
    /**
     * An R1Interval represents a closed interval on a unit circle (also known as a
     * 1-dimensional sphere). It is capable of representing the empty interval
     * (containing no points), the full interval (containing all points), and
     * zero-length intervals (containing a single point).
     *
     *  Points are represented by the angle they make with the positive x-axis in
     * the range [-Pi, Pi]. An interval is represented by its lower and upper bounds
     * (both inclusive, since the interval is closed). The lower bound may be
     * greater than the upper bound, in which case the interval is "inverted" (i.e.
     * it passes through the point (-1, 0)).
     *
     *  Note that the point (-1, 0) has two valid representations, Pi and -Pi. The
     * normalized representation of this point internally is Pi, so that endpoints
     * of normal intervals are in the range (-Pi, Pi]. However, we take advantage of
     * the point -Pi to construct two special intervals: the Full() interval is
     * [-Pi, Pi], and the Empty() interval is [Pi, -Pi].
     *
     */
    var R1Interval = (function (_super) {
        __extends(R1Interval, _super);
        function R1Interval() {
            _super.apply(this, arguments);
        }
        /** Return true if the interval is empty, i.e. it contains no points. */
        R1Interval.prototype.isEmpty = function () {
            return this.lo.gt(this.hi);
        };
        R1Interval.prototype.getCenter = function () {
            return this.lo.plus(this.hi).dividedBy(2);
        };
        R1Interval.prototype.getLength = function () {
            return this.hi.minus(this.lo);
        };
        R1Interval.prototype.contains = function (_p) {
            var p = S2_1.S2.toDecimal(_p);
            return p.gte(this.lo) && p.lte(this.hi);
        };
        /** Return true if the interior of the interval contains the point 'p'. */
        R1Interval.prototype.interiorContains = function (_p) {
            var p = S2_1.S2.toDecimal(_p);
            return p.gt(this.lo) && p.lt(this.hi);
        };
        /**
         * Return true if the interval contains the given interval 'y'. Works for
         * empty, full, and singleton intervals.
         */
        R1Interval.prototype.containsI = function (y) {
            if (y.isEmpty()) {
                return true;
            }
            return y.lo.gte(this.lo) && y.hi.lte(this.hi);
        };
        R1Interval.prototype.interiorContainsI = function (y) {
            if (y.isEmpty()) {
                return true;
            }
            return y.lo.gt(this.lo) && y.hi.lt(this.hi);
        };
        /**
         * Return true if this interval intersects the given interval, i.e. if they
         * have any points in common.
         */
        R1Interval.prototype.intersects = function (y) {
            if (this.lo.lte(y.lo)) {
                return y.lo.lte(this.hi) && y.lo.lte(y.hi);
            }
            else {
                return this.lo.lte(y.hi) && this.lo.lte(this.hi);
            }
        };
        /**
         * Return true if the interior of this interval intersects any point of the
         * given interval (including its boundary).
         */
        R1Interval.prototype.interiorIntersects = function (y) {
            return y.lo.lt(this.hi) && this.lo.lt(y.hi) && this.lo.lt(this.hi) && y.lo.lte(y.hi);
        };
        /** Expand the interval so that it contains the given point "p". */
        R1Interval.prototype.addPoint = function (_p) {
            var p = S2_1.S2.toDecimal(_p);
            if (this.isEmpty()) {
                return R1Interval.fromPoint(p);
            }
            else if (p.lt(this.lo)) {
                return new R1Interval(p, this.hi);
            }
            else if (p.gt(this.hi)) {
                return new R1Interval(this.lo, p);
            }
            else {
                return new R1Interval(this.lo, this.hi);
            }
        };
        /**
         * Return an interval that contains all points with a distance "radius" of a
         * point in this interval. Note that the expansion of an empty interval is
         * always empty.
         */
        R1Interval.prototype.expanded = function (_radius) {
            var radius = S2_1.S2.toDecimal(_radius);
            // assert (radius >= 0);
            if (this.isEmpty()) {
                return this;
            }
            return new R1Interval(this.lo.minus(radius), this.hi.plus(radius));
        };
        /**
         * Return the smallest interval that contains this interval and the given
         * interval "y".
         */
        R1Interval.prototype.union = function (y) {
            if (this.isEmpty()) {
                return y;
            }
            if (y.isEmpty()) {
                return this;
            }
            return new R1Interval(Decimal.min(this.lo, y.lo), Decimal.max(this.hi, y.hi));
        };
        /**
         * Return the intersection of this interval with the given interval. Empty
         * intervals do not need to be special-cased.
         */
        R1Interval.prototype.intersection = function (y) {
            return new R1Interval(Decimal.max(this.lo, y.lo), Decimal.min(this.hi, y.hi));
        };
        /**
         * Return true if the length of the symmetric difference between the two
         * intervals is at most the given tolerance.
         */
        R1Interval.prototype.approxEquals = function (y, maxError) {
            if (maxError === void 0) { maxError = 1e-15; }
            if (this.isEmpty()) {
                return y.getLength().lte(maxError);
            }
            if (y.isEmpty()) {
                return this.getLength().lte(maxError);
            }
            return y.lo.minus(this.lo).abs()
                .plus(y.hi.minus(this.hi).abs())
                .lte(maxError);
        };
        R1Interval.empty = function () {
            return new R1Interval(1, 0);
        };
        R1Interval.fromPoint = function (p) {
            return new R1Interval(p, p);
        };
        /**
         * Convenience method to construct the minimal interval containing the two
         * given points. This is equivalent to starting with an empty interval and
         * calling AddPoint() twice, but it is more efficient.
         */
        R1Interval.fromPointPair = function (_p1, _p2) {
            var p1 = S2_1.S2.toDecimal(_p1);
            var p2 = S2_1.S2.toDecimal(_p2);
            if (p1.lte(p2)) {
                return new R1Interval(p1, p2);
            }
            else {
                return new R1Interval(p2, p1);
            }
        };
        return R1Interval;
    }(Interval_1.Interval));
    exports.R1Interval = R1Interval;
});
//# sourceMappingURL=R1Interval.js.map