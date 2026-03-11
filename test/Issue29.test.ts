import { describe, expect, it, afterEach } from 'vitest';
import { S2 } from '../src/S2';
import { S2Cell } from '../src/S2Cell';
import { S2CellId } from '../src/S2CellId';
import { S2Projections } from '../src/S2Projections';
import { S2LatLng } from '../src/S2LatLng';
import { Utils } from '../src/export';

describe('Issue #29 — configurable MAX_LEVEL', () => {
  // Always restore MAX_LEVEL=30 after each test
  afterEach(() => {
    S2.MAX_LEVEL = 30;
    S2CellId.MAX_LEVEL = 30;
    S2Projections.MAX_LEVEL = 30;
  });

  it('S2Cell.MAX_CELL_SIZE is publicly accessible', () => {
    expect(S2Cell.MAX_CELL_SIZE).toBe(1 << 30);
  });

  it('Utils.setMaxLevel updates all three MAX_LEVEL fields', () => {
    Utils.setMaxLevel(10);
    expect(S2.MAX_LEVEL).toBe(10);
    expect(S2CellId.MAX_LEVEL).toBe(10);
    expect(S2Projections.MAX_LEVEL).toBe(10);
  });

  it('S2Cell.MAX_CELL_SIZE derives from MAX_LEVEL and updates via getter', () => {
    Utils.setMaxLevel(10);
    expect(S2Cell.MAX_CELL_SIZE).toBe(1 << 10);  // 1024
  });

  it('S2Projections.MAX_SITI derives from MAX_LEVEL and updates via getter', () => {
    Utils.setMaxLevel(10);
    expect(S2Projections.MAX_SITI).toBe(1n << 11n);  // 2048n
  });

  it('POS_BITS and MAX_SIZE are fixed constants regardless of MAX_LEVEL', () => {
    // These encode the canonical 64-bit S2 cell ID layout — they must never change.
    Utils.setMaxLevel(10);
    expect(S2CellId.POS_BITS).toBe(61);        // always 2*30+1
    expect(S2CellId.MAX_SIZE).toBe(1 << 30);   // always 2^30
  });

  it('setMaxLevel rejects out-of-range values', () => {
    expect(() => Utils.setMaxLevel(0)).toThrow(RangeError);
    expect(() => Utils.setMaxLevel(31)).toThrow(RangeError);
    expect(() => Utils.setMaxLevel(-1)).toThrow(RangeError);
    expect(() => Utils.setMaxLevel(1.5)).toThrow(RangeError);
  });

  it('cell ID encoding and level() are correct for non-leaf cells regardless of MAX_LEVEL', () => {
    // Standard S2 encoding: a level-10 cell is built from parentL(10) and
    // reports level() == 10 using fixed bit-counting — independent of MAX_LEVEL.
    const p = S2LatLng.fromDegrees(48.0, 16.0).toPoint();
    const cellId = S2CellId.fromPoint(p).parentL(10);
    expect(cellId.level()).toBe(10);

    // setMaxLevel does not change this result.
    Utils.setMaxLevel(10);
    const cellId2 = S2CellId.fromPoint(p).parentL(10);
    expect(cellId2.level()).toBe(10);
  });

  it('toToken() produces compact hex strings for low-level cells', () => {
    // A level-10 cell should produce a short token (~6 hex chars), demonstrating
    // the intended "shorter token" use case without needing to change MAX_LEVEL.
    const p = S2LatLng.fromDegrees(48.0, 16.0).toPoint();
    const token = S2CellId.fromPoint(p).parentL(10).toToken();
    // Level-10 token length = (64 - 2*(30-10)) / 4 chars = (64-40)/4 = 6
    expect(token.length).toBe(6);
  });

  it('fromToken() round-trips correctly regardless of MAX_LEVEL', () => {
    const p = S2LatLng.fromDegrees(48.0, 16.0).toPoint();
    const original = S2CellId.fromPoint(p).parentL(10);
    const token = original.toToken();

    // After setMaxLevel the token must still decode to the same cell.
    Utils.setMaxLevel(10);
    const decoded = S2CellId.fromToken(token);
    expect(decoded.id).toBe(original.id);
    expect(decoded.face).toBe(original.face);
  });

  it('S2Cell.MAX_CELL_SIZE returns 1<<30 again after restoring MAX_LEVEL', () => {
    Utils.setMaxLevel(20);
    expect(S2Cell.MAX_CELL_SIZE).toBe(1 << 20);
    // afterEach restores MAX_LEVEL to 30 — verified here by re-setting explicitly.
    S2CellId.MAX_LEVEL = 30;
    expect(S2Cell.MAX_CELL_SIZE).toBe(1 << 30);
  });
});
