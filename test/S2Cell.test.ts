import { describe, it, expect, beforeAll } from 'vitest';
import { S2Cell } from "../src/S2Cell";
import { S2CellId } from "../src/S2CellId";
import { S2LatLngRect } from "../src/S2LatLngRect";
import { R1Interval } from "../src/R1Interval";
import { S1Interval } from "../src/S1Interval";
import { S1Angle } from "../src/S1Angle";
import { S2Point } from "../src/S2Point";
import genJavaLocs from './assets/cell-tests.json';

/** Convert a signed-decimal Java Long string to unsigned decimal. */
const toU = (s: string): string => BigInt.asUintN(64, BigInt(s)).toString();

describe('S2Cell', () => {
  describe('java data', () => {
    let items: Array<{item: any, cell: S2Cell}>;
    beforeAll(() => {
      items = genJavaLocs.map((item: any) => {
        return {
          item,
          cell: new S2Cell(new S2CellId(item.id))
        }
      });
    });
    it('should set id equal', () => {
      items.forEach(
          i => {
            expect(i.cell.id.id.toString()).to.be.eq(toU(i.item.id));
          }
      );
    });
    it('should have correct face', () => {
      items.forEach(
          i => {
            const cell = i.cell as S2Cell;
            expect(cell.level).to.be.eq(i.item.lvl);
          }
      )
    });

    it('should have correct orientation', () => {
      items.forEach(
          i => {
            const cell = i.cell as S2Cell;
            expect(cell.orientation).to.be.eq(i.item.orient);
          }
      )
    });

    it('should have same exactArea', () => {
      items.forEach(
          i => {
            const cell = i.cell as S2Cell;
            expect(cell.exactArea())
              .to.be.closeTo(parseFloat(i.item.exactArea), 1e-5);
          }
      )
    });
    it('should have same rectBound', () => {
      items.forEach(
          i => {
            const cell = i.cell as S2Cell;
            const rectBound = cell.getRectBound();
            const origBound = new S2LatLngRect(
                R1Interval.fromPointPair(S1Angle.degrees(i.item.rectBound.lo.lat).radians,S1Angle.degrees(i.item.rectBound.hi.lat).radians),
                S1Interval.fromPointPair(S1Angle.degrees(i.item.rectBound.lo.lng).radians,S1Angle.degrees(i.item.rectBound.hi.lng).radians)
            );
            // console.log(`CALC ${rectBound.toString()}\nORIG ${origBound.toString()}`);
            expect(rectBound.approxEquals(origBound)).toBe(true);
          }
      )
    });
    it ('should have same center point', () => {
      items.forEach(
          i => {
            const cell = i.cell as S2Cell;
            const center = cell.getCenter();
            const origCenter = new S2Point(
                i.item.center.x,
                i.item.center.y,
                i.item.center.z
            );
            // console.log(`CALC ${rectBound.toString()}\nORIG ${origBound.toString()}`);
            expect(center.aequal(origCenter, 1e-15)).toBe(true);
          }
      )
    });
    [0,1,2,3].forEach(idxVertex => {
      it( `should have same ${idxVertex+1} vertex`, () => {
        items.forEach(
            i => {
              const cell = i.cell as S2Cell;
              const calcVertex = cell.getVertex(idxVertex);
              const origVertex = new S2Point(
                  i.item.vertices[idxVertex].x,
                  i.item.vertices[idxVertex].y,
                  i.item.vertices[idxVertex].z
              );
              expect(calcVertex.aequal(origVertex, 1e-15)).toBe(true);

            });
      });
      it( `should have same ${idxVertex+1} edge`, () => {
        items.forEach(
            i => {
              const cell = i.cell as S2Cell;
              const calcEdge = cell.getEdge(idxVertex);
              const origEdge = new S2Point(
                  i.item.edges[idxVertex].x,
                  i.item.edges[idxVertex].y,
                  i.item.edges[idxVertex].z
              );
              expect(calcEdge.aequal(origEdge, 1e-15)).toBe(true);

            });
      });
    });
  });
});
