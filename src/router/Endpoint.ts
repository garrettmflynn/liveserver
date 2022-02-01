import { EndpointConfig, RouteSpec, RouteConfig, MessageType, MessageObject } from '../common/general.types';
import { SubscriptionService } from './SubscriptionService';
import { safeStringify } from '../common/parse.utils';
import { createRoute } from '../common/general.utils';
import Router from './Router';
// import { Service } from './Service';
import { randomId } from '../common/id.utils';

export class Endpoint{

    id: string = null
    target: URL = null
    type: string = null
    link: Endpoint = null

    subscription: {
        service: SubscriptionService,
        id: string, // Idenfitier (e.g. for which WebSocket / Worker in service)
        protocol: string;
        responses: string[]
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
    user: string = randomId('user') // Random User Identifier
    status: boolean = false


    // Interface for Sending / Receiving Information
    constructor(config: EndpointConfig, clients?, router?:Router){

        let target, type;
        if (typeof config === 'object'){
          if (config instanceof URL) target = config
          else {
            target = config.target
            type = config.type
            this.link = config.link 

            // Use Link to Communicate with an Additional Endpoint Dependency
            // if (this.link) {
            //     this.link?.subscription?.service?.addResponse(this.id,(res) => {
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
        if (router) this.user = router.currentUser.id
    }

    check = async () => {

        if (this.type === 'webrtc'){

            // if (!this.link || this.link === this){
            //     console.log('no link', this.link)
            // }

            await this.subscribe((data) => {
                console.log('Dummy WebRTC Callback',data)
            }, {
                protocol: 'webrtc', 
            }).then(res => {
                this.status = true
            }).catch(e => {
                console.log(e, `Link doesn't have WebRTC enabled.`)
            })
        }

        let res = await this.send('services').then(res => {
            this.status = true
            return res
        }).catch(async (e) => {

            // Fallback to WS (server types only)
            if (this.type === 'server'){
                console.log('Falling back to websockets')
                await this.subscribe(
                    null, 
                    {protocol: 'websocket', force: true}
                ).then(res => {
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
                  const name = className.replace('Backend', '').toLowerCase()
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
    send = async (route:RouteSpec, o: Partial<MessageObject> = {}) => {


        // Support String -> Object Specification
        if (typeof route === 'string')  o.route = route
        else {
            o.route = route.route
        } 

        // Get Response
        let response;

        // create separate options object
        const opts = {
            suppress: o.suppress,
            id: this.link.subscription?.id
        }

        o.id = this.link.router?.currentUser?.id ?? this.link.user

        // WS
        if (this.subscription?.protocol === 'websocket') response = await this.link.subscription.service.send(o as MessageObject, opts) // NOTE: Will handle response in the subscription too

        // WebRTC
        else if (this?.subscription?.protocol === 'webrtc') response = await this.subscription.service.send(o as MessageObject, opts) // NOTE: Will handle response in the subscription too
        
        // HTTP
        else {

            if (!o.method) o.method = (o.message?.length > 0) ? 'POST' : 'GET'

            const toSend: any = {
                method: o.method.toUpperCase(),
                mode: 'cors', // no-cors, *cors, same-origin
                headers: {
                    'Content-Type': 'application/json',
                },
            }
  
              if (toSend.method != 'GET') toSend.body = safeStringify(o)

              response = await fetch(createRoute(o.route, this.link.target), toSend).then(async (res) => {
                    return await res.json().then(json => {
                      if (!res.ok) throw json.message
                      else return json
                    }).catch(async ()  => {
                      throw 'Invalid JSON'
                    })
                }).catch((err) => {
                    throw err.message
                })
        }

        if (response && !response?.route) response.route = o.route // Add send route if none provided
        return response
    }

    subscribe = async (callback, opts:any={}) => {
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
                        if (!this.subscription){
                            const target = (this.type === 'server') ? new URL(subscriptionEndpoint, this.target) : this.target
                            
                            const id = await client.add(this.router?.currentUser, target.href) // Pass full target string

                            // Always Have the Router Listen
                            if (this.router){
                                client.addResponse('router', (o) => {
                                    const data = (typeof o === 'string') ? JSON.parse(o) : o                        
                                    if (this.router) this.router.handleLocalRoute(data)
                                })
                            }

                            this.subscription = {
                                service: client,
                                id,
                                protocol: client.name,
                                responses: []
                            }
                        }

                        // Apply Callback if Supplied
                        if (callback) {
                            let id = randomId('response')
                            this.subscription.responses.push(id)
                            client.addResponse(id, callback)
                        }

  
                        // Filter Options to get Message Object
                        if (this.type === 'webrtc') {
                            opts.routes = [this.target] // Connect to Target Room / User only
                        }

                        this.link.send(subscriptionEndpoint, Object.assign({
                            route: opts.route,
                            message: opts.message,
                            protocol: opts.protocol,
                        }, {
                          message: [opts.routes, this.subscription.id] // Routes to Subscribe + Reference ID
                        }))

                        resolve(this.subscription)
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

    unsubscribe = (id) => {
        this.subscription.service.removeResponse(id)
        delete this.subscription
    }
}