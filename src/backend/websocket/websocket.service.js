// Joshua Brewster, Garrett Flynn, AGPL v3.0
import { WebSocketServer } from 'ws'
import WebsocketController from './WebsocketController.js'

// Create Brainstorm Server Instance
export class WebsocketServer{
    constructor(httpServer, options){

      this.server = httpServer
      
      
      // Create Websocket Server
      this.wss = new WebSocketServer({ clientTracking: false, noServer: true });
      
      let defaultOptions = {
        wss:this.wss, //Websocket.Server instance
        db: null,
        remoteService:true,
        webrtc:true,
        osc:true,
        debug:true
      }

      // Create Data Server
      this.controller = new WebsocketController(Object.assign(defaultOptions, options));
    }

    async init() {

        // Authenticate User Before Connecting WebSocket
        this.server.on('upgrade', async (request, socket, head) => {
  
            // NOTE: Can authorize connection with user credentials here (e.g. must have an account to use Websockets)
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
              });
        });
        
        
        // Connect Websocket
        this.wss.on('connection',  async (ws, req) => {

          const subprotocols = {}
          let subArr = decodeURIComponent(ws.protocol).split(';')
          subArr.forEach((str) => {
            let subSplit = str.split('/')
            let [val, query] = subSplit[2].split('?')

            const queries = {}
            query.split('&').forEach(str => {
              const [key,val] = str.split('=')
              queries[key] = val
            })

            subprotocols[subSplit[1]] = (queries.arr === 'true') ? val.split(',') : val

          })

            ws.id = subprotocols.id[0] ?? Math.floor(Math.random() * 10000000);

            // subprotocols should look like:
            /*
              msg = {
                id:'abc123' //unique identifier, or use _id:
                username:'agentsmith' //ideally a unique username
              }
            */
            
            let id = this.controller.addUser(ws, subprotocols); //adds a user from a socket
            ws.send(JSON.stringify({msg:`User added: ${id}`,id:id}));
            
            // console.log('user session started: ', msg);
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
}
