import {S2Point} from "../src/S2Point";
import {expect} from "chai";
import {S2LatLng} from "../src/S2LatLng";
// const genLocs = require('./generated-locations.json');
describe('S2Point', () => {
  describe('real data', () => {
    // let points;
    // before(() => {
    //   points = genLocs.map(({lat, lng, cellid})=> S2LatLng.fromDegrees(lat, lng).toPoint());
    // });
    // it('should provide correct face', () => {
    //   genLocs.forEach((item, idx) => {
    //     expect(item.f).to.be.equal(points[idx].toFace());
    //   });
    // });
    // it('.toR2Vector should privide correct u,v values', () => {
    //   genLocs.forEach((item, idx) => {
    //     const r2Vector = points[idx].toR2Vector();
    //
    //     expect(item.u).to.be.within(r2Vector.x.minus(1e-15).toNumber(), r2Vector.x.plus(1e-15).toNumber());
    //     expect(item.v).to.be.within(r2Vector.y.minus(1e-15).toNumber(), r2Vector.y.plus(1e-15).toNumber());
    //   })
    // });
    // genLocs.map(({lat,lng,cellid})=> ({lat,lng,cellid}))
    //     .forEach(item => {
    //       const s2LatLng = S2LatLng.fromDegrees(item.lat, item.lng);
    //       const point1 = s2LatLng.toPoint();
    //       let newS2LatLng = S2LatLng.fromPoint(point1);
    //       const point2 = newS2LatLng.toPoint();
    //       expect(point1.aequal(point2, 1e-15)).is.true;
    //     });
  })
});