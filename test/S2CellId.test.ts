import {S2CellId} from "../src/S2CellId";
import {expect} from "chai";
const genJavaLocs = require('./assets/main-tests.json');
const cellTests = require('./assets/cell-tests.json');
import Long = require('long');
import {S2Point} from "../src/S2Point";
import {R2Vector} from "../src/R2Vector";
import {S1Angle} from "../src/S1Angle";

describe('S2CellId', () => {
  describe('java data', () => {
    describe('decoding', () => {
      it('should decode fromFacePosLevel', () => {
        genJavaLocs
            .forEach(item => {

              const pos = Long.fromString(item.pos, true, 10);
              const s2CellId = S2CellId.fromFacePosLevel(item.face, pos, item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(item.id);
            });
      });
      it('should decode from token', () => {
        genJavaLocs
            .forEach(item => {
              const s2CellId = S2CellId.fromToken(item.token);
              expect(s2CellId.id.toString()).to.be.equal(item.id);

            })
      });
      it('should decode from Face Ij', () => {
        genJavaLocs
            .forEach(item => {
              const s2CellId = S2CellId.fromFaceIJ(item.face, parseInt(item.i), parseInt(item.j))
                  .parentL(item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(item.id);
            });
      });
      it('should decode from point', () => {
        genJavaLocs
            .forEach(item => {
              const s2Point = new S2Point(item.point.x, item.point.y, item.point.z);
              const s2CellId = S2CellId.fromPoint(s2Point)
                  .parentL(item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(item.id);
            })
      })
    });
    describe('instance data', () => {
      let items = [];
      before(() => {
        items = genJavaLocs.map(item => {
          return {
            item,
            cell: S2CellId.fromToken(item.token)
          }
        });
        items.forEach(i => {
          expect(i.item.id).to.be.eq(i.cell.id.toString())
        })
      });
      it('token should match', () => {
        items.forEach(i => {
          expect(i.cell.toToken()).to.be.eq(i.item.token);
        });
      });
      it('bau', () => {
        items.forEach(i => {
          expect(R2Vector.singleStTOUV(parseFloat(i.item.s)))
            .to.be.closeTo(parseFloat(i.item.u),1e-15);

          expect(R2Vector.singleStTOUV(parseFloat(i.item.t)))
            .to.be.closeTo(parseFloat(i.item.v),1e-15);

          expect(R2Vector.singleUVToST(parseFloat(i.item.u)))
            .to.be.closeTo(parseFloat(i.item.s),1e-15);

          expect(R2Vector.singleUVToST(parseFloat(i.item.v)))
            .to.be.closeTo(parseFloat(i.item.t),1e-15);



          expect(R2Vector.singleUVToST(R2Vector.singleStTOUV(parseFloat(i.item.s))))
              .to.be.closeTo(parseFloat(i.item.s), 1e-15);
          expect(R2Vector.singleUVToST(R2Vector.singleStTOUV(parseFloat(i.item.t))))
              .to.be.closeTo(parseFloat(i.item.t), 1e-15);
        });
      })
      it('toPoint should match', () => {
        items.forEach(i => {
          expect(
              i.cell.toPoint().aequal(new S2Point(i.item.point.x, i.item.point.y, i.item.point.z), 1e-15),
              `a${i.cell.toPoint().toString()} - ${i.item.point.x},${i.item.point.y},${i.item.point.z}`
          ).is.true;
        });
      });
      it('.next should match', () => {
        items.forEach(i => {
          expect(i.cell.next().id.toString())
              .to.be.eq(i.item.next)
        });
      });
      it('.prev should match', () => {
        items.forEach(i => {
          expect(i.cell.prev().id.toString())
              .to.be.eq(i.item.prev);
        })
      });
      it('.level should match', () => {
        items.forEach(i => {
          expect(i.cell.level())
              .to.be.eq(i.item.lvl)
        })
      });
      it('.toLatLng should match', () => {
        items.forEach(i => {
          // Latitude
          expect(i.cell.toLatLng().latRadians.toFixed(12))
              .to.be.eq(
                  S1Angle.degrees(
                      i.item.cellCoords.lat
                  ).radians.toFixed(12)
          );
          // Longitude
          expect(i.cell.toLatLng().lngRadians.toFixed(12))
              .to.be.eq(
              S1Angle.degrees(
                  i.item.cellCoords.lng
              ).radians.toFixed(12)
          );
        });
      });
      it('.parent shouold match', () => {
        items.forEach(i => {
          expect(i.cell.parent().id.toString())
              .to.be.eq(i.item.parent)
        })
      });
      it('.parentL(1) shouold match', () => {
        items.forEach(i => {
          expect(i.cell.parentL(1).id.toString())
              .to.be.eq(i.item.parentLvl1)
        })
      });
      it('.rangeMin should match', () => {
        items.forEach(i => {
          expect(i.cell.rangeMin().id.toString())
              .to.be.eq(i.item.rangeMin);
        })
      });
      it('.rangeMax should match', () => {
        items.forEach(i => {
          expect(i.cell.rangeMax().id.toString())
              .to.be.eq(i.item.rangeMax);
        })
      });

      it('.face should match', () => {
        items.forEach(i => {
          expect(i.cell.face)
              .to.be.eq(i.item.face);
        })
      });
      it('.toFaceIJOrientation should create correct i,j values', () => {
        items.forEach(testCase => {
          const ijo = testCase.cell.toIJOrientation();
          const i = S2CellId.getI(ijo);
          const j = S2CellId.getJ(ijo);
          const face = testCase.cell.face;
          expect(face).to.be.eq(testCase.cell.face);
          expect(i).to.be.eq(testCase.item.i);
          expect(j).to.be.eq(testCase.item.j);
        })
      });
      it('.getEdgeNeighbors should match', () => {
        items.forEach(i => {
          const edgeIDs = i.cell.getEdgeNeighbors().map(cellId => cellId.id.toString());
          expect(edgeIDs)
              .to.be.deep.equal(i.item.neighbors);


        });
      });
      it('.pos should match', () => {
        items.forEach(i => {
          expect(i.cell.pos().toString()).to.be.eq(i.item.pos);
        });
      });

      it('.getAllNeighbors should match', () => {
        items.forEach(i => {
          const edgeIDs = i.cell.getAllNeighbors(i.cell.level()+1).map(cellId => cellId.id.toString());
          expect(edgeIDs)
              .to.be.deep.equal(i.item.allNeighborsLvlP1);
        });
      });
      it('.contains should work with direct parent', () => {
        items.forEach(i => {
          expect(i.cell.parent().contains(i.cell)).is.true;
        });
      });

    });
  });

  describe('cell-tests', () => {
    it('should calculate vertexNeighbors just fine', () => {
      cellTests.forEach(c => {
        const cell = new S2CellId(c.id);
        c.vertexNeighborsLvl.forEach(vnData => {
          const calcTokens = cell.getVertexNeighbors(vnData.lvl)
              .map(vC => vC.toToken())
          expect(calcTokens, `Cell: ${c.id} ${cell.toToken()} - level ${vnData.lvl}`).to.be.deep.equal(vnData.v);
        });
      })
    });
    it('should calculate edgeNeighbors just fine', () => {
      cellTests.forEach(c => {
        const cell = new S2CellId(c.id);
        const edgeCellTokens = cell.getEdgeNeighbors().map(eN => eN.toToken());
        expect(edgeCellTokens).to.be.deep.equal(c.edgeNeighbors);

      })
    });
  });
});
