/// <reference types="decimal.js" />
import { S2Point } from "./S2Point";
/**
 * R2Vector represents a vector in the two-dimensional space. It defines the
 * basic geometrical operations for 2D vectors, e.g. cross product, addition,
 * norm, comparison etc.
 *
 */
export declare class R2Vector {
    private _x;
    private _y;
    constructor(_x: number | decimal.Decimal, _y: number | decimal.Decimal);
    readonly x: decimal.Decimal;
    readonly y: decimal.Decimal;
    get(index: number): decimal.Decimal;
    static fromPointFace(p: S2Point, face: number): R2Vector;
    static add(p1: R2Vector, p2: R2Vector): R2Vector;
    static mul(p: R2Vector, _m: number | decimal.Decimal): R2Vector;
    norm2(): decimal.Decimal;
    static dotProd(p1: R2Vector, p2: R2Vector): decimal.Decimal;
    dotProd(that: R2Vector): decimal.Decimal;
    crossProd(that: R2Vector): decimal.Decimal;
    lessThan(vb: R2Vector): boolean;
    static fromSTVector(stVector: R2Vector): R2Vector;
    static singleStTOUV(_s: number | decimal.Decimal): decimal.Decimal;
    static singleUVToST(_x: number | decimal.Decimal): decimal.Decimal;
    /**
     * To be used only if this vector is representing uv.
     * @param face
     * @returns {S2Point}
     */
    toPoint(face: number): S2Point;
    toSt(which: any): decimal.Decimal;
    toString(): string;
}
