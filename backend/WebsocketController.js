
import { WebsocketDB } from './db.service.js';
import { Events } from './Event.js';
import { WebsocketRemoteStreaming } from './remote.service.js';

//should make these toggleable
const WebRTCService = require('datastreams-api/src/server/webrtc.service.js');
const OSCManager = require('./OSCManager.js');

export class WebsocketController {
    
    constructor(app, wss, debug=true) {
        this.USERS = new Map(); //live sockets
        this.COLLECTIONS = new Map();
        this.APP = app; //mongoose reference
        this.MODE = defaultMode;
        this.EVENTS = new Events();
        this.EVENTSETTINGS = [];
        // this.serverInstances=appnames;
		

        //this.subscriptionLoop();

        // this.server = new OffloadService(wss)
        this.DEBUG = debug;

        this.callbacks = [];

        this.addDefaultCallbacks();
        
        this.dbService = new WebsocketDB(this,app,'mongo',true);
        this.remoteService = new WebsocketRemoteStreaming(this);

        this.useWebRTC = true;
        this.useOSC = true;

        if(this.useWebRTC)
          this.webrtc = new WebRTCService(wss);

        if(this.useOSC)
          this.addOSCCallbacks();

    }

    addDefaultCallbacks() {
        this.callbacks.push(
            {   
                case: 'ping',
                callback:(self,args,origin,user) => {
                    return 'pong';
                }
            },
            { //generic send message between two users (userId, message, other data)
                case:'sendMessage',
                aliases:['message','sendMsg'],
                callback:(self,args,origin)=>{
                    return this.sendMsg(args[0],args[1],args[2]);
                }
            },
            { //add a local function, can implement whole algorithm pipelines on-the-fly
              case: 'addfunc', callback: (self, args, origin, user) => { //arg0 = name, arg1 = function string (arrow or normal)
                let newFunc = this.parseFunctionFromText(args[1]);
      
                let newCallback = { case: args[0], callback: newFunc };
      
                let found = self.callbacks.findIndex(c => { if (c.case === newCallback.case) return c });
                if (found != -1) self.callbacks[found] = newCallback;
                else self.callbacks.push(newCallback);
                return true;
              }
            },
            { //set locally accessible values, just make sure not to overwrite the defaults in the callbackManager
              case: 'setValues', callback: (self, args, origin, user) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => {
                    self[key] = args[key]; //variables will be accessible in functions as this.x or this['x']
                  });
                  return true;
                } else return false;
              }
            },
            { //append array values
              case: 'appendValues', callback: (self, args, origin, user) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => {
                    if(!self[key]) self[key] = args[key];
                    else if (Array.isArray(args[key])) self[key].push(args[key]); //variables will be accessible in functions as this.x or this['x']
                    else self[key] = args[key];
                  });
                  return true;
                } else return false;
              }
            },
            { //for use with transfers
              case: 'setValuesFromArrayBuffers', callback: (self, args, origin, user) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => { 
                    if(args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key] = Array.from(args[key]);
                    else self[key] = args[key];
                  });
                  return true;
                } else return false;
              }
            },
            { //for use with transfers
              case: 'appendValuesFromArrayBuffers', callback: (self, args, origin, user) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => {
                    if(!self[key] && args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key] = Array.from(args[key]);
                    else if(!self[key]) self[key] = args[key];
                    else if(args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key].push(Array.from(args[key]));
                    else if(Array.isArray(args[key])) self[key].push(args[key]); //variables will be accessible in functions as this.x or this['x']
                    else self[key] = args[key];
                  });
                  return true;
                } else return false;
              }
            },
            { //parses a stringified class prototype (class x{}.toString()) containing function methods for use on the worker
              case: 'transferClassObject', callback: (self, args, origin, user) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => {
                    if(typeof args[key] === 'string') {
                      let obj = args[key];
                      if(args[key].indexOf('class') === 0) obj = eval('('+args[key]+')');
                      self[key] = obj; //variables will be accessible in functions as this.x or this['x']
                      //console.log(self,key,obj);
                      if (self.threeUtil) self.threeUtil[key] = obj;
                    }
                  });
                  return true;
                } else return false;
              }
            },
            { //add an event to the event manager, this helps building automated pipelines between threads
                case: 'addevent', callback: (self, args, origin, user) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
                  self.EVENTSETTINGS.push({ eventName: args[0], case: args[1], port:args[2], origin: origin });
                  //console.log(args);
                  if(args[2]){ 
                    let port = args[2];
                    port.onmessage = onmessage; //attach the port onmessage event
                    this[args[0]+'port'] = port;
                    return true;
                  }
                  return false;
                }
              },
              { //internal event subscription, look at Event.js for usage, its essentially a function trigger manager for creating algorithms
                case: 'subevent', callback: (self, args, origin, user) => { //args[0] = eventName, args[1] = response function(self,args,origin) -> lets you reference self for setting variables
                  if(typeof args[0] !== 'string') return false;
                  
                  let response = this.parseFunctionFromText(args[1]);
                  let eventSetting = this.checkEvents(args[0]); //this will contain the port setting if there is any
                  //console.log(args, eventSetting)
                  return self.EVENTS.subEvent(args[0], (output) => {
                    response(self,output,origin,eventSetting?.port,eventSetting?.eventName); //function wrapper so you can access self from the event subscription
                  });
                }
              },
              { //internal event unsubscribe
                case: 'unsubevent', callback: (self, args, origin, user) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
                  return self.EVENTS.unsubEvent(args[0], args[1]);
                }
              },
              {
                  case:'logout',
                  callback:(self,args,origin,user) => {
                      self.removeUser(user,user._id);
                  }
              },
        );
    }


    addOSCCallbacks() {
      this.callbacks.push(
         // OSC (WebSocket calls handled internally)
        { 
          case:'startOSC',
          callback:(self,args,origin,u) => {
            u.osc?.add(args[0],args[1],args[2],args[3]);
          }
        },
        { 
          case:'sendOSC',
          callback:(self,args,origin,u) => {
            if (commands.length > 2) u.osc.send(args[0],args[1],args[2]);
            else u.osc?.send(args[0]);
            return {msg:'Message sent over OSC'};
          }
        },
        { 
          case:'stopOSC',
          callback:(self,args,origin,u) => {
            u.osc?.remove(args[0], args[1]);
          }
        }
      );
    }


    async processCommand(socketId="", command="",args=[], origin, callbackId, mode=this.mode) {
        let u = this.USERS.get(socketId);
        if(!u || !command) return;
        if(this.DEBUG) console.log('command', command);
        
        let eventSetting = this.checkEvents(command,origin,u);
        if(typeof args === 'object' && !Array.isArray(args)) {
          if(args.eventName) { //pipe events to the event manager system
            this.EVENTS.callback(args);
          }
        }
        else {
          let data = this.runCallback(command,args,origin,u);

          let dict = {msg: command, data:data }
          if (callbackId) dict.callbackId = callbackId;

          // console.log(toSend)
          if(eventSetting) this.EVENTS.emit(eventSetting.eventName,dict,u);
          else u.socket.send(JSON.stringify(dict));
        }
    }

    addCallback(functionName,callback=(self,args,origin,user)=>{}) {
        if(!functionName || !callback) return false;
        this.removeCallback(functionName); //removes existing callback if it is there
        this.callbacks.push({case:functionName,callback:callback});
        return true;
    }

    removeCallback(functionName) {
        let foundidx;
        let found = this.callbacks.find((o,i) => {
            if(o.case === functionName) {
                foundidx = i;
                return true;
            }
        });
        if(found) {
            this.callbacks.splice(i,1);
            return true;
        }
        else return false;
    }

    async runCallback(functionName,input=[],origin,user) {
        let output = undefined;
        await Promise.all(this.callbacks.map(async (o,i) => {
            if (o.case === functionName) {
                if (input) output = await o.callback(this, input, origin, user);
                return true;
            } else if (o.aliases) {
                if(o.aliases.indexOf(functionName) > -1) {
                    if (input) output = await o.callback(this, input, origin, user);
                    return true;
                }
            } 
            return false;
        }));
        return output;
    }

    checkEvents(functionName, origin, idObj) {
        let found = this.EVENTSETTINGS.find((o) => {
            if ((o.origin && origin && o.case && functionName && o._id && idObj?._id)) {
                if (o.origin === origin && o.case === functionName && o._id === idObj._id) return true;
                else return false;
            } 
            else if ((o.origin && origin && o.case && functionName)) {
                if (o.origin === origin && o.case === functionName) return true;
                else return false;
            } else if (o.case && functionName) {
                if (o.case === functionName) return true;
                else return false;
            } else if (o.origin && origin) {
                if(o.origin === origin) return true;
                else return false;
            }
            else return false;
        });
        //console.log(foo,origin,found)
        return found;
    }

    async checkCallbacks(event) {
        let output = undefined;
        if(!event.data) return output;
        await Promise.all(this.callbacks.map(async (o,i) => {
            if (o.case === event.data.foo || o.case === event.data.case || o.case === event.data.functionName) {
            if (event.data.input) output = await o.callback(this, event.data.input, event.data.origin);
            else if (event.data.args) output = await o.callback(this, event.data.args, event.data.origin);
            return true;
            } else return false;
        }));
        return output;
    }


    addUser(msg,socket,availableProps=[]) {
        let socketId = this.randomId('userLoggedIn');
        let id;
        if(msg.id) id = msg.id;
        else if (msg._id) id = msg._id;
        else return false;

        if(this.DEBUG) console.log('adding user', id);
        let newuser = {
            id:id, 
            _id:id, //second reference (for mongodb parity)
            username:msg.username,
            socket, 
            props: {},
            updatedPropnames: [],
            sessions:[],
            lastUpdate:Date.now(),
            lastTransmit:0,
            latency:0,
        };

        if(this.useOSC)
            newuser.osc = new OSCManager(socket),

        this.USERS.set(socketId, newuser);
        availableProps?.forEach((prop,i) => {
            newuser.props[prop] = '';
        });
        
        if(this.webrtc) try {this.webrtc.addUser(socket,id)} catch (e) {console.error(e)}

        
        this.setWSBehavior(socketId, socket);
    }

    removeUser(user={},id) {
        let u = this.USERS.get(id);

        if(u) {
            if(u.socket) {
                if(this.webrtc) try {this.webrtc.removeUser(u.socket)} catch (e) {console.error(e)}
                if(u.socket.readyState === 1 || u.socket.readyState === "1") 
                    u.socket.terminate();
            }
            this.USERS.delete(id);
            return true;
        } return false;
    }

    
    setWSBehavior(id, socket) {
        if (socket != null){

            socket.on('message', (msg="") => {
                let parsed = JSON.parse(msg);


                // Send Message through WebRTC Service
                if(this.webrtc) {
                    if (parsed.service === 'webrtc') try {this.webrtc.onmessage(msg, socket)} catch (e) {console.error(e)}
                }
        
                // console.log(msg);
                else if(Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                    parsed.forEach((obj) => {
                        if(typeof obj === 'object' && !Array.isArray(obj)) { //if we got an object process it as most likely user data
                            let hasData = false;
                            if('userData' in obj) hasData = true;

                            if(obj._id) obj.id = obj._id; //just in case
                            if(hasData) {
                                //should generalize this more
                                if(this.remoteService) this.remoteService.updateUserData(obj);
                            }
                            else if(obj.id && obj.cmd) {
                                this.processCommand(obj.id,obj.cmd,obj.args, obj.callbackId);
                            }
                            else if(obj.cmd) {
                                this.processCommand(id, obj.cmd, obj.args, obj.callbackId)
                            }
                        
                        }
                        else if (Array.isArray(obj)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                            this.processCommand(id,obj[0],obj.slice(1), obj.callbackId);  
                        }
                        else if (typeof obj === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                            let cmd = obj.split(' ');
                            this.processCommand(id,cmd[0],cmd.slice(1), obj.callbackId);
                        }
                         else {
                            // console.log(parsed);
                        }
                    })
                }
                else if(parsed.cmd) {
                    this.processCommand(id, parsed.cmd, parsed.args, parsed.callbackId)
                }
                else if (Array.isArray(parsed)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                    this.processCommand(id,parsed[0],parsed.slice(1), undefined);  
                }
                else if (typeof parsed === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                    let cmd = parsed.split(' ');
                    this.processCommand(id,cmd[0],cmd.slice(1), undefined);
                } else {
                    // console.log(parsed);
                }
            });

            socket.on('close', (s) => {
                // console.log('session closed: ', id);
                this.removeUser(id);
                if(this.webrtc) try {this.webrtc.removeUser(socket)} catch (e) {console.error(e)}
            });
        }
        return socket;
    }

    
    
    sendMsg(user='',msg='',data=undefined) {

        let toSend = { msg: msg };
        if(data) toSend.data = data;

        if(typeof user === 'string') {
            let u;
            this.USERS.forEach((obj) => {
                if(obj.id === user) u = obj;
            })
            if(u) {
                if(u.socket.readyState === 1 || u.socket.readyState === "1") {
                    //console.log('sending', u.id, toSend);
                    u.socket.send(JSON.stringify(toSend));
                    return true;
                } else return false;
            }
        } else if (typeof user === 'object') {
            if(user.socket.readyState === 1 || user.socket.readyState === "1") user.socket.send(JSON.stringify(toSend));
            return true;
        }
        return false;
    }

    randomId(tag = '') {
        return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
    }
    
    dynamicImport = async (url) => {
        let module = await import(url);
        return module;
    }

    parseFunctionFromText(method) {
        //Get the text inside of a function (regular or arrow);
        let getFunctionBody = (methodString) => {
          return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4');
        }
      
        let getFunctionHead = (methodString) => {
          let startindex = methodString.indexOf(')');
          return methodString.slice(0, methodString.indexOf('{',startindex) + 1);
        }
      
        let newFuncHead = getFunctionHead(method);
        let newFuncBody = getFunctionBody(method);
      
        let newFunc;
        if (newFuncHead.includes('function ')) {
          let varName = newFuncHead.split('(')[1].split(')')[0]
          newFunc = new Function(varName, newFuncBody);
        } else {
          if(newFuncHead.substring(0,6) === newFuncBody.substring(0,6)) {
            //newFuncBody = newFuncBody.substring(newFuncHead.length);
            let varName = newFuncHead.split('(')[1].split(')')[0]
            //console.log(varName, newFuncHead ,newFuncBody);
            newFunc = new Function(varName, newFuncBody.substring(newFuncBody.indexOf('{')+1,newFuncBody.length-1));
          }
          else newFunc = eval(newFuncHead + newFuncBody + "}");
        }
      
        return newFunc;
      
    }
}