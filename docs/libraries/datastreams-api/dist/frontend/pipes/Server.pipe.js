import { __awaiter, __extends, __generator } from "tslib";
import { Pipe } from "./Pipe";
var ServerPipe = /** @class */ (function (_super) {
    __extends(ServerPipe, _super);
    function ServerPipe(settings) {
        var _this = 
        // Socket Created on Route
        _super.call(this, 'server', settings) || this;
        _this.queue = [];
        _this.readyForData = false;
        _this.send = function (o) {
            return new Promise(function (resolve) {
                var sendFunction = function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!this.socket) return [3 /*break*/, 2];
                                _a = resolve;
                                return [4 /*yield*/, this.socket.send(o, 'offload')];
                            case 1:
                                _a.apply(void 0, [_b.sent()]);
                                _b.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); };
                if (_this.readyForData || o.cmd === 'settings')
                    sendFunction();
                else
                    _this.queue.push(sendFunction);
            });
        };
        _this.sendData = function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send({ cmd: 'data', data: data })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        // Process by sending to server
        _this.process = function (args) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(args))
                            args = [args];
                        return [4 /*yield*/, this.sendData(args)];
                    case 1:
                        res = _a.sent();
                        this.ondata(res); // pass to subscriptions
                        return [2 /*return*/, res.data];
                }
            });
        }); };
        // Hook for Insertable Streams Transform
        _this.transform = function (chunk, controller) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendData(chunk)]; // applies function on server
                    case 1:
                        res = _a.sent() // applies function on server
                        ;
                        if (res)
                            controller.enqueue(res.data);
                        return [2 /*return*/];
                }
            });
        }); };
        // Adding Custom Callbacks
        if (_this.socket) {
            _this.socket.onopen = function () {
                // Strip Source (self)
                var data = {};
                for (var key in settings) {
                    if (key != 'source')
                        data[key] = settings[key]; // TODO: Make robust to typing error
                }
                _this.send({ cmd: 'settings', data: data });
            };
            _this.socket.onmessage = function (o) {
                if (o.cmd === 'ready') {
                    _this.readyForData = true;
                    _this.queue.forEach(function (f) { return f(); });
                }
                // else if (o.cmd === 'data') this.ondata(o)
            };
            _this.socket.onclose = function () {
                _this.readyForData = false;
            };
        }
        return _this;
    }
    Object.defineProperty(ServerPipe.prototype, Symbol.toStringTag, {
        get: function () { return 'ServerPipe'; },
        enumerable: false,
        configurable: true
    });
    return ServerPipe;
}(Pipe));
export { ServerPipe };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyLnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9waXBlcy9TZXJ2ZXIucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUs5QjtJQUFnQyw4QkFBSTtJQVFoQyxvQkFBWSxRQUF5QjtRQUFyQztRQUVJLDBCQUEwQjtRQUMxQixrQkFBTSxRQUFRLEVBQUUsUUFBUSxDQUFDLFNBNEI1QjtRQW5DRCxXQUFLLEdBQVUsRUFBRSxDQUFBO1FBRWpCLGtCQUFZLEdBQVksS0FBSyxDQUFBO1FBb0M3QixVQUFJLEdBQUcsVUFBQyxDQUFVO1lBQ2QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU87Z0JBQ3RCLElBQUksWUFBWSxHQUFHOzs7OztxQ0FDWCxJQUFJLENBQUMsTUFBTSxFQUFYLHdCQUFXO2dDQUFFLEtBQUEsT0FBTyxDQUFBO2dDQUFDLHFCQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBQTs7Z0NBQTVDLGtCQUFRLFNBQWdELEVBQUMsQ0FBQzs7Ozs7cUJBQzlFLENBQUE7Z0JBQ0QsSUFBSSxLQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssVUFBVTtvQkFBRSxZQUFZLEVBQUUsQ0FBQTs7b0JBQ3hELEtBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ3RDLENBQUMsQ0FBQyxDQUFBO1FBRU4sQ0FBQyxDQUFBO1FBRUQsY0FBUSxHQUFHLFVBQU8sSUFBVTs7OzRCQUNqQixxQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLE1BQUEsRUFBQyxDQUFDLEVBQUE7NEJBQTNDLHNCQUFPLFNBQW9DLEVBQUM7OzthQUMvQyxDQUFBO1FBRUQsK0JBQStCO1FBQy9CLGFBQU8sR0FBRyxVQUFPLElBQVU7Ozs7O3dCQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7NEJBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7d0JBQzdCLHFCQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUE7O3dCQUEvQixHQUFHLEdBQUcsU0FBeUI7d0JBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQyx3QkFBd0I7d0JBQ3pDLHNCQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUE7OzthQUNsQixDQUFBO1FBR0Qsd0NBQXdDO1FBQ3hDLGVBQVMsR0FBRyxVQUFPLEtBQVUsRUFBRSxVQUEyQzs7Ozs0QkFDNUQscUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBQSxDQUFDLDZCQUE2Qjs7d0JBQTlELEdBQUcsR0FBRyxTQUEwQixDQUFDLDZCQUE2Qjt3QkFBOUI7d0JBQ3BDLElBQUksR0FBRzs0QkFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTs7OzthQUN4QyxDQUFBO1FBeERHLDBCQUEwQjtRQUMxQixJQUFJLEtBQUksQ0FBQyxNQUFNLEVBQUM7WUFDWixLQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRztnQkFFakIsc0JBQXNCO2dCQUN0QixJQUFJLElBQUksR0FBRyxFQUFFLENBQUE7Z0JBQ2IsS0FBSyxJQUFJLEdBQUcsSUFBSSxRQUFRLEVBQUU7b0JBQ3RCLElBQUksR0FBRyxJQUFJLFFBQVE7d0JBQUcsSUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFJLFFBQWdCLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQyxvQ0FBb0M7aUJBQ3hHO2dCQUVELEtBQUksQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksTUFBQSxFQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDLENBQUE7WUFFRCxLQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxVQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxPQUFPLEVBQUU7b0JBQ25CLEtBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO29CQUN4QixLQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsRUFBRSxFQUFILENBQUcsQ0FBQyxDQUFBO2lCQUMvQjtnQkFDRCw0Q0FBNEM7WUFDaEQsQ0FBQyxDQUFBO1lBRUQsS0FBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUc7Z0JBQ2xCLEtBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFBO1lBQzdCLENBQUMsQ0FBQTtTQUNKOztJQUNMLENBQUM7SUFyQ0Qsc0JBQUksc0JBQUMsTUFBTSxDQUFDLFdBQVk7YUFBeEIsY0FBNkIsT0FBTyxZQUFZLENBQUEsQ0FBQyxDQUFDOzs7T0FBQTtJQXFFdEQsaUJBQUM7QUFBRCxDQUFDLEFBdkVELENBQWdDLElBQUksR0F1RW5DIn0=