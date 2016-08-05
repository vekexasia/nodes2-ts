"use strict";
var S2Point_1 = require("./S2Point");
/**
 * R2Vector represents a vector in the two-dimensional space. It defines the
 * basic geometrical operations for 2D vectors, e.g. cross product, addition,
 * norm, comparison etc.
 *
 */
var R2Vector = (function () {
    function R2Vector(_x, _y) {
        this._x = _x;
        this._y = _y;
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
        return new R2Vector(p1._x + p2._x, p1._y + p2._y);
    };
    R2Vector.mul = function (p, m) {
        return new R2Vector(m * p._x, m * p._y);
    };
    R2Vector.prototype.norm2 = function () {
        return (this.x * this.x) + (this.y * this.y);
    };
    R2Vector.dotProd = function (p1, p2) {
        return (p1.x * p2.x) + (p1.y * p2.y);
    };
    R2Vector.prototype.dotProd = function (that) {
        return R2Vector.dotProd(this, that);
    };
    R2Vector.prototype.crossProd = function (that) {
        return this.x * that.y - this.y * that.x;
    };
    R2Vector.prototype.lessThan = function (vb) {
        if (this.x < vb.x) {
            return true;
        }
        if (vb.x < this.x) {
            return false;
        }
        if (this.y < vb.y) {
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
    R2Vector.singleStTOUV = function (s) {
        if (s >= 0) {
            return (1 / 3.) * ((1 + s) * (1 + s) - 1);
        }
        else {
            return (1 / 3.) * (1 - (1 - s) * (1 - s));
        }
    };
    R2Vector.singleToST = function (x) {
        if (x >= 0) {
            return 0.5 * Math.sqrt(1 + 3 * x);
        }
        else {
            return 1 - 0.5 * Math.sqrt(1 - 3 * x);
        }
    };
    R2Vector.prototype.toPoint = function (face) {
        switch (face) {
            case 0:
                return new S2Point_1.S2Point(1, this.x, this.y);
            case 1:
                return new S2Point_1.S2Point(-this.x, 1, this.y);
            case 2:
                return new S2Point_1.S2Point(-this.x, -this.y, 1);
            case 3:
                return new S2Point_1.S2Point(-1, -this.y, -this.x);
            case 4:
                return new S2Point_1.S2Point(this.y, -1, -this.x);
            default:
                return new S2Point_1.S2Point(this.y, this.x, -1);
        }
    };
    R2Vector.prototype.toSt = function (which) {
        return which == 0 ? R2Vector.singleToST(this.x) : R2Vector.singleToST(this.y);
    };
    R2Vector.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ")";
    };
    return R2Vector;
}());
exports.R2Vector = R2Vector;
