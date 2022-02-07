let express = require("express")
let cors = require("cors")
let http = require("http")
let mongoose = require("mongoose")
let bodyParser = require("body-parser")

// Import the LiveServer API
import * as api from './backend/index'

// Set Environment Variables
import { resolve } from "path";
import { config } from "dotenv";
import {Router} from './router/Router'

// import { Router } from 'liveserver-router'
import { OSCBackend } from './services/osc/osc.backend'
import { WebRTCBackend } from './services/webrtc/webrtc.backend'

import { SessionsService } from './services/sessions/sessions.service'
import { DatabaseService } from './services/database/database.service'
import { UnsafeService } from './services/unsafe/unsafe.service'
config({ path: resolve(__dirname, `../.env`) });
config({ path: resolve(__dirname, `../.key`) });

const main = (port="80", services:{[x:string] : boolean}={}) => {

const app = express();

// Parse Body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // how to allow data to only intended website without cors

// Set Server
let protocol = "http";
 port = port;
const server = http.createServer(app);

// Start Server
server.listen(parseInt(port), () => {
  console.log(`Server created on ${protocol}://localhost:${port}`);
});

// ---------------- Start Database --------------------
// Connect to your local instance of Mongoose
mongoose.connection.on("open", () => console.log("DB Connected!"));


mongoose
  .connect(process.env.DB_URI ?? "")
  .then(() => {
    init(mongoose.connections[0].db)
  })
  .catch(() => {
    console.error("Error: MongoDB not initialized...");
    init();
  });

  // ----------------- Initialize API ------------------
  function init(db?:any) {

    // Instantiate the Router class to handle services
    let controller = new Router({ debug: false });

    // Enable HTTP Messages
    if (services.http){
      let http = new api.HTTPBackend(controller);

      app.get("**", http.controller);
      app.post("**", http.controller);
      controller.load(http);
  }

    // Enable WebSocket Messages
    if (services.websocket){
      let websocket = new api.WebsocketBackend(controller, server);
      controller.load(websocket)
    }

    if (services.osc){
      let osc = new OSCBackend(controller);
      controller.load(osc)
    }

    if (services.webrtc){
      let webrtc = new WebRTCBackend(controller);
      controller.load(webrtc)
    }

    if (services.sessions){
      let sessions = new SessionsService(controller);
      controller.load(sessions)
    }

    if (services.database){

      let database = new DatabaseService(controller, { mode: "mongodb", db,
        collections: {
          // Included
          users: {
            instance: db.collection('users'),
            match: ['id', 'username', 'email'],
            filters: {
              get: () => {
                return true
              },
              post: () => {
                return false
              }
            }
          },

          // Custom
          notes: {
            instance: db.collection('notes'),
            match: ['id']
          }
        }
      });
      
      controller.load(database)
    }

    if (services.unsafe){
      let unsafe = new UnsafeService(controller)
      controller.load(unsafe)
    }
  }
}

export default main