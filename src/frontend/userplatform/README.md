```
//ES6 style
import { UserPlatform } from 'liveserver-frontend'

let userinfo = {
    _id:'123456', //we are using randomly generated ones from realm/mongodb
    username:johnnyboi,
    email:johnnyboi@boyo.com,
    firstName:johnny,
    lastName:boyo
};

const platform = new UserPlatform(WebsocketClient, socketId, userinfo);

platform.sendMessage('123456','test');
platform.ping();

//check console. 

// You can create another user with another platform (platform2 = new UserPlatform(userdata2,socketurl)) instance as well and test it that way

```