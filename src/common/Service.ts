import { randomId } from "./"
import { MessageObject, MessageType, ProtocolObject, RouteConfig, SubscriptionCallbackType } from "src/common/general.types"

export class Service {

    id = randomId() // Service ID
    callbacks: Map<string, SubscriptionCallbackType >  = new Map()
    routes: RouteConfig[] = []
    name:string = 'service'
    protocols: ProtocolObject = {}
    subscriptionHandler?: Function

    constructor() {

    }

    notify = async (o: MessageObject, type?: MessageType) => {
        let responses = [];
        await Promise.all(Array.from(this.callbacks).map(async (arr, i) => {
            const res = await arr[1](o, type)
            if (res && !(res instanceof Error)) responses.push(res)
        })) // notify all subscribers
        return responses?.[0] // only return first valid subscription response
    }

    subscribe = (callback:SubscriptionCallbackType) => {
        if (callback instanceof Function){
            let id = randomId()
            this.callbacks.set(id, callback)
            return id
        } else return
    }

    unsubscribe = (id:string) => {
        return this.callbacks.delete(id)
    }
}