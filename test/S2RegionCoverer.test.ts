import * as Long from "long";
import { S2Cell } from "../src/S2Cell";
import { S2CellId } from "../src/S2CellId";
import { S2CellUnion } from "../src/S2CellUnion";
import { S2RegionCoverer } from "../src/S2RegionCoverer";
import {assert, expect} from "chai";
import { S2LatLngRect } from "../src/S2LatLngRect";
import { S2LatLng } from "../src/S2LatLng";
import { S2Region } from "../src/S2Region";
import { S2 } from "../src/S2";
import { S2Point } from "../src/S2Point";
import { S2Cap } from "../src/S2Cap";
import { getRandomCap } from "./geometricTestCase";
const genLocs = require('./assets/latlng-covering-tests.json');

// https://github.com/google/s2-geometry-library-java/blob/5bd8781f9c5e52d673dced401bd6b5424ba4582a/tests/com/google/common/geometry/GeometryTestCase.java#L91
function getRandomCellID(): S2CellId {
  const randLevel = Math.floor(Math.random() * S2CellId.MAX_LEVEL);
  const randFace = Math.floor(Math.random() * S2CellId.NUM_FACES);

  const randomLow32 = Math.floor(Math.random() * (Math.pow(2, 31) - 1));
  const randomHigh32 = Math.floor(Math.random() * (Math.pow(2, 31) - 1));
  const randomLong = new Long(randomLow32, randomHigh32);

  const randPos = randomLong.and((new Long(1)).shiftLeft(2 * S2CellId.MAX_LEVEL).subtract(1));

  return S2CellId.fromFacePosLevel(randFace, randPos, randLevel)
}

/**
  * Checks that "covering" completely covers the given region. If "checkTight" is true, also checks
  * that it does not contain any cells that do not intersect the given region. ("id" is only used
  * internally.)
  */
function checkCoveringCoversGivenRegion(region: S2Region, covering: S2CellUnion, checkTight: boolean, id: S2CellId) {

  if (!id.isValid()) {
    for (let face = 0; face < S2CellId.NUM_FACES; ++face) {
      checkCoveringCoversGivenRegion(region, covering, checkTight, S2CellId.fromFacePosLevel(face, Long.fromNumber(0), 0))
    }
    return;
  }

  if (!region.mayIntersectC(new S2Cell(id))) {
    // If region does not intersect id, then neither should the covering.
    if (checkTight) {
      assert(!covering.intersects(id));
    }
  } else if (!covering.contains(id)) {
    // The region may intersect id, but we can't assert that the covering
    // intersects id because we may discover that the region does not actually
    // intersect upon further subdivision. (MayIntersect is not exact.)
    expect(region.containsC(new S2Cell(id))).to.eq(false, 'expecting region to not contain cell id');
    expect(id.isLeaf()).to.eq(false, `expecting not to find a leaf node ${id.toToken()}. this likely indicates the covering is missing results`);
    const end = id.childEnd();
    for (let child = id.childBegin(); !child.equals(end); child = child.next()) {
      checkCoveringCoversGivenRegion(region, covering, checkTight, child);
    }
  }
}

// https://github.com/google/s2-geometry-library-java/blob/2ebcfda1f1b5e1d417b588a59a12944cb99c28ed/tests/com/google/common/geometry/S2RegionCovererTest.java#L48
function checkCovering(coverer: S2RegionCoverer, region: S2Region, covering: S2CellId[], interior: boolean) {
  const minLevelCells : { [cellId: string]: number } = {};
  for (let i = 0; i < covering.length; ++i) {
    // Keep track of how many cells have the same coverer.min_level() ancestor.
    const level = covering[i].level();
    expect(level).to.be.gte(coverer.getMinLevel())
    expect(level).to.be.lte(coverer.getMaxLevel())
    expect((level - coverer.getMinLevel()) % coverer.getLevelMod()).to.eq(0);
    const key = covering[i].parentL(coverer.getMinLevel()).toToken();

    minLevelCells[key] = minLevelCells[key] || 0;
    minLevelCells[key] += 1
  }

  if (covering.length > coverer.getMaxCells()) {
    // If the covering has more than the requested number of cells, then check
    // that the cell count cannot be reduced by using the parent of some cell.

    Object.keys(minLevelCells).forEach(key => {
      const count = minLevelCells[key];
      expect(count).to.eq(1, `expected ${key} to have count of 1, but got ${count}`);
    })
  }

  if (interior) {
    for (let i = 0; i < covering.length; ++i) {
      assert(region.containsC(new S2Cell(covering[i])));
    }
  } else {
    const cellUnion = new S2CellUnion();
    cellUnion.initFromCellIds(covering);
    checkCoveringCoversGivenRegion(region, cellUnion, true, new S2CellId(Long.fromNumber(0)))
  }
}

describe('S2RegionCoverer', () => {
  it('correctly self-covers using getCoveringUnion', () => {
    for (let i = 0; i < 10000; i++) {
      const coverer = new S2RegionCoverer().setMaxCells(1);
      const cellId = getRandomCellID();
      const covering = new S2CellUnion();
      coverer.getCoveringUnion(new S2Cell(cellId), covering);
      expect(covering.size()).to.equal(1);
      expect(covering.cellId(0).id.toString()).to.equal(cellId.id.toString());
    }
  })
  it('correctly self-covers using getCoveringCells', () => {
    for (let i = 0; i < 10000; i++) {
      const coverer = new S2RegionCoverer().setMaxCells(1);
      const cellId = getRandomCellID();
      const coveringCells = coverer.getCoveringCells(new S2Cell(cellId));
      expect(coveringCells.length).to.equal(1);
      expect(coveringCells[0].toToken()).to.equal(cellId.toToken());
    }
  })

  it('produces valid coverings', () => {
    const kMaxLevel = S2CellId.MAX_LEVEL;

    for (let i = 0; i < 1000; ++i) {
      const coverer = new S2RegionCoverer().setMaxCells(Math.floor(Math.random() * 10)).setLevelMod(Math.floor(Math.random() * 3))
        .setMaxLevel(Math.floor(Math.random() * (kMaxLevel + 1))).setMinLevel(Math.floor(Math.random() * (kMaxLevel + 1)));
      do {
        coverer.setMinLevel(Math.floor(Math.random() * (kMaxLevel + 1)));
        coverer.setMaxLevel(Math.floor(Math.random() * (kMaxLevel + 1)));
      } while (coverer.getMinLevel() > coverer.getMaxLevel());

      const maxArea =
          Math.min(
              4 * S2.M_PI, (3 * coverer.getMaxCells() + 1) * S2Cell.averageArea(coverer.getMinLevel()));
      const cap = getRandomCap(0.1 * S2Cell.averageArea(kMaxLevel), maxArea);
      // const rectBound = cap.getRectBound();
      
      const covering = coverer.getCoveringCells(cap);
      checkCovering(coverer, cap, covering, false);

      // const interior = coverer.getInteriorCoveringCells(cap, );
      // checkCovering(coverer, cap, interior, true);

      // Check that GetCovering is deterministic.
      // ArrayList<S2CellId> covering2 = new ArrayList<S2CellId>();
      // coverer.getCovering(cap, covering2);
      // assertEquals(covering, covering2);

      // Also check S2CellUnion.denormalize(). The denormalized covering
      // may still be different and smaller than "covering" because
      // S2RegionCoverer does not guarantee that it will not output all four
      // children of the same parent.
      // const cells = new S2CellUnion();
      // cells.initFromCellIds(covering);
      // const denormalized = cells.denormalize(coverer.getMinLevel(), coverer.getLevelMod());
      // checkCovering(coverer, cap, denormalized, false);
    }
  })

  it('Java tests produces valid coverings', () => {
    let i = 0
    genLocs.forEach((testCase) => {
      const { maxCells, levelMod, maxLevel, minLevel, rectBound,
        covering: expectedCovering, interior: expectedInterior,
        coveringUnionTokens: expectedCoveringUnionTokens
       } = testCase;

      const latLngRect = S2LatLngRect.fromLatLng(
          S2LatLng.fromDegrees(rectBound.lo.lat, rectBound.lo.lng),
          S2LatLng.fromDegrees(rectBound.hi.lat, rectBound.hi.lng)
      );
      
      const coverer = new S2RegionCoverer().setMaxCells(maxCells).setLevelMod(levelMod).setMaxLevel(maxLevel).setMinLevel(minLevel);
      const covering = coverer.getCoveringCells(latLngRect);
      checkCovering(coverer, latLngRect, covering, false);
    });
  })
})