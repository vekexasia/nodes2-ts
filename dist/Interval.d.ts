/// <reference types="decimal.js" />
export declare abstract class Interval {
    lo: decimal.Decimal;
    hi: decimal.Decimal;
    constructor(lo: number | decimal.Decimal, hi: number | decimal.Decimal);
    /** Return true if the interval is empty, i.e. it contains no points. */
    abstract isEmpty(): boolean;
    /**
     * Return the center of the interval. For empty intervals, the result is
     * arbitrary.
     */
    abstract getCenter(): decimal.Decimal;
    /**
     * Return the length of the interval. The length of an empty interval is
     * negative.
     */
    abstract getLength(): decimal.Decimal;
    abstract contains(p: number | decimal.Decimal): boolean;
    abstract interiorContains(p: number | decimal.Decimal): boolean;
    toString(): string;
    /**
     * Return true if two intervals contains the same set of points.
     */
    equals(that: any): boolean;
}
