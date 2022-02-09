import { __awaiter, __extends, __generator } from "tslib";
import { Websocket } from "../utils/WebSocket";
import { randomUUID } from '../../common/id';
var Pipe = /** @class */ (function (_super) {
    __extends(Pipe, _super);
    function Pipe(type, settings) {
        if (type === void 0) { type = 'stream'; }
        if (settings === void 0) { settings = {}; }
        var _a;
        var _this = _super.call(this) || this;
        _this.id = randomUUID();
        _this.callback = function () { };
        _this.process = function (data) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, data];
        }); }); };
        // Largely Replaced by Child-Specific Event Listeners
        _this.subscribe = function (callback) {
            _this.callback = callback;
        };
        _this.unsubscribe = function () {
            _this.callback = function () { };
        };
        _this.ondata = function (data) {
            if (!('service' in data))
                _this.callback(data); // ignore service callbacks
        };
        _this.id = randomUUID();
        _this.type = type;
        _this.settings = settings;
        // Create Socket
        var needsSocket = ['server', 'stream'];
        if (needsSocket.includes(type)) {
            _this.socket = (_a = settings.socket) !== null && _a !== void 0 ? _a : new Websocket(settings.server, { auth: settings.auth }); // server and stream needs WebSocket
            if (type === 'stream')
                _this.socket.addEventListener('message', _this.ondata); // only stream needs an ambient ondata listener
        }
        if (settings.callback instanceof Function)
            _this.callback = settings.callback;
        return _this;
    }
    Object.defineProperty(Pipe.prototype, Symbol.toStringTag, {
        get: function () { return 'Pipe'; },
        enumerable: false,
        configurable: true
    });
    return Pipe;
}(EventTarget));
export { Pipe };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3BpcGVzL1BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFHNUM7SUFBMEIsd0JBQVc7SUFVakMsY0FBWSxJQUEwQixFQUFFLFFBQThCO1FBQTFELHFCQUFBLEVBQUEsZUFBMEI7UUFBRSx5QkFBQSxFQUFBLGFBQThCOztRQUF0RSxZQUNJLGlCQUFPLFNBZVY7UUF0QkQsUUFBRSxHQUFXLFVBQVUsRUFBRSxDQUFBO1FBSXpCLGNBQVEsR0FBcUIsY0FBTyxDQUFDLENBQUE7UUFvQnJDLGFBQU8sR0FBRyxVQUFPLElBQVE7WUFBTSxzQkFBTyxJQUFJLEVBQUE7aUJBQUMsQ0FBQTtRQUUzQyxxREFBcUQ7UUFDckQsZUFBUyxHQUFHLFVBQUMsUUFBeUI7WUFDbEMsS0FBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7UUFDNUIsQ0FBQyxDQUFBO1FBRUQsaUJBQVcsR0FBRztZQUNWLEtBQUksQ0FBQyxRQUFRLEdBQUcsY0FBTyxDQUFDLENBQUE7UUFDNUIsQ0FBQyxDQUFBO1FBRUQsWUFBTSxHQUFHLFVBQUMsSUFBUTtZQUNkLElBQUksQ0FBQyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUM7Z0JBQUcsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDLDJCQUEyQjtRQUM5RSxDQUFDLENBQUE7UUE1QkcsS0FBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLEVBQUUsQ0FBQTtRQUN0QixLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixLQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUV4QixnQkFBZ0I7UUFDaEIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDdEMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDO1lBQzNCLEtBQUksQ0FBQyxNQUFNLEdBQUcsTUFBQSxRQUFRLENBQUMsTUFBTSxtQ0FBSSxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFBLENBQUMsb0NBQW9DO1lBQzNILElBQUksSUFBSSxLQUFLLFFBQVE7Z0JBQUUsS0FBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUMsK0NBQStDO1NBQzlIO1FBRUQsSUFBSSxRQUFRLENBQUMsUUFBUSxZQUFZLFFBQVE7WUFBRSxLQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUE7O0lBRWhGLENBQUM7SUF4QkQsc0JBQUksZ0JBQUMsTUFBTSxDQUFDLFdBQVk7YUFBeEIsY0FBNkIsT0FBTyxNQUFNLENBQUEsQ0FBQyxDQUFDOzs7T0FBQTtJQTBDaEQsV0FBQztBQUFELENBQUMsQUE1Q0QsQ0FBMEIsV0FBVyxHQTRDcEMifQ==