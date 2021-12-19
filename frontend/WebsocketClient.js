//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License

export class WebsocketClient {
    constructor(url, auth) {

        console.log(auth);

        if (!(url instanceof URL)) url = new URL(url)

        let encodeForSubprotocol = (info) => {
            return info.replace(' ', '%20')
        }

        let subprotocol = [];
        
        if(auth._id) subprotocol.push('id&' + encodeForSubprotocol(auth._id));
        else if (auth._id) subprotocol.push('id&' + encodeForSubprotocol(auth._id));

        this.connected = false;
        this.sendQueue = [];

        if (url.protocol === 'http:') {
            this.socket = new WebSocket(
                'ws://' + url.hostname, // We're always using :80
                subprotocol);
        } else if (url.protocol === 'https:') {
            this.socket = new WebSocket(
                'wss://' + url.hostname, // We're always using :80
                subprotocol);
        } else {
            console.log('invalid protocol');
            return;
        }

        this.socket.onerror = (e) => {
            console.log('error', e);
        };

        this.socket.onopen = () => {
            console.log('websocket opened')
            this.connected = true
            this.sendQueue.forEach(f => f())
        };

        this.socket.onmessage = this.onmessage
        this.socket.onclose = (msg) => {
            this.connected = false
            console.log('websocket closed')
        }

        this.functionQueue = {}
    }
    
    send = (msg, callback = (data) => {console.log('DEFAULT', data)}) => {
        return new Promise((resolve)=>{//console.log(msg);
            const resolver = (res) => 
            {    
                if (callback) {
                    callback(res);
                }
                resolve(res);
            }

            msg.callbackId = Math.random();//randomId()
            this.functionQueue[msg.callbackId] = resolver;
        
            
            // msg = JSON.stringifyWithCircularRefs(msg)
            let toSend = () => this.socket.send(msg, resolver);
            msg = JSON.stringify(msg);
            if (this.socket.readyState === this.socket.OPEN) toSend();
            else this.sendQueue.push(toSend);
        });
    }

    onmessage = (res) => {

        //console.log(res);
        res = JSON.parse(res.data);
    
        if (res.callbackId) {
            this.functionQueue[res.callbackId](res) // Run callback
            delete this.functionQueue[res.callbackId]
        } else this.defaultCallback(res);

        // State.data.serverResult = res;

        // UI.platform.receivedServerUpdate(res);

    }

    defaultCallback = (res) => {
        console.log(res);
    }

    isOpen = () => {
        return this.socket.readyState === this.socket.OPEN;
    }

    close = () => {
        this.socket.close();
    }
}