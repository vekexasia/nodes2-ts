(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", 'long', './decimal', "./S2CellId", "./S2Point", "./S2LatLng", "./S2Projections", "./R2Vector", "./MutableInteger", "./S2", "./S2LatLngRect", "./R1Interval", "./S1Interval", "./S2Cap"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Long = require('long');
    var decimal_1 = require('./decimal');
    var S2CellId_1 = require("./S2CellId");
    var S2Point_1 = require("./S2Point");
    var S2LatLng_1 = require("./S2LatLng");
    var S2Projections_1 = require("./S2Projections");
    var R2Vector_1 = require("./R2Vector");
    var MutableInteger_1 = require("./MutableInteger");
    var S2_1 = require("./S2");
    var S2LatLngRect_1 = require("./S2LatLngRect");
    var R1Interval_1 = require("./R1Interval");
    var S1Interval_1 = require("./S1Interval");
    var S2Cap_1 = require("./S2Cap");
    var S2Cell = (function () {
        function S2Cell(cellID) {
            this.cellID = cellID;
            this._uv = [];
            this._uv.push([]);
            this._uv.push([]);
            this.init(cellID);
        }
        Object.defineProperty(S2Cell.prototype, "id", {
            get: function () {
                return this.cellID;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(S2Cell.prototype, "face", {
            get: function () {
                return this._face;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(S2Cell.prototype, "level", {
            get: function () {
                return this._level;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(S2Cell.prototype, "orientation", {
            get: function () {
                return this._orientation;
            },
            enumerable: true,
            configurable: true
        });
        // This is a static method in order to provide named parameters.
        S2Cell.fromFacePosLevel = function (face, pos, level) {
            return new S2Cell(S2CellId_1.S2CellId.fromFacePosLevel(face, new Long(pos), level));
        };
        // Convenience methods.
        S2Cell.fromPoint = function (p) {
            return new S2Cell(S2CellId_1.S2CellId.fromPoint(p));
        };
        S2Cell.fromLatLng = function (ll) {
            return new S2Cell(S2CellId_1.S2CellId.fromPoint(ll.toPoint()));
        };
        S2Cell.prototype.isLeaf = function () {
            return this.level == S2CellId_1.S2CellId.MAX_LEVEL;
        };
        S2Cell.prototype.getVertex = function (k) {
            return S2Point_1.S2Point.normalize(this.getVertexRaw(k));
        };
        /**
         * Return the k-th vertex of the cell (k = 0,1,2,3). Vertices are returned in
         * CCW order. The points returned by GetVertexRaw are not necessarily unit
         * length.
         */
        S2Cell.prototype.getVertexRaw = function (k) {
            // Vertices are returned in the order SW, SE, NE, NW.
            return new R2Vector_1.R2Vector(this._uv[0][(k >> 1) ^ (k & 1)], this._uv[1][k >> 1])
                .toPoint(this.face);
            // return S2Projections.faceUvToXyz(this.face, );
        };
        S2Cell.prototype.getEdge = function (k) {
            return S2Point_1.S2Point.normalize(this.getEdgeRaw(k));
        };
        S2Cell.prototype.getEdgeRaw = function (k) {
            switch (k) {
                case 0:
                    return S2Projections_1.S2Projections.getVNorm(this.face, this._uv[1][0]); // South
                case 1:
                    return S2Projections_1.S2Projections.getUNorm(this.face, this._uv[0][1]); // East
                case 2:
                    return S2Point_1.S2Point.neg(S2Projections_1.S2Projections.getVNorm(this.face, this._uv[1][1])); // North
                default:
                    return S2Point_1.S2Point.neg(S2Projections_1.S2Projections.getUNorm(this.face, this._uv[0][0])); // West
            }
        };
        /**
         * Return the inward-facing normal of the great circle passing through the
         * edge from vertex k to vertex k+1 (mod 4). The normals returned by
         * GetEdgeRaw are not necessarily unit length.
         *
         *  If this is not a leaf cell, set children[0..3] to the four children of
         * this cell (in traversal order) and return true. Otherwise returns false.
         * This method is equivalent to the following:
         *
         *  for (pos=0, id=child_begin(); id != child_end(); id = id.next(), ++pos)
         * children[i] = S2Cell(id);
         *
         * except that it is more than two times faster.
         */
        S2Cell.prototype.subdivide = function () {
            // This function is equivalent to just iterating over the child cell ids
            // and calling the S2Cell constructor, but it is about 2.5 times faster.
            if (this.isLeaf()) {
                return null;
            }
            // Compute the cell midpoint in uv-space.
            // const uvMid = this.getCenterUV();
            var children = new Array(4);
            // Create four children with the appropriate bounds.
            var id = this.cellID.childBegin();
            for (var pos = 0; pos < 4; ++pos, id = id.next()) {
                children[pos] = new S2Cell(id);
            }
            return children;
        };
        /**
         * Return the direction vector corresponding to the center in (s,t)-space of
         * the given cell. This is the point at which the cell is divided into four
         * subcells; it is not necessarily the centroid of the cell in (u,v)-space or
         * (x,y,z)-space. The point returned by GetCenterRaw is not necessarily unit
         * length.
         */
        S2Cell.prototype.getCenter = function () {
            return S2Point_1.S2Point.normalize(this.getCenterRaw());
        };
        S2Cell.prototype.getCenterRaw = function () {
            return this.cellID.toPointRaw();
        };
        /**
         * Return the center of the cell in (u,v) coordinates (see {@code
         * S2Projections}). Note that the center of the cell is defined as the point
         * at which it is recursively subdivided into four children; in general, it is
         * not at the midpoint of the (u,v) rectangle covered by the cell
         */
        S2Cell.prototype.getCenterUV = function () {
            var i = new MutableInteger_1.MutableInteger(0);
            var j = new MutableInteger_1.MutableInteger(0);
            this.cellID.toFaceIJOrientation(i, j, null);
            var cellSize = 1 << (S2CellId_1.S2CellId.MAX_LEVEL - this.level);
            // TODO(dbeaumont): Figure out a better naming of the variables here (and elsewhere).
            var si = (i.val & -cellSize) * 2 + cellSize - S2Cell.MAX_CELL_SIZE;
            var x = R2Vector_1.R2Vector.singleStTOUV(S2_1.S2.toDecimal(1).dividedBy(S2Cell.MAX_CELL_SIZE).times(si));
            // let x = S2Projections.stToUV((1.0 / S2Cell.MAX_CELL_SIZE) * si);
            var sj = (j.val & -cellSize) * 2 + cellSize - S2Cell.MAX_CELL_SIZE;
            var y = R2Vector_1.R2Vector.singleStTOUV(S2_1.S2.toDecimal(1).dividedBy(S2Cell.MAX_CELL_SIZE).times(sj));
            // double y = S2Projections.stToUV((1.0 / S2Cell.MAX_CELL_SIZE) * sj);
            return new R2Vector_1.R2Vector(x, y);
        };
        /**
         * Return the average area of cells at this level. This is accurate to within
         * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
         * compute.
         */
        S2Cell.averageArea = function (level) {
            return S2Projections_1.S2Projections.AVG_AREA.getValue(level);
        };
        /**
         * Return the average area of cells at this level. This is accurate to within
         * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
         * compute.
         */
        S2Cell.prototype.averageArea = function () {
            return S2Projections_1.S2Projections.AVG_AREA.getValue(this.level);
        };
        /**
         * Return the approximate area of this cell. This method is accurate to within
         * 3% percent for all cell sizes and accurate to within 0.1% for cells at
         * level 5 or higher (i.e. 300km square or smaller). It is moderately cheap to
         * compute.
         */
        S2Cell.prototype.approxArea = function () {
            // All cells at the first two levels have the same area.
            if (this.level < 2) {
                return this.averageArea();
            }
            // First, compute the approximate area of the cell when projected
            // perpendicular to its normal. The cross product of its diagonals gives
            // the normal, and the length of the normal is twice the projected area.
            var flatArea = S2Point_1.S2Point.crossProd(S2Point_1.S2Point.sub(this.getVertex(2), this.getVertex(0)), S2Point_1.S2Point.sub(this.getVertex(3), this.getVertex(1))).norm().times(0.5);
            // double flatArea = 0.5 * S2Point.crossProd(
            //         S2Point.sub(getVertex(2), getVertex(0)), S2Point.sub(getVertex(3), getVertex(1))).norm();
            // Now, compensate for the curvature of the cell surface by pretending
            // that the cell is shaped like a spherical cap. The ratio of the
            // area of a spherical cap to the area of its projected disc turns out
            // to be 2 / (1 + sqrt(1 - r*r)) where "r" is the radius of the disc.
            // For example, when r=0 the ratio is 1, and when r=1 the ratio is 2.
            // Here we set Pi*r*r == flat_area to find the equivalent disc.
            return flatArea
                .times(2)
                .dividedBy(decimal_1.Decimal.min(flatArea.times(S2_1.S2.M_1_PI), 1)
                .neg()
                .plus(1)
                .sqrt()
                .plus(1)).toNumber();
        };
        //
        // /**
        //  * Return the area of this cell as accurately as possible. This method is more
        //  * expensive but it is accurate to 6 digits of precision even for leaf cells
        //  * (whose area is approximately 1e-18).
        //  */
        S2Cell.prototype.exactArea = function () {
            var v0 = this.getVertex(0);
            var v1 = this.getVertex(1);
            var v2 = this.getVertex(2);
            var v3 = this.getVertex(3);
            return S2_1.S2.area(v0, v1, v2).plus(S2_1.S2.area(v0, v2, v3));
        };
        // //////////////////////////////////////////////////////////////////////
        // S2Region interface (see {@code S2Region} for details):
        S2Cell.prototype.getCapBound = function () {
            // Use the cell center in (u,v)-space as the cap axis. This vector is
            // very close to GetCenter() and faster to compute. Neither one of these
            // vectors yields the bounding cap with minimal surface area, but they
            // are both pretty close.
            //
            // It's possible to show that the two vertices that are furthest from
            // the (u,v)-origin never determine the maximum cap size (this is a
            // possible future optimization).
            var u = this._uv[0][0].plus(this._uv[0][1]).times(0.5);
            var v = this._uv[1][0].plus(this._uv[1][1]).times(0.5);
            var cap = new S2Cap_1.S2Cap(S2Point_1.S2Point.normalize(S2Projections_1.S2Projections.faceUvToXyz(this.face, u, v)), 0);
            for (var k = 0; k < 4; ++k) {
                cap = cap.addPoint(this.getVertex(k));
            }
            return cap;
        };
        // 35.26 degrees
        S2Cell.prototype.getRectBound = function () {
            if (this.level > 0) {
                // Except for cells at level 0, the latitude and longitude extremes are
                // attained at the vertices. Furthermore, the latitude range is
                // determined by one pair of diagonally opposite vertices and the
                // longitude range is determined by the other pair.
                //
                // We first determine which corner (i,j) of the cell has the largest
                // absolute latitude. To maximize latitude, we want to find the point in
                // the cell that has the largest absolute z-coordinate and the smallest
                // absolute x- and y-coordinates. To do this we look at each coordinate
                // (u and v), and determine whether we want to minimize or maximize that
                // coordinate based on the axis direction and the cell's (u,v) quadrant.
                var u = this._uv[0][0].plus(this._uv[0][1]);
                var v = this._uv[1][0].plus(this._uv[1][1]);
                var i = S2Projections_1.S2Projections.getUAxis(this.face).z.eq(0) ? (u.lt(0) ? 1 : 0) : (u.gt(0) ? 1 : 0);
                var j = S2Projections_1.S2Projections.getVAxis(this.face).z.eq(0) ? (v.lt(0) ? 1 : 0) : (v.gt(0) ? 1 : 0);
                var lat = R1Interval_1.R1Interval.fromPointPair(this.getLatitude(i, j), this.getLatitude(1 - i, 1 - j));
                lat = lat.expanded(S2Cell.MAX_ERROR).intersection(S2LatLngRect_1.S2LatLngRect.fullLat());
                if (lat.lo.eq(-S2_1.S2.M_PI_2) || lat.hi.eq(S2_1.S2.M_PI_2)) {
                    return new S2LatLngRect_1.S2LatLngRect(lat, S1Interval_1.S1Interval.full());
                }
                var lng = S1Interval_1.S1Interval.fromPointPair(this.getLongitude(i, 1 - j), this.getLongitude(1 - i, j));
                return new S2LatLngRect_1.S2LatLngRect(lat, lng.expanded(S2Cell.MAX_ERROR));
            }
            // The face centers are the +X, +Y, +Z, -X, -Y, -Z axes in that order.
            // assert (S2Projections.getNorm(face).get(face % 3) == ((face < 3) ? 1 : -1));
            switch (this.face) {
                case 0:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(-S2_1.S2.M_PI_4, S2_1.S2.M_PI_4), new S1Interval_1.S1Interval(-S2_1.S2.M_PI_4, S2_1.S2.M_PI_4));
                case 1:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(-S2_1.S2.M_PI_4, S2_1.S2.M_PI_4), new S1Interval_1.S1Interval(S2_1.S2.M_PI_4, 3 * S2_1.S2.M_PI_4));
                case 2:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(S2Cell.POLE_MIN_LAT, S2_1.S2.M_PI_2), new S1Interval_1.S1Interval(-S2_1.S2.M_PI, S2_1.S2.M_PI));
                case 3:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(-S2_1.S2.M_PI_4, S2_1.S2.M_PI_4), new S1Interval_1.S1Interval(3 * S2_1.S2.M_PI_4, -3 * S2_1.S2.M_PI_4));
                case 4:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(-S2_1.S2.M_PI_4, S2_1.S2.M_PI_4), new S1Interval_1.S1Interval(-3 * S2_1.S2.M_PI_4, -S2_1.S2.M_PI_4));
                default:
                    return new S2LatLngRect_1.S2LatLngRect(new R1Interval_1.R1Interval(-S2_1.S2.M_PI_2, -S2Cell.POLE_MIN_LAT), new S1Interval_1.S1Interval(-S2_1.S2.M_PI, S2_1.S2.M_PI));
            }
        };
        S2Cell.prototype.mayIntersect = function (cell) {
            return this.cellID.intersects(cell.cellID);
        };
        S2Cell.prototype.contains = function (p) {
            // We can't just call XYZtoFaceUV, because for points that lie on the
            // boundary between two faces (i.e. u or v is +1/-1) we need to return
            // true for both adjacent cells.
            var uvPoint = p.toR2Vector(this.face);
            // S2Projections.faceXyzToUv(this.face, p);
            if (uvPoint == null) {
                return false;
            }
            return (uvPoint.x.gte(this._uv[0][0]) && uvPoint.x.lte(this._uv[0][1])
                && uvPoint.y.gte(this._uv[1][0]) && uvPoint.y.lte(this._uv[1][1]));
        };
        // The point 'p' does not need to be normalized.
        S2Cell.prototype.containsC = function (cell) {
            return this.cellID.contains(cell.cellID);
        };
        S2Cell.prototype.init = function (id) {
            this.cellID = id;
            var ij = [];
            var mOrientation = new MutableInteger_1.MutableInteger(0);
            for (var d = 0; d < 2; ++d) {
                ij[d] = new MutableInteger_1.MutableInteger(0);
            }
            this._face = id.toFaceIJOrientation(ij[0], ij[1], mOrientation);
            this._orientation = mOrientation.val; // Compress int to a byte.
            this._level = id.level();
            var cellSize = 1 << (S2CellId_1.S2CellId.MAX_LEVEL - this.level);
            for (var d = 0; d < 2; ++d) {
                // Compute the cell bounds in scaled (i,j) coordinates.
                var sijLo = (ij[d].val & -cellSize) * 2 - S2Cell.MAX_CELL_SIZE;
                var sijHi = sijLo + cellSize * 2;
                var s = S2_1.S2.toDecimal(1).dividedBy(S2Cell.MAX_CELL_SIZE);
                this._uv[d][0] = R2Vector_1.R2Vector.singleStTOUV(s.times(sijLo));
                //S2Projections.stToUV((1.0 / S2Cell.MAX_CELL_SIZE) * sijLo);
                this._uv[d][1] = R2Vector_1.R2Vector.singleStTOUV(s.times(sijHi));
            }
        };
        // Internal method that does the actual work in the constructors.
        S2Cell.prototype.getLatitude = function (i, j) {
            var p = S2Projections_1.S2Projections.faceUvToXyz(this.face, this._uv[0][i], this._uv[1][j]);
            return decimal_1.Decimal.atan2(p.z, p.x.pow(2).plus(p.y.pow(2))
                .sqrt());
            // return Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y));
        };
        S2Cell.prototype.getLongitude = function (i, j) {
            var p = S2Projections_1.S2Projections.faceUvToXyz(this.face, this._uv[0][i], this._uv[1][j]);
            return decimal_1.Decimal.atan2(p.y, p.x);
            // Math.atan2(p.y, p.x);
        };
        // Return the latitude or longitude of the cell vertex given by (i,j),
        // where "i" and "j" are either 0 or 1.
        S2Cell.prototype.toString = function () {
            return "[" + this._face + ", " + this._level + ", " + this._orientation + ", " + this.cellID.toToken() + "]";
        };
        S2Cell.prototype.toGEOJSON = function () {
            var coords = [this.getVertex(0), this.getVertex(1), this.getVertex(2), this.getVertex(3), this.getVertex(0)]
                .map(function (v) { return S2LatLng_1.S2LatLng.fromPoint(v); })
                .map(function (v) { return ([v.lngDegrees.toNumber(), v.latDegrees.toNumber()]); });
            // const rectJSON = this.getRectBound().toGEOJSON();
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coords]
                },
                properties: {},
                title: "Cell: " + this.id.toToken() + " lvl: " + this.level
            };
            // rectJSON.title = `Cell: ${this.id.toToken()}`;
            // return rectJSON;
        };
        S2Cell.MAX_CELL_SIZE = 1 << S2CellId_1.S2CellId.MAX_LEVEL;
        // We grow the bounds slightly to make sure that the bounding rectangle
        // also contains the normalized versions of the vertices. Note that the
        // maximum result magnitude is Pi, with a floating-point exponent of 1.
        // Therefore adding or subtracting 2**-51 will always change the result.
        S2Cell.MAX_ERROR = S2_1.S2.toDecimal(1.0).dividedBy(S2_1.S2.toDecimal(new Long(1).shiftLeft(51).toString()));
        // The 4 cells around the equator extend to +/-45 degrees latitude at the
        // midpoints of their top and bottom edges. The two cells covering the
        // poles extend down to +/-35.26 degrees at their vertices.
        // adding kMaxError (as opposed to the C version) because of asin and atan2
        // roundoff errors
        S2Cell.POLE_MIN_LAT = decimal_1.Decimal.asin(S2_1.S2.toDecimal(1.0).dividedBy(3).sqrt()).minus(S2Cell.MAX_ERROR);
        return S2Cell;
    }());
    exports.S2Cell = S2Cell;
});
//# sourceMappingURL=S2Cell.js.map