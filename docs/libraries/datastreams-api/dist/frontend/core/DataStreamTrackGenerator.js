/**
 *
 * Create a WritableStream of sensor data modeled after the Insertable Streams API
 *
 */
import { __extends } from "tslib";
import { DataStreamTrack } from "./DataStreamTrack";
var DataStreamTrackGenerator = /** @class */ (function (_super) {
    __extends(DataStreamTrackGenerator, _super);
    function DataStreamTrackGenerator() {
        var _this = _super.call(this) || this;
        // --------------------------- Writable Stream Methods ---------------------------
        // sets up the stream functionality, e.g. getting access to the underlying sink
        _this.start = function () { };
        //  called repeatedly every time a new chunk is ready to be written to the underlying sink
        _this.write = function (chunk) { return _this.addData(chunk); };
        //  finalize writes to the underlying sink, and release access to it.
        _this.close = function () { return console.log("All data successfully read!"); };
        // will be called if the app signals that it wishes to abruptly close the stream and put it in an errored state
        _this.abort = function (reason) { return console.error("Something went wrong!", reason); };
        _this.writable = new WritableStream({
            start: _this.start,
            write: _this.write,
            close: _this.close,
            abort: _this.abort
        });
        return _this;
    }
    return DataStreamTrackGenerator;
}(DataStreamTrack));
export { DataStreamTrackGenerator };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVN0cmVhbVRyYWNrR2VuZXJhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vY29yZS9EYXRhU3RyZWFtVHJhY2tHZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRzs7QUFFSCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7SUFBOEMsNENBQWU7SUFJekQ7UUFBQSxZQUNJLGlCQUFPLFNBU1Y7UUFFRCxrRkFBa0Y7UUFFbEYsK0VBQStFO1FBQzlFLFdBQUssR0FBRyxjQUFPLENBQUMsQ0FBQTtRQUVqQiwwRkFBMEY7UUFDekYsV0FBSyxHQUFHLFVBQUMsS0FBUyxJQUFLLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQTtRQUUzQyxxRUFBcUU7UUFDckUsV0FBSyxHQUFHLGNBQU0sT0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLEVBQTFDLENBQTBDLENBQUM7UUFFekQsK0dBQStHO1FBQy9HLFdBQUssR0FBRyxVQUFDLE1BQVUsSUFBSyxPQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLEVBQTlDLENBQThDLENBQUM7UUFyQm5FLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQUM7WUFDL0IsS0FBSyxFQUFFLEtBQUksQ0FBQyxLQUFLO1lBQ2pCLEtBQUssRUFBRSxLQUFJLENBQUMsS0FBSztZQUNqQixLQUFLLEVBQUUsS0FBSSxDQUFDLEtBQUs7WUFDakIsS0FBSyxFQUFFLEtBQUksQ0FBQyxLQUFLO1NBQ3BCLENBQUMsQ0FBQTs7SUFFTixDQUFDO0lBZ0JMLCtCQUFDO0FBQUQsQ0FBQyxBQTlCRCxDQUE4QyxlQUFlLEdBOEI1RCJ9