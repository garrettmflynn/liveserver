// import { HardwarePipe } from "./pipes/Hardware.pipe";
// import { ServerPipe } from "./pipes/Server.pipe";
import { __awaiter, __generator } from "tslib";
import { randomUUID } from "../../common/id";
import worker, * as workerutils from './pipeline.worker'; // must export self
import { DataStreamTrackProcessor } from "./DataStreamTrackProcessor";
import { DataStreamTrackGenerator } from "./DataStreamTrackGenerator";
import { DataStreamTrack } from './DataStreamTrack';
var DataPipeline = /** @class */ (function () {
    function DataPipeline(_a) {
        var _this = this;
        var _b = _a === void 0 ? { thread: true } : _a, thread = _b.thread;
        this.id = randomUUID();
        this.pipeline = [];
        this.bound = [];
        this.source = null;
        this.sink = null;
        this.kind = '';
        this.thread = true;
        this.setSource = function (track) {
            var processor;
            if (track instanceof MediaStreamTrack && (track.kind === 'video' || track.kind === 'audio ')) {
                if ('MediaStreamTrackProcessor' in window)
                    processor = new MediaStreamTrackProcessor({ track: track });
                else
                    alert('Your browser does not support the experimental MediaStreamTrack API for Insertable Streams of Media');
            }
            else if (track instanceof DataStreamTrack)
                processor = new DataStreamTrackProcessor({ track: track });
            _this.kind = track.kind; // Guess the kind of stream (and sink...)
            if (processor) {
                _this.source = processor.readable;
                if (_this.thread && _this.worker)
                    _this.worker.postMessage({ cmd: 'source', data: _this.source }, [_this.source]); // TODO: TypeScript issue working with ReadableStreams
                else
                    workerutils.addSource(_this.source, _this.bound);
            }
        };
        this.setSink = function (kind) {
            if (kind === void 0) { kind = _this.kind; }
            if (kind === 'video' || kind === 'audio') {
                if ('MediaStreamTrackGenerator' in window)
                    _this.output = new MediaStreamTrackGenerator({ kind: kind });
                else
                    alert('Your browser does not support the experimental MediaStreamTrack API for Insertable Streams of Media');
            }
            else
                _this.output = new DataStreamTrackGenerator();
            if (_this.output) {
                _this.sink = _this.output.writable;
                if (_this.thread && _this.worker)
                    _this.worker.postMessage({ cmd: 'sink', data: _this.sink }, [_this.sink]); // TODO: TypeScript issue working with WritableStreams
                else
                    workerutils.addSink(_this.sink, _this.bound);
            }
        };
        // TODO: Specify formats acceptable for pipeline creation
        this.add = function (settings) {
            var transformer;
            // Passed TransformStream
            if (settings instanceof TransformStream)
                transformer = settings;
            // Create a new TransformStream
            else {
                var transform 
                // Basic Function Transformation
                = void 0;
                // Basic Function Transformation
                if (settings instanceof Function)
                    transform = { transform: function (chunk, controller) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, controller.enqueue(settings(chunk))];
                        }); }); } };
                // Default Pipe Methods
                else {
                    // switch (settings.method) {
                    //     case 'offload':
                    //         transform = new ServerPipe(settings)
                    //         break;
                    //     case 'embed':
                    //         transform = new HardwarePipe(settings)
                    //         break;
                    //     default:
                    transform = { transform: function (chunk, controller) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, controller.enqueue(settings.function(chunk))];
                        }); }); } };
                    // break;
                    // }
                }
                transformer = new TransformStream(transform);
            }
            _this.pipeline.push(transformer);
            if (_this.thread && _this.worker) {
                _this.pipeline.push(transformer);
                _this.worker.postMessage({ cmd: 'add', data: transformer }, [transformer]);
            }
            else
                workerutils.addTransform(transformer, _this.pipeline, _this.bound);
        };
        // Set Worker
        this.thread = thread; // NOTE: Complicated transforms may not be able to transferred——and thus interrupt a threaded stream...
        if (this.thread) {
            // Set Worker
            try {
                this.worker = new Worker("./src/pipeline.worker", { name: 'pipelineworker', type: 'module' });
            }
            catch (_c) {
                try {
                    this.worker = worker; // TODO: TypeScript issue working with workers
                }
                catch (err) {
                    console.log("Error creating worker. ERROR:", err);
                }
            }
        }
    }
    return DataPipeline;
}());
export { DataPipeline };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVBpcGVsaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vY29yZS9EYXRhUGlwZWxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0RBQXdEO0FBQ3hELG9EQUFvRDs7QUFFcEQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGlCQUFpQixDQUFBO0FBRTFDLE9BQU8sTUFBTSxFQUFFLEtBQUssV0FBVyxNQUFNLG1CQUFtQixDQUFBLENBQUMsbUJBQW1CO0FBRTVFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ3JFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ3JFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQU1uRDtJQWVJLHNCQUFZLEVBQXlCO1FBQXJDLGlCQWtCQztZQWxCVyxxQkFBVyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsS0FBQSxFQUF4QixNQUFNLFlBQUE7UUFibkIsT0FBRSxHQUFXLFVBQVUsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBaUIsRUFBRSxDQUFBO1FBQzNCLFVBQUssR0FBYyxFQUFFLENBQUE7UUFDckIsV0FBTSxHQUFnQyxJQUFJLENBQUE7UUFDMUMsU0FBSSxHQUFnQyxJQUFJLENBQUE7UUFFeEMsU0FBSSxHQUFXLEVBQUUsQ0FBQTtRQUdqQixXQUFNLEdBQVksSUFBSSxDQUFBO1FBd0J0QixjQUFTLEdBQUcsVUFBQyxLQUF5QztZQUVsRCxJQUFJLFNBQVMsQ0FBQTtZQUNiLElBQUksS0FBSyxZQUFZLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsRUFBRTtnQkFDMUYsSUFBSSwyQkFBMkIsSUFBSSxNQUFNO29CQUFFLFNBQVMsR0FBRyxJQUFJLHlCQUF5QixDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQVks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