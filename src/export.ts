import {S2Region} from "./S2Region";
import {S2LatLng} from "./S2LatLng";
import {S2Cap} from "./S2Cap";
import {S2} from "./S2";
import {S2CellId} from "./S2CellId";
import {S2Projections} from "./S2Projections";
export * from './uint64';
export * from './compat';
export * from './Interval';
export * from './MutableInteger';
export * from './R1Interval';
export * from './R2Vector';
export * from './S1Angle';
export * from './S1Interval';
export * from './S2';
export * from './S2Cap';
export * from './S2Cell';
export * from './S2CellId';
export * from './S2CellUnion';
// export * from './S2EdgeIndex';
// export * from './S2EdgeUtil';
export * from './S2LatLng';
export * from './S2LatLngRect';
// export * from './S2Loop';
export * from './S2Point';
export * from './S2Projections';
export * from './S2Region';
export * from './S2RegionCoverer';

export class Utils {

  /**
   * Atomically updates the maximum cell level across all S2 classes.
   *
   * This sets the `MAX_LEVEL` field on `S2`, `S2CellId`, and `S2Projections`
   * in one call, keeping them in sync.
   *
   * **What changes:**
   * - `S2Cell.MAX_CELL_SIZE` (derived via getter from `S2CellId.MAX_LEVEL`)
   * - `S2Projections.MAX_SITI` (derived via getter)
   * - `S2CellId.getSizeIJ()` / `S2CellId.getSizeST()` size calculations
   * - Default max-level caps in `S2RegionCoverer` and `S2Metric`
   * - `S2CellId.isLeaf()` / `level()` detection of the leaf level
   *
   * **What does NOT change:**
   * - `S2CellId.POS_BITS` (always 61) — the 64-bit S2 cell ID bit layout is
   *   a fixed canonical format; changing it breaks encoding/decoding.
   * - `S2CellId.MAX_SIZE` (always 2^30) — the Hilbert-curve grid resolution.
   * - `S2CellId.WRAP_OFFSET` — derived from the fixed `POS_BITS`.
   *
   * For shorter cell tokens, use `parentL(desiredLevel)` or set
   * `S2RegionCoverer.maxLevel`; `toToken()` naturally produces compact hex
   * strings for lower-level cells (e.g. level 10 → 6 hex chars).
   *
   * @param level — integer in [1, 30]
   */
  static setMaxLevel(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > 30) {
      throw new RangeError(
        `MAX_LEVEL must be an integer in [1, 30], got ${level}`
      );
    }
    S2.MAX_LEVEL = level;
    S2CellId.MAX_LEVEL = level;
    S2Projections.MAX_LEVEL = level;
  }

  /**
   * Calculates a region covering a circle
   * NOTE: The current implementation uses S2Cap while S2Loop would be better (S2Loop is not implemented yet)
   * @param center
   * @param radiusInKM
   * @param points the number of points to calculate. The higher the better precision
   * @returns {S2Region}
   */
  static calcRegionFromCenterRadius(center:S2LatLng, radiusInKM:number, points=16):S2Region {
    const pointsAtDistance = center.pointsAtDistance(radiusInKM, points);
    let s2Cap = S2Cap.empty().addPoint(center.toPoint());
    // It would be probably enough to add one of the points/2 pair of opposite points in the circle such
    // as (0, points/2). but since this is just a temporary solution lets stick with this as it
    // will come handy when implementing S2Loop.
    pointsAtDistance
        .map(p => p.toPoint())
        .forEach(p => {
          s2Cap = s2Cap.addPoint(p);
        });
    return s2Cap;
  }
}
