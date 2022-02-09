import { __extends, __read, __spreadArray, __values } from "tslib";
/*

Extension of the MediaStream API to handle arbitrary time-series data.

*/
var DataStream = /** @class */ (function (_super) {
    __extends(DataStream, _super);
    function DataStream(arg) {
        if (arg === void 0) { arg = []; }
        var _this = _super.call(this, arg) || this;
        // Mirror Attributes from MediaStreams
        _this.tracks = new Map();
        // Functions
        _this.addTrack = _this.addTrack;
        // ---------------------- NEW METHODS ----------------------
        _this.getDataTracks = function () { return __spreadArray([], __read(_this.tracks.values()), false); };
        // ----------------- Event Listeners -----------------
        // this.ontrack
        // this.onremovetrack
        // this.onactive
        // this.oninactive
        // ----------------- Core Properties -----------------
        // this.id
        // this.active
        // ----------------- Custom Methods -----------------
        // this.addTrack
        // this.getTracks
        _this._addTrack = _this.addTrack; // save original
        _this._getTracks = _this.getTracks; // save original
        _this._removeTrack = _this.removeTrack; // save original
        _this.addTrack = function (track) {
            if (!__spreadArray([], __read(_this.tracks.values()), false).includes(track)) { // don't duplicate tracks
                try {
                    _this._addTrack(track);
                }
                catch (_a) { } // Try adding using the MediaStreams API
                _this.tracks.set(track.contentHint || _this.tracks.size, track);
                _this.dispatchEvent(new CustomEvent('addtrack', { detail: track })); // Trigger ontrackadded for local updates (disabled in MediaStreams API)
            }
            return track;
        };
        _this.removeTrack = function (track) {
            var e_1, _a;
            if (__spreadArray([], __read(_this.tracks.values()), false).includes(track)) {
                try {
                    _this._removeTrack(track);
                }
                catch (_b) { } // Try adding using the MediaStreams API
                try {
                    for (var _c = __values(_this.tracks.entries()), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
                        if (value === track) {
                            _this.tracks.delete(key);
                            _this.dispatchEvent(new CustomEvent('removetrack', { detail: track })); // Trigger ontrackadded for local updates (disabled in MediaStreams API)
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return track;
        };
        _this.getTracks = function () {
            var mediaTracks = _this._getTracks();
            var dataTracks = _this.getDataTracks();
            return __spreadArray(__spreadArray([], __read(mediaTracks), false), __read(dataTracks), false);
        };
        _this.addEventListener('addtrack', (function (ev) {
            ev.track = ev.detail;
            delete ev.detail;
        }));
        _this.addEventListener('removetrack', (function (ev) {
            ev.track = ev.detail;
            delete ev.detail;
        }));
        return _this;
    }
    Object.defineProperty(DataStream.prototype, Symbol.toStringTag, {
        get: function () { return 'DataStream'; },
        enumerable: false,
        configurable: true
    });
    return DataStream;
}(MediaStream));
export { DataStream };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVN0cmVhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2NvcmUvRGF0YVN0cmVhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7RUFJRTtBQUVGO0lBQWdDLDhCQUFXO0lBZXZDLG9CQUFZLEdBQTJFO1FBQTNFLG9CQUFBLEVBQUEsUUFBMkU7UUFBdkYsWUFDSSxrQkFBTSxHQUFVLENBQUMsU0F5RHBCO1FBdkVELHNDQUFzQztRQUN0QyxZQUFNLEdBQWlFLElBQUksR0FBRyxFQUFFLENBQUE7UUFJaEYsWUFBWTtRQUNaLGNBQVEsR0FBc0YsS0FBSSxDQUFDLFFBQVEsQ0FBQTtRQW1FM0csNERBQTREO1FBRTVELG1CQUFhLEdBQUcsY0FBTSxnQ0FBSSxLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUF4QixDQUF5QixDQUFBO1FBM0QzQyxzREFBc0Q7UUFDdEQsZUFBZTtRQUNmLHFCQUFxQjtRQUNyQixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBRWxCLHNEQUFzRDtRQUN0RCxVQUFVO1FBQ1YsY0FBYztRQUVkLHFEQUFxRDtRQUNyRCxnQkFBZ0I7UUFDaEIsaUJBQWlCO1FBQ2pCLEtBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSSxDQUFDLFFBQVEsQ0FBQSxDQUFDLGdCQUFnQjtRQUMvQyxLQUFJLENBQUMsVUFBVSxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUEsQ0FBQyxnQkFBZ0I7UUFDakQsS0FBSSxDQUFDLFlBQVksR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFBLENBQUMsZ0JBQWdCO1FBRXJELEtBQUksQ0FBQyxRQUFRLEdBQUcsVUFBQyxLQUF5QztZQUN0RCxJQUFJLENBQUMseUJBQUksS0FBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsVUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUMsRUFBRSx5QkFBeUI7Z0JBQ3RFLElBQUk7b0JBQUMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFBQztnQkFBQyxXQUFNLEdBQUUsQ0FBQyx3Q0FBd0M7Z0JBQzdFLEtBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQzdELEtBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxXQUFXLENBQUMsVUFBVSxFQUFFLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsQ0FBQSxDQUFDLHdFQUF3RTthQUM1STtZQUNELE9BQU8sS0FBSyxDQUFBO1FBQ2hCLENBQUMsQ0FBQTtRQUVELEtBQUksQ0FBQyxXQUFXLEdBQUcsVUFBQyxLQUF5Qzs7WUFFekQsSUFBSSx5QkFBSSxLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBQztnQkFDMUMsSUFBSTtvQkFBQyxLQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO2lCQUFDO2dCQUFDLFdBQU0sR0FBRSxDQUFDLHdDQUF3Qzs7b0JBQ2hGLEtBQXlCLElBQUEsS0FBQSxTQUFBLEtBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUEsZ0JBQUEsNEJBQUU7d0JBQXZDLElBQUEsS0FBQSxtQkFBWSxFQUFYLEdBQUcsUUFBQSxFQUFFLEtBQUssUUFBQTt3QkFDaEIsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFDOzRCQUNoQixLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTs0QkFDdkIsS0FBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxhQUFhLEVBQUUsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMsd0VBQXdFO3lCQUMvSTtxQkFDSjs7Ozs7Ozs7O2FBQ0o7WUFDRCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDLENBQUE7UUFFRCxLQUFJLENBQUMsU0FBUyxHQUFHO1lBQ2IsSUFBTSxXQUFXLEdBQUcsS0FBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1lBQ3JDLElBQU0sVUFBVSxHQUFHLEtBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUN2Qyw4Q0FBVyxXQUFXLGtCQUFLLFVBQVUsVUFBQztRQUMxQyxDQUFDLENBQUE7UUFFRCxLQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUMsVUFBQyxFQUFPO1lBQ3ZDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQTtZQUNwQixPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUE7UUFDcEIsQ0FBQyxDQUFrQixDQUFDLENBQUE7UUFFcEIsS0FBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxDQUFDLFVBQUMsRUFBTztZQUMxQyxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUE7WUFDcEIsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFBO1FBQ3BCLENBQUMsQ0FBa0IsQ0FBQyxDQUFBOztJQUN4QixDQUFDO0lBNURELHNCQUFJLHNCQUFDLE1BQU0sQ0FBQyxXQUFZO2FBQXhCLGNBQTZCLE9BQU8sWUFBWSxDQUFBLENBQUMsQ0FBQzs7O09BQUE7SUFpRXRELGlCQUFDO0FBQUQsQ0FBQyxBQTlFRCxDQUFnQyxXQUFXLEdBOEUxQyJ9