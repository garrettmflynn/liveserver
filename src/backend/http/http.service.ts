import { Request, Response } from "express";
import { ClientObject, RouteConfig } from "@brainsatplay/liveserver-common/general.types";
import { safeParse } from "@brainsatplay/liveserver-common/parse.utils";
import { randomId } from "@brainsatplay/liveserver-common";

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func: Function) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

const exposedMethods = [
    'routes',
    'addRoute',
    'subscribe',
    'join',
    'leave',
]


// --------------- Route Structure ------------------
// */defaults
//  Default routes supplied by the Session class. Exposed with the `exposedMethods` variable.
//
// */[service]
//  Additional core routes specified by services loaded into the session
//
// */[client_id]
//  Custom routes specified by clients
//
export class HTTPService {

    name = 'http'

    // app?: Application
    routes: Map<string, RouteConfig> = new Map()
    id: string = `${Math.floor(100000*Math.random())}`
    clients: {
        [x: string]: ClientObject
    } = {}

    subscriptions: {
        [x: string]: Map<string, Function>
    } = {}

    constructor() {

        this.load(undefined, this, (str:string) => exposedMethods.includes(str), (key, config) => {
            
            if (key === 'routes') {
                config.callback = () => Array.from(this.routes.values()).map((o:any) => {return {
                    route: o.route,
                    args: getParamNames(o.callback)
                }})
            } else if (key === 'join' || key === 'leave') config.id = true // first argument is id
            
            return config
        })
        
    }

    load = (name, service:object|any[], filter: (string:any) => boolean = () => true, transform:(name: string, config:RouteConfig)=>any=(_, config)=>config) => {
        
        // Add From an Array of Route Objects
        if (Array.isArray(service)){
            service.filter(filter).forEach(o => {
                let cases = [o.route, ...(o.aliases) ? o.aliases : []]
                cases.forEach(k => {
                    this.addRoute(transform(k, {
                        route: `/${(name) ? `${name}/` : ''}` + k,
                        callback: o.callback
                    }))
                })
            })
        } 
        
        // Add Routes from Object with Functions/Methods
        else {
            Object.keys(service).filter(filter).forEach(k => {
                this.addRoute(transform(k, {
                    route: `/${(name) ? `${name}/` : ''}` + k,
                    callback: ((service as any)[k] instanceof Function) ? (service as any)[k] : () => (service as any)[k]
                }))
            })
        }
    }

    websocket = () => {

    }


    // Use with Express App to Handle Requests Coming through the Specified Route
    http = async (req: Request, res: Response) => {

        // Handle Paths without Wildcard at Base
        let path = req.route.path.replace(/\/?\*?\*/, '')
        let routePath = req.originalUrl.replace(path, '')

        console.log(routePath)
        let toMatch = '/subscribe'
        if (routePath.slice(0,toMatch.length) == toMatch){
            // Extract Subscription Endpoint (no join required)
            if (routePath.slice(0,toMatch.length) == toMatch){

                routePath = routePath.slice(10) // get subscription path
                this.subscribeSSE(routePath, req, res)

            } 
        } else {
            let val = await this.handleRoute(routePath, req.body, Object.keys(req.route.methods).find(k => req.route.methods[k]))
            if (val instanceof Error) res.status(404).send(JSON.stringify(val, Object.getOwnPropertyNames(val))) 
            else if (val != null) res.send(JSON.stringify({data: val} as any)) // send back  
        }
    }

    // Generic Route Handler for Any Route + Body
    handleRoute = async (route: string, body: string, method?:string) => {

            console.log(route)
                try {
                    
                    // Requires Client to Join Session
                    let info = safeParse(body)
                    let client = this.clients[info.id] // reference for scoped custom functions

                    let routeInfo = client?.routes?.get(route) // client overrides
                                    ?? this.routes.get(route) // default route callbacks

                    if (routeInfo){
                        if (this.clients[info.id] || route === '/join'){

                            // Check if Correct Method
                            if (!routeInfo.method || method === routeInfo.method){
                                let args = (Array.isArray(info.data)) ? safeParse(info.data) : [safeParse(info.data)]
                                if (typeof routeInfo.id === 'boolean') args[0] = (typeof args[0] === 'string') ? args[0] : info.id
                                let val = await routeInfo.callback(...args as [])
                                if (val != undefined) {
                                    this.runSubscriptions(route, val)
                                    return val
                                }
                            }

                        } else return new Error(`Client ${info.id} is not in this session.`)
                    }
                } catch (e) {
                    this.routes.delete(route)
                    return new Error(`Specified route has failed. Deleting callback.`)
                }
    }

    runSubscriptions = (routePath:string, val:any) => {
        this.subscriptions[routePath]?.forEach(f => f(val)) // send to subscribers
    }

    addRoute = async (config: RouteConfig) => {

        console.log(config)
        let routes = (typeof config.id === 'string') ? this.clients[config.id]?.routes : this.routes

        if (routes.has(config.route)) return new Error(config.route + ' already exists for ' + config.id)
        else {
            if (config.callback instanceof Function ) {
                routes.set(config.route, config)
                this.runSubscriptions('/routes', [config])
                return true
            } else return new Error('Callback is not a function.')
        }
    }

    // Local
    run = async (route:string, ...args:any[]) => {
        let routeInfo = this.routes.get(route)
        if (routeInfo?.callback instanceof Function) return await routeInfo.callback(...args)
    }

    subscribe = (route:string, send:Function) => {
        let id = randomId()
        if (!this.subscriptions[route]) this.subscriptions[route] = new Map()
        this.subscriptions[route].set(id, send)
        return id
    }

    unsubscribe = (route:string, id:string) => {
        this.subscriptions[route].delete(id)
    }

    subscribeSSE = async (route:string, req: Request, res: Response) => {

            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
              };
        
              res.writeHead(200, headers);
                        
              let send = (data:any) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
              }

              let id = this.subscribe(route, send)
              send(await this.run(route))
              req.on('close', () => {
                this.unsubscribe(route,id)
              });

    }


    join = (id:string) => {
        if (id && !this.clients[id]){
            this.clients[id] = {
                id,
                routes: new Map()
            }
            return true
        } else return new Error('Client has already joined.')
    }

    leave = async (id:string) => {
        if (id) {
            delete this.clients[id]
            return true
        } else return new Error('Client has already left the session.')
    }
    
}

export default HTTPService