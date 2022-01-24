import StateManager from 'anotherstatemanager'
import { createRoute } from './general.utils'
import { getParamNames } from './parse.utils'
import { randomId,  } from './id.utils'
import { Events } from './Event'
import { AllMessageFormats, MessageObject, MessageType, RouteConfig, UserObject } from 'src/common/general.types';
import { Service } from './Service';
import { safeStringify } from './parse.utils';
import { SubscriptionService } from './SubscriptionService';

export const DONOTSEND = 'DONOTSEND';

// */ Router 
// A class for handling arbitrary commands (loaded from custom services)
// through networking protocols including HTTP, Websockets, OSC, and others.
//
// --------------- Route Structure ------------------
// **/
//  Default routes supplied by the Router.routes attribute
//
// */[service]
//  Additional core routes specified by services loaded into the session
//
// */[client_id]
//  Custom routes specified by clients (to implement...)
//

export class Router {
  id: string = randomId()

  // Backend
  USERS: Map<string, UserObject> = new Map(); //live sockets and basic user info
  EVENTS = new Events();
  EVENTSETTINGS = [];
  SUBSCRIPTIONS: Function[] = [] // an array of handlers (from services)
  DEBUG: boolean;

  // TODO: Detect changes and subscribe to them
  SERVICES: {
    client: {
      available: {[x:string]: string},
      clients: {[x:string]: any},
      connecting: {[x:string]: Function},
      subscribeQueue: Function[],
      subscriptions: string[]
  }, // TODO: Detect changes and subscribe to them
    server: Map<string, any>
  } = {
    client: {
      available: {},
      clients: {},
      connecting: {},
      subscribeQueue: [],
      subscriptions: []
    }, 
    server: new Map()
  }

  ROUTES: {[x: string] : RouteConfig} = {} // Internal Routes Object
  INTERVAL=10;
  STATE:StateManager;

  DEFAULTROUTES = [
    {   
      route: 'ping',
      callback:() => {
          return 'pong';
      }
  },
  { //return a list of services available on the server
    route: 'services', callback: (Router, args, origin) => {
      let list = [];
      Router.SERVICES.server.forEach((o,k) => {
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
    route: 'routes', 
    reference: this.ROUTES,
    callback: (Router, args, origin) => {
      // let list = [];
      // for (let route in this.ROUTES){
      // const o = this.ROUTES[route]
      // // this.ROUTES.forEach((o) => {
      //   if (!o.private) list.push({
      //     route: o.route,
      //     args: getParamNames(o.callback)
      //   });
      // }
      // if (args[0] === true) console.log('Server routes available: ', list); //list available functions
      console.log('TRYING')
      return {message: Router.ROUTES};
    }
  },
  { //generic send message between two users (userId, message, other data)
      route:'sendMessage',
      aliases:['message','sendMsg'],
      callback:(Router,args)=>{
          return Router.sendMsg(args[0],args[1],args[2]);
      }
  },
  { //set user details for yourRouter
      route:'setUserServerDetails',
      callback:(Router,args,origin)=>{
        let user = Router.USERS.get(origin)
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
  { //assign user props for yourRouter or someone else (by user unique id)
      route:'setProps',
      callback:(Router,args,origin)=>{
        let user = Router.USERS.get(origin)
        if (!user) return false
        if(typeof args === 'object' && !Array.isArray(args)) {
          Object.assign(user.props,args);
          return true;
        }
        else if (Array.isArray(args) && typeof args[1] === 'object') {
          let u = Router.USERS.get(args[0]);
          if(u) Object.assign(u.props,args[1]);
          return true;
        }
        return false;
      }
  },
  { //get props of a user by id or of yourRouter
      route:'getProps',
      callback:(Router,args,origin)=>{
        let user = Router.USERS.get(origin)
        if (!user) return false
  
        if(args[0]) {
          let u = Router.USERS.get(args[0]);
          if(u) return u.props;
        }
        else return user.props;
      }
  },
  { //lists user keys
    route:'listUsers',
    callback:(Router)=>{
      return Array.from(Router.USERS.keys());
    }
  },
  { //lists user keys
    route:'blockUser',
    callback:(Router,args,origin)=>{
      let user = Router.USERS.get(origin)
      if (!user) return false
      return this.blockUser(user,args[0]);
    }
  },
  { //get basic details of a user or of yourRouter
      route:'getUser',
      callback:(Router,args,origin)=>{
        let user = Router.USERS.get(origin)
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
    callback: async (Router, args, origin) => {
      let u = await Router.addUser(...args)
      return { message: u, id: u.id }
    }
  },
  {
    route:'logout',
    aliases:['removeUser','endSession'],
    callback:(Router,args,origin) => {
      let user = Router.USERS.get(origin)
        if (!user) return false
      if(args[0]) Router.removeUser(...args)
      else Router.removeUser(user);
    }
  },
  ]

  // Frontend
  currentUser: Partial<UserObject>
    

  subscription?: SubscriptionService // Single Subscription per Router (to a server...)
  remote?: URL

  protocols: {
      http?: SubscriptionService
      websocket?: SubscriptionService
  } = {}

  // -------------------- User-Specified Options --------------------
  OPTIONS: {
    debug?:boolean 
    safe?:boolean
    interval?:number
    user?: Partial<UserObject>
  } = {
    debug: false,
    user: {}
  }

    constructor(options={}) {
		
        Object.assign(this.OPTIONS, options)

        if(this.OPTIONS.interval) this.INTERVAL = this.OPTIONS.interval;

        this.currentUser = this.OPTIONS.user;
        // Add a persistent ID
        if (this.currentUser.id) this.currentUser._id = this.currentUser.id
        if (!this.currentUser._id) this.currentUser._id = randomId('user')

        this.STATE = new StateManager(
          {},
          this.INTERVAL,
          undefined //false
        );

        this.DEBUG = this.OPTIONS.debug;

        // console.log(global)
        // Browser-Only
        if (global.onbeforeunload){
          global.onbeforeunload = () => {
              this.logout()
          }
        }

        // Load Default Routes
        this.load({routes: this.DEFAULTROUTES})

        if(this.DEBUG) this.runCallback('routes', [true])
    }



    // -----------------------------------------------
    // 
    // Frontend Methods (OG)
    // 
    // -----------------------------------------------
    setRemote = async (base:string, path:string) => {
      this.remote = (path) ? new URL(path, base) : new URL(base)

      // Register User on the Server
      if (this.remote) {
          await this.getServices()
          this.login() // Login user to connect to new remote
      }
  }

  getServices = async () => {
      let res = await this.send('services')
      if (res) {
          res?.forEach(o => {
              const name = o.name.replace('Service', '')
              this.SERVICES.client.available[o.name] = o.route
  
              // Resolve Load Promises
              if (this.SERVICES.client.connecting[name]){
                  this.SERVICES.client.connecting[name](o)
                  delete this.SERVICES.client.connecting[name]
              }

              if (this.SERVICES.client.clients[name] instanceof SubscriptionService){
                  this.SERVICES.client.subscribeQueue.forEach(f => f())
              }
          })
      }
  }

  connect = (service: Service, name=service?.name) => {

      return new Promise(resolve => {

        const name = service.constructor.name.replace('Client', '')

          this.SERVICES.client.clients[name] = service
          const toResolve = (available) => {

              // Expect Certain Callbacks from the Service
              service.routes.forEach(o => {
                  this.ROUTES[`${available.route}/${o.route}`] = o
              })
              resolve(service)
          }

          // Auto-Resolve if Already Available
          const available = this.SERVICES.client.available[name]
          if (available) toResolve(available)
          else this.SERVICES.client.connecting[name] = toResolve

          // NOTE: This is where you listen for service.notify()
          service.subscribe(async (o:MessageObject, _:MessageType) => {
              const available = this.SERVICES.client.available[name]
              // Check if Service is Available
              if (available) return await this.send(`${available}/${o.route}`, ...o.message) // send automatically with extension
          })

      })

  }

    async login(callback=(result)=>{}) {
      if(this.currentUser) {
          let res = await this.send('login', this.currentUser)
          callback(res)
          return res
      }
  }

  async logout(callback=(result)=>{}) {
      if(this.currentUser) {
          let res = await this.send('logout')
          callback(res)
          return res
      }
  }


  send = async (route:string, ...args:any[]) => {

      if (this.remote){
          let response;

          // Send over Websockets if Active
          if (this.protocols.websocket){
              response = await this.protocols.websocket.send({id: this.currentUser._id, route, message: args}, {suppress: true}) // NOTE: Will handle response in the subscription too
          } 
          
          // Default to HTTP
          else {

              response = await fetch(createRoute(route, this.remote), {
                  method: 'POST',
                  mode: 'cors', // no-cors, *cors, same-origin
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: safeStringify({id: this.currentUser._id, message: args, suppress: !!this.subscription})
              }).then(async (res) => {
                  const json = await res.json()
                  if (!res.ok) throw json.message
                  else return json
              }).catch((err) => {
                  throw err.message
              })
          }

          // Activate Internal Routes if Relevant (currently blocking certain command chains)
          if (!response.block) this.ROUTES[response?.route]?.callback(response.message) // TODO: Monitor what is outputted to chain calls?

          // Notify through Subscription (if not suppressed)
          if (!response.suppress) this.subscription?.responses?.forEach(f => f(response))
          
          // Pass Back to the User
          return response.message

      } else throw 'Remote is not specified'
  }

  createSubscription = async (options:any, onmessage:any) => {
          let toResolve =  (): Promise<any> => {
              return new Promise(async resolve => {

                  for (let name in this.SERVICES.client.clients) {
                    const client = this.SERVICES.client.clients[name]
                    if ((options.protocol == null || options.protocol === client.name) && this.SERVICES.client.available[client.service]) {
                      let subscriptionEndpoint = `${this.SERVICES.client.available[client.service]}/subscribe`
                      let msg;
                      if (!this.subscription){
                          client.setRemote(this.remote)
                          msg = await client.add(this.currentUser, subscriptionEndpoint)
                          this.subscription = this.protocols[client.name] = client
                          this.subscription.addResponse('sub', onmessage)
                      } 

                      this.send(subscriptionEndpoint, options.routes, msg) // Second argument specified by add callback

                      resolve(this.subscription)
                      return
                    }
                  }

                  this.SERVICES.client.subscribeQueue.push(async () => {
                      let res = await toResolve()
                      resolve(res)
                  })
              })
              }
          return await toResolve()
  }

  subscribe = async (callback: Function, options?: {
      protocol?:string
  }) => {

      if (this.remote) {

          return await this.createSubscription(options, (event) => {
              const data = (typeof event.data === 'string') ? JSON.parse(event.data) : event
              callback(data) // whole data object (including route)
              if (!data.block) this.ROUTES[data?.route]?.callback(data) // Run internal routes (if required)
          })
          
      } else throw 'Remote is not specified'

  }

  unsubscribe = (id, route?) => {
      if (id){
          throw 'Unsubscribe not implemented'
      }
  }

    // -----------------------------------------------
    // 
    // Backend Methods (OG)
    // 
    // -----------------------------------------------


    load(service:any, name:string = service.name) {

      console.log('New Service', name)
      
      this.SERVICES.server.set(name, service)

        service.routes?.forEach(o => {
          // const cases = [o.route, ...(o.aliases) ? o.aliases : []]
          //   cases.forEach(k => {
              const route = `${(name) ? `${name}/` : ''}` + o.route
              this.addRoute(Object.assign({
                route,
                service: name,
            }, o))
        // })
      })

      if (service.subscribe) {
        service.subscribe((o:MessageObject, type?:MessageType) => {
          return this.handleMessage(o, type)
        })
      }

      if (service.updateSubscribers) {
          this.SUBSCRIPTIONS.push(service.updateSubscribers)
      }

    }


    async runRoute(route="",args:any[]|{eventName?:string}=[], origin, callbackId?) {

      try { //we should only use try-catch where necessary (e.g. auto try-catch wrapping unsafe functions) to maximize scalability
        if(!route) return; // NOTE: Now allowing users not on the server to submit requests
        if(this.DEBUG) console.log('route', route);

        let isEvent = false;
        if(typeof args === 'object') { //pipe events to the event manager system
          if((args as any).eventName) {
            this.EVENTS.callback(args);
            isEvent = true;
          }
        }
        if(!isEvent) {
          return await this.runCallback(route,(args as any),origin).then((dict:MessageObject|any) => {
            
            // Convert Output to Message Object
            if (typeof dict !== 'object' || !('message' in dict)) dict = {
              message: dict
            }
            if (!dict.route) dict.route = route
            dict.callbackId = callbackId

            if (this.ROUTES[dict.route]) dict.block = true // Block infinite command chains... 

            // Pass Out

            if(dict.message === DONOTSEND) return dict;
            return dict;
          }).catch(console.error)
        }
      } catch (e) {
        return new Error(`Route failed...`)
      }
  }

  // Track Users Connected to the LiveServer
  addUser(userinfo:Partial<UserObject>={}) {

    // Grab Proper Id
    let id = randomId('user');
    if(userinfo.id) {
      userinfo._id = userinfo.id;
      id = userinfo.id;
    }
    else if (userinfo._id) {
      userinfo.id = userinfo._id;
      id = userinfo._id;
    }

    // Get Current User if Exists
    const u = this.USERS.get(id);
    
    let newuser: UserObject = u ?? {
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

    if(this.DEBUG) console.log('Adding User, Id:', id);

    this.USERS.set(id, newuser);

    //add any additional properties sent. remote.service has more functions for using these

    this.SERVICES.server.forEach(s => {
      const route = s.name + '/addUser'
      if (this.ROUTES[route]) this.runRoute(route, [userinfo], id) // TODO: Fix WebRTC
    })

    return newuser; //returns the generated id so you can look up
  }

  removeUser(user:string|UserObject) {
    let u = (typeof user === 'string') ? this.USERS.get(user) : user
    
    if(u) {

      
        this.SERVICES.server.forEach(s => {
          const route = s.name + '/removeUser'
          if (this.ROUTES[route]) this.runRoute(route, [u], u.id) // TODO: Fix WebRTC
        })

        this.USERS.delete(u._id);
        return true;
    } 
    return false;
  }

  //adds an id to a blocklist for access control
  blockUser(user:UserObject, userId='') {
    if(this.USERS.get(userId)) {
      if(!user.blocked.includes(userId) && user.id !== userId) { //can't block Router 
        user.blocked.push(userId);
        return true;
      }
    }
    return false;
  }

  triggerSubscriptions = (msg:MessageObject) => {
    return this.SUBSCRIPTIONS.forEach(o => o(this, msg))
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
          res.suppress = o.suppress // only suppress when handling messages here

          // Handle Subscription Updates based on Internal Notifications
          if (internal){
            this.triggerSubscriptions(res)
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
          if(u) {
            u.send(toSend)
          }
      } else if (typeof user === 'object') {
        user.send(toSend);
        return true;
      }
      return false;
  }

    addRoute(o: RouteConfig) {
      o = Object.assign({}, o)

      const cases = [o.route, ...(o.aliases) ? o.aliases : []]
      delete o.aliases
      cases.forEach(route => {
            if(!route || !o.callback) return false;
            route = o.route = `${(o.service) ? `${o.service}/` : ''}` + route
            this.removeRoute(route); //removes existing callback if it is there
            if (route[0] === '/') route = route.slice(1)
            o.args = getParamNames(o.callback)
            this.ROUTES[route] = Object.assign({}, o)
            this.ROUTES[route].route = route
            if (o.reference) {
              this.STATE.setState({[route]: o.reference});
              this.STATE.subscribe(route, (message) => {
                this.SUBSCRIPTIONS.forEach(o => o(this, {
                  route, 
                  message
                }))
              })

              delete this.ROUTES[route].reference // scrub reference
            }
        })
        return true;
    }

    removeRoute(functionName) {
        return delete this.ROUTES[functionName]
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

          if (this.ROUTES[route]) {
            let routeInfo = this.ROUTES[route]
            try {
              const res = await routeInfo?.callback(...[this, input, origin])
              if (routeInfo.service && res?.route) res.route = `${routeInfo.service}/${res.route}` // Correct Route
              // if (routeInfo.reference) state.setState(route, res.message)
              resolve(res)
            } catch(e) {
              console.log('Callback Failed: ', e)
            }
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
        let route = this.ROUTES[event.data.foo] ?? this.ROUTES[event.data.route] ?? this.ROUTES[event.data.functionName]
        if (!route) route = this.ROUTES[event.data.foo]
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

export default Router