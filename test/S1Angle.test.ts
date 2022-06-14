import { assert, expect } from 'chai';
import { S1Angle } from '../src/S1Angle';

const EPSILON = 1e-12;

describe('S1Angle', () => {
  it('passes basic tests', () => {
    // Check that the conversion between Pi radians and 180 degrees is exact.
    expect(S1Angle.radians(Math.PI).radians).to.eq(Math.PI);
    expect(S1Angle.radians(Math.PI).degrees()).to.eq(180.0);
    expect(S1Angle.degrees(180).radians).to.eq(Math.PI);
    expect(S1Angle.degrees(180).degrees()).to.eq(180.0);

    expect(S1Angle.radians(Math.PI / 2).degrees()).to.eq(90.0);

    // Check negative angles.
    expect(S1Angle.radians(-Math.PI / 2).degrees()).to.eq(-90.0);
    expect(S1Angle.degrees(-45).radians).to.eq(-Math.PI / 4);

    // Check that E5/E6/E7 representations work as expected.
    // assertEquals(S1Angle.e5(2000000), S1Angle.degrees(20));
    // assertEquals(S1Angle.e6(-60000000), S1Angle.degrees(-60));
    // assertEquals(S1Angle.e7(750000000), S1Angle.degrees(75));
    // assertEquals(S1Angle.e5(2000000), S1Angle.degrees(20));
    // assertEquals(S1Angle.e6(-60000000), S1Angle.degrees(-60));
    // assertEquals(S1Angle.e7(750000000), S1Angle.degrees(75));
    // assertEquals(1234567, S1Angle.degrees(12.34567).e5());
    // assertEquals(12345678, S1Angle.degrees(12.345678).e6());
    // assertEquals(-123456789, S1Angle.degrees(-12.3456789).e7());
  });

  it('handles math operations correctly', () => {
    expect(S1Angle.degrees(10).add(S1Angle.degrees(20)).degrees()).to.be.closeTo(30, EPSILON);
    expect(S1Angle.degrees(10).sub(S1Angle.degrees(20)).degrees()).to.be.closeTo(-10, EPSILON);
    expect(S1Angle.degrees(10).mul(2.0).degrees()).to.be.closeTo(20, EPSILON);
    expect(S1Angle.degrees(10).div(2.0).degrees()).to.be.closeTo(5, EPSILON);
    expect(S1Angle.degrees(0).cos()).to.be.closeTo(1.0, EPSILON);
    expect(S1Angle.degrees(90).sin()).to.be.closeTo(1.0, EPSILON);
    expect(S1Angle.degrees(45).tan()).to.be.closeTo(1.0, EPSILON);
  });

  it('calculates distances correctly', () => {
    expect(S1Angle.radians(Math.PI).distance(100.0)).to.be.closeTo(100.0 * Math.PI, EPSILON);
    expect(S1Angle.radians(Math.PI / 2).distance(100.0)).to.be.closeTo(50.0 * Math.PI, EPSILON);
    expect(S1Angle.radians(Math.PI / 4).distance(100.0)).to.be.closeTo(25.0 * Math.PI, EPSILON);
  })
});
