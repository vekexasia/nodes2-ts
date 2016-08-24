import { S1Angle } from "./S1Angle";
import { S2Point } from "./S2Point";
/**
 * This class represents a point on the unit sphere as a pair of
 * latitude-longitude coordinates. Like the rest of the "geometry" package, the
 * intent is to represent spherical geometry as a mathematical abstraction, so
 * functions that are specifically related to the Earth's geometry (e.g.
 * easting/northing conversions) should be put elsewhere.
 *
 */
export declare class S2LatLng {
    /**
     * Approximate "effective" radius of the Earth in meters.
     */
    static EARTH_RADIUS_METERS: number;
    /** The center point the lat/lng coordinate system. */
    static CENTER: S2LatLng;
    latRadians: decimal.Decimal;
    lngRadians: decimal.Decimal;
    constructor(latRadians: number | decimal.Decimal, lngRadians: number | decimal.Decimal);
    latDegrees: decimal.Decimal;
    lngDegrees: decimal.Decimal;
    /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
    toPoint(): S2Point;
    /**
     * Returns a new S2LatLng based on this instance for which {@link #isValid()}
     * will be {@code true}.
     * <ul>
     * <li>Latitude is clipped to the range {@code [-90, 90]}
     * <li>Longitude is normalized to be in the range {@code [-180, 180]}
     * </ul>
     * <p>If the current point is valid then the returned point will have the same
     * coordinates.
     */
    normalized(): S2LatLng;
    static fromDegrees(latDegrees: number | decimal.Decimal, lngDegrees: number | decimal.Decimal): S2LatLng;
    static fromPoint(p: S2Point): S2LatLng;
    /**
     * Return true if the latitude is between -90 and 90 degrees inclusive and the
     * longitude is between -180 and 180 degrees inclusive.
     */
    isValid(): boolean;
    /**
     * Scales this point by the given scaling factor.
     * Note that there is no guarantee that the new point will be <em>valid</em>.
     */
    mul(m: decimal.Decimal | number): S2LatLng;
    static latitude(p: S2Point): S1Angle;
    static longitude(p: S2Point): S1Angle;
    equals(other: S2LatLng): boolean;
    pointAtDistance(_distanceInKm: number | decimal.Decimal, _bearingRadians: number | decimal.Decimal): S2LatLng;
    /**
     * Generates n LatLngs given a distance in km and the number of points wanted.
     * Generated points will be returned in a Clockwise order starting from North.
     * @param _distanceInKm
     * @param nPoints
     * @returns {S2LatLng[]}
     */
    pointsAtDistance(_distanceInKm: number | decimal.Decimal, nPoints?: number): S2LatLng[];
    getEarthDistance(other: S2LatLng): decimal.Decimal;
    getDistance(other: S2LatLng): S1Angle;
    toString(): string;
    toStringDegrees(): string;
    toGEOJSON(): {
        type: string;
        geometry: {
            type: string;
            coordinates: number[];
        };
        properties: {};
    };
}
