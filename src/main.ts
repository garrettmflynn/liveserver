let express = require("express")
let cors = require("cors")
let http = require("http")
let mongoose = require("mongoose")
let bodyParser = require("body-parser")

// Import the LiveServer API
import * as api from "./backend";

// Set Environment Variables
import { resolve } from "path";
import { config } from "dotenv";
import { UnsafeService } from './backend'
import { Router } from '@brainsatplay/liveserver-common'
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
  .then(init)
  .catch(() => {
    console.error("Error: MongoDB not initialized...");
    init();
  });

  // ----------------- Initialize API ------------------
  function init(instance?:any) {

    // Instantiate the Router class to handle services
    let controller = new Router({ debug: false });

    // Enable HTTP Messages
    if (services.http){
      let http = new api.HTTPService();

      app.get("**", http.controller);
      app.post("**", http.controller);
      controller.load(http);
  }

    // Enable WebSocket Messages
    if (services.websocket){
      let websocket = new api.WebsocketService(server);
      controller.load(websocket)
    }

    if (services.osc){
      let osc = new api.OSCService();
      controller.load(osc)
    }

    if (services.webrtc){
      let webrtc = new api.WebRTCService();
      controller.load(webrtc)
    }

    if (services.sessions){
      let sessions = new api.SessionsService(controller);
      controller.load(sessions)
    }

    if (services.database){
      let database = new api.DatabaseService(controller, { mode: "mongdb", instance });
      controller.load(database)
    }

    if (services.ssr){
      let ssr = new api.SSRService();
      controller.load(ssr)
    }

    if (services.unsafe){
      let unsafe = new UnsafeService()
      controller.load(unsafe)
    }
  }
}

export default main