import { randomId } from "./"
import { MessageObject, MessageType, ProtocolObject, RouteConfig, SubscriptionCallbackType } from "src/common/general.types"

// Browser and Node-Compatible Service Class
export class Service {

    id = randomId() // Unique Service ID
    name:string = 'service' // Service Name
    callbacks: Map<string, SubscriptionCallbackType >  = new Map() // Subscriber Callbacks
    routes: RouteConfig[] = [] // Service-Specific Routes
    protocols: ProtocolObject = {} // Compatible Communication Protocols (unused in Node)
    subscriptionHandler?: Function // Message Handler

    constructor() {

    }


    // Notify subscribers (e.g. Router) of a New Message
    notify = async (o: MessageObject, type?: MessageType) => {
        let responses = [];

        // Notify All Subscribers
        await Promise.all(Array.from(this.callbacks).map(async (arr, i) => {
            const res = await arr[1](o, type)
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