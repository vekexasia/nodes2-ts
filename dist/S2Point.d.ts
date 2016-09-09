/// <reference types="decimal.js" />
import { R2Vector } from "./R2Vector";
/**
 * An S2Point represents a point on the unit sphere as a 3D vector. Usually
 * points are normalized to be unit length, but some methods do not require
 * this.
 *
 */
export declare class S2Point {
    x: decimal.Decimal;
    y: decimal.Decimal;
    z: decimal.Decimal;
    constructor(x: decimal.Decimal | number | string, y: decimal.Decimal | number | string, z: decimal.Decimal | number | string);
    static minus(p1: S2Point, p2: S2Point): S2Point;
    static neg(p: any): S2Point;
    norm2(): decimal.Decimal;
    norm(): decimal.Decimal;
    static crossProd(p1: S2Point, p2: S2Point): S2Point;
    static add(p1: any, p2: any): S2Point;
    static sub(p1: any, p2: any): S2Point;
    dotProd(that: S2Point): decimal.Decimal;
    static mul(p: any, m: decimal.Decimal | number): S2Point;
    static div(p: S2Point, m: number): S2Point;
    /** return a vector orthogonal to this one */
    ortho(): S2Point;
    /** Return the index of the largest component fabs */
    largestAbsComponent(): number;
    static fabs(p: S2Point): S2Point;
    static normalize(p: S2Point): S2Point;
    axis(axis: number): decimal.Decimal;
    /** Return the angle between two vectors in radians */
    angle(va: any): decimal.Decimal;
    /**
     * Compare two vectors, return true if all their components are within a
     * difference of margin.
     */
    aequal(that: S2Point, margin: number): boolean;
    equals(that: S2Point): boolean;
    lessThan(vb: S2Point): boolean;
    compareTo(other: S2Point): number;
    toFace(): number;
    toR2Vector(face?: number): R2Vector;
    toString(): string;
}
