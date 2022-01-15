// Joshua Brewster, Garrett Flynn, AGPL v3.0
const WebSocket = require('ws')
const https = require('https')
const http = require('http')
const WebsocketController = require('./WebsocketController')

// Create Brainstorm Server Instance
class WebsocketServer{
    constructor(
      app, 
      config={},
      onListen=()=>{},
      onError=(e)=>{console.error(e)}){

      this.url = 'localhost'
      this.database = app.get('mongoose') 
      
      if (config.port != null) this.port = config.port 
      else this.port = '80'
      if (config.protocol != null) this.protocol = config.protocol 
      else this.protocol = 'http'
      if (config.credentials != null) this.credentials = config.credentials 
      else this.credentials = {}
          
      // Create HTTP Server
      if (this.protocol === 'https'){ 
        //https requires credentials
        if (this.credentials.key != null && this.credentials.cert !== null){
            this.server = https.createServer(this.credentials, app)
        } else {
            // console.log('invalid credentials. Reverting to HTTP protocol.')
            this.protocol = 'http'
            this.server = http.createServer(app)
        }
      } else {
          this.protocol = 'http'
          this.server = http.createServer(app)
      }
      
      // Create Websocket Server
      this.wss = new WebSocket.Server({ clientTracking: false, noServer: true }); // Use for Production
      
      // Create Data Server
      this.controller = new WebsocketController({
        wss:this.wss, //Websocket.Server instance
        app:app, //express app
        db:{
          mode:'mongo'
        },
        remoteService:true,
        webrtc:true,
        osc:true,
        debug:true
      });


      this.server.onListen = onListen
      this.server.onError = onError
    }

    async init() {

      this.server.on('connection', function (client) {
        // console.log('new server connection')
      });

        // Authenticate User Before Connecting WebSocket
        this.server.on('upgrade', async (request, socket, head) => {
        
            // Get User Credentials from Subprotocol / Cookies
            let _subprotocols = request.headers['sec-websocket-protocol'] || undefined
            if (_subprotocols){
              _subprotocols = _subprotocols.split(', ')
            } else {
              _subprotocols = []
            }
        
            let subprotocols = {}
            _subprotocols.forEach((str)=>{
              let arr = str.split('&')
              subprotocols[arr[0]] = arr[1]
            })
        
            if (subprotocols.id == null) {
              subprotocols.id = 'user'+Math.floor(Math.random()*1000000000);
              if(!subprotocols.username) subprotocols.username = subprotocols.id;
            }
    
            let id = subprotocols['id']
        
            // Pass Credentials to Authentication Script
            // authenticate({username,password},mongoClient).then((res) => {
        
            //   if (res.result !== 'OK') {
            //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            //     socket.destroy();
            //     return;
            //   }
        
            //   username = res.msg.username
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, {id}, request);
              });
            // })
        });
        
        
        // Connect Websocket
        this.wss.on('connection',  async (ws, msg, req) => {
            ws.id = Math.floor(Math.random() * 10000000);
            //connection msg should look like:
            /*
              msg = {
                id:'abc123' //unique identifier, or use _id:
                username:'agentsmith' //ideally a unique username
              }
            */
            if(msg.id) {
              this.controller.addUser(msg, ws); //adds a user from a socket
              ws.send(JSON.stringify({msg:'user added'}));
            }
            
            
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
        
          this.server.listen(parseInt(this.port), () => {
            console.log(`Websocket server created on ${this.protocol}://${this.url}:${this.port}`)
        });
    }
}

module.exports = WebsocketServer
