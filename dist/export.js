(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2Cap", './Interval', './MutableInteger', './R1Interval', './R2Vector', './S1Angle', './S1Interval', './S2', './S2Cap', './S2Cell', './S2CellId', './S2CellUnion', './S2LatLng', './S2LatLngRect', './S2Point', './S2Projections', './S2RegionCoverer'], factory);
    }
})(function (require, exports) {
    "use strict";
    var S2Cap_1 = require("./S2Cap");
    var Interval_1 = require('./Interval');
    exports.Interval = Interval_1.Interval;
    var MutableInteger_1 = require('./MutableInteger');
    exports.MutableInteger = MutableInteger_1.MutableInteger;
    var R1Interval_1 = require('./R1Interval');
    exports.R1Interval = R1Interval_1.R1Interval;
    var R2Vector_1 = require('./R2Vector');
    exports.R2Vector = R2Vector_1.R2Vector;
    var S1Angle_1 = require('./S1Angle');
    exports.S1Angle = S1Angle_1.S1Angle;
    var S1Interval_1 = require('./S1Interval');
    exports.S1Interval = S1Interval_1.S1Interval;
    var S2_1 = require('./S2');
    exports.S2 = S2_1.S2;
    var S2Cap_2 = require('./S2Cap');
    exports.S2Cap = S2Cap_2.S2Cap;
    var S2Cell_1 = require('./S2Cell');
    exports.S2Cell = S2Cell_1.S2Cell;
    var S2CellId_1 = require('./S2CellId');
    exports.S2CellId = S2CellId_1.S2CellId;
    var S2CellUnion_1 = require('./S2CellUnion');
    exports.S2CellUnion = S2CellUnion_1.S2CellUnion;
    // export {S2EdgeIndex} from './S2EdgeIndex';
    // export {S2EdgeUtil} from './S2EdgeUtil';
    var S2LatLng_1 = require('./S2LatLng');
    exports.S2LatLng = S2LatLng_1.S2LatLng;
    var S2LatLngRect_1 = require('./S2LatLngRect');
    exports.S2LatLngRect = S2LatLngRect_1.S2LatLngRect;
    // export {S2Loop} from './S2Loop';
    var S2Point_1 = require('./S2Point');
    exports.S2Point = S2Point_1.S2Point;
    var S2Projections_1 = require('./S2Projections');
    exports.S2Projections = S2Projections_1.S2Projections;
    var S2RegionCoverer_1 = require('./S2RegionCoverer');
    exports.S2RegionCoverer = S2RegionCoverer_1.S2RegionCoverer;
    var Utils = (function () {
        function Utils() {
        }
        /**
         * Calculates a region covering a circle
         * NOTE: The current implementation uses S2Cap while S2Loop would be better (S2Loop is not implemented yet)
         * @param center
         * @param radiusInKM
         * @param points the number of points to calculate. The higher the better precision
         * @returns {S2Region}
         */
        Utils.calcRegionFromCenterRadius = function (center, radiusInKM, points) {
            if (points === void 0) { points = 16; }
            var pointsAtDistance = center.pointsAtDistance(radiusInKM, points);
            var s2Cap = S2Cap_1.S2Cap.empty().addPoint(center.toPoint());
            // It would be probably enough to add one of the points/2 pair of opposite points in the circle such
            // as (0, points/2). but since this is just a temporary solution lets stick with this as it
            // will come handy when implementing S2Loop.
            pointsAtDistance
                .map(function (p) { return p.toPoint(); })
                .forEach(function (p) {
                s2Cap = s2Cap.addPoint(p);
            });
            return s2Cap;
        };
        return Utils;
    }());
    exports.Utils = Utils;
});
//# sourceMappingURL=export.js.map