```
//ES6 style
import { WebsocketClient, UserPlatform } from 'liveserver-frontend'

let client = new WebsocketClient(
    socketUrl='https://localhost:80', 
    subprotocols={_id:`user${Math.floor(Math.random() * 10000000000)}`},
    true
);

let socketId = client.getSocket().id; //or just leave blank to make a new socket just for the service

let userinfo = {
    _id:'123456', //we are using randomly generated ones from realm/mongodb
    username:johnnyboi,
    email:johnnyboi@boyo.com,
    firstName:johnny,
    lastName:boyo
};

const platform = new UserPlatform(client, userinfo, socketId); //sets up the user automatically if info provided, use null or false in userinfo otherwise or it will create a dummy user

platform.sendMessage('123456','test');
platform.ping();



//check console. 

// You can create another user with another platform (platform2 = new UserPlatform(userdata2,socketurl)) instance as well and test it that way

```

And lots of functions for handling a user database with some basic form filling for stock data structures

```
platform.setupUser(userinfo) //asks the server for the data of the given user info object to st up the user platform. This runs automatically if provided in the constructor

platform.onResult = (data) => {} //can set this to be run after the default server callback


platform.closeSocket(); //close the active socket

platform.logout(); //log the user out of the server (closes connections)

platform.createStruct(
    structType,
    props={},
    parentUser={}
)

```