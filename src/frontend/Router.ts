import { Service } from '@brainsatplay/liveserver-common/Service';
import { randomId } from '../common';
import { MessageObject, MessageType, RouteConfig, UserObject } from '../common/general.types';
import { safeStringify } from '../common/parse.utils';
import { WebsocketClient } from './websocket/WebsocketClient';
//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License
//
// Description
// A client-side Router class with macros
//


function createRoute (path:string, remote:string|URL) {
    let baseUrl = (remote instanceof URL) ? remote : new URL(remote)
    path = (baseUrl.pathname === '/') ? path : baseUrl.pathname + path
    let href = (new URL(path, baseUrl.href)).href
    return href
}

export class Router {

    currentUser: Partial<UserObject>
		        
    // Services
    services = {
        available: {},
        clients: {},
        connecting: {},
        subscribeQueue: [],
        subscriptions: ['WebsocketService', 'EventsService']
    }
    

    // Internal Routes
    routes: {
        [x: string]: RouteConfig
    } = {}

    subscription?: EventSource | WebsocketClient

    remote?: URL
    id: string = randomId()

    // Generalized Protocol Support
    protocols: {
        http?: EventSource
        websocket?: WebsocketClient
    } = {}

    constructor(userinfo={_id:'user'+Math.floor(Math.random()*10000000000)}) {
        this.currentUser = userinfo;
        if (this.currentUser.id) this.currentUser._id = this.currentUser.id // Add a persistent ID

        // Logout User before Unload
        console.log(global)
        global.onbeforeunload = () => {
            this.logout()
        }
        
    }

    setRemote = async (base:string, path:string) => {
        this.remote = (path) ? new URL(path, base) : new URL(base)

        // this.protocols.websocket.addSocket(this.remote,this.currentUser) // Add Socket to New Remote
        // this.protocols.websocket.defaultCallback = this.baseServerCallback;

        // Register User on the Server
        if (this.remote) {
            await this.getServices()
            this.login() // Login user to connect to new remote
        }
    }

    getServices = async () => {
        let res = await this.send('services')
        // console.log('services',res)
        if (res) {
            res?.forEach(o => {
                this.services.available[o.name] = o.route
    
                // Resolve Load Promises
                if (this.services.connecting[o.name]){
                    this.services.connecting[o.name](o)
                    delete this.services.connecting[o.name]
                }

                // console.log(this.services.subscriptions, o.name)
                if (this.services.subscriptions.includes(o.name)){
                    this.services.subscribeQueue.forEach(f => f())
                }
            })
        }
    }

    connect = (service: Service, name=service?.name) => {

        return new Promise(resolve => {

            this.services.clients[service.constructor.name] = service
            const toResolve = (available) => {
                // Expect Certain Callbacks from the Service
                service.routes.forEach(o => {
                    // console.log('Route', o, available, this.routes)
                    this.routes[`${available.route}/${o.route}`] = o
                })
                resolve(service)
            }

            // Auto-Resolve if Already Available
            const available = this.services.available[service.constructor.name]
            if (available) toResolve(available)
            else this.services.connecting[service.constructor.name] = toResolve
            

            // if (service.protocols.websocket) {
            //     // if (!this.protocols.websocket)
            //     this.protocols.websocket = true
            // }

            // NOTE: This is where you listen for service.notify()
            service.subscribe(async (o:MessageObject, _:MessageType) => {
                const available = this.services.available[service.constructor.name]
                // Check if Service is Available
                if (available) return await this.send(`${available}/${o.route}`, ...o.message) // send automatically with extension
            })

        })

    }


    //------------------------------------------------
    // Commands
    //------------------------------------------------
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
            let response

            // Send over Websockets if Active
            if (this.protocols.websocket){
                response = await this.protocols.websocket.send({id: this.currentUser._id, route, message: args}, {suppress: true}) // NOTE: Will handle response in the subscription
            } 
            
            // Default to HTTP
            else {

                response = await fetch(createRoute(route, this.remote), {
                    method: 'POST',
                    mode: 'cors', // no-cors, *cors, same-origin
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: safeStringify({id: this.currentUser._id, message: args})
                }).then(async (res) => {
                    const json = await res.json()
                    if (!res.ok) throw json.message
                    else return json
                }).catch((err) => {
                    throw err.message
                })
            }

            // Activate Internal Routes if Relevant
            const responseRoute = this.routes[response?.route]?.callback
            if (responseRoute instanceof Function) responseRoute(response.message) // TODO: Monitor what is outputted to chain calls?
            
            // Pass Back to the User
            return response.message

        } else throw 'Remote is not specified'
    }

    createSubscription = async (options:any, onmessage:any) => {
            let toResolve =  (): Promise<any> => {
                return new Promise(async resolve => {

                    if ((options.protocol == null || options.protocol === 'websocket') && this.services.available['WebsocketService'] && this.services.clients['WebsocketClient']) {
                        
                        let subscriptionEndpoint = `${this.services.available['WebsocketService']}/subscribe`
                        if (!this.subscription){
                            this.subscription = this.protocols.websocket = new WebsocketClient(this.currentUser, this.remote) // TODO: Enable multiple socket connections to different servers
                            this.protocols.websocket.addCallback('sub', onmessage)
                        }

                        this.protocols.websocket.send({
                            route: subscriptionEndpoint,
                            message: [options.routes]
                        })

                        resolve(this.subscription)

                    } else if ((options.protocol == null || options.protocol === 'http') && this.services.available['HTTPService']) { // TODO: Break out the HTTP Client

                        // EventSource ClientService (inline)
                        let subscriptionEndpoint = `${this.services.available['HTTPService']}/subscribe`
                        if (!this.subscription){
                            const source = new EventSource(createRoute(subscriptionEndpoint, this.remote))
                            source.onopen = () => {
                            source.onmessage = (event) => {
                                let data = JSON.parse(event.data)

                                // Ensure IDs are Linked
                                if (data.route === 'events/subscribe'){
                                    this.send(subscriptionEndpoint, options.routes, data.message) // Register and subscribed route
                                    source.onmessage = onmessage
                                    this.subscription = this.protocols.http = source
                                    resolve(this.subscription)
                                }
                            }
                        }
                        } else this.send(subscriptionEndpoint, options.routes)
                    } else {
                        this.services.subscribeQueue.push(async () => {
                            let res = await toResolve()
                            resolve(res)
                        })
                    }
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
                this.routes[data?.route]?.callback(data) // Run internal routes (if required)
            })
            
        } else throw 'Remote is not specified'

    }

    unsubscribe = (id, route?) => {
        if (id){
            throw 'Unsubscribe not implemented'
        }
    }
}