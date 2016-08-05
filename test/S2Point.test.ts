import {expect} from 'chai';
import {S2Point} from '../src/S2Point';
import {suite, test, slow, timeout, skip, only} from "mocha-typescript";
const {S2Point : NS2Point} = require('s2geometry-node');

@suite
class S2Point_test_static {
  @test minus() {
    const prev = new S2Point(1, 2, 3);
    const next = new S2Point(3, 2, 1);
    expect(S2Point.minus(prev, next).equals(new S2Point(-2, 0, 2)))
    expect(S2Point.minus(next, prev).equals(new S2Point(2, 0, 2)))
  }

  @test largestAbsComponent() {
    let x = new S2Point(-3, 0, 1);
    expect(x.largestAbsComponent()).is.equal(0);

    x = new S2Point(0, -3, 1);
    expect(x.largestAbsComponent()).is.equal(1);

    x = new S2Point(0, 0, -3);
    expect(x.largestAbsComponent()).is.equal(2);
  }
}