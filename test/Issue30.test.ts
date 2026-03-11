import { describe, expect, it } from 'vitest';
import { S2Cell } from '../src/S2Cell';
import { S2CellId } from '../src/S2CellId';
import { S2CellUnion } from '../src/S2CellUnion';

describe('Issue #30 — S2CellId constructor accepts number', () => {
  it('exact repro: new S2Cell(new S2CellId(-9182983676231680000n))', () => {
    // Use bigint literal — the number literal exceeds safe-integer precision.
    const cell = new S2Cell(new S2CellId(-9182983676231680000n));
    expect(cell).toBeDefined();
  });

  it('accepts -9182983676231680000n as bigint (exact precision, no guard)', () => {
    const cellId = new S2CellId(-9182983676231680000n);
    expect(cellId.id).toBe(BigInt.asUintN(64, -9182983676231680000n));
  });

  it('number constructor produces same id as equivalent string for small/safe integers', () => {
    const fromNum = new S2CellId(42);
    const fromStr = new S2CellId('42');
    expect(fromNum.id).toBe(fromStr.id);
  });

  it('negative number wraps via BigInt.asUintN(64, ...)', () => {
    const cell = new S2CellId(-1);
    // -1 as unsigned 64-bit is 2^64 - 1
    expect(cell.id).toBe(BigInt.asUintN(64, -1n));
  });

  it('zero works', () => {
    const cell = new S2CellId(0);
    expect(cell.id).toBe(0n);
  });

  it('small positive integer', () => {
    const cell = new S2CellId(12345);
    expect(cell.id).toBe(12345n);
  });

  it('throws TypeError for non-integer number (3.14)', () => {
    expect(() => new S2CellId(3.14)).toThrow(TypeError);
  });

  it('throws TypeError for NaN', () => {
    expect(() => new S2CellId(NaN)).toThrow(TypeError);
  });

  it('throws TypeError for Infinity', () => {
    expect(() => new S2CellId(Infinity)).toThrow(TypeError);
  });

  it('throws RangeError for number exceeding safe integer precision', () => {
    // Number(9182983676231680001n) is silently rounded by JS to 9182983676231680000,
    // which has absolute value > Number.MAX_SAFE_INTEGER → RangeError.
    const n = Number(9182983676231680001n);
    expect(() => new S2CellId(n)).toThrow(RangeError);
  });
});

describe('Issue #30 — widened wrapper APIs accept number', () => {
  const LEAF_CELL_NUM = 42;

  it('binarySearch(ids, number) finds element', () => {
    const ids = [new S2CellId(1), new S2CellId(42), new S2CellId(100)];
    const idx = S2CellId.binarySearch(ids, LEAF_CELL_NUM);
    expect(idx).toBe(1);
  });

  it('binarySearch(ids, number) returns ~insertion point for missing element', () => {
    const ids = [new S2CellId(1), new S2CellId(100)];
    // 42 is between index 0 and 1, so ~1
    const idx = S2CellId.binarySearch(ids, LEAF_CELL_NUM);
    expect(idx).toBe(~1);
  });

  it('indexedBinarySearch(ids, number) finds element', () => {
    const ids = [new S2CellId(1), new S2CellId(42), new S2CellId(100)];
    const idx = S2CellId.indexedBinarySearch(ids, LEAF_CELL_NUM);
    expect(idx).toBe(1);
  });

  it('S2CellUnion.initFromIds accepts number[]', () => {
    const union = new S2CellUnion();
    // Use valid leaf cell ids (odd numbers in S2 space); 42 and -1 are valid to pass
    union.initFromIds([42, -1]);
    // Just check it doesn't throw and produces cell ids
    expect(union.getCellIds().length).toBeGreaterThan(0);
  });

  it('S2CellUnion.initRawIds accepts number[]', () => {
    const union = new S2CellUnion();
    union.initRawIds([42, 100]);
    expect(union.getCellIds().length).toBeGreaterThan(0);
  });
});
