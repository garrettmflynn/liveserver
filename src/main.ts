let express = require("express")
let cors = require("cors")
let http = require("http")
let mongoose = require("mongoose")
let bodyParser = require("body-parser")

// Import the Backend API
import * as api from "./backend";

// Set Environment Variables
import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, `../.env`) });
config({ path: resolve(__dirname, `../.key`) });

const app = express();

// Parse Body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // how to allow data to only intended website without cors

// Set Server
let protocol = "http";
const port = process.env.PORT || "80";
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

  let http = new api.HTTPService();

  app.get("**", http.http);
  app.post("**", http.http);

  // Websocket Server
  // let websocket = new api.WebsocketService(server, http.websocket)
  let websocket = new api.WebsocketService(server, (ws:WebSocket, subprotocols: {
    [x: string]: any
  }) => {
    let id = controller.addUser(ws, subprotocols); //adds a user from a socket
    ws.send(JSON.stringify({ msg: `User added: ${id}`, id: id }));
  });


  let controller = new api.Controller({
    wss: websocket.wss,
    // debug: true,
  });

  let multiplayer = new api.SessionsService(controller);
  let osc = new api.OSCService();
  let database = new api.DatabaseService(controller, {
    mode: "mongdb",
    instance,
  });

  // Functionality
  controller.load(multiplayer)
  controller.load(database)

  // Networking
  controller.load(osc)
  controller.load(websocket)
  controller.load(http)
}
