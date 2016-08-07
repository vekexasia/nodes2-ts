import {S2LatLng} from "../src/S2LatLng";
import {expect} from "chai";
import Decimal = require('decimal.js');
import {S1Angle} from "../src/S1Angle";
import {S2CellId} from "../src/S2CellId";
import Long = require('long');
import {S2Point} from "../src/S2Point";
const genLocs = require('./java-gen-locations.json');
describe('S2LatLng', () => {

  it('point conversion', () => {
    genLocs.forEach(
        item => {
          const s2LatLng = S2LatLng.fromDegrees(item.coords.lat, item.coords.lng);
          const s2Point = new S2Point(item.point.x, item.point.y, item.point.z);
          expect(
              s2Point.aequal( s2LatLng.toPoint(), 1e-15)
          ).to.be.true;
        }
    );
    // const s2LatLng = new S2LatLng(0.12, 0.12);
    // const s2Point = s2LatLng.toPoint();
    // const oS2LL = S2LatLng.fromPoint(s2Point);
    //
    // expect(oS2LL.latRadians.toString()).to.be.eq(s2LatLng.latRadians.toString());
    // expect(oS2LL.lngRadians.toString()).to.be.eq(s2LatLng.lngRadians.toString());
  })
  //
  // it('point conversion', () => {
  //   genLocs
  //       // .map(({lat, lng, cellid})=> ({lat, lng, cellid}))
  //       .forEach(item => {
  //         const s2LatLng2 = S2CellId.fromToken(item.token).toLatLng();
  //         console.log('aa');
  //         console.log(s2LatLng2.toString());
  //         const s2LatLng = S2LatLng.fromDegrees(new Decimal(item.lat), new Decimal(item.lng));
  //         console.log(s2LatLng.toString());
  //         const point1 = s2LatLng.toPoint();
  //         let newS2LatLng = S2LatLng.fromPoint(point1);
  //         console.log(newS2LatLng.toString());
  //         console.log(newS2LatLng.normalized().toString());
  //         const point2 = newS2LatLng.toPoint();
  //         expect(point1.aequal(point2, 1e-15)).is.true;
  //
  //         expect(newS2LatLng.lngRadians.toString()).is.equals(s2LatLng.lngRadians.toString());
  //
  //       });
  // });
  
});