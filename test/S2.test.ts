import { assert, expect } from 'chai';
import { S2 } from '../src/S2';
import { S2Point } from '../src/S2Point';
import { S2Projections } from '../src/S2Projections';

describe('S2Cell', () => {
  describe('face', () => {
    it('each face has a right-handed coordinate system', () => {
      for (let face = 0; face < 6; ++face) {
        expect(S2Point.crossProd(S2Projections.getUAxis(face), S2Projections.getVAxis(face))
          .dotProd(S2Projections.faceUvToXyz(face, 0, 0))).to.eq(1.0)
      }
    })
    it('Hilbert curves on each face combine to form a continuous curve over the entire cube', () => {
      for (let face = 0; face < 6; ++face) {
        // The Hilbert curve on each face starts at (-1,-1) and terminates
        // at either (1,-1) (if axes not swapped) or (-1,1) (if swapped).
        const sign = ((face & S2.SWAP_MASK) != 0) ? -1 : 1;
        expect(
            S2Projections.faceUvToXyz(face, sign, -sign)).to.be.deep.eq(
              S2Projections.faceUvToXyz((face + 1) % 6, -1, -1));
      }
    })
  });

  it('has valid uvNorms', () => {
    for (let face = 0; face < 6; ++face) {
      for (let x = -1; x <= 1; x += 1 / 1024) {

        expect(
            S2Point.crossProd(
                    S2Projections.faceUvToXyz(face, x, -1), S2Projections.faceUvToXyz(face, x, 1))
                .angle(S2Projections.getUNorm(face, x))).to.be.closeTo(0, 1e-10)
        expect(
            S2Point.crossProd(
                    S2Projections.faceUvToXyz(face, -1, x), S2Projections.faceUvToXyz(face, 1, x))
                .angle(S2Projections.getVNorm(face, x))).to.be.closeTo(0, 1e-10)
      }
    }
  })
});