import * as parseutils from "../../common/parse.utils";
import { randomUUID } from '../../common/id';
var Websocket = /** @class */ (function () {
    function Websocket(url, protocols) {
        var _this = this;
        if (url === void 0) { url = 'http://localhost'; }
        this.sendBuffer = [];
        this.callbacks = new Map();
        this.ready = false;
        this._onopen = function () {
            _this.ready = true;
            _this.sendBuffer.forEach(function (msg) {
                if (_this.ws)
                    _this.ws.send(msg);
            });
            _this.onopen();
        };
        this._onclose = function () {
            _this.ready = false;
            _this.onclose();
        };
        this._onerror = function (e) {
            console.error(e);
            _this.onerror(e);
            return e;
        };
        this._onmessage = function (res) {
            try {
                var parsed = parseutils.safeParse(res.data);
                if (parsed.error)
                    console.error(parsed.error);
                else {
                    var callbackId = parsed.callbackId;
                    var data = parsed;
                    // Run Callback
                    if (callbackId) {
                        data = data.data;
                        var callback = _this.callbacks.get(callbackId);
                        if (callback)
                            callback(data);
                    }
                    // Parse Stripped Data Message
                    if (data)
                        _this.onmessage(data);
                }
            }
            catch (e) {
                console.error('Error parsing WebSocket message from server: ', res.data, e);
            }
        };
        this.onopen = function () { };
        this.onclose = function () { };
        this.onerror = function () { };
        this.onmessage = function () { };
        this.addEventListener = function (name, callback) {
            if (_this.ws) {
                if (name === 'message')
                    _this.ws.addEventListener(name, function (res) { callback(JSON.parse(res.data)); }); // parse messages
                else
                    _this.ws.addEventListener(name, callback); // otherwise pass raw response
            }
        };
        this.close = function () {
            if (_this.ws)
                _this.ws.close();
        };
        this.send = function (data, service) {
            if (service === void 0) { service = 'websocket'; }
            return new Promise(function (resolve) {
                // Allow Awaiting WebSocket Calls
                var callbackId = randomUUID();
                var callback = function (data) {
                    resolve(data);
                    _this.callbacks.delete(callbackId);
                };
                _this.callbacks.set(callbackId, callback);
                // Create Message with Proper Stringification
                var o = { data: data, callbackId: callbackId, service: service };
                var msg = parseutils.safeStringify(o);
                if (_this.ready && _this.ws) {
                    // Actually Send
                    _this.ws.send(msg);
                }
                else
                    _this.sendBuffer.push(msg);
            });
        };
        this.url = url;
        var urlObj = new URL(url);
        var toPass = [];
        Object.keys(protocols).forEach(function (str) {
            toPass.push("".concat(str, ".brainsatplay.com%").concat(protocols[str]));
        });
        console.log(toPass);
        if (urlObj.protocol === 'http:')
            this.ws = new WebSocket("ws://" + urlObj.host, toPass.join(';'));
        else if (urlObj.protocol === 'https:')
            this.ws = new WebSocket("wss://" + urlObj.host, toPass.join(';'));
        else {
            console.log('invalid protocol');
            return;
        }
        this.sendBuffer = [];
        this.callbacks = new Map();
        this.ws.onopen = this._onopen;
        this.ws.onerror = this._onerror;
        this.ws.onmessage = this._onmessage;
        this.ws.onclose = this._onclose;
        globalThis.onunload = globalThis.onbeforeunload = function () {
            if (_this.ws)
                _this.ws.onclose = function () { };
            console.log('C:OSING');
            _this.close();
        };
    }
    return Websocket;
}());
export { Websocket };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViU29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdXRpbHMvV2ViU29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxVQUFVLE1BQU0sMEJBQTBCLENBQUM7QUFDdkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRzVDO0lBUUksbUJBQVksR0FBc0IsRUFBRSxTQUluQztRQUpELGlCQWlDQztRQWpDVyxvQkFBQSxFQUFBLHdCQUFzQjtRQUxsQyxlQUFVLEdBQVUsRUFBRSxDQUFDO1FBQ3ZCLGNBQVMsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN4RCxVQUFLLEdBQVksS0FBSyxDQUFDO1FBc0N2QixZQUFPLEdBQUc7WUFDTixLQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUNqQixLQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7Z0JBQ3ZCLElBQUksS0FBSSxDQUFDLEVBQUU7b0JBQUUsS0FBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDbEMsQ0FBQyxDQUFDLENBQUE7WUFFRixLQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDakIsQ0FBQyxDQUFBO1FBRUQsYUFBUSxHQUFHO1lBQ1AsS0FBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7WUFDbEIsS0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2xCLENBQUMsQ0FBQTtRQUVELGFBQVEsR0FBRyxVQUFDLENBQU87WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2hCLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDZixPQUFPLENBQUMsQ0FBQTtRQUNaLENBQUMsQ0FBQTtRQUVELGVBQVUsR0FBRyxVQUFDLEdBQWU7WUFHekIsSUFBSTtnQkFDQSxJQUFJLE1BQU0sR0FBRyxVQUFVLENB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