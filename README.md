# Websocket Live Server Utilities

These tools help us create socket servers for live communications.

This will take some time to fully document but the use cases it's being developed around are:

- Live datastreams via sockets and webRTC (datastreams-api by Garrett Flynn (AGPL v3.0))
- Live notifications/alerts and chatrooms
- MongoDB or standalone socket server data collections
- Users can create custom game sessions for exchanging data performantly (from Brains@Play).
- Rough OSC integration to be expanded on.

- Soon WebTorrent integration for creating P2P file servers

Why?

We needed a bunch of custom server functions and this was easier than trying to wrangle other people's libraries :-P

Made for [Brains@Play](https://github.com/brainsatplay/brainsatplay) and [MyAlyce](https://github.com/MyAlyce/myalyce) projects, free for anyone (AGPL v3.0 copyleft).

### Frontend

`npm i websocketliveserver-frontend`

```
//ES6 style
import { UserPlatform } from websocketliveserver-frontend

let userdata = {
    _id:'123456', //we are using randomly generated ones from realm/mongodb
    username:johnnyboi,
    email:johnnyboi@boyo.com,
    firstName:johnny,
    lastName:boyo
};

const platform = new UserPlatform(userdata,socketurl);

platform.sendMessage('123456','test');
platform.ping();

//check console. 

// You can create another user with another platform (platform2 = new UserPlatform(userdata2,socketurl)) instance as well and test it that way

```


### Backend

`npm i websocketliveserver-backend`

```
//nodejs server side app
import express from 'express';
import cors from 'cors';
import ws = require('../WebsocketLiveserver/backend/WebsocketServer');
const WebsocketServer = ws.WebsocketServer;

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
