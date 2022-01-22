import { Request, Response } from "express";
import { ClientObject, MessageObject, RouteConfig } from "@brainsatplay/liveserver-common/general.types";
import { safeParse } from "@brainsatplay/liveserver-common/parse.utils";
import { Service } from "@brainsatplay/liveserver-common/Service";
import { randomId } from "src/common";

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
    eventPath = 'events'

    constructor() {
        super()

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

        let toMatch = this.eventPath
        if (route.slice(0,toMatch.length) == toMatch){
            // Extract Subscription Endpoint (no join required)
            if (route.slice(0,toMatch.length) == toMatch){

                route = route.slice(toMatch.length) // get subscription path
                this.notify({
                    route: `${this.eventPath}/${route}`,
                    message: [route, request, response]
                })
            } 
        } else {
            let res = await this.handleRoute(route, request.body, Object.keys(request.route.methods).find(k => request.route.methods[k]))
            if (res instanceof Error) response.status(404).send(JSON.stringify(res, Object.getOwnPropertyNames(res))) 
            else if (res != null) response.send(JSON.stringify(res as any)) // send back  
        }
    }

    // Generic Route Handler for Any Route + Body
    handleRoute = async (route: string, body: string, method?:string) => {
                    
        // Requires Client to Join Session
        let info = safeParse(body)
        info.route = route // specify route
        info.method = method // specify route method
        // let client = this.clients[info.id] // reference for scoped custom functions
        let res = await this.notify(info as MessageObject)
        return res
    }
}

export default HTTPService