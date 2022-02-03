import { Request, Response } from "express";
import { SubscriptionService } from "../../router/SubscriptionService";
import { randomId } from "../../common/id.utils";

// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func: Function) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null)
//      result = [];
//   return result;
// }

export class EventsBackend extends SubscriptionService {

    name = 'events'
    id: string = randomId('events')

    constructor(router) {
        super(router)
    }

    updateUser = async (info:any, request: Request, response: Response) => {
        
        const tempId = info.message?.[1]
        const id = info.id ?? tempId ?? randomId('sse') // temporary id (since EventSource cannot pass a body)
        const routes = info.message?.[0]
        let u = this.subscribers.get(tempId ?? id)

        if (tempId && u) {
            u.id = id
            if (u.id != tempId) {
                this.subscribers.delete(tempId)
                await this.notify({route: 'addUser', message: [{id, send: u.send}]});
            }
            response.send(JSON.stringify({message: [true]})) // Return to ensure client is not blocked
        } else if (!u) {

            // Initialize Subscription
            u = {id, routes: {}, send: (data:any) => {
                if(data?.message && data?.route) {
                    response.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            }}

            // Refresh User Subscription Target
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };

            response.writeHead(200, headers);
            
            u.send({route:'events/subscribe', message: [id]}) // send initial value

            // Cancel Subscriptions
            request.on('close', () => {
                this.subscribers.delete(u.id)
            });
        } 

        this.subscribers.set(id, u)

        // Always Add New Routes
        if (routes){
            routes.forEach(async route => {
                u.routes[route] = true // TODO: Toggle off to cancel subscription
            })
        }

        return id
    }
}

export default EventsBackend