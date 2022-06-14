/*
 * Copyright 2006 Google Inc.
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

import {R2Vector} from "./R2Vector";

///re
/**
 * An S2Point represents a point on the unit sphere as a 3D vector. Usually
 * points are normalized to be unit length, but some methods do not require
 * this.
 *
 */
export class S2Point {
  public x: number;
  public y: number;
  public z: number;
  constructor(x:number, y:number, z:number) {
    this.x = (x);
    this.y = (y);
    this.z = (z);
    // this.y = typeof(y) === 'number'?new Decimal(y):y as Decimal;
    // this.z = typeof(z) === 'number'?new Decimal(z):z as Decimal;
  }

  static minus(p1:S2Point, p2:S2Point) {
    return S2Point.sub(p1, p2);
  }

  static neg(p: S2Point) {
    return new S2Point(p.x * -1, p.y*-1, p.z*-1);
  }

  public norm2() {
    return Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2);
  }

  public norm() {
    return Math.sqrt(this.norm2());
  }


  static crossProd(p1:S2Point, p2:S2Point):S2Point {
    return new S2Point(
        p1.y* (p2.z) - (p1.z* (p2.y)),
        p1.z* (p2.x) - (p1.x* (p2.z)),
        // p1.z * p2.x - p1.x * p2.z,
        p1.x* (p2.y) - (p1.y* (p2.x))
        // p1.x * p2.y - p1.y * p2.x
    );
  }

  static add(p1:S2Point, p2:S2Point):S2Point {
    return new S2Point(p1.x + p2.x, p1.y + p2.y, p1.z + p2.z);
  }

  static sub(p1:S2Point, p2:S2Point):S2Point {
    return new S2Point(p1.x - p2.x, p1.y - p2.y, p1.z  - p2.z);
  }

  public dotProd(that:S2Point) {
    return this.x*(that.x) +(this.y * that.y) + (this.z* (that.z));
  }

  public static mul(p, m: number):S2Point {
    return new S2Point(m* (p.x), m* (p.y) , m* (p.z));
  }

  public static div(p:S2Point, m:number):S2Point {
    return new S2Point(p.x / (m), p.y / (m), p.z / (m));
  }

  /** return a vector orthogonal to this one */
  public ortho():S2Point {
    const k = this.largestAbsComponent();
    let temp;
    if (k == 1) {
      temp = new S2Point(1,0,0);
    } else if (k == 2) {
      temp = new S2Point(0,1,0);
    } else {
      temp = new S2Point(0,0,1);
    }
    return S2Point.normalize(S2Point.crossProd(this, temp));
  }

  /** Return the index of the largest component fabs */
  public largestAbsComponent():number {
    const temp = S2Point.fabs(this);
    if (temp.x > (temp.y)) {
      if (temp.x > (temp.z)) {
        return 0;
      } else {
        return 2;
      }
    } else {
      if (temp.y > (temp.z)) {
        return 1;
      } else {
        return 2;
      }
    }
  }

  public static fabs(p:S2Point):S2Point {
    return new S2Point(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  }

  public static normalize(p:S2Point) {
    let norm = p.norm();

    if (norm != (0)) {
      norm = 1/norm;
    }
    return S2Point.mul(p, norm);
  }

  axis(axis:number) {
    return (axis == 0) ? this.x : (axis == 1) ? this.y : this.z;
  }

  /** Return the angle between two vectors in radians */
  public angle(va) {
    return Math.atan2(S2Point.crossProd(this, va).norm(), this.dotProd(va));
  }

  /**
   * Compare two vectors, return true if all their components are within a
   * difference of margin.
   */
  aequal(that:S2Point, margin:number):boolean {
    return this.x - Math.abs(that.x) < (margin) &&
            this.y - Math.abs(that.y) < (margin) &&
            this.z - Math.abs(that.z) < (margin);
  }

  equals(that:S2Point):boolean {
    if (!(that instanceof S2Point)) {
      return false;
    }
    return this.x == (that.x) && this.y==(that.y) && this.z==(that.z);
  }

  public lessThan(vb:S2Point):boolean {
    if (this.x < (vb.x)) {
      return true;
    }
    if (vb.x < (this.x)) {
      return false;
    }
    if (this.y < (vb.y)) {
      return true;
    }
    if (vb.y < (this.y)) {
      return false;
    }
    if (this.z < (vb.z)) {
      return true;
    }
    return false;
  }

  public compareTo(other:S2Point):number {
    return (this.lessThan(other) ? -1 : (this.equals(other) ? 0 : 1));
  }


  toFace():number {
    let face = this.largestAbsComponent();
    if (this.axis(face) < (0)) {
      face += 3;
    }
    return face;
  }

  toR2Vector(face:number = this.toFace()):R2Vector {
    let u;
    let v;
    switch (face) {
      case 0:
        u = this.y / (this.x);
        v = this.z / (this.x);
        break;
      case 1:
        u = (this.x * -1) / (this.y);
        v = this.z / (this.y);
        break;
      case 2:
        u = (this.x * -1) / (this.z);
        v = (this.y * -1) / (this.z);
        break;
      case 3:
        u = this.z / (this.x);
        v = this.y / (this.x);
        break;
      case 4:
        u = this.z / (this.y);
        v = (this.x * -1) / (this.y);
        break;
      case 5:
        u = (this.y * -1) / (this.z);
        v = (this.x * -1) / (this.z);
        break;
      default:
        throw new Error('Invalid face');
    }
    return new R2Vector(u, v);
  }


  toString():string {
    return `Point(${this.x}, ${this.y}, ${this.z})`;
  }
}
