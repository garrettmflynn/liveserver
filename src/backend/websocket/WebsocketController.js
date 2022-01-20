
import { WebsocketDB } from '../database/database.service.js';
import { Events } from '@brainsatplay/liveserver-common'
import { WebsocketRemoteStreaming } from '../multiplayer/session.service.js';

//should make these toggleable
import WebRTCService from 'datastreams-api/src/server/webrtc.service.js'
import OSCManager from '../osc/osc.service.js'

const DONOTSEND = 'DONOTSEND';

//Instantiated by the WebsocketServer to handle callbacks
class WebsocketController {
    
    constructor(
          options = {      //default options
            wss:undefined, //Websocket.Server instance
            db: {
              mode: 'local',
              instance: null
            },
            remoteService:true,
            webrtc:true,
            osc:true,
            debug:true 
            //safe:true
          }) {
        this.USERS = new Map(); //live sockets and basic user info
        this.COLLECTIONS = new Map();
        this.EVENTS = new Events();
        this.EVENTSETTINGS = [];
        // this.serverInstances=appnames;
		
        this.options = options; //settings and utility classes

        //this.subscriptionLoop();

        // this.server = new OffloadService(wss)
        this.DEBUG = options.debug;

        this.callbacks = [];

        this.addDefaultCallbacks();

        if(!options.safe) this.addUnsafeCallbacks(); //addfunc, setValues, addevent, etc. All potentially compromising for production
        if(options.db) this.useDB = true;   //local or mongodb
        if(options.remoteService) this.useRemoteService = true; //multiplayer
        if(options.webrtc) this.useWebRTC = true; //web real time chat
        if(options.osc)  this.useOSC = true; //audio format streams

        //should use an options object for these to pass in appropriate stuff e.g. the mongoose app
        if(this.useDB) this.dbService = new WebsocketDB(this, this.options.db, true);
        
        if(this.useRemoteService) this.remoteService = new WebsocketRemoteStreaming(this);

        if(this.useWebRTC) this.webrtc = new WebRTCService(options.wss);

        if(this.useOSC) this.addOSCCallbacks();


        if(this.DEBUG) this.runCallback('list', [true])
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

        return await this.runCallback(command,args,origin,u).then(data => {
          
          let dict = { cmd: command, output:data };
          if (callbackId) dict.callbackId = callbackId;
  
          if(data === DONOTSEND) return dict;

          if(eventSetting) this.EVENTS.emit(eventSetting.eventName,dict,u);
          else u.socket.send(JSON.stringify(dict));
          u.lastTransmit = Date.now();

          return dict;
        }).catch(console.error)

      }
  }

  //handled automatically by the WebsocketServer
  addUser(socket,userinfo={}) {
    let id = this.randomId('user');
      
    let newuser = {
      id:id, 
      _id:id, //second reference (for mongodb parity)
      username:id,
      origin:id,
      socket, 
      props: {},
      updatedPropnames: [],
      sessions:[],
      blocked:[], //blocked user ids for access controls
      lastUpdate:Date.now(),
      lastTransmit:0,
      latency:0,
    };

    Object.assign(newuser,userinfo); //assign any supplied info

    if(userinfo.id) {
      userinfo._id = userinfo.id;
      id = userinfo.id;
    }
    else if (userinfo._id) {
      userinfo.id = userinfo._id;
      id = userinfo._id;
    }

    if(this.DEBUG) console.log('Adding User, Id:', id);

    if(this.useOSC) newuser.osc = new OSCManager(socket),

    this.USERS.set(id, newuser);

    //add any additional properties sent. remote.service.js has more functions for using these

    if(this.webrtc) try {this.webrtc.addUser(socket,id)} catch (e) {console.error(e)}

    this.setWSBehavior(socket,id);

    return id; //returns the generated id so you can look up
  }

  removeUser(user={}) {
    let u = (typeof user === 'string') ? this.USERS.get(user) : user;
    
    if(u) {
        if(u.socket) {
            if(this.webrtc) try {this.webrtc.removeUser(u.socket)} catch (e) {console.error(e)}
            if(u.socket.readyState === 1 || u.socket.readyState === "1") 
                u.socket.terminate();
        }
        this.USERS.delete(user._id);
        return true;
    } 
    return false;
  }

  //adds an id to a blocklist for access control
  blockUser(user={}, userId='') {
    if(this.USERS.get(userId)) {
      if(!user.blocked.includes(userId) && user.id !== userId) { //can't block self 
        user.blocked.push(userId);
        return true;
      }
    }
    return false;
  }
     
  handleData = (obj,socketId) => {
    if(typeof obj === 'object' && !Array.isArray(obj)) { //if we got an object process it as most likely user data
      
      if(obj._id) obj.id = obj._id; //just in case

      if(obj.id && obj.cmd) {
          this.processCommand(obj.id,obj.cmd,obj.args, undefined, obj.callbackId);
      }
      else if(obj.cmd) {
          this.processCommand(socketId, obj.cmd, obj.args, undefined, obj.callbackId)
      }
  
    }
    else if (Array.isArray(obj)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
        this.processCommand(socketId,obj[0],obj.slice(1), undefined, obj.callbackId);  
    }
    else if (typeof obj === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
        let cmd = obj.split(' ');
        this.processCommand(socketId,cmd[0],cmd.slice(1), undefined, obj.callbackId);
    }
    else {
        // console.log(parsed);
    }
  }

  
  setWSBehavior(socket,id) {
      if (socket != null){

          socket.on('message', (json="") => {
              let parsed = JSON.parse(json);
              
              // Send Message through WebRTC Service
              if(this.webrtc && parsed.service === 'webrtc') {
                  try {this.webrtc.onmessage(json, socket)} catch (e) {console.error(e)}
              }
              // console.log(json);
              else if(Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                  parsed.forEach((obj) => {
                    this.handleData(obj,socketId);
                  })
              }
              else this.handleData(parsed,socketId);
          });

          socket.on('close', (s) => {
              // console.log('session closed: ', id);
              this.removeUser(id);
              if(this.webrtc) try {this.webrtc.removeUser(socket)} catch (e) {console.error(e)}
          });
      }
      return socket;
  }
  
  //pass user Id or object
  sendMsg(user='',msg='',data=undefined) {

    console.log('sendMsg: Do not overwrite important msg key on:', data)
      let toSend = (data) ? Object.assign(data, { msg }) : { msg }

      if(typeof user === 'string') {
          let u = this.USERS.get(user)
          console.log(this.USERS, u)
          if(u) {
              if(u.socket.readyState === 1 || u.socket.readyState === "1") {
                  return toSend;
              } else return false;
          }
      } else if (typeof user === 'object') {
          return toSend;
      }
      return false;
  }

  //some basic server callbacks to interact with the base communication features
  addDefaultCallbacks() {

    //'self' and 'this' scope are the same here
      this.callbacks.push(
          {   
              case: 'ping',
              callback:(self,args,origin,user) => {
                  return 'pong';
              }
          },
          { //return a list of function calls available on the server
            case: 'list', callback: (self, args, origin) => {
              let list = [];
              this.callbacks.forEach((obj) => {
                list.push(obj.case);
              });
              if (args[0] === true) console.log('Server callbacks available: ', list); //list available functions
              return list;
            }
          },
          { //generic send message between two users (userId, message, other data)
              case:'sendMessage',
              aliases:['message','sendMsg'],
              callback:(self,args,origin,user)=>{
                  return this.sendMsg(args[0],args[1],args[2]);
              }
          },
          { //set user details for yourself
              case:'setUserServerDetails',
              callback:(self,args,origin,user)=>{
                if(args[0]) user.username = args[0];
                if(args[1]) user.password = args[1];
                if(args[2]) user.props = args[2];
                if(args[3]) {
                  user._id = args[3]; //not very wise to do in our schema
                  user.id = args[3];
                } 
              }
          },
          { //assign user props for yourself or someone else (by user unique id)
              case:'setProps',
              callback:(self,args,origin,user)=>{
                if(typeof args === 'object' && !Array.isArray(args)) {
                  Object.assign(user.props,args);
                  return true;
                }
                else if (Array.isArray(args) && typeof args[1] === 'object') {
                  let u = this.USERS.get(args[0]);
                  if(u) Object.assign(u.props,args[1]);
                  return true;
                }
                return false;
              }
          },
          { //get props of a user by id or of yourself
              case:'getProps',
              callback:(self,args,origin,user)=>{
                if(args[0]) {
                  let u = this.USERS.get(args[0]);
                  if(u) return u.props;
                }
                else return user.props;
              }
          },
          { //lists user keys
            case:'listUsers',
            callback:(self,args,origin,user)=>{
              return Array.from(this.USERS.keys());
            }
          },
          { //lists user keys
            case:'blockUser',
            callback:(self,args,origin,user)=>{
              return this.blockUser(user,args[0]);
            }
          },
          { //get basic details of a user or of yourself
              case:'getUser',
              callback:(self,args,origin,user)=>{
                if(args[0]) {
                  let u = this.USERS.get(args[0]);
                  if(u) {
                    return {
                      _id:u._id,
                      username:u.username,
                      origin:u.origin,
                      props:u.props,
                      updatedPropNames:u.updatedPropNames,
                      lastUpdate:u.lastUpdate,
                      lastTransmit:u.lastTransmit,
                      latency:u.latency
                    }
                  }
                }
                else {
                  return {
                    _id:user._id,
                    username:user.username,
                    origin:user.origin,
                    props:user.props,
                    updatedPropNames:user.updatedPropNames,
                    lastUpdate:user.lastUpdate,
                    lastTransmit:user.lastTransmit,
                    latency:user.latency
                  }
                }
              }
          },
          {
            case:'logout',
            aliases:['removeUser','endsession'],
            callback:(self,args,origin,user) => {
              if(args[0]) self.removeUser(args[0])
              else self.removeUser(user);
            }
          },
      );
  }

    //potentially unsafe server callbacks which let you write
    // arbitrary functions, events, and data to the server memory
    addUnsafeCallbacks() {
      this.callbacks.push(
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
          }
      );
    }


    addOSCCallbacks() {
      this.callbacks.push(
         // OSC (WebSocket calls handled internally)
        { 
          case:'startOSC',
          callback:(self,args,origin,u) => {
            if(u.osc?.add(args[0],args[1],args[2],args[3])) return true;
          }
        },
        { 
          case:'sendOSC',
          callback:(self,args,origin,u) => {
            if (commands.length > 2) u.osc.send(args[0],args[1],args[2]);
            else u.osc?.send(args[0]);
            return DONOTSEND;
          }
        },
        { 
          case:'stopOSC',
          callback:(self,args,origin,u) => {
            if(u.osc?.remove(args[0], args[1])) return true;
          }
        }
      );
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

    async runCallback(
      functionName,
      input=[],
      origin,
      user
    ) {
        let output = undefined;
        await Promise.all(this.callbacks.map(async (o,i) => {
            if (o.case === functionName) {
                output = await o.callback(this, input, origin, user);
                return true;
            } else if (o.aliases) {
                if(o.aliases.indexOf(functionName) > -1) {
                    output = await o.callback(this, input, origin, user);
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

export {WebsocketController}
export default WebsocketController