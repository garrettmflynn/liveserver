/**
 *
 * Create a ReadableStream of sensor data modeled after the Insertable Streams API
 *
 */
var DataStreamTrackProcessor = /** @class */ (function () {
    function DataStreamTrackProcessor(o) {
        var _this = this;
        // --------------------------- Readable Stream Functions ---------------------------
        this.start = function (controller) {
            // Start Placing Track Data into the ReadableStream
            if (_this.track) {
                _this.track.data.forEach(function (val) { return controller.enqueue(val); });
                _this.subid = _this.track.subscribe(function (val) { return controller.enqueue(val); });
            }
        };
        this.pull = function () { };
        this.cancel = function () {
            if (_this.track && _this.subid)
                _this.track.unsubscribe(_this.subid);
        };
        this.track = o.track;
        this.readable = new ReadableStream({
            start: this.start,
            pull: this.pull,
            cancel: this.cancel,
            // type,
            // autoAllocateChunkSize
        }, {
        // highWaterMark,
        // size()
        });
    }
    return DataStreamTrackProcessor;
}());
export { DataStreamTrackProcessor };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVN0cmVhbVRyYWNrUHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vY29yZS9EYXRhU3RyZWFtVHJhY2tQcm9jZXNzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7Ozs7R0FJRztBQUVIO0lBTUksa0NBQVksQ0FBMEI7UUFBdEMsaUJBY0M7UUFHTCxvRkFBb0Y7UUFDaEYsVUFBSyxHQUFHLFVBQUMsVUFBd0M7WUFFN0MsbURBQW1EO1lBQ25ELElBQUksS0FBSSxDQUFDLEtBQUssRUFBQztnQkFFWCxLQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQyxHQUFPLElBQUssT0FBQSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUE7Z0JBQzdELEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBQyxHQUFPLElBQUssT0FBQSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUE7YUFDMUU7UUFDTCxDQUFDLENBQUE7UUFFRCxTQUFJLEdBQUcsY0FBTyxDQUFDLENBQUE7UUFFZixXQUFNLEdBQUc7WUFDTCxJQUFJLEtBQUksQ0FBQyxLQUFLLElBQUksS0FBSSxDQUFDLEtBQUs7Z0JBQUUsS0FBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3BFLENBQUMsQ0FBQTtRQTlCRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7UUFFcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FBQztZQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLFFBQVE7WUFDUix3QkFBd0I7U0FDM0IsRUFBRTtRQUNDLGlCQUFpQjtRQUNqQixTQUFTO1NBQ1osQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQW1CTCwrQkFBQztBQUFELENBQUMsQUF2Q0QsSUF1Q0MifQ==