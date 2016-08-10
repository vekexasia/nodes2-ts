(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2Point", 'decimal.js', "./S2"], factory);
    }
})(function (require, exports) {
    "use strict";
    var S2Point_1 = require("./S2Point");
    var Decimal = require('decimal.js');
    var S2_1 = require("./S2");
    /**
     * R2Vector represents a vector in the two-dimensional space. It defines the
     * basic geometrical operations for 2D vectors, e.g. cross product, addition,
     * norm, comparison etc.
     *
     */
    var R2Vector = (function () {
        function R2Vector(_x, _y) {
            this._x = new Decimal(_x);
            this._y = new Decimal(_y);
            // this._x = new Decimal(_x) as decimal.Decimal;
            // this._y = new Decimal(_y) as decimal.Decimal;
        }
        Object.defineProperty(R2Vector.prototype, "x", {
            get: function () {
                return this._x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(R2Vector.prototype, "y", {
            get: function () {
                return this._y;
            },
            enumerable: true,
            configurable: true
        });
        R2Vector.prototype.get = function (index) {
            if (index > 1) {
                throw new Error("Index out fo bounds error " + index);
            }
            return index == 0 ? this._x : this._y;
        };
        R2Vector.fromPointFace = function (p, face) {
            return p.toR2Vector(face);
        };
        R2Vector.add = function (p1, p2) {
            return new R2Vector(p1._x.plus(p2._x), p1._y.plus(p2._y));
        };
        R2Vector.mul = function (p, _m) {
            var m = new Decimal(_m);
            return new R2Vector(m.times(p._x), m.times(p._y));
        };
        R2Vector.prototype.norm2 = function () {
            return this.x.pow(2).plus(this.y.pow(2));
        };
        R2Vector.dotProd = function (p1, p2) {
            return p1.x.times(p2.x).plus(p1.y.times(p2.y));
        };
        R2Vector.prototype.dotProd = function (that) {
            return R2Vector.dotProd(this, that);
        };
        R2Vector.prototype.crossProd = function (that) {
            return this.x.times(that.y).minus(this.y.times(that.x));
        };
        R2Vector.prototype.lessThan = function (vb) {
            if (this.x.lt(vb.x)) {
                return true;
            }
            if (vb.x.lt(this.x)) {
                return false;
            }
            if (this.y.lt(vb.y)) {
                return true;
            }
            return false;
        };
        //
        // @Override
        // public boolean equals(Object that) {
        //   if (!(that instanceof R2Vector)) {
        //     return false;
        //   }
        //   R2Vector thatPoint = (R2Vector) that;
        //   return this.x == thatPoint.x && this.y == thatPoint.y;
        // }
        // /**
        //  * Calcualates hashcode based on stored coordinates. Since we want +0.0 and
        //  * -0.0 to be treated the same, we ignore the sign of the coordinates.
        //  */
        // @Override
        // public int hashCode() {
        //   long value = 17;
        //   value += 37 * value + Double.doubleToLongBits(Math.abs(x));
        //   value += 37 * value + Double.doubleToLongBits(Math.abs(y));
        //   return (int) (value ^ (value >>> 32));
        // }
        //
        R2Vector.fromSTVector = function (stVector) {
            return new R2Vector(R2Vector.singleStTOUV(stVector.x), R2Vector.singleStTOUV(stVector.y));
        };
        // from S2Projections.stToUV (QUADRATIC)
        R2Vector.singleStTOUV = function (_s) {
            var s = S2_1.S2.toDecimal(_s);
            if (s.gte(0)) {
                return S2_1.S2.toDecimal(1)
                    .dividedBy(3)
                    .times(s.plus(1).pow(2).minus(1));
            }
            else {
                return S2_1.S2.toDecimal(1)
                    .dividedBy(3)
                    .times(S2_1.S2.toDecimal(1)
                    .minus(S2_1.S2.toDecimal(1).minus(s).pow(2)));
            }
        };
        R2Vector.singleUVToST = function (_x) {
            var x = S2_1.S2.toDecimal(_x);
            if (x.gte(0)) {
                return Decimal.sqrt(x.times(3).plus(1)).minus(1);
            }
            else {
                return S2_1.S2.toDecimal(1)
                    .minus(Decimal.sqrt(S2_1.S2.toDecimal(1).minus(x.times(3))));
            }
        };
        /**
         * To be used only if this vector is representing uv.
         * @param face
         * @returns {S2Point}
         */
        R2Vector.prototype.toPoint = function (face) {
            switch (face) {
                case 0:
                    return new S2Point_1.S2Point(1, this.x, this.y);
                case 1:
                    return new S2Point_1.S2Point(this.x.neg(), 1, this.y);
                case 2:
                    return new S2Point_1.S2Point(this.x.neg(), this.y.neg(), 1);
                case 3:
                    return new S2Point_1.S2Point(-1, this.y.neg(), this.x.neg());
                case 4:
                    return new S2Point_1.S2Point(this.y, -1, this.x.neg());
                default:
                    return new S2Point_1.S2Point(this.y, this.x, -1);
            }
        };
        R2Vector.prototype.toSt = function (which) {
            return which == 0 ? R2Vector.singleUVToST(this.x) : R2Vector.singleUVToST(this.y);
        };
        R2Vector.prototype.toString = function () {
            return "(" + this.x.toString() + ", " + this.y.toString() + ")";
        };
        return R2Vector;
    }());
    exports.R2Vector = R2Vector;
});
//# sourceMappingURL=R2Vector.js.map