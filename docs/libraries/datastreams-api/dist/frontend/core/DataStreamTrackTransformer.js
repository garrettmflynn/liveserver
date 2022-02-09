/**
 *
 * Create a TransformStream for sensor data | modeled after the Insertable Streams API
 *
 */
var DataStreamTrackTransform = /** @class */ (function () {
    function DataStreamTrackTransform(dict) {
        this.transform = new TransformStream({
            start: start,
            flush: flush,
            transform: dict.transform
        });
    }
    return DataStreamTrackTransform;
}());
export { DataStreamTrackTransform };
// --------------------------- Transform Stream Functions ---------------------------
//beginning generation of data or otherwise getting access to the source
function start() { }
function flush() { }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVN0cmVhbVRyYWNrVHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFTdHJlYW1UcmFja1RyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFFSDtJQUlJLGtDQUFZLElBQTJGO1FBRW5HLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxlQUFlLENBQUM7WUFDakMsS0FBSyxPQUFBO1lBQ0wsS0FBSyxPQUFBO1lBQ0wsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzVCLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFDTCwrQkFBQztBQUFELENBQUMsQUFaRCxJQVlDOztBQUlELHFGQUFxRjtBQUVyRix3RUFBd0U7QUFDeEUsU0FBUyxLQUFLLEtBQUksQ0FBQztBQUVuQixTQUFTLEtBQUssS0FBSSxDQUFDIn0=