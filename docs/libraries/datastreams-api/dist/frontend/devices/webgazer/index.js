import { __awaiter, __generator } from "tslib";
export var onconnect = function (dataDevice) { return __awaiter(void 0, void 0, void 0, function () {
    var device;
    return __generator(this, function (_a) {
        device = dataDevice.device;
        console.log(device);
        device.subscribe(function (data) {
            var o = {
                // times: [],
                x: [],
                y: []
            };
            // o.times.push(Date.now());
            o.x.push(data.x);
            o.y.push(data.y);
            dataDevice.ondata(o);
        });
        return [2 /*return*/];
    });
}); };
var Webgazer = /** @class */ (function () {
    function Webgazer() {
        var _this = this;
        this.device = null;
        this.callbacks = [];
        this.handleScriptLoad = function (onload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Set Webgazer Settings
                this.startWebgazer(webgazer);
                webgazer.showVideo(true);
                webgazer.showFaceOverlay(true);
                webgazer.showFaceFeedbackBox(true);
                webgazer.showPredictionPoints(true);
                webgazer.setRegression('weightedRidge');
                this.checkWebGazerLoaded(onload);
                return [2 /*return*/];
            });
        }); };
        this.checkWebGazerLoaded = function (onload) {
            var interval = setInterval(function () {
                if (webgazer.isReady()) {
                    clearInterval(interval);
                    _this.device = webgazer;
                    onload();
                }
                else {
                    console.log('webgazer not loaded ____');
                }
            }, 1000);
        };
        this.connect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, _) { return __awaiter(_this, void 0, void 0, function () {
                        var onload, script;
                        var _this = this;
                        return __generator(this, function (_a) {
                            onload = function () {
                                var video = document.getElementById('webgazerVideoContainer');
                                if (video) {
                                    video.style.position = 'absolute';
                                    video.style.top = '0';
                                    video.style.left = 'auto';
                                    video.style.right = '100px';
                                    video.style.zIndex = '1000';
                                    video.style.width = '200px';
                                    video.style.height = '200px';
                                }
                                resolve(true);
                            };
                            script = document.createElement("script");
                            script.src = "https://webgazer.cs.brown.edu/webgazer.js";
                            script.async = true;
                            script.onload = function () {
                                _this.handleScriptLoad(onload);
                            };
                            document.body.appendChild(script);
                            return [2 /*return*/];
                        });
                    }); })];
            });
        }); };
        this.disconnect = function () {
            if (_this.device)
                _this.device.end();
        };
        this.subscribe = function (f) {
            if (f instanceof Function)
                _this.callbacks.push(f);
        };
    }
    Webgazer.prototype.startWebgazer = function (webgazer) {
        var _this = this;
        webgazer.setGazeListener(function (data, _) {
            if (data == null)
                return;
            _this.callbacks.forEach(function (f) {
                f(data);
            });
        }).begin();
    };
    return Webgazer;
}());
export { Webgazer };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9kZXZpY2VzL3dlYmdhemVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFJQSxNQUFNLENBQUMsSUFBTSxTQUFTLEdBQUcsVUFBTyxVQUE0Qjs7O1FBRXBELE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFBO1FBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDbkIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFDLElBSWpCO1lBR08sSUFBSSxDQUFDLEdBSUQ7Z0JBQ0EsYUFBYTtnQkFDYixDQUFDLEVBQUUsRUFBRTtnQkFDTCxDQUFDLEVBQUUsRUFBRTthQUNSLENBQUE7WUFFRCw0QkFBNEI7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyQixVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3hCLENBQUMsQ0FBQyxDQUFBOzs7S0FDTCxDQUFBO0FBRUQ7SUFPSTtRQUFBLGlCQUVDO1FBUEQsV0FBTSxHQUFlLElBQUksQ0FBQztRQUUxQixjQUFTLEdBQWUsRUFBRSxDQUFBO1FBTzFCLHFCQUFnQixHQUFFLFVBQU0sTUFBZTs7Z0JBRW5DLHdCQUF3QjtnQkFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtnQkFDNUIsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDeEIsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDOUIsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUNsQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUE7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