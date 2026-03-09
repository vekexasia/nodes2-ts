import { describe, it, expect } from 'vitest';
import { S2CellUnion } from '../src/S2CellUnion';
import { S2CellId } from '../src/S2CellId';
import { S2Cell } from '../src/S2Cell';
import unionTests from './assets/union-tests.json';
import cellTests from './assets/cell-tests.json';

function createUnionFromTokensList(tokens:string[]):S2CellUnion {
  const s2CellUnion = new S2CellUnion();
  s2CellUnion.initFromIds(tokens.map(token => S2CellId.fromToken(token))
    .map((c:S2CellId) => c.id));
  return s2CellUnion
}
describe('S2CellUnion', () => {
  describe('java data', () => {
    it ('should reorder cells correctly when creating from cellids', () => {
      unionTests.forEach((test: any) => {
        expect(createUnionFromTokensList(test.firstCells).getCellIds().map((c: S2CellId) => c.toToken())).to.be.deep.eq(test.firstUnionResultCells);
        expect(createUnionFromTokensList(test.scndCells).getCellIds().map((c: S2CellId) => c.toToken())).to.be.deep.eq(test.scndUnionResultCells);
      });
    });

    it('should compute union correctly', () => {
      unionTests.forEach((test: any) => {
        const result = new S2CellUnion();
        result.getUnion(
          createUnionFromTokensList(test.firstCells),
          createUnionFromTokensList(test.scndCells)
        );
        expect(result.getCellIds().map((c: S2CellId) => c.toToken())).to.be.deep.eq(test.union);
      });
    });

    it('should compute intersection correctly', () => {
      unionTests.forEach((test: any) => {
        const result = new S2CellUnion();
        result.getIntersectionUU(
          createUnionFromTokensList(test.firstCells),
          createUnionFromTokensList(test.scndCells)
        );

        expect(result.getCellIds().map((c: S2CellId) => c.toToken())).to.be.deep.eq(test.intersectionUnionCells);
      })
    });

  });
  it('bug#1', () => {
    const unionOne = new S2CellUnion();
    unionOne.initFromIds("2203840834468577280,2203676182602317824,2203694187105222656,2203734542617935872,2203734645697150976,2203699392605585408".split(','));

    const unionTwo = new S2CellUnion();
    unionTwo.initFromIds("2203840834468577280,2203682229916270592,2203804700908716032,2203692812715687936,2203846933322137600".split(','));

    // console.log(unionOne.getCellIds().map((c: S2CellId) => `${c.toToken()} - ${c.id.toString()}`).join('\n'));
    // console.log('---');
    // console.log(unionTwo.getCellIds().map((c: S2CellId) => `${c.toToken()} - ${c.id.toString()}`).join('\n'));
    const newUnion = new S2CellUnion();
    newUnion.getUnion(unionOne, unionTwo);


    const newUnion2 = new S2CellUnion();
    newUnion2.getIntersectionUU(unionOne, unionTwo);
    // console.log(newUnion2.getCellIds().map((c: S2CellId) => `${c.toToken()} - ${c.id.toString()}`).join('\n'));
  });

  it('should normalize correctly', () => {
    // Test case for https://github.com/vekexasia/nodes2-ts/issues/16
    const cellUnion = new S2CellUnion();
    const s2CellIDs = ["357ca571", "357ca573", "357ca575", "357ca577"].map(token=>S2CellId.fromToken(token).id);
    cellUnion.initFromIds(s2CellIDs);
    expect(cellUnion.getCellIds().map((id: S2CellId) => id.toToken())).to.be.deep.eq(['357ca574']);

    cellTests.forEach((test: any) => {
      const cell = new S2Cell(new S2CellId(test.id))
      const { children } = test;

      const cellUnion = new S2CellUnion();
      cellUnion.initFromIds(children.map((token: string) => S2CellId.fromToken(token).id))

      expect(cellUnion.getCellIds().map((id: S2CellId) => id.toToken())).to.be.deep.eq([cell.id.toToken()]);
    })
  })

  it('should denormalize correctly', () => {
    // Test case for https://github.com/vekexasia/nodes2-ts/issues/16
    const cellUnion = new S2CellUnion();

    cellUnion.initFromIds(['357ca574'].map(token=>S2CellId.fromToken(token).id))
    const minLevel = S2CellId.fromToken('357ca571').level();
    expect(cellUnion.denormalize(minLevel, 1).map((id: S2CellId) => id.toToken())).to.be.deep.eq(["357ca571", "357ca573", "357ca575", "357ca577"]);
  })

  // -----------------------------------------------------------------------
  // intersectsUnion regression tests
  // -----------------------------------------------------------------------
  describe('intersectsUnion', () => {
    // Helper: build a union from a list of tokens
    function makeUnion(tokens: string[]): S2CellUnion {
      return createUnionFromTokensList(tokens);
    }

    it('returns true for partially overlapping unions', () => {
      // Use sibling cells so we have known overlap/non-overlap at the same level.
      // 357ca571..357ca577 are level-29 cells that share the parent 357ca574.
      const A = makeUnion(['357ca571', '357ca573']);
      const B = makeUnion(['357ca573', '357ca575']);
      // cell 357ca573 is common → must intersect
      expect(A.intersectsUnion(B)).toBe(true);
      expect(B.intersectsUnion(A)).toBe(true);
    });

    it('returns false for completely disjoint unions', () => {
      // Pick two geographically distant cells at leaf level.
      // 1 (face 0 sentinel) and 3 (face 0 next) are far from any face-3 token.
      // Use parent-level tokens on opposite faces to guarantee disjoint coverage.
      // face-0 and face-3 top-level cells are disjoint.
      const faceZero  = S2CellId.fromFace(0);  // face 0 sentinel token
      const faceThree = S2CellId.fromFace(3);  // face 3 sentinel token

      const A = new S2CellUnion();
      A.initFromIds([faceZero.id]);
      const B = new S2CellUnion();
      B.initFromIds([faceThree.id]);

      expect(A.intersectsUnion(B)).toBe(false);
      expect(B.intersectsUnion(A)).toBe(false);
    });

    it('returns true when one union is fully contained in the other', () => {
      // 357ca574 is the parent of 357ca571..357ca577
      const parent = makeUnion(['357ca574']);
      const child  = makeUnion(['357ca571']);
      expect(parent.intersectsUnion(child)).toBe(true);
      expect(child.intersectsUnion(parent)).toBe(true);
    });

    it('returns false for an empty "that" union (vacuous)', () => {
      const A     = makeUnion(['357ca571']);
      const empty = new S2CellUnion();
      empty.initFromIds([]);
      expect(A.intersectsUnion(empty)).toBe(false);
    });

    it('symmetry: A.intersectsUnion(B) === B.intersectsUnion(A)', () => {
      const pairs: Array<[string[], string[]]> = [
        [['357ca571'], ['357ca573']],
        [['357ca571', '357ca573'], ['357ca575', '357ca577']],
        [['357ca571'], ['357ca574']],   // child vs parent
        [['1'], ['3']],                 // adjacent face-0 level-1 cells
      ];
      pairs.forEach(([tokA, tokB]) => {
        const A = makeUnion(tokA);
        const B = makeUnion(tokB);
        expect(A.intersectsUnion(B)).toBe(B.intersectsUnion(A));
      });
    });

    it('was previously broken: non-first-cell disjoint did not short-circuit incorrectly', () => {
      // The old (broken) implementation returned false as soon as ONE cell in "that"
      // did not intersect "this". Construct a case where only the *second* cell of B
      // intersects A — the old code would wrongly return false.
      //
      // A = {357ca574} (parent)
      // B = {1 (far away), 357ca571 (child of parent)}
      //   → first cell of B (1) does NOT intersect A
      //   → second cell of B (357ca571) DOES intersect A
      // Correct answer: true.
      const faceZeroChild = S2CellId.fromToken('1');
      const A = makeUnion(['357ca574']);
      const B = new S2CellUnion();
      B.initFromIds([faceZeroChild.id, S2CellId.fromToken('357ca571').id]);
      expect(A.intersectsUnion(B)).toBe(true);
    });
  });
});
