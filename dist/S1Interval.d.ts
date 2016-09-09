/// <reference types="decimal.js" />
import { Interval } from "./Interval";
export declare class S1Interval extends Interval {
    constructor(lo: number | decimal.Decimal, hi: number | decimal.Decimal, checked?: boolean);
    /**
     * An interval is valid if neither bound exceeds Pi in absolute value, and the
     * value -Pi appears only in the Empty() and Full() intervals.
     */
    isValid(): boolean;
    /** Return true if the interval contains all points on the unit circle. */
    isFull(): boolean;
    /** Return true if the interval is empty, i.e. it contains no points. */
    isEmpty(): boolean;
    isInverted(): boolean;
    /**
     * Return the midpoint of the interval. For full and empty intervals, the
     * result is arbitrary.
     */
    getCenter(): decimal.Decimal;
    /**
     * Return the length of the interval. The length of an empty interval is
     * negative.
     */
    getLength(): decimal.Decimal;
    /**
     * Return the complement of the interior of the interval. An interval and its
     * complement have the same boundary but do not share any interior values. The
     * complement operator is not a bijection, since the complement of a singleton
     * interval (containing a single value) is the same as the complement of an
     * empty interval.
     */
    complement(): S1Interval;
    /** Return true if the interval (which is closed) contains the point 'p'. */
    contains(_p: number | decimal.Decimal): boolean;
    /**
     * Return true if the interval (which is closed) contains the point 'p'. Skips
     * the normalization of 'p' from -Pi to Pi.
     *
     */
    fastContains(_p: number | decimal.Decimal): boolean;
    /** Return true if the interior of the interval contains the point 'p'. */
    interiorContains(_p: number | decimal.Decimal): boolean;
    /**
     * Return true if the interval contains the given interval 'y'. Works for
     * empty, full, and singleton intervals.
     */
    containsI(y: S1Interval): boolean;
    /**
     * Returns true if the interior of this interval contains the entire interval
     * 'y'. Note that x.InteriorContains(x) is true only when x is the empty or
     * full interval, and x.InteriorContains(S1Interval(p,p)) is equivalent to
     * x.InteriorContains(p).
     */
    interiorContainsI(y: S1Interval): boolean;
    /**
     * Return true if the two intervals contain any points in common. Note that
     * the point +/-Pi has two representations, so the intervals [-Pi,-3] and
     * [2,Pi] intersect, for example.
     */
    intersects(y: S1Interval): boolean;
    /**
     * Return true if the interior of this interval contains any point of the
     * interval 'y' (including its boundary). Works for empty, full, and singleton
     * intervals.
     */
    interiorIntersects(y: S1Interval): boolean;
    /**
     * Expand the interval by the minimum amount necessary so that it contains the
     * given point "p" (an angle in the range [-Pi, Pi]).
     */
    addPoint(_p: number | decimal.Decimal): S1Interval;
    /**
     * Return an interval that contains all points within a distance "radius" of
     * a point in this interval. Note that the expansion of an empty interval is
     * always empty. The radius must be non-negative.
     */
    expanded(_radius: number | decimal.Decimal): S1Interval;
    /**
     * Return the smallest interval that contains this interval and the given
     * interval "y".
     */
    union(y: S1Interval): S1Interval;
    /**
     * Return the smallest interval that contains the intersection of this
     * interval with "y". Note that the region of intersection may consist of two
     * disjoint intervals.
     */
    intersection(y: S1Interval): S1Interval;
    /**
     * Return true if the length of the symmetric difference between the two
     * intervals is at most the given tolerance.
     */
    approxEquals(y: S1Interval, maxError?: number): boolean;
    static empty(): S1Interval;
    static full(): S1Interval;
    static fromPoint(_p: number | decimal.Decimal): S1Interval;
    /**
     * Convenience method to construct the minimal interval containing the two
     * given points. This is equivalent to starting with an empty interval and
     * calling AddPoint() twice, but it is more efficient.
     */
    static fromPointPair(_p1: number | decimal.Decimal, _p2: number | decimal.Decimal): S1Interval;
    /**
     * Compute the distance from "a" to "b" in the range [0, 2*Pi). This is
     * equivalent to (drem(b - a - S2.M_PI, 2 * S2.M_PI) + S2.M_PI), except that
     * it is more numerically stable (it does not lose precision for very small
     * positive distances).
     */
    static positiveDistance(_a: number | decimal.Decimal, _b: number | decimal.Decimal): decimal.Decimal;
}
