import { SettingsObject, UserObject } from "../../common/general.types";
import { DONOTSEND } from "../../router/Router";
import { Service } from "../../router/Service";

//TODO: one-off data calls based on session configs
//      reimplement callbacks
export class SessionsBackend extends Service {
    name = 'sessions'

     //should revamp this to use maps or plain objects
     userSubscriptions=[]; //User to user data subscriptions
     appSubscriptions=[]; //Synchronous apps (all players receive each other's data)
     hostSubscriptions=[]; //Asynchronous apps (host receives all users data, users receive host data only)
     
     userSubs = {};
     appSubs = {};

     sessionTimeout = 20 * 60*1000; //min*s*ms game session timeout with no activity. 20 min default
     
     LOOPING: boolean = true
     delay = 10; //ms loop timer delay

    constructor(Router, running=true) {
        super(Router)
        this.LOOPING = running;

        if(Router) this.delay = Router.INTERVAL;

        //FYI "this" scope references this class, "self" scope references the controller scope.
        this.routes = [
            {
                route:'updateUserStreamData',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.updateUserStreamData(user,args[0]); // TODO: The second argument is probably wrong
                }
            },
            {
                route:'createSession',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.createSession(user,args[0],args[1]);
                }
            },
            {
                route:'subscribeToSession',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    if(self.USERS[args[0]])
                        return this.subscribeToUser(user,args[0],user.id,args[1],args[2]); //can input arguments according to the type of session you're subscribing to
                    else return this.subscribeToSession(user,args[0],args[1],args[2]);
                }
            },
            {
                route:'unsubscribeFromSession',
                aliases:['kickUser'],
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    if(!args[0]) return this.unsubscribeFromSession(user,user.id,args[1]);
                    return this.unsubscribeFromSession(user,args[0],args[1]);
                }
            },
            {
                route:'getSessionData',
                callback:(self,args,origin) => {
                    return this.getSessionData(args[0]);
                }
            }, 
            {
                route:'deleteSession',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.deleteSession(user,args[0]);
                }
            }, 
            {
                route:'makeHost',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.makeHost(user,args[0],args[1]);
                }
            }, 
            {
                route:'makeOwner',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.makeOwner(user,args[0],args[1]);
                }
            }, 
            {
                route:'makeAdmin',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.makeAdmin(user,args[0],args[1]);
                }
            }, 
            {
                route:'makeModerator',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.makeModerator(user,args[0],args[1]);
                }
            }, 
            {
                route:'removeAdmin',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.removeAdmin(user,args[0],args[1]);
                }
            }, 
            {
                route:'removeModerator',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.removeModerator(user,args[0],args[1]);
                }
            }, 
            {
                route:'banUser',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.banUser(user,args[0],args[1]);
                }
            }, 
            {
                route:'unbanUser',
                callback:(self,args,origin) => {
                    const user = self.USERS[origin]
                    if (!user) return false
                    return this.unbanUser(user,args[0],args[1]);
                }
            }, 
            { //some manual overrides for the update loops
                route:'updateSessionUsers',
                callback:(self,args,origin) => {
                    return this.updateSessionUsers(args[0]);
                }
            }, 
            {
                route:'updateUserStream',
                callback:(self,args,origin) => {
                    return this.updateUserStream(args[0]);
                }
            }
        ]
    
        // if(running)
        //     this.subscriptionLoop();
    }

    //Received user data from a user socket, now parse it into system
	updateUserStreamData(user:Partial<UserObject>={}, data:{
        id?: string
        args: {}
    }={args: {}}){ 
		//Send previous data off to storage
        
        let u;
        if(data.id)
            u = this.router.USERS[data.id];
        else u = this.router.USERS[data.id];

        if(!u) return undefined;

        for(const prop in data.args) {
            u.props[prop] = data.args[prop];
            if(u.updatedPropnames.indexOf(prop) < 0)
                u.updatedPropnames.push(prop);
        }

        let now = Date.now();
        u.latency = now-u.lastUpdate;
        u.lastUpdate = now;
        
        return DONOTSEND;
    
	}

    createSession(
        user: Partial<UserObject>={},
        type='room', 
        settings: Partial<SettingsObject> = {}
    ) {
        if(type === 'room' || type === 'hostroom') {

            let sessionId;
            if(settings.id) sessionId = settings.id;
            else sessionId = `session${Math.floor(Math.random()*1000000000000)}`;

            if(!settings.appname) 
                settings.appname=`app${Math.floor(Math.random()*1000000000000)}`;
        
            let session = {
                appname:settings.appname,          //app name (can overlap with others for specific applications)
                id:sessionId,             //session unique id
                type:type,                //'room' or 'hostedroom' decides the stream loop outputs to users
                ownerId:user.id,            //session owner, super admin
                propnames:[], //user streaming props
                host:user.id,       //host unique id
                hostprops:[], //host streaming props in a hosted room (host receives all user data, users receive only host data)
                admins:[],  //admins stay moderators after leaving, added by owner initially
                moderators:[], //moderators can kick/ban/make host, these are temp priveleges
                users:[],           //user ids
                spectators:[], //usernames of spectators
                banned:[], //users unable to join the session
                lastTransmit:Date.now(), 
                devices:undefined,       //optional device requirement info e.g. sensors or controllers
                appSettings:undefined  //e.g. a config object for an app
            };

            if(user.id) { 
                if(!session.users.includes(user.id)) session.users.push(user.id); 
                if(!session.admins.includes(user.id)) session.admins.push(user.id); 
            }

            Object.assign(session,settings); //apply any supplied settings e.g. propnames, hostprops (if a hostedroom), admin and mod settings, or arbitrary values

            this.appSubs[sessionId] = session;

            return session;

        }
        else if (type === 'user') {
            if(user.id && settings.id && settings.propnames) {
                return this.subscribeToUser(user, settings.id, user.id, settings.propnames);
            }
        }
    }

    //For 2+ user sessions or asynchronous 'host' room communication
    subscribeToSession(user:Partial<UserObject>={}, userId, sessionId, spectating=true) {
        let session = this.appSubs[sessionId];
        
        if(session) {
            if(!userId && !user.id) return undefined;
            if(!userId && user.id) userId = user.id;
            

            let newUser = this.router.USERS[userId];
            if(!newUser) return undefined;

        
            if(!session.banned.includes(userId)) {
                if(!session.users?.includes(userId))
                    session.users.push(userId);
                if(spectating && !session.spectators.includes(userId))
                    session.spectators.push(userId);
                if(session.host && !session.users.includes(session.host))
                    session.host = userId; //makes user the new host if they are not present

                let result = JSON.parse(JSON.stringify(session))
                result.userData = {};

                if(session.host !== user.id || session.type !== 'hostedroom') { //get all the user data
                    session.users.forEach((id) => {
                        let u = this.router.USERS[id];
                        if(u) {
                            result.userData[id] = {};
                            session.propnames.forEach((p) => {
                                if(u.props[p]) result.userData[id][p] = u.props[p]
                            });
                            if(Object.keys(result.userData[id]).length === 0) delete result.userData[id];
                        }
                    });
                } else { //only get the host's data in this case
                    let u = this.router.USERS[session.host];
                    if(u) {
                        result.hostData = {};
                        session.hostprops.forEach((p) => {
                            if(u.props[p]) result.userData[session.host][p] = u.props[p];
                        });
                    }
                }
                if(user.id !== userId) { //make sure the new user receives the data
                    newUser.send({route:'sessionData',message:result});
                    newUser.sessions.push(session.id);
                } else if(user.sessions) user.sessions.push(session.id);
                
                return result; //return the session object with the latest data for setup
            }
            
        } 
        else return undefined;
    }

    //Listen to a user's updates
	subscribeToUser(user, sourceId, listenerId, propnames=[], settings={}, override=false) {

        if(!sourceId) return undefined;
        if(!listenerId) listenerId = user.id;

        let source = this.router.USERS[sourceId];

        let listener = this.router.USERS[listenerId];
        if(!listener) return undefined;

        if(propnames.length === 0) propnames = Array.from(Object.keys(source.props)); //stream ALL of the available props instead
        
        if(user.id !== listenerId && user.id !== sourceId && override === false) return undefined;
        if(!source || source.blocked.includes(listenerId) || source.blocked.includes(user.id)) return undefined; //blocked users can't make one-on-one streams

        if(this.router.DEBUG) console.log(listenerId, sourceId)
        
        let sub = undefined;
        for(const prop in this.userSubs) {
            let o = this.userSubs[prop];
            if(o.listener === listenerId && o.source === sourceId) {
                sub = o;
                o.propnames = propnames;
                return true;
            }
        }

        if(!sub) {
            if(propnames.length === 0) {
                for(const propname in source.props) {
                    propnames.push(propname);
                }
            }
            let u = this.router.USERS[listenerId];
            if(u !== undefined && source !== undefined) {
                let obj = {
                    type:'user',
                    ownerId:user.id,
                    listener:listenerId,
                    source:sourceId,
                    id:`${sourceId}${Math.floor(Math.random()*10000000000)}`,
                    propnames:propnames,
                    lastTransmit:0
                }

                for(const prop in settings) {
                    if(!obj[prop]) obj[prop] = settings[prop]; //append any extra settings 
                }

                this.userSubs[obj.id] = obj;

                let result = JSON.parse(JSON.stringify(obj));
                result.userData = {[sourceId]:{}};
                for(const prop in propnames) {
                    if(source.props[prop]) result.userData[sourceId][prop] = source.props[prop];
                }

                u.sessions.push(obj.id);
                return result;
            }
            else {
                return undefined;
            }
            
        }
        else { 
            return sub;
        }
	}

    
    //kick a user from an app session
    kickUser(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if((!user.id && !userId) || !sessionId) return undefined;
        if(user.id && !userId) userId = user.id;

        if(session) {
            if(!session.admins.includes(user.id) && !session.moderators.includes(user.id) && override === false)
                return undefined; //no priveleges

            let idx = session.users.indexOf(userId);
            if(idx) {
                session.users.splice(idx,1);
                let u = this.router.USERS[userId];
                if(u) {
                    let i = u.sessions.indexOf(sessionId);
                    if(i > -1) { u.sessions.splice(i,1); }
                } 

                if(session.host === userId) session.host = session.users[0]; //make the first user the host
                if(session.spectators.includes(userId)) 
                    session.spectators.splice(session.spectators.indexOf(userId));
                if(session.moderators.includes(userId))
                    session.moderators.splice(session.moderators.indexOf(userId));
                return {id:sessionId, user:userId, kicked:true}; //kicked!  
            }
        } else { //try kicking user from a one-on-one stream if the ids match
            if(this.userSubs[sessionId]) {
                this.removeUserToUserStream(user,sessionId);
                return {id:sessionId, user:userId, kicked:true}; //kicked!
            } else { //search
                for(const prop in this.userSubs) {
                    if(this.userSubs[prop].source === userId || this.userSubs[prop].listener === userId) {
                        this.removeUserToUserStream(user,userId);
                        return {id:sessionId, user:userId, kicked:true}; //kicked!
                    }
                }
            }
        }
        return undefined; //not kicked!
    }

    //aliases
    kick = this.kickUser;
    unsubscribeFromSession = this.kickUser;

    //delete a session. It will time out otherwise
    deleteSession(user:Partial<UserObject>={}, sessionId, override=false) {

        if(this.appSubs[sessionId]) {
            if(override === true || this.appSubs[sessionId].ownerId === user.id || this.appSubs[sessionId].admins.includes(user.id)) {
                delete this.appSubs[sessionId];
                return {id:sessionId, deleted:true};
            }
        }
        else if(this.userSubs[sessionId]) {
            if(override === true || this.userSubs[sessionId].ownerId === user.id || this.userSubs[sessionId].source === user.id || this.userSubs[sessionId].listener ===  user.id) {
                delete this.userSubs[sessionId];
                return {id:sessionId, deleted:true};
            }
        }
    
        return undefined;
    }


    //remove single user -> user streams, or just props from the stream         
    removeUserToUserStream(user, streamId, propnames=undefined,override=false) { //delete stream or just particular props
        let sub = this.userSubs[streamId];
        if(!sub) {
            //try to search for the user id
            for(const prop in this.userSubs) {
                if(
                    (this.userSubs[prop].source === streamId && this.userSubs[prop].listener === user.id) ||
                    (this.userSubs[prop].listener === streamId && this.userSubs[prop].source === user.id)
                ) 
                {
                    streamId = prop;
                    sub = this.userSubs[prop];
                    break;
                }
            }
        }
        if(sub) {
            if(user.id !== sub.listener && user.id !== sub.source && override === false) return undefined;
       
            if(Array.isArray(propnames)) { //delete props from the sub
                propnames.forEach((p) => {
                    let i = sub.propnames.indexOf(p);
                    if(i > -1)
                        sub.propnames.splice(i,1);
                });
            }
            else {
                let source = this.router.USERS[sub.source];
                let i1 = source.sessions.indexOf(sub.id);
                if(i1 > -1) source.sessions.splice(i1,1);
                
                let listener = this.router.USERS[sub.listener];
                let i2 = listener.sessions.indexOf(sub.id);
                if(i2 > -1) listener.sessions.splice(i2,1);

                delete this.userSubs[streamId]; //or delete the whole sub
            }

            return {id:sub.id, user:sub.listener, kicked:true};
        }    
        else return undefined;
    }

    makeHost(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) {
            if(override === true || session.admins.indexOf(user.id) > -1 || session.moderators.indexOf(user.id) > -1) {
                session.host = userId;
                return {id:sessionId, user:userId, host:true};
            }
        }
        return undefined;
    }

    //only owner can make other users owner
    makeOwner(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) { 
            if(override === true || (user.id === session.ownerId && user.id !== userId)) {
                session.ownerId = userId;
                return {id:sessionId, user:userId, owner:true};
            }
        }
        return undefined;
    }

    //only owner can make users admin
    makeAdmin(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) { 
            if(override === true || (user.id === session.ownerId && session.admins.indexOf(userId) < 0)) {
                session.admins.push(userId);
                return {id:sessionId, user:userId, admin:true};
            }
        }
        return undefined;
    }

    //only owner can remove admins. admins can set settings and kick and ban or delete a session
    removeAdmin(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) {
            if(override === true || (session.admins.includes(userId) && session.ownerId !== userId)) {
                session.admins.splice(session.admins.indexOf(userId));
                return {id:sessionId, user:userId, admin:false};
            }
        }
        return undefined;
    }
 
    //admins and mods can make other users mods. mods can kick and ban. admins can set settings
    makeModerator(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) { 
            if(override === true || ((session.admins.indexOf(user.id) > -1 || session.moderators.indexOf(user.id) > -1) && session.moderators.indexOf(userId) < 0)) {
                session.moderators.push(userId);
                return {id:sessionId, user:userId, moderator:true};
            }
        }
        return undefined;
    }   

    //only owner can remove admins. admins can set settings and kick and ban or delete a session
    removeModerator(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        let session = this.appSubs[sessionId];

        if(session) {
            if(override === true || (session.admins.includes(userId) && session.ownerId !== userId)) {
                session.moderators.splice(session.moderators.indexOf(userId));
                return {id:sessionId, user:userId, moderator:false};
            }
        }
        return undefined;
    }

    //ban a user from an app session
    banUser(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        
        this.kickUser(user, userId, sessionId);
        
        let session = this.appSubs[sessionId];

        if(session) {
            if( ( session.ownerId !== userId && !session.banned.includes(userId)
                && ( session.admins.includes(user.id) || session.moderators.includes(user.id) ) ) 
                || override === true ) 
            { 
                session.banned.push(userId);
                if(session.admins.includes(userId))  {
                    session.admins.splice(
                        session.admins.indexOf(userId)
                    );
                    return {id:sessionId, user:userId, banned:true};
                }
            }
        }
        return undefined;
    }

    //unban a user from an app session
    unbanUser(user:Partial<UserObject>={}, userId, sessionId, override=false) {
        
        let session = this.appSubs[sessionId]
        if(session) { 
            if( 
                (   session.banned.includes(userId) 
                    && (session.admins.includes(user.id) || session.moderators.includes(user.id)) 
                ) || override === true 
            ) {
                session.banned.splice(session.banned.indexOf(userId),1);
                return {id:sessionId, user:userId, banned:false};
            }
        }
        return undefined;
    }

    //this is an override to assign arbitrary key:value pairs to a session (danger!)
    //users will be updated on the next loop, returns the session info
    setSessionSettings(user:Partial<UserObject>={},sessionId,settings={},override=false) {
        if(this.appSubs[sessionId]) {
            if(
                this.appSubs[sessionId].admins.includes(user.id) 
                || this.appSubs[sessionId].ownerId === user.id 
                || override === true
            ) {
                Object.assign(this.appSubs[sessionId],settings);
                return this.appSubs[sessionId];
            }
        }
        else if (this.userSubs[sessionId]) {
            if(
                this.userSubs[sessionId].source === user.id 
                || this.userSubs[sessionId].listener === user.id 
                || this.userSubs[sessionId].ownerId === user.id || override === true
            ) {
                Object.assign(this.userSubs[sessionId], settings);
                return this.userSubs[sessionId];
            }
        }
        return undefined;
    }

    getUserStreamData(sessionId) {
        let session = this.userSubs[sessionId];
        if(session) {
            let result = JSON.parse(JSON.stringify(session));
            result.userData = {};

            session.users.forEach((sourceId) => {
                result.userData[sourceId] = {}
                let source = this.router.USERS[session.source];

                if(!source) this.removeUserToUserStream(undefined,session.id,undefined,true);
                
                for(const prop in session.propnames) {
                    if(source.props[prop]) result.userData[sourceId][prop] = source.props[prop];
                }
            })


            return result;
        }
        return undefined;
    }

    getSessionData(sessionId) {
        let session = this.userSubs[sessionId];
        if(session) {
            let result = JSON.parse(JSON.stringify(session));
            result.userData = {};
            session.users.forEach((id) => {
                result.userData[id] = {};
                for(const prop in session.propnames) {
                    let u = this.router.USERS[id];
                    if(u) {
                        if(!session.spectators.includes(id)) {
                            for(const prop in session.propnames) {
                                if(u.props[prop]) result.userData[id][prop] = u.props[prop];
                            }
                        }
                    } else this.kickUser(undefined,id,session.id,true);
                    if(Object.keys(result.userData[id]).length === 0) 
                        delete result.userData[id];
                }
            });   

            return result;
        }
        else return this.getUserStreamData(sessionId); //will return undefined if user sub not found
    }

    updateSessionUsers(sessionId) {
        
        let updatedUsers = {};

        let session = this.appSubs[sessionId];
        if(!session) return undefined;

        if(session.users.length === 0) {
            if(session.lastTransmit - Date.now() >= this.sessionTimeout) delete this.appSubs[sessionId];
            return undefined; 
        }
        let updateObj = JSON.parse(JSON.stringify(session));
            
        if(session.type === 'hostroom') {

            updateObj.hostData = {};
            let host = this.router.USERS[session.host];
            if(!host && session.host) {
                this.kickUser(undefined,session.host,session.id,true);
            } else {
                session.host = session.users[0];
                if(!session.host) return false; //no users to update, continue
                else host = this.router.USERS[session.host];
            }

            session.hostprops.forEach((prop) => {
                if(host.updatedPropNames.includes(prop)) updateObj.hostData[prop] = host.props[prop];
            });
            
            if(Object.keys(updateObj.hostData).length > 0) {
                let toKick = [];
                session.users.forEach((user) => {
                    let u = this.router.USERS[user];
                    if(!u) toKick.push(user);
                    else if (user !== session.host && u.send) u.send({route:'sessionData',message:updateObj})   
                    updatedUsers[user] = true;
                });
                toKick.forEach((id) => {
                    this.kickUser(undefined,id,session.id,true);
                });
            }
            delete updateObj.hostData;
        }

        updateObj.userData = {};
        let toKick = [];
        session.users.forEach((user) => {
            let u = this.router.USERS[user];
            if(!u) toKick.push(user);
            else {
                updateObj.userData[user] = {};
                session.propnames.forEach((prop) => {
                    if(!session.spectators.includes(user)) {
                        if(u.updatedPropNames.includes(prop)) 
                            updateObj.userData[user][prop] = u.props[prop];
                    }
                });
                if(Object.keys(updateObj.userData[user]).length === 0) 
                    delete updateObj.userData[user]; //no need to pass an empty object
            }
        });
        toKick.forEach((id) => {
            this.kickUser(undefined,id,session.id,true);
        });

        //now send the data out
        if(session.type === 'hostroom') {
            let host = this.router.USERS[session.host];
            if(host) {
                if (host.send) host.send({route:'sessionData',message:updateObj})   
                updatedUsers[session.host] = true;
            }
            session.lastTransmit = Date.now();
        }   
        else {
            session.users.forEach((user) => {
                let u = this.router.USERS[user];
                if(u) {
                    if (u.send) u.send({route:'sessionData',message:updateObj})   
                    updatedUsers[user] = true;
                }
            });
            session.lastTransmit = Date.now();
        }

        return updatedUsers;

    }

    updateUserStream(sessionId) {
        let updatedUsers = {};

        let session = this.userSubs[sessionId];   
        if(!session) return undefined;

        let updateObj = JSON.parse(JSON.stringify(session));

        let source = this.router.USERS[session.source];
        let listener = this.router.USERS[session.listener];
        if(!source || !listener) {
            this.removeUserToUserStream(undefined,session.id,undefined,true);
            return undefined;
        }
        if(session.lastTransmit - Date.now() >= this.sessionTimeout) {
            delete this.userSubs[sessionId];
            return undefined;
        }

        updateObj.userData = {[session.source]:{}};
        session.propnames.forEach((p) => {
            if(source.updatedPropNames.includes(p)) 
                updateObj.userData[session.source][p] = source.props[p];
        });

        if(Object.keys(updateObj.userData).length > 0) {
            const u = this.router.USERS[session.listenerId]
            if (u) {
                if (u.send) u.send({route:'sessionData',message:updateObj})   
                updatedUsers[u.id] = true;
                session.lastTransmit = Date.now();
            }
        }
        
        return updatedUsers;

    }

    streamLoop = () => {

        if(this.LOOPING){

            let updatedUsers = {};

            //handle session streams
            for(const prop in this.appSubs) {
                let updated = this.updateSessionUsers(prop);
                if(updated) Object.assign(updatedUsers,updated);
            }

            //handle user-user streams
            for(const prop in this.userSubs) {
                let updated = this.updateUserStream(prop);
                if(updated) Object.assign(updatedUsers,updated);
            }

            //clear update flags
            for(const prop in updatedUsers) {
                let u = this.router.USERS[prop];
                if(u) u.updatedPropNames = [];
            }

            setTimeout(this.streamLoop,this.delay);

        }
    }

}

export default SessionsBackend
