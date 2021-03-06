---
sidebar_position: 2
---

# Using the Router

### Getting Started
To start using the router, import `liveserver-router` into your project:

#### Browser
##### Script Tag
``` html
<script src="https://cdn.jsdelivr.net/npm/liveserver-router@latest">
```

#### ES6
``` js
import router from 'liveserver-router'
```

#### Node
``` js
const router = require('liveserver-router')
```

### Loading Frontend Services
In your frontend code, load specify the remote endpoints your Router will listen to:

```js
const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const SERVER_URI_2 = (window.location.href.includes('localhost')) ? 'http://localhost:81' : 'http://localhost:81' // Replace with production server URI

const endpoints = []
endpoints.push(router.addEndpoint(SERVER_URI))
endpoints.push(router.addEndpoint(SERVER_URI_2))
```

Then load any services you'll want the Router to use:

```js

import WebsocketClient from '@brainsatplay/websockets' // TODO: Publish and change name

let services = [
//   new SessionsClient(), 
//   new OSCClient(), 
  new WebsocketClient(), 
//   new WebRTCClient(), 
//   new HTTPClient(),
//   new DatabaseClient(),
//   new UnsafeClient()
]

services.forEach(service => router.load(service).then(() => console.log('Service connected!', service)))
```

At this point, your project should be able to send HTTP and WebSocket messages to supported servers.


> **Note:** Services can be strongly or weakly linked to FE / BE. Weakly linked Services can run on either FE or BE. For this case, specify backend methods with an underscore (e.g. _backendMethod) so that all frontend methods are easily referenced by an end-user.

### Adding the Backend

In your backend code, create an Express application and link this to your Router with an HTTP Service. Here we will instantiate the Router class ourselves to enable auto-debugging:

```js

// Express Imports
let express = require("express")
let bodyParser = require("body-parser")

// Router Imports
import { Router } from 'liveserver-router'
import { HTTPBackend } from '@brainsatplay/http' // TODO: Publish and relink
import { WebsocketBackend } from '@brainsatplay/websockets' // TODO: Publish and relink

// Create Express App
const app = express();
app.use(bodyParser.json());

// Create HTTP Server
let protocol = "http";
const port = '80';
const server = http.createServer(app);

// Create a Router
let router = new Router({ debug: true });

// Handle All HTTP Routes
let http = new HTTPBackend();
app.get("**", http.controller);
app.post("**", http.controller);
app.delete("**", http.controller);
router.load(http);

// Handle WebSocket Messages
let websocket = new WebsocketBackend(server);
router.load(websocket)

// Start the Server
server.listen(parseInt(port), () => {
  console.log(`Server created on ${protocol}://localhost:${port}`);
});
```