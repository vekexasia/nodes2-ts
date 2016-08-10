(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var MutableInteger = (function () {
        function MutableInteger(val) {
            this.val = val;
        }
        return MutableInteger;
    }());
    exports.MutableInteger = MutableInteger;
});
//# sourceMappingURL=MutableInteger.js.map