import { S1ChordAngle } from "../src/S1ChordAngle";
import { expect, assert } from "chai";
import { getRandomFrame } from "./geometricTestCase";
import { S2Point } from "../src/S2Point";
import { S1Angle } from "../src/S1Angle";

describe('S2ChordAngle', () => {
  it('has working fromS2Point constructor', () => {
    for (let iter = 0; iter < 100; ++iter) {
      const frame = getRandomFrame();
      const x = frame.getCol(0);
      const y = frame.getCol(1);
      const z = frame.getCol(2);
      expect(S1ChordAngle.fromS2Point(z, z).toAngle().equals(S1Angle.ZERO)).to.eq(true);
      expect(S1ChordAngle.fromS2Point(S2Point.neg(z), z).toAngle().radians).to.be.closeTo(Math.PI, 1e-7)
      expect(S1ChordAngle.fromS2Point(x, z).toAngle().radians).to.be.closeTo(Math.PI / 2, 1e-13)
      const w = S2Point.normalize(S2Point.add(y, z));
      expect(S1ChordAngle.fromS2Point(w, z).toAngle().radians).to.be.closeTo(Math.PI / 4, 1e-13)
    }
  });
  it('has correct fromLength2', () => {
    expect(S1ChordAngle.fromLength2(0).toAngle().degrees()).to.eq(0.0);
    expect(S1ChordAngle.fromLength2(1).toAngle().degrees()).to.be.closeTo(60.0, 1e-13);
    expect(S1ChordAngle.fromLength2(2).toAngle().degrees()).to.be.closeTo(90.0, 1e-13);
    expect(S1ChordAngle.fromLength2(4).toAngle().degrees()).to.eq(180.0);
    expect(S1ChordAngle.fromLength2(5).toAngle().degrees()).to.eq(180.0);
  })

  it('converts from/to S1Angle correctly', () => {
    expect(S1ChordAngle.fromS1Angle(S1Angle.ZERO).toAngle().radians).to.eq(0.0);
    expect(S1ChordAngle.fromS1Angle(S1Angle.radians(Math.PI)).getLength2()).to.eq(4.0);
    expect(S1ChordAngle.fromS1Angle(S1Angle.radians(Math.PI)).toAngle().radians).to.eq(Math.PI);
    expect(S1ChordAngle.fromS1Angle(S1Angle.INFINITY).toAngle()).to.eq(S1Angle.INFINITY);
    expect(S1ChordAngle.fromS1Angle(S1Angle.radians(Number.POSITIVE_INFINITY)).toAngle()).to.eq(S1Angle.INFINITY);
    assert(S1ChordAngle.fromS1Angle(S1Angle.radians(-1)).toAngle().radians < 0.0);
    expect(S1ChordAngle.fromS1Angle(S1Angle.radians(1.0)).toAngle().radians).to.be.closeTo(1.0, 1e-13);
  })
});