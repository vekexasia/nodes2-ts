import {S2} from "./S2";

/**
 * Defines an area or a length cell metric.
 */
export class S2Metric {
    private _dim:number;
    private _deriv:decimal.Decimal;

    /**
     * Defines a cell metric of the given dimension (1 == length, 2 == area).
     */
    public constructor(_dim:number|decimal.Decimal, _deriv:number|decimal.Decimal) {
        this._dim = S2.toDecimal(_dim).toNumber();
        this._deriv = S2.toDecimal(_deriv);

    }

    deriv() {
        return this._deriv;
    }

    dim() {
        return this._dim;
    }

    /** Return the value of a metric for cells at the given level. */
    public getValue(level:number):number {
        let scaleFactor = this.dim() * (1 - level);
        return this.deriv().toNumber() * Math.pow(2, scaleFactor);
    }

    /**
     * Return the level at which the metric has approximately the given value.
     * For example, S2::kAvgEdge.GetClosestLevel(0.1) returns the level at which
     * the average cell edge length is approximately 0.1. The return value is
     * always a valid level.
     */
    public getClosestLevel(/*double*/value:number):number {
        return this.getMinLevel(S2.M_SQRT2 * value);
    }

    /**
     * Return the minimum level such that the metric is at most the given value,
     * or S2CellId::kMaxLevel if there is no such level. For example,
     * S2::kMaxDiag.GetMinLevel(0.1) returns the minimum level such that all
     * cell diagonal lengths are 0.1 or smaller. The return value is always a
     * valid level.
     */
    public getMinLevel(value:number /*double*/):number /*int*/ {
        if (value <= 0) {
            return S2.MAX_LEVEL;
        }

        // This code is equivalent to computing a floating-point "level"
        // value and rounding up.
        let exponent = S2.exp(value / ((1 << this.dim()) * this.deriv().toNumber()));
        let level = Math.max(0,
            Math.min(S2.MAX_LEVEL, -((exponent - 1) >> (this.dim() - 1))));
        // assert (level == S2CellId.MAX_LEVEL || getValue(level) <= value);
        // assert (level == 0 || getValue(level - 1) > value);
        return level;
    }

    /**
     * Return the maximum level such that the metric is at least the given
     * value, or zero if there is no such level. For example,
     * S2.kMinWidth.GetMaxLevel(0.1) returns the maximum level such that all
     * cells have a minimum width of 0.1 or larger. The return value is always a
     * valid level.
     */
    public getMaxLevel(_value:number|decimal.Decimal /*double*/):number {
        const value = S2.toDecimal(_value).toNumber();
        if (value <= 0) {
            return S2.MAX_LEVEL;
        }

        // This code is equivalent to computing a floating-point "level"
        // value and rounding down.
        let exponent = S2.exp((1 << this.dim()) * this.deriv().toNumber() / value);
        let level = Math.max(0,
            Math.min(S2.MAX_LEVEL, ((exponent - 1) >> (this.dim() - 1))));
        // assert (level == 0 || getValue(level) >= value);
        // assert (level == S2CellId.MAX_LEVEL || getValue(level + 1) < value);
        return level;
    }
}
