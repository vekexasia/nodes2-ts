/// <reference types="decimal.js" />
import { S1Interval } from "./S1Interval";
import { R1Interval } from "./R1Interval";
import { S2LatLng } from "./S2LatLng";
import { S2Region } from "./S2Region";
import { S2Point } from "./S2Point";
import { S1Angle } from "./S1Angle";
import { S2Cell } from "./S2Cell";
import { S2Cap } from "./S2Cap";
export declare class S2LatLngRect implements S2Region {
    lat: R1Interval;
    lng: S1Interval;
    constructor(lat: R1Interval, lng: S1Interval);
    static fromLatLng(lo: S2LatLng, hi: S2LatLng): S2LatLngRect;
    /** The canonical empty rectangle */
    static empty(): S2LatLngRect;
    /** The canonical full rectangle. */
    static full(): S2LatLngRect;
    /** The full allowable range of latitudes. */
    static fullLat(): R1Interval;
    /**
     * Construct a rectangle from a center point (in lat-lng space) and size in
     * each dimension. If size.lng is greater than 360 degrees it is clamped,
     * and latitudes greater than +/- 90 degrees are also clamped. So for example,
     * FromCenterSize((80,170),(20,20)) -> (lo=(60,150),hi=(90,-170)).
     */
    static fromCenterSize(center: S2LatLng, size: S2LatLng): S2LatLngRect;
    /** Convenience method to construct a rectangle containing a single point. */
    static fromPoint(p: S2LatLng): S2LatLngRect;
    /**
     * Convenience method to construct the minimal bounding rectangle containing
     * the two given points. This is equivalent to starting with an empty
     * rectangle and calling AddPoint() twice. Note that it is different than the
     * S2LatLngRect(lo, hi) constructor, where the first point is always used as
     * the lower-left corner of the resulting rectangle.
     */
    static fromPointPair(p1: S2LatLng, p2: S2LatLng): S2LatLngRect;
    /**
     * Return a latitude-longitude rectangle that contains the edge from "a" to
     * "b". Both points must be unit-length. Note that the bounding rectangle of
     * an edge can be larger than the bounding rectangle of its endpoints.
     */
    static fromEdge(a: S2Point, b: S2Point): S2LatLngRect;
    /**
     * Return true if the rectangle is valid, which essentially just means that
     * the latitude bounds do not exceed Pi/2 in absolute value and the longitude
     * bounds do not exceed Pi in absolute value.
     *
     */
    isValid(): boolean;
    lo(): S2LatLng;
    hi(): S2LatLng;
    /**
     * Return true if the rectangle is empty, i.e. it contains no points at all.
     */
    isEmpty(): boolean;
    isFull(): boolean;
    /**
     * Return true if lng_.lo() > lng_.hi(), i.e. the rectangle crosses the 180
     * degree latitude line.
     */
    isInverted(): boolean;
    /** Return the k-th vertex of the rectangle (k = 0,1,2,3) in CCW order. */
    getVertex(k: number): S2LatLng;
    /**
     * Return the center of the rectangle in latitude-longitude space (in general
     * this is not the center of the region on the sphere).
     */
    getCenter(): S2LatLng;
    /**
     * Return the minimum distance (measured along the surface of the sphere)
     * from a given point to the rectangle (both its boundary and its interior).
     * The latLng must be valid.
     */
    getDistanceLL(p: S2LatLng): S1Angle;
    /**
     * Return the minimum distance (measured along the surface of the sphere) to
     * the given S2LatLngRect. Both S2LatLngRects must be non-empty.
     */
    getDistanceLLR(other: S2LatLngRect): S1Angle;
    /**
     * Return the width and height of this rectangle in latitude-longitude space.
     * Empty rectangles have a negative width and height.
     */
    getSize(): S2LatLng;
    /**
     * More efficient version of Contains() that accepts a S2LatLng rather than an
     * S2Point.
     */
    containsLL(ll: S2LatLng): boolean;
    /**
     * Return true if and only if the given point is contained in the interior of
     * the region (i.e. the region excluding its boundary). The point 'p' does not
     * need to be normalized.
     */
    interiorContainsP(p: S2Point): boolean;
    /**
     * More efficient version of InteriorContains() that accepts a S2LatLng rather
     * than an S2Point.
     */
    interiorContainsLL(ll: S2LatLng): boolean;
    /**
     * Return true if and only if the rectangle contains the given other
     * rectangle.
     */
    containsLLR(other: S2LatLngRect): boolean;
    /**
     * Return true if and only if the interior of this rectangle contains all
     * points of the given other rectangle (including its boundary).
     */
    interiorContainsLLR(other: S2LatLngRect): boolean;
    /** Return true if this rectangle and the given other rectangle have any
     points in common. */
    intersectsLLR(other: S2LatLngRect): boolean;
    /**
     * Returns true if this rectangle intersects the given cell. (This is an exact
     * test and may be fairly expensive, see also MayIntersect below.)
     */
    intersects(cell: S2Cell): boolean;
    /**
     * Return true if and only if the interior of this rectangle intersects any
     * point (including the boundary) of the given other rectangle.
     */
    interiorIntersects(other: S2LatLngRect): boolean;
    addPoint(p: S2Point): S2LatLngRect;
    addPointLL(ll: S2LatLng): S2LatLngRect;
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
    expanded(margin: S2LatLng): S2LatLngRect;
    /**
     * Return the smallest rectangle containing the union of this rectangle and
     * the given rectangle.
     */
    union(other: S2LatLngRect): S2LatLngRect;
    /**
     * Return the smallest rectangle containing the intersection of this rectangle
     * and the given rectangle. Note that the region of intersection may consist
     * of two disjoint rectangles, in which case a single rectangle spanning both
     * of them is returned.
     */
    intersection(other: S2LatLngRect): S2LatLngRect;
    /** Return the surface area of this rectangle on the unit sphere. */
    area(): decimal.Decimal;
    /** Return true if two rectangles contains the same set of points. */
    equals(that: any): boolean;
    /**
     * Return true if the latitude and longitude intervals of the two rectangles
     * are the same up to the given tolerance (see r1interval.h and s1interval.h
     * for details).
     */
    approxEquals(other: S2LatLngRect, maxError?: number): boolean;
    clone(): S2Region;
    getCapBound(): S2Cap;
    getRectBound(): S2LatLngRect;
    containsC(cell: S2Cell): boolean;
    /**
     * This test is cheap but is NOT exact. Use Intersects() if you want a more
     * accurate and more expensive test. Note that when this method is used by an
     * S2RegionCoverer, the accuracy isn't all that important since if a cell may
     * intersect the region then it is subdivided, and the accuracy of this method
     * goes up as the cells get smaller.
     */
    mayIntersectC(cell: S2Cell): boolean;
    /** The point 'p' does not need to be normalized. */
    containsP(p: S2Point): boolean;
    /**
     * Return true if the edge AB intersects the given edge of constant longitude.
     */
    private static intersectsLngEdge(a, b, lat, lng);
    /**
     * Return true if the edge AB intersects the given edge of constant latitude.
     */
    private static intersectsLatEdge(a, b, lat, lng);
    allVertex(): S2LatLng[];
    toGEOJSON(): any;
    toString(): string;
}
