import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import bodyParser from "body-parser";

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
function init(instance) {
  let http = new api.http();

  app.get("**", http.http);
  app.post("**", http.http);

  // // Websocket Server
  // // let websocket = new api.WebsocketService(server, http.websocket)
  // let websocket = new api.WebsocketService(server, (ws,subprotocols) => {
  //   let id = controller.addUser(ws, subprotocols); //adds a user from a socket
  //   ws.send(JSON.stringify({ msg: `User added: ${id}`, id: id }));
  // });

  // let controller = new api.WebsocketController({
  //   wss: websocket.wss,
  //   db: {
  //     mode: "mongdb",
  //     instance,
  //   },
  //   debug: false,
  // });

  // // Create Services on HTTP Routes
  // let multiplayer = new api.SessionsService();
  // let osc = new api.OSCService();
  // let database = new api.DatabaseService();

  // let services = {
  //   multiplayer,
  //   database,
  //   osc,
  //   websocket,
  // };
  // Object.keys(services).forEach((k) =>
  //   http.load(k, services[k].defaultCallbacks)
  // );
}
