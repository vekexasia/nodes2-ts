import { S2CellUnion } from '../src/S2CellUnion';
import { S2CellId } from '../src/S2CellId';
import {expect} from "chai";
import { S2Cell } from '../src/S2Cell';
declare var __dirname;

// import {S2Cap} from "../src/S2Cap";
// import {S2RegionCoverer} from "../src/S2RegionCoverer";
// import {S2LatLng} from "../src/S2LatLng";
// S2Cap.addCap()
const unionTests = require('./assets/union-tests.json');
const cellTests = require('./assets/cell-tests.json');
function createUnionFromTokensList(tokens:string[]):S2CellUnion {
  let s2CellUnion = new S2CellUnion();
  s2CellUnion.initFromIds(tokens.map(token => S2CellId.fromToken(token))
    .map((c:S2CellId) => c.id));
  return s2CellUnion
}
describe('S2CellUnion', () => {
  describe('java data', () => {
    it ('should reorder cells correctly when creating from cellids', () => {
      unionTests.forEach((test) => {
        expect(createUnionFromTokensList(test.firstCells).getCellIds().map(c => c.toToken())).to.be.deep.eq(test.firstUnionResultCells);
        expect(createUnionFromTokensList(test.scndCells).getCellIds().map(c => c.toToken())).to.be.deep.eq(test.scndUnionResultCells);
      });
    });

    it('should compute union correctly', () => {
      unionTests.forEach((test) => {
        const result = new S2CellUnion();
        result.getUnion(
          createUnionFromTokensList(test.firstCells),
          createUnionFromTokensList(test.scndCells)
        );
        expect(result.getCellIds().map(c => c.toToken())).to.be.deep.eq(test.union);
      });
    });

    it('should compute intersection correctly', () => {
      unionTests.forEach((test) => {
        const result = new S2CellUnion();
        result.getIntersectionUU(
          createUnionFromTokensList(test.firstCells),
          createUnionFromTokensList(test.scndCells)
        );

        expect(result.getCellIds().map(c => c.toToken())).to.be.deep.eq(test.intersectionUnionCells);
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
    expect(cellUnion.getCellIds().map(id=>id.toToken())).to.be.deep.eq(['357ca574']);

    cellTests.forEach((test) => {
      const cell = new S2Cell(new S2CellId(test.id))
      const { children } = test;

      const cellUnion = new S2CellUnion();
      cellUnion.initFromIds(children.map(token=>S2CellId.fromToken(token).id))

      expect(cellUnion.getCellIds().map(id=>id.toToken())).to.be.deep.eq([cell.id.toToken()]);
    })
  })

  it('should denormalize correctly', () => {
    // Test case for https://github.com/vekexasia/nodes2-ts/issues/16
    const cellUnion = new S2CellUnion();
    
    cellUnion.initFromIds(['357ca574'].map(token=>S2CellId.fromToken(token).id))
    const minLevel = S2CellId.fromToken('357ca571').level();
    expect(cellUnion.denormalize(minLevel, 1).map(id=>id.toToken())).to.be.deep.eq(["357ca571", "357ca573", "357ca575", "357ca577"]);
  })


});
