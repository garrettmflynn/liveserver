import { __awaiter, __generator } from "tslib";
// Ensure Proper Pipeline Format
var pipeline = [];
// Bind Pipeline
var bound = [];
// --------------------------- Pipeline Functions ---------------------------
export var addSource = function (source, bound) { return bound.push(source); }; // Push source at the beginning
export var addSink = function (sink, bound) { return bound[bound.length - 1].pipeTo(sink); };
export var addTransform = function (o, pipeline, bound // Includes the readable side of a TransformStream 
) {
    pipeline.push(o);
    bound.push(bound[bound.length - 1].pipeThrough(o));
};
// --------------------------- Pipeline Construction ---------------------------
self.onmessage = function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (e.data.cmd === 'init')
            e.data.data.source.pipeThrough(e.data.data.transformer).pipeTo(e.data.data.sink);
        if (e.data.cmd === 'add')
            addTransform(e.data.data, pipeline, bound);
        if (e.data.cmd === 'source')
            addSource(e.data.data, bound);
        if (e.data.cmd === 'sink')
            addSink(e.data.data, bound);
        return [2 /*return*/];
    });
}); };
export default self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUud29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vY29yZS9waXBlbGluZS53b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUlBLGdDQUFnQztBQUNoQyxJQUFJLFFBQVEsR0FBZ0IsRUFBRSxDQUFBO0FBRTlCLGdCQUFnQjtBQUNoQixJQUFJLEtBQUssR0FBYSxFQUFFLENBQUE7QUFFeEIsNkVBQTZFO0FBQzdFLE1BQU0sQ0FBQyxJQUFJLFNBQVMsR0FBRyxVQUFDLE1BQXFCLEVBQUUsS0FBZSxJQUFLLE9BQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQSxDQUFDLCtCQUErQjtBQUNySCxNQUFNLENBQUMsSUFBSSxPQUFPLEdBQUcsVUFBQyxJQUFvQixFQUFFLEtBQWdCLElBQUssT0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQXBDLENBQW9DLENBQUE7QUFFckcsTUFBTSxDQUFDLElBQUksWUFBWSxHQUFHLFVBQ3RCLENBQWtCLEVBQ2xCLFFBQXNCLEVBQ3RCLEtBQWdCLENBQUMsbURBQW1EOztJQUVoRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2hCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDdEQsQ0FBQyxDQUFBO0FBR0wsZ0ZBQWdGO0FBRWhGLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBTyxDQUFtQjs7UUFDdkMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNO1lBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDM0csSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxLQUFLO1lBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNwRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLFFBQVE7WUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDMUQsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNO1lBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBOzs7S0FDekQsQ0FBQTtBQUVELGVBQWUsSUFBSSxDQUFBIn0=