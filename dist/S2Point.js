/*
 * Copyright 2006 Google Inc.
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
        define(["require", "exports", "./R2Vector", 'decimal.js', "./S2"], factory);
    }
})(function (require, exports) {
    "use strict";
    var R2Vector_1 = require("./R2Vector");
    var Decimal = require('decimal.js');
    var S2_1 = require("./S2");
    ///re
    /**
     * An S2Point represents a point on the unit sphere as a 3D vector. Usually
     * points are normalized to be unit length, but some methods do not require
     * this.
     *
     */
    var S2Point = (function () {
        function S2Point(x, y, z) {
            this.x = new Decimal(x);
            this.y = new Decimal(y);
            this.z = new Decimal(z);
            // this.y = typeof(y) === 'number'?new decimal.Decimal(y):y as decimal.Decimal;
            // this.z = typeof(z) === 'number'?new decimal.Decimal(z):z as decimal.Decimal;
        }
        S2Point.minus = function (p1, p2) {
            return S2Point.sub(p1, p2);
        };
        S2Point.neg = function (p) {
            return new S2Point(p.x.negated(), p.y.negated(), p.z.negated());
        };
        S2Point.prototype.norm2 = function () {
            return this.x.pow(2).plus(this.y.pow(2)).plus(this.z.pow(2));
        };
        S2Point.prototype.norm = function () {
            return this.norm2().sqrt();
        };
        S2Point.crossProd = function (p1, p2) {
            return new S2Point(p1.y.times(p2.z).minus(p1.z.times(p2.y)), p1.z.times(p2.x).minus(p1.x.times(p2.z)), 
            // p1.z * p2.x - p1.x * p2.z,
            p1.x.times(p2.y).minus(p1.y.times(p2.x)));
        };
        S2Point.add = function (p1, p2) {
            return new S2Point(p1.x.add(p2.x), p1.y.add(p2.y), p1.z.add(p2.z));
        };
        S2Point.sub = function (p1, p2) {
            return new S2Point(p1.x.sub(p2.x), p1.y.sub(p2.y), p1.z.sub(p2.z));
        };
        S2Point.prototype.dotProd = function (that) {
            return this.x.times(that.x).plus(this.y.times(that.y)).plus(this.z.times(that.z));
        };
        S2Point.mul = function (p, m) {
            var mD = new Decimal(m);
            return new S2Point(mD.times(p.x), mD.times(p.y), mD.times(p.z));
        };
        S2Point.div = function (p, m) {
            return new S2Point(p.x.div(m), p.y.div(m), p.z.div(m));
        };
        /** return a vector orthogonal to this one */
        S2Point.prototype.ortho = function () {
            var k = this.largestAbsComponent();
            var temp;
            if (k == 1) {
                temp = new S2Point(1, 0, 0);
            }
            else if (k == 2) {
                temp = new S2Point(0, 1, 0);
            }
            else {
                temp = new S2Point(0, 0, 1);
            }
            return S2Point.normalize(S2Point.crossProd(this, temp));
        };
        /** Return the index of the largest component fabs */
        S2Point.prototype.largestAbsComponent = function () {
            var temp = S2Point.fabs(this);
            if (temp.x.greaterThan(temp.y)) {
                if (temp.x.greaterThan(temp.z)) {
                    return 0;
                }
                else {
                    return 2;
                }
            }
            else {
                if (temp.y.greaterThan(temp.z)) {
                    return 1;
                }
                else {
                    return 2;
                }
            }
        };
        S2Point.fabs = function (p) {
            return new S2Point(p.x.abs(), p.y.abs(), p.z.abs());
        };
        S2Point.normalize = function (p) {
            var norm = p.norm();
            if (!norm.eq(0)) {
                norm = S2_1.S2.toDecimal(1).dividedBy(norm);
            }
            return S2Point.mul(p, norm);
        };
        S2Point.prototype.axis = function (axis) {
            return (axis == 0) ? this.x : (axis == 1) ? this.y : this.z;
        };
        /** Return the angle between two vectors in radians */
        S2Point.prototype.angle = function (va) {
            return Decimal.atan2(S2Point.crossProd(this, va).norm(), this.dotProd(va));
        };
        /**
         * Compare two vectors, return true if all their components are within a
         * difference of margin.
         */
        S2Point.prototype.aequal = function (that, margin) {
            return this.x.minus(that.x).abs().lessThan(margin) &&
                this.y.minus(that.y).abs().lessThan(margin) &&
                this.z.minus(that.z).abs().lessThan(margin);
        };
        S2Point.prototype.equals = function (that) {
            if (!(that instanceof S2Point)) {
                return false;
            }
            return this.x.eq(that.x) && this.y.eq(that.y) && this.z.eq(that.z);
        };
        S2Point.prototype.lessThan = function (vb) {
            if (this.x.lt(vb.x)) {
                return true;
            }
            if (vb.x.lt(this.x)) {
                return false;
            }
            if (this.y.lt(vb.y)) {
                return true;
            }
            if (vb.y.lt(this.y)) {
                return false;
            }
            if (this.z.lt(vb.z)) {
                return true;
            }
            return false;
        };
        S2Point.prototype.compareTo = function (other) {
            return (this.lessThan(other) ? -1 : (this.equals(other) ? 0 : 1));
        };
        S2Point.prototype.toFace = function () {
            var face = this.largestAbsComponent();
            if (this.axis(face).lt(0)) {
                face += 3;
            }
            return face;
        };
        S2Point.prototype.toR2Vector = function (face) {
            if (face === void 0) { face = this.toFace(); }
            var u;
            var v;
            switch (face) {
                case 0:
                    u = this.y.div(this.x);
                    v = this.z.div(this.x);
                    break;
                case 1:
                    u = this.x.neg().div(this.y);
                    v = this.z.div(this.y);
                    break;
                case 2:
                    u = this.x.neg().div(this.z);
                    v = this.y.neg().div(this.z);
                    break;
                case 3:
                    u = this.z.div(this.x);
                    v = this.y.div(this.x);
                    break;
                case 4:
                    u = this.z.div(this.y);
                    v = this.x.neg().div(this.y);
                    break;
                case 5:
                    u = this.y.neg().div(this.z);
                    v = this.x.neg().div(this.z);
                    break;
                default:
                    throw new Error('Invalid face');
            }
            return new R2Vector_1.R2Vector(u, v);
        };
        S2Point.prototype.toString = function () {
            return "Point(" + this.x.toNumber() + ", " + this.y.toNumber() + ", " + this.z.toNumber() + ")";
        };
        return S2Point;
    }());
    exports.S2Point = S2Point;
});
//# sourceMappingURL=S2Point.js.map