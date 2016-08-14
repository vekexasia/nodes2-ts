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
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2Cell", "./S2CellId", "./S2CellUnion", "./S2Projections", './decimal.ts'], factory);
    }
})(function (require, exports) {
    "use strict";
    var S2Cell_1 = require("./S2Cell");
    var S2CellId_1 = require("./S2CellId");
    var S2CellUnion_1 = require("./S2CellUnion");
    var S2Projections_1 = require("./S2Projections");
    var decimal_ts_1 = require('./decimal.ts');
    /**
     * An S2RegionCoverer is a class that allows arbitrary regions to be
     * approximated as unions of cells (S2CellUnion). This is useful for
     * implementing various sorts of search and precomputation operations.
     *
     * Typical usage: {@code S2RegionCoverer coverer; coverer.setMaxCells(5); S2Cap
     * cap = S2Cap.fromAxisAngle(...); S2CellUnion covering;
     * coverer.getCovering(cap, covering); * }
     *
     * This yields a cell union of at most 5 cells that is guaranteed to cover the
     * given cap (a disc-shaped region on the sphere).
     *
     *  The approximation algorithm is not optimal but does a pretty good job in
     * practice. The output does not always use the maximum number of cells allowed,
     * both because this would not always yield a better approximation, and because
     * max_cells() is a limit on how much work is done exploring the possible
     * covering as well as a limit on the final output size.
     *
     *  One can also generate interior coverings, which are sets of cells which are
     * entirely contained within a region. Interior coverings can be empty, even for
     * non-empty regions, if there are no cells that satisfy the provided
     * constraints and are contained by the region. Note that for performance
     * reasons, it is wise to specify a max_level when computing interior coverings
     * - otherwise for regions with small or zero area, the algorithm may spend a
     * lot of time subdividing cells all the way to leaf level to try to find
     * contained cells.
     *
     *  This class is thread-unsafe. Simultaneous calls to any of the getCovering
     * methods will conflict and produce unpredictable results.
     *
     */
    var S2RegionCoverer = (function () {
        /**
         * Default constructor, sets all fields to default values.
         */
        function S2RegionCoverer() {
            this.minLevel = 0;
            this.maxLevel = S2CellId_1.S2CellId.MAX_LEVEL;
            this.levelMod = 1;
            this.maxCells = S2RegionCoverer.DEFAULT_MAX_CELLS;
            this.region = null;
            this.result = [];
            this.candidateQueue = new PriorityQueue();
        }
        // Set the minimum and maximum cell level to be used. The default is to use
        // all cell levels. Requires: max_level() >= min_level().
        //
        // To find the cell level corresponding to a given physical distance, use
        // the S2Cell metrics defined in s2.h. For example, to find the cell
        // level that corresponds to an average edge length of 10km, use:
        //
        // int level = S2::kAvgEdge.GetClosestLevel(
        // geostore::S2Earth::KmToRadians(length_km));
        //
        // Note: min_level() takes priority over max_cells(), i.e. cells below the
        // given level will never be used even if this causes a large number of
        // cells to be returned.
        /**
         * Sets the minimum level to be used.
         */
        S2RegionCoverer.prototype.setMinLevel = function (minLevel) {
            // assert (minLevel >= 0 && minLevel <= S2CellId.MAX_LEVEL);
            this.minLevel = Math.max(0, Math.min(S2CellId_1.S2CellId.MAX_LEVEL, minLevel));
            return this;
        };
        /**
         * Sets the maximum level to be used.
         */
        S2RegionCoverer.prototype.setMaxLevel = function (maxLevel) {
            // assert (maxLevel >= 0 && maxLevel <= S2CellId.MAX_LEVEL);
            this.maxLevel = Math.max(0, Math.min(S2CellId_1.S2CellId.MAX_LEVEL, maxLevel));
            return this;
        };
        /**
         * If specified, then only cells where (level - min_level) is a multiple of
         * "level_mod" will be used (default 1). This effectively allows the branching
         * factor of the S2CellId hierarchy to be increased. Currently the only
         * parameter values allowed are 1, 2, or 3, corresponding to branching factors
         * of 4, 16, and 64 respectively.
         */
        S2RegionCoverer.prototype.setLevelMod = function (levelMod) {
            // assert (levelMod >= 1 && levelMod <= 3);
            this.levelMod = Math.max(1, Math.min(3, levelMod));
            return this;
        };
        /**
         * Sets the maximum desired number of cells in the approximation (defaults to
         * kDefaultMaxCells). Note the following:
         *
         * <ul>
         * <li>For any setting of max_cells(), up to 6 cells may be returned if that
         * is the minimum number of cells required (e.g. if the region intersects all
         * six face cells). Up to 3 cells may be returned even for very tiny convex
         * regions if they happen to be located at the intersection of three cube
         * faces.
         *
         * <li>For any setting of max_cells(), an arbitrary number of cells may be
         * returned if min_level() is too high for the region being approximated.
         *
         * <li>If max_cells() is less than 4, the area of the covering may be
         * arbitrarily large compared to the area of the original region even if the
         * region is convex (e.g. an S2Cap or S2LatLngRect).
         * </ul>
         *
         * Accuracy is measured by dividing the area of the covering by the area of
         * the original region. The following table shows the median and worst case
         * values for this area ratio on a test case consisting of 100,000 spherical
         * caps of random size (generated using s2regioncoverer_unittest):
         *
         * <pre>
         * max_cells: 3 4 5 6 8 12 20 100 1000
         * median ratio: 5.33 3.32 2.73 2.34 1.98 1.66 1.42 1.11 1.01
         * worst case: 215518 14.41 9.72 5.26 3.91 2.75 1.92 1.20 1.02
         * </pre>
         */
        S2RegionCoverer.prototype.setMaxCells = function (maxCells) {
            this.maxCells = maxCells;
            return this;
        };
        /**
         * Computes a list of cell ids that covers the given region and satisfies the
         * various restrictions specified above.
         *
         * @param region The region to cover
         * @param covering The list filled in by this method
         */
        S2RegionCoverer.prototype.getCoveringCells = function (region) {
            // Rather than just returning the raw list of cell ids generated by
            // GetCoveringInternal(), we construct a cell union and then denormalize it.
            // This has the effect of replacing four child cells with their parent
            // whenever this does not violate the covering parameters specified
            // (min_level, level_mod, etc). This strategy significantly reduces the
            // number of cells returned in many cases, and it is cheap compared to
            // computing the covering in the first place.
            var tmp = this.getCoveringUnion(region);
            return tmp.denormalize(this.minLevel, this.levelMod);
        };
        /**
         * Computes a list of cell ids that is contained within the given region and
         * satisfies the various restrictions specified above.
         *
         * @param region The region to fill
         * @param interior The list filled in by this method
         */
        S2RegionCoverer.prototype.getInteriorCoveringCells = function (region) {
            var tmp = this.getInteriorCoveringUnion(region);
            return tmp.denormalize(this.minLevel, this.levelMod);
        };
        /**
         * Return a normalized cell union that covers the given region and satisfies
         * the restrictions *EXCEPT* for min_level() and level_mod(). These criteria
         * cannot be satisfied using a cell union because cell unions are
         * automatically normalized by replacing four child cells with their parent
         * whenever possible. (Note that the list of cell ids passed to the cell union
         * constructor does in fact satisfy all the given restrictions.)
         */
        S2RegionCoverer.prototype.getCoveringUnion = function (region, covering) {
            if (covering === void 0) { covering = new S2CellUnion_1.S2CellUnion(); }
            this.interiorCovering = false;
            this.getCoveringInternal(region);
            covering.initSwap(this.result);
            return covering;
        };
        /**
         * Return a normalized cell union that is contained within the given region
         * and satisfies the restrictions *EXCEPT* for min_level() and level_mod().
         */
        S2RegionCoverer.prototype.getInteriorCoveringUnion = function (region, covering) {
            if (covering === void 0) { covering = new S2CellUnion_1.S2CellUnion(); }
            this.interiorCovering = true;
            this.getCoveringInternal(region);
            covering.initSwap(this.result);
            return covering;
        };
        // /**
        //  * Given a connected region and a starting point, return a set of cells at the
        //  * given level that cover the region.
        //  */
        // public static getSimpleCovering(
        //     region:S2Region , start:S2Point , level:number):S2CellId[] {
        //   S2RegionCoverer.floodFill(region, S2CellId.fromPoint(start).parentL(level));
        // }
        /**
         * If the cell intersects the given region, return a new candidate with no
         * children, otherwise return null. Also marks the candidate as "terminal" if
         * it should not be expanded further.
         */
        S2RegionCoverer.prototype.newCandidate = function (cell) {
            if (!this.region.mayIntersectC(cell)) {
                // console.log("NOT INTERSECTING",this.region);
                return null;
            }
            var isTerminal = false;
            if (cell.level >= this.minLevel) {
                if (this.interiorCovering) {
                    if (this.region.containsC(cell)) {
                        isTerminal = true;
                    }
                    else if (cell.level + this.levelMod > this.maxLevel) {
                        return null;
                    }
                }
                else {
                    if (cell.level + this.levelMod > this.maxLevel || this.region.containsC(cell)) {
                        isTerminal = true;
                    }
                }
            }
            var candidate = new Candidate();
            candidate.cell = cell;
            candidate.isTerminal = isTerminal;
            candidate.numChildren = 0;
            if (!isTerminal) {
                candidate.children = Array.apply(null, new Array(1 << this.maxChildrenShift()));
            }
            this.candidatesCreatedCounter++;
            return candidate;
        };
        /** Return the log base 2 of the maximum number of children of a candidate. */
        S2RegionCoverer.prototype.maxChildrenShift = function () {
            return 2 * this.levelMod;
        };
        /**
         * Process a candidate by either adding it to the result list or expanding its
         * children and inserting it into the priority queue. Passing an argument of
         * NULL does nothing.
         */
        S2RegionCoverer.prototype.addCandidate = function (candidate) {
            if (candidate == null) {
                return;
            }
            if (candidate.isTerminal) {
                this.result.push(candidate.cell.id);
                return;
            }
            // assert (candidate.numChildren == 0);
            // Expand one level at a time until we hit min_level_ to ensure that
            // we don't skip over it.
            var numLevels = (candidate.cell.level < this.minLevel) ? 1 : this.levelMod;
            var numTerminals = this.expandChildren(candidate, candidate.cell, numLevels);
            if (candidate.numChildren == 0) {
            }
            else if (!this.interiorCovering && numTerminals == 1 << this.maxChildrenShift()
                && candidate.cell.level >= this.minLevel) {
                // Optimization: add the parent cell rather than all of its children.
                // We can't do this for interior coverings, since the children just
                // intersect the region, but may not be contained by it - we need to
                // subdivide them further.
                candidate.isTerminal = true;
                this.addCandidate(candidate);
            }
            else {
                // We negate the priority so that smaller absolute priorities are returned
                // first. The heuristic is designed to refine the largest cells first,
                // since those are where we have the largest potential gain. Among cells
                // at the same level, we prefer the cells with the smallest number of
                // intersecting children. Finally, we prefer cells that have the smallest
                // number of children that cannot be refined any further.
                var priority = -((((candidate.cell.level << this.maxChildrenShift()) + candidate.numChildren)
                    << this.maxChildrenShift()) + numTerminals);
                this.candidateQueue.add(new QueueEntry(priority, candidate));
            }
        };
        /**
         * Populate the children of "candidate" by expanding the given number of
         * levels from the given cell. Returns the number of children that were marked
         * "terminal".
         */
        S2RegionCoverer.prototype.expandChildren = function (candidate, cell, numLevels) {
            numLevels--;
            var childCells = cell.subdivide();
            var numTerminals = 0;
            for (var i = 0; i < 4; ++i) {
                if (numLevels > 0) {
                    if (this.region.mayIntersectC(childCells[i])) {
                        numTerminals += this.expandChildren(candidate, childCells[i], numLevels);
                    }
                    continue;
                }
                var child = this.newCandidate(childCells[i]);
                if (child != null) {
                    candidate.children[candidate.numChildren++] = child;
                    if (child.isTerminal) {
                        ++numTerminals;
                    }
                }
            }
            return numTerminals;
        };
        /** Computes a set of initial candidates that cover the given region. */
        S2RegionCoverer.prototype.getInitialCandidates = function () {
            // Optimization: if at least 4 cells are desired (the normal case),
            // start with a 4-cell covering of the region's bounding cap. This
            // lets us skip quite a few levels of refinement when the region to
            // be covered is relatively small.
            if (this.maxCells >= 4) {
                // Find the maximum level such that the bounding cap contains at most one
                // cell vertex at that level.
                var cap = this.region.getCapBound();
                var level = decimal_ts_1.Decimal.min(S2Projections_1.S2Projections.MIN_WIDTH.getMaxLevel(cap.angle().radians.times(2)), decimal_ts_1.Decimal.min(this.maxLevel, S2CellId_1.S2CellId.MAX_LEVEL - 1)).toNumber();
                if (this.levelMod > 1 && level > this.minLevel) {
                    level -= (level - this.minLevel) % this.levelMod;
                }
                // We don't bother trying to optimize the level == 0 case, since more than
                // four face cells may be required.
                if (level > 0) {
                    // Find the leaf cell containing the cap axis, and determine which
                    // subcell of the parent cell contains it.
                    // ArrayList<S2CellId> base = new ArrayList<>(4);
                    var id = S2CellId_1.S2CellId.fromPoint(cap.axis);
                    var base = id.getVertexNeighbors(level);
                    for (var i = 0; i < base.length; ++i) {
                        this.addCandidate(this.newCandidate(new S2Cell_1.S2Cell(base[i])));
                    }
                    return;
                }
            }
            // Default: start with all six cube faces.
            for (var face = 0; face < 6; ++face) {
                this.addCandidate(this.newCandidate(S2RegionCoverer.FACE_CELLS[face]));
            }
        };
        /** Generates a covering and stores it in result. */
        S2RegionCoverer.prototype.getCoveringInternal = function (region) {
            // Strategy: Start with the 6 faces of the cube. Discard any
            // that do not intersect the shape. Then repeatedly choose the
            // largest cell that intersects the shape and subdivide it.
            //
            // result contains the cells that will be part of the output, while the
            // priority queue contains cells that we may still subdivide further. Cells
            // that are entirely contained within the region are immediately added to
            // the output, while cells that do not intersect the region are immediately
            // discarded.
            // Therefore pq_ only contains cells that partially intersect the region.
            // Candidates are prioritized first according to cell size (larger cells
            // first), then by the number of intersecting children they have (fewest
            // children first), and then by the number of fully contained children
            // (fewest children first).
            if (!(this.candidateQueue.size() == 0 && this.result.length == 0)) {
                throw new Error('preconditions are not satisfied');
            }
            // Preconditions.checkState(this.candidateQueue.isEmpty() && this.result.isEmpty());
            this.region = region;
            this.candidatesCreatedCounter = 0;
            this.getInitialCandidates();
            while (this.candidateQueue.size() !== 0 && (!this.interiorCovering || this.result.length < this.maxCells)) {
                var candidate = this.candidateQueue.poll().candidate;
                // logger.info("Pop: " + candidate.cell.id());
                if (candidate.cell.level < this.minLevel || candidate.numChildren == 1
                    || this.result.length + (this.interiorCovering ? 0 : this.candidateQueue.size()) + candidate.numChildren
                        <= this.maxCells) {
                    // Expand this candidate into its children.
                    for (var i = 0; i < candidate.numChildren; ++i) {
                        this.addCandidate(candidate.children[i]);
                    }
                }
                else if (this.interiorCovering) {
                }
                else {
                    candidate.isTerminal = true;
                    this.addCandidate(candidate);
                }
            }
            this.candidateQueue.clear();
            this.region = null;
        };
        /**
         * By default, the covering uses at most 8 cells at any level. This gives a
         * reasonable tradeoff between the number of cells used and the accuracy of
         * the approximation (see table below).
         */
        S2RegionCoverer.DEFAULT_MAX_CELLS = 8;
        S2RegionCoverer.FACE_CELLS = new Array(6).map(function (face) { return S2Cell_1.S2Cell.fromFacePosLevel(face, 0, 0); });
        return S2RegionCoverer;
    }());
    exports.S2RegionCoverer = S2RegionCoverer;
    var Candidate = (function () {
        function Candidate() {
        }
        // elements.
        Candidate.prototype.toString = function () {
            return "isTermina: " + this.isTerminal + " - Cell: " + this.cell.toString();
        };
        return Candidate;
    }());
    var PriorityQueue = (function () {
        function PriorityQueue() {
            this.clear();
        }
        PriorityQueue.prototype.add = function (item) {
            this.items.push(item);
            this.items.sort(function (a, b) { return a.compare(b); });
        };
        PriorityQueue.prototype.clear = function () {
            this.items = [];
        };
        PriorityQueue.prototype.size = function () {
            return this.items.length;
        };
        PriorityQueue.prototype.poll = function () {
            return this.items.splice(0, 1)[0];
        };
        return PriorityQueue;
    }());
    var QueueEntry = (function () {
        function QueueEntry(id, candidate) {
            this.id = id;
            this.candidate = candidate;
        }
        QueueEntry.prototype.compare = function (other) {
            return this.id < other.id ? 1 : (this.id > other.id ? -1 : 0);
        };
        return QueueEntry;
    }());
});
//# sourceMappingURL=S2RegionCoverer.js.map