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
    events: {
        [x: string]: Map<string, Function>
    } = {}

    subscriptionHandler = (o) => {
        this.events[o.route]?.forEach(f => f(o))
    }

    // TODO: Add method to parse events to listen to from the Router...

    routes = [
        {
            route: '**',
            callback: async (self,[route, request, response]) => {
                route = route.replace(this.name + '/', '')
                return await this.add(route, request, response)
            }
        }
    ]

    constructor() {
        super()

        // this.addRoute(transform(k, {
        //     route: `/${(name) ? `${name}/` : ''}` + k,
        //     callback: ((service as any)[k] instanceof Function) ? (service as any)[k] : () => (service as any)[k]
        // }))
    }

    add = async (route:string, request: Request, response: Response) => {
        
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
              };
        
              response.writeHead(200, headers);
                        
              let callback = (data:any) => {
                if(data.message && data.route) {
                    response.write(`data: ${JSON.stringify(data)}\n\n`);
                }
              }

              // Store Subscriptions
              const id = randomId()

              if (!this.events[route]) this.events[route] = new Map()
              this.events[route].set(id, callback)

              // TODO: Add support for multiple args
              let res = await this.notify({route, message: []}, true) // Getting current routes to pass along
              callback(res) // send initial value

            // Cancel Subscriptions
            request.on('close', () => {
                this.events[route].delete(id)
            });

            return id
    }
}

export default EventsService