import { describe, it, expect } from 'vitest';
import { S2LatLng } from "../src/S2LatLng";
import { S2Point } from "../src/S2Point";
import { S2LatLngRect } from "../src/S2LatLngRect";
import genLocs from './assets/cell-tests.json';
import { CellTestItem } from './test-types';

describe('S2LatLngRect', () => {
  it('should return correct Cap', () => {
    genLocs.forEach((i: CellTestItem) => {
      const llr = S2LatLngRect.fromLatLng(
          S2LatLng.fromDegrees(i.rectBound.lo.lat, i.rectBound.lo.lng),
          S2LatLng.fromDegrees(i.rectBound.hi.lat, i.rectBound.hi.lng)
      );
      const capBound = llr.getCapBound();
      //cap axis
      expect(capBound.axis.aequal(new S2Point(i.rectBound.cap.axis.x,i.rectBound.cap.axis.y,i.rectBound.cap.axis.z), 1e-15))
          .toBe(true);

      expect(capBound.angle().radians)
        .to.be.closeTo(parseFloat(i.rectBound.cap.angle), 1e-15);
      expect(capBound.height())
        .to.be.closeTo(parseFloat(i.rectBound.cap.height), 1e-15);

    });
  });

  describe('methods', () => {
    it('.isEmpty() should work', () => {
      expect(S2LatLngRect.empty().isEmpty())
          .toBe(true);
      expect(S2LatLngRect.full().isEmpty())
          .toBe(false);
    });
    it('.isFull() should work', () => {
      expect(S2LatLngRect.empty().isFull())
          .toBe(false);
      expect(S2LatLngRect.full().isFull())
          .toBe(true);
    });
    it('.containsLL and interiorContainsLL center should be true',() => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const center = target.getCenter();
      expect(target.containsLL(center)).toBe(true);
      expect(target.interiorContainsLL(center)).toBe(true);
    });
    it('.containsLL true and interiorContainsLL false for vertex',() => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      for (let i=0; i<4; i++) {
        const v = target.getVertex(i);
        expect(target.containsLL(v)).toBe(true);
        expect(target.interiorContainsLL(v)).toBe(false);
      }
    });
    it ('.addPoint should not modify rect if point is already within boundaries', () => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const newTarget = target.addPoint(S2LatLng.CENTER.toPoint());
      expect(target).not.toBe(newTarget); // OBJECT COMPARISON
      expect(target.equals(newTarget)).toBe(true); // CONTENT COMPARISON
    });
    it ('.addPointLL should not modify rect if point is vertex', () => {
      const target = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      for (let v=0; v<4; v++) {
        const newTarget = target.addPointLL(target.getVertex(v));
        expect(target).not.toBe(newTarget); // OBJECT COMPARISON
        expect(target.equals(newTarget)).toBe(true); // CONTENT COMPARISON
      }
    });

    it('.interiorContainsLLR & .containsLLR', () => {
      const one = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      const biggerOne = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(2,2));
      expect(biggerOne.interiorContainsLLR(one)).toBe(true);
      expect(one.interiorContainsLLR(biggerOne)).toBe(false);
      expect(one.interiorContainsLLR(one)).toBe(false);
      expect(one.containsLLR(one)).toBe(true);
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



      expect(center1Left.intersectsLLR(center1Right)).toBe(true); //Vertex SE (0,0)
      expect(center1Left.interiorIntersects(center1Right)).toBe(false); //exclude vertex
      // the other way around
      expect(center1Right.intersectsLLR(center1Left)).toBe(true); //Vertex NW (0,0)
      expect(center1Right.interiorIntersects(center1Left)).toBe(false); //exclude Vertex

      expect(center1Left.intersectsLLR(notMatching)).toBe(false);
      expect(center1Right.intersectsLLR(notMatching)).toBe(false);
    });

    it('getDistanceLL', () => {
      const tmp = S2LatLngRect.fromCenterSize(S2LatLng.CENTER, S2LatLng.fromDegrees(1,1));
      expect(tmp.getDistanceLL(S2LatLng.CENTER).radians).toBe(0);
      expect(tmp.getDistanceLL(tmp.getVertex(0)).radians).toBe(0);
      expect(tmp.getDistanceLL(tmp.getVertex(1)).radians).toBe(0);
      expect(tmp.getDistanceLL(tmp.getVertex(2)).radians).toBe(0);
      expect(tmp.getDistanceLL(tmp.getVertex(3)).radians).toBe(0);
      expect(tmp.getDistanceLL(S2LatLng.fromDegrees(2,0)).degrees()).toBe(1.5);
      expect(tmp.getDistanceLL(S2LatLng.fromDegrees(0,2)).degrees()-1.5).toBeLessThan(1e-13)
    })


  });

});
