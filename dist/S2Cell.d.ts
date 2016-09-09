/// <reference types="decimal.js" />
import { S2CellId } from "./S2CellId";
import { S2Point } from "./S2Point";
import { S2LatLng } from "./S2LatLng";
import { R2Vector } from "./R2Vector";
import { S2LatLngRect } from "./S2LatLngRect";
import { S2Cap } from "./S2Cap";
export declare class S2Cell {
    private cellID;
    private static MAX_CELL_SIZE;
    private _face;
    private _level;
    private _orientation;
    private _uv;
    constructor(cellID: S2CellId);
    readonly id: S2CellId;
    readonly face: number;
    readonly level: number;
    readonly orientation: number;
    static fromFacePosLevel(face: number, pos: number, level: number): S2Cell;
    static fromPoint(p: S2Point): S2Cell;
    static fromLatLng(ll: S2LatLng): S2Cell;
    isLeaf(): boolean;
    getVertex(k: number): S2Point;
    /**
     * Return the k-th vertex of the cell (k = 0,1,2,3). Vertices are returned in
     * CCW order. The points returned by GetVertexRaw are not necessarily unit
     * length.
     */
    getVertexRaw(k: number): S2Point;
    getEdge(k: number): S2Point;
    getEdgeRaw(k: number): S2Point;
    /**
     * Return the inward-facing normal of the great circle passing through the
     * edge from vertex k to vertex k+1 (mod 4). The normals returned by
     * GetEdgeRaw are not necessarily unit length.
     *
     *  If this is not a leaf cell, set children[0..3] to the four children of
     * this cell (in traversal order) and return true. Otherwise returns false.
     * This method is equivalent to the following:
     *
     *  for (pos=0, id=child_begin(); id != child_end(); id = id.next(), ++pos)
     * children[i] = S2Cell(id);
     *
     * except that it is more than two times faster.
     */
    subdivide(): S2Cell[];
    /**
     * Return the direction vector corresponding to the center in (s,t)-space of
     * the given cell. This is the point at which the cell is divided into four
     * subcells; it is not necessarily the centroid of the cell in (u,v)-space or
     * (x,y,z)-space. The point returned by GetCenterRaw is not necessarily unit
     * length.
     */
    getCenter(): S2Point;
    getCenterRaw(): S2Point;
    /**
     * Return the center of the cell in (u,v) coordinates (see {@code
     * S2Projections}). Note that the center of the cell is defined as the point
     * at which it is recursively subdivided into four children; in general, it is
     * not at the midpoint of the (u,v) rectangle covered by the cell
     */
    getCenterUV(): R2Vector;
    /**
     * Return the average area of cells at this level. This is accurate to within
     * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
     * compute.
     */
    static averageArea(level: any): number;
    /**
     * Return the average area of cells at this level. This is accurate to within
     * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
     * compute.
     */
    averageArea(): number;
    /**
     * Return the approximate area of this cell. This method is accurate to within
     * 3% percent for all cell sizes and accurate to within 0.1% for cells at
     * level 5 or higher (i.e. 300km square or smaller). It is moderately cheap to
     * compute.
     */
    approxArea(): number;
    exactArea(): decimal.Decimal;
    getCapBound(): S2Cap;
    private static MAX_ERROR;
    private static POLE_MIN_LAT;
    getRectBound(): S2LatLngRect;
    mayIntersect(cell: S2Cell): boolean;
    contains(p: S2Point): boolean;
    containsC(cell: S2Cell): boolean;
    private init(id);
    private getLatitude(i, j);
    private getLongitude(i, j);
    toString(): string;
    toGEOJSON(): {
        type: string;
        geometry: {
            type: string;
            coordinates: number[][][];
        };
        properties: {};
        title: string;
    };
}
