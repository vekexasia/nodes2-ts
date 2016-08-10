(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2"], factory);
    }
})(function (require, exports) {
    "use strict";
    var S2_1 = require("./S2");
    var Interval = (function () {
        function Interval(lo, hi) {
            this.lo = S2_1.S2.toDecimal(lo);
            this.hi = S2_1.S2.toDecimal(hi);
        }
        Interval.prototype.toString = function () {
            return "[" + this.lo.toString() + ", " + this.hi.toString() + "]";
        };
        /**
         * Return true if two intervals contains the same set of points.
         */
        Interval.prototype.equals = function (that) {
            if (typeof (that) === typeof (this)) {
                return this.lo.eq(that.lo) && this.hi.eq(that.hi);
            }
            return false;
        };
        return Interval;
    }());
    exports.Interval = Interval;
});
//# sourceMappingURL=Interval.js.map