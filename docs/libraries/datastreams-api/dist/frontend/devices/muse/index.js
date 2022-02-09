import { __awaiter, __generator } from "tslib";
// Derived from https://github.com/urish/muse-js
// Garrett Flynn, November 13 2021
import * as musejs from 'muse-js';
// Pre-Declared Device Class
export var device = musejs.MuseClient;
// After Device Connect
export var onconnect = function (dataDevice) { return __awaiter(void 0, void 0, void 0, function () {
    var device;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(dataDevice);
                device = dataDevice.device;
                return [4 /*yield*/, device.start()];
            case 1:
                _a.sent();
                device.eegReadings.subscribe(function (o) {
                    var latest = [, , ,];
                    latest[o.electrode] = o.samples;
                    dataDevice.ondata(latest);
                });
                return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9kZXZpY2VzL211c2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDtBQUNoRCxrQ0FBa0M7QUFDbEMsT0FBTyxLQUFLLE1BQU0sTUFBTSxTQUFTLENBQUM7QUFHbEMsNEJBQTRCO0FBQzVCLE1BQU0sQ0FBQyxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFBO0FBRXZDLHVCQUF1QjtBQUN2QixNQUFNLENBQUMsSUFBTSxTQUFTLEdBQUcsVUFBTyxVQUFxQzs7Ozs7Z0JBRWpFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7Z0JBQ25CLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFBO2dCQUM5QixxQkFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUE7O2dCQUFwQixTQUFvQixDQUFBO2dCQUVwQixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFBLENBQUM7b0JBQzFCLElBQUksTUFBTSxHQUFVLENBQUMsRUFBQyxFQUFDLEVBQUUsQ0FBQTtvQkFDekIsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFBO29CQUMvQixVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUM3QixDQUFDLENBQUMsQ0FBQTs7OztLQUNMLENBQUEifQ==