/**
 * The Transform class allows you to specify arbitrary transforms in the ontransform callback.
 * ```typescript
 * import { transforms } from "datastreams-api";
 *
 * const transform = new transforms.Transform();
 * transform.addEventListener('transform', (chunk, controller) => {
 *      let data = chunk.copy()
 *      chunk.close()
 *      controller.enqueue(chunk)
 * })
 * ```
 */
import { __awaiter, __extends, __generator } from "tslib";
var Transform = /** @class */ (function (_super) {
    __extends(Transform, _super);
    function Transform() {
        var _this = _super.call(this) || this;
        _this.onstart = function (e) { return console.log('Transform started', e); };
        _this.ontransform = function (e) { return console.log('Transforming', e); };
        _this.onend = function (e) { return console.log('Transform ended', e); };
        _this.addEventListener('start', function (e) { return _this.onstart(e); });
        _this.addEventListener('transform', (function (e) { return _this.ontransform(e); }));
        _this.addEventListener('end', function (e) { return _this.onend(e); });
        return _this;
    }
    Transform.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.dispatchEvent(new Event('start'));
                return [2 /*return*/];
            });
        });
    };
    Transform.prototype.transform = function (chunk, controller) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.dispatchEvent(new CustomEvent('transfrom', { detail: { chunk: chunk, controller: controller } }));
                return [2 /*return*/];
            });
        });
    };
    Transform.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.dispatchEvent(new Event('end'));
                return [2 /*return*/];
            });
        });
    };
    return Transform;
}(EventTarget));
export { Transform };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdHJhbnNmb3Jtcy9UcmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7Ozs7Ozs7OztHQVlHOztBQUVIO0lBQStCLDZCQUFXO0lBRXRDO1FBQUEsWUFDSSxpQkFBTyxTQUtWO1FBY0QsYUFBTyxHQUFHLFVBQUMsQ0FBTyxJQUFTLE9BQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsRUFBbkMsQ0FBbUMsQ0FBQTtRQUM5RCxpQkFBVyxHQUFHLFVBQUMsQ0FBYSxJQUFTLE9BQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQTlCLENBQThCLENBQUE7UUFDbkUsV0FBSyxHQUFHLFVBQUMsQ0FBTyxJQUFTLE9BQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBakMsQ0FBaUMsQ0FBQTtRQXBCdEQsS0FBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFDLENBQU8sSUFBSyxPQUFBLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQWYsQ0FBZSxDQUFDLENBQUE7UUFDNUQsS0FBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQUMsQ0FBYSxJQUFLLE9BQUEsS0FBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBbkIsQ0FBbUIsQ0FBa0IsQ0FBQyxDQUFBO1FBQzdGLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsVUFBQyxDQUFPLElBQUssT0FBQSxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFiLENBQWEsQ0FBQyxDQUFBOztJQUU1RCxDQUFDO0lBRUsseUJBQUssR0FBWDs7O2dCQUNJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTs7OztLQUN6QztJQUVLLDZCQUFTLEdBQWYsVUFBZ0IsS0FBUyxFQUFFLFVBQTJDOzs7Z0JBQ2xFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUMsTUFBTSxFQUFFLEVBQUMsS0FBSyxPQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTs7OztLQUNsRjtJQUVLLHVCQUFHLEdBQVQ7OztnQkFDSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Ozs7S0FDdkM7SUFLSCxnQkFBQztBQUFELENBQUMsQUF6QkgsQ0FBK0IsV0FBVyxHQXlCdkMifQ==