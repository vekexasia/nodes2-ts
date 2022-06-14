import {S2Cap} from "../src/S2Cap";
import {expect, assert} from "chai";
import { S2Point } from "../src/S2Point";
import { S1Angle } from "../src/S1Angle";
import { S2LatLng } from "../src/S2LatLng";
import { S2 } from "../src/S2";
import { S2Cell } from "../src/S2Cell";
import { S2Projections } from "../src/S2Projections";

function getLatLngPoint(latDegrees: number, lngDegrees: number):S2Point {
  return S2LatLng.fromDegrees(latDegrees, lngDegrees).toPoint();
}

// About 9 times the double-precision roundoff relative error.
const EPS = 1e-15;

describe('S2Cap', () => {
  it('passes basic tests', () => {
    // Test basic properties of empty and full caps.
    const empty = S2Cap.empty();
    const full = S2Cap.full();
    assert(empty.isValid());
    assert(empty.isEmpty());
    assert(empty.complement().isFull());
    assert(full.isValid());
    assert(full.isFull());
    assert(full.complement().isEmpty());
    expect(full.height()).to.eq(2.0);
    expect(full.angle().degrees()).to.be.closeTo(180, 1e-9)

    // Test the S1Angle constructor using out-of-range arguments.
    assert(S2Cap.fromAxisAngle(S2Point.X_POS, S1Angle.radians(-20)).isEmpty());
    assert(S2Cap.fromAxisAngle(S2Point.X_POS, S1Angle.radians(5)).isFull());
    assert(S2Cap.fromAxisAngle(S2Point.X_POS, S1Angle.INFINITY).isFull());

    // Containment and intersection of empty and full caps.
    assert(empty.containsCap(empty));
    assert(full.containsCap(empty));
    assert(full.containsCap(full));
    assert(!empty.interiorIntersects(empty));
    assert(full.interiorIntersects(full));
    assert(!full.interiorIntersects(empty));

    // Singleton cap containing the x-axis.
    const xAxis = S2Cap.fromAxisHeight(new S2Point(1, 0, 0), 0);
    assert(xAxis.contains(new S2Point(1, 0, 0)));
    assert(!xAxis.contains(new S2Point(1, 1e-20, 0)));
    expect(xAxis.angle().radians).to.be.closeTo(0.0, 1e-9)

    // Singleton cap containing the y-axis.
    const yAxis = S2Cap.fromAxisAngle(new S2Point(0, 1, 0), S1Angle.radians(0));
    assert(!yAxis.contains(xAxis.axis));
    expect(xAxis.height()).to.eq(0.0);

    // Check that the complement of a singleton cap is the full cap.
    const xComp = xAxis.complement();
    assert(xComp.isValid());
    assert(xComp.isFull());
    assert(xComp.contains(xAxis.axis));

    // Check that the complement of the complement is *not* the original.
    assert(xComp.complement().isValid());
    assert(xComp.complement().isEmpty());
    assert(!xComp.complement().contains(xAxis.axis));

    // Check that very small caps can be represented accurately.
    // Here "kTinyRad" is small enough that unit vectors perturbed by this
    // amount along a tangent do not need to be renormalized.
    const kTinyRad = 1e-10;
    const tiny =
        S2Cap.fromAxisAngle(S2Point.normalize(new S2Point(1, 2, 3)), S1Angle.radians(kTinyRad));
    const tangent = S2Point.normalize(S2Point.crossProd(tiny.axis, new S2Point(3, 2, 1)));
    assert(tiny.contains(S2Point.add(tiny.axis, S2Point.mul(tangent, 0.99 * kTinyRad))));
    assert(!tiny.contains(S2Point.add(tiny.axis, S2Point.mul(tangent, 1.01 * kTinyRad))));

    // Basic tests on a hemispherical cap.
    const hemi = S2Cap.fromAxisHeight(S2Point.normalize(new S2Point(1, 0, 1)), 1);
    expect(hemi.complement().axis.equals(S2Point.neg(hemi.axis))).to.eq(true);
    expect(hemi.complement().height()).to.eq(1.0);
    assert(hemi.contains(new S2Point(1, 0, 0)));
    assert(!hemi.complement().contains(new S2Point(1, 0, 0)));
    assert(hemi.contains(S2Point.normalize(new S2Point(1, 0, -(1 - EPS)))));
    assert(!hemi.interiorContains(S2Point.normalize(new S2Point(1, 0, -(1 + EPS)))));

    // A concave cap.
    const concave = S2Cap.fromAxisAngle(getLatLngPoint(80, 10), S1Angle.degrees(150));
    assert(concave.contains(getLatLngPoint(-70 * (1 - EPS), 10)));
    assert(!concave.contains(getLatLngPoint(-70 * (1 + EPS), 10)));
    assert(concave.contains(getLatLngPoint(-50 * (1 - EPS), -170)));
    assert(!concave.contains(getLatLngPoint(-50 * (1 + EPS), -170)));

    // Cap containment tests.
    assert(!empty.containsCap(xAxis));
    assert(!empty.interiorIntersects(xAxis));
    assert(full.containsCap(xAxis));
    assert(full.interiorIntersects(xAxis));
    assert(!xAxis.containsCap(full));
    assert(!xAxis.interiorIntersects(full));
    assert(xAxis.containsCap(xAxis));
    assert(!xAxis.interiorIntersects(xAxis));
    assert(xAxis.containsCap(empty));
    assert(!xAxis.interiorIntersects(empty));
    assert(hemi.containsCap(tiny));
    assert(
        hemi.containsCap(S2Cap.fromAxisAngle(new S2Point(1, 0, 0), S1Angle.radians(S2.M_PI_4 - EPS))));
    assert(
        !hemi.containsCap(
            S2Cap.fromAxisAngle(new S2Point(1, 0, 0), S1Angle.radians(S2.M_PI_4 + EPS))));
    assert(concave.containsCap(hemi));
    assert(concave.interiorIntersects(hemi.complement()));
    assert(!concave.containsCap(S2Cap.fromAxisHeight(S2Point.neg(concave.axis), 0.1)));
  });
  it('has correct rectBound', () => {
    // Empty and full caps.
    assert(S2Cap.empty().getRectBound().isEmpty());
    assert(S2Cap.full().getRectBound().isFull());

    const kDegreeEps = 1e-13;
    // Maximum allowable error for latitudes and longitudes measured in
    // degrees. (assertDoubleNear uses a fixed tolerance that is too small.)

    // Cap that includes the south pole.
    let rect =
        S2Cap.fromAxisAngle(getLatLngPoint(-45, 57), S1Angle.degrees(50)).getRectBound();
    assertDoubleNear(rect.latLo().degrees(), -90, kDegreeEps);
    assertDoubleNear(rect.latHi().degrees(), 5, kDegreeEps);
    assert(rect.lng.isFull());

    // Cap that is tangent to the north pole.
    rect =
        S2Cap.fromAxisAngle(S2Point.normalize(new S2Point(1, 0, 1)), S1Angle.radians(S2.M_PI_4))
            .getRectBound();
    assertDoubleNear(rect.lat.lo, 0);
    assertDoubleNear(rect.lat.hi, S2.M_PI_2);
    assert(rect.lng.isFull());

    rect =
        S2Cap.fromAxisAngle(S2Point.normalize(new S2Point(1, 0, 1)), S1Angle.degrees(45))
            .getRectBound();
    assertDoubleNear(rect.latLo().degrees(), 0, kDegreeEps);
    assertDoubleNear(rect.latHi().degrees(), 90, kDegreeEps);
    assert(rect.lng.isFull());

    // The eastern hemisphere.
    rect =
        S2Cap.fromAxisAngle(new S2Point(0, 1, 0), S1Angle.radians(S2.M_PI_2 + 5e-16))
            .getRectBound();
    assertDoubleNear(rect.latLo().degrees(), -90, kDegreeEps);
    assertDoubleNear(rect.latHi().degrees(), 90, kDegreeEps);
    assert(rect.lng.isFull());

    // A cap centered on the equator.
    rect = S2Cap.fromAxisAngle(getLatLngPoint(0, 50), S1Angle.degrees(20)).getRectBound();
    assertDoubleNear(rect.latLo().degrees(), -20, kDegreeEps);
    assertDoubleNear(rect.latHi().degrees(), 20, kDegreeEps);
    assertDoubleNear(rect.lngLo().degrees(), 30, kDegreeEps);
    assertDoubleNear(rect.lngHi().degrees(), 70, kDegreeEps);

    // A cap centered on the north pole.
    rect = S2Cap.fromAxisAngle(getLatLngPoint(90, 123), S1Angle.degrees(10)).getRectBound();
    assertDoubleNear(rect.latLo().degrees(), 80, kDegreeEps);
    assertDoubleNear(rect.latHi().degrees(), 90, kDegreeEps);
    assert(rect.lng.isFull());
  })

  it('passes cell tests', () => {
    // For each cube face, we construct some cells on
    // that face and some caps whose positions are relative to that face,
    // and then check for the expected intersection/containment results.

    // The distance from the center of a face to one of its vertices.
    const kFaceRadius = Math.atan(S2.M_SQRT2);

    for (let face = 0; face < 6; ++face) {
      // The cell consisting of the entire face.
      const rootCell = S2Cell.fromFace(face);

      // A leaf cell at the midpoint of the v=1 edge.
      const edgeCell = S2Cell.fromPoint(S2Projections.faceUvToXyz(face, 0, 1 - EPS));

      // A leaf cell at the u=1, v=1 corner.
      const cornerCell = S2Cell.fromPoint(S2Projections.faceUvToXyz(face, 1 - EPS, 1 - EPS));

      // Quick check for full and empty caps.
      assert(S2Cap.full().containsC(rootCell));
      assert(!S2Cap.empty().mayIntersectC(rootCell));

      // Check intersections with the bounding caps of the leaf cells that are
      // adjacent to 'corner_cell' along the Hilbert curve. Because this corner
      // is at (u=1,v=1), the curve stays locally within the same cube face.
      const first = cornerCell.id.prev().prev().prev();
      const last = cornerCell.id.next().next().next().next();
      for (let id = first; id.lessThan(last); id = id.next()) {
        const cell = new S2Cell(id);
        expect(cell.getCapBound().containsC(cornerCell)).to.eq(id.equals(cornerCell.id));
        expect(
            cell.getCapBound().mayIntersectC(cornerCell)).to.be.eq(id.parent().contains(cornerCell.id));
      }

      const antiFace = (face + 3) % 6; // Opposite face.
      for (let capFace = 0; capFace < 6; ++capFace) {
        // A cap that barely contains all of 'cap_face'.
        const center = S2Projections.getNorm(capFace);
        const covering = S2Cap.fromAxisAngle(center, S1Angle.radians(kFaceRadius + EPS));
        expect(covering.containsC(rootCell)).to.be.eq(capFace == face);
        expect(covering.mayIntersectC(rootCell)).to.be.eq(capFace != antiFace);
        expect(covering.containsC(edgeCell)).to.be.eq(center.dotProd(edgeCell.getCenter()) > 0.1);
        expect(covering.containsC(edgeCell)).to.be.eq(covering.mayIntersectC(edgeCell));
        expect(covering.containsC(cornerCell)).to.be.eq(capFace == face);
        expect(covering.mayIntersectC(cornerCell)).to.be.eq(center.dotProd(cornerCell.getCenter()) > 0);

        // A cap that barely intersects the edges of 'cap_face'.
        const bulging = S2Cap.fromAxisAngle(center, S1Angle.radians(S2.M_PI_4 + EPS));
        assert(!bulging.containsC(rootCell));
        expect(bulging.mayIntersectC(rootCell)).to.be.eq( capFace != antiFace);
        expect(bulging.containsC(edgeCell)).to.be.eq( capFace == face);
        expect(bulging.mayIntersectC(edgeCell)).to.be.eq( center.dotProd(edgeCell.getCenter()) > 0.1);
        assert(!bulging.containsC(cornerCell));
        assert(!bulging.mayIntersectC(cornerCell));

        // A singleton cap.
        const singleton = S2Cap.fromAxisAngle(center, S1Angle.radians(0));
        expect(singleton.mayIntersectC(rootCell)).to.be.eq(capFace == face);
        assert(!singleton.mayIntersectC(edgeCell));
        assert(!singleton.mayIntersectC(cornerCell));
      }
    }
  })
});

function assertDoubleNear(arg0: number, arg1: number, kDegreeEps: number = 1e-9) {
  expect(arg1).to.be.closeTo(arg1, kDegreeEps);
}
