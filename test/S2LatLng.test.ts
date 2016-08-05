import {expect} from 'chai';
import {S2LatLng} from '../src/S2LatLng';
import {suite, test, slow, timeout, skip, only} from "mocha-typescript";
const {S2LatLng : NS2LatLng} = require('s2geometry-node');

@suite
class S2LatLng_test{
  @test constructo() {
    const a = S2LatLng.fromDegrees(10,10);
    const b = new NS2LatLng(10,10);
    expect(a.latRadians).equal(b.lat);
  }

}