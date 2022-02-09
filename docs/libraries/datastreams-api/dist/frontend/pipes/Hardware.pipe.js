import { __awaiter, __extends, __generator } from "tslib";
import { Pipe } from "./Pipe";
var HardwarePipe = /** @class */ (function (_super) {
    __extends(HardwarePipe, _super);
    function HardwarePipe(settings) {
        var _this = _super.call(this, 'device', settings) || this;
        // Note: Must actually embed on hardware here
        _this.process = function (args) { return __awaiter(_this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                if (this.settings.function instanceof Function) {
                    if (!Array.isArray(args))
                        args = [args];
                    data = this.settings.function(args) // unfold arguments
                    ;
                    this.ondata({ data: data }); // pass to subscriptions
                    return [2 /*return*/, data];
                }
                else
                    return [2 /*return*/, null];
                return [2 /*return*/];
            });
        }); };
        // Hook for Insertable Streams Transform
        _this.transform = function (chunk, controller) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                if (this.settings.function instanceof Function) {
                    res = this.settings.function(chunk) // apples function on hardware (to implement)
                    ;
                    controller.enqueue(res);
                }
                return [2 /*return*/];
            });
        }); };
        return _this;
    }
    Object.defineProperty(HardwarePipe.prototype, Symbol.toStringTag, {
        get: function () { return 'HardwarePipe'; },
        enumerable: false,
        configurable: true
    });
    return HardwarePipe;
}(Pipe));
export default HardwarePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGFyZHdhcmUucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3BpcGVzL0hhcmR3YXJlLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFHOUI7SUFBMEMsZ0NBQUk7SUFJMUMsc0JBQVksUUFBeUI7UUFBckMsWUFDSSxrQkFBTSxRQUFRLEVBQUUsUUFBUSxDQUFDLFNBRTVCO1FBR0QsNkNBQTZDO1FBQzdDLGFBQU8sR0FBRyxVQUFPLElBQWlCOzs7Z0JBQzlCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLFlBQVksUUFBUSxFQUFDO29CQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0JBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ25DLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxtQkFBbUI7b0JBQXBCLENBQUE7b0JBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLE1BQUEsRUFBQyxDQUFDLENBQUEsQ0FBQyx3QkFBd0I7b0JBQzVDLHNCQUFPLElBQUksRUFBQTtpQkFDZDs7b0JBQU0sc0JBQU8sSUFBSSxFQUFBOzs7YUFDckIsQ0FBQTtRQUVELHdDQUF3QztRQUN4QyxlQUFTLEdBQUcsVUFBTyxLQUFTLEVBQUUsVUFBMkM7OztnQkFDckUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsWUFBWSxRQUFRLEVBQUM7b0JBQ3ZDLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyw2Q0FBNkM7b0JBQTlDLENBQUE7b0JBQ3ZDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7aUJBQzFCOzs7YUFDSixDQUFBOztJQW5CRCxDQUFDO0lBTEQsc0JBQUksd0JBQUMsTUFBTSxDQUFDLFdBQVk7YUFBeEIsY0FBNkIsT0FBTyxjQUFjLENBQUEsQ0FBQyxDQUFDOzs7T0FBQTtJQTBCeEQsbUJBQUM7QUFBRCxDQUFDLEFBNUJELENBQTBDLElBQUksR0E0QjdDIn0=