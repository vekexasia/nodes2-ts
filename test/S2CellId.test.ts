import { describe, it, expect, beforeAll } from 'vitest';
import { S2CellId } from "../src/S2CellId";
import { S2Point } from "../src/S2Point";
import { R2Vector } from "../src/R2Vector";
import { S1Angle } from "../src/S1Angle";
import genJavaLocs from './assets/main-tests.json';
import cellTests from './assets/cell-tests.json';
import { MainTestItem, CellTestItem } from './test-types';

/**
 * Convert a signed-decimal string (Java Long.toString()) to an unsigned
 * decimal string, matching what S2CellId.id.toString() now returns.
 */
const toU = (s: string): string => BigInt.asUintN(64, BigInt(s)).toString();

describe('S2CellId', () => {
  describe('java data', () => {
    describe('decoding', () => {
      it('should decode fromFacePosLevel', () => {
        genJavaLocs
            .forEach((item: MainTestItem) => {
              const pos = BigInt(item.pos); // item.pos is always positive (61-bit)
              const s2CellId = S2CellId.fromFacePosLevel(item.face, pos, item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(toU(item.id));
            });
      });
      it('should decode from token', () => {
        genJavaLocs
            .forEach((item: MainTestItem) => {
              const s2CellId = S2CellId.fromToken(item.token);
              expect(s2CellId.id.toString()).to.be.equal(toU(item.id));
            })
      });
      it('should decode from Face Ij', () => {
        genJavaLocs
            .forEach((item: MainTestItem) => {
              const s2CellId = S2CellId.fromFaceIJ(item.face, item.i, item.j)
                  .parentL(item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(toU(item.id));
            });
      });
      it('should decode from point', () => {
        genJavaLocs
            .forEach((item: MainTestItem) => {
              const s2Point = new S2Point(item.point.x, item.point.y, item.point.z);
              const s2CellId = S2CellId.fromPoint(s2Point)
                  .parentL(item.lvl);
              expect(s2CellId.id.toString()).to.be.equal(toU(item.id));
            })
      })
    });
    describe('instance data', () => {
      let items: Array<{item: MainTestItem, cell: S2CellId}> = [];
      beforeAll(() => {
        items = genJavaLocs.map((item: MainTestItem) => {
          return {
            item,
            cell: S2CellId.fromToken(item.token)
          }
        });
        items.forEach(i => {
          expect(toU(i.item.id)).to.be.eq(i.cell.id.toString())
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
          ).toBe(true);
        });
      });
      it('.next should match', () => {
        items.forEach(i => {
          expect(i.cell.next().id.toString())
              .to.be.eq(toU(i.item.next))
        });
      });
      it('.prev should match', () => {
        items.forEach(i => {
          expect(i.cell.prev().id.toString())
              .to.be.eq(toU(i.item.prev));
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
              .to.be.eq(toU(i.item.parent))
        })
      });
      it('.parentL(1) shouold match', () => {
        items.forEach(i => {
          expect(i.cell.parentL(1).id.toString())
              .to.be.eq(toU(i.item.parentLvl1))
        })
      });
      it('.rangeMin should match', () => {
        items.forEach(i => {
          expect(i.cell.rangeMin().id.toString())
              .to.be.eq(toU(i.item.rangeMin));
        })
      });
      it('.rangeMax should match', () => {
        items.forEach(i => {
          expect(i.cell.rangeMax().id.toString())
              .to.be.eq(toU(i.item.rangeMax));
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
          const edgeIDs = i.cell.getEdgeNeighbors().map((cellId: S2CellId) => cellId.id.toString());
          expect(edgeIDs)
              .to.be.deep.equal(i.item.neighbors.map(toU));
        });
      });
      it('.pos should match', () => {
        items.forEach(i => {
          // item.pos is always positive (61-bit), so toString() matches directly
          expect(i.cell.pos().toString()).to.be.eq(i.item.pos);
        });
      });

      it('.getAllNeighbors should match', () => {
        items.forEach(i => {
          const edgeIDs = i.cell.getAllNeighbors(i.cell.level()+1).map((cellId: S2CellId) => cellId.id.toString());
          expect(edgeIDs)
              .to.be.deep.equal(i.item.allNeighborsLvlP1.map(toU));
        });
      });
      it('.contains should work with direct parent', () => {
        items.forEach(i => {
          expect(i.cell.parent().contains(i.cell)).toBe(true);
        });
      });

    });
  });

  describe('cell-tests', () => {
    it('should calculate vertexNeighbors just fine', () => {
      cellTests.forEach((c: CellTestItem) => {
        // c.id may be signed decimal — the constructor handles it
        const cell = new S2CellId(c.id);
        c.vertexNeighborsLvl.forEach((vnData) => {
          const calcTokens = cell.getVertexNeighbors(vnData.lvl)
              .map((vC: S2CellId) => vC.toToken())
          expect(calcTokens, `Cell: ${c.id} ${cell.toToken()} - level ${vnData.lvl}`).to.be.deep.equal(vnData.v);
        });
      })
    });
    it('should calculate edgeNeighbors just fine', () => {
      cellTests.forEach((c: CellTestItem) => {
        const cell = new S2CellId(c.id);
        const edgeCellTokens = cell.getEdgeNeighbors().map((eN: S2CellId) => eN.toToken());
        expect(edgeCellTokens).to.be.deep.equal(c.edgeNeighbors);
      })
    });
  });

  // -----------------------------------------------------------------------
  // Migration helpers (v3 → v4 compatibility)
  // -----------------------------------------------------------------------
  describe('migration helpers', () => {
    // Known pair: Java signed decimal ↔ unsigned bigint ↔ token
    const SIGNED   = '-6533045114107854848';
    const UNSIGNED =  11913698959601696768n;
    const TOKEN    = 'a555f6151';

    describe('S2CellId.fromSignedDecimalString()', () => {
      it('produces the same cell as new S2CellId(signedString)', () => {
        const a = S2CellId.fromSignedDecimalString(SIGNED);
        const b = new S2CellId(SIGNED);
        expect(a.id).toBe(b.id);
      });

      it('produces the correct unsigned id for the known pair', () => {
        const cell = S2CellId.fromSignedDecimalString(SIGNED);
        expect(cell.id).toBe(UNSIGNED);
      });

      it('is equivalent to BigInt.asUintN(64, BigInt(s)) for negative strings', () => {
        const cell = S2CellId.fromSignedDecimalString(SIGNED);
        expect(cell.id).toBe(BigInt.asUintN(64, BigInt(SIGNED)));
      });
    });

    describe('cellId.toSignedDecimalString()', () => {
      it('returns the Java-compatible signed decimal', () => {
        const cell = new S2CellId(UNSIGNED);
        expect(cell.toSignedDecimalString()).toBe(SIGNED);
      });

      it('round-trip: fromSignedDecimalString → toSignedDecimalString', () => {
        const cell = S2CellId.fromSignedDecimalString(SIGNED);
        expect(cell.toSignedDecimalString()).toBe(SIGNED);
      });

      it('positive ids produce non-negative signed string', () => {
        const cell = new S2CellId(123n);
        expect(cell.toSignedDecimalString()).toBe('123');
      });
    });

    describe('cellId.toUnsignedDecimalString()', () => {
      it('returns the same string as cell.id.toString()', () => {
        const cell = new S2CellId(UNSIGNED);
        expect(cell.toUnsignedDecimalString()).toBe(UNSIGNED.toString());
      });

      it('produces the unsigned string for the known pair', () => {
        const cell = S2CellId.fromSignedDecimalString(SIGNED);
        expect(cell.toUnsignedDecimalString()).toBe(UNSIGNED.toString());
      });
    });

    describe('constructor string/bigint variants', () => {
      it('signed decimal string constructor: new S2CellId(signedStr)', () => {
        const cell = new S2CellId(SIGNED);
        expect(cell.id).toBe(UNSIGNED);
        expect(cell.toToken()).toBe(TOKEN);
      });

      it('unsigned decimal string constructor: new S2CellId(unsignedStr)', () => {
        const cell = new S2CellId(UNSIGNED.toString());
        expect(cell.id).toBe(UNSIGNED);
        expect(cell.toToken()).toBe(TOKEN);
      });

      it('bigint constructor: new S2CellId(bigintLiteral)', () => {
        const cell = new S2CellId(UNSIGNED);
        expect(cell.id).toBe(UNSIGNED);
        expect(cell.toToken()).toBe(TOKEN);
      });

      it('negative bigint constructor is wrapped via BigInt.asUintN', () => {
        const negBigInt = -6533045114107854848n;
        const cell = new S2CellId(negBigInt);
        expect(cell.id).toBe(UNSIGNED);
        expect(cell.toToken()).toBe(TOKEN);
      });

      it('all four constructor forms produce the same cell', () => {
        const bySignedStr  = new S2CellId(SIGNED);
        const byUnsignedStr = new S2CellId(UNSIGNED.toString());
        const byBigInt      = new S2CellId(UNSIGNED);
        const byNegBigInt   = new S2CellId(-6533045114107854848n);

        expect(bySignedStr.id).toBe(UNSIGNED);
        expect(byUnsignedStr.id).toBe(UNSIGNED);
        expect(byBigInt.id).toBe(UNSIGNED);
        expect(byNegBigInt.id).toBe(UNSIGNED);
      });

      it('number constructor: new S2CellId(numberLiteral)', () => {
        const cell = new S2CellId(42);
        expect(cell.id).toBe(42n);
      });
    });
  });
});
