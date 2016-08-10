import { S2Region } from "./S2Region";
import { S2CellId } from "./S2CellId";
import { S2CellUnion } from "./S2CellUnion";
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
export declare class S2RegionCoverer {
    /**
     * By default, the covering uses at most 8 cells at any level. This gives a
     * reasonable tradeoff between the number of cells used and the accuracy of
     * the approximation (see table below).
     */
    static DEFAULT_MAX_CELLS: number;
    private static FACE_CELLS;
    private minLevel;
    private maxLevel;
    private levelMod;
    private maxCells;
    private interiorCovering;
    private candidatesCreatedCounter;
    /**
     * We save a temporary copy of the pointer passed to GetCovering() in order to
     * avoid passing this parameter around internally. It is only used (and only
     * valid) for the duration of a single GetCovering() call.
     */
    protected region: S2Region;
    /**
     * A temporary variable used by GetCovering() that holds the cell ids that
     * have been added to the covering so far.
     */
    protected result: S2CellId[];
    /**
     * We keep the candidates in a priority queue. We specify a vector to hold the
     * queue entries since for some reason priority_queue<> uses a deque by
     * default.
     */
    private candidateQueue;
    /**
     * Default constructor, sets all fields to default values.
     */
    constructor();
    /**
     * Sets the minimum level to be used.
     */
    setMinLevel(minLevel: number): S2RegionCoverer;
    /**
     * Sets the maximum level to be used.
     */
    setMaxLevel(maxLevel: number): S2RegionCoverer;
    /**
     * If specified, then only cells where (level - min_level) is a multiple of
     * "level_mod" will be used (default 1). This effectively allows the branching
     * factor of the S2CellId hierarchy to be increased. Currently the only
     * parameter values allowed are 1, 2, or 3, corresponding to branching factors
     * of 4, 16, and 64 respectively.
     */
    setLevelMod(levelMod: number): S2RegionCoverer;
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
    setMaxCells(maxCells: number): S2RegionCoverer;
    /**
     * Computes a list of cell ids that covers the given region and satisfies the
     * various restrictions specified above.
     *
     * @param region The region to cover
     * @param covering The list filled in by this method
     */
    getCoveringCells(region: S2Region): S2CellId[];
    /**
     * Computes a list of cell ids that is contained within the given region and
     * satisfies the various restrictions specified above.
     *
     * @param region The region to fill
     * @param interior The list filled in by this method
     */
    getInteriorCoveringCells(region: S2Region): S2CellId[];
    /**
     * Return a normalized cell union that covers the given region and satisfies
     * the restrictions *EXCEPT* for min_level() and level_mod(). These criteria
     * cannot be satisfied using a cell union because cell unions are
     * automatically normalized by replacing four child cells with their parent
     * whenever possible. (Note that the list of cell ids passed to the cell union
     * constructor does in fact satisfy all the given restrictions.)
     */
    getCoveringUnion(region: S2Region, covering?: S2CellUnion): S2CellUnion;
    /**
     * Return a normalized cell union that is contained within the given region
     * and satisfies the restrictions *EXCEPT* for min_level() and level_mod().
     */
    getInteriorCoveringUnion(region: S2Region, covering?: S2CellUnion): S2CellUnion;
    /**
     * If the cell intersects the given region, return a new candidate with no
     * children, otherwise return null. Also marks the candidate as "terminal" if
     * it should not be expanded further.
     */
    private newCandidate(cell);
    /** Return the log base 2 of the maximum number of children of a candidate. */
    private maxChildrenShift();
    /**
     * Process a candidate by either adding it to the result list or expanding its
     * children and inserting it into the priority queue. Passing an argument of
     * NULL does nothing.
     */
    private addCandidate(candidate);
    /**
     * Populate the children of "candidate" by expanding the given number of
     * levels from the given cell. Returns the number of children that were marked
     * "terminal".
     */
    private expandChildren(candidate, cell, numLevels);
    /** Computes a set of initial candidates that cover the given region. */
    private getInitialCandidates();
    /** Generates a covering and stores it in result. */
    private getCoveringInternal(region);
}
