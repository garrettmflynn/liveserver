import StateManager from 'anotherstatemanager'
import { createRoute, getRouteMatches } from '../common/general.utils'
import { randomId,  } from '../common/id.utils'
import { AllMessageFormats, EndpointType, FetchMethods, MessageObject, MessageType, RouteConfig, RouteSpec, UserObject } from '../common/general.types';
import { Service } from './Service';
import { safeStringify, getParamNames } from '../common/parse.utils';
import { SubscriptionService } from './SubscriptionService';
import errorPage from '../services/http/404'

export const DONOTSEND = 'DONOTSEND';
export let NODE = false

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

// Load Node Polyfills
try {
    if(typeof process === 'object') { //indicates node
        NODE = true
        const polyFetch = require('node-fetch-polyfill')
        if (typeof fetch !== 'function') {
          globalThis.fetch = polyFetch
        }
    }
} catch (err) {}

export class Router {
  id: string = randomId()

  // Backend
  USERS: Map<string, UserObject> = new Map(); //live sockets and basic user info
  CONNECTIONS: Map<string,{}> = new Map(); //threads or other servers
  SUBSCRIPTIONS: Function[] = [] // an array of handlers (from services)
  DEBUG: boolean;
  ENDPOINTS: Map<string, EndpointType> = new Map()

  // TODO: Detect changes and subscribe to them
  SERVICES: {
    client: {
      available: {[x:string]: string},
      clients: {[x:string]: any},
      connecting: {[x:string]: Function},
      subscribeQueue: Function[],
      subscriptions: string[]
  }, // TODO: Detect changes and subscribe to them
    server: {[x:string] : any}
  } = {
    client: {
      available: {},
      clients: {},
      connecting: {},
      subscribeQueue: [],
      subscriptions: []
    }, 
    server: {}
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
    route: 'services', 
    reference: {
      object: this.SERVICES.server,
      transform: (reference) => {
        let dict = {};
        for (let k in reference){
          const o = reference[k]
          if (o instanceof Service) dict[k] = o.constructor.name;
        }
        return dict;
      }
    },
    // callback: (Router, args, origin) => {
    //   let list = [];
    //   for (let k in Router.SERVICES.server){
    //     const o = Router.SERVICES.server[k]
    //     if (k) list.push({
    //       route: k,
    //       name: o.constructor.name
    //     });
    //   }
    //   if (args[0] === true) console.log('Services available: ', list); //list available functions
    //   return list;
    // }
  },
  { //return a list of function calls available on the server
    route: '/',
    aliases: ['routes'] ,
    reference: {
      object: this.ROUTES,
      transform: (reference, args) => {
        let o = {}
        for (let key in reference){
          if (key && !key.includes('*')) o[key] = {
            route: reference[key].route,
            args: reference[key].args,
          } // Shallow copy
        }
        return o
      }
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
    route: 'users',
    reference: {
      object: this.USERS,
      transform: (o) => {

        let dict = {}
        o.forEach((u,k) => {
          dict[k] = {
            _id:u._id,
            username:u.username,
            origin:u.origin,
            props:u.props,
            updatedPropNames:u.updatedPropNames,
            lastUpdate:u.lastUpdate,
            lastTransmit:u.lastTransmit,
            latency:u.latency
          }
        })
        return dict
      }
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

        // Browser-Only
        if (globalThis.onbeforeunload){
          globalThis.onbeforeunload = () => {
            this.ENDPOINTS.forEach(e => this.logout(e))
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
    addRemote = (base:string, path:string) => {
      const id = randomId('endpoint')
      const url = (path) ? new URL(path, base) : new URL(base)

      // Register User on the Server
      if (url) {

          this.ENDPOINTS.set(id, {
            remote: url,
          })
          this.getServices(id)
          this.login(url) // Login user to connect to new remote
      }
      return id
  }

  removeRemote = async (id) => {
    this.logout(this.ENDPOINTS.get(id))
    this.ENDPOINTS.delete(id)
  }

  getServices = async (id?) => {
      let res = await this.send({
        route: 'services',
        id
      }).catch(async (e) => {

        // Fallback to WS
        console.log('Falling back to Websocket protocol')
        await this.subscribe(() => {
          console.log('unused ws callback')
        }, {protocol: 'websocket', id, force: true})
        return await this.send({route: 'services', id})

      })

      if (res) {

          let serviceClassNames = []
          for (let route in res){
              const className = res[route]
              const name = className.replace('Service', '')
              this.SERVICES.client.available[className] = route
              serviceClassNames.push(className)
  
              // Resolve Load Promises
              if (this.SERVICES.client.connecting[name]){
                  this.SERVICES.client.connecting[name](route)
                  delete this.SERVICES.client.connecting[name]
              }

              if (this.SERVICES.client.clients[name] instanceof SubscriptionService){
                  this.SERVICES.client.subscribeQueue.forEach(f => f())
              }
          }
      }
  }

  connect = (service: Service, name=service?.name) => {

      return new Promise(resolve => {

        const name = service.constructor.name.replace('Client', ''); //redundant?

          this.SERVICES.client.clients[name] = service
          const toResolve = (route) => {

              // Expect Certain Callbacks from the Service
              service.routes.forEach(o => {
                  this.ROUTES[`${route}/${o.route}`] = o
              })
              resolve(service)
          }

          // Auto-Resolve if Already Available
          const available = this.SERVICES.client.available[name]
          if (available) toResolve(available)
          else this.SERVICES.client.connecting[name] = toResolve;

          let worker = false;
          if(name.includes('worker')) worker = true;

          // NOTE: This is where you listen for service.notify()
          service.subscribe(async (o:MessageObject, _:MessageType) => {
              // Check if Service is Available
              const available = this.SERVICES.client.available[name];
              
              if (available) {
                return await this.send(`${available}/${o.route}`, ...o.message) // send automatically with extension
              }
          })

      })

  }

    async login(remote?, callback=(result)=>{}) {
      if(this.currentUser) {
          let res = await this.send({
            route: 'login',
            remote
          }, this.currentUser)
          callback(res)
          return res
      }
  }

  async logout(remote?, callback=(result)=>{}) {
      if(this.currentUser) {
          let res = await this.send({
            route: 'logout',
            remote
          })
          callback(res)
          return res
      }
  }
  
  get = (routeSpec:RouteSpec, ...args:any[]) => {
    return this._send(routeSpec, 'GET', ...args)
  }

  delete = (routeSpec:RouteSpec, ...args:any[]) => {
    return this._send(routeSpec, 'DELETE', ...args)
  }

  post = (routeSpec:RouteSpec, ...args:any[]) => {
    return this._send(routeSpec, 'POST', ...args)
  }

  send = this.post


  private _send = async (routeSpec:RouteSpec, method?: FetchMethods, ...args:any[]) => {

      const route = (typeof routeSpec === 'string') ? routeSpec : routeSpec.route // Support object-based specs
      const endpoint = ((typeof routeSpec === 'string') ? this.ENDPOINTS.values().next().value : (routeSpec?.remote) ? {remote: routeSpec?.remote} : (this.ENDPOINTS.get(routeSpec?.id) ?? this.ENDPOINTS.values().next().value)) as EndpointType
      const remote = endpoint.remote

      if (remote && route){
          let response;
          if (!method) method = (args.length > 0) ? 'POST' : 'GET'

          // Send over Websockets if Active
          if (endpoint.type === 'websocket'){
              response = await endpoint.subscription.send({id: this.currentUser.id, route, message: args, method}, {suppress: true, remote}) // NOTE: Will handle response in the subscription too
          } 
          
          // Default to HTTP
          else {
            const toSend: any= {
              method: method.toUpperCase(),
              mode: 'cors', // no-cors, *cors, same-origin
              headers: {
                  'Content-Type': 'application/json',
              },
          }

            if (toSend.method != 'GET') toSend.body = safeStringify({id: this.currentUser._id, message: args, suppress: !!endpoint.subscription})

              response = await fetch(createRoute(route, remote), toSend).then(async (res) => {
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
          if (!response.suppress && endpoint.subscription) endpoint.subscription?.responses?.forEach(f => f(response))
          
          // Pass Back to the User
          return response?.message

      } else throw 'Remote is not specified'
  }

  createSubscription = async (options:any = {}, onmessage:any) => {
          let toResolve =  (): Promise<any> => {
              return new Promise(async resolve => {

                  for (let name in this.SERVICES.client.clients) {
                    const client = this.SERVICES.client.clients[name]
                    if ((options.protocol == null || options.protocol === client.name) && (options.force || this.SERVICES.client.available[client.service])) {
                      let subscriptionEndpoint = `${this.SERVICES.client?.available[client.service] ?? name.toLowerCase()}/subscribe`
                      let msg;
                      const endpoint = (options.id ? this.ENDPOINTS.get(options.id) : ((options.remote) ? {remote: options.remote} : this.ENDPOINTS.values().next().value)) as EndpointType
                      
                      if (!endpoint.subscription){
                          client.setRemote(endpoint.remote)
                          const url = new URL(subscriptionEndpoint, endpoint.remote)
                          msg = await client.add(this.currentUser, url)
                          endpoint.subscription = client
                          endpoint.subscription.addResponse('sub', onmessage)
                          endpoint.type = client.name
                      } 

                      this.send(Object.assign(options, {
                        route: subscriptionEndpoint
                      }), options.routes, msg) // Second argument specified by add callback

                      resolve(endpoint.subscription)
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

  subscribe = async (callback: Function, options: {
      protocol?:string
      routes?: string[]
      id?: string,
      remote?: string | URL,
      force?:boolean
  } = {}) => {
      if (this.ENDPOINTS.size > 0 || options?.remote) {

          return await this.createSubscription(options, (event) => {
              const data = (typeof event.data === 'string') ? JSON.parse(event.data) : event
              callback(data) // whole data object (including route)
              const routeCallback = this.ROUTES[data?.route]?.callback
              if (!data.block && routeCallback instanceof Function) routeCallback(data) // Run internal routes (if required)
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
      
      this.SERVICES.server[name] = service

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
        service.subscribe(async (o:MessageObject, updateSubscribers?:MessageType, origin?:string|undefined) => {
          let res = this.handleMessage(o, updateSubscribers);
          if(origin?.includes('worker')) { 
            res = await res; //await the promise to resolve it
            if(res !== null && service[origin]) service[origin].postMessage({route:'worker/workerPost', message:res, origin:service.id, callbackId:o.callbackId})
            else return res;
          }
          return res;
        })
      }

      if (service.updateSubscribers) {
          this.SUBSCRIPTIONS.push(service.updateSubscribers)
      }

    }


    async runRoute(route, method: FetchMethods, args:any[]=[], origin, callbackId?) {

      try { //we should only use try-catch where necessary (e.g. auto try-catch wrapping unsafe functions) to maximize scalability
        if(route == null) return; // NOTE: Now allowing users not on the server to submit requests
        if (!method && Array.isArray(args)) method = (args.length > 0) ? 'POST' : 'GET'
        if(this.DEBUG) console.log('route', route);


          return await this.runCallback(route, (args as any), origin, method).then((dict:MessageObject|any) => {
            
            // Convert Output to Message Object
            if (typeof dict !== 'object' || !('message' in dict)) dict = {
              message: dict
            }
            if (!dict.route) dict.route = route
            dict.callbackId = callbackId

            if (this.ROUTES[dict.route]) dict.block = true // Block infinite command chains... 

            // Pass Out

            if(dict.message === DONOTSEND) return;
            return dict;
          }).catch(console.error)
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

    for (let key in this.SERVICES.server){
        const s = this.SERVICES.server[key]
        const route = s.name + '/addUser'
        if (this.ROUTES[route]) this.runRoute(route, 'POST', [userinfo], id) 
    }

    return newuser; //returns the generated id so you can look up
  }

  removeUser(user:string|UserObject) {
    let u = (typeof user === 'string') ? this.USERS.get(user) : user
    
    if(u) {

      
        this.SERVICES.server.forEach(s => {
          const route = s.name + '/removeUser'
          if (this.ROUTES[route]) this.runRoute(route, 'DELETE', [u], u.id) // TODO: Fix WebRTC
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
     
  handleMessage = async (msg:AllMessageFormats, updateSubscribers?:MessageType) => {

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
      

      if(o.route != null) {
        
        let u = this.USERS.get(o.id)

        console.log('runRoute', o.route)
        // Handle Subscription Updates based on updateSubscribers Notifications
        if (updateSubscribers) this.triggerSubscriptions(o as MessageObject)

        let res = await this.runRoute(o.route, o.method, o.message, u?.id ?? o.id, o.callbackId);
        if (o.suppress) res.suppress = o.suppress // only suppress when handling messages here

        // Handle Subscription Updates based on Internal Notifications
        
        return res;
      }
    }
    return null;

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
            if(!route || (!o.callback && !o.reference)) return false;
            route = o.route = `${(o.service) ? `${o.service}/` : ''}` + route
            this.removeRoute(route); //removes existing callback if it is there
            if (route[0] === '/') route = route.slice(1)
            o.args = getParamNames(o.callback)

            this.ROUTES[route] = Object.assign({}, o)
            this.ROUTES[route].route = route
            
            if (o.reference) {
              route = route.split('/').filter(a => a != '*' && a != '**').join('/')
              this.STATE.setState({[route]: o.reference?.object ?? o.reference});

              // TODO: Drill subscriptions automatically...
              this.STATE.subscribe(route, (data) => {
                const message = (o.reference?.transform) ? o.reference.transform(data) : data
                this.SUBSCRIPTIONS.forEach(o => o(this, {
                  route, 
                  message
                }))
              })
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
      method=(input.length > 0) ? 'POST' : 'GET',
    ) {

      return new Promise(async resolve => {
        // Get Wildcard Possibilities
        let possibilities = getRouteMatches(route)

        let errorRes = {route: route, message: {content: errorPage}, headers: {
          'Content-Type': 'text/html'
        }}

        // Iterate over Possibilities
        Promise.all(possibilities.map(async possibleRoute => {

          let routeInfo = this.ROUTES[possibleRoute]
          if (routeInfo) {
            try {
              let res;
              if (method.toUpperCase() === 'GET' || !routeInfo?.callback) {
                const split = route.split('/').filter(a => a != '*' && a != '**') // Remove wildcards
                const value = this.STATE.data[split[0]]
                if (value){
                  const args = split.slice(1)
                  let message = (routeInfo.reference?.transform) ? routeInfo.reference.transform(value) : value

                  // Auto-Drill on References
                  args.forEach((v,i) => {
                    message = message[v]
                  })

                  res = {route: route, message}
                } else res = errorRes
              } else if (routeInfo?.callback) {
                res  = await routeInfo?.callback(...[this, input, origin])
              } else res = errorRes

              if (routeInfo.service && res?.route) res.route = `${routeInfo.service}/${res.route}` // Correct Route
              // if (routeInfo.reference) state.setState(route, res.message)
              if (routeInfo.headers) res.headers = routeInfo.headers // e.g. text/html for SSR
              resolve(res)
            } catch(e) {
              console.log('Callback Failed: ', e)
            }
          }
        })).then(_ => resolve(errorRes))
      })
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
}

export default Router