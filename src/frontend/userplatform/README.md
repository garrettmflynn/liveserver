```
//ES6 style
import { WebsocketClient, UserPlatform } from 'liveserver-frontend'

let client = new WebsocketClient(
    socketUrl='https://localhost:80', 
    subprotocols={id:`user${Math.floor(Math.random() * 10000000000)}`}
);

let socketId = client.getSocket().id;

let userinfo = {
    _id:'123456', //we are using randomly generated ones from realm/mongodb
    username:johnnyboi,
    email:johnnyboi@boyo.com,
    firstName:johnny,
    lastName:boyo
};

const platform = new UserPlatform(client, socketId, userinfo);

platform.sendMessage('123456','test');
platform.ping();

//check console. 

// You can create another user with another platform (platform2 = new UserPlatform(userdata2,socketurl)) instance as well and test it that way

```