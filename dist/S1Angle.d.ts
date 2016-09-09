/// <reference types="decimal.js" />
import { S2Point } from "./S2Point";
export declare class S1Angle {
    radians: decimal.Decimal;
    constructor(radians: number | decimal.Decimal);
    degrees(): decimal.Decimal;
    /**
     * Return the angle between two points, which is also equal to the distance
     * between these points on the unit sphere. The points do not need to be
     * normalized.
     */
    static fromPoints(x: S2Point, y: S2Point): S1Angle;
    lessThan(that: S1Angle): boolean;
    greaterThan(that: S1Angle): boolean;
    lessOrEquals(that: S1Angle): boolean;
    greaterOrEquals(that: S1Angle): boolean;
    static max(left: S1Angle, right: S1Angle): S1Angle;
    static min(left: S1Angle, right: S1Angle): S1Angle;
    static degrees(degrees: number | decimal.Decimal): S1Angle;
    /**
     * Writes the angle in degrees with a "d" suffix, e.g. "17.3745d". By default
     * 6 digits are printed; this can be changed using setprecision(). Up to 17
     * digits are required to distinguish one angle from another.
     */
    toString(): string;
    compareTo(that: S1Angle): number;
}
