import { __awaiter, __generator } from "tslib";
import { DataStreamTrack } from "../core/DataStreamTrack";
import { randomUUID } from "../../common/id";
var Device = /** @class */ (function () {
    // // Inherited Functions
    // onconnect: (target) =>{}
    // ondisconnect: (target) =>{}}
    function Device(constraints) {
        var _this = this;
        this.id = randomUUID();
        this._ondata = function (data) { return data; };
        this.active = false;
        this.init = function (constraints) {
            var _a, _b, _c;
            // Disconnect Active Device
            if (_this.active)
                _this.disconnect();
            // Assign Constraints
            if (constraints) {
                Object.assign(_this.constraints, constraints); // Replace new constraints
                //  Callbacks 
                _this.onconnect = (_a = _this.constraints.onconnect) !== null && _a !== void 0 ? _a : _this.onconnect;
                _this.ondisconnect = (_b = _this.constraints.ondisconnect) !== null && _b !== void 0 ? _b : _this.ondisconnect;
                if (_this.constraints.ondata)
                    _this._ondata = _this.constraints.ondata;
                _this.onerror = (_c = _this.constraints.onerror) !== null && _c !== void 0 ? _c : _this.onerror;
                if (_this.constraints.encode instanceof Function)
                    _this.encode = _this.constraints.encode;
                else
                    _this.encoder = new TextEncoder();
                if (_this.constraints.decode instanceof Function)
                    _this.decode = _this.constraints.decode;
                else
                    _this.decoder = new TextDecoder("utf-8");
                if (_this.constraints.oninit instanceof Function)
                    _this.oninit = _this.constraints.oninit;
            }
            // Run Callback
            _this.oninit(_this);
        };
        // Core Methods 
        this.connect = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!(this.device instanceof Device) && this.device.connect)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.device.connect()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.active = true;
                        this._connect();
                        this.onconnect(this);
                        return [2 /*return*/];
                }
            });
        }); };
        this.disconnect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!(this.device instanceof Device) && this.device.disconnect)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.device.disconnect()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        this.active = false;
                        (_a = this.stream) === null || _a === void 0 ? void 0 : _a.tracks.forEach(function (t) { var _a; return (_a = _this.stream) === null || _a === void 0 ? void 0 : _a.removeTrack(t); });
                        this._disconnect();
                        this.ondisconnect(this);
                        return [2 /*return*/];
                }
            });
        }); };
        this._connect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); };
        this._disconnect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); };
        this.send = function (msg, from) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            this.onsend(msg, from);
            return [2 /*return*/];
        }); }); };
        // Auxilliary Methods
        this.encode = function (msg, _) { return _this.encoder.encode(msg); };
        this.decode = function (msg, _) { return _this.decoder.decode(msg); };
        // Events
        this.oninit = function (target) {
            if (target === void 0) { target = _this; }
            return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, console.log("".concat(target.constructor.name, " inited!"))];
            }); });
        };
        this.onconnect = function (target) {
            if (target === void 0) { target = _this; }
            return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, console.log("".concat(target.constructor.name, " connected!"))];
            }); });
        };
        this.ondisconnect = function (target) {
            if (target === void 0) { target = _this; }
            return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, console.log("".concat(target.constructor.name, " disconnected!"))
                    // ondata = async (data, from) => console.log(`${this.constructor.name}: ${data}`)
                ];
            }); });
        };
        // ondata = async (data, from) => console.log(`${this.constructor.name}: ${data}`)
        this.onsend = function (msg, from) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            console.log("Sent ".concat(msg, " from ").concat(from));
            return [2 /*return*/];
        }); }); };
        this.onerror = function (err) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, console.log("".concat(this.constructor.name, " Error: ").concat(err))
                // --------------- Internal Methods ---------------
            ];
        }); }); };
        // --------------- Internal Methods ---------------
        this.ondata = function (data, charName) {
            // Run Data through Decoder Function
            if (_this._ondata instanceof Function) {
                var obj_1 = _this._ondata(data, charName); // returns array
                // Add DataStreamTrack for each Data Channel
                if (_this.stream) {
                    var keys = Object.keys(obj_1);
                    keys.forEach(function (key) {
                        var _a;
                        if (_this.stream) {
                            var track = (_a = _this.stream.tracks.get(key)) !== null && _a !== void 0 ? _a : _this._createTrack(key);
                            if (track instanceof DataStreamTrack)
                                track.addData(obj_1[key]);
                        }
                    });
                }
            }
        };
        this._createTrack = function (contentHint) {
            if (_this.stream) {
                var newTrack = new DataStreamTrack(_this);
                if (typeof contentHint === 'string')
                    newTrack.contentHint = contentHint;
                return _this.stream.addTrack(newTrack);
            }
            else
                return undefined;
        };
        this.constraints = constraints;
        this.device = (constraints.device) ? new constraints.device(constraints) : this;
        this.stream = constraints.stream;
        // -------------- Set Default Constraints --------------
        this.init(this.constraints);
    }
    return Device;
}());
export { Device };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZGV2aWNlcy9EZXZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUcxRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFHM0M7SUFXSSx5QkFBeUI7SUFDekIsMkJBQTJCO0lBQzNCLCtCQUErQjtJQUUvQixnQkFBWSxXQUFxQztRQUFqRCxpQkFRQztRQXJCRCxPQUFFLEdBQVcsVUFBVSxFQUFFLENBQUE7UUFDekIsWUFBTyxHQUF3RSxVQUFDLElBQUksSUFBSyxPQUFBLElBQUksRUFBSixDQUFJLENBQUE7UUFNN0YsV0FBTSxHQUFZLEtBQUssQ0FBQTtRQWlCdkIsU0FBSSxHQUFHLFVBQUMsV0FBNEM7O1lBRWhELDJCQUEyQjtZQUMzQixJQUFJLEtBQUksQ0FBQyxNQUFNO2dCQUFFLEtBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtZQUVsQyxxQkFBcUI7WUFDckIsSUFBSSxXQUFXLEVBQUU7Z0JBRWIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFBLENBQUMsMEJBQTBCO2dCQUV2RSxjQUFjO2dCQUNkLEtBQUksQ0FBQyxTQUFTLEdBQUcsTUFBQSxLQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsbUNBQUksS0FBSSxDQUFDLFNBQVMsQ0FBQztnQkFDOUQsS0FBSSxDQUFDLFlBQVksR0FBRyxNQUFBLEtBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxtQ0FBSSxLQUFJLENBQUMsWUFBWSxDQUFDO2dCQUN2RSxJQUFJLEtBQUksQ0FBQyxXQUFXLENBQUMsTUFBTTtvQkFBRSxLQUFJLENBQUMsT0FBTyxHQUFHLEtBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFBO2dCQUVuRSxLQUFJLENBQUMsT0FBTyxHQUFHLE1BQUEsS0FBSSxD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