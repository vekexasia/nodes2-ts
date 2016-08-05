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
"use strict";
var S2Vector_1 = require("./S2Vector");
/**
 * An S2Point represents a point on the unit sphere as a 3D vector. Usually
 * points are normalized to be unit length, but some methods do not require
 * this.
 *
 */
var S2Point = (function () {
    function S2Point(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    S2Point.minus = function (p1, p2) {
        return S2Point.sub(p1, p2);
    };
    S2Point.neg = function (p) {
        return new S2Point(-p.x, -p.y, -p.z);
    };
    S2Point.prototype.norm2 = function () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    };
    S2Point.prototype.norm = function () {
        return Math.sqrt(this.norm2());
    };
    S2Point.crossProd = function (p1, p2) {
        return new S2Point(p1.y * p2.z - p1.z * p2.y, p1.z * p2.x - p1.x * p2.z, p1.x * p2.y - p1.y * p2.x);
    };
    S2Point.add = function (p1, p2) {
        return new S2Point(p1.x + p2.x, p1.y + p2.y, p1.z + p2.z);
    };
    S2Point.sub = function (p1, p2) {
        return new S2Point(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
    };
    S2Point.prototype.dotProd = function (that) {
        return this.x * that.x + this.y * that.y + this.z * that.z;
    };
    S2Point.mul = function (p, m) {
        return new S2Point(m * p.x, m * p.y, m * p.z);
    };
    S2Point.div = function (p, m) {
        return new S2Point(p.x / m, p.y / m, p.z / m);
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
        if (temp.x > temp.y) {
            if (temp.x > temp.z) {
                return 0;
            }
            else {
                return 2;
            }
        }
        else {
            if (temp.y > temp.z) {
                return 1;
            }
            else {
                return 2;
            }
        }
    };
    S2Point.fabs = function (p) {
        return new S2Point(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    };
    S2Point.normalize = function (p) {
        var norm = p.norm();
        if (norm != 0) {
            norm = 1.0 / norm;
        }
        return S2Point.mul(p, norm);
    };
    S2Point.prototype.axis = function (axis) {
        return (axis == 0) ? this.x : (axis == 1) ? this.y : this.z;
    };
    /** Return the angle between two vectors in radians */
    S2Point.prototype.angle = function (va) {
        return Math.atan2(S2Point.crossProd(this, va).norm(), this.dotProd(va));
    };
    /**
     * Compare two vectors, return true if all their components are within a
     * difference of margin.
     */
    S2Point.prototype.aequal = function (that, margin) {
        return (Math.abs(this.x - that.x) < margin) &&
            (Math.abs(this.y - that.y) < margin) &&
            (Math.abs(this.z - that.z) < margin);
    };
    S2Point.prototype.equals = function (that) {
        if (!(that instanceof S2Point)) {
            return false;
        }
        return this.x == that.x && this.y == that.y && this.z == that.z;
    };
    S2Point.prototype.lessThan = function (vb) {
        if (this.x < vb.x) {
            return true;
        }
        if (vb.x < this.x) {
            return false;
        }
        if (this.y < vb.y) {
            return true;
        }
        if (vb.y < this.y) {
            return false;
        }
        if (this.z < vb.z) {
            return true;
        }
        return false;
    };
    S2Point.prototype.compareTo = function (other) {
        return (this.lessThan(other) ? -1 : (this.equals(other) ? 0 : 1));
    };
    S2Point.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
    S2Point.prototype.toFace = function () {
        var face = this.largestAbsComponent();
        if (this.axis(face) < 0) {
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
                u = this.y / this.x;
                v = this.z / this.x;
                break;
            case 1:
                u = -this.x / this.y;
                v = this.z / this.y;
                break;
            case 2:
                u = -this.x / this.z;
                v = -this.y / this.z;
                break;
            case 3:
                u = this.z / this.x;
                v = this.y / this.x;
                break;
            case 4:
                u = this.z / this.y;
                v = -this.x / this.y;
                break;
            case 5:
                u = -this.y / this.z;
                v = -this.x / this.z;
                break;
            default:
                throw new Error('Invalid face');
        }
        return new S2Vector_1.R2Vector(u, v);
    };
    return S2Point;
}());
exports.S2Point = S2Point;
