import { randomId } from "src/common"
import { MessageObject, MessageType, RouteConfig } from "src/common/general.types"

export class Service {

    subscription?: Function 
    routes: RouteConfig[] = []
    name: 'service'

    constructor() {

    }

    notify = async (o: MessageObject, type?: MessageType) => {
        if (this.subscription) return await this.subscription(o, type)
    }

    subscribe = (callback:Function) => {
        if (callback instanceof Function){
            let id = randomId()
            this.subscription = callback
            return id
        } else return 
    }

    unsubscribe = ( id:string) => {
        return this.subscription = null
    }
}