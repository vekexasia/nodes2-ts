/*
 * Copyright 2005 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { u64, low32s, UINT64_MAX } from './uint64';
import { S2Point } from "./S2Point";
import { R2Vector } from "./R2Vector";
import { S2 } from "./S2";
import { MutableInteger } from "./MutableInteger";
import { S2LatLng } from "./S2LatLng";
import { S2Projections, UvTransform } from './S2Projections';

/**
 * An S2CellId is a 64-bit unsigned integer that uniquely identifies a cell in
 * the S2 cell decomposition. It has the following format:
 *
 * <pre>
 * id = [face][face_pos]
 * </pre>
 *
 * face: a 3-bit number (range 0..5) encoding the cube face.
 *
 * face_pos: a 61-bit number encoding the position of the center of this cell
 * along the Hilbert curve over this face (see the Wiki pages for details).
 *
 * Sequentially increasing cell ids follow a continuous space-filling curve over
 * the entire sphere. They have the following properties:
 *  - The id of a cell at level k consists of a 3-bit face number followed by k
 * bit pairs that recursively select one of the four children of each cell. The
 * next bit is always 1, and all other bits are 0. Therefore, the level of a
 * cell is determined by the position of its lowest-numbered bit that is turned
 * on (for a cell at level k, this position is 2 * (MAX_LEVEL - k).)
 *  - The id of a parent cell is at the midpoint of the range of ids spanned by
 * its children (or by its descendants at any level).
 *
 * Leaf cells are often used to represent points on the unit sphere, and this
 * class provides methods for converting directly between these two
 * representations. For cells that represent 2D regions rather than discrete
 * point, it is better to use the S2Cell class.
 *
 * v4 CHANGE: S2CellId.id is now a native bigint (unsigned uint64).
 * The constructor accepts bigint, string (signed or unsigned decimal), or number.
 */
export class S2CellId {

  // Although only 60 bits are needed to represent the index of a leaf
  // cell, we need an extra bit in order to represent the position of
  // the center of the leaf cell along the Hilbert curve.
  public static FACE_BITS = 3;
  public static NUM_FACES = 6;
  public static MAX_LEVEL = 30; // Valid levels: 0..MAX_LEVEL
  /**
   * The number of bits used by a position along the Hilbert curve over all
   * faces (range 1..2*MAX_LEVEL+1). This is a fixed constant encoding the
   * canonical 64-bit S2 cell ID layout; it must NEVER be derived from a
   * mutable MAX_LEVEL.
   */
  public static readonly POS_BITS = 2 * 30 + 1; // = 61
  /**
   * The maximum coordinate value for an (i,j) cell index. Equal to 2^30.
   * Fixed constant matching the 30-level S2 grid.
   */
  public static readonly MAX_SIZE = 1 << 30; // = 1073741824

  /** Maximum unsigned 64-bit value (sentinel). */
  public static MAX_UNSIGNED: bigint = UINT64_MAX;

  // The following lookup tables are used to convert efficiently between an
  // (i,j) cell index and the corresponding position along the Hilbert curve.
  public static LOOKUP_BITS = 4;
  private static SWAP_MASK = 0x01;
  private static INVERT_MASK = 0x02;

  private static I_SHIFT = 33;
  private static J_SHIFT = 2;

  private static J_MASK = (1n << 31n) - 1n;           // 2^31 - 1

  private static SI_SHIFT = 32;
  private static ORIENTATION_MASK = 3n;

  private static TI_MASK = 0xFFFF_FFFFn;              // lower 32 bits

  /** LOOKUP_POS[10-bit key] = 10-bit value (stored as bigint) */
  public static LOOKUP_POS: bigint[] = [];
  /** LOOKUP_IJ[10-bit key] = 10-bit value */
  public static LOOKUP_IJ: number[] = [];

  /**
   * This is the offset required to wrap around from the beginning of the
   * Hilbert curve to the end or vice versa; see next_wrap() and prev_wrap().
   */
  /**
   * Precomputed wrap offset. Fixed constant; must not be derived from a
   * mutable POS_BITS.
   */
  private static readonly WRAP_OFFSET: bigint =
    BigInt(S2CellId.NUM_FACES) << BigInt(S2CellId.POS_BITS);

  /**
   * The 64-bit unsigned cell ID.
   * v4: changed from Long to bigint. Always in [0, 2^64-1].
   */
  public id: bigint;

  /**
   * Construct an S2CellId from a bigint, decimal string, or number.
   *
   * The string may be signed ("-6533045114107854848") or unsigned
   * ("11913698959601696768"); both are handled via BigInt.asUintN(64, ...).
   *
   * Numbers must be finite integers within the safe-integer range
   * (|n| ≤ Number.MAX_SAFE_INTEGER = 2^53 − 1). Values outside that range
   * may have silently lost precision in JS before reaching this constructor,
   * so a RangeError is thrown. Use a bigint literal for large cell IDs
   * (e.g. `-9182983676231680000n`).
   *
   * @throws {TypeError}  if `id` is a non-integer or non-finite number.
   * @throws {RangeError} if `id` exceeds safe-integer precision (> 2^53 − 1).
   */
  constructor(id: bigint | string | number) {
    if (typeof id === 'string') {
      // BigInt() parses the signed decimal, asUintN reinterprets as unsigned.
      this.id = BigInt.asUintN(64, BigInt(id));
    } else if (typeof id === 'number') {
      if (!Number.isInteger(id) || !isFinite(id)) {
        throw new TypeError(`S2CellId: non-integer or non-finite number: ${id}`);
      }
      if (!Number.isSafeInteger(id)) {
        throw new RangeError(
          `S2CellId: number ${id} exceeds safe integer precision (> 2^53). ` +
          `Use a bigint literal instead, e.g. ${BigInt(id)}n`
        );
      }
      this.id = BigInt.asUintN(64, BigInt(id));
    } else {
      this.id = BigInt.asUintN(64, id);
    }
  }

  // -------------------------------------------------------------------------
  // Migration helpers (v3 → v4 compatibility)
  // -------------------------------------------------------------------------

  /**
   * Construct an S2CellId from a **signed**-decimal string produced by Java's
   * Long.toString() or the v3 Long-based API. Equivalent to `new S2CellId(s)`
   * but makes the intent explicit.
   *
   * @example
   * S2CellId.fromSignedDecimalString('-6533045114107854848')
   */
  public static fromSignedDecimalString(s: string): S2CellId {
    return new S2CellId(BigInt.asUintN(64, BigInt(s)));
  }

  /**
   * Return this cell id as a signed-decimal string, matching the output of
   * Java's Long.toString() and the v3 Long-based API.
   *
   * @example
   * cellId.toSignedDecimalString() // '-6533045114107854848'
   */
  public toSignedDecimalString(): string {
    return BigInt.asIntN(64, this.id).toString();
  }

  /**
   * Return this cell id as an unsigned-decimal string (same as `this.id.toString()`).
   *
   * @example
   * cellId.toUnsignedDecimalString() // '11913698959601696768'
   */
  public toUnsignedDecimalString(): string {
    return this.id.toString();
  }

  // -------------------------------------------------------------------------
  // Core geometry
  // -------------------------------------------------------------------------

  /** Which cube face this cell belongs to, in the range 0..5. */
  get face(): number {
    return Number(this.id >> BigInt(S2CellId.POS_BITS));
  }

  /** Return the lowest-numbered bit that is on for this cell. */
  public lowestOnBit(): bigint {
    return S2CellId.lowestOnBit(this.id);
  }

  static lowestOnBit(id: bigint): bigint {
    // id & (-id) using two's-complement unsigned arithmetic
    return id & u64(-id);
  }

  /** Return an invalid cell id (id == 0). */
  public static none(): S2CellId {
    return new S2CellId(0n);
  }

  /**
   * Returns an invalid cell id guaranteed to be larger than any valid cell id.
   * Useful for creating indexes.
   */
  public static sentinel(): S2CellId {
    return new S2CellId(UINT64_MAX);
  }

  private getBits1(
    i: MutableInteger,
    j: MutableInteger,
    k: number,
    bits: number,
  ): number {
    const nbits =
      k === 7
        ? S2CellId.MAX_LEVEL - 7 * S2CellId.LOOKUP_BITS
        : S2CellId.LOOKUP_BITS;

    const shift = k * 2 * S2CellId.LOOKUP_BITS + 1;
    const mask = (1 << (2 * nbits)) - 1;
    bits += (Number((this.id >> BigInt(shift)) & BigInt(mask))) << 2;

    bits = S2CellId.LOOKUP_IJ[bits];
    i.val =
      i.val +
      ((bits >> (S2CellId.LOOKUP_BITS + 2)) << (k * S2CellId.LOOKUP_BITS));
    j.val =
      j.val +
      (((bits >> 2) & ((1 << S2CellId.LOOKUP_BITS) - 1)) <<
        (k * S2CellId.LOOKUP_BITS));

    bits &= S2.SWAP_MASK | S2.INVERT_MASK;
    return bits;
  }

  /** Return the lowest-numbered bit that is on for cells at the given level. */
  public static lowestOnBitForLevel(level: number): bigint {
    return 1n << BigInt(2 * (S2CellId.MAX_LEVEL - level));
  }

  /**
   * @deprecated use `toIJOrientation` instead
   */
  public toFaceIJOrientation(
    pi: MutableInteger,
    pj: MutableInteger,
    orientation: MutableInteger,
  ): number {
    const face = this.face;
    let bits = face & S2.SWAP_MASK;

    for (let k = 7; k >= 0; --k) {
      bits = this.getBits1(pi, pj, k, bits);
    }

    if (orientation != null) {
      if ((0x1111111111111110n & this.lowestOnBit()) !== 0n) {
        bits ^= S2.SWAP_MASK;
      }
      orientation.val = bits;
    }
    return face;
  }

  /**
   * Return a packed bigint encoding (i << I_SHIFT | j << J_SHIFT | orientation).
   * Use getI(), getJ(), getOrientation() to unpack.
   */
  public toIJOrientation(): bigint {
    const face = this.face;
    let bits = face & S2.SWAP_MASK;

    let i = 0;
    let j = 0;
    for (let k = 7; k >= 0; --k) {
      const nbits =
        k === 7
          ? S2CellId.MAX_LEVEL - 7 * S2CellId.LOOKUP_BITS
          : S2CellId.LOOKUP_BITS;

      const shift = k * 2 * S2CellId.LOOKUP_BITS + 1;
      const mask = (1 << (2 * nbits)) - 1;
      bits += (Number((this.id >> BigInt(shift)) & BigInt(mask))) << 2;

      bits = S2CellId.LOOKUP_IJ[bits];
      i += (bits >> (S2CellId.LOOKUP_BITS + 2)) << (k * S2CellId.LOOKUP_BITS);
      j +=
        ((bits >> 2) & ((1 << S2CellId.LOOKUP_BITS) - 1)) <<
        (k * S2CellId.LOOKUP_BITS);

      bits &= S2.SWAP_MASK | S2.INVERT_MASK;
    }

    if ((0x1111111111111110n & this.lowestOnBit()) !== 0n) {
      bits ^= S2.SWAP_MASK;
    }

    const orientation = bits;
    return (
      (BigInt(i) << BigInt(S2CellId.I_SHIFT)) |
      (BigInt(j) << BigInt(S2CellId.J_SHIFT)) |
      BigInt(orientation)
    );
  }

  public getI(): number {
    return S2CellId.getI(this.toIJOrientation());
  }

  static getI(ijo: bigint): number {
    return Number(ijo >> BigInt(S2CellId.I_SHIFT));
  }

  public getJ(): number {
    return S2CellId.getJ(this.toIJOrientation());
  }

  static getJ(ijo: bigint): number {
    return Number((ijo >> BigInt(S2CellId.J_SHIFT)) & S2CellId.J_MASK);
  }

  static getOrientation(ijo: bigint): number {
    return Number(ijo & S2CellId.ORIENTATION_MASK);
  }

  /** Return true if this is a leaf cell (level() == MAX_LEVEL). */
  public isLeaf(): boolean {
    return (this.id & 1n) !== 0n;
  }

  /**
   * Return the cell at the given level (which must be ≤ the current level).
   */
  public parentL(level: number): S2CellId {
    const newLsb = S2CellId.lowestOnBitForLevel(level);
    return new S2CellId((this.id & u64(-newLsb)) | newLsb);
  }

  public parent(): S2CellId {
    const oldLsb = this.lowestOnBit();
    const newLsb = oldLsb << 2n;
    return new S2CellId((this.id & u64(-newLsb)) | newLsb);
  }

  /**
   * Return a cell given its face (range 0..5), 61-bit Hilbert curve position
   * within that face, and level (range 0..MAX_LEVEL).
   *
   * v4: `pos` is now `bigint` (was `Long`).
   */
  public static fromFacePosLevel(
    face: number,
    pos: bigint,
    level: number,
  ): S2CellId {
    return new S2CellId(
      (BigInt(face) << BigInt(S2CellId.POS_BITS)) + (pos | 1n),
    ).parentL(level);
  }

  public static fromFace(face: number): S2CellId {
    return new S2CellId(S2CellId.fromFaceAsBigInt(face));
  }

  public static fromPoint(p: S2Point): S2CellId {
    const face = S2Projections.xyzToFaceP(p);
    const t: UvTransform = S2Projections.faceToUvTransform(face);
    const i = S2Projections.stToIj(
      R2Vector.singleUVToST(t.xyzToU(p.x, p.y, p.z)),
    );
    const j = S2Projections.stToIj(
      R2Vector.singleUVToST(t.xyzToV(p.x, p.y, p.z)),
    );
    return this.fromFaceIJ(face, i, j);
  }

  public getCenterUV(): R2Vector {
    const center = this.getCenterSiTi();
    return new R2Vector(
      R2Vector.singleStTOUV(
        S2Projections.siTiToSt(S2CellId.getSi(center)),
      ),
      R2Vector.singleStTOUV(
        S2Projections.siTiToSt(S2CellId.getTi(center)),
      ),
    );
  }

  public toPoint(): S2Point {
    return S2Point.normalize(this.toPointRaw());
  }

  /**
   * Returns packed (si << 32 | ti) as a bigint.
   * v4: return type changed from Long to bigint.
   */
  getCenterSiTi(): bigint {
    const ijo = this.toIJOrientation();
    const i = S2CellId.getI(ijo);
    const j = S2CellId.getJ(ijo);
    const delta = this.isLeaf()
      ? 1
      : ((i ^ (low32s(this.id) >>> 2)) & 1) !== 0
        ? 2
        : 0;

    return (
      (BigInt(2 * i + delta) << BigInt(S2CellId.SI_SHIFT)) |
      (S2CellId.TI_MASK & BigInt(2 * j + delta))
    );
  }

  static getSi(center: bigint): number {
    return Number(center >> BigInt(S2CellId.SI_SHIFT));
  }

  static getTi(center: bigint): number {
    return Number(center & S2CellId.TI_MASK);
  }

  public toPointRaw(): S2Point {
    const center = this.getCenterSiTi();
    return S2Projections.faceSiTiToXYZ(
      this.face,
      S2CellId.getSi(center),
      S2CellId.getTi(center),
    );
  }

  public toLatLng(): S2LatLng {
    return S2LatLng.fromPoint(this.toPointRaw());
  }

  /** Return true if id() represents a valid cell. */
  public isValid(): boolean {
    return (
      this.face < S2CellId.NUM_FACES &&
      (this.lowestOnBit() & 0x1555555555555555n) !== 0n
    );
  }

  /**
   * The position of the cell center along the Hilbert curve over this face,
   * in the range 0..(2**kPosBits-1).
   *
   * v4: return type changed from Long to bigint.
   */
  public pos(): bigint {
    return this.id & (UINT64_MAX >> BigInt(S2CellId.FACE_BITS));
  }

  /** Return the subdivision level of the cell (range 0..MAX_LEVEL). */
  public level(): number {
    if (this.isLeaf()) {
      return S2CellId.MAX_LEVEL;
    }
    // Fast path using lower 32 bits
    let x = low32s(this.id); // signed 32-bit lower half (equiv. to Java getLowBits())
    let level = -1;
    if (x !== 0) {
      level += 16;
    } else {
      x = low32s(this.id >> 32n);
    }
    // We only need to look at even-numbered bits to determine the level.
    x &= -x; // isolate lowest set bit
    if ((x & 0x00005555) !== 0) {
      level += 8;
    }
    if ((x & 0x00550055) !== 0) {
      level += 4;
    }
    if ((x & 0x05050505) !== 0) {
      level += 2;
    }
    if ((x & 0x11111111) !== 0) {
      level += 1;
    }
    return level;
  }

  public getSizeIJ(): number {
    return S2CellId.getSizeIJ(this.level());
  }

  static getSizeIJ(level: number): number {
    return 1 << (S2.MAX_LEVEL - level);
  }

  public getSizeST(): number {
    return S2CellId.getSizeST(this.level());
  }

  static getSizeST(level: number): number {
    return S2Projections.ijToStMin(S2CellId.getSizeIJ(level));
  }

  public isFace(): boolean {
    return this.level() === 0;
  }

  public childPosition(level: number): number {
    return Number(
      (this.id >> BigInt(2 * (S2CellId.MAX_LEVEL - level) + 1)) & 3n,
    );
  }

  public rangeMin(): S2CellId {
    // id - (lowestOnBit() - 1)
    return new S2CellId(u64(this.id - this.lowestOnBit() + 1n));
  }

  public rangeMax(): S2CellId {
    // id + (lowestOnBit() - 1)
    return new S2CellId(this.id + this.lowestOnBit() - 1n);
  }

  public contains(other: S2CellId): boolean {
    return (
      other.greaterOrEquals(this.rangeMin()) &&
      other.lessOrEquals(this.rangeMax())
    );
  }

  public intersects(other: S2CellId): boolean {
    return (
      other.rangeMin().lessOrEquals(this.rangeMax()) &&
      other.rangeMax().greaterOrEquals(this.rangeMin())
    );
  }

  public childBegin(): S2CellId {
    return new S2CellId(S2CellId.childBeginAsBigInt(this.id));
  }

  public childBeginL(level: number): S2CellId {
    return new S2CellId(S2CellId.childBeginAsBigIntL(this.id, level));
  }

  public childEnd(): S2CellId {
    return new S2CellId(S2CellId.childEndAsBigInt(this.id));
  }

  public childEndL(level: number): S2CellId {
    return new S2CellId(S2CellId.childEndAsBigIntL(this.id, level));
  }

  private static childBeginAsBigInt(id: bigint): bigint {
    const oldLsb = S2CellId.lowestOnBit(id);
    return u64(id - oldLsb + (oldLsb >> 2n));
  }

  private static childBeginAsBigIntL(id: bigint, level: number): bigint {
    return u64(
      id - S2CellId.lowestOnBit(id) + S2CellId.lowestOnBitForLevel(level),
    );
  }

  private static childEndAsBigInt(id: bigint): bigint {
    const oldLsb = S2CellId.lowestOnBit(id);
    return u64(id + oldLsb + (oldLsb >> 2n));
  }

  private static childEndAsBigIntL(id: bigint, level: number): bigint {
    return u64(
      id + S2CellId.lowestOnBit(id) + S2CellId.lowestOnBitForLevel(level),
    );
  }

  private static fromFaceAsBigInt(face: number): bigint {
    return (
      (BigInt(face) << BigInt(S2CellId.POS_BITS)) +
      S2CellId.lowestOnBitForLevel(0)
    );
  }

  /** Return the next cell at the same level along the Hilbert curve. */
  public next(): S2CellId {
    return new S2CellId(u64(this.id + (this.lowestOnBit() << 1n)));
  }

  /** Return the previous cell at the same level along the Hilbert curve. */
  public prev(): S2CellId {
    return new S2CellId(u64(this.id - (this.lowestOnBit() << 1n)));
  }

  public nextWrap(): S2CellId {
    const n = this.next();
    if (n.id < S2CellId.WRAP_OFFSET) {
      return n;
    }
    return new S2CellId(u64(n.id - S2CellId.WRAP_OFFSET));
  }

  public prevWrap(): S2CellId {
    const p = this.prev();
    if (p.id < S2CellId.WRAP_OFFSET) {
      return p;
    }
    return new S2CellId(p.id + S2CellId.WRAP_OFFSET);
  }

  static begin(level: number): S2CellId {
    return S2CellId.fromFacePosLevel(0, 0n, 0).childBeginL(level);
  }

  static end(level: number): S2CellId {
    return S2CellId.fromFacePosLevel(5, 0n, 0).childEndL(level);
  }

  /**
   * Decodes a cell id from a compact hex token string.
   * The maximum token length is 16 hex characters.
   */
  public static fromToken(token: string): S2CellId {
    if (token == null) {
      throw new Error('Null string in S2CellId.fromToken');
    }
    if (token.length === 0) {
      throw new Error('Empty string in S2CellId.fromToken');
    }
    if (token.length > 16 || token === 'X') {
      return S2CellId.none();
    }
    // Pad with trailing zeros to 16 hex chars, then parse as 64-bit unsigned.
    const padded = token.padEnd(16, '0');
    return new S2CellId(BigInt('0x' + padded));
  }

  /**
   * Encodes the cell id to a compact hex token string.
   * Cells at lower levels are encoded into fewer characters.
   */
  public toToken(): string {
    if (this.id === 0n) {
      return 'X';
    }
    const hex = this.id.toString(16).padStart(16, '0');
    let len = 16;
    while (len > 0 && hex[len - 1] === '0') {
      len--;
    }
    return hex.substring(0, len);
  }

  public getEdgeNeighbors(): S2CellId[] {
    const level = this.level();
    const size = this.getSizeIJ();
    const face = this.face;

    const ijo = this.toIJOrientation();
    const i = S2CellId.getI(ijo);
    const j = S2CellId.getJ(ijo);

    return [
      S2CellId.fromFaceIJSame(face, i, j - size, j - size >= 0).parentL(
        level,
      ),
      S2CellId.fromFaceIJSame(
        face,
        i + size,
        j,
        i + size < S2CellId.MAX_SIZE,
      ).parentL(level),
      S2CellId.fromFaceIJSame(
        face,
        i,
        j + size,
        j + size < S2CellId.MAX_SIZE,
      ).parentL(level),
      S2CellId.fromFaceIJSame(face, i - size, j, i - size >= 0).parentL(
        level,
      ),
    ];
  }

  public getVertexNeighbors(level: number): S2CellId[] {
    const ijo = this.toIJOrientation();
    const i = S2CellId.getI(ijo);
    const j = S2CellId.getJ(ijo);

    const halfsize = S2CellId.getSizeIJ(level + 1);
    const size = halfsize << 1;
    let isame: boolean, jsame: boolean;
    let ioffset: number, joffset: number;

    if ((i & halfsize) !== 0) {
      ioffset = size;
      isame = i + size < S2CellId.MAX_SIZE;
    } else {
      ioffset = -size;
      isame = i - size >= 0;
    }
    if ((j & halfsize) !== 0) {
      joffset = size;
      jsame = j + size < S2CellId.MAX_SIZE;
    } else {
      joffset = -size;
      jsame = j - size >= 0;
    }

    const face = this.face;
    const toRet: S2CellId[] = [this.parentL(level)];
    toRet.push(
      S2CellId.fromFaceIJSame(face, i + ioffset, j, isame).parentL(level),
    );
    toRet.push(
      S2CellId.fromFaceIJSame(face, i, j + joffset, jsame).parentL(level),
    );
    if (isame || jsame) {
      toRet.push(
        S2CellId.fromFaceIJSame(
          face,
          i + ioffset,
          j + joffset,
          isame && jsame,
        ).parentL(level),
      );
    }
    return toRet;
  }

  public getAllNeighbors(nbrLevel: number): S2CellId[] {
    const ijo = this.toIJOrientation();

    const size = this.getSizeIJ();
    const face = this.face;
    const i = S2CellId.getI(ijo) & -size;
    const j = S2CellId.getJ(ijo) & -size;

    const nbrSize = S2CellId.getSizeIJ(nbrLevel);

    const output: S2CellId[] = [];
    for (let k = -nbrSize; ; k += nbrSize) {
      let sameFace: boolean;
      if (k < 0) {
        sameFace = j + k >= 0;
      } else if (k >= size) {
        sameFace = j + k < S2CellId.MAX_SIZE;
      } else {
        sameFace = true;
        output.push(
          S2CellId.fromFaceIJSame(
            face,
            i + k,
            j - nbrSize,
            j - size >= 0,
          ).parentL(nbrLevel),
        );
        output.push(
          S2CellId.fromFaceIJSame(
            face,
            i + k,
            j + size,
            j + size < S2CellId.MAX_SIZE,
          ).parentL(nbrLevel),
        );
      }
      output.push(
        S2CellId.fromFaceIJSame(
          face,
          i - nbrSize,
          j + k,
          sameFace && i - size >= 0,
        ).parentL(nbrLevel),
      );
      output.push(
        S2CellId.fromFaceIJSame(
          face,
          i + size,
          j + k,
          sameFace && i + size < S2CellId.MAX_SIZE,
        ).parentL(nbrLevel),
      );
      if (k >= size) {
        break;
      }
    }
    return output;
  }

  // ///////////////////////////////////////////////////////////////////
  // Low-level methods.

  public static fromFaceIJ(face: number, i: number, j: number): S2CellId {
    // n[1] holds the high 32 bits, n[0] holds the low 32 bits.
    const n: bigint[] = [0n, BigInt(face) << BigInt(S2CellId.POS_BITS - 33)];

    let bits = face & S2CellId.SWAP_MASK;

    for (let k = 7; k >= 0; --k) {
      bits = S2CellId.getBits(n, i, j, k, bits);
    }

    // Combine halves, shift left 1, set leaf bit.
    return new S2CellId(((n[1] << 32n) | n[0]) << 1n | 1n);
  }

  private static getBits(
    n: bigint[],
    i: number,
    j: number,
    k: number,
    bits: number,
  ): number {
    const mask = (1 << S2CellId.LOOKUP_BITS) - 1; // 15
    bits += ((i >> (k * S2CellId.LOOKUP_BITS)) & mask) << (S2CellId.LOOKUP_BITS + 2);
    bits += ((j >> (k * S2CellId.LOOKUP_BITS)) & mask) << 2;

    const lookupBits = S2CellId.LOOKUP_POS[bits]; // bigint
    n[k >> 2] =
      n[k >> 2] |
      ((lookupBits >> 2n) <<
        BigInt((k & 3) * 2 * S2CellId.LOOKUP_BITS));

    return Number(lookupBits) & (S2CellId.SWAP_MASK | S2CellId.INVERT_MASK);
  }

  private static stToIJ(s: number): number {
    const m = S2CellId.MAX_SIZE / 2;
    return Math.max(0, Math.min(m * 2 - 1, Math.round(m * s + m - 0.5)));
  }

  private static fromFaceIJWrap(face: number, i: number, j: number): S2CellId {
    i = Math.max(-1, Math.min(S2CellId.MAX_SIZE, i));
    j = Math.max(-1, Math.min(S2CellId.MAX_SIZE, j));

    const kScale = 1 / S2CellId.MAX_SIZE;
    // Plain number arithmetic: values fit in 32-bit int
    const s = kScale * (2 * i + 1 - S2CellId.MAX_SIZE);
    const t = kScale * (2 * j + 1 - S2CellId.MAX_SIZE);

    const p = new R2Vector(s, t).toPoint(face);
    face = p.toFace();
    const st = p.toR2Vector(face);
    return S2CellId.fromFaceIJ(
      face,
      S2CellId.stToIJ(st.x),
      S2CellId.stToIJ(st.y),
    );
  }

  public static fromFaceIJSame(
    face: number,
    i: number,
    j: number,
    sameFace: boolean,
  ): S2CellId {
    return sameFace
      ? S2CellId.fromFaceIJ(face, i, j)
      : S2CellId.fromFaceIJWrap(face, i, j);
  }

  // -------------------------------------------------------------------------
  // Unsigned comparison helpers (trivial now that bigint is always positive)
  // -------------------------------------------------------------------------

  /** Returns true if x1 < x2 (unsigned comparison). */
  public static unsignedLongLessThan(x1: bigint, x2: bigint): boolean {
    return x1 < x2;
  }

  /** Returns true if x1 > x2 (unsigned comparison). */
  public static unsignedLongGreaterThan(x1: bigint, x2: bigint): boolean {
    return x1 > x2;
  }

  public lessThan(x: S2CellId): boolean {
    return this.id < x.id;
  }

  public greaterThan(x: S2CellId): boolean {
    return this.id > x.id;
  }

  public lessOrEquals(x: S2CellId): boolean {
    return this.id <= x.id;
  }

  public greaterOrEquals(x: S2CellId): boolean {
    return this.id >= x.id;
  }

  public toString(): string {
    return (
      '(face=' +
      this.face +
      ', pos=' +
      this.pos().toString(16) +
      ', level=' +
      this.level() +
      ')'
    );
  }

  public compareTo(that: S2CellId): number {
    return this.id < that.id ? -1 : this.id > that.id ? 1 : 0;
  }

  public equals(that: S2CellId): boolean {
    return this.id === that.id;
  }

  /**
   * Binary search in a sorted S2CellId array.
   * Returns index if found, or -(insertionPoint+1) if not found.
   *
   * v4: `_id` accepts bigint, string, number, or S2CellId (was Long, string, or S2CellId).
   */
  public static binarySearch(
    ids: S2CellId[],
    _id: bigint | string | number | S2CellId,
    low = 0,
  ): number {
    let id: S2CellId;
    if (_id instanceof S2CellId) {
      id = _id;
    } else {
      id = new S2CellId(_id as bigint | string | number);
    }
    let high = ids.length - 1;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = ids[mid];
      const cmp = midVal.compareTo(id);

      if (cmp < 0) low = mid + 1;
      else if (cmp > 0) high = mid - 1;
      else return mid;
    }
    return -(low + 1);
  }

  public static indexedBinarySearch(
    ids: S2CellId[],
    id: bigint | string | number | S2CellId,
    low = 0,
  ): number {
    const toRet = this.binarySearch(ids, id, low);
    return toRet >= 0 ? toRet : -(toRet + 1);
  }
}

// -------------------------------------------------------------------------
// Lookup table initialisation
// -------------------------------------------------------------------------

function initLookupCell(
  level: number,
  i: number,
  j: number,
  origOrientation: number,
  pos: bigint,
  orientation: number,
): void {
  if (level === S2CellId.LOOKUP_BITS) {
    const ij = (i << S2CellId.LOOKUP_BITS) + j;
    S2CellId.LOOKUP_POS[(ij << 2) + origOrientation] =
      (pos << 2n) + BigInt(orientation);
    S2CellId.LOOKUP_IJ[Number((pos << 2n) + BigInt(origOrientation))] =
      (ij << 2) + orientation;
  } else {
    level++;
    i <<= 1;
    j <<= 1;
    pos = pos << 2n;
    for (let subPos = 0; subPos < 4; subPos++) {
      const ij = S2.POS_TO_IJ[orientation][subPos];
      const orientationMask = S2.POS_TO_ORIENTATION[subPos];
      initLookupCell(
        level,
        i + (ij >>> 1),
        j + (ij & 1),
        origOrientation,
        pos + BigInt(subPos),
        orientation ^ orientationMask,
      );
    }
  }
}

initLookupCell(0, 0, 0, 0, 0n, 0);
initLookupCell(0, 0, 0, S2.SWAP_MASK, 0n, S2.SWAP_MASK);
initLookupCell(0, 0, 0, S2.INVERT_MASK, 0n, S2.INVERT_MASK);
initLookupCell(
  0,
  0,
  0,
  S2.SWAP_MASK | S2.INVERT_MASK,
  0n,
  S2.SWAP_MASK | S2.INVERT_MASK,
);
