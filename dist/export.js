(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./S2Cap", './Interval', './MutableInteger', './R1Interval', './R2Vector', './S1Angle', './S1Interval', './S2', './S2Cap', './S2Cell', './S2CellId', './S2CellUnion', './S2LatLng', './S2LatLngRect', './S2Point', './S2Projections', './S2RegionCoverer'], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    var S2Cap_1 = require("./S2Cap");
    __export(require('./Interval'));
    __export(require('./MutableInteger'));
    __export(require('./R1Interval'));
    __export(require('./R2Vector'));
    __export(require('./S1Angle'));
    __export(require('./S1Interval'));
    __export(require('./S2'));
    __export(require('./S2Cap'));
    __export(require('./S2Cell'));
    __export(require('./S2CellId'));
    __export(require('./S2CellUnion'));
    // export * from './S2EdgeIndex';
    // export * from './S2EdgeUtil';
    __export(require('./S2LatLng'));
    __export(require('./S2LatLngRect'));
    // export * from './S2Loop';
    __export(require('./S2Point'));
    __export(require('./S2Projections'));
    __export(require('./S2RegionCoverer'));
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