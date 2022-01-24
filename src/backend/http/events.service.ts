import { Request, Response } from "express";
import { ClientObject } from "@brainsatplay/liveserver-common/general.types";
import { SubscriptionService } from "@brainsatplay/liveserver-common/SubscriptionService";
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

export class EventsService extends SubscriptionService {

    name = 'events'
    id: string = randomId('events')

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

    addUser = async (info:any, request: Request, response: Response) => {
        
        const tempId = info.message?.[1]
        const id = info.id ?? tempId ?? randomId('sse') // temporary id (since EventSource cannot pass a body)
        const routes = info.message?.[0]
        let u = this.subscribers.get(tempId ?? id)

        if (tempId && u) {
            this.subscribers.delete(tempId)
            u.id = id
            this.subscribers.set(id, u)
            await this.notify({route: 'addUser', message: [{id, send: u.callback}]});
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
                this.subscribers.delete(u.id)
            });

            this.subscribers.set(id, u)

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