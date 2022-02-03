import { SubscriptionService } from "../../router/SubscriptionService";
import { createRoute } from "../../common/general.utils";

class HTTPClient extends SubscriptionService {

    name = 'http'
    service = 'http'

    constructor(router) {
        super(router)
    }

    add = (user, endpoint) => {
        return new Promise(resolve => {

            this.reference = new EventSource(createRoute('',endpoint))
            this.reference.onopen = () => {
                this.reference.onmessage = (event) => {
                let data = JSON.parse(event.data)

                if (data.route === 'events/subscribe') resolve(data.message[0]) // Ensure IDs are Linked
                this.responses.forEach(f => f(data)) // Always trigger responses
            }
        }
    })
}

}


// let http = new HTTPClient()

// Export Instantiated Session
export {HTTPClient}
// export default http