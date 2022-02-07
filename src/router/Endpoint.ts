import { EndpointConfig, RouteSpec, RouteConfig, MessageType, MessageObject, UserObject } from '../common/general.types';
import { SubscriptionService } from './SubscriptionService';
import { safeStringify } from '../common/parse.utils';
import { createRoute } from '../common/general.utils';
import Router from './Router';
// import { Service } from './Service';
import { randomId , pseudoObjectId} from '../common/id.utils';

// Load Node Polyfills
try {
    if(typeof process === 'object') { //indicates node
        // NODE = true
        const polyFetch = require('node-fetch-polyfill')
        if (typeof fetch !== 'function') {
          globalThis.fetch = polyFetch
        }
    }
} catch (err) {}

export class Endpoint{

    id: string = null
    target: URL = null
    type: string = null
    link: Endpoint = null

    credentials: Partial<UserObject> = {}

    connection?: {
        service: SubscriptionService,
        id: string, // Idenfitier (e.g. for which WebSocket / Worker in service)
        protocol: string;
    } = null

    services: {
        available: {[x:string]: string},
        connecting: {[x:string]: Function},
        queue: {
            [x:string]: Function[]
        },
        // subscriptions: string[]
    } = {
        available: {},
        connecting: {},
        queue: {}
    }

    router: Router = null
    clients: {[x:string]: any} = {} // really resolve Functions OR Service instances
    user: string = pseudoObjectId() // Random User Identifier
    status: boolean = false
    responses: {[x:string]: Function} = {}


    // Interface for Sending / Receiving Information
    constructor(config: EndpointConfig, clients?, router?:Router){

        let target, type;
        if (typeof config === 'object'){
          if (config instanceof URL) target = config
          else {
            target = config.target
            type = config.type
            this.link = config.link 
            this.setCredentials(config.credentials)

            // Use Link to Communicate with an Additional Endpoint Dependency
            // if (this.link) {
            //     this.link?.connection?.service?.addResponse(this.id,(res) => {
            //         console.log('Listen to the Link',res)
            //     })
            // }
          }

        } else target = config

        if (!type) type = 'server'
        if (!this.link) this.link = this

        if (type === 'server') {
            target = (target instanceof URL) ? target : new URL(target) // Convert to URL
            this.id = target.origin
        } else {
            this.id = target
        }

        this.target = target
        this.type = type

        this.router = router
        if (clients) this.clients = clients
    }

    setCredentials = (o?:Partial<UserObject>) => {

        // Fill in the details if enough is provided
        if (o && (o._id || o.id)) this.credentials = {
            _id: o._id ?? pseudoObjectId(),
            id: o.id || o._id
        }
    }

    check = async () => {

        if (this.type === 'webrtc'){

            // if (!this.link || this.link === this){
            //     console.log('no link', this.link)
            // }

            await this._subscribe({ protocol: 'webrtc', force: true }).then(res => {
                this.status = true
            }).catch(e => console.log(`Link doesn't have WebRTC enabled.`, e))
        }
        

        let res = await this.send('services').then(res => {
            this.status = true
            return res
        }).catch(async (e) => {

            // Fallback to WS (server types only)
            if (this.type === 'server'){
                console.log('Falling back to websockets')
                await this._subscribe({protocol: 'websocket', force: true}).then(res => {
                        this.status = true
                        return res
                    })
                return await this.send('services')
            }

          })

          if (res) {
    
            const routes = res.message[0]
              let serviceNames = []

              for (let route in routes){
                  const className = routes[route]
                  const name = className.replace(/Backend|Service/, '').toLowerCase()
                  this.services.available[name] = route
                  serviceNames.push(name)

                  // Resolve Router Loading Promises
                  if (this.router?.SERVICES?.[name]?.status instanceof Function) this.router.SERVICES[name].status(route)
    
                  if (this.clients[name] instanceof SubscriptionService){
                      this.services.queue[name]?.forEach(f => f())
                      this.services.queue[name] = []
                  }
              }
    
              // General Subscription Check
              this.services.queue['undefined']?.forEach(f => f())
              this.services.queue['undefined'] = []
          }

          return res?.message
    }

    // Send Message to Endpoint (mirror linked Endpoint if necessary)
    send = async (route:RouteSpec, o: Partial<MessageObject> = {}, endpoint:Endpoint = this) => {



        // Support String -> Object Specification
        if (typeof route === 'string')  o.route = route
        else {
            o.route = route.route
        } 

        o.suppress = !!this.connection

        // Get Response
        let response;

        // create separate options object
        const opts = {
            suppress: o.suppress,
            id: endpoint.link.connection?.id
        }
        
        // WS
        if (endpoint.connection?.protocol === 'websocket') {
            o.id = endpoint.link.credentials?.id // Link ID
            response = await endpoint.link.connection.service.send(o as MessageObject, opts)
        }

        // WebRTC (direct = no link)
        else if (endpoint?.connection?.protocol === 'webrtc') {
            o.id = endpoint.credentials?.id || endpoint.link.credentials?.id // This ID / Link ID
            response = await endpoint.connection.service.send(o as MessageObject, opts) 
        }

        // HTTP
        else {

            console.log(endpoint.link.credentials)
            o.id = endpoint.link.credentials?.id // Link ID
            if (!o.method) o.method = (o.message?.length > 0) ? 'POST' : 'GET'

            const toSend: any = {
                method: o.method.toUpperCase(),
                mode: 'cors', // no-cors, *cors, same-origin
                headers: {
                    'Content-Type': 'application/json',
                },
            }
  
              if (toSend.method != 'GET') toSend.body = safeStringify(o)

              response = await fetch(createRoute(o.route, endpoint.link.target), toSend).then(async (res) => {
                    return await res.json().then(json => {
                      if (!res.ok) throw json.message
                      else return json
                    }).catch(async (err)  => {
                      throw 'Invalid JSON'
                    })
                }).catch((err) => {
                    throw err.message
                })
        }

        if (response && !response?.route) {
            response.route = o.route // Add send route if none provided
            response.block = true // Block if added
        }

        return response
    }

    _subscribe = async (opts:any={}) => {
            let toResolve =  (): Promise<any> => {
                return new Promise(async resolve => {

                    let clientName = opts.protocol ?? this.type

                  let servicesToCheck = (clientName) ? [this.clients[clientName]] : Object.values(this.clients)
                  

                  servicesToCheck.forEach(async client => {
  
                      if (
                          opts.force || // Required for Websocket Fallback
                          (client.status === true && (client instanceof SubscriptionService))
                        ) {

                        let subscriptionEndpoint = `${this.link.services.available[client.service] ?? client.name.toLowerCase()}/subscribe`
                                
                        client.setEndpoint(this.link) // Bind Endpoint to Subscription Client
                    
                        // Note: Only One Subscription per Endpoint
                        if (!this.connection){
                            const target = (this.type === 'server') ? new URL(subscriptionEndpoint, this.target) : this.target
                            
                            const id = await client.add(this.credentials, target.href) // Pass full target string

                            // Always Have the Router Listen
                            if (this.router){
                                client.addResponse('router', (o) => {
                                    const data = (typeof o === 'string') ? JSON.parse(o) : o 
                                    Object.values(this.responses).forEach(f => {
                                        f(data)
                                    })
                                    if (this.router) this.router.handleLocalRoute(data)
                                })
                            }

                            this.connection = {
                                service: client,
                                id,
                                protocol: client.name,
                            }
                        }
  
                        // Filter Options to get Message Object
                        if (this.type === 'webrtc') {
                            opts.routes = [this.target] // Connect to Target Room / User only
                        }
                        const res = await this.send(subscriptionEndpoint, Object.assign({
                            route: opts.route,
                            message: opts.message,
                            protocol: opts.protocol,
                        }, {
                          message: [opts.routes, this.connection.id] // Routes to Subscribe + Reference ID
                        }), this.link)

                        resolve(this.connection)
                        return
                      }
                    })
  
                    if (!this.services.queue[clientName]) this.services.queue[clientName] = []
                    this.services.queue[clientName].push(async () => {
                        let res = await toResolve()
                        resolve(res)
                    })
                })
            }
            return await toResolve()

    }

    subscribe = (callback) => {
        if (callback){
            let id = randomId('response')
            this.responses[id] = callback
            return id
        }
    }

    unsubscribe = (id) => {
        if (id) delete this.responses[id]
        else this.responses = {}
    }
}