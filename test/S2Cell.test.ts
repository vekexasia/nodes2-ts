/// <reference path="../typings/index.d.ts" />
/// <reference path="../typings/4compilation.d.ts" />

import {S2Cell} from "../src/S2Cell";
const genJavaLocs = require('./assets/cell-tests.json');
import Decimal = require('decimal.js');
import Long = require('long');
declare var __dirname;

import {expect} from "chai";
import {S2CellId} from "../src/S2CellId";
import {S2LatLngRect} from "../src/S2LatLngRect";
import {R1Interval} from "../src/R1Interval";
import {S1Interval} from "../src/S1Interval";
import {S1Angle} from "../src/S1Angle";
import {S2Point} from "../src/S2Point";
// import {S2Cap} from "../src/S2Cap";
// import {S2RegionCoverer} from "../src/S2RegionCoverer";
// import {S2LatLng} from "../src/S2LatLng";
// S2Cap.addCap()
describe('S2Cell', () => {
  describe('java data', () => {
    let items: [{item:any, cell:S2Cell}];
    before(() => {
      items = genJavaLocs.map(item => {
        return {
          item,
          cell: new S2Cell(new S2CellId(item.id))
        }
      });
    });
    it('should set id equal', () => {
      items.forEach(
          i => {
            expect(i.cell.id.id.toString()).to.be.eq(i.item.id);
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
            expect(cell.exactArea().minus(i.item.exactArea).abs().toNumber())
                .to.be.lt(1e-20);
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
            expect(rectBound.approxEquals(origBound)).is.true;
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
            expect(center.aequal(origCenter, 1e-15)).is.true;
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
              expect(calcVertex.aequal(origVertex, 1e-15)).is.true

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
              expect(calcEdge.aequal(origEdge, 1e-15)).is.true

            });
      });
    });
  });


/*
  it('bauauau', () => {
    const s2Cap = Utils.calcRegionFromCenterRadius(S2LatLng.fromDegrees(45.5334, 12.6438), 100) as S2Cap;
    // let s2Cap = S2Cap.empty();
    // const center = S2LatLng.fromDegrees(45.5334, 12.6438);
    // const pointsAtDistance = center.pointsAtDistance(100, 16);
    // let bits = []
    //
    // s2Cap = s2Cap.addPoint(center.toPoint());
    //
    //
    // pointsAtDistance
    //     .map(p => p.toPoint())
    //     .forEach(p => {
    //       s2Cap = s2Cap.addPoint(p);
    //       bits.push(s2Cap.toGEOJSON());
    //     });
    // console.log(s2Cap.axis.toString())
    // console.log(s2Cap.height.toString())
    // const geoJSONPoints = pointsAtDistance
    //     .map(p => p.toGEOJSON()) as any
    // console.log(JSON.stringify(s2Cap.toGEOJSON()));
    // if (Math.random() <10) return;
    const coverer = new S2RegionCoverer();
    const bit = coverer.setMaxCells(29)
    // .setMinLevel(7)
        .setMinLevel(6)
        .setMaxLevel(16)
        .setLevelMod(2)
        .getCoveringCells(s2Cap)
        .map(c => {
          console.log(c.toToken()+ ' ' +c.level());
          return c;
        })
        .map(c => new S2Cell(c))
        .map(c => c.toGEOJSON())
        // .concat(geoJSONPoints)
        // .concat(s2Cap.toGEOJSON())
    // if (Math.random()<10)throw new Error('');
    // .map(c => c.getRectBound())
    // .map(c => c.)

    require('fs').writeFileSync(__dirname+'/assets/cap-node.json', (JSON.stringify({
      type: 'FeatureCollection',
      features: bit
          // .concat(geoJSONPoints)
    })));
    // console.log(JSON.stringify(bit,null,2));
    // console.log(s2Cap.getRectBound().toString());
    throw new Error('');
  });
  /**/

});