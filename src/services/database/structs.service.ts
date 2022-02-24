//Local and MongoDB database functions
//Users, user data, notifications, access controls
// Joshua Brewster, Garrett Flynn, AGPL v3.0
import ObjectID from "bson-objectid"
import { UserObject, ArbitraryObject } from '../../common/general.types';
import { Router } from "../../router/Router";
import { Service } from "../../router/Service";
import { randomId } from '../../common/id.utils';
// import * as mongoExtension from './mongoose.extension'

export const safeObjectID = (str) => {
    return (typeof str === 'string' && str.length === 24) ? ObjectID(str) : str
}

type dbType = any

type CollectionsType = {
    users?: CollectionType
    [x:string]: CollectionType
}

type CollectionType = any | {
    instance?: any; // MongoDB Collection Instance
    reference: ArbitraryObject
    // match?: string[],
    // filters?: {
    //     post: (user, args,collections) => boolean,
    //     get: (responseArr, collections) => boolean,
    //     delete: (user, args, collections) => boolean
    // }
}

const defaultCollections = [
    'user',
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

export class StructService extends Service {
    
    name = 'structs'
    controller: Router;
    db: any;
    collections: CollectionsType = {}

    mode: 'local' | 'mongodb' | string 


    constructor (Router, dbOptions:{
        mode?: 'local' | 'mongodb' | string,
        db?: dbType,
        collections?: CollectionsType
    } = {}, debug=true) {
        super(Router)

        this.db = dbOptions?.db;

        this.mode = (this.db) ? ((dbOptions.mode) ? dbOptions.mode : 'local') : 'local'

        // JUST USE DB TO FILL IN COLLECTIONS
        // Get default collections
        if (!dbOptions.collections) dbOptions.collections = {}
        defaultCollections.forEach(k => {
            if (!dbOptions.collections[k])  {
                dbOptions.collections[k] = (this.db) ? {instance: this.db.collection(k)} : {}
                dbOptions.collections[k].reference = {}
            }
        })

        this.collections = dbOptions.collections

        // Overwrite Other Routes
        this.routes = [
            {
                route:'getUser',
                post:async (self,args,origin) => {
                    const u = self.USERS[origin]
                    if (!u) return false
    
                    let data;
                    if(this.mode === 'mongo') {
                        data = await this.getMongoUser(u,args[0]);
                    } else {
                        let struct = this.getLocalData('user',{_id:args[0]});
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
                    return data;
                }
            },
            {
                route:'setUser',
                aliases: ['addUser'],
                post:async (self,args,origin) => {
                    const u = self.USERS[origin]
                    if (!u) return false
                    let data;
                    if(this.mode === 'mongo') {
                        data = await this.setMongoUser(u,args[0]);
                    } else {
                        let passed = await this.checkAuthorization(u,args[0], this.mode);
                        if(passed) this.setLocalData(args[0]);
                        return true;
                    }
                    return data;
                }
            },
            {
                route:'getUsersByIds',
                post:async (self,args,origin) => { 
                    const u = self.USERS[origin]
                    if (!u) return false
    
                    let data;
                    if(this.mode === 'mongo') {
                        data = await this.getMongoUsersByIds(u,args[0]);
                    } else {
                        data = [];
                        if(Array.isArray(args[0])) {
                            let struct = this.getLocalData('user',{_id:args[0]});
                            if(struct) data.push(struct);
                        }
                    }
                    return data;
                }
            },
            {
                route:'getUsersByRoles',
                post:async (self,args,origin) => {
                    const u = self.USERS[origin]
                    if (!u) return false
    
                    let data;
                    if(this.mode.includes('mongo')) {
                        data = await this.getMongoUsersByRoles(u,args[0]);
                    } else {
                        let profiles = this.getLocalData('user');
                        data = [];
                        profiles.forEach((struct) => {
                            if(struct.userRoles?.includes(args[0])) {
                                data.push(struct);
                            }
                        });
                    }
                    return data;
                }
            },

            {
                route:'deleteUser',
                aliases: ['removeUser'],
                post:async (self,args,origin) => {
                    const u = self.USERS[origin]
                    if (!u) return false
    
                    let data;
                    if(this.mode === 'mongo') {
                        data = await this.deleteMongoUser(u,args[0]);
                    } else {
                        data = false;
                        let struct = this.getLocalData(args[0]);
                        if(struct) {
                            let passed = this.checkAuthorization(u,struct, this.mode);
                            if(passed) data = this.deleteLocalData(struct);
                        }
                    }
                    return data;
                }
            },


            {   
                route:'setData', 
            aliases:['setMongoData'],
            post: async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.setMongoData(u,args); //input array of structs
                } else { 
                    let non_notes = [];
                    data = [];
                    await Promise.all(args.map(async(structId) => {
                        let struct = this.getLocalData(structId);
                        let passed = await this.checkAuthorization(u, struct, this.mode);
                        if(passed) {
                            this.setLocalData(struct);
                            data.push(struct);
                            if(struct.structType !== 'notification') non_notes.push(struct);
                        }
                    }));
                    if(non_notes.length > 0) this.checkToNotify(u, non_notes, this.mode);
                    return true;
                }
                return data;
            }
        }, 
        { 
            route:'getData', 
            aliases:['getMongoData','getUserData'],
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.getMongoData(u, args[0], args[1], args[2], args[4], args[5]);
                } else {
                    data = [];
                    let structs;
                    if(args[0]) structs = this.getLocalData(args[0]);
                    if(structs && args[1]) structs = structs.filter((o)=>{if(o.ownerId === args[1]) return true;});
                    //bandaid
                    if(structs) await Promise.all(structs.map(async(s) => {
                        let struct = this.getLocalData(s._id);
                        let passed = await this.checkAuthorization(u,struct);
                        if(passed) data.push(struct);
                    }));
                }
                return data;
            }
        },  
        { 
            route:'getDataByIds', 
            aliases:['getMongoDataByIds','getUserDataByIds'],
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.getMongoDataByIds(u, args[0], args[1], args[2]);
                } else {
                    data = [];
                    let structs;
                    if(args[2]) structs = this.getLocalData(args[2]);
                    if(structs && args[1]) structs = structs.filter((o)=>{if(o.ownerId === args[1]) return true;});
                    if(structs)await Promise.all(structs.map(async(s) => {
                        let struct = this.getLocalData(s._id);
                        let passed = await this.checkAuthorization(u,struct);
                        if(passed) data.push(struct);
                    }));
                }
                return data;
            }
        },     
        {
            route:'getAllData',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
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
                return data;
            }
        }, 
        {
            route:'deleteData', 
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
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
                return data;
            }
        },
        {
            route:'getGroup',
            aliases:['getGroups'],
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
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
                return data;
            }
        },
        {
            route:'setGroup',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                return await this.setGroup(u,args[0], this.mode);
            }
        },
        {
            route:'deleteGroup',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.deleteMongoGroup(u,args[0]);
                } else {
                    let struct = this.getLocalData('group',args[0]);
                    let passed = false;
                    if(struct) passed = await this.checkAuthorization(u,struct, this.mode);
                    if(passed) {
                        data = true;
                    }
                }
                return data;
            }
        },
        {
            route:'setAuth',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false
                return await this.setAuthorization(u, args[0], this.mode);
            }
        },
        {
            route:'getAuths',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.getMongoAuthorizations(u,args[0],args[1]);
                } else {
                    if(args[1]) {
                        let result = this.getLocalData('authorization',{_id:args[1]});
                        if(result) data = [result];
                    } else {
                        data = this.getLocalData('authorization',{ownerId:args[0]});
                    }
                }
                return data;
            }
        },
        {
            route:'deleteAuth',
            post:async (self,args,origin) => {
                const u = self.USERS[origin]
                if (!u) return false

                let data;
                if(this.mode.includes('mongo')) {
                    data = await this.deleteMongoAuthorization(u,args[0]);
                } else {
                    data = true;
                    let struct = this.getLocalData('authorization',{_id:args[0]});
                    if(struct) {
                        let passed = this.checkAuthorization(u,struct, this.mode);
                        if(passed) data = this.deleteLocalData(struct);
                    }
                    return data;
                } 
            }
        }]

    }

    
    notificationStruct(parentStruct:any= {}) {
        let structType = 'notification';
        let struct = {
            structType:structType,
            timestamp:Date.now(),
            id:randomId(structType),
            note:'',
            ownerId: '',
            parentUserId: '',
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //where it belongs
        };

        return struct;
    }    

    //when passing structs to be set, check them for if notifications need to be created
    //TODO: need to make this more flexible in the cases you DON'T want an update
    async checkToNotify(user:UserObject,structs:any[]=[], mode=this.mode) {

        if(typeof user === 'string') {
            for (let key in this.router.USERS){
                const obj = this.router.USERS[key]
                if (obj.id === (user as any)) user = obj;
            }
        }
        if(typeof user === 'string' || user == null) return false;
        let usersToNotify = {};
        //console.log('Check to notify ',user,structs);

        let newNotifications = [];
        structs.forEach(async (struct)=>{
            if (user?.id !== struct.ownerId) { //a struct you own being updated by another user
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
                    let s = this.collections.authorizations.instance.find({ $or:[{authorizedId: user.id},{authorizerId: user.id}] });
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
                this.router.sendMsg(uid, 'notifications', true);
            }

            return true;
        } else return false;
    }

    
    async setMongoData(user:UserObject,structs:any[] = []) {
        
        //console.log(structs,user);
        let firstwrite = false;
        //console.log(structs);
        if(structs.length > 0) {
            let passed = true;
            let checkedAuth = '';
            await Promise.all(structs.map(async (struct) => {
                if(user?.id !== struct.ownerId && checkedAuth !== struct.ownerId) {
                    passed = await this.checkAuthorization(user,struct);
                    checkedAuth = struct.ownerId;
                }
                if(passed) {
                    let copy = JSON.parse(JSON.stringify(struct));
                    if(copy._id) delete copy._id;
                    //if(struct.structType === 'notification') console.log(notificaiton);
                    if(struct.id){ 
                        if(struct.id.includes('defaultId')) {
                            await this.db.collection(struct.structType).insertOne(copy);   
                            firstwrite = true; 
                        }
                        else await this.db.collection(struct.structType).updateOne({ id: struct.id }, {$set: copy}, {upsert: true}); //prevents redundancy in some cases (e.g. server side notifications)
                    } else if (struct._id) {
                        if(struct._id.includes('defaultId')) {
                            await this.db.collection(struct.structType).insertOne(copy);   
                            firstwrite = true; 
                        }
                        else await this.db.collection(struct.structType).updateOne({_id: safeObjectID(struct._id)}, {$set: copy}, {upsert: false});
                    }
                }
            }));

            if((firstwrite as boolean) === true) {
                //console.log('firstwrite');
                let toReturn = []; //pull the server copies with the updated Ids
                await Promise.all(structs.map(async (struct,j)=>{
                    let copy = JSON.parse(JSON.stringify(struct));
                    if(copy._id) delete copy._id;

                    if(struct.structType !== 'comment') {
                        let pulled;
                        if(struct.structType !== 'notification') pulled = await this.db.collection(copy.structType).findOne(copy);
                        if(pulled){
                            pulled._id = pulled._id.toString();
                            toReturn.push(pulled);
                        }
                    }
                    else if(struct.structType === 'comment') { //comments are always pushed with their updated counterparts. TODO handle dataInstances
                        let comment = struct;
                        let copy2 = JSON.parse(JSON.stringify(comment));
                        if(copy2._id) delete copy2._id;
                        let pulledComment = await this.db.collection('comment').findOne(copy2);
                        
                        let replyToId = comment.replyTo;
                        let replyTo = structs.find((s)=>{
                            if(s._id === replyToId) return true;
                        });
                        if(replyTo) {
                            let copy3 = JSON.parse(JSON.stringify(replyTo));
                            if(copy3._id) delete copy3._id;
                            let pulledReply;

                            await Promise.all(['discussion','chatroom','comment'].map(async (name) => {
                                let found = await this.db.collection(name).findOne({_id:safeObjectID(replyToId)});
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
                                            let found = await this.db.collection(name).findOne(room);
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
                                    await this.db.collection(s.structType).updateOne({_id:safeObjectID(s._id)},{$set: copy},{upsert: false});
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

    async setMongoUser(user:UserObject,struct:any={}) {


        if(struct.id) { //this has a second id that matches the token id
            
            if(user.id !== struct.id) {
                let passed = await this.checkAuthorization(user,struct);
                if(!passed) return false;
            }

            let copy = JSON.parse(JSON.stringify(struct));
            if(copy._id) delete copy._id;

            if(this.router.DEBUG) console.log('RETURNS PROFILE', struct)
            
            // Only Set _id if Appropriate
            const _id = safeObjectID(struct._id)
            const toFind = (_id !== struct._id) ? { _id } : {id: struct.id}
            await this.collections.users.instance.updateOne(toFind, {$set: copy}, {upsert: true}); 

            user = await this.collections.users.instance.findOne(toFind);
            this.checkToNotify(user, [struct]);
            return user;
        } else return false;
    }

    async setGroup(user:UserObject,struct:any={}, mode=this.mode) {
        
        if(struct._id) {
            let exists = undefined;
            if(mode === 'mongo') {
                exists = await this.collections.groups.instance.findOne({name:struct.name});
            } else {
                exists = this.getLocalData('group',{_id:struct._id});
            }
            if(exists && (exists.ownerId !== struct.ownerId || struct.admins.indexOf(user.id) < 0) ) return false; //BOUNCE

            if(user.id !== struct.ownerId) {
                let passed = await this.checkAuthorization(user,struct, this.mode);
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
                let cursor = this.collections.users.instance.find({ $or: allusers }); //encryption references
                if( await cursor.count() > 0) {
                    await cursor.forEach((user) => {
                        users.push(user);
                        ids.push(user.id);
                    });
                }
            } else {
                allusers.forEach((search) => {
                    let result = this.getLocalData('user',search);
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
                    await this.db.collection(struct.structType).insertOne(copy);
                }
                else await this.collections.groups.instance.updateOne({ _id: safeObjectID(struct._id) }, {$set: copy}, {upsert: true}); 
            } else {
                this.setLocalData(struct);
            }
            this.checkToNotify(user, [struct], this.mode);
            return struct;
        } else return false;
    }

    //
    async getMongoUser(user:UserObject,info='', bypassAuth=false): Promise<Partial<UserObject>>  {
        return new Promise(async resolve => {
            const query:any[] = [{email: info},{id: info},{username:info}]
            try {query.push({_id: safeObjectID(info)})} catch (e) {}

            let u = await this.collections.users.instance.findOne({$or: query}); //encryption references
            
            if(!u || u == null) resolve({});
            else {
                if (!u.id && u._id) u.id = u._id.toString()
                if (!u.ownerId) u.ownerId = u.id

                if (u && bypassAuth === false){
                    if(user.id !== u.id) { // TODO: Ensure that passed users will always have the same ObjectId (not necessarily id...)
                        let passed = await this.checkAuthorization(user,u);
                        if(!passed) resolve(undefined);
                    }
                    // console.log(u);
                    let authorizations = [];
                    let auths = this.collections.authorizations.instance.find({ownerId:u.id});
                    if((await auths.count() > 0)) {
                        await auths.forEach(d => authorizations.push(d));
                    }
                    let gs = this.collections.groups.instance.find({users:{$all:[u.id]}});
                    let groups = [];
                    if((await gs.count() > 0)) {
                        await gs.forEach(d => groups.push(d));
                    }
                    
                    u.authorizations = authorizations
                    u.groups = groups
                    resolve(u);
                } else resolve(u);
            }
        });   
    }

    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    async getMongoUsersByIds(user={},userIds=[]) {
        let usrs = [];
        userIds.forEach((u) => {
            try {usrs.push({_id:safeObjectID(u)});} catch {}
        });

        let found = [];
        if (usrs.length > 0){
            let users = this.collections.users.instance.find({$or:usrs});
            if(await users.count() > 0) {
                await users.forEach((u) => {
                    found.push(u);
                });
            }
        }

        return found;
    }

    //safely returns the profile id, username, and email and other basic info based on the user role set applied
    async getMongoUsersByRoles(user={},userRoles=[]) {
        let users = this.collections.users.instance.find({
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

    async getMongoDataByIds(user:UserObject, structIds:[], ownerId:string|undefined, collection:string|undefined) {
        if(structIds.length > 0) {
            let query = [];
            structIds.forEach(
                (_id)=>{
                    let q = {_id};
                    if(ownerId) (q as any).ownerId = ownerId;
                    query.push(q);
                })
            let found = [];
            if(!collection) {
                await Promise.all(Object.keys(this.collections).map(async (name) => {
                    let cursor = await this.db.collection(name).find({$or:query});
                    
                    if(await cursor.count() > 0) {
                        let passed = true;
                        let checkedAuth = '';
                        await cursor.forEach(async (s) => {
                            if(user.id !== s.ownerId && checkedAuth !== s.ownerId) {
                                passed = await this.checkAuthorization(user,s);
                                checkedAuth = s.ownerId;
                            }
                            if(passed) found.push(s);
                        })
                    }
                }));
            }
            else {
                let cursor = await this.db.collection(collection).find({$or:query});
                    
                    if(await cursor.count() > 0) {
                        let passed = true;
                        let checkedAuth = '';
                        await cursor.forEach(async (s) => {
                            if(user.id !== s.ownerId && checkedAuth !== s.ownerId) {
                                passed = await this.checkAuthorization(user,s);
                                checkedAuth = s.ownerId;
                            }
                            if(passed) found.push(s);
                        })
                    }
            }
            return found;
        }
    }

    //get all data for an associated user, can add a search string
    async getMongoData(user:UserObject, collection:string|undefined, ownerId:string|undefined, dict:any|undefined={}, limit=0, skip=0) {
        if (!ownerId) ownerId = dict?.ownerId // TODO: Ensure that replacing ownerId, key, value with dict was successful
        if (dict._id) dict._id = safeObjectID(dict._id)

        let structs = [];
        let passed = true;
        let checkedAuth = '';
        if(!collection && !ownerId && !dict) return [];
        else if(!collection && ownerId && Object.keys(dict).length === 0) return await this.getAllUserMongoData(user,ownerId);
        else if(!dict && ownerId) {
            let cursor = this.db.collection(collection).find({ownerId}).sort({ $natural: -1 }).skip(skip);
            if(limit > 0) cursor.limit(limit);
            if(await cursor.count() > 0) {
                await cursor.forEach(async (s) => {
                    if(user.id !== s.ownerId && checkedAuth !== s.ownerId) {
                        passed = await this.checkAuthorization(user,s);
                        checkedAuth = s.ownerId;
                    }
                    if(passed === true) structs.push(s);
                });
            }
        } else if (Object.keys(dict).length > 0 && ownerId) {
            let found = await this.db.collection(collection).findOne({ownerId:ownerId,...dict});
            if(found) structs.push(found);
        } else if (Object.keys(dict).length > 0 && !ownerId) { //need to search all collections in this case
            await Promise.all(Object.keys(this.collections).map(async (name) => {
                let found = await this.db.collection(name).findOne(dict);
                if(found) {
                    if(user.id !== found.ownerId && checkedAuth !== found.ownerId) {
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

    async getAllUserMongoData(user:UserObject,ownerId,excluded=[]) {
        let structs = [];

        let passed = true;
        let checkedId = '';
        await Promise.all(Object.keys(this.collections).map(async (name,j) => {
            if(passed && excluded.indexOf(name) < 0) {
                let cursor = this.db.collection(name).find({ownerId:ownerId});
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
    async getMongoDataByRefs(user:UserObject,structRefs=[]) {
        let structs = [];
        //structRef = {structType, id}
        if(structs.length > 0) {
            let checkedAuth = '';
            structRefs.forEach(async (ref)=>{
                if(ref.structType && ref._id) {
                    let struct = await this.db.collection(ref.structType).findOne({_id: safeObjectID(ref._id)});
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

    async getMongoAuthorizations(user:UserObject,ownerId=user.id, authId='') {
        let auths = [];
        if(authId.length === 0 ) {
            let cursor = this.collections.authorizations.instance.find({ownerId:ownerId});
            if(await cursor.count > 0) {
                await cursor.forEach((a) => {
                    auths.push(a)
                });
            }
        }
        else auths.push(await this.collections.authorizations.instance.findOne({_id: safeObjectID(authId), ownerId:ownerId}));
        if(user.id !== auths[0].ownerId) {
            let passed = await this.checkAuthorization(user,auths[0]);
            if(!passed) return undefined;
        }
        return auths;

    }

    async getMongoGroups(user:UserObject, userId=user.id, groupId='') {
        let groups = [];
        if(groupId.length === 0 ) {
            let cursor = this.collections.groups.instance.find({users:{$all:[userId]}});
            if(await cursor.count > 0) {
                await cursor.forEach((a) => {
                    groups.push(a)
                });
            }
        }
        else {
            try {groups.push(await this.collections.groups.instance.findOne({_id:safeObjectID(groupId), users:{$all:[userId]}}));} catch {}
        }

        return groups;
    }

    //general delete function
    async deleteMongoData(user:UserObject,structRefs=[]) {
        // let ids = [];
        let structs = [];

        await Promise.all(structRefs.map(async (ref) => {

            try {
                let _id = safeObjectID(ref._id)
                let struct = await this.db.collection(ref.structType).findOne({_id});
                if(struct) {
                    structs.push(struct);
                    let notifications = await this.collections.notifications.instance.find({parent:{structType:ref.structType,id:ref._id}});
                    let count = await notifications.count();
                    for(let i = 0; i < count; i++) {
                        let note = await notifications.next();
                        if(note) structs.push(note);
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
                await this.db.collection(struct.structType).deleteOne({_id:safeObjectID(struct._id)});
                //delete any associated notifications, too
                if(struct.users) {
                    struct.users.forEach((uid)=> {
                        if(uid !== user.id && uid !== struct.ownerId) this.router.sendMsg(uid,'deleted',struct._id);
                    });
                }
                if(struct.ownerId !== user.id) {
                    this.router.sendMsg(struct.ownerId,'deleted',struct._id);
                }
            }
        }));

        return true; 
    }

    //specific delete functions (the above works for everything)
    async deleteMongoUser(user:UserObject,userId) {
        
        if(user.id !== userId) {
            let u = await this.collections.users.instance.findOne({ id: userId });
            let passed = await this.checkAuthorization(user,u);
            if(!passed) return false;
        }

        await this.collections.users.instance.deleteOne({ id: userId });

        if(user.id !== userId) this.router.sendMsg(userId,'deleted',userId);

        //now delete their authorizations and data too (optional?)
        return true; 
    }

    async deleteMongoGroup(user:UserObject,groupId) {
        let s = await this.collections.groups.instance.findOne({ _id: safeObjectID(groupId) });
        if(s) {
            if(user.id !== s.ownerId) {
                let passed = await this.checkAuthorization(user,s);
                if(!passed) return false;
            }
            if(s.users) {
                s.users.forEach((u) => { this.router.sendMsg(s.authorizerId,'deleted',s._id); });
            }
            await this.collections.groups.instance.deleteOne({ _id:safeObjectID(groupId) });
            return true;
        } else return false; 
    }


    async deleteMongoAuthorization(user:UserObject,authId) {
        let s = await this.collections.authorizations.instance.findOne({ _id: safeObjectID(authId) });
        if(s) {
            if(user.id !== s.ownerId) {
                let passed = await this.checkAuthorization(user,s);
                if(!passed) return false;
            }
            if(s.associatedAuthId) {
                if(this.router.DEBUG) console.log(s);
                await this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(s.associatedAuthId) }); //remove the other auth too 
                if(s.authorizerId !== user.id) this.router.sendMsg(s.authorizerId,'deleted',s._id);
                else if (s.authorizedId !== user.id) this.router.sendMsg(s.authorizedId,'deleted',s._id);
            }
            await this.collections.authorizations.instance.deleteOne({ _id: safeObjectID(authId) });
            return true;
        } else return false; 
    }

    async setAuthorization(user:UserObject, authStruct, mode=this.mode) {
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
            u1 = await this.getMongoUser(user, authStruct.authorizedId, true); //can authorize via email, id, or username
            u2 = await this.getMongoUser(user, authStruct.authorizerId, true);
        } else {
            u1 = this.getLocalData('user',{'_id':authStruct.authorizedId});
            u2 = this.getLocalData('user',{'_id':authStruct.authorizedId});
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
            let s = this.collections.authorizations.instance.find(
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
                    if(this.mode.includes('mongo')) {
                        delete copy._id;
                        await this.collections.authorizations.instance.updateOne({ $and: [ { authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: auth.ownerId } ] }, {$set: copy}, {upsert: true});
                    } else {
                        this.setLocalData(copy);
                    }
                }
            });
        }

        
        let copy = JSON.parse(JSON.stringify(authStruct));
        if(mode ==='mongo') {
            delete copy._id;
            await this.collections.authorizations.instance.updateOne({ $and: [ { authorizedId: authStruct.authorizedId }, { authorizerId: authStruct.authorizerId }, { ownerId: authStruct.ownerId } ] }, {$set: copy}, {upsert: true});
        } else {
            this.setLocalData(copy);
        }

        if(authStruct._id.includes('defaultId') && mode === 'mongo') {
            let replacedAuth = await this.collections.authorizations.instance.findOne(copy);
            if(replacedAuth) {
                authStruct._id = replacedAuth._id.toString();
                if(otherAuthset) {
                    let otherAuth = await this.collections.authorizations.instance.findOne({$and: [ { authorizedId: otherAuthset.authorizedId }, { authorizerId: otherAuthset.authorizerId }, { ownerId: otherAuthset.ownerId } ] });
                    if(otherAuth) {
                        otherAuth.associatedAuthId = authStruct._id;
                        delete otherAuth._id;
                        await this.collections.authorizations.instance.updateOne({ $and: [ { authorizedId: otherAuth.authorizedId }, { authorizerId: otherAuth.authorizerId }, { ownerId: otherAuth.ownerId } ] }, {$set: otherAuth}, {upsert: true}); 
                        this.checkToNotify(user,[otherAuth]);
                    }
                }
            }
        }

        return authStruct; //pass back the (potentially modified) authStruct
    }

    
    async checkAuthorization(user:string|{id: string}, struct, mode = this.mode) {
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
            auth1 = await this.collections.authorizations.instance.findOne({$or: [{authorizedId:user.id,authorizerId:struct.ownerId, ownerId:user.id},{authorizedId:struct.ownerId,authorizerId:user.id, ownerId:user.id}]});
            auth2 = await this.collections.authorizations.instance.findOne({$or: [{authorizedId:user.id,authorizerId:struct.ownerId, ownerId:struct.ownerId},{authorizedId:struct.ownerId,authorizerId:user.id, ownerId:struct.ownerId}]});
        }
        else {
            auth1 = this.getLocalData('authorization', {ownerId:user.id}).find((o) => {
                if(o.authorizedId === (user as any).id && o.authorizerId === struct.ownerId) return true;
            });
            auth2 = this.getLocalData('authorization', {ownerId:struct.ownerId}).find((o) => {
                if(o.authorizedId === (user as any).id && o.authorizerId === struct.ownerId) return true;
            });
        }
         if(!auth1 || !auth2) {
            //console.log('auth bounced', user, struct, auth1, auth2);
            return false;
        }

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
                if (auth1.authorizations.indexOf(struct.name+'_admin') > -1 && auth2.authorizations.indexOf(struct.name+'_admin') > -1) passed = true;
                else passed = false;
            }
            else if(auth1.authorizations.indexOf('provider') > -1 && auth2.authorizations.indexOf('provider') > -1) passed = true;
            else if(auth1.authorizations.indexOf('peer') > -1 && auth2.authorizations.indexOf('peer') > -1) passed = true;
            else if (auth1.structIds?.indexOf(struct._id) > -1 && auth2.structIds?.indexOf(struct._id) > -1) passed = true;
            //other filters?
        }

        //if(!passed) console.log('auth bounced', auth1, auth2);

        return passed;
    }

    wipeDB = async () => {
        //await this.collections.authorizations.instance.deleteMany({});
        //await this.collections.groups.instance.deleteMany({});
        await Promise.all(Object.values(this.collections).map(c => c.instance.deleteMany({})))

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
        
            let collection = this.collections[type].reference
            if(!collection) {
                collection = {}
                this.collections[type].reference = collection
            }
            collection[s._id] = s

        }

        if(Array.isArray(structs)) {
            structs.forEach((s)=>{
                setInCollection(s)
            });
        }
        else setInCollection(structs)
    }

    //pull a struct by collection, owner, and key/value pair from the local platform, leave collection blank to pull all ownerId associated data
    getLocalData(collection, query?) {

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
            Object.values(this.collections).forEach((c: CollectionsType) => { //search all collections
                c = c.reference // Drop to reference
                if((key === '_id' || key === 'id') && value) {
                    let found = c[value]
                    if(found) result.push(found);
                }
                else {
                    Object.values(c).forEach((struct) => {
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
            let c = this.collections[collection].reference
            if(!c) return result; 

            if(!key && !ownerId) {
                Object.values(c).forEach((struct) => {result.push(struct);})
                return result; //return the whole collection
            }
            
            if((key === '_id' || key === 'id') && value) return c[value] //collections store structs by id so just get the one struct
            else {
                Object.keys(c).forEach((k) => {
                    const struct = c[k]
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

        // Delete the Reference by ID
        if (this.collections[struct.structType]) delete this.collections[struct.structType].reference[struct._id]
        return true;
    }


}

export default StructService