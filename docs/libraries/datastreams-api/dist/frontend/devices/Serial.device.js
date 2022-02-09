import { __awaiter, __extends, __generator } from "tslib";
// webSerial utils developed by Diego Schmaedech (MIT License) for chrome. 
// Modified/Generalized and updated for web Serial by Joshua Brewster (MIT License) 
// Modified and updated for device filtering by Garrett Flynn (AGPL License)
import { Device } from './Device';
var SerialDevice = /** @class */ (function (_super) {
    __extends(SerialDevice, _super);
    function SerialDevice(constraints) {
        var _this = _super.call(this, constraints) || this;
        _this.displayPorts = [];
        _this.encodedBuffer = "";
        _this.connected = false;
        _this.recordData = false;
        _this.recorded = [];
        _this.port = null;
        _this.decoder = new TextDecoder();
        _this.subscribed = false;
        _this.readable = null;
        _this.writer = null;
        _this.monitoring = false;
        _this.newSamples = 0;
        _this.monitorSamples = 10000; //Max 10000 samples visible in stream monitor by default
        _this.monitorData = [];
        _this.monitorIdx = 0;
        // ---------------------- CORE ----------------------
        // Supports one usbVendorId and usbProductId filter
        _this.connect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, usbVendorId, usbProductId, re, filters;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.constraints, usbVendorId = _a.usbVendorId, usbProductId = _a.usbProductId;
                        re = /[0-9A-Fa-f]{6}/g;
                        // Convert to Hexadecimal (assume strings are accurate)
                        // TODO: TypeScript doesn't like when passing strings as a filter. Do the opposite.
                        if (!!usbVendorId && typeof usbVendorId !== 'string' && !re.test(usbVendorId + ''))
                            usbVendorId = "0x".concat(usbVendorId.toString(16)); // test if this works
                        if (!!usbProductId && typeof usbProductId !== 'string' && !re.test(usbProductId + ''))
                            usbProductId = "0x".concat(usbProductId.toString(16)); // test if this works
                        filters = [
                            {
                                usbVendorId: usbVendorId,
                                usbProductId: usbProductId
                            }
                        ];
                        return [4 /*yield*/, navigator.serial.requestPort({ filters: filters }).then(this.onPortSelected)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.send = function (msg) { return __awaiter(_this, void 0, void 0, function () {
            var encodedString, bytes, i, writer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        msg += "\n";
                        encodedString = unescape(encodeURIComponent(msg));
                        bytes = new Uint8Array(encodedString.length);
                        for (i = 0; i < encodedString.length; ++i)
                            bytes[i] = encodedString.charCodeAt(i);
                        if (!navigator.serial) return [3 /*break*/, 2];
                        if (!this.port.writable) return [3 /*break*/, 2];
                        writer = this.port.writable.getWriter();
                        return [4 /*yield*/, writer.write(bytes.buffer)];
                    case 1:
                        _a.sent();
                        writer.releaseLock();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        // ---------------------- INTERNAL UTILITIES ----------------------
        _this.subscribe = function (port) {
            if (port === void 0) { port = _this.port; }
            return __awaiter(_this, void 0, void 0, function () {
                var transform, transformer;
                var _this = this;
                return __generator(this, function (_a) {
                    if (port.readable && this.subscribed === true) {
                        this.readable = port.readable; // TODO: Readable data handled externally
                        // Internal Management of the Stream
                        console.error('Managing the readable stream internally');
                        transform = function (value) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                console.log('streaming');
                                if (!this.subscribed)
                                    throw Error('Device disconnected');
                                this.onReceive(value);
                                return [2 /*return*/, value];
                            });
                        }); };
                        transformer = new TransformStream({ transform: transform });
                        this.readable
                            .pipeThrough(transformer)
                            .pipeTo(new WritableStream({}))
                            .then(function () { return console.log("All data successfully written!"); })
                            .catch(function (e) { return _this.handleError(e); });
                        return [2 /*return*/, true];
                    }
                    else
                        return [2 /*return*/, false];
                    return [2 /*return*/];
                });
            });
        };
        _this.handleError = function (error) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(error); // TODO: Handle non-fatal read error.
                        if (!(error.message.includes('framing') || error.message.includes('overflow') || error.message.includes('overrun') || error.message.includes('Overflow') || error.message.includes('break'))) return [3 /*break*/, 1];
                        this.subscribed = false;
                        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!this.readable) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.readable.cancel()];
                                    case 1:
                                        _a.sent();
                                        this.readable = null;
                                        _a.label = 2;
                                    case 2:
                                        this.subscribed = true;
                                        this.subscribe(this.port);
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 30); //try to resubscribe 
                        return [3 /*break*/, 4];
                    case 1:
                        if (!(error.message.includes('parity') || error.message.includes('Parity'))) return [3 /*break*/, 2];
                        if (this.port) {
                            this.subscribed = false;
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!this.readable) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.readable.cancel()];
                                        case 1:
                                            _a.sent();
                                            this.readable = null;
                                            _a.label = 2;
                                        case 2: return [4 /*yield*/, this.port.close()];
                                        case 3:
                                            _a.sent();
                                            //this.port = null;
                                            this.connected = false;
                                            setTimeout(function () { _this.onPortSelected(_this.port); }, 100); //close the port and reopen
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 50);
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this._disconnect()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        _this.onPortSelected = function (port) { return __awaiter(_this, void 0, void 0, function () {
            var serialOptions, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Set in Class
                        this.port = port;
                        // Add Disconnect Callback
                        navigator.serial.addEventListener("disconnect", this.disconnect);
                        serialOptions = { baudRate: 115200, bufferSize: 1000 };
                        if (typeof this.constraints.serialOptions === 'object')
                            Object.assign(serialOptions, this.constraints.serialOptions);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, port.open(serialOptions)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        return [4 /*yield*/, port.open(serialOptions)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        this.active = true;
                        this.onconnect(this);
                        this.connected = true;
                        this.subscribed = true;
                        // Subscribe to Port Data
                        return [4 /*yield*/, this.subscribe(port)];
                    case 6:
                        // Subscribe to Port Data
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.onReceive = function (input) {
            _this.encodedBuffer += _this.decoder.decode(input);
            var index;
            while ((index = _this.encodedBuffer.indexOf('\n')) >= 0) {
                var line = _this.encodedBuffer.substr(0, index + 1);
                if (_this.recordData == true) {
                    _this.recorded.push(line);
                }
                if (_this.monitoring = true) {
                    _this.newSamples++;
                    _this.monitorData.push(line);
                }
                _this.ondata(line);
                _this.encodedBuffer = _this.encodedBuffer.substr(index + 1);
            }
        };
        _this._disconnect = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.closePort();
                return [2 /*return*/];
            });
        }); };
        _this.closePort = function (port) {
            if (port === void 0) { port = _this.port; }
            return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (this.port) {
                        this.subscribed = false;
                        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            var err_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 4, , 5]);
                                        console.log('clsing', this.readable);
                                        if (!this.readable) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.readable.cancel()];
                                    case 1:
                                        _a.sent();
                                        this.readable = null;
                                        _a.label = 2;
                                    case 2: return [4 /*yield*/, port.close()];
                                    case 3:
                                        _a.sent();
                                        //this.port = null;
                                        this.connected = false;
                                        return [3 /*break*/, 5];
                                    case 4:
                                        err_2 = _a.sent();
                                        console.error(err_2);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); }, 50);
                    }
                    return [2 /*return*/];
                });
            });
        };
        if (navigator.serial)
            _this.decoder = new TextDecoder();
        else {
            console.log("ERROR: Cannot locate navigator.serial. Enable #experimental-web-platform-features in chrome://flags");
            alert("Serial support not found. Enable #experimental-web-platform-features in chrome://flags or use a chrome extension");
        }
        return _this;
    }
    return SerialDevice;
}(Device));
export { SerialDevice };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VyaWFsLmRldmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2RldmljZXMvU2VyaWFsLmRldmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMkVBQTJFO0FBQzNFLG9GQUFvRjtBQUNwRiw0RUFBNEU7QUFDNUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQUlqQztJQUF5QyxnQ0FBUztJQWtCOUMsc0JBQVksV0FBa0M7UUFBOUMsWUFFSSxrQkFBTSxXQUFXLENBQUMsU0FPckI7UUF6QkQsa0JBQVksR0FBVSxFQUFFLENBQUE7UUFDeEIsbUJBQWEsR0FBVyxFQUFFLENBQUE7UUFDMUIsZUFBUyxHQUFZLEtBQUssQ0FBQTtRQUMxQixnQkFBVSxHQUFZLEtBQUssQ0FBQTtRQUMzQixjQUFRLEdBQVUsRUFBRSxDQUFBO1FBQ3BCLFVBQUksR0FBUSxJQUFJLENBQUE7UUFDaEIsYUFBTyxHQUFnQixJQUFJLFdBQVcsRUFBRSxDQUFBO1FBQ3hDLGdCQUFVLEdBQVksS0FBSyxDQUFBO1FBQzNCLGNBQVEsR0FBMEIsSUFBSSxDQUFBO1FBQ3RDLFlBQU0sR0FBMEIsSUFBSSxDQUFBO1FBQ3BDLGdCQUFVLEdBQVksS0FBSyxDQUFBO1FBQzNCLGdCQUFVLEdBQVcsQ0FBQyxDQUFBO1FBQ3RCLG9CQUFjLEdBQVcsS0FBSyxDQUFBLENBQUMsd0RBQXdEO1FBQ3ZGLGlCQUFXLEdBQVUsRUFBRSxDQUFBO1FBQ3ZCLGdCQUFVLEdBQVcsQ0FBQyxDQUFBO1FBYXRCLHFEQUFxRDtRQUVyRCxtREFBbUQ7UUFDbkQsYUFBTyxHQUFHOzs7Ozt3QkFFRixLQUE4QixJQUFJLENBQUMsV0FBVyxFQUE3QyxXQUFXLGlCQUFBLEVBQUUsWUFBWSxrQkFBQSxDQUFxQjt3QkFFL0MsRUFBRSxHQUFHLGlCQUFpQixDQUFDO3dCQUUzQix1REFBdUQ7d0JBQ3ZELG1GQUFtRjt3QkFDbkYsSUFBSSxDQUFDLENBQUMsV0FBVyxJQUFJ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