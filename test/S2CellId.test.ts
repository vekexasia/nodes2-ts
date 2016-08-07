import {S2CellId} from "../src/S2CellId";
import {expect} from "chai";
const genLocs = require('./generated-locations.json');
const genJavaLocs = require('./java-gen-locations.json');
import Decimal = require('decimal.js');
import Long = require('long');
import {S2Point} from "../src/S2Point";
import {R2Vector} from "../src/S2Vector";
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
      });
      it ('token should match', () => {
        items.forEach(i => {
          expect(i.cell.toToken()).to.be.eq(i.item.token);
        });
      });
      it('bau', () => {
        items.forEach(i => {
          expect(
              R2Vector.singleStTOUV(i.item.s).minus(i.item.u).abs().toNumber()
          )
              .to.be.lt(1e-15);

          expect(
              R2Vector.singleStTOUV(i.item.t).minus(i.item.v).abs().toNumber(),
              't to v '
          ).to.be.lt(1e-15);
          
          expect(
              R2Vector.singleUVToST(i.item.u).minus(i.item.s).abs().toNumber()
          ).to.be.lt(1e-15);

          expect(
              R2Vector.singleUVToST(i.item.v).minus(i.item.t).abs().toNumber()
          ).to.be.lt(1e-15);

          expect(R2Vector.singleUVToST(R2Vector.singleStTOUV(i.item.s)).toFixed(15))
              .to.be.eq(new Decimal(i.item.s).toFixed(15));
          expect(R2Vector.singleUVToST(R2Vector.singleStTOUV(i.item.t)).toFixed(15))
              .to.be.eq(new Decimal(i.item.t).toFixed(15));
        });
      })
      it('toPoint should match', () => {
        items.forEach(i => {
          // expect(
          //     i.cell.toPoint().equals(new S2Point(i.item.point.x,i.item.point.y,i.item.point.z)),
          //     `${i.cell.toPoint().toString()} - ${i.item.point.x},${i.item.point.y},${i.item.point.z}`
          // ).is.true;

          expect(
              S2CellId.fromPoint(i.cell.toPoint()).parentL(i.cell.level()).id.toString()
          ).to.be.eq(i.cell.id.toString())
        });
      });
    })

  });
  describe('real data', () => {
    //
    // it('fromPoint', () => {
    //   genLocs.forEach(item => {
    //     const s2Point = S2LatLng.fromDegrees(new Decimal(item.lat), new Decimal(item.lng)).toPoint();
    //     const s2CellId = S2CellId.fromPoint(s2Point).parentL(15);
    //     console.log(s2CellId);
    //     const s2LatLng = s2CellId.toLatLng();
    //     console.log(s2LatLng.toString());
    //     expect(s2CellId.id.toString()).to.be.equal(item.cellid);
    //   });
    // });
    it('fromToken/toToken', () => {
      genLocs.map(({token, cellid}) => ({token, cellid}))
          .forEach(item => {

            const s2CellId = S2CellId.fromToken(item.token);
            expect(s2CellId.id.toString()).is.equal(item.cellid);
            expect(s2CellId.toToken()).is.equal(item.token);
          })
    });
    it('should provide level 15 for all test cases', () => {
      genLocs
          .forEach(item => {
            const s2CellId = S2CellId.fromToken(item.token);
            expect(s2CellId.level()).is.equal(15);
          });
    });

    it('fromFaceIj', () => {
      genLocs.map(({f, i, j, cellid, token}) => ({f, i, j, cellid, token}))
          .forEach((item, idx)=> {
            const s2CellId = S2CellId.fromFaceIJ(item.f, item.i, item.j).parentL(15);
            // const oth = S2CellId.fromToken(item.token);
            // console.log(s2CellId.level(), oth.level())
            expect(s2CellId.id.toString()).is.equal(item.cellid, `idx: ${idx}`);
          })
    });

    describe('once parsed', () => {
      it('should calculate same face', () => {
        genLocs
            .forEach(item => {

              const s2CellId = S2CellId.fromToken(item.token);
              expect(s2CellId.face).is.equal(item.f);
            });
      });
      it('should provide a .pos that results in same cellID when reconstructed using fromFacePosLevel', () => {
        genLocs
            .forEach(item => {
              const s2CellId = S2CellId.fromToken(item.token);
              const other = S2CellId.fromFacePosLevel(
                  item.f,
                  s2CellId.pos(),
                  s2CellId.level()
              );
              expect(s2CellId.id.toString()).is.equal(other.id.toString());
            });
      });
      //
      // it('.toLatLng() should provide same lat lng', () => {
      //   genLocs
      //       .forEach(item => {
      //         const s2CellId = S2CellId.fromToken(item.token);
      //         const s2LatLng = s2CellId.toLatLng();
      //         // expect(item.lng).to.be.equal(new S1Angle(s2LatLng.lngRadians).degrees().toString())
      //         expect(item.lat).to.be.equal(new S1Angle(s2LatLng.latRadians).degrees().toString())
      //       });
      // });

    });
  });
});