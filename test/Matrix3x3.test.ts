import {Matrix3x3} from "../src/Matrix3x3";
import {expect} from "chai";

describe('Matrix3x3', () => {
  it('passes basic tests', () => {
    const m = Matrix3x3.fromValues(2, 1, 2, 3, 4, 5, 6);
    expect(m.getCols()).to.be.eq(2);
    expect(m.getRows()).to.be.eq(3);
    expect(m.get(0, 0)).to.be.eq(1);
    expect(m.get(2, 1)).to.be.eq(6);
    expect(m.get(1, 1)).to.be.eq(4);
    m.set(1, 1, 1);
    expect(m.get(1, 1)).to.be.eq(1);
  });

  it('transposes correctly', () => {
    const m = Matrix3x3.fromValues(2, 1, 2, 3, 4);
    expect(m.transpose().equals(Matrix3x3.fromValues(2, 1, 3, 2, 4))).to.eq(true);
  })

  it('multiplies correctly', () => {
    const a = Matrix3x3.fromValues(3, 1, 2, 3, 4, 5, 6);
    const b = Matrix3x3.fromValues(1, 3, 2, 1);
    const result = Matrix3x3.fromValues(1, 10, 28);
    expect(a.mult(b).equals(result)).to.eq(true);
  });
});