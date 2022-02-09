import { __awaiter, __extends, __generator } from "tslib";
import { Device } from "./Device";
import { Websocket } from '../utils/WebSocket';
var WebSocketDevice = /** @class */ (function (_super) {
    __extends(WebSocketDevice, _super);
    function WebSocketDevice(constraints) {
        var _this = _super.call(this, constraints) || this;
        _this._connect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.socket || this.socket.url != this.constraints.url) {
                    this.socket = new Websocket(this.constraints.url, { services: ['websocket'] });
                    this.socket.onmessage = function (msg) {
                        if (msg.service === 'websocket')
                            _this.ondata(msg.data);
                    };
                }
                return [2 /*return*/];
            });
        }); };
        _this._disconnect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
                return [2 /*return*/];
            });
        }); };
        _this.send = function (msg) { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
            return [2 /*return*/, (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(msg)];
        }); }); };
        return _this;
    }
    return WebSocketDevice;
}(Device));
export { WebSocketDevice };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViU29ja2V0LmRldmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2RldmljZXMvV2ViU29ja2V0LmRldmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQUVqQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFL0M7SUFBNEMsbUNBQVM7SUFJakQseUJBQVksV0FBa0M7UUFBOUMsWUFFSSxrQkFBTSxXQUFXLENBQUMsU0FDckI7UUFFRCxjQUFRLEdBQUc7OztnQkFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtvQkFDekQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUMsQ0FBQTtvQkFDNUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsVUFBQyxHQUErQjt3QkFDcEQsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLFdBQVc7NEJBQUUsS0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7b0JBQzFELENBQUMsQ0FBQTtpQkFDSjs7O2FBQ0osQ0FBQTtRQUVELGlCQUFXLEdBQUc7OztnQkFDVixNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLEtBQUssRUFBRSxDQUFBOzs7YUFDdkIsQ0FBQTtRQUVELFVBQUksR0FBRyxVQUFPLEdBQVU7WUFBSyxzQkFBQSxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQTtpQkFBQSxDQUFBOztJQWZuRCxDQUFDO0lBZ0JMLHNCQUFDO0FBQUQsQ0FBQyxBQXZCRCxDQUE0QyxNQUFNLEdBdUJqRCJ9