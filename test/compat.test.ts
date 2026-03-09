import { describe, it, expect } from 'vitest';
import {
  signedDecimalToUnsigned,
  unsignedToSignedDecimal,
  signedDecimalTokenMap,
} from '../src/compat';
import { S2CellId } from '../src/S2CellId';

// Known pair used throughout: Java signed decimal ↔ unsigned bigint ↔ token
const SIGNED   = '-6533045114107854848';
const UNSIGNED =  11913698959601696768n;
const TOKEN    = 'a555f6151';

describe('compat helpers', () => {

  // -----------------------------------------------------------------------
  describe('signedDecimalToUnsigned', () => {

    it('converts known signed decimal to unsigned bigint', () => {
      expect(signedDecimalToUnsigned(SIGNED)).toBe(UNSIGNED);
    });

    it('leaves positive strings unchanged', () => {
      expect(signedDecimalToUnsigned('123')).toBe(123n);
    });

    it('handles zero', () => {
      expect(signedDecimalToUnsigned('0')).toBe(0n);
    });

    it('handles minimum signed value (INT64_MIN)', () => {
      // -2^63 → 2^63 as unsigned
      expect(signedDecimalToUnsigned('-9223372036854775808')).toBe(9223372036854775808n);
    });

    it('handles maximum signed value (INT64_MAX)', () => {
      // 2^63 - 1 stays the same as unsigned
      expect(signedDecimalToUnsigned('9223372036854775807')).toBe(9223372036854775807n);
    });

    it('result is always in [0, 2^64-1]', () => {
      const result = signedDecimalToUnsigned(SIGNED);
      expect(result).toBeGreaterThanOrEqual(0n);
      expect(result).toBeLessThanOrEqual(18446744073709551615n);
    });
  });

  // -----------------------------------------------------------------------
  describe('unsignedToSignedDecimal', () => {

    it('converts known unsigned bigint to signed decimal', () => {
      expect(unsignedToSignedDecimal(UNSIGNED)).toBe(SIGNED);
    });

    it('leaves small values unchanged', () => {
      expect(unsignedToSignedDecimal(123n)).toBe('123');
    });

    it('handles zero', () => {
      expect(unsignedToSignedDecimal(0n)).toBe('0');
    });

    it('handles INT64_MIN as unsigned (2^63)', () => {
      // Unsigned 2^63 → signed '-9223372036854775808'
      expect(unsignedToSignedDecimal(9223372036854775808n)).toBe('-9223372036854775808');
    });

    it('handles INT64_MAX (2^63 - 1)', () => {
      expect(unsignedToSignedDecimal(9223372036854775807n)).toBe('9223372036854775807');
    });
  });

  // -----------------------------------------------------------------------
  describe('signedDecimalTokenMap', () => {

    it('produces the correct token for known signed decimal', () => {
      expect(signedDecimalTokenMap(SIGNED)).toBe(TOKEN);
    });

    it('matches S2CellId.fromToken for a known token', () => {
      const cell = S2CellId.fromToken(TOKEN);
      const signed = cell.toSignedDecimalString();
      expect(signedDecimalTokenMap(signed)).toBe(TOKEN);
    });

    it('round-trip: token → S2CellId → signed → signedDecimalTokenMap → token', () => {
      // Only canonical tokens (no trailing '0') round-trip correctly through toToken().
      const tokens = ['1', '3', 'a555f6151', '89c25c1', '2ef59bd'];
      tokens.forEach(tok => {
        const cell   = S2CellId.fromToken(tok);
        const signed = cell.toSignedDecimalString();
        expect(signedDecimalTokenMap(signed)).toBe(tok);
      });
    });
  });

  // -----------------------------------------------------------------------
  describe('round-trip invariants', () => {

    const cases = [
      SIGNED,
      '-9223372036854775808',
      '9223372036854775807',
      '0',
      '1',
      '-1',
    ];

    it('unsignedToSignedDecimal(signedDecimalToUnsigned(s)) === s', () => {
      cases.forEach(s => {
        expect(unsignedToSignedDecimal(signedDecimalToUnsigned(s))).toBe(s);
      });
    });

    const unsignedCases: bigint[] = [
      UNSIGNED,
      0n,
      1n,
      9223372036854775807n,
      9223372036854775808n,
      18446744073709551615n,
    ];

    it('signedDecimalToUnsigned(unsignedToSignedDecimal(n)) === n', () => {
      unsignedCases.forEach(n => {
        expect(signedDecimalToUnsigned(unsignedToSignedDecimal(n))).toBe(n);
      });
    });
  });
});
