/**
 * Transitional utilities for consumers migrating from nodes2-ts v3 (Long-based API)
 * to v4 (bigint-based API).
 *
 * These helpers make it easy to work with signed-decimal cell ID strings that
 * older code or Java S2 libraries produce (e.g. "-6533045114107854848") alongside
 * the new unsigned bigint representation.
 */

import { S2CellId } from './S2CellId';

/**
 * Convert a signed-decimal string (as produced by Java's Long.toString()) to an
 * unsigned 64-bit bigint.
 *
 * @example
 * signedDecimalToUnsigned('-6533045114107854848')
 * // => 11913698959601696768n
 */
export function signedDecimalToUnsigned(s: string): bigint {
  return BigInt.asUintN(64, BigInt(s));
}

/**
 * Convert an unsigned 64-bit bigint back to a signed-decimal string, as Java's
 * Long.toString() would produce.
 *
 * @example
 * unsignedToSignedDecimal(11913698959601696768n)
 * // => '-6533045114107854848'
 */
export function unsignedToSignedDecimal(id: bigint): string {
  return BigInt.asIntN(64, id).toString();
}

/**
 * Convenience: convert a signed-decimal S2 cell ID string (from Java) to its
 * token representation.
 *
 * @example
 * signedDecimalTokenMap('-6533045114107854848')
 * // => 'a555f6151'
 */
export function signedDecimalTokenMap(signedId: string): string {
  return new S2CellId(signedDecimalToUnsigned(signedId)).toToken();
}
