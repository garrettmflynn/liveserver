import { __extends } from "tslib";
import { DataTrackConstraints } from './DataTrackConstraints';
var DataTrackSettings = /** @class */ (function (_super) {
    __extends(DataTrackSettings, _super);
    function DataTrackSettings(track) {
        var _this = _super.call(this, track) || this;
        var constraints = track.getConstraints();
        // All Media Tracks
        _this.deviceId = constraints.deviceId;
        _this.groupId = constraints.groupId;
        // Audio Tracks
        _this.autoGainControl = constraints.autoGainControl;
        _this.channelCount = constraints.channelCount;
        _this.echoCancellation = constraints.echoCancellation;
        _this.latency = constraints.latency;
        _this.noiseSuppression = constraints.noiseSuppression;
        _this.sampleRate = constraints.sampleRate;
        _this.sampleSize = constraints.sampleSize;
        _this.volume = constraints.volume;
        // Video Tracks
        _this.aspectRatio = constraints.aspectRatio;
        _this.facingMode = constraints.facingMode;
        _this.frameRate = constraints.frameRate;
        _this.height = constraints.height;
        _this.width = constraints.width;
        _this.resizeMode = constraints.resizeMode;
        // Shared Screen Tracks
        _this.cursor = constraints.cursor;
        _this.displaySurface = constraints.displaySurface;
        _this.logicalSurface = constraints.logicalSurface;
        return _this;
    }
    return DataTrackSettings;
}(DataTrackConstraints));
export { DataTrackSettings };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVRyYWNrU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFUcmFja1NldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQUc3RDtJQUF1QyxxQ0FBb0I7SUFFdkQsMkJBQVksS0FBc0I7UUFBbEMsWUFFSSxrQkFBTSxLQUFLLENBQUMsU0E2QmY7UUE1QkcsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBRXhDLG1CQUFtQjtRQUNuQixLQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUE7UUFDcEMsS0FBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFBO1FBRWxDLGVBQWU7UUFDZixLQUFJLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUE7UUFDbEQsS0FBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFBO1FBQzVDLEtBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUE7UUFDcEQsS0FBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFBO1FBQ2xDLEtBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUE7UUFDcEQsS0FBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFBO1FBQ3hDLEtBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQTtRQUN4QyxLQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUE7UUFFaEMsZUFBZTtRQUNmLEtBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQTtRQUMxQyxLQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUE7UUFDeEMsS0FBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFBO1FBQ3RDLEtBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQTtRQUNoQyxLQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUE7UUFDOUIsS0FBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFBO1FBRXhDLHVCQUF1QjtRQUN2QixLQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUE7UUFDaEMsS0FBSSxDQUFDLGNBQWMsR0FBSSxXQUFXLENBQUMsY0FBYyxDQUFBO1FBQ2pELEtBQUksQ0FBQyxjQUFjLEdBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQTs7SUFDckQsQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0FBQyxBQWxDRCxDQUF1QyxvQkFBb0IsR0FrQzFEIn0=