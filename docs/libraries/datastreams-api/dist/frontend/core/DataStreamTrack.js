import { __awaiter, __extends, __generator, __read, __spreadArray } from "tslib";
import { DataTrackSettings } from "./DataTrackSettings";
import { DataTrackCapabilities } from "./DataTrackCapabilities";
import { randomUUID } from "../../common/id";
import { DataTrackConstraints } from "./DataTrackConstraints";
// NOTE: This class allows the conversion of independent data coming from Device classes
// to a ReadableStream format.
var DataStreamTrack = /** @class */ (function (_super) {
    __extends(DataStreamTrack, _super);
    function DataStreamTrack(device) {
        var _a, _b, _c, _d, _e, _f, _g;
        var _this = _super.call(this) || this;
        // Mirror Attributes from MediaStreamTrack
        _this.contentHint = '';
        _this.enabled = false;
        _this.isolated = false;
        _this.muted = false;
        _this.remote = false;
        _this.id = '';
        _this.kind = '';
        _this.label = '';
        _this.readyState = 'live';
        // New Attributes
        _this.data = [];
        _this.callbacks = new Map();
        _this.pipeline = [];
        _this._bufferSize = 256 * 60 * 2;
        _this.deinit = function () {
            _this.dispatchEvent(new Event('ended'));
        };
        // TODO: Allow constraints to apply to the selected track
        _this.applyConstraints = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); };
        _this.clone = function () {
            return _this; // TODO: should actually clone
        };
        _this.getCapabilities = function () {
            return new DataTrackCapabilities(_this);
        };
        _this.getConstraints = function () {
            return new DataTrackConstraints(_this);
        };
        _this.getSettings = function () {
            return new DataTrackSettings(_this);
        };
        _this.stop = function () {
        };
        _this.addData = function (val) {
            var _a;
            if (Array.isArray(val))
                (_a = _this.data).push.apply(_a, __spreadArray([], __read(val), false));
            else
                _this.data.push(val);
            var diff = _this.data.length - _this._bufferSize;
            for (var i = diff; i > 0; i--)
                _this.data.shift();
            _this.ondata(val);
        };
        // Data Readout
        _this.ondata = function (data) {
            _this.callbacks.forEach(function (f) {
                f(data);
            });
        };
        _this.subscribe = function (callback) {
            var id = randomUUID();
            _this.callbacks.set(id, callback);
            return id;
        };
        _this.unsubscribe = function (id) {
            _this.callbacks.delete(id);
        };
        _this.onended = function () {
            _this.readyState = 'ended';
        };
        _this.onisolationchange = function () { };
        _this.onmute = function () { };
        _this.onunmute = function () { };
        _this.id = (_a = device === null || device === void 0 ? void 0 : device.id) !== null && _a !== void 0 ? _a : randomUUID();
        _this.kind = (_c = (_b = device === null || device === void 0 ? void 0 : device.constraints) === null || _b === void 0 ? void 0 : _b.kind) !== null && _c !== void 0 ? _c : _this.kind;
        _this.label = (_e = (_d = device === null || device === void 0 ? void 0 : device.constraints) === null || _d === void 0 ? void 0 : _d.label) !== null && _e !== void 0 ? _e : _this.label;
        _this.callbacks = new Map();
        _this.data = [];
        _this._bufferSize = (_g = (_f = device === null || device === void 0 ? void 0 : device.constraints) === null || _f === void 0 ? void 0 : _f.bufferSize) !== null && _g !== void 0 ? _g : _this._bufferSize;
        _this.pipeline = [];
        return _this;
    }
    Object.defineProperty(DataStreamTrack.prototype, Symbol.toStringTag, {
        get: function () { return 'DataStreamTrack'; },
        enumerable: false,
        configurable: true
    });
    return DataStreamTrack;
}(EventTarget));
export { DataStreamTrack };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVN0cmVhbVRyYWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vY29yZS9EYXRhU3RyZWFtVHJhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFBO0FBQ3JELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHlCQUF5QixDQUFBO0FBQzdELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQTtBQUMxQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQUc3RCx3RkFBd0Y7QUFDeEYsOEJBQThCO0FBRTlCO0lBQXFDLG1DQUFXO0lBc0I1Qyx5QkFBYSxNQUFtQjs7UUFBaEMsWUFDSSxpQkFBTyxTQVdWO1FBaENELDBDQUEwQztRQUMxQyxpQkFBVyxHQUFXLEVBQUUsQ0FBQTtRQUN4QixhQUFPLEdBQVksS0FBSyxDQUFBO1FBQ3hCLGNBQVEsR0FBWSxLQUFLLENBQUE7UUFDekIsV0FBSyxHQUFZLEtBQUssQ0FBQTtRQUN0QixZQUFNLEdBQVksS0FBSyxDQUFBO1FBQ3ZCLFFBQUUsR0FBVyxFQUFFLENBQUE7UUFDZixVQUFJLEdBQVcsRUFBRSxDQUFBO1FBQ2pCLFdBQUssR0FBVyxFQUFFLENBQUE7UUFDbEIsZ0JBQVUsR0FBMEIsTUFBTSxDQUFBO1FBRzFDLGlCQUFpQjtRQUNqQixVQUFJLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGVBQVMsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUMzQyxjQUFRLEdBQVUsRUFBRSxDQUFBO1FBQ3BCLGlCQUFXLEdBQVcsR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFrQmxDLFlBQU0sR0FBRztZQUNMLEtBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUMxQyxDQUFDLENBQUE7UUFFRCx5REFBeUQ7UUFDekQs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