
import { Events, randomId, getParamNames } from '@brainsatplay/liveserver-common'
import { AllMessageFormats, MessageObject, MessageType, RouteConfig, UserObject } from 'src/common/general.types';
import { UnsafeService } from './unsafe';

export const DONOTSEND = 'DONOTSEND';

// --------------- Route Structure ------------------
// */
//  Default routes supplied by the Router.routes attribute
//
// */[service]
//  Additional core routes specified by services loaded into the session
//
// */[client_id]
//  Custom routes specified by clients
//

class Router {
  USERS: Map<string, UserObject> = new Map(); //live sockets and basic user info
  COLLECTIONS = new Map();
  EVENTS = new Events();
  EVENTSETTINGS = [];
  SUBSCRIPTIONS: Function[] = [] // an array of handlers (from services)
  DEBUG: boolean;
  SERVICES: Map<string, any> = new Map() // TODO: Detect changes and subscribe to them
  routes: Map<string, RouteConfig> = new Map() // TODO: Detect changes and subscribe to them
  defaultRoutes: any[] = []
  

  // -------------------- User-Specified Options --------------------
  options: {
    debug?:boolean 
    safe?:boolean
  } = {
    debug:true
  }

    constructor(options) {

		
        Object.assign(this.options, options)

        this.DEBUG = options.debug;

        this.defaultRoutes = [
          {   
            route: 'ping',
            callback:() => {
                return 'pong';
            }
        },
        { //return a list of services available on the server
          route: 'services', callback: (self, args, origin) => {
            let list = [];
            this.SERVICES.forEach((o,k) => {
              if (k) list.push({
                  route: k,
                  name: o.constructor.name
              });
            });
            if (args[0] === true) console.log('Services available: ', list); //list available functions
            return list;
          }
        },
        { //return a list of function calls available on the server
          route: 'routes', callback: (self, args, origin) => {
            let list = [];
            this.routes.forEach((o) => {
              list.push({
                route: o.route,
                args: getParamNames(o.callback)
              });
            });
            if (args[0] === true) console.log('Server routes available: ', list); //list available functions
            return list;
          }
        },
        { //generic send message between two users (userId, message, other data)
            route:'sendMessage',
            aliases:['message','sendMsg'],
            callback:(self,args)=>{
                return this.sendMsg(args[0],args[1],args[2]);
            }
        },
        { //set user details for yourself
            route:'setUserServerDetails',
            callback:(self,args,origin)=>{
              let user = self.USERS.get(origin)
              if (!user) return false
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
            route:'setProps',
            callback:(self,args,origin)=>{
              let user = self.USERS.get(origin)
              if (!user) return false
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
            route:'getProps',
            callback:(self,args,origin)=>{
              let user = self.USERS.get(origin)
              if (!user) return false

              if(args[0]) {
                let u = this.USERS.get(args[0]);
                if(u) return u.props;
              }
              else return user.props;
            }
        },
        { //lists user keys
          route:'listUsers',
          callback:()=>{
            return Array.from(this.USERS.keys());
          }
        },
        { //lists user keys
          route:'blockUser',
          callback:(self,args,origin)=>{
            let user = self.USERS.get(origin)
            if (!user) return false
            return this.blockUser(user,args[0]);
          }
        },
        { //get basic details of a user or of yourself
            route:'getUser',
            callback:(self,args,origin)=>{
              let user = self.USERS.get(origin)
              if (!user) return false

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
          route:'login',
          aliases:['addUser', 'startSession'],
          callback: async (self, args, origin) => {
            let res = await self.addUser(args)
            return { message: `User added: ${origin}`, id: origin }
          }
        },
        {
          route:'logout',
          aliases:['removeUser','endSession'],
          callback:(self,args,origin) => {
            let user = self.USERS.get(origin)
              if (!user) return false
            if(args[0]) self.removeUser(args[0])
            else self.removeUser(user);
          }
        },
        ]

        this.addDefaultRoutes();

        if(!options.safe) this.addUnsafeRoutes(); //addfunc, setValues, addevent, etc. All potentially compromising for production

        if(this.DEBUG) this.runCallback('routes', [true])
    }


    load(service:any, name:string = service.name) {

      console.log('New Service', name)
      this.SERVICES.set(name, service)

        service.routes?.forEach(o => {
          const cases = [o.route, ...(o.aliases) ? o.aliases : []]
            cases.forEach(k => {
              const route = `${(name) ? `${name}/` : ''}` + k
              this.routes.set(route, {
                route,
                service: name,
                callback: o.callback
            })
        })
      })

      if (service.subscribe) {
        service.subscribe((o:MessageObject, type?:MessageType) => {
          return this.handleMessage(o, type)
        })
      }

      if (service.subscriptionHandler) {
          this.SUBSCRIPTIONS.push(service.subscriptionHandler)
      }

    }


    async runRoute(route="",args:any[]|{eventName?:string}=[], origin, callbackId?) {

      try {
        if(!route) return; // NOTE: Now allowing users not on the server to submit requests
        if(this.DEBUG) console.log('route', route);

        if(typeof args === 'object' && !Array.isArray(args)) {

          if(args.eventName) { //pipe events to the event manager system
            this.EVENTS.callback(args);
          }

        }
        else {

          return await this.runCallback(route,args,origin).then((dict:MessageObject|any) => {
            
            // Convert Output to Message Object
            if (typeof dict !== 'object' || !('message' in dict)) dict = {
              message: dict
            }
            if (!dict.route) dict.route = route
            dict.callbackId = callbackId

            // Pass to Subscriptions
            this.triggerSubscriptions(dict)

            // Pass Out
            if(dict.message === DONOTSEND) return dict;
            return dict;
          }).catch(console.error)

        }
      } catch (e) {
        return new Error(`Route failed...`)
      }
  }

  //h Track Users Connected to the LiveServer
  addUser(userinfo:Partial<UserObject>={}) {
    let id = randomId('user');
      
    let newuser: UserObject = {
      id:id, 
      _id:id, //second reference (for mongodb parity)
      username:id,
      origin:id,
      props: {},
      updatedPropNames: [],
      sessions:[],
      blocked:[], //blocked user ids for access controls
      lastUpdate:Date.now(),
      lastTransmit:0,
      latency:0,
      routes: new Map()
    } ;

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

    this.USERS.set(id, newuser);

    //add any additional properties sent. remote.service has more functions for using these

    this.SERVICES.forEach(s => {
      const route = s.name + '/addUser'
      if (this.routes.has(route)) this.runRoute(route, [userinfo], id) // TODO: Fix WebRTC
    })

    return id; //returns the generated id so you can look up
  }

  removeUser(user:string|UserObject) {
    let u = (typeof user === 'string') ? this.USERS.get(user) : user
    
    if(u) {

        this.SERVICES.forEach(s => {
          const route = s.name + '/removeUser'
          if (this.routes.has(route)) this.runRoute(route, [u], u.id) // TODO: Fix WebRTC
        })

        if(u.socket) {
            if(u.socket.readyState === 1) u.socket.close();
        }
        this.USERS.delete(u._id);
        return true;
    } 
    return false;
  }

  //adds an id to a blocklist for access control
  blockUser(user:UserObject, userId='') {
    if(this.USERS.get(userId)) {
      if(!user.blocked.includes(userId) && user.id !== userId) { //can't block self 
        user.blocked.push(userId);
        return true;
      }
    }
    return false;
  }

  triggerSubscriptions = (msg:MessageObject) => {
    return this.SUBSCRIPTIONS.forEach(o => o(msg))
  }
     
  handleMessage = async (msg:AllMessageFormats, internal?:MessageType) => {

    let o:Partial<MessageObject> = {}
    if (Array.isArray(msg)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
      o.route = msg[0]
      o.message =  msg.slice(1)
      o.callbackId =  undefined
      // o.id = socketId
    }
    else if (typeof msg === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
        let cmd = msg.split(' ');
        o.route = cmd[0]
        o.message =  cmd.slice(1)
        o.callbackId =  undefined
        // o.id = socketId
    } else if (typeof msg === 'object') Object.assign(o, msg)

    // Deal With Object-Formatted Request
    if(typeof o === 'object' && !Array.isArray(o)) { //if we got an object process it as most likely user data
      if(o._id) o.id = o._id; //just in case
      
        if(o.route) {
          
          let u = this.USERS.get(o.id)
          let eventSetting = this.checkEvents(o.route, u?.id ?? o.id ,u);

          console.log('runRoute', o.route)
          let res = await this.runRoute(o.route,o.message, u?.id ?? o.id, o.callbackId);

          // Handle Subscription Updates based on Internal Notifications
          if (internal){
            this.triggerSubscriptions(res)
            console.log('Updating subscribers...')
          } 
          
          // Else Update Events and Return
          else {
            if(eventSetting) this.EVENTS.emit(eventSetting.eventName,res,u);
          }
          // if (u) {
          //   if(eventSetting) this.EVENTS.emit(eventSetting.eventName,res,u);
          //   else u.socket.send(JSON.stringify(res));
          //   u.lastTransmit = Date.now();
          // }
          return res
        }
      }

  }
  
  //pass user Id or object
  sendMsg(user:string|UserObject='',message='',data=undefined) {

    console.log('sendMsg: Do not overwrite important message key on:', data)
      let toSend = (data) ? Object.assign(data, { message }) : { message }

      if(typeof user === 'string') {
          let u = this.USERS.get(user)
          console.log(this.USERS, u)
          if(u) {
              if(u.socket.readyState === 1) {
                u.socket.send(JSON.stringify(toSend));
                return true;
              } else return false;
          }
      } else if (typeof user === 'object') {
        user.socket.send(JSON.stringify(toSend));
        return true;
      }
      return false;
  }

  //some basic server routes to interact with the base communication features
  addDefaultRoutes() {
    this.load({routes: this.defaultRoutes})
  }

    //potentially unsafe server routes which let you write
    // arbitrary functions, events, and data to the server memory
    addUnsafeRoutes() {
      let unsafe = new UnsafeService()
      this.load(unsafe);
    }

    addCallback(route,callback=(self,args,origin)=>{}) {
        if(!route || !callback) return false;
        this.removeCallback(route); //removes existing callback if it is there

        if (route[0] === '/') route = route.slice(1)
        this.routes.set(route, {route,callback:callback});
        return true;
    }

    removeCallback(functionName) {
        return this.routes.delete(functionName);
    }

    runCallback(
      route,
      input=[],
      origin?,
    ) {

      return new Promise(async resolve => {
        // Get Wildcard Possibilities
        let possibilities = [route]
        let split = route.split('/')
        split = split.slice(0,split.length-1)
        split.forEach((_,i) => {
            let slice = split.slice(0,i+1).join('/')
            possibilities.push(slice + '/*', slice + '/**')
        })

        // Iterate over Possibilities
        Promise.all(possibilities.map(async route => {
          if (this.routes.has(route)) {
            let routeInfo = this.routes.get(route)
            const res = await routeInfo?.callback(...[this, input, origin])
            if (routeInfo.service && res?.route) res.route = `${routeInfo.service}/${res.route}`
            resolve(res)
          }
        })).then(_ => resolve(false))
      })
    }

    checkEvents(functionName, origin?, idObj?) {
        let found = this.EVENTSETTINGS.find((o) => {
            if ((o.origin && origin && o.route && functionName && o._id && idObj?._id)) {
                if (o.origin === origin && o.route === functionName && o._id === idObj._id) return true;
                else return false;
            } 
            else if ((o.origin && origin && o.route && functionName)) {
                if (o.origin === origin && o.route === functionName) return true;
                else return false;
            } else if (o.route && functionName) {
                if (o.route === functionName) return true;
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

    async checkRoutes(event) {
        if(!event.data) return;
        let route = this.routes.get(event.data.foo) ?? this.routes.get(event.data.route) ?? this.routes.get(event.data.functionName)
        if (!route) route = this.routes.get(event.data.foo)
        if (route){
              if (event.data.message) return await route.callback(this, event.data.message, event.data.origin);
              else return
        } else return false
    }
    
    dynamicImport = async (url) => {
        let module = await import(url);
        return module;
    }
}

export {Router}
export default Router