import { __extends } from "tslib";
import { DataStreamTrack } from "./DataStreamTrack";
import { randomUUID } from '../../common/id';
// Data Channels Behave Just Like Tracks
var DataChannel = /** @class */ (function (_super) {
    __extends(DataChannel, _super);
    function DataChannel(parent) {
        var _a, _b;
        var _this = _super.call(this) || this;
        _this.id = '';
        _this.label = '';
        _this.send = function (data) { return _this.parent.send(data); };
        _this.sendMessage = function (_) { };
        _this.id = (_b = (_a = parent.id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : randomUUID();
        _this.label = parent.label;
        _this.parent = parent;
        return _this;
    }
    return DataChannel;
}(DataStreamTrack));
export { DataChannel };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YUNoYW5uZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFDaGFubmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRTVDLHdDQUF3QztBQUN4QztJQUFpQywrQkFBZTtJQU01QyxxQkFBWSxNQUFzQjs7UUFBbEMsWUFDSSxpQkFBTyxTQUlWO1FBVEQsUUFBRSxHQUFXLEVBQUUsQ0FBQTtRQUNmLFdBQUssR0FBVyxFQUFFLENBQUE7UUFXbEIsVUFBSSxHQUFHLFVBQUMsSUFBUSxJQUFVLE9BQUEsS0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQXRCLENBQXNCLENBQUE7UUFDaEQsaUJBQVcsR0FBRyxVQUFDLENBQUssSUFBVSxDQUFDLENBQUE7UUFQM0IsS0FBSSxDQUFDLEVBQUUsR0FBRyxNQUFBLE1BQUEsTUFBTSxDQUFDLEVBQUUsMENBQUUsUUFBUSxFQUFFLG1DQUFJLFVBQVUsRUFBRSxDQUFBO1FBQy9DLEtBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUN6QixLQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTs7SUFDeEIsQ0FBQztJQUtMLGtCQUFDO0FBQUQsQ0FBQyxBQWhCRCxDQUFpQyxlQUFlLEdBZ0IvQyJ9