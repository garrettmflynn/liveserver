import { Request, Response } from "express";
import { ClientObject, MessageObject, RouteConfig } from "@brainsatplay/liveserver-common/general.types";
import { safeParse } from "@brainsatplay/liveserver-common/parse.utils";
import { Service } from "@brainsatplay/liveserver-common/Service";
import { randomId } from "src/common";
import EventsService from "./events.service";

// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func: Function) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null)
//      result = [];
//   return result;
// }

export class HTTPService extends Service {

    name = 'http'
    id: string = randomId('http')
    services = {
        events: new EventsService()
    }

    subscribers = this.services.events.subscribers
    updateSubscribers = this.services.events.updateSubscribers

    constructor() {
        super()

        this.services.events.subscribe(this.notify) // Pass out to the Router

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

export default HTTPService