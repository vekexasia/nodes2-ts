
import {S2LatLng} from "../src/S2LatLng";
import {expect} from "chai";
import Decimal = require('decimal.js');
import {S1Angle} from "../src/S1Angle";
import {S2CellId} from "../src/S2CellId";
import Long = require('long');
import {S2Point} from "../src/S2Point";
import {S2} from "../src/S2";
import {S2LatLngRect} from "../src/S2LatLngRect";
const genLocs = require('./assets/cell-tests.json');
describe('S2LatLngRect', () => {
  it('should return correct Cap', () => {
    genLocs.forEach(i => {
      const llr = S2LatLngRect.fromLatLng(
          S2LatLng.fromDegrees(i.rectBound.lo.lat, i.rectBound.lo.lng),
          S2LatLng.fromDegrees(i.rectBound.hi.lat, i.rectBound.hi.lng)
      );
      const capBound = llr.getCapBound();
      //cap axis
      expect(capBound.axis.aequal(new S2Point(i.rectBound.cap.axis.x,i.rectBound.cap.axis.y,i.rectBound.cap.axis.z), 1e-15))
          .is.true;

      expect(capBound.angle().radians.minus(i.rectBound.cap.angle).abs().toNumber())
          .to.be.lessThan(1e-15);

      expect(capBound.height.minus(i.rectBound.cap.height).abs().toNumber())
          .to.be.lessThan(1e-15);
    });
  });

  describe('methods', () => {
    it('.isEmpty() should work', () => {
      expect(S2LatLngRect.empty().isEmpty())
          .is.true;
      expect(S2LatLngRect.full().isEmpty())
          .is.false;
    });
    it('.isFull() should work', () => {
      expect(S2LatLngRect.empty().isFull())
          .is.false;
      expect(S2LatLngRect.full().isFull())
          .is.true;
    });
    it('.containsLL and interiorContainsLL center should be true',() => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const center = target.getCenter();
      expect(target.containsLL(center)).is.true;
      expect(target.interiorContainsLL(center)).is.true;
    });
    it('.containsLL true and interiorContainsLL false for vertex',() => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      for (let i=0; i<4; i++) {
        const v = target.getVertex(i);
        expect(target.containsLL(v)).is.true;
        expect(target.interiorContainsLL(v)).is.false;
      }
    });
    it ('.addPoint should not modify rect if point is already within boundaries', () => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const newTarget = target.addPoint(S2LatLng.CENTER.toPoint());
      expect(target).is.not.eq(newTarget); // OBJECT COMPARISON
      expect(target.equals(newTarget)).is.true; // CONTENT COMPARISON
    });
    it ('.addPointLL should not modify rect if point is vertex', () => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      for (let v=0; v<4; v++) {
        const newTarget = target.addPointLL(target.getVertex(v));
        expect(target).is.not.eq(newTarget); // OBJECT COMPARISON
        expect(target.equals(newTarget)).is.true; // CONTENT COMPARISON
      }
    });

    it('.interiorContainsLLR & .containsLLR', () => {
      const one = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const biggerOne = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(2,2));
      expect(biggerOne.interiorContainsLLR(one)).is.true;
      expect(one.interiorContainsLLR(biggerOne)).is.false;
      expect(one.interiorContainsLLR(one)).is.false;
      expect(one.containsLLR(one)).is.true;
    });

    it('intersectsLLR & interiorIntersectsLLR', () => {
      const center1Left = S2LatLngRect.fromLatLng(
          S2LatLng.fromDegrees(-1, -1),
          S2LatLng.CENTER
      );
      const center1Right = S2LatLngRect.fromLatLng(
          S2LatLng.CENTER,
          S2LatLng.fromDegrees(1,1)
      );

      const notMatching = S2LatLngRect.fromLatLng(
          S2LatLng.fromDegrees(-1, 0.1),
          S2LatLng.fromDegrees(-0.1, 1)
      );



      expect(center1Left.intersectsLLR(center1Right)).is.true; //Vertex SE (0,0)
      expect(center1Left.interiorIntersects(center1Right)).is.false; //exclude vertex
      // the other way around
      expect(center1Right.intersectsLLR(center1Left)).is.true; //Vertex NW (0,0)
      expect(center1Right.interiorIntersects(center1Left)).is.false; //exclude Vertex

      expect(center1Left.intersectsLLR(notMatching)).is.false;
      expect(center1Right.intersectsLLR(notMatching)).is.false;
    });

    it('getDistanceLL', () => {
      const tmp = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      expect(tmp.getDistanceLL(S2LatLng.CENTER).radians.toNumber()).is.eq(0);
      expect(tmp.getDistanceLL(tmp.getVertex(0)).radians.toNumber()).is.eq(0);
      expect(tmp.getDistanceLL(tmp.getVertex(1)).radians.toNumber()).is.eq(0);
      expect(tmp.getDistanceLL(tmp.getVertex(2)).radians.toNumber()).is.eq(0);
      expect(tmp.getDistanceLL(tmp.getVertex(3)).radians.toNumber()).is.eq(0);
      expect(tmp.getDistanceLL(S2LatLng.fromDegrees(2,0)).degrees().toNumber()).is.eq(1.5);
      expect(tmp.getDistanceLL(S2LatLng.fromDegrees(0,2)).degrees().toNumber()-1.5).is.lessThan(1e-15)
    })


  });

});