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
///<reference path="../typings/index.d.ts"/>
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2Point", "./R2Vector", "./S2", "./MutableInteger", "./S2LatLng", 'decimal.js'], factory);
    }
})(function (require, exports) {
    "use strict";
    var Long = require("long");
    var S2Point_1 = require("./S2Point");
    var R2Vector_1 = require("./R2Vector");
    var S2_1 = require("./S2");
    var MutableInteger_1 = require("./MutableInteger");
    var S2LatLng_1 = require("./S2LatLng");
    var Decimal = require('decimal.js');
    var parseHex = function parseHex(str) {
        return Long.fromString(str, false, 16);
    };
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
    var S2CellId = (function () {
        function S2CellId(id) {
            if (typeof (id) === 'string') {
                this.id = Long.fromString(id);
            }
            else {
                this.id = id;
            }
        }
        Object.defineProperty(S2CellId.prototype, "face", {
            /** Which cube face this cell belongs to, in the range 0..5. */
            get: function () {
                return this.id.shiftRightUnsigned(S2CellId.POS_BITS).toInt();
            },
            enumerable: true,
            configurable: true
        });
        /** Return the lowest-numbered bit that is on for cells at the given level. */
        S2CellId.prototype.lowestOnBit = function () {
            return this.id.and(this.id.negate());
        };
        /** The default constructor returns an invalid cell id. */
        S2CellId.none = function () {
            return new S2CellId(new Long(0));
        };
        /**
         * Returns an invalid cell id guaranteed to be larger than any valid cell id.
         * Useful for creating indexes.
         */
        S2CellId.sentinel = function () {
            return new S2CellId(S2CellId.MAX_UNSIGNED); // -1
        };
        S2CellId.prototype.getBits1 = function (i, j, k, bits) {
            var nbits = (k == 7) ? (S2CellId.MAX_LEVEL - 7 * S2CellId.LOOKUP_BITS) : S2CellId.LOOKUP_BITS;
            bits += (this.id
                .shiftRightUnsigned((k * 2 * S2CellId.LOOKUP_BITS + 1))
                .getLowBitsUnsigned()
                & ((1 << (2 * nbits)) - 1)) << 2;
            /*
             * System.out.println("id is: " + id_); System.out.println("bits is " +
             * bits); System.out.println("lookup_ij[bits] is " + lookup_ij[bits]);
             */
            bits = S2CellId.LOOKUP_IJ[bits];
            i.val = i.val + ((bits >> (S2CellId.LOOKUP_BITS + 2)) << (k * S2CellId.LOOKUP_BITS));
            // i.setValue(i.intValue() + ((bits >> (LOOKUP_BITS + 2)) << (k * LOOKUP_BITS)));
            /*
             * System.out.println("left is " + ((bits >> 2) & ((1 << kLookupBits) -
             * 1))); System.out.println("right is " + (k * kLookupBits));
             * System.out.println("j is: " + j.intValue()); System.out.println("addition
             * is: " + ((((bits >> 2) & ((1 << kLookupBits) - 1))) << (k *
             * kLookupBits)));
             */
            j.val = j.val + ((((bits >> 2) & ((1 << S2CellId.LOOKUP_BITS) - 1))) << (k * S2CellId.LOOKUP_BITS));
            bits &= (S2_1.S2.SWAP_MASK | S2_1.S2.INVERT_MASK);
            return bits;
        };
        /**
         * Convert (face, si, ti) coordinates (see s2.h) to a direction vector (not
         * necessarily unit length).
         */
        S2CellId.prototype.faceSiTiToXYZ = function (face, si, ti) {
            // console.log('faceSiTiToXYZ', si, ti);
            var kScale = S2_1.S2.toDecimal(1).dividedBy(S2CellId.MAX_SIZE);
            var uvVector = R2Vector_1.R2Vector.fromSTVector(new R2Vector_1.R2Vector(kScale.times(si), kScale.times(ti)));
            // console.log(uvVector.toString(), uvVector.x.toString());
            return uvVector.toPoint(face);
        };
        S2CellId.lowestOnBitForLevel = function (level) {
            return new Long(1).shiftLeft(2 * (S2CellId.MAX_LEVEL - level));
        };
        /**
         * Return the (face, i, j) coordinates for the leaf cell corresponding to this
         * cell id. Since cells are represented by the Hilbert curve position at the
         * center of the cell, the returned (i,j) for non-leaf cells will be a leaf
         * cell adjacent to the cell center. If "orientation" is non-NULL, also return
         * the Hilbert curve orientation for the current cell.
         */
        S2CellId.prototype.toFaceIJOrientation = function (pi, pj, orientation) {
            // System.out.println("Entering toFaceIjorientation");
            var face = this.face;
            var bits = (face & S2_1.S2.SWAP_MASK);
            // System.out.println("face = " + face + " bits = " + bits);
            // Each iteration maps 8 bits of the Hilbert curve position into
            // 4 bits of "i" and "j". The lookup table transforms a key of the
            // form "ppppppppoo" to a value of the form "iiiijjjjoo", where the
            // letters [ijpo] represents bits of "i", "j", the Hilbert curve
            // position, and the Hilbert curve orientation respectively.
            //
            // On the first iteration we need to be careful to clear out the bits
            // representing the cube face.
            for (var k = 7; k >= 0; --k) {
                bits = this.getBits1(pi, pj, k, bits);
            }
            if (orientation != null) {
                // The position of a non-leaf cell at level "n" consists of a prefix of
                // 2*n bits that identifies the cell, followed by a suffix of
                // 2*(MAX_LEVEL-n)+1 bits of the form 10*. If n==MAX_LEVEL, the suffix is
                // just "1" and has no effect. Otherwise, it consists of "10", followed
                // by (MAX_LEVEL-n-1) repetitions of "00", followed by "0". The "10" has
                // no effect, while each occurrence of "00" has the effect of reversing
                // the kSwapMask bit.
                // assert (S2.POS_TO_ORIENTATION[2] == 0);
                // assert (S2.POS_TO_ORIENTATION[0] == S2.SWAP_MASK);
                if ((Long.fromString('0x1111111111111110', true, 16).and(this.lowestOnBit()).notEquals(0))) {
                    bits ^= S2_1.S2.SWAP_MASK;
                }
                orientation.val = bits;
            }
            return face;
        };
        /**
         * Return true if this is a leaf cell (more efficient than checking whether
         * level() == MAX_LEVEL).
         */
        S2CellId.prototype.isLeaf = function () {
            return this.id.and(1).getLowBits() != 0;
        };
        /**
         * Return the cell at the previous level or at the given level (which must be
         * less than or equal to the current level).
         */
        S2CellId.prototype.parentL = function (level) {
            // assert (isValid() && level >= 0 && level <= this.level());
            var newLsb = S2CellId.lowestOnBitForLevel(level);
            return new S2CellId(this.id.and(newLsb.negate()).or(newLsb));
            // return new S2CellId((id & -newLsb) | newLsb);
        };
        S2CellId.prototype.parent = function () {
            // assert (isValid() && level() > 0);
            var newLsb = this.lowestOnBit().shiftLeft(2);
            // return new S2CellId((id & -newLsb) | newLsb);
            return new S2CellId(this.id.and(newLsb.negate()).or(newLsb));
        };
        /**
         * Return a cell given its face (range 0..5), 61-bit Hilbert curve position
         * within that face, and level (range 0..MAX_LEVEL). The given position will
         * be modified to correspond to the Hilbert curve position at the center of
         * the returned cell. This is a static function rather than a constructor in
         * order to give names to the arguments.
         */
        S2CellId.fromFacePosLevel = function (face, pos, level) {
            // equivalent to pos | 1
            return new S2CellId(new Long(face)
                .shiftLeft(S2CellId.POS_BITS)
                .add(pos.or(1))).parentL(level);
            // return new S2CellId((((long) face) << POS_BITS) + (pos | 1)).parent(level);
        };
        // /**
        //  * Return the leaf cell containing the given point (a direction vector, not
        //  * necessarily unit length).
        //  */
        S2CellId.fromPoint = function (p) {
            var face = p.toFace();
            var uv = p.toR2Vector(face);
            var i = S2CellId.stToIJ(uv.toSt(0));
            var j = S2CellId.stToIJ(uv.toSt(1));
            return S2CellId.fromFaceIJ(face, i, j);
        };
        //
        //
        // /** Return the leaf cell containing the given S2LatLng. */
        // public static S2CellId fromLatLng(S2LatLng ll) {
        //   return fromPoint(ll.toPoint());
        // }
        S2CellId.prototype.toPoint = function () {
            return S2Point_1.S2Point.normalize(this.toPointRaw());
        };
        /**
         * Return the direction vector corresponding to the center of the given cell.
         * The vector returned by ToPointRaw is not necessarily unit length.
         */
        S2CellId.prototype.toPointRaw = function () {
            // First we compute the discrete (i,j) coordinates of a leaf cell contained
            // within the given cell. Given that cells are represented by the Hilbert
            // curve position corresponding at their center, it turns out that the cell
            // returned by ToFaceIJOrientation is always one of two leaf cells closest
            // to the center of the cell (unless the given cell is a leaf cell itself,
            // in which case there is only one possibility).
            //
            // Given a cell of size s >= 2 (i.e. not a leaf cell), and letting (imin,
            // jmin) be the coordinates of its lower left-hand corner, the leaf cell
            // returned by ToFaceIJOrientation() is either (imin + s/2, jmin + s/2)
            // (imin + s/2 - 1, jmin + s/2 - 1). We can distinguish these two cases by
            // looking at the low bit of "i" or "j". In the first case the low bit is
            // zero, unless s == 2 (i.e. the level just above leaf cells) in which case
            // the low bit is one.
            //
            // The following calculation converts (i,j) to the (si,ti) coordinates of
            // the cell center. (We need to multiply the coordinates by a factor of 2
            // so that the center of leaf cells can be represented exactly.)
            var i = new MutableInteger_1.MutableInteger(0);
            var j = new MutableInteger_1.MutableInteger(0);
            var face = this.toFaceIJOrientation(i, j, null);
            // System.out.println("i= " + i.intValue() + " j = " + j.intValue());
            // let delta = isLeaf() ? 1 : (((i.intValue() ^ (((int) id) >>> 2)) & 1) != 0) ? 2 : 0;
            var delta = this.isLeaf()
                ? 1 :
                ((((new Long(i.val).getLowBits() ^ ((this.id.getLowBits()) >>> 2)) & 1) != 0)
                    ? 2 : 0);
            // let delta = this.isLeaf() ? 1 : new Long(i.val).and(this.id.getLowBits() >>> 2).and(1).notEquals(1) ? 2 : 0
            // ((i.val ? (((int)id) >>> 2))  & 1  ))
            var si = new Long((i.val << 1) + delta - S2CellId.MAX_SIZE).getLowBits();
            var ti = new Long((j.val << 1) + delta - S2CellId.MAX_SIZE).getLowBits();
            return this.faceSiTiToXYZ(face, si, ti);
        };
        /** Return the S2LatLng corresponding to the center of the given cell. */
        S2CellId.prototype.toLatLng = function () {
            return S2LatLng_1.S2LatLng.fromPoint(this.toPointRaw());
        };
        /** Return true if id() represents a valid cell. */
        S2CellId.prototype.isValid = function () {
            return this.face < S2CellId.NUM_FACES && ((this.lowestOnBit().and(Long.fromString('0x1555555555555555', false, 16)).notEquals(0)));
            // return this.face() < NUM_FACES && ((lowestOnBit() & (0x1555555555555555L)) != 0);
        };
        /**
         * The position of the cell center along the Hilbert curve over this face, in
         * the range 0..(2**kPosBits-1).
         */
        S2CellId.prototype.pos = function () {
            return this.id.and(S2CellId.MAX_UNSIGNED.shiftRightUnsigned(S2CellId.FACE_BITS));
            // return (id & (-1L >>> FACE_BITS));
        };
        /** Return the subdivision level of the cell (range 0..MAX_LEVEL). */
        S2CellId.prototype.level = function () {
            // Fast path for leaf cells.
            if (this.isLeaf()) {
                return S2CellId.MAX_LEVEL;
            }
            var x = this.id.getLowBits();
            var level = -1;
            if (x != 0) {
                level += 16;
            }
            else {
                x = this.id.shiftRightUnsigned(32).getLowBits();
            }
            // We only need to look at even-numbered bits to determine the
            // level of a valid cell id.
            x &= -x; // Get lowest bit.
            if ((x & 0x00005555) != 0) {
                level += 8;
            }
            if ((x & 0x00550055) != 0) {
                level += 4;
            }
            if ((x & 0x05050505) != 0) {
                level += 2;
            }
            if ((x & 0x11111111) != 0) {
                level += 1;
            }
            // assert (level >= 0 && level <= MAX_LEVEL);
            return level;
        };
        /**
         * Return true if this is a top-level face cell (more efficient than checking
         * whether level() == 0).
         */
        S2CellId.prototype.isFace = function () {
            return this.level() === 0;
            // return (id & (lowestOnBitForLevel(0) - 1)) == 0;
        };
        /**
         * Return the child position (0..3) of this cell's ancestor at the given
         * level, relative to its parent. The argument should be in the range
         * 1..MAX_LEVEL. For example, child_position(1) returns the position of this
         * cell's level-1 ancestor within its top-level face cell.
         */
        S2CellId.prototype.childPosition = function (level) {
            return this.id.shiftRight((2 * (S2CellId.MAX_LEVEL - level) + 1)).and(3).getLowBits();
            // return (int) (id >>> (2 * (MAX_LEVEL - level) + 1)) & 3;
        };
        // Methods that return the range of cell ids that are contained
        // within this cell (including itself). The range is *inclusive*
        // (i.e. test using >= and <=) and the return values of both
        // methods are valid leaf cell ids.
        //
        // These methods should not be used for iteration. If you want to
        // iterate through all the leaf cells, call child_begin(MAX_LEVEL) and
        // child_end(MAX_LEVEL) instead.
        //
        // It would in fact be error-prone to define a range_end() method,
        // because (range_max().id() + 1) is not always a valid cell id, and the
        // iterator would need to be tested using "<" rather that the usual "!=".
        S2CellId.prototype.rangeMin = function () {
            return new S2CellId(this.id.sub(this.lowestOnBit().sub(1)));
            // return new S2CellId(id - (lowestOnBit() - 1));
        };
        S2CellId.prototype.rangeMax = function () {
            return new S2CellId(this.id.add(this.lowestOnBit().sub(1)));
            // return new S2CellId(id + (lowestOnBit() - 1));
        };
        //
        //
        /** Return true if the given cell is contained within this one. */
        S2CellId.prototype.contains = function (other) {
            // assert (isValid() && other.isValid());
            return other.greaterOrEquals(this.rangeMin()) && other.lessOrEquals(this.rangeMax());
        };
        /** Return true if the given cell intersects this one. */
        S2CellId.prototype.intersects = function (other) {
            // assert (isValid() && other.isValid());
            return other.rangeMin().lessOrEquals(this.rangeMax())
                && other.rangeMax().greaterOrEquals(this.rangeMin());
        };
        S2CellId.prototype.childBegin = function () {
            // assert (isValid() && level() < MAX_LEVEL);
            var oldLsb = this.lowestOnBit();
            return new S2CellId(this.id.sub(oldLsb).add(oldLsb.shiftRight(2)));
            // return new S2CellId(id - oldLsb + (oldLsb >>> 2));
        };
        S2CellId.prototype.childBeginL = function (level) {
            // assert (isValid() && level >= this.level() && level <= MAX_LEVEL);
            return new S2CellId(this.id.sub(this.lowestOnBit()).add(S2CellId.lowestOnBitForLevel(level)));
            // return new S2CellId(id - lowestOnBit() + lowestOnBitForLevel(level));
        };
        S2CellId.prototype.childEnd = function () {
            // assert (isValid() && level() < MAX_LEVEL);
            var oldLsb = this.lowestOnBit();
            return new S2CellId(this.id.add(oldLsb).add(oldLsb.shiftRightUnsigned(2)));
            // return new S2CellId(id + oldLsb + (oldLsb >>> 2));
        };
        S2CellId.prototype.childEndL = function (level) {
            // assert (isValid() && level >= this.level() && level <= MAX_LEVEL);
            return new S2CellId(this.id.add(this.lowestOnBit()).add(S2CellId.lowestOnBitForLevel(level)));
            // return new S2CellId(id + lowestOnBit() + lowestOnBitForLevel(level));
        };
        //
        // Iterator-style methods for traversing the immediate children of a cell or
        // all of the children at a given level (greater than or equal to the current
        // level). Note that the end value is exclusive, just like standard STL
        // iterators, and may not even be a valid cell id. You should iterate using
        // code like this:
        //
        // for(S2CellId c = id.childBegin(); !c.equals(id.childEnd()); c = c.next())
        // ...
        //
        // The convention for advancing the iterator is "c = c.next()", so be sure
        // to use 'equals()' in the loop guard, or compare 64-bit cell id's,
        // rather than "c != id.childEnd()".
        /**
         * Return the next cell at the same level along the Hilbert curve. Works
         * correctly when advancing from one face to the next, but does *not* wrap
         * around from the last face to the first or vice versa.
         */
        S2CellId.prototype.next = function () {
            return new S2CellId(this.id.add(this.lowestOnBit().shiftLeft(1)));
            // return new S2CellId(id + (lowestOnBit() << 1));
        };
        /**
         * Return the previous cell at the same level along the Hilbert curve. Works
         * correctly when advancing from one face to the next, but does *not* wrap
         * around from the last face to the first or vice versa.
         */
        S2CellId.prototype.prev = function () {
            return new S2CellId(this.id.sub(this.lowestOnBit().shiftLeft(1)));
            // return new S2CellId(id - (lowestOnBit() << 1));
        };
        /**
         * Like next(), but wraps around from the last face to the first and vice
         * versa. Should *not* be used for iteration in conjunction with
         * child_begin(), child_end(), Begin(), or End().
         */
        S2CellId.prototype.nextWrap = function () {
            var n = this.next();
            if (S2CellId.unsignedLongLessThan(n.id, S2CellId.WRAP_OFFSET)) {
                return n;
            }
            return new S2CellId(n.id.sub(S2CellId.WRAP_OFFSET));
            // return new S2CellId(n.id - WRAP_OFFSET);
        };
        /**
         * Like prev(), but wraps around from the last face to the first and vice
         * versa. Should *not* be used for iteration in conjunction with
         * child_begin(), child_end(), Begin(), or End().
         */
        S2CellId.prototype.prevWrap = function () {
            var p = this.prev();
            if (p.id.lessThan(S2CellId.WRAP_OFFSET)) {
                return p;
            }
            return new S2CellId(p.id.add(S2CellId.WRAP_OFFSET));
        };
        S2CellId.begin = function (level) {
            return S2CellId.fromFacePosLevel(0, new Long(0), 0).childBeginL(level);
        };
        S2CellId.end = function (level) {
            return S2CellId.fromFacePosLevel(5, new Long(0), 0).childEndL(level);
        };
        /**
         * Decodes the cell id from a compact text string suitable for display or
         * indexing. Cells at lower levels (i.e. larger cells) are encoded into
         * fewer characters. The maximum token length is 16.
         *
         * @param token the token to decode
         * @return the S2CellId for that token
         * @throws NumberFormatException if the token is not formatted correctly
         */
        S2CellId.fromToken = function (token) {
            if (token == null) {
                throw new Error("Null string in S2CellId.fromToken");
            }
            if (token.length == 0) {
                throw new Error("Empty string in S2CellId.fromToken");
            }
            if (token.length > 16 || "X" == token) {
                return S2CellId.none();
            }
            var value = new Long(0);
            for (var pos = 0; pos < 16; pos++) {
                var digit = new Long(0);
                if (pos < token.length) {
                    digit = Long.fromString(token[pos], true, 16);
                    if (digit.equals(-1)) {
                        throw new Error(token);
                    }
                    if (S2CellId.overflowInParse(value, digit.toNumber())) {
                        throw new Error("Too large for unsigned long: " + token);
                    }
                }
                value = value.mul(16).add(digit);
            }
            return new S2CellId(value);
        };
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
        S2CellId.prototype.toToken = function () {
            if (this.id.equals(0)) {
                return "X";
            }
            var hex = this.id.toUnsigned().toString(16);
            // Long.toHexString(id).toLowerCase(Locale.ENGLISH);
            var sb = '';
            for (var i = hex.length; i < 16; i++) {
                sb += '0';
            }
            sb += hex;
            // sb.append(hex);
            for (var len = 16; len > 0; len--) {
                if (sb[len - 1] != '0') {
                    return sb.substring(0, len);
                }
            }
            throw new Error("Shouldn't make it here");
        };
        /**
         * Returns true if (current * radix) + digit is a number too large to be
         * represented by an unsigned long.  This is useful for detecting overflow
         * while parsing a string representation of a number.
         * Does not verify whether supplied radix is valid, passing an invalid radix
         * will give undefined results or an ArrayIndexOutOfBoundsException.
         */
        S2CellId.overflowInParse = function (current, digit, radix) {
            if (radix === void 0) { radix = 10; }
            if (current.greaterThanOrEqual(0)) {
                if (current.lessThan(S2CellId.maxValueDivs[radix])) {
                    return false;
                }
                if (current.greaterThan(S2CellId.maxValueDivs[radix])) {
                    return true;
                }
                // current == maxValueDivs[radix]
                return (digit > S2CellId.maxValueMods[radix]);
            }
            // current < 0: high bit is set
            return true;
        };
        /**
         * Return the four cells that are adjacent across the cell's four edges.
         * Neighbors are returned in the order defined by S2Cell::GetEdge. All
         * neighbors are guaranteed to be distinct.
         */
        S2CellId.prototype.getEdgeNeighbors = function () {
            var i = new MutableInteger_1.MutableInteger(0);
            var j = new MutableInteger_1.MutableInteger(0);
            var level = this.level();
            var size = 1 << (S2CellId.MAX_LEVEL - level);
            var face = this.toFaceIJOrientation(i, j, null);
            var neighbors = [];
            // Edges 0, 1, 2, 3 are in the S, E, N, W directions.
            neighbors.push(S2CellId.fromFaceIJSame(face, i.val, j.val - size, j.val - size >= 0).parentL(level));
            neighbors.push(S2CellId.fromFaceIJSame(face, i.val + size, j.val, i.val + size < S2CellId.MAX_SIZE).parentL(level));
            neighbors.push(S2CellId.fromFaceIJSame(face, i.val, j.val + size, j.val + size < S2CellId.MAX_SIZE).parentL(level));
            neighbors.push(S2CellId.fromFaceIJSame(face, i.val - size, j.val, i.val - size >= 0).parentL(level));
            // neighbors[0] = fromFaceIJSame(face, i.intValue(), j.intValue() - size,
            //     j.intValue() - size >= 0).parent(level);
            // neighbors[1] = fromFaceIJSame(face, i.intValue() + size, j.intValue(),
            //     i.intValue() + size < MAX_SIZE).parent(level);
            // neighbors[2] = fromFaceIJSame(face, i.intValue(), j.intValue() + size,
            //     j.intValue() + size < MAX_SIZE).parent(level);
            // neighbors[3] = fromFaceIJSame(face, i.intValue() - size, j.intValue(),
            //     i.intValue() - size >= 0).parent(level);
            return neighbors;
        };
        /**
         * Return the neighbors of closest vertex to this cell at the given level, by
         * appending them to "output". Normally there are four neighbors, but the
         * closest vertex may only have three neighbors if it is one of the 8 cube
         * vertices.
         *
         * Requires: level < this.evel(), so that we can determine which vertex is
         * closest (in particular, level == MAX_LEVEL is not allowed).
         */
        S2CellId.prototype.getVertexNeighbors = function (level) {
            // "level" must be strictly less than this cell's level so that we can
            // determine which vertex this cell is closest to.
            // assert (level < this.level());
            var i = new MutableInteger_1.MutableInteger(0);
            var j = new MutableInteger_1.MutableInteger(0);
            var face = this.toFaceIJOrientation(i, j, null);
            // Determine the i- and j-offsets to the closest neighboring cell in each
            // direction. This involves looking at the next bit of "i" and "j" to
            // determine which quadrant of this->parent(level) this cell lies in.
            var halfsize = 1 << (S2CellId.MAX_LEVEL - (level + 1));
            var size = halfsize << 1;
            var isame, jsame;
            var ioffset, joffset;
            if ((i.val & halfsize) != 0) {
                ioffset = size;
                isame = (i.val + size) < S2CellId.MAX_SIZE;
            }
            else {
                ioffset = -size;
                isame = (i.val - size) >= 0;
            }
            if ((j.val & halfsize) != 0) {
                joffset = size;
                jsame = (j.val + size) < S2CellId.MAX_SIZE;
            }
            else {
                joffset = -size;
                jsame = (j.val - size) >= 0;
            }
            var toRet = [];
            toRet.push(this.parentL(level));
            toRet.push(S2CellId
                .fromFaceIJSame(face, i.val + ioffset, j.val, isame)
                .parentL(level));
            // output
            //     .add(fromFaceIJSame(face, i.intValue() + ioffset, j.intValue(), isame)
            //         .parent(level));
            toRet.push(S2CellId
                .fromFaceIJSame(face, i.val, j.val + joffset, jsame)
                .parentL(level));
            // output
            //     .add(fromFaceIJSame(face, i.intValue(), j.intValue() + joffset, jsame)
            //         .parent(level));
            // If i- and j- edge neighbors are *both* on a different face, then this
            // vertex only has three neighbors (it is one of the 8 cube vertices).
            if (isame || jsame) {
                toRet.push(S2CellId.fromFaceIJSame(face, i.val + ioffset, j.val + joffset, isame && jsame).parentL(level));
            }
            return toRet;
        };
        /**
         * Append all neighbors of this cell at the given level to "output". Two cells
         * X and Y are neighbors if their boundaries intersect but their interiors do
         * not. In particular, two cells that intersect at a single point are
         * neighbors.
         *
         * Requires: nbr_level >= this->level(). Note that for cells adjacent to a
         * face vertex, the same neighbor may be appended more than once.
         */
        S2CellId.prototype.getAllNeighbors = function (nbrLevel) {
            var i = new MutableInteger_1.MutableInteger(0);
            var j = new MutableInteger_1.MutableInteger(0);
            var face = this.toFaceIJOrientation(i, j, null);
            // Find the coordinates of the lower left-hand leaf cell. We need to
            // normalize (i,j) to a known position within the cell because nbr_level
            // may be larger than this cell's level.
            var size = 1 << (S2CellId.MAX_LEVEL - this.level());
            i.val = i.val & -size;
            j.val = j.val & -size;
            var nbrSize = 1 << (S2CellId.MAX_LEVEL - nbrLevel);
            // assert (nbrSize <= size);
            var output = [];
            // We compute the N-S, E-W, and diagonal neighbors in one pass.
            // The loop test is at the end of the loop to avoid 32-bit overflow.
            for (var k = -nbrSize;; k += nbrSize) {
                var sameFace = void 0;
                if (k < 0) {
                    sameFace = (j.val + k >= 0);
                }
                else if (k >= size) {
                    sameFace = (j.val + k < S2CellId.MAX_SIZE);
                }
                else {
                    sameFace = true;
                    // North and South neighbors.
                    output.push(S2CellId.fromFaceIJSame(face, i.val + k, j.val - nbrSize, j.val - size >= 0).parentL(nbrLevel));
                    output.push(S2CellId.fromFaceIJSame(face, i.val + k, j.val + size, j.val + size < S2CellId.MAX_SIZE).parentL(nbrLevel));
                }
                // East, West, and Diagonal neighbors.
                output.push(S2CellId.fromFaceIJSame(face, i.val - nbrSize, j.val + k, sameFace && i.val - size >= 0).parentL(nbrLevel));
                output.push(S2CellId.fromFaceIJSame(face, i.val + size, j.val + k, sameFace && i.val + size < S2CellId.MAX_SIZE).parentL(nbrLevel));
                if (k >= size) {
                    break;
                }
            }
            return output;
        };
        // ///////////////////////////////////////////////////////////////////
        // Low-level methods.
        /**
         * Return a leaf cell given its cube face (range 0..5) and i- and
         * j-coordinates (see s2.h).
         */
        S2CellId.fromFaceIJ = function (face, i, j) {
            // Optimization notes:
            // - Non-overlapping bit fields can be combined with either "+" or "|".
            // Generally "+" seems to produce better code, but not always.
            // gcc doesn't have very good code generation for 64-bit operations.
            // We optimize this by computing the result as two 32-bit integers
            // and combining them at the end. Declaring the result as an array
            // rather than local variables helps the compiler to do a better job
            // of register allocation as well. Note that the two 32-bits halves
            // get shifted one bit to the left when they are combined.
            var faceL = new Long(face);
            var n = [new Long(0), faceL.shiftLeft(S2CellId.POS_BITS - 33)];
            // Alternating faces have opposite Hilbert curve orientations; this
            // is necessary in order for all faces to have a right-handed
            // coordinate system.
            var bits = faceL.and(S2CellId.SWAP_MASK);
            // Each iteration maps 4 bits of "i" and "j" into 8 bits of the Hilbert
            // curve position. The lookup table transforms a 10-bit key of the form
            // "iiiijjjjoo" to a 10-bit value of the form "ppppppppoo", where the
            // letters [ijpo] denote bits of "i", "j", Hilbert curve position, and
            // Hilbert curve orientation respectively.
            for (var k = 7; k >= 0; --k) {
                bits = S2CellId.getBits(n, i, j, k, bits);
            }
            // S2CellId s = new S2CellId((((n[1] << 32) + n[0]) << 1) + 1);
            return new S2CellId(n[1].shiftLeft(32)
                .add(n[0])
                .shiftLeft(1)
                .add(1));
        };
        S2CellId.getBits = function (n, i, j, k, bits) {
            var mask = new Long(1).shiftLeft(S2CellId.LOOKUP_BITS).sub(1);
            bits = bits.add(new Long(i)
                .shiftRight(k * S2CellId.LOOKUP_BITS)
                .and(mask)
                .shiftLeft(S2CellId.LOOKUP_BITS + 2));
            // bits += (((i >> (k * LOOKUP_BITS)) & mask) << (LOOKUP_BITS + 2));
            bits = bits.add(new Long(j)
                .shiftRight(k * S2CellId.LOOKUP_BITS)
                .and(mask)
                .shiftLeft(2));
            // bits += (((j >> (k * LOOKUP_BITS)) & mask) << 2);
            bits = S2CellId.LOOKUP_POS[bits.toNumber()];
            n[k >> 2] = n[k >> 2].or(bits.shiftRight(2).shiftLeft((k & 3) * 2 * S2CellId.LOOKUP_BITS));
            // n[k >> 2] |= ((((long) bits) >> 2) << ((k & 3) * 2 * LOOKUP_BITS));
            return bits.and(S2CellId.SWAP_MASK | S2CellId.INVERT_MASK);
        };
        /**
         * Return the i- or j-index of the leaf cell containing the given s- or
         * t-value.
         */
        S2CellId.stToIJ = function (_s) {
            // Converting from floating-point to integers via static_cast is very slow
            // on Intel processors because it requires changing the rounding mode.
            // Rounding to the nearest integer using FastIntRound() is much faster.
            var s = S2_1.S2.toDecimal(_s);
            var m = S2_1.S2.toDecimal(S2CellId.MAX_SIZE).dividedBy(2); // scaling multiplier
            return Decimal.max(0, Decimal.min(m.times(2).minus(1), Decimal.round(m.times(s).plus(m.minus(0.5))))).toNumber();
            // return Math.max(0,  Math.min(2 * m - 1, Math.round(m * s + (m - 0.5))));
            // return (int) Math.max(0, Math.min(2 * m - 1, Math.round(m * s + (m - 0.5))));
        };
        /**
         * Given (i, j) coordinates that may be out of bounds, normalize them by
         * returning the corresponding neighbor cell on an adjacent face.
         */
        S2CellId.fromFaceIJWrap = function (face, i, j) {
            // Convert i and j to the coordinates of a leaf cell just beyond the
            // boundary of this face. This prevents 32-bit overflow in the case
            // of finding the neighbors of a face cell, and also means that we
            // don't need to worry about the distinction between (s,t) and (u,v).
            i = Math.max(-1, Math.min(S2CellId.MAX_SIZE, i));
            j = Math.max(-1, Math.min(S2CellId.MAX_SIZE, j));
            // Find the (s,t) coordinates corresponding to (i,j). At least one
            // of these coordinates will be just outside the range [0, 1].
            var kScale = S2_1.S2.toDecimal(1.0).dividedBy(S2CellId.MAX_SIZE);
            var s = kScale.times(new Long(i).shiftLeft(1).add(1).sub(S2CellId.MAX_SIZE).toInt());
            var t = kScale.times(new Long(j).shiftLeft(1).add(1).sub(S2CellId.MAX_SIZE).toInt());
            // Find the leaf cell coordinates on the adjacent face, and convert
            // them to a cell id at the appropriate level.
            var p = new R2Vector_1.R2Vector(s, t).toPoint(face);
            face = p.toFace();
            // face = S2Projections.xyzToFace(p);
            var st = p.toR2Vector(face);
            // R2Vector st = S2Projections.validFaceXyzToUv(face, p);
            return S2CellId.fromFaceIJ(face, S2CellId.stToIJ(st.x), S2CellId.stToIJ(st.y));
        };
        /**
         * Public helper function that calls FromFaceIJ if sameFace is true, or
         * FromFaceIJWrap if sameFace is false.
         */
        S2CellId.fromFaceIJSame = function (face, i, j, sameFace) {
            if (sameFace) {
                return S2CellId.fromFaceIJ(face, i, j);
            }
            else {
                return S2CellId.fromFaceIJWrap(face, i, j);
            }
        };
        /**
         * Returns true if x1 < x2, when both values are treated as unsigned.
         */
        S2CellId.unsignedLongLessThan = function (x1, x2) {
            return x1.toUnsigned().lessThan(x2.toUnsigned());
            // return (x1 + Long.MIN_VALUE) < (x2 + Long.MIN_VALUE);
        };
        /**
         * Returns true if x1 > x2, when both values are treated as unsigned.
         */
        S2CellId.unsignedLongGreaterThan = function (x1, x2) {
            return x1.toUnsigned().greaterThan(x2.toUnsigned());
            // return (x1 + Long.MIN_VALUE) > (x2 + Long.MIN_VALUE);
        };
        S2CellId.prototype.lessThan = function (x) {
            return S2CellId.unsignedLongLessThan(this.id, x.id);
        };
        S2CellId.prototype.greaterThan = function (x) {
            return S2CellId.unsignedLongGreaterThan(this.id, x.id);
        };
        S2CellId.prototype.lessOrEquals = function (x) {
            return S2CellId.unsignedLongLessThan(this.id, x.id) || this.id.equals(x.id);
        };
        S2CellId.prototype.greaterOrEquals = function (x) {
            return S2CellId.unsignedLongGreaterThan(this.id, x.id) || this.id.equals(x.id);
        };
        S2CellId.prototype.toString = function () {
            return "(face=" + this.face + ", pos=" + this.pos().toString(16) + ", level="
                + this.level() + ")";
        };
        S2CellId.prototype.compareTo = function (that) {
            return S2CellId.unsignedLongLessThan(this.id, that.id) ? -1 :
                S2CellId.unsignedLongGreaterThan(this.id, that.id) ? 1 : 0;
        };
        S2CellId.prototype.equals = function (that) {
            return this.compareTo(that) === 0;
        };
        /**
         * Returns the position of the id within the given list or a negative value with
         * the position of the index wher eit should be entered if the id was present
         */
        S2CellId.binarySearch = function (ids, id, low) {
            if (low === void 0) { low = 0; }
            if (id instanceof S2CellId) {
                id = id.id;
            }
            var high = ids.length - 1;
            while (low <= high) {
                var mid = (low + high) >>> 1;
                var midVal = ids[mid].id;
                var cmp = midVal.compare(id);
                if (cmp < 0)
                    low = mid + 1;
                else if (cmp > 0)
                    high = mid - 1;
                else
                    return mid; // key found
            }
            return -(low + 1); // key not found
        };
        // Although only 60 bits are needed to represent the index of a leaf
        // cell, we need an extra bit in order to represent the position of
        // the center of the leaf cell along the Hilbert curve.
        S2CellId.FACE_BITS = 3;
        S2CellId.NUM_FACES = 6;
        S2CellId.MAX_LEVEL = 30; // Valid levels: 0..MAX_LEVEL
        S2CellId.POS_BITS = 2 * S2CellId.MAX_LEVEL + 1;
        S2CellId.MAX_SIZE = 1 << S2CellId.MAX_LEVEL;
        //
        // calculated as 0xffffffffffffffff / radix
        S2CellId.maxValueDivs = [new Long(0), new Long(0),
            parseHex('9223372036854775807'), parseHex('6148914691236517205'), parseHex('4611686018427387903'),
            parseHex('3689348814741910323'), parseHex('3074457345618258602'), parseHex('2635249153387078802'),
            parseHex('2305843009213693951'), parseHex('2049638230412172401'), parseHex('1844674407370955161'),
            parseHex('1676976733973595601'), parseHex('1537228672809129301'), parseHex('1418980313362273201'),
            parseHex('1317624576693539401'), parseHex('1229782938247303441'), parseHex('1152921504606846975'),
            parseHex('1085102592571150095'), parseHex('1024819115206086200'), parseHex('970881267037344821'),
            parseHex('922337203685477580'), parseHex('878416384462359600'), parseHex('838488366986797800'),
            parseHex('802032351030850070'), parseHex('768614336404564650'), parseHex('737869762948382064'),
            parseHex('709490156681136600'), parseHex('683212743470724133'), parseHex('658812288346769700'),
            parseHex('636094623231363848'), parseHex('614891469123651720'), parseHex('595056260442243600'),
            parseHex('576460752303423487'), parseHex('558992244657865200'), parseHex('542551296285575047'),
            parseHex('527049830677415760'), parseHex('512409557603043100')]; // 35-36
        // calculated as 0xffffffffffffffff % radix
        S2CellId.maxValueMods = [0, 0,
            1, 0, 3, 0, 3, 1, 7, 6, 5, 4, 3, 2, 1, 0, 15, 0, 15, 16, 15, 15,
            15, 5, 15, 15, 15, 24, 15, 23, 15, 15, 31, 15, 17, 15, 15]; // 22-36
        // Constant related to unsigned long's
        // '18446744073709551615'
        // Long.fromString('0xffffffffffffffff', true, 16).toString()
        // new Decimal(2).pow(64).sub(1);
        S2CellId.MAX_UNSIGNED = Long.fromString('0xffffffffffffffff', true, 16);
        // The following lookup tables are used to convert efficiently between an
        // (i,j) cell index and the corresponding position along the Hilbert curve.
        // "lookup_pos" maps 4 bits of "i", 4 bits of "j", and 2 bits representing the
        // orientation of the current cell into 8 bits representing the order in which
        // that subcell is visited by the Hilbert curve, plus 2 bits indicating the
        // new orientation of the Hilbert curve within that subcell. (Cell
        // orientations are represented as combination of kSwapMask and kInvertMask.)
        //
        // "lookup_ij" is an inverted table used for mapping in the opposite
        // direction.
        //
        // We also experimented with looking up 16 bits at a time (14 bits of position
        // plus 2 of orientation) but found that smaller lookup tables gave better
        // performance. (2KB fits easily in the primary cache.)
        // Values for these constants are *declared* in the *.h file. Even though
        // the declaration specifies a value for the constant, that declaration
        // is not a *definition* of storage for the value. Because the values are
        // supplied in the declaration, we don't need the values here. Failing to
        // define storage causes link errors for any code that tries to take the
        // address of one of these values.
        S2CellId.LOOKUP_BITS = 4;
        S2CellId.SWAP_MASK = 0x01;
        S2CellId.INVERT_MASK = 0x02;
        S2CellId.LOOKUP_POS = [];
        S2CellId.LOOKUP_IJ = [];
        /**
         * This is the offset required to wrap around from the beginning of the
         * Hilbert curve to the end or vice versa; see next_wrap() and prev_wrap().
         */
        S2CellId.WRAP_OFFSET = new Long(S2CellId.NUM_FACES).shiftLeft(S2CellId.POS_BITS);
        return S2CellId;
    }());
    exports.S2CellId = S2CellId;
    function initLookupCell(level, i, j, origOrientation, pos, orientation) {
        if (level == S2CellId.LOOKUP_BITS) {
            var ij = (i << S2CellId.LOOKUP_BITS) + j;
            S2CellId.LOOKUP_POS[(ij << 2) + origOrientation] = pos.shiftLeft(2).add(orientation);
            S2CellId.LOOKUP_IJ[pos.shiftLeft(2).add(origOrientation).toNumber()] = (ij << 2) + orientation;
        }
        else {
            level++;
            i <<= 1;
            j <<= 1;
            pos = pos.shiftLeft(2);
            // Initialize each sub-cell recursively.
            for (var subPos = 0; subPos < 4; subPos++) {
                var ij = S2_1.S2.POS_TO_IJ[orientation][subPos];
                var orientationMask = S2_1.S2.POS_TO_ORIENTATION[subPos];
                initLookupCell(level, i + (ij >>> 1), j + (ij & 1), origOrientation, pos.add(subPos), orientation ^ orientationMask);
            }
        }
    }
    initLookupCell(0, 0, 0, 0, new Long(0), 0);
    initLookupCell(0, 0, 0, S2_1.S2.SWAP_MASK, new Long(0), S2_1.S2.SWAP_MASK);
    initLookupCell(0, 0, 0, S2_1.S2.INVERT_MASK, new Long(0), S2_1.S2.INVERT_MASK);
    initLookupCell(0, 0, 0, S2_1.S2.SWAP_MASK | S2_1.S2.INVERT_MASK, new Long(0), S2_1.S2.SWAP_MASK | S2_1.S2.INVERT_MASK);
});
//# sourceMappingURL=S2CellId.js.map