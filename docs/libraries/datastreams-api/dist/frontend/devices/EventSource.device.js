// Adapted from Josh Brewster's implementation for the HEGduino
// Garrett Flynn, Nov 2021 (AGPL License) | totally not tested...
import { __awaiter, __extends, __generator } from "tslib";
import { Device } from './Device';
var EventSourceDevice = /** @class */ (function (_super) {
    __extends(EventSourceDevice, _super);
    function EventSourceDevice(constraints) {
        var _this = _super.call(this, constraints) || this;
        _this.url = '';
        _this.customCallbacks = [];
        _this.api = {};
        _this.send = function (body, url) {
            if (url === void 0) { url = _this.url; }
            return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(url, { method: 'POST', body: body })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); });
        };
        _this.connect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.createEventListeners()];
        }); }); };
        _this._disconnect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.removeEventListeners()];
        }); }); };
        // ---------------------- CALLBACKS ----------------------
        _this.onconnect = function (e) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, console.log("Event source connected!", e.data)];
        }); }); };
        _this.onerror = function (e) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Error:", e.data);
                if (e.target.readyState !== EventSource.OPEN) {
                    console.log("Event source disconnected!");
                }
                return [2 /*return*/];
            });
        }); };
        // ---------------------- INTERNAL UTILITIES ----------------------
        _this.createEventListeners = function () {
            if (_this.source !== null)
                _this.removeEventListeners();
            if (globalThis.EventSource) {
                _this.source = new EventSource(_this.url);
                _this.source.addEventListener('open', function () {
                    _this.active = true;
                    _this.onconnect(_this);
                }, false);
                _this.source.addEventListener('error', _this.onerror, false);
                _this.source.addEventListener('message', _this.ondata, false);
                if (_this.customCallbacks.length > 0) {
                    _this.customCallbacks.forEach(function (item) {
                        if (_this.source)
                            _this.source.addEventListener(item.tag, item.callback, false);
                    });
                }
            }
        };
        _this.removeEventListeners = function () {
            if (globalThis.EventSource && _this.source) {
                _this.source.close();
                _this.source.removeEventListener('open', _this.onconnect, false);
                _this.source.removeEventListener('error', _this.onerror, false);
                _this.source.removeEventListener('message', _this.ondata, false);
                if (_this.customCallbacks.length > 0) {
                    _this.customCallbacks.forEach(function (item) {
                        if (_this.source)
                            _this.source.removeEventListener(item.tag, item.callback, false);
                    });
                }
                _this.source = undefined;
            }
        };
        return _this;
    }
    // ---------------------- CORE ----------------------
    //create a function to post to URLS with optional data, usernames, and passwords
    EventSourceDevice.prototype.newPostCommand = function (name, url, data, user, pass) {
        if (name === void 0) { name = "post"; }
        if (url === void 0) { url = this.constraints.url; }
        if (data === void 0) { data = undefined; }
        if (user === void 0) { user = undefined; }
        if (pass === void 0) { pass = undefined; }
        var func = function () {
            var xhr = new XMLHttpRequest();
            if (url) {
                xhr.open('POST', url, true, user, pass);
                xhr.send(data); //Accepts: string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array>
                xhr.onerror = function () { xhr.abort(); };
            }
        };
        this.api[name] = func;
        return func;
    };
    return EventSourceDevice;
}(Device));
export { EventSourceDevice };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRTb3VyY2UuZGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZGV2aWNlcy9FdmVudFNvdXJjZS5kZXZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0RBQStEO0FBQy9ELGlFQUFpRTs7QUFFakUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQVFqQztJQUFnRCxxQ0FBUztJQVNyRCwyQkFBWSxXQUFxQztRQUFqRCxZQUNJLGtCQUFNLFdBQVcsQ0FBQyxTQUNyQjtRQVRELFNBQUcsR0FBVyxFQUFFLENBQUE7UUFFaEIscUJBQWUsR0FBcUIsRUFBRSxDQUFBO1FBQ3RDLFNBQUcsR0FFQyxFQUFFLENBQUE7UUF1Qk4sVUFBSSxHQUFHLFVBQU8sSUFBUyxFQUFFLEdBQWM7WUFBZCxvQkFBQSxFQUFBLE1BQU0sS0FBSSxDQUFDLEdBQUc7Ozs0QkFBSyxxQkFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDLEVBQUE7NEJBQTFDLHNCQUFBLFNBQTBDLEVBQUE7OztTQUFBLENBQUE7UUFFdEYsYUFBTyxHQUFHO1lBQVksc0JBQUEsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUE7aUJBQUEsQ0FBQztRQUVsRCxpQkFBVyxHQUFHO1lBQVksc0JBQUEsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUE7aUJBQUEsQ0FBQztRQUV0RCwwREFBMEQ7UUFFMUQsZUFBUyxHQUFHLFVBQU8sQ0FBTTtZQUFLLHNCQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFBO2lCQUFBLENBQUM7UUFFN0UsYUFBTyxHQUFHLFVBQU8sQ0FBTTs7Z0JBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSSxFQUFFO29CQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7aUJBQzdDOzs7YUFDSixDQUFBO1FBRUQsbUVBQW1FO1FBRW5FLDBCQUFvQixHQUFHO1lBQ25CLElBQUksS0FBSSxDQUFDLE1BQU0sS0FBSyxJQUFJO2dCQUFFLEtBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ3RELElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRTtnQkFDeEIsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLEtBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO29CQUNqQyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtvQkFDbEIsS0FBSSxDQUFDLFNBQVMsQ0FBQyxLQUFJLENBQUMsQ0FBQTtnQkFDeEIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNWLEtBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNELEtBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEtBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVELElBQUksS0FBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNqQyxLQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUk7d0JBQzlCLElBQUksS0FBSSxDQUFDLE1BQU07NEJBQUUsS0FBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2xGLENBQUMsQ0FBQyxDQUFBO2lCQUNMO2FBQ0o7UUFDTCxDQUFDLENBQUE7UUFFRCwwQkFBb0IsR0FBRztZQUNuQixJQUFJLFVBQVUsQ0FBQyxXQUFXLElBQUksS0FBSSxDQUFDLE1BQU0sRUFBRTtnQkFDdkMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEIsS0FBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsS0FBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0QsS0FBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsS0FBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDOUQsS0FBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsS0FBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxLQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ2pDLEtBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBSTt3QkFDOUIsSUFBSSxLQUFJLENBQUMsTUFBTTs0QkFBRSxLQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDckYsQ0FBQyxDQUFDLENBQUM7aUJBQ047Z0JBQ0QsS0FBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7YUFDM0I7UUFDTCxDQUFDLENBQUE7O0lBckVELENBQUM7SUFFRCxxREFBcUQ7SUFFckQsZ0ZBQWdGO0lBQ2hGLDBDQUFjLEdBQWQsVUFBZSxJQUFxQixFQUFFLEdBQTBCLEVBQUUsSUFBZ0IsRUFBRSxJQUFnQixFQUFFLElBQWdCO1FBQXZHLHFCQUFBLEVBQUEsYUFBcUI7UUFBRSxvQkFBQSxFQUFBLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHO1FBQUUscUJBQUEsRUFBQSxnQkFBZ0I7UUFBRSxxQkFBQSxFQUFBLGdCQUFnQjtRQUFFLHFCQUFBLEVBQUEsZ0JBQWdCO1FBQ2xILElBQU0sSUFBSSxHQUFHO1lBQ1QsSUFBSSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUMvQixJQUFJLEdBQUcsRUFBRTtnQkFDTCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDZIQUE2SDtnQkFDN0ksR0FBRyxDQUFDLE9BQU8sR0FBRyxjQUFjLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM5QztRQUNMLENBQUMsQ0FBQTtRQUNELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRXRCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFzREwsd0JBQUM7QUFBRCxDQUFDLEFBbEZELENBQWdELE1BQU0sR0FrRnJEIn0=