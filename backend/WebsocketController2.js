
import { Events } from './Event.js';

class WebsocketController {
    
    constructor(app, wss, defaultMode='mongo', debug=true) {
        this.USERS = new Map(); //live sockets
        this.COLLECTIONS = new Map();
        this.APP = app; //mongoose reference
        this.MODE = defaultMode;
        this.EVENTS = new Events();
        this.EVENTSETTINGS = [];
        // this.serverInstances=appnames;
		this.userSubscriptions=[]; //User to user data subscriptions
		this.appSubscriptions=[]; //Synchronous apps (all players receive each other's data)
        this.hostSubscriptions=[]; //Asynchronous apps (host receives all users data, users receive host data only)
        this.subUpdateInterval = 0; //ms
        this.serverTimeout = 60*60*1000; //min*s*ms
        this.mongoClient = undefined;

        this.LOOPING = true;
        //this.subscriptionLoop();

        this.webrtc = new WebRTCService(wss);
        // this.server = new OffloadService(wss)
        this.DEBUG = debug;

        this.callbacks = [
            {   
                case: 'ping',
                callback:(self,args,origin) => {
                    return 'pong';
                }
            },
            { //add a local function, can implement whole algorithm pipelines on-the-fly
              case: 'addfunc', callback: (self, args, origin) => { //arg0 = name, arg1 = function string (arrow or normal)
                let newFunc = this.parseFunctionFromText(args[1]);
      
                let newCallback = { case: args[0], callback: newFunc };
      
                let found = self.callbacks.findIndex(c => { if (c.case === newCallback.case) return c });
                if (found != -1) self.callbacks[found] = newCallback;
                else self.callbacks.push(newCallback);
                return true;
              }
            },
            { //set locally accessible values, just make sure not to overwrite the defaults in the callbackManager
              case: 'setValues', callback: (self, args, origin) => {
                if (typeof args === 'object') {
                  Object.keys(args).forEach((key) => {
                    self[key] = args[key]; //variables will be accessible in functions as this.x or this['x']
                  });
                  return true;
                } else return false;
              }
            },
            { //append array values
              case: 'appendValues', callback: (self, args, origin) => {
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
              case: 'setValuesFromArrayBuffers', callback: (self, args, origin) => {
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
              case: 'appendValuesFromArrayBuffers', callback: (self, args, origin) => {
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
              case: 'transferClassObject', callback: (self, args, origin) => {
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
                case: 'addevent', callback: (self, args, origin) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
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
                case: 'subevent', callback: (self, args, origin) => { //args[0] = eventName, args[1] = response function(self,args,origin) -> lets you reference self for setting variables
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
                case: 'unsubevent', callback: (self, args, origin) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
                  return self.EVENTS.unsubEvent(args[0], args[1]);
                }
              },
        ]

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

    async processCommand(socketId="", command="",args=[], origin, callbackId, mode=this.mode) {
        let u = this.USERS.get(socketId);
        if(!u || !command) return;
        if(this.debug) console.log('command', command);

        let data = this.runCallback(command,args,origin);
        

        let toSend = {msg: command, data:data }
        if (callbackId) toSend.callbackId = callbackId;

        // console.log(toSend)
        u.socket.send(JSON.stringify(toSend));
    }

    addCallback(functionName,callback=(self,args,origin)=>{}) {
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

    async runCallback(functionName,input=[],origin) {
        let output = undefined;
        await Promise.all(this.callbacks.map(async (o,i) => {
          if (o.case === functionName) {
            if (input) output = await o.callback(this, input, origin);
            return true;
          } else return false;
        }));
        return output;
    }

    checkEvents(functionName, origin) {
        let found = this.EVENTSETTINGS.find((o) => {
            if ((o.origin && origin && o.case && functionName)) {
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

        console.log('adding user', id);
        let newuser = {
            id:id, 
            _id:id, 
            username:msg.username,
            socket, 
            osc: new OSCManager(socket),
            props: {},
            updatedPropnames: [],
            lastUpdate:Date.now(),
            lastTransmit:0,
            latency:0,
        };

        this.USERS.set(socketId, newuser);
        availableProps?.forEach((prop,i) => {
            newuser.props[prop] = '';
        });
        try {this.webrtc.addUser(socket,id)} catch (e) {console.error(e)}

        
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
                if (parsed.service === 'webrtc') try {this.webrtc.onmessage(msg, socket)} catch (e) {console.error(e)}
        
                // console.log(msg);
                else if(Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                    parsed.forEach((obj) => {
                        if(typeof obj === 'object' && !Array.isArray(obj)) { //if we got an object process it as most likely user data
                            let hasData = false;
                            if('userData' in obj) hasData = true;

                            if(obj._id) obj.id = obj._id; //just in case
                            if(hasData) {
                                //should generalize this
                                this.updateUserData(obj);
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
            })
            socket.on('close', (s) => {
                // console.log('session closed: ', id);
                this.removeUser(id);
                try {this.webrtc.removeUser(socket)} catch (e) {console.error(e)}
            });
        }
        return socket
    }

    
    //Received a message from a user socket, now parse it into system
	updateUserData(data={id:'',userData:{}}){ 
		//Send previous data off to storage
        if (this.USERS.has(data.id)){

            let u = this.USERS.get(data.id);

            for(const prop in data.userData) {
                u.props[prop] = data.userData[prop];
                if(u.updatedPropnames.indexOf(prop) < 0)
                    u.updatedPropnames.push(prop);
            }

            let now = Date.now();
            u.latency = now-u.lastUpdate;
            u.lastUpdate = now;

            this.userSubscriptions.forEach((o,i) => {
                if(o.source === data.id) {
                    o.newData = true;
                }
            });

            this.appSubscriptions.forEach((o,i) => {

                let u = o.users[data.id]
                let s = o.spectators[data.id]
                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            this.hostSubscriptions.forEach((o,i) => {
                let u = o.users[data.id]
                let s = o.spectators[data.id]

                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            //o.socket.send(JSON.stringify(o.props));
            
        }
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
}