import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

// Import the Backend API
import * as api from './backend/index.js'

const app = express();

// Parse Body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // how to allow data to only intended website without cors

// Set Server
let protocol = 'http';
const port = process.env.PORT || '80';
const server = http.createServer(app)

// Start Server
server.listen(parseInt(port), () => {
    console.log(`Server created on ${protocol}://localhost:${port}`)
});

// ---------------- Start Database --------------------
// Connect to your local instance of Mongoose
mongoose.connection.on('open', () => console.log('DB Connected!'));

mongoose.connect(process.env.DB_URI).then(init).catch(() => {

  console.error('Error: MongoDB not initialized...')
  init()

})

// ----------------- Initialize API ------------------
function init(instance) {

  // Websocket Server
  let wsServer = new api.WebsocketServer(server, {
    db: {
      mode: 'mongdb',
      instance
    },
    debug: false
  })

  wsServer.init()

}