import { S2Region } from "./S2Region";
import { S2LatLng } from "./S2LatLng";
export { Interval } from './Interval';
export { MutableInteger } from './MutableInteger';
export { R1Interval } from './R1Interval';
export { R2Vector } from './R2Vector';
export { S1Angle } from './S1Angle';
export { S1Interval } from './S1Interval';
export { S2 } from './S2';
export { S2Cap } from './S2Cap';
export { S2Cell } from './S2Cell';
export { S2CellId } from './S2CellId';
export { S2CellUnion } from './S2CellUnion';
export { S2LatLng } from './S2LatLng';
export { S2LatLngRect } from './S2LatLngRect';
export { S2Point } from './S2Point';
export { S2Projections } from './S2Projections';
export { S2Region } from './S2Region';
export { S2RegionCoverer } from './S2RegionCoverer';
export declare class Utils {
    /**
     * Calculates a region covering a circle
     * NOTE: The current implementation uses S2Cap while S2Loop would be better (S2Loop is not implemented yet)
     * @param center
     * @param radiusInKM
     * @param points the number of points to calculate. The higher the better precision
     * @returns {S2Region}
     */
    static calcRegionFromCenterRadius(center: S2LatLng, radiusInKM: number, points?: number): S2Region;
}
