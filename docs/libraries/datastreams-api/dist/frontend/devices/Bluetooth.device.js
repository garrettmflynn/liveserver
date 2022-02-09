// BluetoothDevice modified from this sparkfun tutorial: https://learn.sparkfun.com/tutorials/esp32-ota-updates-over-ble-from-a-react-web-application/all
// Joshua Brewster and Garrett Flynn, November 2021 (AGPL License)
import { __awaiter, __extends, __generator } from "tslib";
//See original copyright:
/***************************************************
 This is a React WebApp written to Flash an ESP32 via BLE

Written by Andrew England (SparkFun)
BSD license, all text above must be included in any redistribution.
*****************************************************/
import { Device } from "./Device";
var Bluetooth = /** @class */ (function (_super) {
    __extends(Bluetooth, _super);
    function Bluetooth(constraints) {
        var _this = _super.call(this, constraints) || this;
        _this.characteristics = {};
        // ---------------------- CORE ----------------------
        _this.connect = function () { return __awaiter(_this, void 0, void 0, function () {
            var serviceUUID, filters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        serviceUUID = (typeof this.constraints.serviceUUID === 'string') ? this.constraints.serviceUUID.toLowerCase() : this.constraints.serviceUUID;
                        filters = [];
                        if (serviceUUID)
                            filters.push({ services: [serviceUUID] });
                        if (this.constraints.namePrefix)
                            filters.push({ namePrefix: this.constraints.namePrefix });
                        return [4 /*yield*/, navigator.bluetooth.requestDevice({
                                filters: filters
                            })
                                .then(function (source) {
                                _this.source = source;
                                var gatt = source.gatt;
                                if (gatt)
                                    return gatt.connect(); //Connect to HEG
                                else
                                    return Promise.reject();
                            })
                                .then(function (server) {
                                if (serviceUUID) {
                                    _this.server = server;
                                    return server.getPrimaryService(serviceUUID);
                                }
                                else
                                    return Promise.reject();
                            })
                                .then(function (service) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b, _i, name_1;
                                var _this = this;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            this.service = service;
                                            if (this.source)
                                                this.source.addEventListener('gattserverdisconnected', function () { _this.ondisconnect(_this); });
                                            _a = [];
                                            for (_b in this.constraints.characteristics)
                                                _a.push(_b);
                                            _i = 0;
                                            _c.label = 1;
                                        case 1:
                                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                                            name_1 = _a[_i];
                                            return [4 /*yield*/, this.connectCharacteristic(name_1, this.constraints.characteristics[name_1])];
                                        case 2:
                                            _c.sent();
                                            _c.label = 3;
                                        case 3:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 4:
                                            this.onconnect(this);
                                            return [2 /*return*/];
                                    }
                                });
                            }); })
                                .catch(function (err) { console.error(err); _this.onerror(err); return Promise.reject(); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this._disconnect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                (_a = this.server) === null || _a === void 0 ? void 0 : _a.disconnect();
                return [2 /*return*/];
            });
        }); };
        _this.send = function (msg, charName) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.transmitCharacteristic)
                    return [2 /*return*/, this.transmitCharacteristic.writeValue(this.encode(msg, charName))];
                return [2 /*return*/];
            });
        }); };
        // ---------------------- CALLBACKS ----------------------
        _this.onnotification = function (e, charName) {
            _this.ondata(_this.decode(e.target.value, charName), charName);
        };
        // ---------------------- INTERNAL UTILITIES ----------------------
        _this.connectCharacteristic = function (name, value) { return __awaiter(_this, void 0, void 0, function () {
            var characteristic, props;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(value)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(value.map(function (val, i) { return _this.connectCharacteristic("".concat(name).concat(i), val); }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        value = (typeof value === 'string') ? value.toLowerCase() : value;
                        if (!this.service) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.service.getCharacteristic(value)];
                    case 3:
                        characteristic = _a.sent();
                        this.characteristics[name] = characteristic;
                        props = characteristic.properties;
                        // Assign to Write to this Characteristic
                        if (props.write || props.writeWithoutResponse) {
                            this.transmitCharacteristic = characteristic;
                        }
                        // Start Notifications
                        if (props.notify) {
                            characteristic.addEventListener('characteristicvaluechanged', function (e) {
                                _this.onnotification(e, name);
                            });
                            return [2 /*return*/, characteristic.startNotifications()];
                        }
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        return _this;
    }
    return Bluetooth;
}(Device));
export { Bluetooth };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmx1ZXRvb3RoLmRldmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2RldmljZXMvQmx1ZXRvb3RoLmRldmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5SkFBeUo7QUFDekosa0VBQWtFOztBQUdsRSx5QkFBeUI7QUFDekI7Ozs7O3NEQUtzRDtBQUN0RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFBO0FBRy9CO0lBQXNDLDZCQUFTO0lBYTNDLG1CQUFZLFdBQWtDO1FBQTlDLFlBQ0ksa0JBQU0sV0FBVyxDQUFDLFNBQ3JCO1FBWE8scUJBQWUsR0FFWCxFQUFFLENBQUM7UUFXZixxREFBcUQ7UUFFckQsYUFBTyxHQUFHOzs7Ozs7d0JBQ0YsV0FBVyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFBO3dCQUU1SSxPQUFPLEdBQUcsRUFBRSxDQUFBO3dCQUNoQixJQUFJLFdBQVc7NEJBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTt3QkFDMUQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7NEJBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUE7d0JBRTFGLHFCQUFNLFNBQVMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO2dDQUNwQyxPQUFPLFNBQUE7NkJBQ1YsQ0FBQztpQ0FDRyxJQUFJLENBQUMsVUFBQyxNQUFzQjtnQ0FDckIsS0FBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0NBQ3JCLElB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