import { S2Point } from "./S2Point";
import { S1Angle } from "./S1Angle";
/**
 * This class contains various utility functions related to edges. It collects
 * together common code that is needed to implement polygonal geometry such as
 * polylines, loops, and general polygons.
 *
 */
export declare class S2EdgeUtil {
    /**
     * A slightly more efficient version of getDistance() where the cross product
     * of the two endpoints has been precomputed. The cross product does not need
     * to be normalized, but should be computed using S2.robustCrossProd() for the
     * most accurate results.
     */
    static getDistance(x: S2Point, a: S2Point, b: S2Point, aCrossB?: S2Point): S1Angle;
}
