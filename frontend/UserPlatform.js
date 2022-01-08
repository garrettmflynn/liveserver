import { WebsocketClient } from "./WebsocketClient";
import { DS, DataTablet } from './brainsatplay-data'
//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License

export function randomId(tag = '') {
    return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
}

export class UserPlatform {
    constructor(userinfo, socket='https://localhost:80') {
        this.collections = new Map();
        this.currentUser = userinfo;
        this.socket;
        this.socketResult = {};
        this.tablet = new DataTablet(); //DataTablet (for alyce)

        if(typeof socket === 'string' && userinfo) { //
            this.setupSocket(socket, userinfo);
        } else if (typeof socket === 'object') {
            this.socket = socket;
        }
        if(this.socket && userinfo) {
            this.setupUser(userinfo);
        }
        
    }

    //------------------------------------------------
    //Socket stuff
    //------------------------------------------------

    setup(userinfo, socket='http://localhost:80') {
        if(userinfo) {
            if(typeof socket === 'string'){ 
                //console.log(socket,userinfo);
                this.setupSocket(socket,userinfo);
            }
            else if (typeof socket === 'object') {
                this.socket = socket;
            }
            if(this.socket) {
                this.setupUser(userinfo);
            }   
        }
    }

    setupSocket(url='http://localhost:80', user=this.currentUser) {
        if(this.socket) {if(this.socket.isOpen()) this.socket.close();}
        let socket = new WebsocketClient(url, user); //needs id
        socket.defaultCallback = this.baseServerCallback;
        this.socket = socket;
        return socket;
    }

    closeSocket() {
        if(this.socket) {if(this.socket.isOpen()) this.socket.close();}
    }

    endSession() {
        if(this.socket && this.currentUser) this.socket.send(JSON.stringify({cmd:'endsession',id:this.currentUser._id}));
    }

    //TODO
    //uses a bunch of the functions below to set up a user and get their data w/ some cross checking for consistent profiles
    setupUser(userData) {
        let userinfo = JSON.parse(JSON.stringify(userData)); //copy the token
        if(!userinfo._id && userinfo._id) userinfo._id = userinfo._id;
        let changed = false;

        console.log(userinfo._id)
        this.getUserFromServer(userinfo._id,(res)=>{
            // console.log("getUser", res);
            let u;
            let newu = false;
            if(!res.data.user?.id) { //no profile, create new one and push initial results
                // if(!userinfo._id) userinfo._id = userinfo._id;
                u = this.userStruct(userinfo,true);
                newu = true;
                this.setUserOnServer(u,(res)=>{
                    console.log('setProfile', res);
                    let structs = this.getLocalData(undefined,{'ownerId': u._id});
                    if(structs.length > 0) this.updateServerData(structs, (res)=>{
                        console.log('setData', res);
                    });
                    this.setAuthorizationsByGroupOnServer(u);
                });
            }
            else {
                u = res.data.user;
                u._id = userData._id; //replace the unique mongo id for the secondary profile struct with the id for the userinfo for temp lookup purposes
                for(const prop in userinfo) { //checking that the token and user profile overlap correctly
                    let dummystruct = this.userStruct();
                    if(u[prop] && prop !== '_id') {
                        if(Array.isArray(userinfo[prop])) {
                            for(let i = 0; i < u[prop].length; i++) { //check user props that are not in the token
                                //console.log(userinfo[prop][i]);
                                if(userinfo[prop].indexOf(u[prop][i]) < 0) {
                                    u[prop] = userinfo[prop]; 
                                    changed = true;
                                    break;
                                }
                            }
                            if(!changed) for(let i = 0; i < userinfo[prop].length; i++) { //check tlken props that are not in the user
                                //console.log(userinfo[prop][i]);
                                if(u[prop].indexOf(userinfo[prop][i]) < 0) {
                                    u[prop] = userinfo[prop]; 
                                    changed = true;
                                    break;
                                }
                            }
                        }
                        else if(u[prop] !== userinfo[prop]) { 
                            u[prop] = userinfo[prop];  
                            changed = true;
                        }
                    } else if (u[prop] !== userinfo[prop] && typeof dummystruct[prop] == 'string' && prop !== '_id') {
                        //console.log(prop, u[prop])
                        u[prop] = userinfo[prop];  
                        changed = true;
                    }
                }

                if(res.data.authorizations){
                    if(Array.isArray(res.data.authorizations)) {
                        this.setLocalData(res.data.authorizations);
                    }
                }

                if(res.data.groups){
                    if(Array.isArray(res.data.groups)) {
                        this.setLocalData(res.data.groups);
                    }
                }
            }

            if(newu) {this.currentUser = u; this.setLocalData(u);}
            else {
                this.getAllUserDataFromServer(u._id,undefined,(res)=>{
                    console.log("getServerData", res);
                    if(!res.data || res.data.length === 0) { 
                    } else {
                        this.setLocalData(res.data);
                        
                        //resolve redundant notifications
                        let notes = res.data.filter((s) => {
                            if(s.structType === 'notification') {
                                if(this.getLocalData('authorization',s.parent._id)) {  
                                    return true;
                                }
                                if(s.parent.structType === 'user' || s.parent.structType === 'authorization') {
                                    return true;
                                }
                                if(!this.getLocalData(s.parent.structType,s.parent._id))
                                    return true;
                            }
                        });

                        //resolves extraneous comments
                        let comments = res.data.filter((s) => {
                            if(s.structType === 'comment') {                           
                                return true;
                            }
                        });

                        let toDelete = [];
                        comments.forEach((comment) => {
                            if(!this.getLocalData('comment',{'_id':comment._id})) toDelete.push(comment._id);
                        });
                        if(toDelete.length > 0) this.deleteDataFromServer(toDelete); //extraneous comments

                        if(notes.length > 0) {
                            this.resolveNotifications(notes, false, undefined);
                            changed = true;
                        }

                        let filtered = res.data.filter((o) => {
                            if(o.structType !== 'notification') return true;
                        });

                        if(this.tablet) this.tablet.sortStructsIntoTable(filtered);

                    }

                    // u = new UserObj(u)
                    // u = getUserCodes(u, true)
                    this.setLocalData(u); //user is now set up in whatever case 
                    
                    console.log('currentUser', u)
                    this.currentUser = u;  
                    console.log('collections', this.collections);
                });
            }
        });
    }

    //default socket response for the platform
    baseServerCallback = (res) => {
        // console.log("Socket command result:", res)
        Object.assign(this.socketResult,res);
        let structs = res.data;
        if(typeof res.data === 'object' && res.data?.structType) structs = [res.data];
        if(Array.isArray(res.data)) { //getUserData response
            
            let filtered = structs.filter((o) => {
                if(o.structType !== 'notification') return true;
            });

            if(this.tablet) this.tablet.sortStructsIntoTable(filtered);

            structs.forEach((struct)=>{
                if((!struct.structType) || struct.structType === 'USER') {
                    // console.log(struct)
                    if(struct.email) struct.structType = 'profile';
                    else struct.structType = 'uncategorized';
                }
                if(struct.structType === 'user' || struct.structType === 'authorization' || struct.structType === 'group') {
                    if(struct.structType === 'user') {
                        struct._id = struct.id; //replacer
                        // struct = new UserObj(struct); // set user obj
                        // struct = getUserCodes(struct, true);
                    }
                    this.setLocalData(struct);
                } else {

                    if(struct.structType === 'notification') {
                        let found = this.getLocalData('notification',{'ownerId': struct.ownerId, '_id':struct.parent._id});
                        if(found) {
                            this.setLocalData(struct);
                        } else {
                            if(this.getLocalData(struct.structType,{'_id':struct.parent._id})) {
                                //this.resolveNotifications([struct],false);
                            } else {
                                this.overwriteLocalData(struct);
                            }
                        }

                        // TODO: Ignores notifications when the current user still has not resolved
                        if(struct.ownerId === this.currentUser?._id && 
                            (struct.parent.structType === 'user' || //all of the notification instances we want to pull automatically, chats etc should resolve when we want to view/are actively viewing them
                            struct.parent.structType === 'dataInstance'  || 
                            struct.parent.structType === 'schedule'  || 
                            struct.parent.structType === 'authorization')) 
                            {
                            this.resolveNotifications([struct],true);
                        }
                    } else { 
                        this.overwriteLocalData(struct);
                        //console.log(struct)
                    }
                }
            });
        } 

        if (res.msg === 'notifications') {
            this.checkForNotificationsOnServer(); //pull notifications
        }
        if (res.msg === 'deleted') {
            let found = this.getStruct(res.data);
            if(found) this.deleteLocalData(found); //remove local instance
        }
        
        this.onResult(res);
    }

    //just a customizable callback to preserve the default while adding your own
    onResult(res) {

    }


    //---------------------------------------------

    structProps = {
        _id: '',   //random id associated for unique identification, used for lookup and indexing
        structType: '',     //this is how you will look it up by type in the server
        ownerId: '',     //owner user
        timestamp: Date.now(),      //date of creation
        parent: {structType:'',id:''}, //parent struct it's associated with (e.g. if it needs to spawn with it)
    };
    
    /* Barebones struct format, append any additional props */
    Struct(additionalProps={}, structType='struct', parentStruct=undefined,parentUser=undefined) {
        let struct = {
            _id: randomId('defaultId'+structType),   //random id associated for unique identification, used for lookup and indexing
            structType: structType,     //this is how you will look it up by type in the server
            ownerId: parentUser?._id,     //owner user
            timestamp: Date.now(),      //date of creation
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //parent struct it's associated with (e.g. if it needs to spawn with it)
        }

        if(!parentStruct?._id) delete struct.parent;
        if(Object.keys(additionalProps).length > 0) Object.assign(struct,additionalProps);
        return struct;
    }

    //generically add any struct to a user's server data
    addStruct (
        parentUser= undefined, 
        structType='struct', 
        parentStruct=undefined,
        props={}, //add any props you want to set, adding users[] with ids will tell who to notify if this struct is updated
        updateServer = true
    ) {
        let newStruct = DS.Struct(structType, props, parentUser, parentStruct);

        if(updateServer) this.updateServerData([newStruct]);

        return newStruct;
    }
    
    //simple response test
    async ping(callback=(res)=>{console.log(res);}) {
        let res = await this.socket.send({cmd:'ping',id:this.currentUser._id},callback);
        return res;
    }

    //send a direct message to somebody
    async sendMessage(userId='',message='',data=undefined,callback=(res)=>{console.log(res);}) {
        let args = [userId,message];
        if(data) args[2] = data;
        let res = await this.socket.send({cmd:'sendMessage',args,id:this.currentUser._id},callback);
        return res;
    }

    //info can be email, id, username, or name. Returns their profile and authorizations
    async getUserFromServer (info='',callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'getProfile',args:[info], id:this.currentUser?._id },
        callback);
        //console.log(res);
        return res;
    }

    //get user basic info by id
    async getUsersByIdsFromServer (ids=[],callback=this.baseServerCallback) {
        let res;
        if(ids.length > 0) res = await this.socket.send({cmd:'getProfilesByIds',args:[ids],id:this.currentUser?._id},
        callback);

        return res;
    }
    
    //info can be email, id, username, or name. Returns their profile and authorizations
    async getUsersByRolesFromServer (userRoles=[],callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'getProfilesByRoles',args:[userRoles], id:this.currentUser?._id },
        callback);
        return res;
    }

    async getAllUserDataFromServer(ownerId, excluded=[], callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'getAllData',args:[ownerId,excluded],id:this.currentUser?._id}, 
        callback);
        return res;
    }

    async getDataFromServer(collection,ownerId,searchDict,limit=0,skip=0,callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'getData',args:[collection,ownerId,searchDict,limit,skip], id:this.currentUser?._id}, 
        callback);
        return res;
    }

    //get struct based on the parentId 
    async getStructParentDataFromServer (struct,callback=this.baseServerCallback) {
        if(!struct.parent) return;
        let args = [struct.parent?.structType,'_id',struct.parent?._id];
        let res = await this.socket.send({cmd:'getData',args:args, id:this.currentUser?._id },
        callback);
        return res;
    }
    
    //get struct(s) based on an array of ids or string id in the parent struct
    async getStructChildDataFromServer (struct,childPropName='', limit=0, skip=0, callback=this.baseServerCallback) {
        let children = struct[childPropName];
        if(!children) return;
        let res = await this.socket.send({cmd:'getChildren',args:[children,limit,skip], id:this.currentUser?._id },
        callback);
        return res;
    }

    //redundant macro
    async setUserOnServer (userStruct={},callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'setProfile',args:[this.stripStruct(userStruct)], id:this.currentUser?._id },
        callback);
        return res;
    }

    //updates a user's necessary profile details if there are any discrepancies with the token
    async updateUserOnServer(usertoken,user=this.currentUser,callback=this.baseServerCallback) {
        if(!usertoken) return false;
        let changed = false;
        for(const prop in usertoken) {
            let dummystruct = this.userStruct()
            if(user[prop] && prop !== '_id') {
                //console.log(prop)
                if (Array.isArray(usertoken[prop])) {
                    for(let i = 0; i < user[prop].length; i++) { //check user props that are not in the token
                        //console.log(usertoken[prop][i]);
                        if(usertoken[prop].indexOf(user[prop][i]) < 0) {
                            user[prop] = usertoken[prop]; 
                            changed = true;
                            break;
                        }
                    }
                    if(!changed) for(let i = 0; i < usertoken[prop].length; i++) { //check token props that are not in the user
                        //console.log(usertoken[prop][i]);
                        if(user[prop].indexOf(usertoken[prop][i]) < 0) {
                            user[prop] = usertoken[prop]; 
                            changed = true;
                            break;
                        }
                    }
                }
                else if(user[prop] !== usertoken[prop]) { 
                    user[prop] = usertoken[prop];  changed = true;
                }
            } else if (!user[prop] && dummystruct[prop]) {
                user[prop] = usertoken[prop];  changed = true;
            }
        }
        if(changed) await this.setUserOnServer(user,callback);
        return changed;
    }

    /* strip circular references and update data on the server */
    async updateServerData (structs=[],callback=this.baseServerCallback) {
        const copies = new Array();
        structs.forEach((struct)=>{
            copies.push(this.stripStruct(struct));
        })

        let res = await this.socket.send({ cmd: 'setData', args: copies, id:this.currentUser?._id }, 
        callback);
        return res; //returns refreshed data
    }
    
    //delete a list of structs from local and server
    async deleteDataFromServer (structs=[],callback=this.baseServerCallback) {
        let toDelete = [];
        structs.forEach((struct) => {
            if(struct?.structType && struct?._id) {
            toDelete.push(
                {
                    structType:struct.structType,
                    _id:struct._id
                }
            );
            this.deleteLocalData(struct);
            }
        });

        console.log('deleting',toDelete);
        
        let res = await this.socket.send({cmd:'deleteData',args:toDelete, id:this.currentUser?._id },
        callback);

        return res;
    }

    //delete user profile by ID
    async deleteUserFromServer (userId='', callback=this.baseServerCallback) {
        this.users.delete(userId);
        let res = await this.socket.send({cmd:'deleteProfile',args:[userId], id:this.currentUser?._id },
        callback);
        return res;
    }

    //set a group struct
    async setGroupOnServer (groupStruct={},callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'setGroup',args:[this.stripStruct(groupStruct)], id:this.currentUser?._id },
        callback);
        return res;
    }

    //get group structs or single one by Id
    async getGroupsFromServer (userId=this.currentUser._id, groupId='',callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'getGroups',args:[userId,groupId],id:this.currentUser?._id},
        callback);
        return res;
    }

    //set an authorization struct
    async deleteGroupFromServer (groupStructId='',callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'deleteGroup',args:[groupStructId], id:this.currentUser?._id },
        callback);
        return res;
    }

    //set an authorization struct
    async setAuthorizationOnServer (authorizationStruct={},callback=this.baseServerCallback) {
        let res = await this.socket.send({cmd:'setAuth',args:[this.stripStruct(authorizationStruct)], id:this.currentUser?._id },
        callback);
        return res;
    }

    //get an authorization struct by Id
    async getAuthorizationsFromServer (userId=this.currentUser?._id, authorizationId='',callback=this.baseServerCallback) {
        if(userId === undefined) userId = this.currentUser?._id;
        let res = await this.socket.send({cmd:'getAuths',args:[userId,authorizationId],id:this.currentUser?._id},
        callback);
        return res;
    }

    //delete an authoriztion off the server
    async deleteAuthorizationOnServer (authorization,callback=this.baseServerCallback) {
        if(!authorization) return;
        this.deleteLocalData(authorization);
        let res = await this.socket.send({cmd:'deleteAuth',args:[authorization._id], id:this.currentUser?._id },
        callback);
        return res;
    }

    //notifications are GENERALIZED
    async checkForNotificationsOnServer(userId=this.currentUser?._id) {
        return this.getDataFromServer('notification',userId);
    }

    
    //pass notifications you're ready to resolve by grabbing the data.
    resolveNotifications = async (notifications=[], pull=true, user=this.currentUser) => {
        if(!user || notifications.length === 0) return;
        let structIds = [];
        let notificationIds = [];
        let nTypes = [];
        //console.log(notifications);
        let unote = false;
        if(notifications.length === 0) notifications = this.getLocalData('notification',{'ownerId':user._id});
        notifications.forEach((struct)=>{
            if(struct.parent.structType === 'user') unote = true;
            nTypes.push(struct.parent.structType);
            structIds.push(struct.parent._id);
            notificationIds.push(struct._id);
            //console.log(struct)
            this.deleteLocalData(struct); //delete local entries and update profile
            //console.log(this.structs.get(struct._id));
        });

        this.deleteDataFromServer(notificationIds); //delete server entries
        if(pull) {
            nTypes.reverse().forEach((note,i)=>{
                // if(note === 'comment') { //when resolving comments we need to pull the tree (temp)
                //     this.getParentData(structIds[i],(res)=>{
                //         this.defaultCallback(res);
                //         if(res.data) this.getChildData(res.data._id,'comments');
                //     });
                //     structIds.splice(i,1);
                // }
                if(note === 'user') {
                    this.getUserFromServer(notificationIds[i]);
                    structIds.splice(structIds.length-i-1,1);
                }
            });
            if(structIds.length > 0) return await this.getDataFromServer(structIds);
        }
        return true;
    } 


    //setup authorizations automatically based on group
    async setAuthorizationsByGroupOnServer(u=this.currentUser) {

        let auths = this.getLocalData('authorization',{'ownerId': u._id});
        // console.log(u);

        u.userRoles.forEach((group)=>{ //auto generate access authorizations accordingly
            //group format e.g.
            //reddoor_client
            //reddoor_peer
            let split = group.split('_');
            let team = split[0];
            let otherrole;
            if(group.includes('client')) {
                otherrole = team+'_peer';
            } else if (group.includes('peer')) {
                otherrole = team+'_client';
            } else if (group.includes('admin')) {
                otherrole = team+'_owner';
            }
            if(otherrole) {
                this.getUsersByRolesFromServer([otherrole],(res) => {
                    //console.log(res.data)
                    res.data?.forEach((groupie)=>{
                        let theirname = groupie.username;
                        if(!theirname) theirname = groupie.email;
                        if(!theirname) theirname = groupie.id;
                        let myname = u.username;
                        if(!myname) myname = u.email;
                        if(!myname) myname = u.id;

                        if(theirname !== myname) {
                            if(group.includes('client')) {

                                //don't re-set up existing authorizations 
                                let found = auths.find((a)=>{
                                    if(a.authorizerId === groupie.id && a.authorizedId === u.id) return true;
                                });

                                if(!found) this.authorizeUser(
                                    u,
                                    groupie.id,
                                    theirname,
                                    u.id,
                                    myname,
                                    ['peer'],
                                    undefined,
                                    [group]
                                )   
                            } else if (group.includes('peer')) {

                                //don't re-set up existing authorizations 
                                let found = auths.find((a)=>{
                                    if(a.authorizedId === groupie.id && a.authorizerId === u.id) return true;
                                });

                                if(!found) this.authorizeUser(
                                    u,
                                    u.id,
                                    myname,
                                    groupie.id,
                                    theirname,
                                    ['peer'],
                                    undefined,
                                    [group]
                                )   
                            }
                        }
                    });
                });
            }
        });
    }

    
    //delete a discussion or chatroom and associated comments
    async deleteRoomOnServer(roomStruct) {
        if(!roomStruct) return false;

        let toDelete = [roomStruct];

        roomStruct.comments?.forEach((id)=>{
            let struct = this.getLocalData('comment',{'_id':id});
            toDelete.push(struct);
        });

        if(roomStruct)
            return await this.deleteDataFromServer(toDelete);
        else return false;

    }

    //delete comment and associated replies by recursive gets
    async deleteCommentOnServer(commentStruct) {
        let allReplies = [commentStruct];
        let getRepliesRecursive = (head=commentStruct) => {
            if(head?.replies) {
                head.replies.forEach((replyId) => {
                    let reply = this.getLocalData('comment',{'_id':replyId});
                    if(reply) {
                        if(reply.replies.length > 0) {
                            reply.replies.forEach((replyId2) => {
                                getRepliesRecursive(replyId2); //check down a level if it exists
                            });
                        }
                        allReplies.push(reply); //then return this level's id
                    }
                });
            }
        }
        
        getRepliesRecursive(commentStruct);
        
        //need to wipe the commentIds off the parent struct comments and replyTo replies
        let parent = this.getLocalData(commentStruct.parent?.structType,{'_id':commentStruct.parent?._id})
        let toUpdate = [];
        if(parent) {
            toUpdate = [parent];
            allReplies.forEach((r) => {
                let idx = parent.replies?.indexOf(r._id);
                if(idx > -1) parent.replies.splice(idx,1);
                let idx2 = parent.comments?.indexOf(r._id);
                if(idx2 > -1) parent.comments.splice(idx2,1);
            });
        }
        let replyTo = this.getLocalData('comment',{'_id':commentStruct.replyTo});
        if(replyTo?._id !== parent?._id); {
            let idx = replyTo.replies?.indexOf(r._id);
            if(idx > -1) replyTo.replies.splice(idx,1);
            toUpdate.push(replyTo);
        }

        if(toUpdate.length > 0) await this.updateServerData(toUpdate);
        return await this.deleteDataFromServer(allReplies);
        
    }

    // //get user data by auth struct, includes structType, owner limits, skips
    async getUserDataByAuthorizationFromServer (authorizationStruct, collection, searchDict, limit=0, skip=0, callback=this.baseServerCallback) {

        let u = authorizationStruct.authorizerId;
        if(u) {
            return new Promise(async resolve => {
               this.getUserFromServer(u,async (res)=> {
                    if(!collection) await this.getAllUserDataFromServer(u,['notification'],callback);
                    else await this.getDataFromServer(collection,u,searchDict,limit,skip,callback);

                    resolve(res)
                    callback(res);
                }); //gets profile deets
            })
        } else return undefined;
    }

    // //get user data by auth struct group, includes structType, limits, skips
    async getUserDataByAuthorizationGroupFromServer (group='', collection, searchDict, limit=0, skip=0, callback=this.baseServerCallback) {
        let auths = this.getAuthorizationGroupLocally(group);
        auths.forEach((auth) => {
            let u = authorizationStruct.authorizerId;
            if(u) {
                this.getUserFromServer(u,(res)=>{
                    callback(res);
                    if(!collection) this.getAllUserDataFromServer(u,['notification'],callback);
                    else this.getDataFromServer(collection,u,searchDict,limit,skip,callback);
                });
            }
        });
        return true;
    }

    //

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
            this.onCollectionSet(type,collection);
        }

        if(Array.isArray(structs)) {
            structs.forEach((s)=>{
                setInCollection(s)
            });
        }
        else setInCollection(structs)
    }

    //customize what to do with the updated collection after setting
    onCollectionSet = (typ,collection) => {
    
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

    //get auths where you have granted somebody peer access
    getLocalUserPeerIds = (user=this.currentUser) => {
        if(!user) return [];
        let result = [];
        let authorizations = this.getLocalData('authorization',user._id);
        authorizations.forEach((a)=>{
            if(a.authorizations.indexOf('peer') > -1 && a.authorizerId === user._id) result.push(a.authorizedId);
        });
        return result;
    }

    getLocalReplies(struct) {
        let replies = [];

        if(!struct.replies) return replies;
        else if (struct.replies.reduce((a,b) => a*(typeof b === 'object'), 1)) return struct.replies // just return objects
        
        replies = this.getLocalData('comment',{'replyTo':struct._id});
        return replies;
    }

    hasLocalAuthorization(otherUserId, ownerId=this.currentUser._id) {
        let auths = this.getLocalData('authorization',{ownerId});
        let found = auths.find((a) => {
            if(a.authorizedId === ownerId && a.authorizerId === otherUserId) return true;
            if(a.authorizerId === ownerId && a.authorizedId === otherUserId) return true;
        });
        if(found){
            return found;
        } else return false;
    }

    deleteLocalData(struct) {
        if(!struct) throw new Error('Struct not supplied')
        if(!struct.structType || !struct._id) return false;
        this.collections.get(struct.structType).delete(struct._id);
        return true;
    }

    //strips circular references from the struct used clientside, returns a soft copy with the changes
    stripStruct(struct={}) {
        const copy = Object.assign({ }, struct);
        if (copy.parentStruct) delete copy.parentStruct;
        for(const prop in copy) {
            if(copy[prop] === undefined || copy[prop].constructor.name === 'Map') delete copy[prop]; //delete undefined 
        }
        return copy;
    }

    //create a struct with the prepared props to be filled out
    createStruct(structType,props,parentStruct,parentUser=this.currentUser) {
        let struct = DS.Struct(structType,props,parentUser,parentStruct)
        return struct;
    }

    userStruct (props={}, currentUser=false) {
        let user = DS.ProfileStruct(props,undefined,props);

        user.id = props._id; //references the token id
        user.ownerId = props._id;
        for(const prop in props) {
            if(Object.keys(dummy).indexOf(prop) < 0) {
                delete user[prop];
            } //delete non-dependent data (e.g. tokens we only want to keep in a secure collection)
        }
        if(currentUser) this.currentUser = user;
        return user;
    }

    authorizeUser = (
        parentUser=this.userStruct(),
        authorizerUserId='',
        authorizerUserName='',
        authorizedUserId='',
        authorizedUserName='',
        authorizations=[], // TODO: really any[] or has type??
        structs=[],
        excluded=[],
        groups=[],
        expires=''
    ) => {
        const newAuthorization = this.createStruct('authorization',undefined,undefined,parentUser);  
        newAuthorization.authorizedId = authorizedUserId; // Only pass ID
        newAuthorization.authorizedName = authorizedUserName; //set name
        newAuthorization.authorizerId = authorizerUserId; // Only pass ID
        newAuthorization.authorizerName = authorizerUserName; //set name
        newAuthorization.authorizations = authorizations;
        newAuthorization.structs = structs;
        newAuthorization.excluded = excluded;
        newAuthorization.groups = groups;
        newAuthorization.expires = expires;
        newAuthorization.status = 'PENDING';
        newAuthorization.associatedAuthId = '';
        newAuthorization.ownerId = parentUser._id;

        this.setAuthorizationOnServer(newAuthorization);
       
        return newAuthorization;
    }

    addGroup = (
        parentUser= this.userStruct(), 
        name='',  
        details='',
        admins=[], 
        peers=[], 
        clients=[], 
        updateServer=true) => {
        let newGroup = this.createStruct('group',undefined,undefined,parentUser); //auto assigns instances to assigned users' data views

        newGroup.name = name;
        newGroup.details = details;
        newGroup.admins = admins;
        newGroup.peers = peers;
        newGroup.clients = clients;
        newGroup.users = [...admins,...peers,...clients];
        newGroup.ownerId = parentUser._id;
        
        //this.setLocalData(newGroup);
        
        if(updateServer) {
            this.setGroupOnServer(newGroup);
        }

        return newGroup;
    }

    addData = (parentUser= this.userStruct(), author='', title='', type='', data=[], expires='', updateServer=true) => {
        let newDataInstance = this.createStruct('dataInstance',undefined,undefined,parentUser); //auto assigns instances to assigned users' data views
        newDataInstance.author = author;
        newDataInstance.title = title;
        newDataInstance.type = type;
        newDataInstance.data = data;
        newDataInstance.expires = expires;
        newDataInstance.ownerId = parentUser._id;
        
        //this.setLocalData(newDataInstance);
        
        if(updateServer) this.updateServerData([newDataInstance]);

        return newDataInstance;
    }

    addEvent = (parentUser=this.userStruct(), author='', event='', notes='', startTime=0, endTime=0, grade='', attachments=[], users=[], updateServer=true) => {
        if(users.length === 0) users = this.getLocalUserPeerIds(parentUser);
        
        let newEvent = this.createStruct('event',undefined,undefined,parentUser);
        newEvent.author = author;
        newEvent.event = event;
        newEvent.notes = notes;
        newEvent.startTime = startTime;
        newEvent.endTime = endTime;
        newEvent.grade = grade;
        newEvent.attachments = attachments;
        newEvent.users = users;
        newEvent.ownerId = parentUser._id;

        //this.setLocalData(newEvent);
        if(updateServer) this.updateServerData([newEvent]);
    }

    //create discussion board topic
    addDiscussion = (
        parentUser=this.userStruct(), 
        authorId='',  
        topic='', 
        category='', 
        message='',
        attachments=[], 
        users=[], 
        updateServer=true) => {
        
        if(users.length === 0) users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
        
        let newDiscussion = this.createStruct('discussion',undefined,undefined,parentUser);
        newDiscussion.topic = topic;
        newDiscussion.category = category;
        newDiscussion.message = message;
        newDiscussion.attachments = attachments;
        newDiscussion.authorId = authorId;
        newDiscussion.users = users; 
        newDiscussion.comments = [];
        newDiscussion.replies = [];
        newDiscussion.ownerId = parentUser._id;

        //this.setLocalData(newDiscussion);
    
        let update = [newDiscussion];
        if(updateServer) this.updateServerData(update);
        return newDiscussion;
    }

    addChatroom = (parentUser=this.userStruct(), authorId='', message='', attachments=[], users=[], updateServer=true) => {
        if(users.length === 0) users = this.getLocalUserPeerIds(parentUser); //adds the peer ids if none other provided
        
        let newChatroom = this.createStruct('chatroom',undefined,undefined,parentUser);
        newChatroom.message = message;
        newChatroom.attachments = attachments;
        newChatroom.authorId = authorId;
        newChatroom.users = users;
        newChatroom.replies = [];
        newChatroom.comments = [];
        newChatroom.ownerId = parentUser._id;

        let update = [newChatroom];
        if(updateServer) this.updateServerData(update);

        return newChatroom;
    }

    //add comment to chatroom or discussion board
    addComment = (
        parentUser=this.userStruct(), 
        roomStruct={}, 
        replyTo={}, 
        authorId='', 
        message='', 
        attachments=[],
        updateServer=true
        ) => {
            let newComment = this.createStruct('comment',undefined,roomStruct,parentUser);
            newComment.authorId = authorId;
            newComment.replyTo = replyTo?._id;
            newComment.message = message;
            newComment.attachments = attachments;
            newComment.users = roomStruct?.users;
            newComment.replies = [];
            newComment.ownerId = parentUser._id;

            // let newComment = new CommentObj({
            //     authorId,
            //     replyTo: replyTo?._id,
            //     message,
            //     attachments,
            //     users: roomStruct?.users,
            //     replies: [],
            //     ownerId: parentUser._id,
            // })


            if (updateServer) replyTo?.replies.push(newComment._id);
            else replyTo?.replies.push(newComment); // push full reply if not on server
            
            if (updateServer) roomStruct?.comments.push(newComment._id);
            else roomStruct?.comments.push(newComment); // push full comment if not on server

            //this.setLocalData(newComment);
            let update = [roomStruct,newComment];
            if(replyTo._id !== roomStruct._id) update.push(replyTo);
            if(updateServer) this.updateServerData(update);

            return newComment;
    }

}