import {S2LatLng} from "../src/S2LatLng";
import {expect} from "chai";
import Decimal = require('decimal.js');
import {S1Angle} from "../src/S1Angle";
import {S2CellId} from "../src/S2CellId";
import Long = require('long');
import {S2Point} from "../src/S2Point";
import {S2} from "../src/S2";
import {S2Cap} from "../src/S2Cap";
import {S2RegionCoverer} from "../src/S2RegionCoverer";
import {S2Cell} from "../src/S2Cell";
const genLocs = require('./assets/latlng-tests.json');
describe('S2LatLng', () => {
  describe('creators', () => {
    it('should be able to create from radians', () => {
      genLocs.forEach(item => {
        const s2LatLng = new S2LatLng(item.latR, item.lngR);
        expect(s2LatLng.latRadians.toString()).to.be.eq(S2.toDecimal(item.latR).toString())
        expect(s2LatLng.lngRadians.toString()).to.be.eq(S2.toDecimal(item.lngR).toString())
      });
    });
    it('should be able to create from degrees', () => {
      genLocs
          .forEach(item => {
        const s2LatLng = S2LatLng.fromDegrees(item.latD, item.lngD);
        expect(s2LatLng.latRadians.toFixed(15)).to.be.eq(S2.toDecimal(item.latR).toFixed(15))

        expect(s2LatLng.lngRadians.toFixed(15)).to.be.eq(S2.toDecimal(item.lngR).toFixed(15))
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
            expect(s2LatLng.latRadians.toFixed(14)).to.be.eq(S2.toDecimal(item.latR).toFixed(14));
            expect(s2LatLng.lngRadians.toFixed(14)).to.be.eq(S2.toDecimal(item.lngR).toFixed(14));
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
            .to.be.eq(S2.toDecimal(item.item.distToCenter).toFixed(13));
      });
    });

    it('should calc dist to degrees correctly', () => {
      items.forEach(item => {
        expect(item.ll.getDistance(S2LatLng.CENTER).degrees().toFixed(11))
            .to.be.eq(S2.toDecimal(item.item.distToCenterD).toFixed(11));
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
    });
  });

  describe('other methods', () => {
    describe('.pointsAtDistance', () => {
      it('should be able to generate 8 point adjacent by 4 at a distance of 10km', () => {
        const pointsAtDistance = S2LatLng.CENTER.pointsAtDistance(10, 4);
        expect(pointsAtDistance.length).to.be.eq(4);
        pointsAtDistance.forEach(p => {
          expect(p.getEarthDistance(S2LatLng.CENTER).toNumber()).to.be.eq(10*1000);
        });

        // expect(pointsAtDistance[1].getEarthDistance(pointsAtDistance[3]).toNumber()).to.be.eq(2*10*1000);
      });
      it('should be able to generate opposite points every points/2', () => {
        const points = 16;
        const pointsAtDistance = S2LatLng.CENTER.pointsAtDistance(10, points);
        // opposite test.
        for (let i=0; i<points/2;i++) {
          expect(pointsAtDistance[i].getEarthDistance(pointsAtDistance[i+points/2]).toNumber()).to.be.eq(2*10*1000);
        }
      });

      it('every generated adj point should be equally distant', () => {
        const points = 16;
        const pointsAtDistance = S2LatLng.CENTER.pointsAtDistance(10, points);
        const firstDistance = pointsAtDistance[0].getEarthDistance(pointsAtDistance[1]).toNumber();
        for(let i=0;i<points-1; i++) {
          expect(pointsAtDistance[i].getEarthDistance(pointsAtDistance[i+1]).toNumber()).to.be.eq(firstDistance);
        }
      });
      /**/

      /*
      it('botroob', () => {
        const geojson = new S2Cell(S2CellId.fromToken('477bff')).toGEOJSON();
        console.log(JSON.stringify(geojson, null, 2));
      })
      /**/

    })

  })

});