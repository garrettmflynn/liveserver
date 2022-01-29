import { MessageObject, UserObject } from "../common/general.types"
import { Service } from './Service'
import Router from './Router';
import { getRouteMatches } from "../common/general.utils";

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
            let possibilities = getRouteMatches(o.route)
            possibilities.forEach(route => {
                if (u.routes[route]) {
                    u = self.USERS[u.id]
                    if (u?.send) u.send(o)
                }
            })
        })
    }
    
    
    constructor() {
        super()
    }

    add = (user:Partial<UserObject>, endpoint:string):Promise<any> => {
        throw 'Add not implemented'
    }

    setRemote = (remote) => {
        this.remote = remote
    }

    addResponse = (name, f) => {
        this.responses.set(name, f)
    }

    send = async (o:MessageObject, options?: any):Promise<any> => {
        throw 'Send not implemented'
    }
}