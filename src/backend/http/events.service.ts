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
        this.sources[o.route]?.forEach(f => f(o))
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

        // this.addRoute(transform(k, {
        //     route: `/${(name) ? `${name}/` : ''}` + k,
        //     callback: ((service as any)[k] instanceof Function) ? (service as any)[k] : () => (service as any)[k]
        // }))
    }

    add = async (info:any, request: Request, response: Response) => {
        
        const id = info.message?.[0] ?? info.id
        const routes = info.message?.[1]
        let u = this.sources.get(id)

        console.log(info, u)
        if (!u){
            u = {id, routes: []}

            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
              };
        
              response.writeHead(200, headers);
                        
              u.callback = (data:any) => {
                if(data.message && data.route) {
                    response.write(`data: ${JSON.stringify(data)}\n\n`);
                }
              }

              // Store Subscriptions
            //   if (!this.events[route]) this.events[route] = new Map()
            //   this.events[route].set(id, callback)

            //   // TODO: Add support for multiple args
            //   let res = await this.notify({route, message: []}, true) // Getting current routes to pass along
            u.callback({route:'events/subscribe', message: id}) // send initial value

            // Cancel Subscriptions
            request.on('close', () => {
                this.sources.delete(id)
            });
        } else {
            u.routes.push(...routes)
        }

        return id
    }
}

export default EventsService