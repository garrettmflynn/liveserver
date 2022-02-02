import { Request, Response } from "express";
import { ClientObject, MessageObject, RouteConfig } from "../../common/general.types";
import { safeParse } from "../../common/parse.utils";
import { Service } from "../../router/Service";
import { randomId } from "../..//common/id.utils";
import EventsService from "./events.backend";
import { SubscriptionService } from 'src/router';

// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func: Function) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null)
//      result = [];
//   return result;
// }

export class HTTPBackend extends SubscriptionService {

    name = 'http'
    id: string = randomId('http')
    services = {
        events: null // new EventsService()
    }

    routes = [
        { //add a local function, can implement whole algorithm pipelines on-the-fly
          route: 'add',
          callback: async (self, args) => { //arg0 = name, arg1 = function string (arrow or normal)

            const reference = {content: args[1] ?? `<p>Just a test lol</p>`}
            
            self.addRoute({
              route: args[0],
              reference,
              headers: {
                'Content-Type': 'text/html',
              },
              callback: (self,args) => {
                reference.content = args[0]
                return {message: reference.content}
              }

            })
  
            return true;
          }
        }
    ]

    constructor(router) {
        super(router)


        this.services.events = new EventsService(router)
        this.services.events.subscribe(this.notify) // Pass out to the Router
        this.updateSubscribers = this.services.events.updateSubscribers
        this.subscribers = this.services.events.subscribers

        // this.addRoute(transform(k, {
        //     route: `/${(name) ? `${name}/` : ''}` + k,
        //     callback: ((service as any)[k] instanceof Function) ? (service as any)[k] : () => (service as any)[k]
        // }))
    }

    // Use with Express App to Handle Requests Coming through the Specified Route
    controller = async (request: Request, response: Response) => {

        // Handle Paths without Wildcard at Base
        let path = request.route.path.replace(/\/?\*?\*/, '')

        let route = request.originalUrl.replace(path, '')
        if (route[0] === '/') route = route.slice(1) // Remove leading slash from routes

        const method = Object.keys(request.route.methods).find(k => request.route.methods[k])
        let info = safeParse(request.body)
        info.method = method // specify route method

        // Handle Subscribe Call Internally
        let toMatch = `${this.name}/subscribe`
        if (route.slice(0,toMatch.length) == toMatch){
            // Extract Subscription Endpoint (no join required)
            if (route.slice(0,toMatch.length) == toMatch){

                route = route.slice(toMatch.length) // get subscription path
                await this.services.events.addUser(info, request, response)
            } 
        } else {
            let res = await this.handleRoute(route, (info as MessageObject))
            if (res instanceof Error) response.status(404).send(JSON.stringify(res, Object.getOwnPropertyNames(res))) 
            else if (res != null) {
                for (let header in res?.headers){
                    response.setHeader(header, res.headers[header]);
                }

                let contentType = response.getHeader('Content-Type')

                // Only Send HTML for SSR
                if (contentType ===  'text/html') {
                    response.send(res.message?.content) // send back  
                } else {
                    response.setHeader('Content-Type','application/json')
                    response.send(JSON.stringify(res as any)) // send back  
                }
            }
        }
    }

    // Generic Route Handler for Any Route + Body
    handleRoute = async (route: string, info: MessageObject) => {
        info.route = route // specify route
        let res = await this.notify(info)
        return res
    }
}

export default HTTPBackend