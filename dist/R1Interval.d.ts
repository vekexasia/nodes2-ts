/// <reference types="decimal.js" />
import { Interval } from "./Interval";
/**
 * An R1Interval represents a closed interval on a unit circle (also known as a
 * 1-dimensional sphere). It is capable of representing the empty interval
 * (containing no points), the full interval (containing all points), and
 * zero-length intervals (containing a single point).
 *
 *  Points are represented by the angle they make with the positive x-axis in
 * the range [-Pi, Pi]. An interval is represented by its lower and upper bounds
 * (both inclusive, since the interval is closed). The lower bound may be
 * greater than the upper bound, in which case the interval is "inverted" (i.e.
 * it passes through the point (-1, 0)).
 *
 *  Note that the point (-1, 0) has two valid representations, Pi and -Pi. The
 * normalized representation of this point internally is Pi, so that endpoints
 * of normal intervals are in the range (-Pi, Pi]. However, we take advantage of
 * the point -Pi to construct two special intervals: the Full() interval is
 * [-Pi, Pi], and the Empty() interval is [Pi, -Pi].
 *
 */
export declare class R1Interval extends Interval {
    /** Return true if the interval is empty, i.e. it contains no points. */
    isEmpty(): boolean;
    getCenter(): decimal.Decimal;
    getLength(): decimal.Decimal;
    contains(_p: number | decimal.Decimal): boolean;
    /** Return true if the interior of the interval contains the point 'p'. */
    interiorContains(_p: number | decimal.Decimal): boolean;
    /**
     * Return true if the interval contains the given interval 'y'. Works for
     * empty, full, and singleton intervals.
     */
    containsI(y: R1Interval): boolean;
    interiorContainsI(y: R1Interval): boolean;
    /**
     * Return true if this interval intersects the given interval, i.e. if they
     * have any points in common.
     */
    intersects(y: R1Interval): boolean;
    /**
     * Return true if the interior of this interval intersects any point of the
     * given interval (including its boundary).
     */
    interiorIntersects(y: R1Interval): boolean;
    /** Expand the interval so that it contains the given point "p". */
    addPoint(_p: number | decimal.Decimal): R1Interval;
    /**
     * Return an interval that contains all points with a distance "radius" of a
     * point in this interval. Note that the expansion of an empty interval is
     * always empty.
     */
    expanded(_radius: number | decimal.Decimal): R1Interval;
    /**
     * Return the smallest interval that contains this interval and the given
     * interval "y".
     */
    union(y: R1Interval): R1Interval;
    /**
     * Return the intersection of this interval with the given interval. Empty
     * intervals do not need to be special-cased.
     */
    intersection(y: R1Interval): R1Interval;
    /**
     * Return true if the length of the symmetric difference between the two
     * intervals is at most the given tolerance.
     */
    approxEquals(y: R1Interval, maxError?: number): boolean;
    static empty(): R1Interval;
    static fromPoint(p: number | decimal.Decimal): R1Interval;
    /**
     * Convenience method to construct the minimal interval containing the two
     * given points. This is equivalent to starting with an empty interval and
     * calling AddPoint() twice, but it is more efficient.
     */
    static fromPointPair(_p1: number | decimal.Decimal, _p2: number | decimal.Decimal): R1Interval;
}
