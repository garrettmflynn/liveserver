# Brains@Play Live Server Utilities

These tools help us create socket servers for live communications. WIP as we're reformatting and generalizing things

This will take some time to fully document but the use cases it's being developed around are:

- Generalized server frontend/backend with a structure similar to our web worker library
- Instantiate services you want through a unified framework, e.g. Socket and REST APIs with handles to easily set up streams and databases.

- Soon WebTorrent integration for creating P2P file servers


Why?

We needed a bunch of custom server functions and this was easier than trying to wrangle other people's libraries :-P

Made for [Brains@Play](https://github.com/brainsatplay/brainsatplay) and [MyAlyce](https://github.com/MyAlyce/myalyce) projects, free for anyone (AGPL v3.0 copyleft).

### Frontend

`npm i liveserver-frontend`

```
//ES6 style
import { UsersClient } from 'liveserver-frontend'

let client = new WebsocketClient(
    socketUrl='https://localhost:80', 
    subprotocols={id:`user${Math.floor(Math.random() * 10000000000)}`}
);

let socketId = client.getSocket().id;
//check console. 

client.run('ping',undefined,socketId,(result)=>{console.log(result)});


```

Derived Tools using WebsocketClient:
- [User Platform](src/frontend/UsersClient/README.md)
- [Data Streaming](src/frontend/datastream/README.md)
- [Session Streaming](src/frontend/sessionstream/README.md)
- [OSC Streaming](src/frontend/osc/README.md)


### Backend

`npm i liveserver-backend`

```
//nodejs server side app
import express from 'express';
import cors from 'cors';
const WebsocketServer = require('liveserver-backend');

const app = express();

app.use(cors()); // how to allow data to only intended website without cors

// Set Websocket Server
let protocol = 'http';
const port = process.env.PORT || '80';
const credentials: { key: null | Buffer; cert: null | Buffer; } = { key: null, cert: null };

const config = {port, protocol, credentials};
const server = new WebsocketServer(app, config);
//now it's running!

```



Contributors:

- Garrett Flynn
- Joshua Brewster
