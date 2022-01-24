import { MessageObject } from "src/common/general.types"
import { Router } from 'src/backend'
import { Service } from './Service'

// Browser and Node-Compatible Service Class
export class SubscriptionService extends Service {

    // FE
    service?: string;
    reference?: any; // Networking object reference
    responses?: Map<string, Function> = new Map()
    remote?: string

    // Message Handler
    subscribers: Map<string, any> = new Map()
    updateSubscribers?: (router: Router, o: MessageObject) => any = (self, o) => {
        this.subscribers.forEach(u => {
            if (u.routes[o.route]) {
                u = self.USERS.get(u.id)
                if (u) u.send(o)
            }
        })
    }
    
    
    constructor() {
        super()
    }

    setRemote = (remote) => {
        this.remote = remote
    }

    addResponse = (name, f) => {
        this.responses.set(name, f)
    }

    send = async (o:MessageObject, options: any):Promise<any> => {
        throw 'Send not implemented'
    }
}