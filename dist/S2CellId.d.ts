/// <reference types="long" />
import * as Long from 'long';
import { S2Point } from "./S2Point";
import { MutableInteger } from "./MutableInteger";
import { S2LatLng } from "./S2LatLng";
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
 *
 */
export declare class S2CellId {
    static FACE_BITS: number;
    static NUM_FACES: number;
    static MAX_LEVEL: number;
    static POS_BITS: number;
    static MAX_SIZE: number;
    private static maxValueDivs;
    private static maxValueMods;
    static MAX_UNSIGNED: Long;
    static LOOKUP_BITS: number;
    private static SWAP_MASK;
    private static INVERT_MASK;
    static LOOKUP_POS: Long[];
    static LOOKUP_IJ: number[];
    /**
     * This is the offset required to wrap around from the beginning of the
     * Hilbert curve to the end or vice versa; see next_wrap() and prev_wrap().
     */
    private static WRAP_OFFSET;
    id: Long;
    constructor(id: Long | string);
    /** Which cube face this cell belongs to, in the range 0..5. */
    readonly face: number;
    /** Return the lowest-numbered bit that is on for cells at the given level. */
    lowestOnBit(): Long;
    /** The default constructor returns an invalid cell id. */
    static none(): S2CellId;
    /**
     * Returns an invalid cell id guaranteed to be larger than any valid cell id.
     * Useful for creating indexes.
     */
    static sentinel(): S2CellId;
    private getBits1(i, j, k, bits);
    /**
     * Convert (face, si, ti) coordinates (see s2.h) to a direction vector (not
     * necessarily unit length).
     */
    private faceSiTiToXYZ(face, si, ti);
    static lowestOnBitForLevel(level: number): Long;
    /**
     * Return the (face, i, j) coordinates for the leaf cell corresponding to this
     * cell id. Since cells are represented by the Hilbert curve position at the
     * center of the cell, the returned (i,j) for non-leaf cells will be a leaf
     * cell adjacent to the cell center. If "orientation" is non-NULL, also return
     * the Hilbert curve orientation for the current cell.
     */
    toFaceIJOrientation(pi: MutableInteger, pj: MutableInteger, orientation: MutableInteger): number;
    /**
     * Return true if this is a leaf cell (more efficient than checking whether
     * level() == MAX_LEVEL).
     */
    isLeaf(): boolean;
    /**
     * Return the cell at the previous level or at the given level (which must be
     * less than or equal to the current level).
     */
    parentL(level: number): S2CellId;
    parent(): S2CellId;
    /**
     * Return a cell given its face (range 0..5), 61-bit Hilbert curve position
     * within that face, and level (range 0..MAX_LEVEL). The given position will
     * be modified to correspond to the Hilbert curve position at the center of
     * the returned cell. This is a static function rather than a constructor in
     * order to give names to the arguments.
     */
    static fromFacePosLevel(face: number, pos: Long, level: number): S2CellId;
    static fromPoint(p: S2Point): S2CellId;
    toPoint(): S2Point;
    /**
     * Return the direction vector corresponding to the center of the given cell.
     * The vector returned by ToPointRaw is not necessarily unit length.
     */
    toPointRaw(): S2Point;
    /** Return the S2LatLng corresponding to the center of the given cell. */
    toLatLng(): S2LatLng;
    /** Return true if id() represents a valid cell. */
    isValid(): boolean;
    /**
     * The position of the cell center along the Hilbert curve over this face, in
     * the range 0..(2**kPosBits-1).
     */
    pos(): Long;
    /** Return the subdivision level of the cell (range 0..MAX_LEVEL). */
    level(): number;
    /**
     * Return true if this is a top-level face cell (more efficient than checking
     * whether level() == 0).
     */
    isFace(): boolean;
    /**
     * Return the child position (0..3) of this cell's ancestor at the given
     * level, relative to its parent. The argument should be in the range
     * 1..MAX_LEVEL. For example, child_position(1) returns the position of this
     * cell's level-1 ancestor within its top-level face cell.
     */
    childPosition(level: number): number;
    rangeMin(): S2CellId;
    rangeMax(): S2CellId;
    /** Return true if the given cell is contained within this one. */
    contains(other: S2CellId): boolean;
    /** Return true if the given cell intersects this one. */
    intersects(other: S2CellId): boolean;
    childBegin(): S2CellId;
    childBeginL(level: number): S2CellId;
    childEnd(): S2CellId;
    childEndL(level: number): S2CellId;
    /**
     * Return the next cell at the same level along the Hilbert curve. Works
     * correctly when advancing from one face to the next, but does *not* wrap
     * around from the last face to the first or vice versa.
     */
    next(): S2CellId;
    /**
     * Return the previous cell at the same level along the Hilbert curve. Works
     * correctly when advancing from one face to the next, but does *not* wrap
     * around from the last face to the first or vice versa.
     */
    prev(): S2CellId;
    /**
     * Like next(), but wraps around from the last face to the first and vice
     * versa. Should *not* be used for iteration in conjunction with
     * child_begin(), child_end(), Begin(), or End().
     */
    nextWrap(): S2CellId;
    /**
     * Like prev(), but wraps around from the last face to the first and vice
     * versa. Should *not* be used for iteration in conjunction with
     * child_begin(), child_end(), Begin(), or End().
     */
    prevWrap(): S2CellId;
    static begin(level: number): S2CellId;
    static end(level: number): S2CellId;
    /**
     * Decodes the cell id from a compact text string suitable for display or
     * indexing. Cells at lower levels (i.e. larger cells) are encoded into
     * fewer characters. The maximum token length is 16.
     *
     * @param token the token to decode
     * @return the S2CellId for that token
     * @throws NumberFormatException if the token is not formatted correctly
     */
    static fromToken(token: string): S2CellId;
    /**
     * Encodes the cell id to compact text strings suitable for display or indexing.
     * Cells at lower levels (i.e. larger cells) are encoded into fewer characters.
     * The maximum token length is 16.
     *
     * Simple implementation: convert the id to hex and strip trailing zeros. We
     * could use base-32 or base-64, but assuming the cells used for indexing
     * regions are at least 100 meters across (level 16 or less), the savings
     * would be at most 3 bytes (9 bytes hex vs. 6 bytes base-64).
     *
     * @return the encoded cell id
     */
    toToken(): string;
    /**
     * Returns true if (current * radix) + digit is a number too large to be
     * represented by an unsigned long.  This is useful for detecting overflow
     * while parsing a string representation of a number.
     * Does not verify whether supplied radix is valid, passing an invalid radix
     * will give undefined results or an ArrayIndexOutOfBoundsException.
     */
    private static overflowInParse(current, digit, radix?);
    /**
     * Return the four cells that are adjacent across the cell's four edges.
     * Neighbors are returned in the order defined by S2Cell::GetEdge. All
     * neighbors are guaranteed to be distinct.
     */
    getEdgeNeighbors(): S2CellId[];
    /**
     * Return the neighbors of closest vertex to this cell at the given level, by
     * appending them to "output". Normally there are four neighbors, but the
     * closest vertex may only have three neighbors if it is one of the 8 cube
     * vertices.
     *
     * Requires: level < this.evel(), so that we can determine which vertex is
     * closest (in particular, level == MAX_LEVEL is not allowed).
     */
    getVertexNeighbors(level: number): S2CellId[];
    /**
     * Append all neighbors of this cell at the given level to "output". Two cells
     * X and Y are neighbors if their boundaries intersect but their interiors do
     * not. In particular, two cells that intersect at a single point are
     * neighbors.
     *
     * Requires: nbr_level >= this->level(). Note that for cells adjacent to a
     * face vertex, the same neighbor may be appended more than once.
     */
    getAllNeighbors(nbrLevel: number): S2CellId[];
    /**
     * Return a leaf cell given its cube face (range 0..5) and i- and
     * j-coordinates (see s2.h).
     */
    static fromFaceIJ(face: number, i: number, j: number): S2CellId;
    private static getBits(n, i, j, k, bits);
    /**
     * Return the i- or j-index of the leaf cell containing the given s- or
     * t-value.
     */
    private static stToIJ(_s);
    /**
     * Given (i, j) coordinates that may be out of bounds, normalize them by
     * returning the corresponding neighbor cell on an adjacent face.
     */
    private static fromFaceIJWrap(face, i, j);
    /**
     * Public helper function that calls FromFaceIJ if sameFace is true, or
     * FromFaceIJWrap if sameFace is false.
     */
    static fromFaceIJSame(face: number, i: number, j: number, sameFace: boolean): S2CellId;
    /**
     * Returns true if x1 < x2, when both values are treated as unsigned.
     */
    static unsignedLongLessThan(x1: Long, x2: Long): boolean;
    /**
     * Returns true if x1 > x2, when both values are treated as unsigned.
     */
    static unsignedLongGreaterThan(x1: Long, x2: Long): boolean;
    lessThan(x: S2CellId): boolean;
    greaterThan(x: S2CellId): boolean;
    lessOrEquals(x: S2CellId): boolean;
    greaterOrEquals(x: S2CellId): boolean;
    toString(): string;
    compareTo(that: S2CellId): number;
    equals(that: S2CellId): boolean;
    /**
     * Returns the position of the id within the given list or a negative value with
     * the position of the index wher eit should be entered if the id was present
     */
    static binarySearch(ids: S2CellId[], id: Long | string | number | S2CellId, low?: number): number;
}
