import Long = require('long');
import {S2CellId} from "./S2CellId";
import {S2Point} from "./S2Point";
import {S2LatLng} from "./S2LatLng";
import {S2Projections} from "./S2Projections";
import {R2Vector} from "./R2Vector";
import {MutableInteger} from "./MutableInteger";
import {S2} from "./S2";
import {S2LatLngRect} from "./S2LatLngRect";
import {R1Interval} from "./R1Interval";
import {S1Interval} from "./S1Interval";
import {S2Cap} from "./S2Cap";
export class S2Cell {
  private static MAX_CELL_SIZE = 1 << S2CellId.MAX_LEVEL;

  private _face:number;
  private _level:number;
  private _orientation:number;

  private uMin: number;
  private uMax: number;
  private vMin: number;
  private vMax: number;

  constructor(private cellID?:S2CellId) {
    if (cellID != null) {
      this.init(cellID)
    }
  }

  get id():S2CellId {
    return this.cellID;
  }


  public static fromFace(face: number): S2Cell {
    return new S2Cell(S2CellId.fromFace(face));
  }

// This is a static method in order to provide named parameters.
  public static fromFacePosLevel(face:number, pos:number, level:number):S2Cell {
    return new S2Cell(S2CellId.fromFacePosLevel(face, new Long(pos), level));
  }

// Convenience methods.
  public static fromPoint(p:S2Point):S2Cell {
    return new S2Cell(S2CellId.fromPoint(p))
  }

  public static fromLatLng(ll:S2LatLng):S2Cell {
    return new S2Cell(S2CellId.fromPoint(ll.toPoint()));
  }


  public isLeaf():boolean {
    return this._level == S2CellId.MAX_LEVEL;
  }

  public getVertex(k:number):S2Point {
    return S2Point.normalize(this.getVertexRaw(k));
  }

  /**
   * Return the k-th vertex of the cell (k = 0,1,2,3). Vertices are returned in
   * CCW order. The points returned by GetVertexRaw are not necessarily unit
   * length.
   */
  public getVertexRaw(k:number):S2Point {
    // Vertices are returned in the order SW, SE, NE, NW.
    return S2Projections.faceUvToXyz(
      this._face, ((k >> 1) ^ (k & 1)) == 0 ? this.uMin : this.uMax, (k >> 1) == 0 ? this.vMin : this.vMax);
  }

  public getEdge(k:number):S2Point {
    return S2Point.normalize(this.getEdgeRaw(k));
  }

  public getEdgeRaw(k:number):S2Point {
    switch (k) {
      case 0:
        return S2Projections.getVNorm(this._face, this.vMin); // South
      case 1:
        return S2Projections.getUNorm(this._face, this.uMax); // East
      case 2:
        return S2Point.neg(S2Projections.getVNorm(this._face, this.vMax)); // North
      default:
        return S2Point.neg(S2Projections.getUNorm(this._face, this.uMin)); // West
    }
  }


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
  public subdivide():S2Cell[] {
    // This function is equivalent to just iterating over the child cell ids
    // and calling the S2Cell constructor, but it is about 2.5 times faster.

    if (this.id.isLeaf()) {
      return null;
    }
    
    const children:S2Cell[] = new Array(4);
    for (let i = 0; i < 4; ++i) {
      children[i] = new S2Cell();
    }

    // Create four children with the appropriate bounds.
    let id = this.id.childBegin();
    const mid = this.getCenterUV();
    const uMid = mid.x;
    const vMid = mid.y;

    for (let pos = 0; pos < 4; ++pos, id = id.next()) {
      const child = children[pos];
      child._face = this.face;
      child._level = this.level + 1;
      child._orientation = this.orientation ^ S2.POS_TO_ORIENTATION[pos];
      child.cellID = id;
      // We want to split the cell in half in "u" and "v".  To decide which
      // side to set equal to the midpoint value, we look at cell's (i,j)
      // position within its parent.  The index for "i" is in bit 1 of ij.
      const ij = S2.POS_TO_IJ[this.orientation][pos];
      // The dimension 0 index (i/u) is in bit 1 of ij.
      if ((ij & 0x2) != 0) {
        child.uMin = uMid;
        child.uMax = this.uMax;
      } else {
        child.uMin = this.uMin;
        child.uMax = uMid;
      }
      // The dimension 1 index (j/v) is in bit 0 of ij.
      if ((ij & 0x1) != 0) {
        child.vMin = vMid;
        child.vMax = this.vMax;
      } else {
        child.vMin = this.vMin;
        child.vMax = vMid;
      }
    }
    return children;
  }

  /**
   * Return the direction vector corresponding to the center in (s,t)-space of
   * the given cell. This is the point at which the cell is divided into four
   * subcells; it is not necessarily the centroid of the cell in (u,v)-space or
   * (x,y,z)-space. The point returned by GetCenterRaw is not necessarily unit
   * length.
   */
  public getCenter():S2Point {
    return S2Point.normalize(this.getCenterRaw());
  }

  public getCenterRaw():S2Point {
    return this.cellID.toPointRaw();
  }

  /**
   * Return the center of the cell in (u,v) coordinates (see {@code
   * S2Projections}). Note that the center of the cell is defined as the point
   * at which it is recursively subdivided into four children; in general, it is
   * not at the midpoint of the (u,v) rectangle covered by the cell
   */
  public getCenterUV():R2Vector {
    return this.cellID.getCenterUV();
  }

  /**
   * Return the average area of cells at this level. This is accurate to within
   * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
   * compute.
   */
  public static averageArea(level):number {
    return S2Projections.AVG_AREA.getValue(level);
  }

  /**
   * Return the average area of cells at this level. This is accurate to within
   * a factor of 1.7 (for S2_QUADRATIC_PROJECTION) and is extremely cheap to
   * compute.
   */
  public averageArea():number {
    return S2Projections.AVG_AREA.getValue(this._level);
  }

  /**
   * Return the approximate area of this cell. This method is accurate to within
   * 3% percent for all cell sizes and accurate to within 0.1% for cells at
   * level 5 or higher (i.e. 300km square or smaller). It is moderately cheap to
   * compute.
   */
  public  approxArea():number {

    // All cells at the first two levels have the same area.
    if (this._level < 2) {
      return this.averageArea();
    }

    // First, compute the approximate area of the cell when projected
    // perpendicular to its normal. The cross product of its diagonals gives
    // the normal, and the length of the normal is twice the projected area.
    const flatArea = S2Point.crossProd(
        S2Point.sub(this.getVertex(2), this.getVertex(0)),
        S2Point.sub(this.getVertex(3), this.getVertex(1))
    ).norm() * 0.5;
    // double flatArea = 0.5 * S2Point.crossProd(
    //         S2Point.sub(getVertex(2), getVertex(0)), S2Point.sub(getVertex(3), getVertex(1))).norm();

    // Now, compensate for the curvature of the cell surface by pretending
    // that the cell is shaped like a spherical cap. The ratio of the
    // area of a spherical cap to the area of its projected disc turns out
    // to be 2 / (1 + sqrt(1 - r*r)) where "r" is the radius of the disc.
    // For example, when r=0 the ratio is 1, and when r=1 the ratio is 2.
    // Here we set Pi*r*r == flat_area to find the equivalent disc.
    return flatArea *2 / (Math.sqrt((Math.min(flatArea * S2.M_1_PI, 1) * -1)+1)+1);
  }

//
// /**
//  * Return the area of this cell as accurately as possible. This method is more
//  * expensive but it is accurate to 6 digits of precision even for leaf cells
//  * (whose area is approximately 1e-18).
//  */
  public exactArea() {
    const v0 = this.getVertex(0);
    const v1 = this.getVertex(1);
    const v2 = this.getVertex(2);
    const v3 = this.getVertex(3);
    return S2.area(v0, v1, v2) + (S2.area(v0, v2, v3));
  }

// //////////////////////////////////////////////////////////////////////
// S2Region interface (see {@code S2Region} for details):


  public getCapBound():S2Cap {
    // Use the cell center in (u,v)-space as the cap axis. This vector is
    // very close to GetCenter() and faster to compute. Neither one of these
    // vectors yields the bounding cap with minimal surface area, but they
    // are both pretty close.
    //
    // It's possible to show that the two vertices that are furthest from
    // the (u,v)-origin never determine the maximum cap size (this is a
    // possible future optimization).
    const uv = this.getCenterUV();
    const center = S2Point.normalize(S2Projections.faceUvToXyz(this._face, uv.x, uv.y));
    let cap = S2Cap.fromAxisHeight(center, 0);
    for (let k = 0; k < 4; ++k) {
      cap = cap.addPoint(this.getVertex(k));
    }
    return cap;
  }

// We grow the bounds slightly to make sure that the bounding rectangle
// also contains the normalized versions of the vertices. Note that the
// maximum result magnitude is Pi, with a floating-point exponent of 1.
// Therefore adding or subtracting 2**-51 will always change the result.
//   private static MAX_ERROR = S2.toDecimal(1.0).dividedBy(S2.toDecimal(new Long(1).shiftLeft(51).toString()));
  private static MAX_ERROR = 1/new Long(1).shiftLeft(51).toNumber();

// The 4 cells around the equator extend to +/-45 degrees latitude at the
// midpoints of their top and bottom edges. The two cells covering the
// poles extend down to +/-35.26 degrees at their vertices.
// adding kMaxError (as opposed to the C version) because of asin and atan2
// roundoff errors
  private static POLE_MIN_LAT = Math.asin(Math.sqrt(1/3)) - S2Cell.MAX_ERROR;
// 35.26 degrees


  private getPoint(i: number, j: number): S2Point {
    return S2Projections.faceUvToXyz(this._face, i == 0 ? this.uMin : this.uMax, j == 0 ? this.vMin : this.vMax);
  }

  public getRectBound():S2LatLngRect {
    if (this._level > 0) {
      // Except for cells at level 0, the latitude and longitude extremes are
      // attained at the vertices. Furthermore, the latitude range is
      // determined by one pair of diagonally opposite vertices and the
      // longitude range is determined by the other pair.
      //
      // We first determine which corner (i,j) of the cell has the largest
      // absolute latitude. To maximize latitude, we want to find the point in
      // the cell that has the largest absolute z-coordinate and the smallest
      // absolute x- and y-coordinates. To do this we look at each coordinate
      // (u and v), and determine whether we want to minimize or maximize that
      // coordinate based on the axis direction and the cell's (u,v) quadrant.
      const u = this.uMin + this.uMax;
      const v = this.vMin + this.vMax;
      const i = S2Projections.getUAxis(this._face).z == 0 ? (u < 0 ? 1 : 0) : (u > 0 ? 1 : 0);
      const j = S2Projections.getVAxis(this._face).z == 0 ? (v < 0 ? 1 : 0) : (v > 0 ? 1 : 0);

      const lat = R1Interval.fromPointPair(
          S2LatLng.latitude(this.getPoint(i, j)).radians,
          S2LatLng.latitude(this.getPoint(1 - i, 1 - j)).radians);
          
      const lng = S1Interval.fromPointPair(
              S2LatLng.longitude(this.getPoint(i, 1 - j)).radians,
              S2LatLng.longitude(this.getPoint(1 - i, j)).radians);

      
      // DBL_EPSILON
      return new S2LatLngRect(lat, lng)
          .expanded(S2LatLng.fromRadians(S2.DBL_EPSILON, S2.DBL_EPSILON))
          .polarClosure();
    }


    // The face centers are the +X, +Y, +Z, -X, -Y, -Z axes in that order.
    // assert (S2Projections.getNorm(face).get(face % 3) == ((face < 3) ? 1 : -1));
    switch (this._face) {
      case 0:
        return new S2LatLngRect(
            new R1Interval(-S2.M_PI_4, S2.M_PI_4), new S1Interval(-S2.M_PI_4, S2.M_PI_4));
      case 1:
        return new S2LatLngRect(
            new R1Interval(-S2.M_PI_4, S2.M_PI_4), new S1Interval(S2.M_PI_4, 3 * S2.M_PI_4));
      case 2:
        return new S2LatLngRect(
            new R1Interval(S2Cell.POLE_MIN_LAT, S2.M_PI_2), new S1Interval(-S2.M_PI, S2.M_PI));
      case 3:
        return new S2LatLngRect(
            new R1Interval(-S2.M_PI_4, S2.M_PI_4), new S1Interval(3 * S2.M_PI_4, -3 * S2.M_PI_4));
      case 4:
        return new S2LatLngRect(
            new R1Interval(-S2.M_PI_4, S2.M_PI_4), new S1Interval(-3 * S2.M_PI_4, -S2.M_PI_4));
      default:
        return new S2LatLngRect(
            new R1Interval(-S2.M_PI_2, -S2Cell.POLE_MIN_LAT), new S1Interval(-S2.M_PI, S2.M_PI));
    }

  }


  public mayIntersectC(cell:S2Cell):boolean {
    return this.cellID.intersects(cell.cellID);
  }

  public contains(p:S2Point):boolean {
    // We can't just call XYZtoFaceUV, because for points that lie on the
    // boundary between two faces (i.e. u or v is +1/-1) we need to return
    // true for both adjacent cells.

    const uvPoint = S2Projections.faceXyzToUv(this._face, p);
    if (uvPoint == null) {
      return false;
    }
    return (uvPoint.x >= this.uMin
        && uvPoint.x <= this.uMax
        && uvPoint.y >= this.vMin
        && uvPoint.y <= this.vMax);
  }

// The point 'p' does not need to be normalized.

  public containsC(cell:S2Cell):boolean {
    return this.cellID.contains(cell.cellID);
  }

  private init(id:S2CellId) {
    this.cellID = id;
    this._face = id.face

    const ijo = id.toIJOrientation();

    this._orientation = S2CellId.getOrientation(ijo);
    this._level = id.level();

    const i = S2CellId.getI(ijo);
    const j = S2CellId.getJ(ijo);
    const cellSize = id.getSizeIJ();

    this.uMin = S2Projections.ijToUV(i, cellSize);
    this.uMax = S2Projections.ijToUV(i + cellSize, cellSize);
    this.vMin = S2Projections.ijToUV(j, cellSize);
    this.vMax = S2Projections.ijToUV(j + cellSize, cellSize);

    // for (let d = 0; d < 2; ++d) {
    //   // Compute the cell bounds in scaled (i,j) coordinates.
    //   const sijLo = (ij[d].val & -cellSize) * 2 - S2Cell.MAX_CELL_SIZE;
    //   const sijHi = sijLo + cellSize * 2;

    //   const s = 1/S2Cell.MAX_CELL_SIZE;
    //   this._uv[d][0] = R2Vector.singleStTOUV(s * (sijLo))
    //   //S2Projections.stToUV((1.0 / S2Cell.MAX_CELL_SIZE) * sijLo);
    //   this._uv[d][1] = R2Vector.singleStTOUV(s * (sijHi));
    //   //S2Projections.stToUV((1.0 / S2Cell.MAX_CELL_SIZE) * sijHi);
    // }
  }

  get face(): number {
    return this._face;
  }

  get orientation(): number {
    return this._orientation;
  }

  get level(): number {
    return this._level;
  }


// Return the latitude or longitude of the cell vertex given by (i,j),
// where "i" and "j" are either 0 or 1.

  public toString():string {
    return "[" + this._face + ", " + this._level + ", " + this.orientation + ", " + this.cellID + "]";
  }

  public toGEOJSON() {
    const coords = [this.getVertex(0),this.getVertex(1),this.getVertex(2),this.getVertex(3),this.getVertex(0)]
        .map(v => S2LatLng.fromPoint(v))
        .map(v => ([v.lngDegrees, v.latDegrees]))

    // const rectJSON = this.getRectBound().toGEOJSON();
    return {
      type: 'Feature',
      geometry: {
        type:'Polygon',
        coordinates: [coords]
      },
      properties: {},
      title: `Cell: ${this.id.toToken()} lvl: ${this._level}`
    };
    // rectJSON.title = `Cell: ${this.id.toToken()}`;
    // return rectJSON;
  }

}
