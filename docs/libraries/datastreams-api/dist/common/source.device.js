import { __awaiter, __generator } from "tslib";
var looping = false;
// Generic 
export var label = 'Dummy Source';
export var kind = 'datainput';
export var ondata = function (decoded) {
    var channelData = decoded.split(',').map(function (str) { return Number.parseFloat(str); }); // Organize Decoder Output into a Float Array
    return channelData; // Pass Array to DataTracks
};
export var onconnect = function (device) { return __awaiter(void 0, void 0, void 0, function () {
    var freqs, animate;
    return __generator(this, function (_a) {
        freqs = [1, 5, 10];
        looping = true;
        animate = function () {
            if (looping) {
                var channels_1 = [];
                freqs.forEach(function (f) {
                    channels_1.push(Math.sin((2 * f * Math.PI) * Date.now() / 1000));
                });
                var encoded = channels_1.join(','); // simulate encoding
                device.ondata(encoded);
                setTimeout(animate, 1000 / 60);
            }
        };
        animate();
        return [2 /*return*/, true];
    });
}); };
export var ondisconnect = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, looping = false];
}); }); };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlLmRldmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2NvbW1vbi9zb3VyY2UuZGV2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFFQSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUE7QUFFbkIsV0FBVztBQUVYLE1BQU0sQ0FBQyxJQUFNLEtBQUssR0FBRyxjQUFjLENBQUE7QUFDbkMsTUFBTSxDQUFDLElBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQTtBQUUvQixNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBQyxPQUFjO0lBQ2pDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBdEIsQ0FBc0IsQ0FBQyxDQUFBLENBQUMsNkNBQTZDO0lBQ3JILE9BQU8sV0FBVyxDQUFBLENBQUMsMkJBQTJCO0FBQ2xELENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxJQUFNLFNBQVMsR0FBRyxVQUFPLE1BQW1COzs7UUFHM0MsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQTtRQUNwQixPQUFPLEdBQUcsSUFBSSxDQUFBO1FBQ1YsT0FBTyxHQUFHO1lBRVYsSUFBSSxPQUFPLEVBQUM7Z0JBQ1IsSUFBSSxVQUFRLEdBQVksRUFBRSxDQUFBO2dCQUMxQixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztvQkFDWCxVQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQTtnQkFDbEUsQ0FBQyxDQUFDLENBQUE7Z0JBQ0YsSUFBSSxPQUFPLEdBQUcsVUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFDLG9CQUFvQjtnQkFDckQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFFdEIsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEdBQUMsRUFBRSxDQUFDLENBQUE7YUFDL0I7UUFFTCxDQUFDLENBQUE7UUFFRCxPQUFPLEVBQUUsQ0FBQTtRQUNULHNCQUFPLElBQUksRUFBQTs7S0FDZCxDQUFBO0FBRUQsTUFBTSxDQUFDLElBQU0sWUFBWSxHQUFHO0lBQVksc0JBQUEsT0FBTyxHQUFHLEtBQUssRUFBQTtTQUFBLENBQUEifQ==