/// <reference types="decimal.js" />
import { S2Region } from "./S2Region";
import { S2Point } from "./S2Point";
import { S1Angle } from "./S1Angle";
import { S2LatLngRect } from "./S2LatLngRect";
import { S2Cell } from "./S2Cell";
/**
 * This class represents a spherical cap, i.e. a portion of a sphere cut off by
 * a plane. The cap is defined by its axis and height. This representation has
 * good numerical accuracy for very small caps (unlike the (axis,
 * min-distance-from-origin) representation), and is also efficient for
 * containment tests (unlike the (axis, angle) representation).
 *
 * Here are some useful relationships between the cap height (h), the cap
 * opening angle (theta), the maximum chord length from the cap's center (d),
 * and the radius of cap's base (a). All formulas assume a unit radius.
 *
 * h = 1 - cos(theta) = 2 sin^2(theta/2) d^2 = 2 h = a^2 + h^2
 *
 */
export declare class S2Cap implements S2Region {
    /**
     * Multiply a positive number by this constant to ensure that the result of a
     * floating point operation is at least as large as the true
     * infinite-precision result.
     */
    private static ROUND_UP;
    axis: S2Point;
    height: decimal.Decimal;
    /**
     * Create a cap given its axis and the cap height, i.e. the maximum projected
     * distance along the cap axis from the cap center. 'axis' should be a
     * unit-length vector.
     */
    constructor(axis: S2Point, _height: number | decimal.Decimal);
    /**
     * Create a cap given its axis and the cap opening angle, i.e. maximum angle
     * between the axis and a point on the cap. 'axis' should be a unit-length
     * vector, and 'angle' should be between 0 and 180 degrees.
     */
    static fromAxisAngle(axis: S2Point, angle: S1Angle): S2Cap;
    /**
     * Create a cap given its axis and its area in steradians. 'axis' should be a
     * unit-length vector, and 'area' should be between 0 and 4 * M_PI.
     */
    static fromAxisArea(axis: S2Point, _area: number | decimal.Decimal): S2Cap;
    /** Return an empty cap, i.e. a cap that contains no points. */
    static empty(): S2Cap;
    /** Return a full cap, i.e. a cap that contains all points. */
    static full(): S2Cap;
    getCapBound(): S2Cap;
    area(): decimal.Decimal;
    /**
     * Return the cap opening angle in radians, or a negative number for empty
     * caps.
     */
    angle(): S1Angle;
    /**
     * We allow negative heights (to represent empty caps) but not heights greater
     * than 2.
     */
    isValid(): boolean;
    /** Return true if the cap is empty, i.e. it contains no points. */
    isEmpty(): boolean;
    /** Return true if the cap is full, i.e. it contains all points. */
    isFull(): boolean;
    /**
     * Return the complement of the interior of the cap. A cap and its complement
     * have the same boundary but do not share any interior points. The complement
     * operator is not a bijection, since the complement of a singleton cap
     * (containing a single point) is the same as the complement of an empty cap.
     */
    complement(): S2Cap;
    /**
     * Return true if and only if this cap contains the given other cap (in a set
     * containment sense, e.g. every cap contains the empty cap).
     */
    containsCap(other: S2Cap): boolean;
    /**
     * Return true if and only if the interior of this cap intersects the given
     * other cap. (This relationship is not symmetric, since only the interior of
     * this cap is used.)
     */
    interiorIntersects(other: S2Cap): boolean;
    /**
     * Return true if and only if the given point is contained in the interior of
     * the region (i.e. the region excluding its boundary). 'p' should be a
     * unit-length vector.
     */
    interiorContains(p: S2Point): boolean;
    /**
     * Increase the cap height if necessary to include the given point. If the cap
     * is empty the axis is set to the given point, but otherwise it is left
     * unchanged. 'p' should be a unit-length vector.
     */
    addPoint(p: S2Point): S2Cap;
    addCap(other: S2Cap): S2Cap;
    getRectBound(): S2LatLngRect;
    containsC(cell: S2Cell): boolean;
    mayIntersectC(cell: S2Cell): boolean;
    /**
     * Return true if the cap intersects 'cell', given that the cap vertices have
     * alrady been checked.
     */
    intersects(cell: S2Cell, vertices: S2Point[]): boolean;
    contains(p: S2Point): boolean;
    /**
     * Return true if the cap axis and height differ by at most "max_error" from
     * the given cap "other".
     */
    approxEquals(other: S2Cap, maxError?: number): boolean;
    toString(): string;
    toGEOJSON(): any;
}
