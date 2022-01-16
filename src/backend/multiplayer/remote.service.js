

export class WebsocketRemoteStreaming {
    constructor(WebsocketController) {
        if(!WebsocketController) { console.error('Requires a WebsocketController instance.'); return; }
        this.controller = WebsocketController;
		this.userSubscriptions=[]; //User to user data subscriptions
		this.appSubscriptions=[]; //Synchronous apps (all players receive each other's data)
        this.hostSubscriptions=[]; //Asynchronous apps (host receives all users data, users receive host data only)
        this.subUpdateInterval = 0; //ms

        this.serverTimeout = 60*60*1000; //min*s*ms game session timeout
        
        this.LOOPING = true;
    
        this.addDefaultCallbacks();

        this.subscriptionLoop();
    }

    addDefaultCallbacks() {
        
        //FYI "this" scope references this class, "self" scope references the controller scope.
        this.controller.callbacks.push(
            {
                case:'getUsers',
                callback:(self,args,origin,user) => {
                let userData = [];
                let data;
                this.controller.USERS.forEach((o) => {
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
                return data;
            }
        },
        {
            case:'getUserLiveData',
            callback:(self,args,origin,user) => {
                let data;
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
                return data;
            }
        },
        {
            case:'setUserStreamSettings',
            callback:(self,args,origin,user) => {
                let sub = this.setUserStreamSettings(args[0],args[1]);
                let data;
                if(sub === undefined) {
                    data = {msg:'userNotFound',id:args[0]};
                } else {
                    data = {msg:'userSubscriptionInfo',id:args[0],sessionInfo:sub};
                }
                return data;
            }
        },
        {
            case:'createSession',
            callback:(self,args,origin,user) => {
                let i = this.createAppSubscription(args[0],args[1],args[2]);
                let data;
                data = {msg:'sessionCreated',appname:args[0],sessionInfo:this.appSubscriptions[i]};
                return data;
            }
        },
        {
            case:'getSessions',
            callback:(self,args,origin,user) => { //List sessions with the app name
                let subs = this.getAppSubscriptions(args[0]);
                let data;
                if(subs === undefined) {
                    data = {msg:'appNotFound',appname:args[0]};
                }
                else {
                    data = {msg:'getSessionsResult',appname:args[0],sessions:subs};
                }
                return data;
            }
        },
        {
            case:'getSessionInfo',
            callback:(self,args,origin,user) => { //List the app info for the particular ID
                let sub = this.getAppSubscription(args[0]);
                let data;
                if(sub === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                }
                else {
                    data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
                }
                return data;
            }
        },
        {
            case:'getSessionData',
            callback:(self,args,origin,user) => {
                let sessionData = this.getSessionData(args[0]);
                let data;
                if(sessionData === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                }
                else {
                    data = {msg:'getSessionDataResult',id:args[0],sessionData:sessionData};
                }
                return data;
            }
        },
        {
            case:'setSessionSettings',
            callback:(self,args,origin,user) => {
                let sub = this.setAppSettings(args[0],args[1]);
                let data;
                if(sub === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                } else {
                    data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
                }
                return data;
            }
        },
        {
            case:'createHostedSession',
            callback:(self,args,origin,user) => {
                let data;
                let i = this.createHostSubscription(args[0],args[1],args[2],args[3],args[4]);
                data = {msg:'sessionCreated',appname:args[0],sessionInfo:this.hostSubscriptions[i]};
                return data;
            }
        },
        {
            case:'getHostSessions',
            callback:(self,args,origin,user) => { //List sessions with the app name
                let subs = this.getHostSubscriptions(args[0]);
                let data;
                if(subs === undefined) {
                    data = {msg:'appNotFound',appname:args[0]};
                }
                else {
                    data = {msg:'getSessionsResult',appname:args[0],sessions:subs};
                }
                return data;
            }
        },
        {
            case:'getHostSessionInfo',
            callback:(self,args,origin,user) => { //List the app info for the particular session ID
                let sub = this.getHostSubscription(args[0]);
                let data;
                if(sub === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                }
                else {
                    data = {msg:'getSessionInfoResult',id:args[0],sessionInfo:sub};
                }
                return data;
            }
        },
        {
            case:'getHostSessionData',
            callback:(self,args,origin,user) => {
                let sessionData = this.getHostSessionData(args[0]);
                let data;
                if(sessionData === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                }
                else {
                    data = {msg:'getSessionDataResult',id:args[0],sessionData:sessionData};
                }
                return data;
            }
        },
        {
            case:'setHostSessionSettings',
            callback:(self,args,origin,user) => {
                let sub = this.setHostAppSettings(args[0],args[1]);
                let data;
                if(sub === undefined) {
                    data = {msg:'sessionNotFound',id:args[0]};
                } else {
                    data = {msg:'getSessionInfoResult',id:args[0], sessionInfo:sub};
                }
                return data;
            }
        },
        {
            case:'subscribeToUser',
            callback:(self,args,origin,user) => {  //User to user stream
                if(args[2]) this.streamBetweenUsers(id,args[0],args[1]);
                else this.streamBetweenUsers(id,args[0]);
            }
        },
        {
            case:'subscribeToSession',
            callback:(self,args,origin,user) => { //Join session
                this.subscribeUserToSession(id,args[0],args[1]);
            }
        },
        {
            case:'subscribeToHostSession',
            callback:(self,args,origin,user) => { //Join session
                this.subscribeUserToHostSession(id,args[0],args[1],args[2]);
            }
        },
        {
            case:'unsubscribeFromUser',
            callback:(self,args,origin,user) => {
                let found = undefined;
                let data;
                if(args[1]) found = this.removeUserToUserStream(id,args[0],args[1]);
                else found = this.removeUserToUserStream(id,args[0]);
                if(found) {  data = {msg:'unsubscribed',id:args[0],props:args[1]};}
                else { data = {msg:'userNotFound'} }
                return data;
            } 
        },
        {
            case:'leaveSession',
            callback:(self,args,origin,user) => {
                let found = undefined;
                let data;
                if(args[1]) found = this.removeUserFromSession(args[0],args[1]);
                else found = this.removeUserFromSession(args[0],u.id);
                if(found) {  data = {msg:'leftSession',id:args[0]} }
                else { data = {msg:'sessionNotFound',id:args[0]} }
                return data;
            }
        },
        {
            case:'deleteSession',
            callback:(self,args,origin,user) => {
                let found = this.removeSessionStream(args[0]);
                let data;
                if(found) { data = {msg:'sessionDeleted',id:args[0]};}
                else { data = {msg:'sessionNotFound'}; }
                return data;
            }
        }
        );
    }

    //Received a message from a user socket, now parse it into system
	updateUserData(data={id:'',userData:{}}){ 
		//Send previous data off to storage
        if (this.controller.USERS.has(data.id)){

            let u = this.controller.USERS.get(data.id);

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

                let u = o.users[data.id];
                let s = o.spectators[data.id];
                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            this.hostSubscriptions.forEach((o,i) => {
                let u = o.users[data.id];
                let s = o.spectators[data.id];

                if(u != null && o.updatedUsers.indexOf(data.id) < 0 && s == null) {
                    o.updatedUsers.push(data.id);
                }
            });

            //o.socket.send(JSON.stringify(o.props));
            
        }
	}

    
	streamBetweenUsers(listenerUser,sourceUser,propnames=[]) {

        if(this.DEBUG) console.log(listenerUser, sourceUser)
        let idx = undefined;
        let sub = this.userSubscriptions.find((o,i) => {
            if(o.listener === listenerUser && o.source === sourceUser) {
                idx = i;
                o.propnames = propnames;
                return true;
            }
        });
        if(sub === undefined) {
            let source = this.controller.USERS.get(sourceUser);
            if(propnames.length === 0) {
                for(const propname in source.props) {
                    propnames.push(propname);
                }
            }
            let u = this.controller.USERS.get(listenerUser);
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
                        let listener = this.controller.USERS.get(user);
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
        let u = this.controller.USERS.get(id);

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
                        let listener = this.controller.USERS.get(user);
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

                let host = this.controller.USERS.get(sub.host);
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
        let u = this.controller.USERS.get(id);
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
                let listener = this.controller.USERS.get(sub.listener);
                let source = this.controller.USERS.get(sub.source);

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
            let listener = this.controller.USERS.get(user);
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

                //let t = this.controller.USERS.get('guest');
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
                        let u = this.controller.USERS.get(user);

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

                                let listener = this.controller.USERS.get(user);
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
                            let u = this.controller.USERS.get(user);
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
                
                //let t = this.controller.USERS.get('guest');
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

                let host = this.controller.USERS.get(sub.host);
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
                                let listener = this.controller.USERS.get(user);
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
                            let listener = this.controller.USERS.get(user);
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
                    let u = this.controller.USERS.get(user);
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
                        let listener = this.controller.USERS.get(user);
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
    
    removeUserToUserStream(listener,source,propnames=null) { //delete stream or just particular props
        let found = false;
        let sub = this.userSubscriptions.find((o,i)=>{
            if(o.listener === listener && o.source === source) {
                if(!Array.isArray(propnames)) this.userSubscriptions.splice(i,1);
                else {
                    propnames.forEach((prop) => {
                        let pidx = o.propnames.indexOf(prop);
                        if(pidx > -1) {
                            o.propnames.splice(pidx);
                        }
                    })
                }
                found = true;
                return true;
            }
        });
        return found;
    }

    removeUserFromSession(sessionId='',id='') {
        let found = false;
        let app = this.appSubscriptions.find((o,i) => {
            if(o.id === sessionId) {
                delete o.users[id]
                delete o.spectators[id]
                found = true;
                return o;
            }
        });

        if(!found) {
            app = this.hostSubscriptions.find((o,i) => {
                if(o.id === sessionId) {
                    delete o.users[id]
                    delete o.spectators[id]
                    found = true;
                    return o;
                }
            });
        }

        if (found) {
            // Send Info About User Leaving
            let sessionData =this.getSessionData(sessionId)
            sessionData.userLeft = id
            let allIds = Object.assign({}, app.users)
            allIds = Object.assign(allIds, app.spectators)
            Object.keys(allIds).forEach(u => {
                let filteredObj = this.removeUserData(u, sessionData)
                this.controller.USERS.get(u).socket.send(JSON.stringify(filteredObj));
            })

            // Remove Session from User Info
            let oldSessions = this.controller.USERS.get(id).sessions
            let toKeep = []
            oldSessions.forEach((session,i) => {
                if (session !== sessionId){
                    toKeep.push(sessionId)
                }
            })
            this.controller.USERS.get(id).sessions = toKeep
        }

        return found;
    }

    removeSessionStream(appname='') {
        let found = false;
        let sub = this.appSubscriptions.find((o,i) => {
            if(o.appname === appname) {
                this.appSubscriptions.splice(i,1);
                found = true;
                return true;
            }
        });
        return found;
    }


	subscriptionLoop = () => {
        if(this.LOOPING === true) {
            let time = Date.now();
            //Should have delay interval checks for each subscription update for rate limiting
            this.updateUserSubscriptions(time);

            //optimized to only send updated data
            this.updateAppSubscriptions(time);

            //optimized to only send updated data
            this.updateHostAppSubscriptions(time);

            this.controller.USERS.forEach((u,i) => {
                u.updatedPropnames = [];
                if(time - u.lastUpdate > this.serverTimeout) {
                    this.controller.USERS.get(u.id)?.socket?.close();
                    this.controller.USERS.delete(u.id);
                }
            })

            setTimeout(() => {this.subscriptionLoop();},10);
        }
    }



}