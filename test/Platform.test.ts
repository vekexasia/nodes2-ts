import { assert, expect } from 'chai';
import { Platform } from '../src/Platform';
import { S2 } from '../src/S2';
import { S2Point } from '../src/S2Point';
import { S2Projections } from '../src/S2Projections';

describe('Platform', () => {
  it('should generate correct exponents', () => {
    expect(Platform.getExponent(-0.000000)).to.eq(-1023);
    expect(Platform.getExponent(-3.141593)).to.eq(1);
    expect(Platform.getExponent(-12.566371)).to.eq(3);
    expect(Platform.getExponent(-28.274334)).to.eq(4);
    expect(Platform.getExponent(-50.265482)).to.eq(5);
    expect(Platform.getExponent(-78.539816)).to.eq(6);
    expect(Platform.getExponent(-113.097336)).to.eq(6);
    expect(Platform.getExponent(-153.938040)).to.eq(7);
    expect(Platform.getExponent(-201.061930)).to.eq(7);
    expect(Platform.getExponent(-254.469005)).to.eq(7);
    expect(Platform.getExponent(Number.POSITIVE_INFINITY)).to.eq(1024);
    expect(Platform.getExponent(0.000000)).to.eq(-1023);
    expect(Platform.getExponent(3.141593)).to.eq(1);
    expect(Platform.getExponent(12.566371)).to.eq(3);
    expect(Platform.getExponent(28.274334)).to.eq(4);
    expect(Platform.getExponent(50.265482)).to.eq(5);
    expect(Platform.getExponent(78.539816)).to.eq(6);
    expect(Platform.getExponent(113.097336)).to.eq(6);
    expect(Platform.getExponent(153.938040)).to.eq(7);
    expect(Platform.getExponent(201.061930)).to.eq(7);
    expect(Platform.getExponent(254.469005)).to.eq(7);
    expect(Platform.getExponent(Number.NEGATIVE_INFINITY)).to.eq(1024);
    expect(Platform.getExponent(NaN)).to.eq(1024);
  })
  it('should generate correct IEEEramainder', () => {
    const numerators = [0, 1, -2, 7, Math.E, NaN, Number.NEGATIVE_INFINITY];
    const denominators = [0, -3, 4, Math.PI, NaN, Number.POSITIVE_INFINITY];
    // Expected results from the cross product of each [numerator, denominator] pair defined above.
    const results = [
      NaN,
      0,
      0,
      0,
      NaN,
      0,
      NaN,
      1.0,
      1.0,
      1.0,
      NaN,
      1.0,
      NaN,
      1.0,
      -2.0,
      1.1415926535897931,
      NaN,
      -2.0,
      NaN,
      1.0,
      -1.0,
      0.7168146928204138,
      NaN,
      7.0,
      NaN,
      -0.2817181715409549,
      -1.281718171540955,
      -0.423310825130748,
      NaN,
      2.718281828459045,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN
    ];
    let resultIndex = 0;
    for (const f1 of numerators) {
      for (const f2 of denominators) {
        const expected = results[resultIndex++];
        const actual = Platform.IEEEremainder(f1, f2);
        // Note that we can't just use assertEquals, since the GWT JUnit version returns false
        // for assertTrue(NaN, NaN).
        if (Number.isNaN(expected)) {
            assert.isNaN(actual)
        } else {
            expect(actual).to.eq(expected, `expected ${f1} % ${f2} to be ${expected} but got ${actual}`)
        }
      }
    }
  })
});
