/**
 * Utility helpers for unsigned 64-bit bigint arithmetic.
 *
 * All values stored in S2CellId.id are guaranteed to be in [0, 2^64-1].
 * Use u64() to mask any operation that can produce an out-of-range value
 * (addition, subtraction, multiplication, shift-left, bitwise-not, negation).
 */

/** Mask a bigint value to the unsigned 64-bit range [0, 2^64-1]. */
export function u64(n: bigint): bigint {
  return BigInt.asUintN(64, n);
}

/** Extract the lower 32 bits as an unsigned JS number [0, 2^32-1]. */
export function low32(n: bigint): number {
  return Number(n & 0xFFFF_FFFFn);
}

/**
 * Extract the lower 32 bits as a signed JS number [-2^31, 2^31-1].
 * Equivalent to Java Long.getLowBits().
 */
export function low32s(n: bigint): number {
  return Number(BigInt.asIntN(32, n));
}

/** Maximum value of a uint64: 2^64 - 1 */
export const UINT64_MAX = 0xFFFF_FFFF_FFFF_FFFFn;
