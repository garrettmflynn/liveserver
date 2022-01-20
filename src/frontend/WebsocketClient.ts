//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License
//import { streamUtils } from "./streamSession";

import {Events} from '@brainsatplay/liveserver-common'
import { MessageType } from 'src/common/general.types';

export class WebsocketClient {

    url: URL;
    subprotocols
    connected = false;
    sendQueue = [];
    streamUtils
    sockets = [];
    socketRot = 0;

    responses = [];
    functionQueue = {};

    origin = `client${Math.floor(Math.random()*10000000000000)}`; //randomid you can use

    EVENTS = new Events(this);
    subEvent = (eventName, response=(result)=>{})=>{this.EVENTS.subEvent(eventName,response);}
    unsubEvent = (eventName, sub) => {this.EVENTS.unsubEvent(eventName,sub)};
    addEvent = (eventName, origin, functionName, id) => {this.EVENTS.addEvent(eventName, origin, functionName, id)};



    constructor(
        socketUrl:URL|string='https://localhost:80', 
        subprotocols={_id:`user${Math.floor(Math.random() * 10000000000)}`},
        defaultSocket = true
    ) {

        if (!(socketUrl instanceof URL)) this.url = new URL(socketUrl);

        this.subprotocols = subprotocols;
        
        if(this.url && defaultSocket) this.addSocket(this.url, subprotocols)
    }

    //creates a url to be posted to the socket backend for parsing, mainly user info
    encodeForSubprotocol = (dict) => {
        let subprotocol = []

        if(dict._id) {
            dict.id = dict._id 
            delete dict._id
        }

        Object.keys(dict).forEach((str) => subprotocol.push(`brainsatplay.com/${str}/${dict[str]}?arr=` + Array.isArray(dict[str])))
        return encodeURIComponent(subprotocol.join(';'));

    }

    addSocket(url=this.url, subprotocolObject=this.subprotocols) {
        let socket;
        try {
            if (url.protocol === 'http:') {
            
                socket = new WebSocket(
                    'ws://' + url.hostname, // We're always using :80
                    this.encodeForSubprotocol(subprotocolObject));
                //this.streamUtils = new streamUtils(auth,socket);
            } else if (url.protocol === 'https:') {
                socket = new WebSocket(
                    'wss://' + url.hostname, // We're always using :80
                    this.encodeForSubprotocol(subprotocolObject));

                //this.streamUtils = new streamUtils(auth,socket);
            } else {
                console.log('invalid protocol');
                return undefined;
            }
        }
        catch(err) {
            console.error('Error with socket creation!',err);
            return undefined;
        }

        socket.onerror = (e) => {
            console.log('error', e);
        };

        socket.onopen = () => {
            console.log('websocket opened');
            this.connected = true;
            //this.streamUtils.info.connected = true;
            this.sendQueue.forEach(f => f());
        };

        socket.onmessage = this.onmessage
        socket.onclose = (msg) => {
            this.connected = false;
            //this.streamUtils.info.connected = false;
            console.log('websocket closed');
        }

        let id = "socket_"+Math.floor(Math.random()*10000000000);

        this.sockets.push({socket:socket,id:id});

        return id;

    }

    getSocket(id:string) {
        if(!id) return this.sockets[0].socket;

        return this.sockets.find((o,i) => {
            if(o.id === id) return true;
        })?.socket;

    }

    //add a callback to a worker
    addFunction(functionName,fstring,origin,id,callback=(result)=>{}) {
        if(functionName && fstring) {
            if(typeof fstring === 'function') fstring = fstring.toString();
            let dict = {route:'addfunc',msg:[functionName,fstring], id:origin}; //post to the specific worker
            if(!id) {
                this.sockets.forEach((w) => {this.send(dict,w.id);});
                return true;
            } //post to all of the workers
          else return this.send(dict,callback,id);
        }
      }

    run(functionName:string,args:[]|object=[],origin:string,id:String,callback=(result)=>{}):any {
        if(functionName) {
            if(functionName === 'transferClassObject') {
              if(typeof args === 'object' && !Array.isArray(args)) {
                for(const prop in args) {
                  if(typeof args[prop] === 'object' && !Array.isArray(args[prop])) args[prop] = args[prop].toString();
                }
              }
            }
            let dict = {route:functionName, msg:args, id:origin};
            return this.send(dict,callback,id);
        }
    }

    runFunction = this.run;
    
    //a way to set variables on a thread
    setValues(values={},origin,id) {
        this.run('setValues',values,origin,id);
    }

    send = (msg:MessageType, callback = (data) => {}, id?) => {
        return new Promise((resolve)=>{//console.log(msg);
            const resolver = (res) => 
            {    
                if (callback) callback(res);
                resolve(res);
            }

            const callbackId = ''+Math.random();//randomId()
            if (typeof msg === 'object'){
                if (Array.isArray(msg)) msg.splice(1, 0, callbackId); // add callbackId before arguments
                else msg.callbackId = callbackId; // add callbackId key
            } // TODO: Handle string-encoded messsages

            this.functionQueue[callbackId] = resolver;

            let socket;
            if(!id) {
                socket = this.sockets[this.socketRot].socket;
                this.socketRot++; //can rotate through multiple sockets cuz why not
                if(this.socketRot === this.sockets.length) this.socketRot = 0;
            }
            else { socket = this.getSocket(id); }
            // msg = JSON.stringifyWithCircularRefs(msg)

            if(!socket) return;
            let toSend = () => socket.send(msg, resolver);
            msg = JSON.stringify(msg);
            if (socket.readyState === socket.OPEN) toSend();
            else this.sendQueue.push(toSend);
        });
    }

    post = this.send; //alias

    onmessage = (res) => {

        res = JSON.parse(res.data);
        console.error('onmessage',res)

        //this.streamUtils.processSocketMessage(res);
    
        this.responses.forEach((foo,i) => {
            if(typeof foo === 'object') foo.callback(res);
            else if (typeof foo === 'function') foo(res);
        });

        if (res.callbackId) {
            this.functionQueue[res.callbackId](res.msg) // Run callback
            delete this.functionQueue[res.callbackId];
        } else this.defaultCallback(res.msg);

        // State.data.serverResult = res;

        // UI.platform.receivedServerUpdate(res);

    }

    addCallback(name='',callback=(args)=>{}) {
        if(name.length > 0 && !this.responses.find((o)=>{if(typeof o === 'object') {if(o.name === name) return true;}})) {
            this.responses.push({name:name,callback:callback});
            return this.responses.length-1;
        }
        else return false;
    }

    removeCallback(nameOrIdx='') {
        if(nameOrIdx.length > 0) {
            let idx;
            if(this.responses.find((o,i)=>{if(typeof o === 'object') {if(o.name === nameOrIdx) { idx = i; return true;}}})) {
                this.responses.splice(idx,1);
            }
        } else if (typeof nameOrIdx === 'number') {
            this.responses.splice(nameOrIdx,1);
        }
    }

    defaultCallback = (res) => {
        console.error('default',res)
    }


    isOpen = (id) => {
        if(!id) return this.sockets[0]?.readyState === 1;
        let socket = this.getSocket(id);
        if(socket) return socket.readyState === 1; 
        else return false;
    }

    close = (id) => {
        if(!id) {
            if(this.sockets[0]) this.sockets[0].close();
            return true;
        }
        let socket = this.getSocket(id);
        if(socket) return socket.close(); 
        else return false;
    }

    terminate = this.close; //alias
}