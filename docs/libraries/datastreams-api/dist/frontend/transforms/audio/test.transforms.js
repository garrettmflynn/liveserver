import { __awaiter, __generator } from "tslib";
var AudioTest = /** @class */ (function () {
    function AudioTest() {
    }
    AudioTest.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    AudioTest.prototype.transform = function (audioData, controller) {
        return __awaiter(this, void 0, void 0, function () {
            var speechData;
            return __generator(this, function (_a) {
                speechData = audioData.copy() //model.getSpeechData(audioData);
                ;
                audioData.close();
                controller.enqueue(speechData);
                return [2 /*return*/];
            });
        });
    };
    AudioTest.prototype.deinit = function () { };
    return AudioTest;
}());
export { AudioTest };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC50cmFuc2Zvcm1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdHJhbnNmb3Jtcy9hdWRpby90ZXN0LnRyYW5zZm9ybXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBO0lBQ0U7SUFFQSxDQUFDO0lBRUssd0JBQUksR0FBVjs7Ozs7O0tBRUM7SUFFSyw2QkFBUyxHQUFmLFVBQWdCLFNBQWEsRUFBRSxVQUEyQzs7OztnQkFDbEUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQ0FBaUM7Z0JBQWxDLENBQUE7Z0JBQ25DLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbEIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7OztLQUNoQztJQUVELDBCQUFNLEdBQU4sY0FBVSxDQUFDO0lBQ2IsZ0JBQUM7QUFBRCxDQUFDLEFBaEJELElBZ0JDIn0=