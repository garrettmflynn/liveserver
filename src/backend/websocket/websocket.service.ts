// Joshua Brewster, Garrett Flynn, AGPL v3.0
import { WebSocketServer } from 'ws'
import { Service } from '@brainsatplay/liveserver-common/Service';
import { MessageObject } from '@brainsatplay/liveserver-common/general.types';

// Create WS Server Instance
export class WebsocketService extends Service{

  name = 'websocket'
  server: any
  wss = new WebSocketServer({ clientTracking: false, noServer: true });
  sources: Map<string, any> = new Map()


  subscriptionHandler = (o) => {
    this.sources.forEach(u => {
        if (u.routes[o.route]) u.callback(o)
    })
}

    constructor(httpServer){
      super()

      this.server = httpServer

      this.init()
}


    async init() {

        this.server.on('upgrade', async (request, socket, head) => {
  
            // NOTE: Can authorize connection with user credentials here (e.g. must have an account to use Websockets)
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
              });
        });
        
        
        // Connect Websocket
        this.wss.on('connection',  async (ws, req) => {

          const subprotocols:{[x:string]: any} = {}
          let subArr = decodeURIComponent(ws.protocol).split(';')
          subArr.forEach((str) => {
            let subSplit = str.split('/')
            let [val, query] = subSplit[2].split('?')

            const queries: {
              [x: string]: any
              arr?: string
            } = {}

            query.split('&').forEach(str => {
              const [key,val] = str.split('=')
              queries[key] = val
            })

            subprotocols[subSplit[1]] = (queries.arr === 'true') ? val.split(',') : val

          })

            // const id = subprotocols.id ?? randomId('user')

            // subprotocols should look like:
            /*
              message = {
                id:'abc123' //unique identifier, or use _id:
                username:'agentsmith' //ideally a unique username
              }
            */
            const msg = await this.notify({route: 'addUser', message: [Object.assign(subprotocols, {socket: ws})]}); // TODO: Ensure users actually added to the session

            ws.on('message', (json="") => {
              
              let parsed = JSON.parse(json);
              if(Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                  parsed.forEach((obj) => {
                    if (!obj.id) obj.id = msg.id
                    this.process(ws, obj);
                  })
              } else {
                if (!parsed.id) parsed.id = msg.id
                this.process(ws, parsed)
              }
          });

          ws.on('close', (s) => {
              // console.log('session closed: ', id);
              // this.removeUser(id);
              this.notify({route: 'removeUser', message: [msg.id]}); // TODO: Ensure users actually leave the session
          });

            // console.log('user session started: ', message);
            // ws.isAlive = true;
            // ws.on('pong', function(){this.isAlive = true;});
        });   
        
        // const interval = setInterval(() => {
        //   this.controller.users.forEach((u) => {
        //     if (u.socket.isAlive === false) {
        //       console.log('connection lost:', u);
        //       return this.controller.removeUser(u.id);
        //     }
        
        //     u.socket.isAlive = false;
        //     u.socket.ping();
        //   });
        // }, 5000);


        // this.wss.on('close', function close() {
        //   clearInterval(interval);
        // });
    }

    process = async (ws, o) => {
      // console.log(o)
      this.defaultCallback(ws, o)
      let res = await this.notify(o);
      res.callbackId = o.callbackId
      if (res instanceof Error) ws.send(JSON.stringify(res, Object.getOwnPropertyNames(res))) 
      else if (res != null) ws.send(JSON.stringify(res)) // send back  
    }

  defaultCallback = async (ws, o) => {

      // Check to Add Subscribers (only ws)
      let query = `${this.name}/subscribe`
    if (o.route.slice(0,query.length) === query){
        return await this.addSubscription(o, ws)
    }

  } 


    // Subscribe to Any Arbitrary Route Event
    addSubscription = async (info: MessageObject, ws) => {

      const id = info.id
      const routes = info.message?.[0]
      let u = this.sources.get(id)

      console.log(info, routes)
      if (!u){
          u = {id, routes: {}}
                      
            u.callback = (data:any) => {
              if(data.message && data.route) {
                  ws.send(JSON.stringify(data))
              }
            }

          // Cancel Subscriptions
          ws.on('close', () => {
            this.sources.delete(id)
        });

          this.sources.set(id, u)

      } 

        routes.forEach(async route => {
            let res = await this.notify({route, message: []}, true) // Getting current routes to pass along
            console.log('Pasing', res)
            u.callback(res)
            u.routes[route] = true
        })

    }
}

export default WebsocketService
