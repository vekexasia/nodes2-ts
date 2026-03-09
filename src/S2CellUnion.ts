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
import { u64 } from './uint64';
import { S2Region } from "./S2Region";
import { S2CellId } from "./S2CellId";
import { S2Cell } from "./S2Cell";
import { S1Angle } from "./S1Angle";
import { S2Projections } from "./S2Projections";
import { S2LatLngRect } from "./S2LatLngRect";
import { S2Point } from "./S2Point";
import { S2Cap } from "./S2Cap";
import { S1ChordAngle } from './S1ChordAngle';

/**
 * An S2CellUnion is a region consisting of cells of various sizes.
 */
export class S2CellUnion implements S2Region {

  /** The CellIds that form the Union */
  private cellIds: S2CellId[] = [];

  /**
   * Populates a cell union with the given S2CellIds or 64-bit cell ids, and
   * then calls Normalize().
   *
   * v4: `cellIds` accepts `bigint[] | string[]` (was `Long[] | string[]`).
   */
  public initFromIds(cellIds: bigint[] | string[]) {
    this.initRawIds(cellIds);
    this.normalize();
  }

  public initFromCellIds(cellIds: S2CellId[]) {
    this.initRawCellIds(cellIds);
    this.normalize();
  }

  public initSwap(cellIds: S2CellId[]) {
    this.initRawSwap(cellIds);
    this.normalize();
  }

  public initRawCellIds(cellIds: S2CellId[]) {
    this.cellIds = cellIds;
  }

  public initRawIds(cellIds: bigint[] | string[]) {
    const size = cellIds.length;
    this.cellIds = [];
    for (let i = 0; i < size; i++) {
      this.cellIds.push(new S2CellId(cellIds[i] as bigint | string));
    }
  }

  public initRawSwap(cellIds: S2CellId[]) {
    this.cellIds = [].concat(cellIds);
  }

  public size(): number {
    return this.cellIds.length;
  }

  public cellId(i: number): S2CellId {
    return this.cellIds[i];
  }

  public getCellIds(): S2CellId[] {
    return this.cellIds;
  }

  public denormalize(minLevel: number, levelMod: number): S2CellId[] {
    const output: S2CellId[] = [];
    for (let i = 0; i < this.cellIds.length; i++) {
      const id = this.cellIds[i];
      const level = id.level();
      let newLevel = Math.max(minLevel, level);
      if (levelMod > 1) {
        newLevel += (S2CellId.MAX_LEVEL - (newLevel - minLevel)) % levelMod;
        newLevel = Math.min(S2CellId.MAX_LEVEL, newLevel);
      }
      if (newLevel === level) {
        output.push(id);
      } else {
        const end = id.childEndL(newLevel);
        for (
          let iid = id.childBeginL(newLevel);
          !iid.equals(end);
          iid = iid.next()
        ) {
          output.push(iid);
        }
      }
    }
    return output;
  }

  public pack() {
    throw new Error('useless');
  }

  containsC(cell: S2Cell): boolean {
    return this.containsCell(cell);
  }

  mayIntersectC(cell: S2Cell): boolean {
    return this.mayIntersectCell(cell);
  }

  public contains(id: S2CellId): boolean {
    let pos = S2CellId.binarySearch(this.cellIds, id.id);
    if (pos < 0) {
      pos = -pos - 1;
    }
    if (pos < this.cellIds.length && this.cellIds[pos].rangeMin().lessOrEquals(id)) {
      return true;
    }
    return pos !== 0 && this.cellIds[pos - 1].rangeMax().greaterOrEquals(id);
  }

  public intersects(id: S2CellId): boolean {
    let pos = S2CellId.binarySearch(this.cellIds, id.id);
    if (pos < 0) {
      pos = -pos - 1;
    }
    if (
      pos < this.cellIds.length &&
      this.cellIds[pos].rangeMin().lessOrEquals(id.rangeMax())
    ) {
      return true;
    }
    return (
      pos !== 0 && this.cellIds[pos - 1].rangeMax().greaterOrEquals(id.rangeMin())
    );
  }

  public containsUnion(that: S2CellUnion): boolean {
    for (let i = 0; i < that.cellIds.length; i++) {
      if (!this.contains(that.cellIds[i])) {
        return false;
      }
    }
    return true;
  }

  public containsCell(cell: S2Cell): boolean {
    return this.contains(cell.id);
  }

  public intersectsUnion(that: S2CellUnion): boolean {
    for (let i = 0; i < that.cellIds.length; i++) {
      if (this.intersects(that.cellIds[i])) {
        return true;
      }
    }
    return false;
  }

  public getUnion(x: S2CellUnion, y: S2CellUnion) {
    this.cellIds = [].concat(x.cellIds).concat(y.cellIds);
    this.normalize();
  }

  public getIntersection(x: S2CellUnion, id: S2CellId) {
    this.cellIds = [];
    if (x.contains(id)) {
      this.cellIds.push(id);
    } else {
      let pos = S2CellId.binarySearch(x.cellIds, id.rangeMin().id);
      if (pos < 0) {
        pos = -pos - 1;
      }
      const idmax = id.rangeMax();
      const size = x.cellIds.length;
      while (pos < size && x.cellIds[pos].lessOrEquals(idmax)) {
        this.cellIds.push(x.cellIds[pos++]);
      }
    }
  }

  public getIntersectionUU(x: S2CellUnion, y: S2CellUnion) {
    this.cellIds = [];

    let i = 0;
    let j = 0;

    while (i < x.cellIds.length && j < y.cellIds.length) {
      const imin = x.cellId(i).rangeMin();
      const jmin = y.cellId(j).rangeMin();

      if (imin.greaterThan(jmin)) {
        if (x.cellId(i).lessOrEquals(y.cellId(j).rangeMax())) {
          this.cellIds.push(x.cellId(i++));
        } else {
          j = S2CellId.indexedBinarySearch(y.cellIds, imin, j + 1);
          if (x.cellId(i).lessOrEquals(y.cellId(j - 1).rangeMax())) {
            --j;
          }
        }
      } else if (jmin.greaterThan(imin)) {
        if (y.cellId(j).lessOrEquals(x.cellId(i).rangeMax())) {
          this.cellIds.push(y.cellId(j++));
        } else {
          i = S2CellId.indexedBinarySearch(x.cellIds, jmin, i + 1);
          if (y.cellId(j).lessOrEquals(x.cellId(i - 1).rangeMax())) {
            --i;
          }
        }
      } else {
        if (x.cellId(i).lessThan(y.cellId(j))) {
          this.cellIds.push(x.cellId(i++));
        } else {
          this.cellIds.push(y.cellId(j++));
        }
      }
    }
  }

  public expand(level: number) {
    let output: S2CellId[] = [];
    const levelLsb = S2CellId.lowestOnBitForLevel(level); // bigint

    let i = this.size() - 1;
    do {
      let id = this.cellId(i);
      if (id.lowestOnBit() < levelLsb) {
        id = id.parentL(level);
        while (i > 0 && id.contains(this.cellId(i - 1))) {
          --i;
        }
      }
      output.push(id);
      output = output.concat(id.getAllNeighbors(level));
    } while (--i >= 0);
    this.initSwap(output);
  }

  public expandA(minRadius: S1Angle, maxLevelDiff: number) {
    let minLevel = S2CellId.MAX_LEVEL;
    for (let i = 0; i < this.cellIds.length; i++) {
      minLevel = Math.min(minLevel, this.cellId(i).level());
    }
    const radiusLevel = S2Projections.MIN_WIDTH.getMaxLevel(minRadius.radians);
    if (
      radiusLevel === 0 &&
      minRadius.radians > S2Projections.MIN_WIDTH.getValue(0)
    ) {
      this.expand(0);
    }
    this.expand(Math.min(minLevel + maxLevelDiff, radiusLevel));
  }

  public getCapBound(): S2Cap {
    if (this.cellIds.length === 0) {
      return S2Cap.empty();
    }
    let centroid = new S2Point(0, 0, 0);
    this.cellIds.forEach(id => {
      const area = S2Cell.averageArea(id.level());
      centroid = S2Point.add(centroid, S2Point.mul(id.toPoint(), area));
    });

    if (centroid.equals(S2Point.ORIGIN)) {
      centroid = S2Point.X_POS;
    } else {
      centroid = S2Point.normalize(centroid);
    }

    let cap = S2Cap.fromAxisChord(centroid, S1ChordAngle.ZERO);
    this.cellIds.forEach(id => {
      cap = cap.addCap(new S2Cell(id).getCapBound());
    });
    return cap;
  }

  public getRectBound(): S2LatLngRect {
    let bound = S2LatLngRect.empty();
    this.cellIds.forEach(id => {
      bound = bound.union(new S2Cell(id).getRectBound());
    });
    return bound;
  }

  public mayIntersectCell(cell: S2Cell): boolean {
    return this.intersects(cell.id);
  }

  public containsPoint(p: S2Point): boolean {
    return this.contains(S2CellId.fromPoint(p));
  }

  /**
   * The number of leaf cells covered by the union.
   *
   * v4: return type changed from Long to bigint.
   */
  public leafCellsCovered(): bigint {
    let numLeaves = 0n;
    this.cellIds.forEach((id: S2CellId) => {
      const invertedLevel = S2CellId.MAX_LEVEL - id.level();
      numLeaves += 1n << BigInt(invertedLevel << 1);
    });
    return numLeaves;
  }

  /**
   * Approximate area by summing the average area of each contained cell.
   *
   * v4: uses Number(bigint) instead of Long.toNumber().
   */
  public averageBasedArea(): number {
    return (
      Number(this.leafCellsCovered()) *
      S2Projections.AVG_AREA.getValue(S2CellId.MAX_LEVEL)
    );
  }

  public approxArea(): number {
    let area = 0;
    this.cellIds.forEach(id => {
      area += new S2Cell(id).approxArea();
    });
    return area;
  }

  public exactArea(): number {
    let area = 0;
    this.cellIds.forEach(id => {
      area += new S2Cell(id).exactArea();
    });
    return area;
  }

  public normalize(): boolean {
    const output: S2CellId[] = [];

    this.cellIds.sort((a, b) => a.compareTo(b));

    this.cellIds.forEach(id => {
      let size = output.length;
      if (output.length !== 0 && output[size - 1].contains(id)) {
        return;
      }

      while (
        output.length !== 0 &&
        id.contains(output[output.length - 1])
      ) {
        output.splice(output.length - 1, 1);
      }

      while (output.length >= 3) {
        size = output.length;
        // XOR of the four cell IDs must be zero for them to be siblings.
        if (
          (output[size - 3].id ^
            output[size - 2].id ^
            output[size - 1].id) !==
          id.id
        ) {
          break;
        }

        // Build a mask that blocks the two bits encoding the child position.
        let mask: bigint = id.lowestOnBit() << 1n;
        mask = u64(~(mask + (mask << 1n)));

        const idMasked = id.id & mask;
        if (
          (output[size - 3].id & mask) !== idMasked ||
          (output[size - 2].id & mask) !== idMasked ||
          (output[size - 1].id & mask) !== idMasked ||
          id.isFace()
        ) {
          break;
        }

        // Replace four children by their parent cell.
        output.splice(size - 3);
        id = id.parent();
      }
      output.push(id);
    });

    if (output.length < this.size()) {
      this.initRawSwap(output);
      return true;
    }
    return false;
  }
}
