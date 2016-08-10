(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S1Interval", "./R1Interval", "./S2LatLng", "./S2", "./S2Point", "./S1Angle", "./S2EdgeUtil", "./S2Cap", 'decimal.js'], factory);
    }
})(function (require, exports) {
    "use strict";
    var S1Interval_1 = require("./S1Interval");
    var R1Interval_1 = require("./R1Interval");
    var S2LatLng_1 = require("./S2LatLng");
    var S2_1 = require("./S2");
    var S2Point_1 = require("./S2Point");
    var S1Angle_1 = require("./S1Angle");
    var S2EdgeUtil_1 = require("./S2EdgeUtil");
    var S2Cap_1 = require("./S2Cap");
    var Decimal = require('decimal.js');
    var S2LatLngRect = (function () {
        function S2LatLngRect(lat, lng) {
            this.lat = lat;
            this.lng = lng;
        }
        S2LatLngRect.fromLatLng = function (lo, hi) {
            return new S2LatLngRect(new R1Interval_1.R1Interval(lo.latRadians, hi.latRadians), new S1Interval_1.S1Interval(lo.lngRadians, hi.lngRadians));
        };
        /** The canonical empty rectangle */
        S2LatLngRect.empty = function () {
            return new S2LatLngRect(R1Interval_1.R1Interval.empty(), S1Interval_1.S1Interval.empty());
        };
        /** The canonical full rectangle. */
        S2LatLngRect.full = function () {
            return new S2LatLngRect(S2LatLngRect.fullLat(), S1Interval_1.S1Interval.full());
        };
        /** The full allowable range of latitudes. */
        S2LatLngRect.fullLat = function () {
            return new R1Interval_1.R1Interval(-S2_1.S2.M_PI_2, S2_1.S2.M_PI_2);
        };
        /**
         * Construct a rectangle from a center point (in lat-lng space) and size in
         * each dimension. If size.lng is greater than 360 degrees it is clamped,
         * and latitudes greater than +/- 90 degrees are also clamped. So for example,
         * FromCenterSize((80,170),(20,20)) -> (lo=(60,150),hi=(90,-170)).
         */
        S2LatLngRect.fromCenterSize = function (center, size) {
            return S2LatLngRect.fromPoint(center).expanded(size.mul(0.5));
        };
        /** Convenience method to construct a rectangle containing a single point. */
        S2LatLngRect.fromPoint = function (p) {
            // assert (p.isValid());
            return S2LatLngRect.fromLatLng(p, p);
        };
        /**
         * Convenience method to construct the minimal bounding rectangle containing
         * the two given points. This is equivalent to starting with an empty
         * rectangle and calling AddPoint() twice. Note that it is different than the
         * S2LatLngRect(lo, hi) constructor, where the first point is always used as
         * the lower-left corner of the resulting rectangle.
         */
        S2LatLngRect.fromPointPair = function (p1, p2) {
            // assert (p1.isValid() && p2.isValid());
            return new S2LatLngRect(R1Interval_1.R1Interval.fromPointPair(p1.latRadians, p2
                .latRadians), S1Interval_1.S1Interval.fromPointPair(p1.lngRadians, p2.lngRadians));
        };
        /**
         * Return a latitude-longitude rectangle that contains the edge from "a" to
         * "b". Both points must be unit-length. Note that the bounding rectangle of
         * an edge can be larger than the bounding rectangle of its endpoints.
         */
        S2LatLngRect.fromEdge = function (a, b) {
            // assert (S2.isUnitLength(a) && S2.isUnitLength(b));
            var r = S2LatLngRect.fromPointPair(S2LatLng_1.S2LatLng.fromPoint(a), S2LatLng_1.S2LatLng.fromPoint(b));
            // Check whether the min/max latitude occurs in the edge interior.
            // We find the normal to the plane containing AB, and then a vector "dir" in
            // this plane that also passes through the equator. We use RobustCrossProd
            // to ensure that the edge normal is accurate even when the two points are
            // very close together.
            var ab = S2_1.S2.robustCrossProd(a, b);
            var dir = S2Point_1.S2Point.crossProd(ab, new S2Point_1.S2Point(0, 0, 1));
            var da = dir.dotProd(a);
            var db = dir.dotProd(b);
            if (da.times(db).gte(0)) {
                // Minimum and maximum latitude are attained at the vertices.
                return r;
            }
            // Minimum/maximum latitude occurs in the edge interior. This affects the
            // latitude bounds but not the longitude bounds.
            var absLat = Decimal.acos(ab.z.dividedBy(ab.norm()).abs());
            if (da.lt(0)) {
                return new S2LatLngRect(new R1Interval_1.R1Interval(r.lat.lo, absLat), r.lng);
            }
            else {
                return new S2LatLngRect(new R1Interval_1.R1Interval(-absLat, r.lat.hi), r.lng);
            }
        };
        /**
         * Return true if the rectangle is valid, which essentially just means that
         * the latitude bounds do not exceed Pi/2 in absolute value and the longitude
         * bounds do not exceed Pi in absolute value.
         *
         */
        S2LatLngRect.prototype.isValid = function () {
            // The lat/lng ranges must either be both empty or both non-empty.
            return (this.lat.lo.abs().lte(S2_1.S2.M_PI_2) && this.lat.hi.abs().lte(S2_1.S2.M_PI_2)
                && this.lng.isValid() && this.lat.isEmpty() == this.lng.isEmpty());
        };
        S2LatLngRect.prototype.lo = function () {
            return new S2LatLng_1.S2LatLng(this.lat.lo, this.lng.lo);
        };
        S2LatLngRect.prototype.hi = function () {
            return new S2LatLng_1.S2LatLng(this.lat.hi, this.lng.hi);
        };
        /**
         * Return true if the rectangle is empty, i.e. it contains no points at all.
         */
        S2LatLngRect.prototype.isEmpty = function () {
            return this.lat.isEmpty();
        };
        // Return true if the rectangle is full, i.e. it contains all points.
        S2LatLngRect.prototype.isFull = function () {
            // console.log(this.lat.toString());
            // console.log(S2LatLngRect.fullLat().toString());
            return this.lat.equals(S2LatLngRect.fullLat()) && this.lng.isFull();
        };
        /**
         * Return true if lng_.lo() > lng_.hi(), i.e. the rectangle crosses the 180
         * degree latitude line.
         */
        S2LatLngRect.prototype.isInverted = function () {
            return this.lng.isInverted();
        };
        /** Return the k-th vertex of the rectangle (k = 0,1,2,3) in CCW order. */
        S2LatLngRect.prototype.getVertex = function (k) {
            // Return the points in CCW order (SW, SE, NE, NW).
            switch (k) {
                case 0:
                    return this.lo();
                case 1:
                    return new S2LatLng_1.S2LatLng(this.lat.lo, this.lng.hi);
                case 2:
                    return this.hi();
                case 3:
                    return new S2LatLng_1.S2LatLng(this.lat.hi, this.lng.lo);
                default:
                    throw new Error("Invalid vertex index.");
            }
        };
        /**
         * Return the center of the rectangle in latitude-longitude space (in general
         * this is not the center of the region on the sphere).
         */
        S2LatLngRect.prototype.getCenter = function () {
            return new S2LatLng_1.S2LatLng(this.lat.getCenter(), this.lng.getCenter());
        };
        /**
         * Return the minimum distance (measured along the surface of the sphere)
         * from a given point to the rectangle (both its boundary and its interior).
         * The latLng must be valid.
         */
        S2LatLngRect.prototype.getDistanceLL = function (p) {
            // The algorithm here is the same as in getDistance(S2LagLngRect), only
            // with simplified calculations.
            var a = this;
            if (a.isEmpty()) {
                throw new Error();
            }
            if (!p.isValid()) {
                throw new Error('point is not valid');
            }
            if (a.lng.contains(p.lngRadians)) {
                return new S1Angle_1.S1Angle(Decimal.max(0.0, Decimal.max(p.latRadians.minus(a.lat.hi), a.lat.lo.minus(p.latRadians))));
            }
            var interval = new S1Interval_1.S1Interval(a.lng.hi, a.lng.complement().getCenter());
            var aLng = a.lng.lo;
            if (interval.contains(p.lngRadians)) {
                aLng = a.lng.hi;
            }
            var lo = new S2LatLng_1.S2LatLng(a.lat.lo, aLng).toPoint();
            var hi = new S2LatLng_1.S2LatLng(a.lat.hi, aLng).toPoint();
            var loCrossHi = new S2LatLng_1.S2LatLng(0, aLng.minus(S2_1.S2.M_PI_2)).normalized().toPoint();
            return S2EdgeUtil_1.S2EdgeUtil.getDistance(p.toPoint(), lo, hi, loCrossHi);
        };
        /**
         * Return the minimum distance (measured along the surface of the sphere) to
         * the given S2LatLngRect. Both S2LatLngRects must be non-empty.
         */
        S2LatLngRect.prototype.getDistanceLLR = function (other) {
            var a = this;
            var b = other;
            if (a.isEmpty()) {
                throw new Error();
            }
            if (b.isEmpty()) {
                throw new Error();
            }
            // First, handle the trivial cases where the longitude intervals overlap.
            if (a.lng.intersects(b.lng)) {
                if (a.lat.intersects(b.lat)) {
                    return new S1Angle_1.S1Angle(0); // Intersection between a and b.
                }
                // We found an overlap in the longitude interval, but not in the latitude
                // interval. This means the shortest path travels along some line of
                // longitude connecting the high-latitude of the lower rect with the
                // low-latitude of the higher rect.
                var lo = void 0, hi = void 0;
                if (a.lat.lo.gt(b.lat.hi)) {
                    lo = b.lat.hi;
                    hi = a.lat.lo;
                }
                else {
                    lo = a.lat.hi;
                    hi = b.lat.lo;
                }
                return new S1Angle_1.S1Angle(hi.radians().minus(lo.radians()));
            }
            // The longitude intervals don't overlap. In this case, the closest points
            // occur somewhere on the pair of longitudinal edges which are nearest in
            // longitude-space.
            var aLng, bLng;
            var loHi = S1Interval_1.S1Interval.fromPointPair(a.lng.lo, b.lng.hi);
            var hiLo = S1Interval_1.S1Interval.fromPointPair(a.lng.hi, b.lng.lo);
            if (loHi.getLength().lt(hiLo.getLength())) {
                aLng = a.lng.lo;
                bLng = b.lng.hi;
            }
            else {
                aLng = a.lng.hi;
                bLng = b.lng.lo;
            }
            // The shortest distance between the two longitudinal segments will include
            // at least one segment endpoint. We could probably narrow this down further
            // to a single point-edge distance by comparing the relative latitudes of the
            // endpoints, but for the sake of clarity, we'll do all four point-edge
            // distance tests.
            var aLo = new S2LatLng_1.S2LatLng(a.lat.lo, aLng).toPoint();
            var aHi = new S2LatLng_1.S2LatLng(a.lat.hi, aLng).toPoint();
            var aLoCrossHi = new S2LatLng_1.S2LatLng(0, aLng.radians().minus(S2_1.S2.M_PI_2)).normalized().toPoint();
            var bLo = new S2LatLng_1.S2LatLng(b.lat.lo, bLng).toPoint();
            var bHi = new S2LatLng_1.S2LatLng(b.lat.hi, bLng).toPoint();
            var bLoCrossHi = new S2LatLng_1.S2LatLng(0, bLng.radians().minus(S2_1.S2.M_PI_2)).normalized().toPoint();
            return S1Angle_1.S1Angle.min(S2EdgeUtil_1.S2EdgeUtil.getDistance(aLo, bLo, bHi, bLoCrossHi), S1Angle_1.S1Angle.min(S2EdgeUtil_1.S2EdgeUtil.getDistance(aHi, bLo, bHi, bLoCrossHi), S1Angle_1.S1Angle.min(S2EdgeUtil_1.S2EdgeUtil.getDistance(bLo, aLo, aHi, aLoCrossHi), S2EdgeUtil_1.S2EdgeUtil.getDistance(bHi, aLo, aHi, aLoCrossHi))));
        };
        /**
         * Return the width and height of this rectangle in latitude-longitude space.
         * Empty rectangles have a negative width and height.
         */
        S2LatLngRect.prototype.getSize = function () {
            return new S2LatLng_1.S2LatLng(this.lat.getLength(), this.lng.getLength());
        };
        /**
         * More efficient version of Contains() that accepts a S2LatLng rather than an
         * S2Point.
         */
        S2LatLngRect.prototype.containsLL = function (ll) {
            // assert (ll.isValid());
            return (this.lat.contains(ll.latRadians) && this.lng.contains(ll.lngRadians));
        };
        /**
         * Return true if and only if the given point is contained in the interior of
         * the region (i.e. the region excluding its boundary). The point 'p' does not
         * need to be normalized.
         */
        S2LatLngRect.prototype.interiorContainsP = function (p) {
            return this.interiorContainsLL(S2LatLng_1.S2LatLng.fromPoint(p));
        };
        /**
         * More efficient version of InteriorContains() that accepts a S2LatLng rather
         * than an S2Point.
         */
        S2LatLngRect.prototype.interiorContainsLL = function (ll) {
            // assert (ll.isValid());
            return (this.lat.interiorContains(ll.latRadians) && this.lng
                .interiorContains(ll.lngRadians));
        };
        /**
         * Return true if and only if the rectangle contains the given other
         * rectangle.
         */
        S2LatLngRect.prototype.containsLLR = function (other) {
            return this.lat.containsI(other.lat) && this.lng.containsI(other.lng);
        };
        /**
         * Return true if and only if the interior of this rectangle contains all
         * points of the given other rectangle (including its boundary).
         */
        S2LatLngRect.prototype.interiorContainsLLR = function (other) {
            return (this.lat.interiorContainsI(other.lat) && this.lng
                .interiorContainsI(other.lng));
        };
        /** Return true if this rectangle and the given other rectangle have any
         points in common. */
        S2LatLngRect.prototype.intersectsLLR = function (other) {
            return this.lat.intersects(other.lat) && this.lng.intersects(other.lng);
        };
        /**
         * Returns true if this rectangle intersects the given cell. (This is an exact
         * test and may be fairly expensive, see also MayIntersect below.)
         */
        S2LatLngRect.prototype.intersects = function (cell) {
            // First we eliminate the cases where one region completely contains the
            // other. Once these are disposed of, then the regions will intersect
            // if and only if their boundaries intersect.
            if (this.isEmpty()) {
                return false;
            }
            if (this.containsP(cell.getCenter())) {
                return true;
            }
            if (cell.contains(this.getCenter().toPoint())) {
                return true;
            }
            // Quick rejection test (not required for correctness).
            if (!this.intersectsLLR(cell.getRectBound())) {
                return false;
            }
            // Now check whether the boundaries intersect. Unfortunately, a
            // latitude-longitude rectangle does not have straight edges -- two edges
            // are curved, and at least one of them is concave.
            // Precompute the cell vertices as points and latitude-longitudes.
            var cellV = [];
            var cellLl = new S2LatLng_1.S2LatLng[4];
            for (var i = 0; i < 4; ++i) {
                cellV[i] = cell.getVertex(i); // Must be normalized.
                cellLl[i] = S2LatLng_1.S2LatLng.fromPoint(cellV[i]);
                if (this.containsLL(cellLl[i])) {
                    return true; // Quick acceptance test.
                }
            }
            for (var i = 0; i < 4; ++i) {
                var edgeLng = S1Interval_1.S1Interval.fromPointPair(cellLl[i].lngRadians, cellLl[(i + 1) & 3].lngRadians);
                if (!this.lng.intersects(edgeLng)) {
                    continue;
                }
                var a = cellV[i];
                var b = cellV[(i + 1) & 3];
                if (edgeLng.contains(this.lng.lo)) {
                    if (S2LatLngRect.intersectsLngEdge(a, b, this.lat, this.lng.lo)) {
                        return true;
                    }
                }
                if (edgeLng.contains(this.lng.hi)) {
                    if (S2LatLngRect.intersectsLngEdge(a, b, this.lat, this.lng.hi)) {
                        return true;
                    }
                }
                if (S2LatLngRect.intersectsLatEdge(a, b, this.lat.lo, this.lng)) {
                    return true;
                }
                if (S2LatLngRect.intersectsLatEdge(a, b, this.lat.hi, this.lng)) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Return true if and only if the interior of this rectangle intersects any
         * point (including the boundary) of the given other rectangle.
         */
        S2LatLngRect.prototype.interiorIntersects = function (other) {
            return (this.lat.interiorIntersects(other.lat) && this.lng
                .interiorIntersects(other.lng));
        };
        S2LatLngRect.prototype.addPoint = function (p) {
            return this.addPointLL(S2LatLng_1.S2LatLng.fromPoint(p));
        };
        // Increase the size of the bounding rectangle to include the given point.
        // The rectangle is expanded by the minimum amount possible.
        S2LatLngRect.prototype.addPointLL = function (ll) {
            var newLat = this.lat.addPoint(ll.latRadians);
            var newLng = this.lng.addPoint(ll.lngRadians);
            return new S2LatLngRect(newLat, newLng);
        };
        /**
         * Return a rectangle that contains all points whose latitude distance from
         * this rectangle is at most margin.lat, and whose longitude distance from
         * this rectangle is at most margin.lng. In particular, latitudes are
         * clamped while longitudes are wrapped. Note that any expansion of an empty
         * interval remains empty, and both components of the given margin must be
         * non-negative.
         *
         * NOTE: If you are trying to grow a rectangle by a certain *distance* on the
         * sphere (e.g. 5km), use the ConvolveWithCap() method instead.
         */
        S2LatLngRect.prototype.expanded = function (margin) {
            // assert (margin.latRadians >= 0 && margin.lngRadians >= 0);
            if (this.isEmpty()) {
                return this;
            }
            return new S2LatLngRect(this.lat
                .expanded(margin.latRadians)
                .intersection(S2LatLngRect.fullLat()), this.lng.expanded(margin.lngRadians));
        };
        /**
         * Return the smallest rectangle containing the union of this rectangle and
         * the given rectangle.
         */
        S2LatLngRect.prototype.union = function (other) {
            return new S2LatLngRect(this.lat.union(other.lat), this.lng.union(other.lng));
        };
        /**
         * Return the smallest rectangle containing the intersection of this rectangle
         * and the given rectangle. Note that the region of intersection may consist
         * of two disjoint rectangles, in which case a single rectangle spanning both
         * of them is returned.
         */
        S2LatLngRect.prototype.intersection = function (other) {
            var intersectLat = this.lat.intersection(other.lat);
            var intersectLng = this.lng.intersection(other.lng);
            if (intersectLat.isEmpty() || intersectLng.isEmpty()) {
                // The lat/lng ranges must either be both empty or both non-empty.
                return S2LatLngRect.empty();
            }
            return new S2LatLngRect(intersectLat, intersectLng);
        };
        //
        // /**
        //  * Return a rectangle that contains the convolution of this rectangle with a
        //  * cap of the given angle. This expands the rectangle by a fixed distance (as
        //  * opposed to growing the rectangle in latitude-longitude space). The returned
        //  * rectangle includes all points whose minimum distance to the original
        //  * rectangle is at most the given angle.
        //  */
        // public S2LatLngRect convolveWithCap(/*S1Angle*/ angle) {
        //   // The most straightforward approach is to build a cap centered on each
        //   // vertex and take the union of all the bounding rectangles (including the
        //   // original rectangle; this is necessary for very large rectangles).
        //
        //   // Optimization: convert the angle to a height exactly once.
        //   S2Cap cap = S2Cap.fromAxisAngle(new S2Point(1, 0, 0), angle);
        //
        //   S2LatLngRect r = this;
        //   for (int k = 0; k < 4; ++k) {
        //     S2Cap vertexCap = S2Cap.fromAxisHeight(getVertex(k).toPoint(), cap
        //         .height());
        //     r = r.union(vertexCap.getRectBound());
        //   }
        //   return r;
        // }
        /** Return the surface area of this rectangle on the unit sphere. */
        S2LatLngRect.prototype.area = function () {
            if (this.isEmpty()) {
                return S2_1.S2.toDecimal(0);
            }
            // This is the size difference of the two spherical caps, multiplied by
            // the longitude ratio.
            //TODO: check if this.lat.hi & this.lat.lo is radians. 
            return this.lng.getLength().times(Decimal.sin(this.lat.hi).minus(Decimal.sin(this.lat.lo)).abs());
        };
        /** Return true if two rectangles contains the same set of points. */
        S2LatLngRect.prototype.equals = function (that) {
            if (!(that instanceof S2LatLngRect)) {
                return false;
            }
            return this.lat.equals(that.lat) && this.lng.equals(that.lng);
        };
        /**
         * Return true if the latitude and longitude intervals of the two rectangles
         * are the same up to the given tolerance (see r1interval.h and s1interval.h
         * for details).
         */
        S2LatLngRect.prototype.approxEquals = function (other, maxError) {
            if (maxError === void 0) { maxError = 1e-15; }
            return (this.lat.approxEquals(other.lat, maxError) && this.lng.approxEquals(other.lng, maxError));
        };
        // //////////////////////////////////////////////////////////////////////
        // S2Region interface (see {@code S2Region} for details):
        S2LatLngRect.prototype.clone = function () {
            return new S2LatLngRect(this.lat, this.lng);
        };
        S2LatLngRect.prototype.getCapBound = function () {
            // We consider two possible bounding caps, one whose axis passes
            // through the center of the lat-long rectangle and one whose axis
            // is the north or south pole. We return the smaller of the two caps.
            if (this.isEmpty()) {
                return S2Cap_1.S2Cap.empty();
            }
            var poleZ, poleAngle;
            if (this.lat.lo.plus(this.lat.hi).lt(0)) {
                // South pole axis yields smaller cap.
                poleZ = -1;
                poleAngle = this.lat.hi.plus(S2_1.S2.M_PI_2);
            }
            else {
                poleZ = 1;
                poleAngle = this.lat.lo.neg().plus(S2_1.S2.M_PI_2);
            }
            var poleCap = S2Cap_1.S2Cap.fromAxisAngle(new S2Point_1.S2Point(0, 0, poleZ), new S1Angle_1.S1Angle(poleAngle));
            // For bounding rectangles that span 180 degrees or less in longitude, the
            // maximum cap size is achieved at one of the rectangle vertices. For
            // rectangles that are larger than 180 degrees, we punt and always return a
            // bounding cap centered at one of the two poles.
            var lngSpan = this.lng.hi.minus(this.lng.lo);
            if (S2_1.S2.IEEEremainder(lngSpan, 2 * S2_1.S2.M_PI).gte(0)) {
                if (lngSpan.lt(2 * S2_1.S2.M_PI)) {
                    var midCap = S2Cap_1.S2Cap.fromAxisAngle(this.getCenter().toPoint(), new S1Angle_1.S1Angle(0));
                    for (var k = 0; k < 4; ++k) {
                        midCap = midCap.addPoint(this.getVertex(k).toPoint());
                    }
                    if (midCap.height.lt(poleCap.height)) {
                        return midCap;
                    }
                }
            }
            return poleCap;
        };
        S2LatLngRect.prototype.getRectBound = function () {
            return this;
        };
        S2LatLngRect.prototype.containsC = function (cell) {
            // A latitude-longitude rectangle contains a cell if and only if it contains
            // the cell's bounding rectangle. (This is an exact test.)
            return this.containsLLR(cell.getRectBound());
        };
        /**
         * This test is cheap but is NOT exact. Use Intersects() if you want a more
         * accurate and more expensive test. Note that when this method is used by an
         * S2RegionCoverer, the accuracy isn't all that important since if a cell may
         * intersect the region then it is subdivided, and the accuracy of this method
         * goes up as the cells get smaller.
         */
        S2LatLngRect.prototype.mayIntersectC = function (cell) {
            // This test is cheap but is NOT exact (see s2latlngrect.h).
            return this.intersectsLLR(cell.getRectBound());
        };
        /** The point 'p' does not need to be normalized. */
        S2LatLngRect.prototype.containsP = function (p) {
            return this.containsLL(S2LatLng_1.S2LatLng.fromPoint(p));
        };
        /**
         * Return true if the edge AB intersects the given edge of constant longitude.
         */
        S2LatLngRect.intersectsLngEdge = function (a, b, lat, lng) {
            // Return true if the segment AB intersects the given edge of constant
            // longitude. The nice thing about edges of constant longitude is that
            // they are straight lines on the sphere (geodesics).
            return S2_1.S2.simpleCrossing(a, b, new S2LatLng_1.S2LatLng(lat.lo, lng)
                .toPoint(), new S2LatLng_1.S2LatLng(lat.hi, lng).toPoint());
        };
        /**
         * Return true if the edge AB intersects the given edge of constant latitude.
         */
        S2LatLngRect.intersectsLatEdge = function (a, b, lat, lng) {
            // Return true if the segment AB intersects the given edge of constant
            // latitude. Unfortunately, lines of constant latitude are curves on
            // the sphere. They can intersect a straight edge in 0, 1, or 2 points.
            // assert (S2.isUnitLength(a) && S2.isUnitLength(b));
            // First, compute the normal to the plane AB that points vaguely north.
            var z = S2Point_1.S2Point.normalize(S2_1.S2.robustCrossProd(a, b));
            if (z.z.lt(0)) {
                z = S2Point_1.S2Point.neg(z);
            }
            // Extend this to an orthonormal frame (x,y,z) where x is the direction
            // where the great circle through AB achieves its maximium latitude.
            var y = S2Point_1.S2Point.normalize(S2_1.S2.robustCrossProd(z, new S2Point_1.S2Point(0, 0, 1)));
            var x = S2Point_1.S2Point.crossProd(y, z);
            // assert (S2.isUnitLength(x) && x.z >= 0);
            // Compute the angle "theta" from the x-axis (in the x-y plane defined
            // above) where the great circle intersects the given line of latitude.
            var sinLat = Decimal.sin(lat);
            if (sinLat.abs().gte(x.z)) {
                return false; // The great circle does not reach the given latitude.
            }
            // assert (x.z > 0);
            var cosTheta = sinLat.dividedBy(x.z);
            var sinTheta = cosTheta.pow(2).neg().plus(1).sqrt(); // Math.sqrt(1 - cosTheta * cosTheta);
            var theta = Decimal.atan2(sinTheta, cosTheta);
            // Math.atan2(sinTheta, cosTheta);
            // The candidate intersection points are located +/- theta in the x-y
            // plane. For an intersection to be valid, we need to check that the
            // intersection point is contained in the interior of the edge AB and
            // also that it is contained within the given longitude interval "lng".
            // Compute the range of theta values spanned by the edge AB.
            var abTheta = S1Interval_1.S1Interval.fromPointPair(Decimal.atan2(a.dotProd(y), a.dotProd(x)), Decimal.atan2(b.dotProd(y), b.dotProd(x)));
            if (abTheta.contains(theta)) {
                // Check if the intersection point is also in the given "lng" interval.
                var isect = S2Point_1.S2Point.add(S2Point_1.S2Point.mul(x, cosTheta), S2Point_1.S2Point.mul(y, sinTheta));
                if (lng.contains(Decimal.atan2(isect.y, isect.x))) {
                    return true;
                }
            }
            if (abTheta.contains(theta.neg())) {
                // Check if the intersection point is also in the given "lng" interval.
                var intersection = S2Point_1.S2Point.sub(S2Point_1.S2Point.mul(x, cosTheta), S2Point_1.S2Point.mul(y, sinTheta));
                if (lng.contains(Decimal.atan2(intersection.y, intersection.x))) {
                    return true;
                }
            }
            return false;
        };
        S2LatLngRect.prototype.allVertex = function () {
            return [
                this.getVertex(0),
                this.getVertex(1),
                this.getVertex(2),
                this.getVertex(3)
            ];
        };
        S2LatLngRect.prototype.toGEOJSON = function () {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [this.allVertex().concat(this.getVertex(0)).map(function (v) { return [parseFloat(v.lngDegrees.toFixed(5)), parseFloat(v.latDegrees.toFixed(5))]; })],
                },
                properties: {}
            };
        };
        S2LatLngRect.prototype.toString = function () {
            return "[Lo=" + this.lo().toString() + ", Hi=" + this.hi().toString() + "]";
        };
        return S2LatLngRect;
    }());
    exports.S2LatLngRect = S2LatLngRect;
});
//# sourceMappingURL=S2LatLngRect.js.map