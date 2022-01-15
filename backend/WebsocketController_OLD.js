// Joshua Brewster, Garrett Flynn, AGPL v3.0
const { ObjectId } = require("mongodb");
const WebRTCService = require('datastreams-api/src/server/webrtc.service.js')
const OffloadService = require('datastreams-api/src/server/offload.service.js')
const OSCManager = require('./OSCManager.js');

class WebsocketController {
    
    collectionNames = [
        'profile',
        'group',
        'authorization',
        'discussion',
        'chatroom',
        'comment',
        'dataInstance',
        'event',
        'notification',
        'schedule',
        'date'
    ];
    
    constructor(app, wss, defaultMode='mongo', debug=true) {
        this.users = new Map(); //live sockets
        this.app = app; //mongoose reference
        this.mode = defaultMode;
        // this.serverInstances=appnames;
		this.userSubscriptions=[]; //User to user data subscriptions
		this.appSubscriptions=[]; //Synchronous apps (all players receive each other's data)
        this.hostSubscriptions=[]; //Asynchronous apps (host receives all users data, users receive host data only)
        this.subUpdateInterval = 0; //ms
        this.serverTimeout = 60*60*1000; //min*s*ms
        this.mongoClient = undefined;

        this.looping = true;
        //this.subscriptionLoop();

        this.webrtc = new WebRTCService(wss)
        // this.server = new OffloadService(wss)
        this.debug = debug;
        /////////DANGER////////
        // setTimeout(()=>{  //
        //     this.wipeDB();//
        // },1000)           //
        ///////////////////////
    }
    
    async processCommand(socketId="", command="",args=[], callbackId, mode=this.mode) {
        let u = this.users.get(socketId);
        if(!u || !command) return;
        if(this.debug) console.log('command', command);

        let data = undefined;
        if(command === 'ping') {
            data = 'pong';
        } else if (command === 'sendMessage' || command === 'message') { //just send whatever to someone if they're online
            data = this.sendMsg(args[0],args[1],args[2]);
        } else if(command === 'setData' || command === 'setMongoData') {
            if(mode === 'mongo') {
                data = await this.setMongoData(u,args); //input array of structs
            } else { 
                let non_notes = [];
                data = false;
                await Promise.all(args.map(async(structId) => {
                    let struct = this.getLocalData(structId);
                    let passed = await this.checkAuthorization(u,struct,mode);
                    if(passed) {
                        this.deleteLocalData(struct);
                        data = true;
                        if(struct.structType !== 'notification') non_notes.push(s);
                    }
                }));
                if(non_notes.length > 0) this.checkToNotify(u,non_notes,mode);
                return true;
            }
        } else if(command === 'getData' || command === 'getMongoData' || command === 'getUserData' || command === 'getMongoUserData') {
            if(mode === 'mongo') {
                data = await this.getMongoData(u, args[0], args[1], args[2], args[4], args[5]);
            } else {
                data = [];
                await Promise.all(args.map(async(structId) => {
                    let struct = this.getLocalData(structId);
                    let passed = await this.checkAuthorization(u,struct);
                    if(passed) data.push(struct);
                }));
            }
        } else if (command === 'getAllData') {
            if(mode === 'mongo') {
                data = await this.getAllUserMongoData(u,args[0],args[1]);
            } else {
                let result = this.getLocalData(undefined,{ownerId:args[0]});
                data = [];
                await Promise.all(result.map(async (struct) => {
                    if(args[1]) {
                        if(args[1].indexOf(struct.structType) < 0) {
                            let passed = await this.checkAuthorization(u,struct);
                            if(passed) data.push(struct);
                        }
                    } else {
                        let passed = await this.checkAuthorization(u,struct);
                        if(passed) data.push(struct);
                    }
                }));
            }
        } else if (command === 'deleteData') {
            if(mode === 'mongo') {
                data = await this.deleteMongoData(u,args);
            } else {
                data = false;
                await Promise.all(args.map(async (structId) => {
                    let struct = this.getLocalData(structId);
                    let passed = await this.checkAuthorization(u,struct);
                    if(passed) this.deleteLocalData(struct);
                    data = true;
                }));
            }
        } else if (command === 'getProfile') {
            if(mode === 'mongo') {
                data = await this.getMongoProfile(u,args[0]);
            } else {
                let struct = this.getLocalData('profile',{_id:args[0]});
                if(!struct) data = {user:{}};
                else {
                    let passed = await this.checkAuthorization(u,struct);
                    if(passed) {
                        let groups = this.getLocalData('group',{ownerId:args[0]});
                        let auths = this.getLocalData('authorization',{ownerId:args[0]});
                        data = {user:struct,groups:groups,authorizations:auths};
                    } else data = {user:{}};
                }
            }
        } else if (command === 'setProfile') {
            if(mode === 'mongo') {
                data = await this.setMongoProfile(u,args[0]);
            } else {
                let passed = await this.checkAuthorization(u,args[0],mode);
                if(passed) this.setLocalData(args[0]);
            }
        } else if (command === 'getProfilesByIds') { 
            if(mode === 'mongo') {
                data = await this.getMongoProfilesByIds(u,args[0]);
            } else {
                data = [];
                if(Array.isArray(args[0])) {
                    let struct = this.getLocalData('profile',{_id:args[0]});
                    if(struct) data.push(struct);
                }
            }
        } else if (command === 'getProfilesByRoles') {
            if(mode === 'mongo') {
                data = await this.getMongoProfilesByRoles(u,args[0]);
            } else {
                let profiles = this.getLocalData('profile');
                data = [];
                profiles.forEach((struct) => {
                    if(struct.userRoles?.includes(args[0])) {
                        data.push(struct);
                    }
                });
            }
        } else if (command === 'getGroup' || command === 'getGroups') {
            if(mode === 'mongo') {
                data = await this.getMongoGroups(u,args[0],args[1]);
            } else {
                if(typeof args[1] === 'string') {
                    data = this.getLocalData('group',{_id:args[1]});
                } else {
                    data = [];
                    let result = this.getLocalData('group');
                    if(args[0]) {
                        result.forEach((struct)=>{
                            if(struct.users.includes(args[0])) data.push(struct);
                        });
                    }
                    else {
                        result.forEach((struct)=>{
                            if(struct.users.includes(u.id)) data.push(struct);
                        });
                    }
                }
            }
        } else if (command === 'setGroup') {
            data = await this.setGroup(u,args[0],mode);
        } else if (command === 'deleteGroup') {
            if(mode === 'mongo') {
                data = await this.deleteMongoGroup(u,args[0]);
            } else {
                let struct = this.getLocalData('group',args[0]);
                let passed = false;
                if(struct) passed = this.checkAuthorization(u,struct,mode);
                if(passed) {
                    data = true;
                }
            }
        } else if(command === 'deleteProfile') {
            if(mode === 'mongo') {
                data = await this.deleteMongoProfile(u,args[0]);
            } else {
                data = false;
                let struct = this.getLocalData(args[0]);
                if(struct) {
                    let passed = this.checkAuthorization(u,struct,mode);
                    if(passed) data = this.deleteLocalData(struct);
                }
            }
        } else if (command === 'setAuth') {
            data = await this.setAuthorization(u, args[0], mode);
        } else if (command === 'getAuths') {
            if(mode === 'mongo') {
                data = await this.getMongoAuthorizations(u,args[0],args[1]);
            } else {
                if(args[1]) {
                    let result = this.getLocalData('authorization',{_id:args[1]});
                    if(result) data = [result];
                } else {
                    data = this.getLocalData('authorization',{ownerId:args[0]});
                }
            }
        }  else if (command === 'deleteAuth') {
            if(mode === 'mongo') {
                data = await this.deleteMongoAuthorization(u,args[0]);
            } else {
                data = true;
                let struct = this.getLocalData('authorization',{_id:args[0]});
                if(struct) {
                    let passed = this.checkAuthorization(u,struct,mode);
                    if(passed) data = this.deleteLocalData(struct);
                }
            }
        } 
        
        //Brains@Play multiplayer features
        else if (command === 'endsession') {
            data = this.removeUser(u,socketId);
        }
        if(command === 'getUsers') {
            let userData = [];
            this.users.forEach((o) => {
                let filtered = {};
                let propsToGet = ['sessions','username','origins', 'id'];

                propsToGet.forEach(p => {
                    filtered[p] = o[p];
                })

                if(args[1] != null) {
                    if(o.id === args[0]) {
                        userData.push(filtered);
                    }
                }
                else if(u.sessions.length > 0 && u.sessions.includes(o.appname)) {
                    userData.push(filtered);
                }
                else {
                    userData.push(filtered);
                }
            });
            if(userData.length > 0) data = {msg:'getUsersResult', userData:userData}
            else data = {msg:'usersNotFound', userData:[]};
        }
        else if(command === 'getUserLiveData') {
            if(args[1] === undefined) {
                let u2 = this.getUserData(args[0]);
                if(u2 === undefined) { data = {msg:'userNotFound',username:args[0]}; }
                else {data = {msg:'getUserLiveDataResult',username: args[0], userData:u2}; }
            }
            else if (Array.isArray(args[1])) {
                let d = this.getUserData(args[0]).props;
                let result = {msg:'getUserLiveDataResult',username:args[0],props:{}};
                if(d === undefined) { data = {msg:'userNotFound', username:args[0]}; }
                else {
                    args[1].forEach((prop)=> {result.props[prop] = d.props[prop]});
                    data = result; 
                }
            }
        }
        else if (command === 'setUserStreamSettings') {
            let sub = this.setUserStreamSettings(args[0],args[1]);
            if(sub === undefined) {
                data = {msg:'userNotFound',id:args[0]};
            } else {
                data = {msg:'userSubscriptionInfo',id:args[0],sessionInfo:sub};
            }
        }
        else if (command === 'createSession') {
            let i = this.createAppSubscription(args[0],args[1],args[2]);
            data = {msg:'sessionCreated',appname:args[0],sessionInfo:this.appSubscriptions[i]};
        }
        else if (command === 'getSessions') { //List sessions with the app name
            let subs = this.getAppSubscriptions(args[0]);
            if(subs === undefined) {
                data = {msg:'appNotFound',appname:args[0]};
            }
            else {
                data = {msg:'getSessionsResult',appname:args[0],sessions:subs};
            }
        }
        else if (command === 'getSessionInfo') { //List the app info for the particular ID
            let sub = this.getAppSubscription(args[0]);
            if(sub === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            }
            else {
                data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
            }
        }
        else if (command === 'getSessionData') {
            let sessionData = this.getSessionData(args[0]);
            if(sessionData === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            }
            else {
                data = {msg:'getSessionDataResult',id:args[0],sessionData:sessionData};
            }
        }
        else if (command === 'setSessionSettings') {
            let sub = this.setAppSettings(args[0],args[1]);
            if(sub === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            } else {
                data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
            }
        }
        else if (command === 'createHostedSession') {
            let i = this.createHostSubscription(args[0],args[1],args[2],args[3],args[4]);
            data = {msg:'sessionCreated',appname:args[0],sessionInfo:this.hostSubscriptions[i]};
        }
        else if (command === 'getHostSessions') { //List sessions with the app name
            let subs = this.getHostSubscriptions(args[0]);
            if(subs === undefined) {
                data = {msg:'appNotFound',appname:args[0]};
            }
            else {
                data = {msg:'getSessionsResult',appname:args[0],sessions:subs};
            }
        }
        else if (command === 'getHostSessionInfo') { //List the app info for the particular session ID
            let sub = this.getHostSubscription(args[0]);
            if(sub === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            }
            else {
                data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
            }
        }
        else if (command === 'getHostSessionData') {
            let sessionData = this.getHostSessionData(args[0]);
            if(sessionData === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            }
            else {
                data = {msg:'getSessionDataResult',id:args[0],sessionData:sessionData};
            }
        }
        else if (command === 'setHostSessionSettings') {
            let sub = this.setHostAppSettings(args[0],args[1]);
            if(sub === undefined) {
                data = {msg:'sessionNotFound',id:args[0]};
            } else {
                data = {msg:'getSessionInfoResult',id:args[0], sessionInfo:sub};
            }
        }
        else if(command === 'subscribeToUser') {  //User to user stream
            if(args[2]) this.streamBetweenUsers(id,args[0],args[1]);
            else this.streamBetweenUsers(id,args[0]);
        }
        else if(command === 'subscribeToSession') { //Join session
            this.subscribeUserToSession(id,args[0],args[1]);
        }
        else if(command === 'subscribeToHostSession') { //Join session
            this.subscribeUserToHostSession(id,args[0],args[1],args[2]);
        }
        else if(command === 'unsubscribeFromUser') {
            let found = undefined;
            if(args[1]) found = this.removeUserToUserStream(id,args[0],args[1]);
            else found = this.removeUserToUserStream(id,args[0]);
            if(found) {  data = {msg:'unsubscribed',id:args[0],props:args[1]};}
            else { data = {msg:'userNotFound'} }
        } else if (command === 'logout') {
            u.socket.send(JSON.stringify({msg:'logged out'}));
            u.socket.close();
        } else if(command === 'leaveSession') {
            let found = undefined;
            if(args[1]) found = this.removeUserFromSession(args[0],args[1]);
            else found = this.removeUserFromSession(args[0],u.id);
            if(found) {  data = {msg:'leftSession',id:args[0]} }
            else { data = {msg:'sessionNotFound',id:args[0]} }
        } else if(command === 'deleteSession') {
            let found = this.removeSessionStream(args[0]);
            if(found) { data = {msg:'sessionDeleted',id:args[0]};}
            else { data = {msg:'sessionNotFound'}; }
        }

        // OSC (WebSocket calls handled internally)
        else if( command === 'startOSC') {
            u.osc.add(args[0],args[1],args[2],args[3])
        } else if( command === 'sendOSC') {
            if (commands.length > 2) u.osc.send(args[0],args[1],args[2])
            else u.osc.send(args[0])
            data = {msg:'Message sent over OSC'};
        } else if( command === 'stopOSC') {
            u.osc.remove(args[0], args[1])
        }


        let toSend = {msg: command, data:data }
        if (callbackId) toSend.callbackId = callbackId;

        // console.log(toSend)
        u.socket.send(JSON.stringify(toSend));
    }

    addUser(msg,socket,availableProps=[]) {
        let socketId = this.randomId('userLoggedIn');
        let id;
        if(msg.id) id = msg.id;
        else if (msg._id) id = msg._id;
        else return false;

        console.log('adding user', id);
        let newuser = {
            id:id, 
            _id:id, 
            username:msg.username,
            socket, 
            osc: new OSCManager(socket),
            props: {},
            updatedPropnames: [],
            lastUpdate:Date.now(),
            lastTransmit:0,
            latency:0,
        };

        this.users.set(socketId, newuser);
        availableProps?.forEach((prop,i) => {
            newuser.props[prop] = '';
        });
        try {this.webrtc.addUser(socket,id)} catch (e) {console.error(e)}

        
        this.setWSBehavior(socketId, socket);
    }

    removeUser(user={},id) {
        let u = this.users.get(id);

        if(u) {
            if(u.socket) {
                try {this.webrtc.removeUser(u.socket)} catch (e) {console.error(e)}
                if(u.socket.readyState === 1 || u.socket.readyState === "1") 
                    u.socket.terminate();
            }
            this.users.delete(id);
            return true;
        } return false;
    }

    setWSBehavior(id, socket) {
        if (socket != null){
            socket.on('message', (msg="") => {
                let parsed = JSON.parse(msg);


                // Send Message through WebRTC Service
                if (parsed.service === 'webrtc') try {this.webrtc.onmessage(msg, socket)} catch (e) {console.error(e)}
        
                // console.log(msg);
                else if(Array.isArray(parsed)) { //push arrays of requests instead of single objects (more optimal potentially, though fat requests can lock up servers)
                    parsed.forEach((obj) => {
                        if(typeof obj === 'object' && !Array.isArray(obj)) { //if we got an object process it as most likely user data
                            let hasData = false;
                            for(const prop in obj) {
                                if(prop === 'userData') {
                                    hasData = true;
                                    break;
                                }
                            }
                            if(obj._id) obj.id = obj._id; //just in case
                            if(hasData) {
                                this.updateUserData(obj);
                            }
                            else if(obj.id && obj.cmd) {
                                this.processCommand(obj.id,obj.cmd,obj.args, obj.callbackId);
                            }
                            else if(obj.cmd) {
                                this.processCommand(id, obj.cmd, obj.args, obj.callbackId)
                            }
                        
                        }
                        else if (Array.isArray(obj)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                            this.processCommand(id,obj[0],obj.slice(1), obj.callbackId);  
                        }
                        else if (typeof obj === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                            let cmd = obj.split(' ');
                            this.processCommand(id,cmd[0],cmd.slice(1), obj.callbackId);
                        }
                         else {
                            // console.log(parsed);
                        }
                    })
                }
                else if(parsed.cmd) {
                    this.processCommand(id, parsed.cmd, parsed.args, parsed.callbackId)
                }
                else if (Array.isArray(parsed)) { //handle commands sent as arrays [username,cmd,arg1,arg2]
                    this.processCommand(id,parsed[0],parsed.slice(1), undefined);  
                }
                else if (typeof parsed === 'string') { //handle string commands with spaces, 'username command arg1 arg2'
                    let cmd = parsed.split(' ');
                    this.processCommand(id,cmd[0],cmd.slice(1), undefined);
                } else {
                    // console.log(parsed);
                }
            })
            socket.on('close', (s) => {
                // console.log('session closed: ', id);
                this.removeUser(id);
                try {this.webrtc.removeUser(socket)} catch (e) {console.error(e)}
            });
        }
        return socket
    }

    sendMsg(user='',msg='',data=undefined) {

        let toSend = { msg: msg };
        if(data) toSend.data = data;

        if(typeof user === 'string') {
            let u;
            this.users.forEach((obj) => {
                if(obj.id === user) u = obj;
            })
            if(u) {
                if(u.socket.readyState === 1 || u.socket.readyState === "1") {
                    //console.log('sending', u.id, toSend);
                    u.socket.send(JSON.stringify(toSend));
                    return true;
                } else return false;
            }
        } else if (typeof user === 'object') {
            if(user.socket.readyState === 1 || user.socket.readyState === "1") user.socket.send(JSON.stringify(toSend));
            return true;
        }
        return false;
    }

    randomId(tag = '') {
        return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
    }

    notificationStruct(parentStruct= {}) {
        let structType = 'notification';
        let struct = {
            structType:structType,
            timestamp:Date.now(),
            id:this.randomId(structType),
            note:'',
            ownerId: '',
            parentUserId: '',
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //where it belongs
        };

        return struct;
    }    

    //when passing structs to be set, check them for if notifications need to be created
    //TODO: need to make this more flexible in the cases you DON'T want an update
    async checkToNotify(user={},structs=[],mode=this.mode) {

        if(typeof user === 'string') {
            this.users.forEach((obj) => {
                if(obj.id === user) user = obj;
            });
        }
        if(typeof user === 'string' || typeof user === 'undefined') return false;
        let usersToNotify = {};
        //console.log('Check to notify ',user,structs);

        let newNotifications = [];
        structs.forEach(async (struct)=>{
            if (user.id !== struct.ownerId) { //a struct you own being updated by another user
                let newNotification = this.notificationStruct(struct);
                newNotification.id = 'notification_'+struct._id; //overwrites notifications for the same parent
                newNotification.ownerId = struct.ownerId;
                newNotification.note = struct.structType; //redundant now
                newNotification.parentUserId = struct.ownerId;
                newNotifications.push(newNotification);
                usersToNotify[struct.ownerId] = struct.ownerId;
            }
            if(struct.users) { //explicit user ids assigned to this struct
                struct.users.forEach((usr)=>{
                    if(usr !== user.id) {
                        let newNotification = this.notificationStruct(struct);
                        newNotification.id = 'notification_'+struct._id; //overwrites notifications for the same parent
                        newNotification.ownerId = usr;
                        newNotification.note = struct.structType;
                        newNotification.parentUserId = struct.ownerId;
                        newNotifications.push(newNotification);
                        usersToNotify[usr] = usr;
                    }
                });
            }
            else { //users not explicitly assigned so check if there are authorized users with access
                let auths = [];
                if(mode === 'mongo') {
                    let s = this.app.get('mongoose').collection('authorization').find({ $or:[{authorizedId: user.id},{authorizerId: user.id}] });
                    if(await s.count() > 0) {
                        await s.forEach(d => auths.push(d));
                    }
                } else {
                    auths = this.getLocalData('authorization',{authorizedId:user.id});
                    auths.push(...this.getLocalData('authorization',{authorizerId:user.id}));
                }
                if(auths.length > 0) {
                    auths.forEach((auth)=>{
                        if(struct.authorizerId === struct.ownerId && !usersToNotify[struct.authorizedId]) {
                            if(auth.status === 'OKAY' && auth.authorizations.indexOf('peer') > -1) {
                                let newNotification =  this.notificationStruct(struct);
                                newNotification.ownerId = auth.authorizedId;
                                newNotification.id = 'notification_'+struct._id; //overwrites notifications for the same parent
                                newNotification.note = struct.structType;
                                newNotification.parentUserId = struct.ownerId;
                                newNotifications.push(newNotification);
                                usersToNotify[newNotification.ownerId] = newNotification.ownerId;
                            }
                        }
                    });
                }
            }
        });
        
        if(newNotifications.length > 0) {
            if(mode === 'mongo'){
                await this.setMongoData(user, newNotifications); //set the DB, let the user get them 
            } else {
                this.setLocalData(newNotifications);
            }
            // console.log(usersToNotify);
            for(const uid in usersToNotify) {
                this.sendMsg(uid, 'notifications', true);
            }

            return true;
        } else return false;
    }

    
    async setMongoData(user={},structs=[]) {
        
        //console.log(structs,user);
        let toReturn = [];
        let firstwrite = false;
        //console.log(structs);
        if(structs.length > 0) {
            let passed = true;
            let checkedAuth = '';
            await Promise.all(structs.map(async (struct) => {
                if(user.id !== struct.ownerId && checkedAuth !== struct.ownerId) {
                    passed = await this.checkAuthorization(user,struct);
                    checkedAuth = struct.ownerId;
                }
                if(passed) {
                    let copy = JSON.parse(JSON.stringify(struct));
                    if(copy._id) delete copy._id;
                    //if(struct.structType === 'notification') console.log(notificaiton);
                    if(struct.id){ 
                        if(struct.id.includes('defaultId')) {
                            await this.app.get('mongoose').collection(struct.structType).insertOne(copy);   
                            firstwrite = true; 
                        }
                        else await this.app.get('mongoose').collection(struct.structType).updateOne({ id: struct.id }, {$set: copy}, {upsert: true}); //prevents redundancy in some cases (e.g. server side notifications)
                    } else if (struct._id) {
                        if(struct._id.includes('defaultId')) {
                            await this.app.get('mongoose').collection(struct.structType).insertOne(copy);   
                            firstwrite = true; 
                        }
                        else await this.app.get('mongoose').collection(struct.structType).updateOne({_id: new ObjectId(struct._id)}, {$set: copy}, {upsert: false});
                    }
                }
            }));

            if(firstwrite === true) {
                //console.log('firstwrite');
                let toReturn = []; //pull the server copies with the updated Ids
                await Promise.all(structs.map(async (struct,j)=>{
                    let copy = JSON.parse(JSON.stringify(struct));
                    if(copy._id) delete copy._id;

                    if(struct.structType !== 'comment') {
                        let pulled;
                        if(struct.structType !== 'notification') pulled = await this.app.get('mongoose').collection(copy.structType).findOne(copy);
                        if(pulled){
                            pulled._id = pulled._id.toString();
                            toReturn.push(pulled);
                        }
                    }
                    else if(struct.structType === 'comment') { //comments are always pushed with their updated counterparts. TODO handle dataInstances
                        let comment = struct;
                        let copy2 = JSON.parse(JSON.stringify(comment));
                        if(copy2._id) delete copy2._id;
                        let pulledComment = await this.app.get('mongoose').collection('comment').findOne(copy2);
                        
                        let replyToId = comment.replyTo;
                        let replyTo = structs.find((s)=>{
                            if(s._id === replyToId) return true;
                        });
                        if(replyTo) {
                            let copy3 = JSON.parse(JSON.stringify(replyTo));
                            if(copy3._id) delete copy3._id;
                            let pulledReply;

                            await Promise.all(['discussion','chatroom','comment'].map(async (name) => {
                                let found = await this.app.get('mongoose').collection(name).findOne({_id:new ObjectId(replyToId)});
                                if(found) pulledReply = found;
                            }));
                            //console.log(pulledReply)
                            if(pulledReply) {

                                let roomId = comment.parent._id;
                                let room, pulledRoom;
                                if(roomId !== replyToId) {
                                    room = structs.find((s)=>{
                                        if(s._id === roomId) return true;
                                    });
                                    if(room) {
                                        delete room._id;
                                        await Promise.all(['discussion','chatroom'].map(async (name) => {
                                            let found = await this.app.get('mongoose').collection(name).findOne(room);
                                            if(found) pulledRoom = found;
                                        }));
                                    }
                                } else pulledRoom = pulledReply;

                                if(pulledReply) {
                                    let i = pulledReply.replies.indexOf(comment._id);
                                    if(i > -1) {
                                        pulledReply.replies[i] = pulledComment._id.toString();
                                        pulledComment.replyTo = pulledReply._id.toString();
                                    }
                                } 
                                if (pulledRoom) {
                                    let i = pulledRoom.comments.indexOf(comment._id);
                                    if(i > -1) {
                                        pulledRoom.comments[i] = pulledComment._id.toString();
                                        pulledComment.parent._id = pulledRoom._id.toString();
                                    }
                                }
                                let toUpdate = [pulledComment,pulledReply];
                                if(pulledRoom._id.toString() !== pulledReply._id.toString()) toUpdate.push(pulledRoom);
                                await Promise.all(toUpdate.map(async(s)=>{
                                    let copy = JSON.parse(JSON.stringify(s));
                                    delete copy._id;
                                    await this.app.get('mongoose').collection(s.structType).updateOne({_id:new ObjectId(s._id)},{$set: copy},{upsert: false});
                                }));

                                // console.log('pulled comment',pulledComment)
                                // console.log('pulled replyTo',pulledReply)
                                // console.log('pulled room',pulledRoom);
                                [...toReturn].reverse().forEach((s,j) => {
                                    if(toUpdate.find((o)=>{
                                        if(s._id.toString() === o._id.toString()) return true;
                                    })){
                                        toReturn.splice(toReturn.length-j-1,1); //pop off redundant
                                    }
                                });
                                toReturn.push(...toUpdate); 
                            } 
                        } else if(pulledComment) {
                            toReturn.push(pulledComment);
                        }
                    }
                }));
                this.checkToNotify(user,toReturn);
                return toReturn;
            }
            else {
                let non_notes = [];
                structs.forEach((s) => {
                    if(s.structType !== 'notification') non_notes.push(s);
                })
                this.checkToNotify(user,non_notes);
                return true;
            }
        }
        else return false;
    }

    async setMongoProfile(user={},struct={}) {
        if(struct.id) { //this has a second id that matches the token id
            if(user.id !== struct.id) {
                let passed = await this.checkAuthorization(user,struct);
                if(!passed) return false;
            }

            let copy = JSON.parse(JSON.stringify(struct));
            if(copy._id) delete copy._id;

            console.log('RETURNS PRFILe', struct)
            if(struct._id.includes('defaultId')) {
                await this.app.get('mongoose').collection(struct.structType).insertOne(copy);
            }
            else await this.app.get('mongoose').collection('profile').updateOne({ _id: new ObjectId(struct._id) }, {$set: copy}, {upsert: true}); 

            this.checkToNotify(user, [struct]);
            return true;
        } else return false;
    }

    async setGroup(user={},struct={},mode=this.mode) {
        
        if(struct._id) {
            let exists = undefined;
            if(mode === 'mongo') {
                exists = await this.app.get('mongoose').collection('group').findOne({name:struct.name});
            } else {
                exists = this.getLocalData('group',{_id:struct._id});
            }
            if(exists && (exists.ownerId !== struct.ownerId || struct.admins.indexOf(user.id) < 0) ) return false; //BOUNCE

            if(user.id !== struct.ownerId) {
                let passed = await this.checkAuthorization(user,struct,mode);
                if(!passed) return false;
            }

            let allusers = [];
            struct.users.forEach((u) => {
                allusers.push({email: u},{id: u},{username:u})    
            });
            
            //replace everything with ids
            let users = [];
            let ids = [];
            if(mode === 'mongo') {
                let cursor = this.app.get('mongoose').collection('users').find({ $or: allusers }); //encryption references
                if( await cursor.count() > 0) {
                    await cursor.forEach((user) => {
                        users.push(user);
                        ids.push(user.id);
                    });
                }
            } else {
                allusers.forEach((search) => {
                    let result = this.getLocalData('profile',search);
                    if(result.length > 0) {
                        users.push(result[0]);
                        ids.push(result[0].id);
                    }
                });
            }

            struct.users = ids;
            let admins = [];
            let peers = [];
            let clients = [];
            users.forEach((u) => {
                struct.admins.find((useridentifier,i)=>{ //owner is always admin
                    if(useridentifier === u.id || useridentifier === u.email || useridentifier === u.username || u.id === struct.ownerId) {
                        if(admins.indexOf(u.id < 0)) admins.push(u.id);
                        return true;
                    }
                });
                struct.peers.find((useridentifier,i)=>{
                    if(useridentifier === u.id || useridentifier === u.email || useridentifier === u.username) {
                        if(peers.indexOf(u.id < 0)) peers.push(u.id);
                        return true;
                    }
                });
                struct.clients.find((useridentifier,i)=>{
                    if(useridentifier === u.id || useridentifier === u.email || useridentifier === u.username) {
                        if(clients.indexOf(u.id < 0)) clients.push(u.id);
                        return true;
                    }
                });
            });
            struct.admins = admins;
            struct.peers = peers;
            struct.clients = clients;


            //All now replaced with lookup ids

            let copy = JSON.parse(JSON.stringify(struct));
            if(copy._id) delete copy._id;
            //console.log(struct)
            if(mode === 'mongo'){
                if(struct._id.includes('defaultId')) {
                    await this.app.get('mongoose').collection(struct.structType).insertOne(copy);
                }
                else await this.app.get('mongoose').collection('group').updateOne({ _id: new ObjectId(struct._id) }, {$set: copy}, {upsert: true}); 
            } else {
                this.setLocalData(struct);
            }
            this.checkToNotify(user, [struct], mode);
            return true;
        } else return false;
    }

    //
    async getMongoProfile(user={},info='', bypassAuth=false) {
        return new Promise(async resolve => {
            const query = [{email: info},{id: info},{username:info}]
            try {query.push({_id: new ObjectId(info)})} catch (e) {}

            let u = await this.app.get('mongoose').collection('users').findOne({$or: query}); //encryption references
            
            if(!u || u == null) resolve({user:{}});
            else {
                if (!u.id && u._id) u.id = u._id.toString()
                if (!u.ownerId) u.ownerId = u.id

                if (u && bypassAuth === false){
                    if(user.id !== u.id) {
                        let passed = await this.checkAuthorization(user,u);
                        if(!passed) resolve(undefined);
                    }
                    // console.log(u);
                    let authorizations = [];
                    let auths = this.app.get('mongoose').collection('authorization').find({ownerId:u.id});
                    if((await auths.count() > 0)) {
                        await auths.forEach(d => authorizations.push(d));
                    }
                    let gs = this.app.get('mongoose').collection('group').find({users:{$all:[u.id]}});
                    let groups = [];
                    if((await gs.count() > 0)) {
                        await gs.forEach(d => groups.push(d));
                    }
                    
                    resolve({user:u, authorizations:authorizations, groups:groups});
                } else resolve({user:u});
            }
        });   
    }

    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    async getMongoProfilesByIds(user={},userIds=[]) {
        let usrs = [];
        userIds.forEach((u) => {
            try {usrs.push({_id:new ObjectId(u)});} catch {}
        });

        let found = [];
        if (usrs.length > 0){
            let users = this.app.get('mongoose').collection('users').find({$or:usrs});
            if(await users.count() > 0) {
                await users.forEach((u) => {
                    found.push(u);
                });
            }
        }

        return found;
    }

    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    async getMongoProfilesByRoles(user={},userRoles=[]) {
        let users = this.app.get('mongoose').collection('users').find({
            userRoles:{$all: userRoles}
        });
        let found = [];
        if(await users.count() > 0) {
            await users.forEach((u) => {
                found.push(u);
            });
        }
        return found;
    }

    //get all data for an associated user, can add a search string
    async getMongoData(user={}, collection, ownerId, dict={}, limit=0, skip=0) {
        if (!ownerId) ownerId = dict?.ownerId // TODO: Ensure that replacing ownerId, key, value with dict was successful
        if (dict._id) dict._id = ObjectId(dict._id)

        let structs = [];
        let passed = true;
        let checkedAuth = '';
        if(!collection && !ownerId && !dict) return [];
        else if(!collection && ownerId && Object.keys(dict).length === 0) return await this.getAllUserMongoData(user,ownerId);
        else if(!dict && ownerId) {
            let cursor = this.app.get('mongoose').collection(collection).find({ownerId}).sort({ $natural: -1 }).skip(skip);
            if(limit > 0) cursor.limit(limit);
            if(await cursor.count() > 0) {
                await cursor.forEach(async (s) => {
                    if(user.id !== s.ownerId && checkAuth !== s.ownerId) {
                        passed = await this.checkAuthorization(user,s);
                        checkedAuth = s.ownerId;
                    }
                    if(passed === true) structs.push(s);
                });
            }
        } else if (!!dict && Object.keys(dict).length > 0 && ownerId) {
            let found = await this.app.get('mongoose').collection(collection).findOne({ownerId:ownerId,...dict});
            if(found) structs.push(found);
        } else if (!!dict && Object.keys(dict).length > 0 && !ownerId) { //need to search all collections in this case
            await Promise.all(this.collectionNames.map(async (name) => {
                let found = await this.app.get('mongoose').collection(name).findOne(dict);
                if(found) {
                    if(user.id !== found.ownerId && checkAuth !== found.ownerId) {
                        passed = await this.checkAuthorization(user,found);
                        checkedAuth = found.ownerId;
                    }
                    structs.push(found);
                    return
                }
            }));
        }
        if(!passed) return [];
        return structs;
    }

    async getAllUserMongoData(user={},ownerId,excluded=[]) {
        let structs = [];
        //let collectionNames = await this.app.get('mongoose').getCollectionNames()

        let passed = true;
        let checkedId = '';
        await Promise.all(this.collectionNames.map(async (name,j) => {
            if(passed && excluded.indexOf(name) < 0) {
                let cursor = this.app.get('mongoose').collection(name).find({ownerId:ownerId});
                let count = await cursor.count();
                for(let k = 0; k < count; k++) {
                    let struct = await cursor.next();
                    if(user.id !== ownerId && checkedId !== ownerId) {
                        passed = await this.checkAuthorization(user,struct);
                        //console.log(passed)
                        checkedId = ownerId;
                    }
                    //if(j === 0 && k === 0) console.log(passed,structs);
                    if(passed) structs.push(struct);
                }
                
            }
        }));

        if(!passed) return [];
        //console.log(structs);
        //console.log(passed, structs);
        return structs;
    }

    //passing in structrefs to define the collection (structType) and id
    async getMongoDataByRefs(user={},structRefs=[]) {
        let structs = [];
        //structRef = {structType, id}
        if(structs.length > 0) {
            let checkedAuth = '';
            structRefs.forEach(async (ref)=>{
                if(ref.structType && ref._id) {
                    let struct = await this.app.get('mongoose').collection(ref.structType).findOne({_id: new ObjectId(ref._id)});
                    if(struct) {
                        let passed = true;
                        if(user.id !== struct.ownerId && checkedAuth !== struct.ownerId) {
                            let passed = await this.checkAuthorization(user,struct);
                            checkedAuth = struct.ownerId;
                        }
                        if(passed === true) {
                            structs.push(struct);
                        }
                    }
                }
            });
        } 
        return structs;
    }

    async getMongoAuthorizations(user={},ownerId=user.id, authId='') {
        let auths = [];
        if(authId.length === 0 ) {
            let cursor = this.app.get('mongoose').collection('authorization').find({ownerId:ownerId});
            if(await cursor.count > 0) {
                await cursor.forEach((a) => {
                    auths.push(a)
                });
            }
        }
        else auths.push(await this.app.get('mongoose').collection('authorization').findOne({_id: new ObjectId(authId), ownerId:ownerId}));
        if(user.id !== auths[0].ownerId) {
            let passed = await this.checkAuthorization(user,auths[0]);
            if(!passed) return undefined;
        }
        return auths;

    }

    async getMongoGroups(user={}, userId=user.id, groupId='') {
        let groups = [];
        if(groupId.length === 0 ) {
            let cursor = this.app.get('mongoose').collection('group').find({users:{$all:[userId]}});
            if(await cursor.count > 0) {
                await cursor.forEach((a) => {
                    groups.push(a)
                });
            }
        }
        else {
            try {groups.push(await this.app.get('mongoose').collection('group').findOne({_id:new ObjectId(groupId), users:{$all:[userId]}}));} catch {}
        }

        return groups;
    }

    //general delete function
    async deleteMongoData(user={},structRefs=[]) {
        let ids = [];
        let structs = [];

        await Promise.all(structRefs.map(async (ref) => {

            try {
                let _id = new ObjectId(ref._id)
                let struct = await this.app.get('mongoose').collection(ref.structType).findOne({_id});
                if(struct) {
                    structs.push(struct);
                    let notifications = await this.app.get('mongoose').collection('notification').find({parent:{structType:ref.structType,id:ref._id}});
                    let count = await notifications.count();
                    for(let i = 0; i < count; i++) {
                        let note = await notifications.next();
                        if(notification) structs.push(notification);
                    }
                }
            } catch {}

        }));

        let checkedOwner = '';
        await Promise.all(structs.map(async (struct,i)=>{
            let passed = true;
            if(struct.ownerId !== user.id && struct.ownerId !== checkedOwner) {
                checkedOwner = struct.ownerId;
                passed = await this.checkAuthorization(user, struct);
            }
            if(passed) {
                //console.log(passed);
                await this.app.get('mongoose').collection(struct.structType).deleteOne({_id:new ObjectId(struct._id)});
                //delete any associated notifications, too
                if(struct.users) {
                    struct.users.forEach((uid)=> {
                        if(uid !== user.id && uid !== struct.ownerId) this.sendMsg(uid,'deleted',struct._id);
                    });
                }
                if(struct.ownerId !== user.id) {
                    this.sendMsg(struct.ownerId,'deleted',struct._id);
                }
            }
        }));

        return true; 
    }

    //specific delete functions (the above works for everything)
    async deleteMongoProfile(user={},userId) {
        
        if(user.id !== userId) {
            let u = await this.app.get('mongoose').collection('users').findOne({ id: userId });
            let passed = await this.checkAuthorization(user,u);
            if(!passed) return false;
        }

        await this.app.get('mongoose').collection('users').deleteOne({ id: userId });

        if(user.id !== userId) this.sendMsg(userId,'deleted',userId);

        //now delete their authorizations and data too (optional?)
        return true; 
    }

    async deleteMongoGroup(user={},groupId) {
        let s = await this.app.get('mongoose').collection('group').findOne({ _id: new ObjectId(groupId) });
        if(s) {
            if(user.id !== s.ownerId) {
                let passed = await this.checkAuthorization(user,s);
                if(!passed) return false;
            }
            if(s.users) {
                s.users.forEach((u) => { this.sendMsg(s.authorizerId,'deleted',s._id); });
            }
            await this.app.get('mongoose').collection('group').deleteOne({ _id:new ObjectId(groupId) });
            return true;
        } else return false; 
    }


    async deleteMongoAuthorization(user={},authId) {
        let s = await this.app.get('mongoose').collection('authorization').findOne({ _id: new ObjectId(authId) });
        if(s) {
            if(user.id !== s.ownerId) {
                let passed = await this.checkAuthorization(user,s);
                if(!passed) return false;
            }
            if(s.associatedAuthId) {
                console.log(s);
                await this.app.get('mongoose').collection('authorization').deleteOne({ _id: new ObjectId(s.associatedAuthId) }); //remove the other auth too 
                if(s.authorizerId !== user.id) this.sendMsg(s.authorizerId,'deleted',s._id);
                else if (s.authorizedId !== user.id) this.sendMsg(s.authorizedId,'deleted',s._id);
            }
            await this.app.get('mongoose').collection('authorization').deleteOne({ _id: new ObjectId(authId) });
            return true;
        } else return false; 
    }

    async setAuthorization(user, authStruct, mode=this.mode) {
        //check against authorization db to allow or deny client/professional requests.
        //i.e. we need to preauthorize people to use stuff and allow each other to view sensitive data to cover our asses

        /**
         *  structType:'authorization',
            authorizedId:'',
            authorizerId:'',
            authorizations:[], //authorization types e.g. what types of data the person has access to
            structIds:[], //necessary files e.g. HIPAA compliance //encrypt all of these individually, decrypt ONLY on access with hash keys and secrets and 2FA stuff
            status:'PENDING',
            expires:'', //PENDING for non-approved auths
            timestamp:Date.now(), //time of creation
            id:randomId(structType),
            ownerId: '',
            parentId: parentStruct?.id, //where it belongs
         */

        let u1, u2;
        if(mode === 'mongo') {
            u1 = await this.getMongoProfile(user, authStruct.authorizedId, true)?.user; //can authorize via email, id, or username
            u2 = await this.getMongoProfile(user, authStruct.authorizerId, true)?.user;
        } else {
            u1 = this.getLocalData('profile',{'_id':authStruct.authorizedId});
            u2 = this.getLocalData('profile',{'_id':authStruct.authorizedId});
        }

        if(!u1 || !u2) return false; //no profile data

        if(authStruct.authorizedId !== u1.id) authStruct.authorizedId = u1.id;
        if(authStruct.authorizerId !== u2.id) authStruct.authorizerId = u2.id;
        //console.log(authStruct);

        if(user.id !== authStruct.ownerId && (user.id !== authStruct.authorizedId && user.id !== authStruct.authorizerId)) {
            let passed = await this.checkAuthorization(user,authStruct);
            if(!passed) return false;
        }

        let auths = [];

        if(mode === 'mongo'){
            let s = this.app.get('mongoose').collection('authorization').find(
                { $and: [ { authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId } ] }
            );
            if ((await s.count()) > 0) {
                await s.forEach(d => auths.push(d));
            }
        } else {
            let s = this.getLocalData('authorization',{authorizedId:authStruct.authorizedId});
            if(Array.isArray(s)) {
                s.forEach((d)=>{
                    if(d.authorizerId === authStruct.authorizerId) auths.push(d);
                });
            }
        }

        let otherAuthset;
        if(Array.isArray(auths)) {
            auths.forEach(async (auth) => {
                if(auth.ownerId === user.id) { //got your own auth
                    //do nothing, just update your struct on the server if the other isn't found
                } else { //got the other associated user's auth, now can compare and verify
                    if(authStruct.authorizerId === user.id) { //if you are the one authorizing
                        auth.authorizations = authStruct.authorizations; //you set their permissions
                        auth.structIds = authStruct.structIds; //you set their permissions
                        auth.excluded = authStruct.excluded;
                        auth.expires = authStruct.expires;
                        //auth.groups = authStruct.groups;
                        auth.status = 'OKAY';
                        authStruct.status = 'OKAY'; //now both auths are valid, delete to invalidate
                    } else { //if they are the authorizor
                        authStruct.authorizations = auth.authorizations; //they set your permissions
                        authStruct.structIds = auth.structIds; //they set your permissions
                        authStruct.excluded = auth.excluded;
                        authStruct.expires = auth.expires;
                        //authStruct.groups = auth.groups;
                        auth.status = 'OKAY';
                        authStruct.status = 'OKAY'; //now both auths are valid, delete to invalidate
                    }
                    authStruct.associatedAuthId = auth._id.toString();
                    auth.associatedAuthId = authStruct._id.toString();
                    otherAuthset = auth;
                    let copy = JSON.parse(JSON.stringify(auth));
                    if(mode === 'mongo') {
                        delete copy._id;
                        await this.app.get('mongoose').collection('authorization').updateOne({ $and: [ { authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: auth.ownerId } ] }, {$set: copy}, {upsert: true});
                    } else {
                        this.setLocalData(copy);
                    }
                }
            });
        }

        
        let copy = JSON.parse(JSON.stringify(authStruct));
        if(mode ==='mongo') {
            delete copy._id;
            await this.app.get('mongoose').collection('authorization').updateOne({ $and: [ { authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: authStruct.ownerId } ] }, {$set: copy}, {upsert: true});
        } else {
            this.setLocalData(copy);
        }

        if(authStruct._id.includes('defaultId') && mode === 'mongo') {
            let replacedAuth = await this.app.get('mongoose').collection('authorization').findOne(copy);
            if(replacedAuth) {
                authStruct._id = replacedAuth._id.toString();
                if(otherAuthset) {
                    let otherAuth = await this.app.get('mongoose').collection('authorization').findOne({$and: [ { authorizedId: otherAuthset.authorizedId }, { authorizerId: otherAuthset.authorizerId }, { ownerId: otherAuthset.ownerId } ] });
                    if(otherAuth) {
                        otherAuth.associatedAuthId = authStruct._id;
                        delete otherAuth._id;
                        await this.app.get('mongoose').collection('authorization').updateOne({ $and: [ { authorizedId: otherAuth.authorizedId }, { authorizerId: otherAuth.authorizerId }, { ownerId: otherAuth.ownerId } ] }, {$set: otherAuth}, {upsert: true}); 
                        this.checkToNotify(user,[otherAuth]);
                    }
                }
            }
        }

        return authStruct; //pass back the (potentially modified) authStruct
    }

    
    async checkAuthorization(user, struct,mode = this.mode) {
        /*
            If user is not the owner of the struct, check that they have permissions
        */
        //console.log(struct)
        if(!user || !struct) return false;

        if(typeof user === 'object') {
            if(struct.ownerId === user.id) return true; 
        } else if (typeof user === 'string') {
            if(struct.ownerId === user) return true;
            else user = {id:user};
        }

        let auth1, auth2;
        if(mode === 'mongo') {
            auth1 = await this.app.get('mongoose').collection('authorization').findOne({$or: [{authorizedId:user.id,authorizerId:struct.ownerId, ownerId:user.id},{authorizedId:struct.ownerId,authorizerId:user.id, ownerId:user.id}]});
            auth2 = await this.app.get('mongoose').collection('authorization').findOne({$or: [{authorizedId:user.id,authorizerId:struct.ownerId, ownerId:struct.ownerId},{authorizedId:struct.ownerId,authorizerId:user.id, ownerId:struct.ownerId}]});
        }
        else {
            auth1 = this.getLocalData('authorization', {ownerId:user.id}).find((o) => {
                if(o.authorizedId === user.id && o.authorizerId === struct.ownerId) return true;
            });
            auth2 = this.getLocalData('authorization', {ownerId:struct.ownerId}).find((o) => {
                if(o.authorizedId === user.id && o.authorizerId === struct.ownerId) return true;
            });
        }
         if(!auth1 || !auth2) {
            //console.log('auth bounced', user, struct, auth1, auth2);
            return false;
        }

        //let data = await this.app.get('mongodb').collection('data').findOne({id:structId});

        /*
            check if both users have the correct overlapping authorizations for the authorized user for the specific content, check first based on structId metadata to save calls
                i.e. 
                check relevant scenarios like
                e.g. is the user an assigned peer?
                e.g. does this user have the required specific access permissions set? i.e. for different types of sensitive data
        */
    
        let passed = false;

        if(auth1.status === 'OKAY' && auth2.status === 'OKAY') {
            if(struct.structType === 'group') {
                if (auth1.authorizations.indexOf(struct.name+'_admin') > -1 && auth2.authorizations.indexOf(group.name+'_admin') > -1) passed = true;
                else passed = false;
            }
            else if(auth1.authorizations.indexOf('provider') > -1 && auth2.authorizations.indexOf('provider') > -1) passed = true;
            else if(auth1.authorizations.indexOf('peer') > -1 && auth2.authorizations.indexOf('peer') > -1) passed = true;
            else if (auth1.structIds?.indexOf(struct._id) > -1 && auth2.structIds?.indexOf(struct._id) > -1) passed = true;
            //other conditions?
        }

        //if(!passed) console.log('auth bounced', auth1, auth2);

        return passed;
    }

    wipeDB = async () => {
        //await this.app.get('mongoose').collection('authorization').deleteMany({});
        //await this.app.get('mongoose').collection('group').deleteMany({});
        await this.app.get('mongoose').collection('profile').deleteMany({});
        await this.app.get('mongoose').collection('data').deleteMany({});

        return true;
    }


    //Local Data stuff (for non-mongodb usage of this server)

    //just assigns replacement object to old object if it exists, keeps things from losing parent context in UI
    overwriteLocalData (structs) {
        if(Array.isArray(structs)){
            structs.forEach((struct) => {
                let localdat =  this.getLocalData(struct.structType,{'ownerId': struct.ownerId, '_id':struct._id});
                if(!localdat || localdat?.length === 0) {
                    this.setLocalData(struct);       //set
                }
                else Object.assign(localdat,struct); //overwrite
            })
        } else {
            let localdat =  this.getLocalData(structs.structType,{'ownerId': structs.ownerId, '_id':structs._id});
            if(!localdat || localdat?.length === 0) {
                this.setLocalData(structs);       //set
            }
            else Object.assign(localdat,structs); //overwrite
        }
    }

    setLocalData (structs) {

        let setInCollection = (s) => {
            let type = s.structType;
        
            let collection = this.collections.get(type);
            if(!collection) {
                collection = new Map();
                this.collections.set(type,collection);
            }
            collection.set(s._id,s);

            // Keep Store Concurrent
            if(store){
                //let state = store.getState()
                let newArr = Array.from(collection).map(arr => arr[1])
                // if (type === 'profile') newArr = newArr.map(u => getUserCodes(u, true))
                store.setState({[type]: newArr})
            }
        }

        if(Array.isArray(structs)) {
            structs.forEach((s)=>{
                setInCollection(s)
            });
        }
        else setInCollection(structs)
    }

    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    getLocalData(collection, query) {

        // Split Query
        let ownerId, key, value;
        if (typeof query === 'object'){
            ownerId = query.ownerId
            // TODO: Make more robust. Does not support more than one key (aside from ownerId)
            const keys = Object.keys(query).filter(k => k != 'ownerId')
            key = keys[0]
            value = query[key]
        } else value = query
        
        if (!collection && !ownerId && !key && !value) return [];

        let result = [];
        if(!collection && (ownerId || key)) {
            this.collections.forEach((c) => { //search all collections
                if((key === '_id' || key === 'id') && value) {
                    let found = c.get(value);
                    if(found) result.push(found);
                }
                else {
                    c.forEach((struct) => {
                        if(key && value) {
                            if(struct[key] === value && struct.ownerId === ownerId) {
                                result.push(struct);
                            }
                        }
                        else if(struct.ownerId === ownerId) {
                            result.push(struct);
                        }
                    });
                }
            });
            return result;
        }
        else {
            let c = this.collections.get(collection);
            if(!c) return result; 

            if(!key && !ownerId) {
                c.forEach((struct) => {result.push(struct);})
                return result; //return the whole collection
            }
            
            if((key === '_id' || key === 'id') && value) return c.get(value); //collections store structs by id so just get the one struct
            else {
                c.forEach((struct,k) => {
                    if(key && value && !ownerId) {
                        if(struct[key] === value) result.push(struct);
                    }   
                    else if(ownerId && !key) {
                        if(struct.ownerId === ownerId) result.push(struct);
                    } 
                    else if (ownerId && key && value) {
                        if(struct.ownerId === ownerId && struct[key]) {
                            if(struct[key] === value) result.push(struct);
                        }
                    }
                });
            }
        }
        return result;                            //return an array of results
    }

    
    deleteLocalData(struct) {
        if(!struct) throw new Error('Struct not supplied')
        if(!struct.structType || !struct._id) return false;
        this.collections.get(struct.structType).delete(struct._id);
        return true;
    }


    //BEGIN BRAINSTORM PORT

    //Received a message from a user socket, now parse it into system
	updateUserData(data={id:'',userData:{}}){ 
		//Send previous data off to storage
        if (this.users.has(data.id)){

            let u = this.users.get(data.id);

            for(const prop in data.userData) {
                u.props[prop] = data.userData[prop];
                if(u.updatedPropnames.indexOf(prop) < 0)
                    u.updatedPropnames.push(prop);
            }

            let now = Date.now();
            u.latency = now-u.lastUpdate;
            u.lastUpdate = now;

            this.userSubscriptions.forEach((o,i) => {
                if(o.source === data.id) {
                    o.newData = true;
                }
            });

            this.appSubscriptions.forEach((o,i) => {

                let u = o.users[data.id]
                let s = o.spectators[data.id]
                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            this.hostSubscriptions.forEach((o,i) => {
                let u = o.users[data.id]
                let s = o.spectators[data.id]

                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            //o.socket.send(JSON.stringify(o.props));
            
        }
	}

	streamBetweenUsers(listenerUser,sourceUser,propnames=[]) {

        console.log(listenerUser, sourceUser)
        let idx = undefined;
        let sub = this.userSubscriptions.find((o,i) => {
            if(o.listener === listenerUser && o.source === sourceUser) {
                idx = i;
                o.propnames = propnames;
                return true;
            }
        });
        if(sub === undefined) {
            let source = this.users.get(sourceUser);
            if(propnames.length === 0) {
                for(const propname in source.props) {
                    propnames.push(propname);
                }
            }
            let u = this.users.get(listenerUser);
            if(u !== undefined && source !== undefined) {
                this.userSubscriptions.push({
                    listener:listenerUser,
                    source:sourceUser,
                    id:sourceUser+"_"+Math.floor(Math.random()*10000000),
                    propnames:propnames,
                    settings:[],
                    newData:false,
                    lastTransmit:0
                });
                console.log('subscribed to user')
                u.socket.send(JSON.stringify({msg:'subscribedToUser', sub:this.userSubscriptions[this.userSubscriptions.length-1]}))
                return this.userSubscriptions[this.userSubscriptions.length-1];
            }
            else {
                u.socket.send(JSON.stringify({msg:'userNotFound', id:sourceUser}));
            }
            
        }
        else { 
            return idx;
        }
	}

    setUserStreamSettings(id='',settings={}) {
        let sub = this.userSubscriptions.find((o) => {
            if(o.id === id) {
                o.settings = settings;
                return true;
            }
        });
        return sub;
    }

	createAppSubscription(appname='',devices=[],propnames=[]) {
        // this.mongoClient.db("brainsatplay").collection('apps').find({ name: appname }).count().then(n => {
        //     if (n > 0){
                this.appSubscriptions.push({
                    appname:appname,
                    devices:devices,
                    id:appname+"_"+Math.floor(Math.random()*10000000),
                    users:{},
                    updatedUsers:[], //users with new data available (clears when read from subcription)
                    newUsers:[], //indicates users that just joined and have received no data yet
                    spectators:{}, //usernames of spectators
                    propnames:propnames,
                    host:'',
                    settings:[],
                    lastTransmit:Date.now()
                });
            // } else {
            //     console.log('error: app not configured.')
            // }
        // });

        return this.appSubscriptions.length - 1;
	}

	getAppSubscriptions(appname='') {
		let g = this.appSubscriptions.filter((o) => {
            if(o.appname === appname) return true;
        })
        if(g.length === 0) return undefined;
		else return g;
	}

    getAppSubscription(id='') {
		let g = this.appSubscriptions.find((o,i) => {
			if(o.id === id) {
				return true;
			}
		});
        return g;
	}

    setAppSettings(id='',settings={}) {
        let g = this.appSubscriptions.find((o,i) => {
			if(o.id === id) {
                o.settings = settings;
				return true;
			}
		});
        return g;
    }

    getSessionData(id='') {
        let sessionData = undefined;
        let s = this.appSubscriptions.find((sub,i) => {
            if(sub.id === id) {
                let updateObj = {
                    msg:'sessionData',
                    appname:sub.appname,
                    devices:sub.devices,
                    id:sub.id,
                    propnames:sub.propnames,
                    users:sub.users,
                    host:sub.host,
                    updatedUsers:sub.updatedUsers,
                    newUsers:sub.newUsers,
                    userData:[],
                    spectators:{}
                };
                
                let allIds = Object.assign({}, sub.users)
                allIds = Object.assign(allIds, sub.spectators)
                Object.keys(allIds).forEach((user,j) => { //get current relevant data for all players in session
                    if(sub.spectators[user] == null){
                        let userObj = {
                            id:user
                        }
                        let listener = this.users.get(user);
                        if(listener) {
                            sub.propnames.forEach((prop,k) => {
                                userObj[prop] = listener.props[prop];
                            });
                            updateObj.userData.push(userObj);
                        }
                    }
                    else {
                        updateObj.spectators.push(user);
                    }
                });
                sessionData = updateObj;
                return true;
            }
        });
        return sessionData;
    }

	subscribeUserToSession(id,sessionId,spectating=false) {

        let g = this.getAppSubscription(sessionId);
        let u = this.users.get(id);

		if(g !== undefined && u !== undefined) {

            if (Object.keys(g.users).length === 0 && !spectating){
                g.host = id;
            }

            if( g.users[id] == null && g.spectators[id] == null) { 
                if(spectating === true) g.spectators[id] = u.username
                else {
                    g.users[id] = u.username
                    g.newUsers.push(id);
                    g.updatedUsers.push(id);
                }
            }
			
			g.propnames.forEach((prop,j) => {
                if(!(prop in u.props)) u.props[prop] = '';
            });
            
            u.sessions.push(sessionId);
            
			//Now send to the user which props are expected from their client to the server on successful subscription
			u.socket.send(JSON.stringify({msg:'subscribedToSession',id:sessionId,sessionInfo:g}));
		}
		else {
			u.socket.send(JSON.stringify({msg:'sessionNotFound',id:sessionId}));
        }
	}

    createHostSubscription(appname='',devices=[],propnames=[], host='', hostprops=[]) {
        this.hostSubscriptions.push({
            appname:appname,
            devices:devices,
            id:appname+"_"+Math.floor(Math.random()*10000000),
            host:host,
            hostprops:hostprops,
            settings:[],
            users:{},
            updatedUsers:[], //users with new data available (clears when read from subcription)
            newUsers:[], //indicates users that just joined and have received no data yet
            spectators:{}, //usernames of spectators
            propnames:propnames,
            lastTransmit:Date.now()
        });

        return this.hostSubscriptions.length-1;
    }

    getHostSubscriptions(appname='') {
		let g = this.hostSubscriptions.filter((o) => {
            if(o.appname === appname) return true;
        })
        if(g.length === 0) return undefined;
		else return g;
	}

    getHostSubscription(id='') {
		let g = this.hostSubscriptions.find((o,i) => {
			if(o.id === id) {
				return true;
			}
		});
        return g;
	}

    setHostAppSettings(id='',settings={}) {
        let g = this.hostSubscriptions.find((o,i) => {
			if(o.id === id) {
                o.settings = settings;
				return true;
			}
		});
        return g;
    }

    getHostSessionData(id='') {
        let sessionData = undefined;
        let s = this.appSubscriptions.find((sub,i) => {
            if(sub.id === id) {
                let updateObj = {
                    msg:'sessionData',
                    appname:sub.appname,
                    devices:sub.devices,
                    id:sub.id,
                    host:sub.host,
                    hostprops:sub.hostprops,
                    propnames:sub.propnames,
                    users:sub.users,
                    updatedUsers:sub.updatedUsers,
                    newUsers:sub.newUsers,
                    hostData:{},
                    userData:[],
                    spectators:{}
                };
                
                let allIds = Object.assign({}, sub.users)
                allIds = Object.assign(allIds, sub.spectators)
                Object.keys(allIds).forEach((user,j) => { //get current relevant data for all players in game
                    if(sub.spectators[user] == null){
                        let userObj = {
                            id:user
                        }
                        let listener = this.users.get(user);
                        if(listener) {
                            sub.propnames.forEach((prop,k) => {
                                userObj[prop] = listener.props[prop];
                            });
                            updateObj.userData.push(userObj);
                        }
                    }
                    else {
                        spectators.push(user);
                    }
                });

                let host = this.users.get(sub.host);
                if(host) {
                    sub.hostprops.forEach((prop,j) => {
                        updateObj.hostData[prop] = host.props[prop];
                    })
                }

                sessionData = updateObj;
                return true;
            }
        });
        return sessionData;
    }

	subscribeUserToHostSession(id,sessionId,spectating=false,hosting=false) {
		let g = this.getHostSubscription(sessionId);
        let u = this.users.get(id);
		if(g !== undefined && u !== undefined) {
            if( g.users[id] == null && g.spectators[id] == null ) { 
                if(spectating === true) g.spectators[id] = u.username
                else {
                    g.users[id] = u.username
                    g.newUsers.push(id);
                    g.updatedUsers.push(id);
                }
            }

            if(hosting === true) g.host = id;
			
			g.propnames.forEach((prop,j) => {
				if(!(prop in u.props)) u.props[prop] = '';
			});
			//Now send to the user which props are expected from their client to the server on successful subscription
			u.socket.send(JSON.stringify({msg:'subscribedToSession',id:appname,devices:g.devices,propnames:g.propnames,host:g.host,hostprops:g.hostprops}));
		}
		else {
			u.socket.send(JSON.stringify({msg:'sessionNotFound',id:appname}));
		}
	}

    updateUserSubscriptions = (time) => {
        this.userSubscriptions.forEach((sub,i) => {
            //Should create a dispatcher that accumulates all user and app subscription data to push all concurrent data in one message per listening user
            if(time - sub.lastTransmit > this.subUpdateInterval){
                let listener = this.users.get(sub.listener);
                let source = this.users.get(sub.source);

                if(listener === undefined || source === undefined ) {
                    this.userSubscriptions.splice(i,1);
                }
                else if(sub.newData === true) {
                    let dataToSend = {
                        msg:'userData',
                        id:sub.source,
                        session: sub.id, // TO FIX
                        userData:{}
                    };
                    sub.propnames.forEach((prop,j) => {
                        if(source.updatedPropnames.indexOf(prop) > -1)
                            dataToSend.userData[prop] = source.props[prop];
                    });
                    sub.newData = false;
                    sub.lastTransmit = time;
                    listener.socket.send(JSON.stringify(dataToSend));
                }
            }
		});
    } 


    removeUserData(id, updateObj){
        // Don't Receive Your Own Data
        let objToFilter = JSON.parse(JSON.stringify(updateObj))
        let idx = objToFilter.userData.findIndex((d) => d.id == id)
        if (idx >= 0) objToFilter.userData.splice(idx,1)
        return objToFilter
    }


    getFullUserData(user,sub) {
        if(sub.spectators[user] == null) {
            let userObj = {
                id:user
            }
            let listener = this.users.get(user);
            if(listener){ 
                sub.propnames.forEach((prop,k) => {
                    userObj[prop] = listener.props[prop];
                });
                return userObj
            }
        }
    }

    updateAppSubscriptions = (time) => {
        this.appSubscriptions.forEach((sub,i) => {
            if(time - sub.lastTransmit > this.subUpdateInterval){

                //let t = this.users.get('guest');
                //if(t!== undefined) t.socket.send(JSON.stringify(sub));

                let updateObj = {
                    msg:'sessionData',
                    appname:sub.appname,
                    devices:sub.devices,
                    id:sub.id,
                    propnames:sub.propnames,
                    users:sub.users,
                    spectators:sub.spectators,
                    updatedUsers:sub.updatedUsers,
                    newUsers:sub.newUsers,
                    userData:[],
                    host: sub.host
                };

                if(sub.newUsers.length > 0) { //If new users, send them all of the relevant props from other users

                    let fullUserData = [];

                    let allIds = Object.assign({}, sub.users)
                    allIds = Object.assign(allIds, sub.spectators)

                    Object.keys(allIds).forEach((user, j) => {
                        let userObj = this.getFullUserData(user, sub)
                        if (userObj != null) fullUserData.push(userObj)
                    });

                    let fullUpdateObj = Object.assign({},updateObj);

                    fullUpdateObj.userData = fullUserData;

                    sub.newUsers.forEach((user, j) => {
                        let u = this.users.get(user);

                        if(u !== undefined) {
                            let filteredObj = this.removeUserData(user, fullUpdateObj)
                            u.socket.send(JSON.stringify(filteredObj));
                        }
                        else {
                            delete sub.users[user]
                            delete sub.spectators[user]
                        }
                    });

                }
                
                if(sub.updatedUsers.length > 0) { //only send data if there are updates
                    let userObj;
                    sub.updatedUsers.forEach((user,j) => {
                        if (sub.newUsers.includes(user)){ // Grab full data of new users
                            userObj = this.getFullUserData(user, sub)
                            if (userObj != null) updateObj.userData.push(userObj)
                        } else { // Grab updated data for old users
                            if(sub.spectators[user] == null){
                                let userObj = {
                                    id:user
                                }

                                let listener = this.users.get(user);
                                if(listener.props.devices) userObj.devices = listener.props.devices;
                                if(listener) {
                                    sub.propnames.forEach((prop,k) => {
                                        if(listener.updatedPropnames.indexOf(prop) > -1)
                                            userObj[prop] = listener.props[prop];
                                    });
                                    updateObj.userData.push(userObj);
                                }
                            }
                        }
                    });

                    let allIds = Object.assign({}, sub.users)
                    allIds = Object.assign(allIds, sub.spectators)

                    Object.keys(allIds).forEach((user,j) => {
                        if(sub.newUsers.indexOf(user) < 0) { //new users will get a different data struct with the full data from other users
                            let u = this.users.get(user);
                            if(u !== undefined) {
                                let filteredObj = this.removeUserData(user, updateObj)
                                u.socket.send(JSON.stringify(filteredObj));
                                u.lastUpdate = time; //prevents timing out for long spectator sessions
                            } else {
                                delete sub.users[user]
                                delete sub.spectators[user]
                            }
                        }
                    });

                }
                
                sub.updatedUsers = [];
                sub.newUsers = [];
            }
            sub.lastTransmit = time;
		});
    }

    updateHostAppSubscriptions = (time) => {
        this.hostSubscriptions.forEach((sub,i) => {
            if(time - sub.lastTransmit > this.subUpdateInterval){
                
                //let t = this.users.get('guest');
                //if(t!== undefined) t.socket.send(JSON.stringify(sub));

                let updateObj = {
                    msg:'sessionData',
                    appname:sub.appname,
                    devices:sub.devices,
                    id:sub.id,
                    host:sub.host,
                    hostprops:sub.hostprops,
                    propnames:sub.propnames,
                    users:sub.users,
                    spectators:sub.spectators,
                    updatedUsers:sub.updatedUsers,
                    newUsers:sub.newUsers,
                    hostData:{},
                    userData:[],
                };

                
                let hostUpdateObj = Object.assign({},updateObj);

                let host = this.users.get(sub.host);
                if(host) {
                    sub.hostprops.forEach((prop,j) => {
                        updateObj.hostData[prop] = host.props[prop];
                    });
                }

                if(host) {
                    if(sub.updatedUsers.length > 0) { //only send data if there are updates
                        sub.updatedUsers.forEach((user,j) => {
                            if(sub.spectators[user] == null && sub.newUsers.indexOf(user) < 0){
                                let userObj = {
                                    id:user
                                }
                                let listener = this.users.get(user);
                                if(listener.props.devices) userObj.devices = listener.props.devices;
                                if(listener) {
                                    sub.propnames.forEach((prop,k) => {
                                        if(listener.updatedPropnames.indexOf(prop) > -1)
                                            userObj[prop] = listener.props[prop];
                                    });
                                    hostUpdateObj.userData.push(userObj);
                                }
                            }
                        });
                    }

                    sub.newUsers.forEach((user,j) => {
                        if(sub.spectators[user] == null){
                            let userObj = {
                                id:user
                            }
                            let listener = this.users.get(user);
                            if(listener) {
                                sub.propnames.forEach((prop,k) => {
                                    userObj[prop] = listener.props[prop];
                                });
                                hostUpdateObj.userData.push(userObj);
                            }
                        }
                    });
                    let filteredObj = this.removeUserData(u.id, hostUpdateObj)
                    host.socket.send(JSON.stringify(filteredObj));
                }

                //send latest host data to users
                let allIds = Object.assign({}, sub.users)
                allIds = Object.assign(allIds, sub.spectators)
                Object.keys(allIds).forEach((user,j) => {
                    let u = this.users.get(user);
                    if(u !== undefined) {
                        let filteredObj = this.removeUserData(u.id, updateObj) 
                        u.socket.send(JSON.stringify(filteredObj));
                        u.lastUpdate = time; //prevents timing out for long spectator sessions
                    } else {
                        delete sub.users[user]
                        delete sub.spectators[user]

                    }
                });

                sub.updatedUsers = [];
                sub.newUsers = [];
                
            }
            sub.lastTransmit = time;
		});
    }

	subscriptionLoop = () => {
        if(this.looping === true) {
            let time = Date.now();
            //Should have delay interval checks for each subscription update for rate limiting
            this.updateUserSubscriptions(time);

            //optimized to only send updated data
            this.updateAppSubscriptions(time);

            //optimized to only send updated data
            this.updateHostAppSubscriptions(time);

            this.users.forEach((u,i) => {
                u.updatedPropnames = [];
                if(time - u.lastUpdate > this.serverTimeout) {
                    this.users.get(u.id)?.socket?.close();
                    this.users.delete(u.id);
                }
            })

            setTimeout(() => {this.subscriptionLoop();},10);
        }
    }



}


module.exports = WebsocketController;