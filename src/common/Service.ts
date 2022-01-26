import { randomId } from "./id.utils"
import { MessageObject, ProtocolObject, RouteConfig, SubscriptionCallbackType } from "src/common/general.types"

// Browser and Node-Compatible Service Class
export class Service extends EventTarget {

    id = randomId('service') // Unique Service ID
    name:string = 'service' // Service Name
    callbacks: Map<string, SubscriptionCallbackType >  = new Map() // Subscriber Callbacks

    // Service-Specific Routes
    routes: RouteConfig[] = [
        // {route: 'addUser', callback: (self, args, id) => {}} // Called every time a user is added via the Router
        // {route: 'removeUser', callback: (self, args, id) => {}} // Called every time a user is removed via the Router
    ]


    protocols: ProtocolObject = {} // Compatible Communication Protocols (unused in Node)
    services: {[x: string]: any} = {} // Object of nested services
    
    constructor() {
        super()
    }


    // Notify subscribers (e.g. Router / UserPlatform ) of a New Message
    notify = async (
        o: MessageObject, // defines the route to activate
        type?: boolean|undefined, // specifies whether the notification is internal (true) OR from a client (false / default). Internal notifications will be only forwarded to route subscribers.
        origin?: string|number|undefined //origin of the call
     ) => {
        let responses = [];

        // Notify All Subscribers
        await Promise.all(Array.from(this.callbacks).map(async (arr, i) => {
            const res = await arr[1](o, type, origin);
            if (res && !(res instanceof Error)) responses.push(res)
        }))

        // Return First Valid Subscription Response
        return responses?.[0]
    }

    // Subscribe to Notifications
    subscribe = (callback:SubscriptionCallbackType) => {
        if (callback instanceof Function){
            let id = randomId()
            this.callbacks.set(id, callback)
            return id
        } else return
    }

    // Unsubscribe from Notifications
    unsubscribe = (id:string) => {
        return this.callbacks.delete(id)
    }
}