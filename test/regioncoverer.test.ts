import {S2CellId} from "../src/S2CellId";
import {expect} from "chai";
const genJavaLocs = require('./assets/main-tests.json');
const cellTests = require('./assets/cell-tests.json');
import Long = require('long');
import {S2Point} from "../src/S2Point";
import {R2Vector} from "../src/R2Vector";
import {S2LatLngRect} from "../src/S2LatLngRect";
import {S1Angle} from "../src/S1Angle";
import {MutableInteger} from "../src/MutableInteger";
import {S2} from "../src/S2";
import {Decimal} from 'decimal.js';
import { S2LatLng } from '../src/S2LatLng';
import { S2RegionCoverer } from '../src/S2RegionCoverer';
describe('RegionCoverer', () => {
  it('brocca', () => {
    const s2LatLngRect = S2LatLngRect.fromPointPair(
      S2LatLng.fromDegrees(45.319323121350145, 12.122039794921875),
      S2LatLng.fromDegrees(45.79529713006591, 9.485321044921877)
    );

    const cover = new S2RegionCoverer()
      .setMinLevel(6)
      .setMaxLevel(20)
      .setMaxCells(29)
      .getCoveringCells(s2LatLngRect);

    console.log(cover.map((c) => c.toToken()));
  })
});
