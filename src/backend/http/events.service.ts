import { Request, Response } from "express";
import { ClientObject } from "@brainsatplay/liveserver-common/general.types";
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

export class EventsService extends Service {

    name = 'events'
    id: string = randomId('events')
    sources: Map<string, any> = new Map()

    subscriptionHandler = (o) => {
        this.sources.forEach(u => {
            if (u.routes[o.route]) u.callback(o)
        })
    }

    // TODO: Add method to parse events to listen to from the Router...

    // routes = [
    //     {
    //         route: '**',
    //         callback: async (self,[route, request, response]) => {
    //             route = route.replace(this.name + '/', '')
    //             return await this.add(route, request, response)
    //         }
    //     }
    // ]

    constructor() {
        super()

    }

    add = async (info:any, request: Request, response: Response) => {
        
        const tempId = info.message?.[1]
        const id = tempId ?? info.id ?? randomId('sse') // temporary id (since EventSource cannot pass a body)
        const routes = info.message?.[0]
        let u = this.sources.get(id)

        if (tempId && u) {
            this.sources.delete(tempId)
            u.id = id
            this.sources.set(id, u)
        }

        if (!u){
            u = {id, routes: {}}

            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
              };
        
              response.writeHead(200, headers);
                        
              u.callback = (data:any) => {
                if(data?.message && data?.route) {
                    response.write(`data: ${JSON.stringify(data)}\n\n`);
                }
              }

            u.callback({route:'events/subscribe', message: id}) // send initial value

            // Cancel Subscriptions
            request.on('close', () => {
                this.sources.delete(u.id)
            });

            this.sources.set(id, u)

        } else {
            routes.forEach(async route => {
                let res = await this.notify({route, message: []}, true) // Getting current routes to pass along
                u.callback(res)
                u.routes[route] = true // TODO: Toggle off to cancel subscription
            })
        }

        return id
    }
}

export default EventsService