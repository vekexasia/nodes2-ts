/*
 * Copyright 2005 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * This class specifies the details of how the cube faces are projected onto the
 * unit sphere. This includes getting the face ordering and orientation correct
 * so that sequentially increasing cell ids follow a continuous space-filling
 * curve over the entire sphere, and defining the transformation from cell-space
 * to cube-space (see s2.h) in order to make the cells more uniform in size.
 *
 *
 *  We have implemented three different projections from cell-space (s,t) to
 * cube-space (u,v): linear, quadratic, and tangent. They have the following
 * tradeoffs:
 *
 *  Linear - This is the fastest transformation, but also produces the least
 * uniform cell sizes. Cell areas vary by a factor of about 5.2, with the
 * largest cells at the center of each face and the smallest cells in the
 * corners.
 *
 *  Tangent - Transforming the coordinates via atan() makes the cell sizes more
 * uniform. The areas vary by a maximum ratio of 1.4 as opposed to a maximum
 * ratio of 5.2. However, each call to atan() is about as expensive as all of
 * the other calculations combined when converting from points to cell ids, i.e.
 * it reduces performance by a factor of 3.
 *
 *  Quadratic - This is an approximation of the tangent projection that is much
 * faster and produces cells that are almost as uniform in size. It is about 3
 * times faster than the tangent projection for converting cell ids to points,
 * and 2 times faster for converting points to cell ids. Cell areas vary by a
 * maximum ratio of about 2.1.
 *
 *  Here is a table comparing the cell uniformity using each projection. "Area
 * ratio" is the maximum ratio over all subdivision levels of the largest cell
 * area to the smallest cell area at that level, "edge ratio" is the maximum
 * ratio of the longest edge of any cell to the shortest edge of any cell at the
 * same level, and "diag ratio" is the ratio of the longest diagonal of any cell
 * to the shortest diagonal of any cell at the same level. "ToPoint" and
 * "FromPoint" are the times in microseconds required to convert cell ids to and
 * from points (unit vectors) respectively.
 *
 *  Area Edge Diag ToPoint FromPoint Ratio Ratio Ratio (microseconds)
 * ------------------------------------------------------- Linear: 5.200 2.117
 * 2.959 0.103 0.123 Tangent: 1.414 1.414 1.704 0.290 0.306 Quadratic: 2.082
 * 1.802 1.932 0.116 0.161
 *
 *  The worst-case cell aspect ratios are about the same with all three
 * projections. The maximum ratio of the longest edge to the shortest edge
 * within the same cell is about 1.4 and the maximum ratio of the diagonals
 * within the same cell is about 1.7.
 *
 * This data was produced using s2cell_unittest and s2cellid_unittest.
 *
 */
import { S2, S2Metric } from "./S2";
import { S2CellId } from "./S2CellId";
import { S2Point } from "./S2Point";
import { R2Vector } from "./R2Vector";

import Long = require("long");

enum Projections {
  S2_LINEAR_PROJECTION, S2_TAN_PROJECTION, S2_QUADRATIC_PROJECTION
}

export type UvTransformFunction = (x: number, y: number, z: number) => number
export type XyzTransformFunction = (u: number, v: number) => number

export type UvTransform = {
  xyzToU: UvTransformFunction,
  xyzToV: UvTransformFunction
};

export type XyzTransform = {
  uvToX: XyzTransformFunction,
  uvToY: XyzTransformFunction,
  uvToZ: XyzTransformFunction,
}

export class S2Projections {

  public static MIN_WIDTH = new S2Metric(1, 2 * S2.M_SQRT2 / 3); // 0.943
  public static AVG_AREA = new S2Metric(2, 4 * S2.M_PI / 6); // ~2.094
  public static MAX_LEVEL = 30;

  private static FACE_UVW_AXES: S2Point[][] = [
    [S2Point.Y_POS, S2Point.Z_POS, S2Point.X_POS],
    [S2Point.X_NEG, S2Point.Z_POS, S2Point.Y_POS],
    [S2Point.X_NEG, S2Point.Y_NEG, S2Point.Z_POS],
    [S2Point.Z_NEG, S2Point.Y_NEG, S2Point.X_NEG],
    [S2Point.Z_NEG, S2Point.X_POS, S2Point.Y_NEG],
    [S2Point.Y_POS, S2Point.X_POS, S2Point.Z_NEG]
  ];

  private static UV_TRANSFORMS: UvTransform[] = [
    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return y / x;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return z / x;
      },
    },

    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return -x / y;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return z / y;
      },
    },

    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return -x / z;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return -y / z;
      },
    },

    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return z / x;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return y / x;
      },
    },

    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return z / y;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return -x / y;
      },
    },

    {
      xyzToU: function xyzToU(x: number, y: number, z: number) {
        return -y / z;
      },

      xyzToV: function xyzToV(x: number, y: number, z: number) {
        return -x / z;
      },
    }
  ];

  private static XYZ_TRANSFORMS: XyzTransform[] = [
    {
      uvToX: function uvToX(u: number, v: number): number {
        return 1;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return u;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return v;
      },
    },
    {
      uvToX: function uvToX(u: number, v: number): number {
        return -u;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return 1;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return v;
      },
    },
    {
      uvToX: function uvToX(u: number, v: number): number {
        return -u;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return -v;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return 1;
      },
    },
    {
      uvToX: function uvToX(u: number, v: number): number {
        return -1;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return -v;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return -u;
      },
    },
    {
      uvToX: function uvToX(u: number, v: number): number {
        return v;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return -1;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return -u;
      },
    },
    {
      uvToX: function uvToX(u: number, v: number): number {
        return v;
      },


      uvToY: function uvToY(u: number, v: number): number {
        return u;
      },


      uvToZ: function uvToZ(u: number, v: number): number {
        return -1;
      },
    }
  ];

  /**
   * The maximum value of an si- or ti-coordinate. The range of valid (si,ti) values is
   * [0..MAX_SiTi].
   */
  public static MAX_SITI = Long.fromInt(1).shiftLeft(S2Projections.MAX_LEVEL + 1)

  public static getUNorm(face: number, u: number): S2Point {
    switch (face) {
      case 0:
        return new S2Point(u, -1, 0);
      case 1:
        return new S2Point(1, u, 0);
      case 2:
        return new S2Point(1, 0, u);
      case 3:
        return new S2Point(-u, 0, 1);
      case 4:
        return new S2Point(0, -u, 1);
      default:
        return new S2Point(0, -1, -u);
    }
  }

  public static getVNorm(face: number, v: number): S2Point {
    switch (face) {
      case 0:
        return new S2Point(-v, 0, 1);
      case 1:
        return new S2Point(0, -v, 1);
      case 2:
        return new S2Point(0, -1, -v);
      case 3:
        return new S2Point(v, -1, 0);
      case 4:
        return new S2Point(1, v, 0);
      default:
        return new S2Point(1, 0, v);
    }
  }

  public static getUAxis(face: number): S2Point {
    return S2Projections.getUVWAxis(face, 0);
  }

  public static getVAxis(face: number): S2Point {
    return S2Projections.getUVWAxis(face, 1);
  }

  public static getNorm(face: number): S2Point {
    return S2Projections.getUVWAxis(face, 2);
  }

  /** Returns the given axis of the given face (u=0, v=1, w=2). */
  static getUVWAxis(face: number, axis: number): S2Point {
    return S2Projections.FACE_UVW_AXES[face][axis];
  }

  /**
   * Convert (face, si, ti) coordinates (see s2.h) to a direction vector (not
   * necessarily unit length).
   */
  public static faceSiTiToXYZ(face: number, si: number, ti: number): S2Point {
    const u = R2Vector.singleStTOUV(this.siTiToSt(si));
    const v = R2Vector.singleStTOUV(this.siTiToSt(ti));

    return this.faceUvToXyz(face, u, v)
  }

  public static faceUvToXyz(face: number, u: number, v: number): S2Point {
    const t = this.faceToXyzTransform(face)
    return new S2Point(t.uvToX(u, v), t.uvToY(u, v), t.uvToZ(u, v));
  }

  public static faceXyzToUv(face: number, p: S2Point): R2Vector {
    if (face < 3) {
      if (p.get(face) <= 0) {
        return null;
      }
    } else {
      if (p.get(face - 3) >= 0) {
        return null;
      }
    }
    return S2Projections.validFaceXyzToUv(face, p);
  }

  public static validFaceXyzToUv(face: number, p: S2Point ): R2Vector {
    const t = S2Projections.faceToUvTransform(face);
    return new R2Vector(t.xyzToU(p.x, p.y, p.z), t.xyzToV(p.x, p.y, p.z));
  }

  public static ijToStMin(i: number): number {
    // assert (i >= 0 && i <= S2CellId.MAX_SIZE);
    return (1.0 / S2CellId.MAX_SIZE) * i;
  }

  public static stToIj(s: number): number {
    return Math.max(
      0, Math.min(S2CellId.MAX_SIZE - 1, Math.round(S2CellId.MAX_SIZE * s - 0.5)));
  }

  public static siTiToSt(si: number): number {
    return 1.0 / this.MAX_SITI.toNumber() * si;
  }

  public static ijToUV(ij: number, cellSize: number): number {
    return R2Vector.singleStTOUV(S2Projections.ijToStMin(ij & -cellSize));
  }

  static xyzToFaceP(p: S2Point): number {
    return this.xyzToFace(p.x, p.y, p.z)
  }

  static xyzToFace(x: number, y: number, z: number): number {
    switch (S2Point.largestAbsComponent(x, y, z)) {
      case 0:
        return (x < 0) ? 3 : 0;
      case 1:
        return (y < 0) ? 4 : 1;
      default:
        return (z < 0) ? 5 : 2;
    }
  }

  public static faceToUvTransform(face: number): UvTransform {
    return S2Projections.UV_TRANSFORMS[face];
  }

  public static faceToXyzTransform(face: number): XyzTransform {
    // We map illegal face indices to the largest face index to preserve legacy behavior, i.e., we
    // do not (yet) want to throw an index out of bounds exception. Note that S2CellId.face() is
    // guaranteed to return a non-negative face index even for invalid S2 cells, so it is sufficient
    // to just map all face indices greater than 5 to a face index of 5.
    //
    // TODO(bjj): Remove this legacy behavior.
    return S2Projections.XYZ_TRANSFORMS[Math.min(5, face)];
  }
}
