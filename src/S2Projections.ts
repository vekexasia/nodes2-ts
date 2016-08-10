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
import {S2, S2Metric} from "./S2";
import {S2Point} from "./S2Point";
import {R2Vector} from "./R2Vector";
export enum Projections { 
  S2_LINEAR_PROJECTION, S2_TAN_PROJECTION, S2_QUADRATIC_PROJECTION
}
export class S2Projections {

  public static MIN_WIDTH= new S2Metric(1,S2.M_SQRT2 / 3);
  public static AVG_AREA = new S2Metric(2, S2.M_PI / 6); // 0.524)

  public static getUNorm(face:number, u:decimal.Decimal):S2Point {
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

  public static getVNorm(face:number, v:decimal.Decimal):S2Point {
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


  public static  getUAxis(face:number):S2Point {
    switch (face) {
      case 0:
        return new S2Point(0, 1, 0);
      case 1:
        return new S2Point(-1, 0, 0);
      case 2:
        return new S2Point(-1, 0, 0);
      case 3:
        return new S2Point(0, 0, -1);
      case 4:
        return new S2Point(0, 0, -1);
      default:
        return new S2Point(0, 1, 0);
    }
  }

  public static getVAxis(face:number):S2Point {
    switch (face) {
      case 0:
        return new S2Point(0, 0, 1);
      case 1:
        return new S2Point(0, 0, 1);
      case 2:
        return new S2Point(0, -1, 0);
      case 3:
        return new S2Point(0, -1, 0);
      case 4:
        return new S2Point(1, 0, 0);
      default:
        return new S2Point(1, 0, 0);
    }
  }

  public static faceUvToXyz(face: number, u:number|decimal.Decimal, v:number|decimal.Decimal):S2Point {
    return new R2Vector(u,v).toPoint(face);
  }
}