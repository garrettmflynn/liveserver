/*

The DataDevice interface provides access to connected data hardware like EEGs.
In essence, it lets you obtain access to any hardware source of data.

Based on https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API

*/
import { __awaiter, __extends, __generator, __read, __spreadArray } from "tslib";
import { DataStream } from './DataStream';
import { Bluetooth as BluetoothDevice } from '../devices/Bluetooth.device';
import { SerialDevice } from '../devices/Serial.device';
// import {EventSourceDevice} from '../devices/EventSource.device'
import { Device } from '../devices/Device';
import { DataTrackSupportedConstraints } from './DataTrackSupportedConstraints';
import { WebSocketDevice } from '../devices/WebSocket.device';
import { DataDeviceInfo } from './DataDeviceInfo';
/**
 * The DataDevices interface provides access to data sources like webcams, microphones, and BLE / USB devices.
 * ```typescript
 * import { DataDevices } from "datastreams-api";
 *
 * const dataDevices = new DataDevices();
 * ```
 */
var DataDevices = /** @class */ (function (_super) {
    __extends(DataDevices, _super);
    function DataDevices() {
        var _this = _super.call(this) || this;
        _this.devices = [];
        // // trigger devicechange event
        // _devicechanged = () => {
        //     this.dispatchEvent(new Event('devicechange'))
        // }
        _this.load = function (devices) {
            var _a;
            if (Array.isArray(devices))
                (_a = _this.devices).push.apply(_a, __spreadArray([], __read(devices), false));
            else if (!!devices)
                _this.devices.push(devices);
        };
        _this.enumerateDevices = function () { return __awaiter(_this, void 0, void 0, function () {
            var usb, serial, bluetooth, media;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.usb.getDevices()
                        // Get Previously Connected Devices from navigator.serial.requestDevice({filters:[]})
                    ];
                    case 1:
                        usb = _a.sent();
                        return [4 /*yield*/, navigator.serial.getPorts()
                            // Get Previously Connected Devices from navigator.bluetooth.requestDevice({acceptAllDevices: true})
                        ];
                    case 2:
                        serial = _a.sent();
                        bluetooth = [];
                        return [4 /*yield*/, navigator.mediaDevices.enumerateDevices()];
                    case 3:
                        media = _a.sent();
                        return [2 /*return*/, __spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(media), false), __read(serial), false), __read(usb), false), __read(bluetooth), false)];
                }
            });
        }); };
        _this.getSupportedDevices = function (filter) { return __awaiter(_this, void 0, void 0, function () {
            var media;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        media = [];
                        if (!(!filter || filter === 'media')) return [3 /*break*/, 2];
                        return [4 /*yield*/, navigator.mediaDevices.enumerateDevices()];
                    case 1:
                        media = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, __spreadArray(__spreadArray([], __read(media), false), __read(this.devices), false)];
                }
            });
        }); };
        _this.getDeviceInfo = function (constraints) { return DataDeviceInfo(constraints); };
        _this.getSupportedConstraints = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new DataTrackSupportedConstraints(this)];
            });
        }); };
        // Use the `protocol` key to specify how to connect with a device
        _this.getDevice = function (constraints) {
            if (constraints.protocol) {
                if (constraints.protocol.includes('bluetooth'))
                    return new BluetoothDevice(constraints);
                else if (constraints.protocol.includes('serial'))
                    return new SerialDevice(constraints);
                // else if (constraints.protocol.includes('wifi')) return new EventSourceDevice(constraints)
                else if (constraints.protocol.includes('websocket'))
                    return new WebSocketDevice(constraints);
            }
            return;
        };
        _this.startDataStream = function (constraints, stream) {
            if (stream === void 0) { stream = new DataStream(); }
            return __awaiter(_this, void 0, void 0, function () {
                var device, copy, info;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            constraints.stream = stream; // Bind DataStream to the device
                            copy = Object.assign({}, constraints) // Copy
                            ;
                            if (copy.device) {
                                // Wrap in Device Class
                                device = new Device(copy);
                            }
                            else {
                                // Option #1: Get device from raw constraints
                                device = this.getDevice(copy);
                                // Option #2: Infer preferred connection type from device constraints
                                if (!device) {
                                    info = DataDeviceInfo(constraints);
                                    copy.protocol = [];
                                    info.protocols.forEach(function (str) { return copy.protocol.push(str); });
                                    device = this.getDevice(copy);
                                }
                                // Option #3: Fallback to generic device
                                if (!device)
                                    return [2 /*return*/, new Device(constraints)];
                            }
                            return [4 /*yield*/, device.connect().then(function (res) { return res; }).catch(function () {
                                    throw 'Device not connected';
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, device];
                    }
                });
            });
        };
        // Pass the full constraint object for the device you want to request
        _this.getUserStream = function (constraints) { return __awaiter(_this, void 0, void 0, function () {
            var mediaStream, stream, displayStream, device;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(constraints.video || constraints.audio)) return [3 /*break*/, 2];
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia(constraints)];
                    case 1:
                        mediaStream = _a.sent();
                        _a.label = 2;
                    case 2:
                        stream = new DataStream(mediaStream);
                        if (!constraints.screen) return [3 /*break*/, 4];
                        return [4 /*yield*/, navigator.mediaDevices.getDisplayMedia({ video: true })];
                    case 3:
                        displayStream = _a.sent();
                        displayStream.getTracks().forEach(stream.addTrack);
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.startDataStream(constraints, stream)
                        // Apply Constraints
                    ];
                    case 5:
                        device = _a.sent();
                        // Apply Constraints
                        stream.getTracks().forEach(function (t) {
                            t.applyConstraints(constraints);
                            // let settings = t.getSettings() // TODO: Returns a dictionary currently set values for the constraints
                            // console.log(`Track ${i} Settings`,settings)
                        });
                        return [2 /*return*/, device];
                }
            });
        }); };
        return _this;
        /* -------- Events --------
            devicechange (to implement): Fired when a biosensing input or output device is attached to or removed from the user's computer.

            this.addEventListener('devicechange', () => {
                console.error('test')
            })
        */
    }
    Object.defineProperty(DataDevices.prototype, Symbol.toStringTag, {
        get: function () { return 'DataDevices'; },
        enumerable: false,
        configurable: true
    });
    return DataDevices;
}(EventTarget));
export { DataDevices };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YURldmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFEZXZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0VBT0U7O0FBRUYsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUUsU0FBUyxJQUFJLGVBQWUsRUFBRSxNQUFNLDZCQUE2QixDQUFBO0FBQzFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUN2RCxrRUFBa0U7QUFDbEUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLGlDQUFpQyxDQUFBO0FBRS9FLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFHbEQ7Ozs7Ozs7R0FPRztBQUVIO0lBQWlDLCtCQUFXO0lBTXhDO1FBQUEsWUFDSSxpQkFBTyxTQVNWO1FBZEQsYUFBTyxHQUFpQixFQUFFLENBQUE7UUFnQjFCLGdDQUFnQztRQUNoQywyQkFBMkI7UUFDM0Isb0RBQW9EO1FBQ3BELElBQUk7UUFFSixVQUFJLEdBQUcsVUFBQyxPQUFrRTs7WUFDdEUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFBRSxDQUFBLEtBQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQSxDQUFDLElBQUksb0NBQUksT0FBTyxXQUFDO2lCQUNwRCxJQUFJLENBQUMsQ0FBQyxPQUFPO2dCQUFFLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2xELENBQUMsQ0FBQTtRQUVELHNCQUFnQixHQUFHOzs7OzRCQUdOLHFCQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO3dCQUUxQyxxRkFBcUY7c0JB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