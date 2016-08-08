import {S2LatLng} from "../src/S2LatLng";
import {expect} from "chai";
import Decimal = require('decimal.js');
import {S1Angle} from "../src/S1Angle";
import {S2CellId} from "../src/S2CellId";
import Long = require('long');
import {S2Point} from "../src/S2Point";
const genLocs = require('./assets/latlng-tests.json');
describe('S2LatLng', () => {
  describe('creators', () => {
    it('should be able to create from radians', () => {
      genLocs.forEach(item => {
        const s2LatLng = new S2LatLng(item.latR, item.lngR);
        expect(s2LatLng.latRadians.toString()).to.be.eq(new Decimal(item.latR).toString())
        expect(s2LatLng.lngRadians.toString()).to.be.eq(new Decimal(item.lngR).toString())
      });
    });
    it('should be able to create from degrees', () => {
      genLocs
          .forEach(item => {
        const s2LatLng = S2LatLng.fromDegrees(item.latD, item.lngD);
        expect(s2LatLng.latRadians.toFixed(15)).to.be.eq(new Decimal(item.latR).toFixed(15))

        expect(s2LatLng.lngRadians.toFixed(15)).to.be.eq(new Decimal(item.lngR).toFixed(15))
      });
    });

    it('should be able to create from point', () => {
      genLocs
          .filter((item,idx) => idx>2)
          .forEach(item => {
            const s2LatLng = S2LatLng.fromPoint(new S2Point(
               // 1,1,1
            item.point.x,
                item.point.y,
                item.point.z
            ));
            expect(s2LatLng.latRadians.toFixed(14)).to.be.eq(new Decimal(item.latR).toFixed(14));
            expect(s2LatLng.lngRadians.toFixed(14)).to.be.eq(new Decimal(item.lngR).toFixed(14));
          })
    });
  });

  describe('once created', () => {
    let items = [];
    before(() => {
      items = genLocs.map(item => {
        return {
          item,
          ll: new S2LatLng(item.latR, item.lngR)
        }
      });
    });

    it('should calculate distance correctly', () => {
      items.forEach(item => {
        expect(item.ll.getDistance(S2LatLng.CENTER).radians.toFixed(13))
            .to.be.eq(new Decimal(item.item.distToCenter).toFixed(13));
      });
    });

    it('should calc dist to degrees correctly', () => {
      items.forEach(item => {
        expect(item.ll.getDistance(S2LatLng.CENTER).degrees().toFixed(11))
            .to.be.eq(new Decimal(item.item.distToCenterD).toFixed(11));
      });
    });

    it('should create point similar to original one', () => {
      items.forEach(item => {
        const s2Point = new S2Point(item.item.point.x, item.item.point.y, item.item.point.z);
        expect(
            item.ll.toPoint().aequal(s2Point, 1e-15),
            `calc: ${item.ll.toPoint().toString()} - orig: ${s2Point.toString()}`
        ).is.true;
      });
    })
  });
  // it('point conversion', () => {
  //   genLocs.forEach(
  //       item => {
  //         const s2LatLng = S2LatLng.fromDegrees(item.coords.lat, item.coords.lng);
  //         const s2Point = new S2Point(item.point.x, item.point.y, item.point.z);
  //         expect(
  //             s2Point.aequal( s2LatLng.toPoint(), 1e-15),
  //             `calc: ${s2LatLng.toPoint().toString()} - orig: `
  //         ).to.be.true;
  //       }
  //   );
    // const s2LatLng = new S2LatLng(0.12, 0.12);
    // const s2Point = s2LatLng.toPoint();
    // const oS2LL = S2LatLng.fromPoint(s2Point);
    //
    // expect(oS2LL.latRadians.toString()).to.be.eq(s2LatLng.latRadians.toString());
    // expect(oS2LL.lngRadians.toString()).to.be.eq(s2LatLng.lngRadians.toString());
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