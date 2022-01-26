import { Service } from "@brainsatplay/router/Service";

// Garrett Flynn and Joshua Brewster, AGPL v3.0
export class SSRService extends Service {
    name = 'ssr'

    routes = [
        { //add a local function, can implement whole algorithm pipelines on-the-fly
          route: 'add',
          callback: async (self, args) => { //arg0 = name, arg1 = function string (arrow or normal)

            const reference = {content: args[1] ?? `<p>Just a test lol</p>`}
            
            self.addRoute({
              route: args[0],
              reference,
              headers: {
                'Content-Type': 'text/html',
              },
              callback: (self,args) => {
                reference.content = args[0]
                return {message: reference.content}
              }

            })
  
            return true;
          }
        }
        ]

    constructor(){
        super()
    }

}

export default SSRService