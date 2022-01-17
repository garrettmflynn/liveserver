import StateManager from 'anotherstatemanager'
import { DataStreaming } from './data.streaming';

//Joshua Brewster, Garrett Flynn AGPL v3.0
export class SessionStreaming {
	constructor(WebsocketClient, socketId, userinfo={id:'user'+Math.floor(Math.random()*10000000000)}) {
		
		if(!WebsocketClient) {
			console.error("SessionStreaming needs an active WebsocketClient");
			return;
		}
		
		this.WebsocketClient = WebsocketClient;
		this.socketId = socketId;

		if(!socketId) {
			if(!this.WebsocketClient.sockets[0]) {
				this.socketId = this.WebsocketClient.addSocket(); //try to add a socket
				if(!this.socketId) {
					return;
				}
			} else this.socketId = this.WebsocketClient.sockets[0].id;
		}

		this.user = userinfo;
		
		this.state = new StateManager({
			commandResult: {},
			sessionInfo: undefined,
		});

        this.id = Math.floor(Math.random() * 10000000000) // Give the session an ID
		
		this.apps 		   = new Map();
		this.subscriptions = new Map();

		this.datastream = new DataStreaming(socket,userinfo);

	}

	getUser(userId,callback=(result)=>{}) {
		if (this.socket?.readyState === 1) {
			this.WebsocketClient.run(
				'getUserData',
				[userId],
				this.id,
				this.socketId,
				callback
			);
		}		
	}

	getUsers(sessionId,callback=(result)=>{}) {
		if (this.socket?.readyState === 1) {
			this.WebsocketClient.run(
				'getUsers',
				[sessionId],
				this.id,
				this.socketId,
				callback
			);
		}
	}

	getSessionsFromServer(appname,callback=(result)=>{}) {
		if (this.socket?.readyState === 1) {
			this.WebsocketClient.run(
				'getSessions',
				[appname],
				this.id,
				this.socketId,
				callback
			);
		}
	}

	getSessionData(sessionId,callback=(result)=>{}) {
		if (this.socket?.readyState === 1) {
			this.WebsocketClient.run(
				'getSessionData',
				[sessionId],
				this.id,
				this.socketId,
				callback
			);
		}
	}

	//create and subscribe to a live data session
	createSession(
		options={
			appname:`app${Math.floor(Math.random()*1000000000000)}`,
			devices:[],
			type:'user', //'user','room','hostroom'
			object:{},
			settings:{}
		}, 
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1) {
			//first some idiotproofing
			if(!options.appname) options.appname=`app${Math.floor(Math.random()*1000000000000)}`;
			if(!options.type) options.type = 'room';
			if(!options.object) options.object = {test:0};
			if(!options.settings) options.settings = {};
			if(!options.settings.keys) options.settings.keys = Array.from(Object.keys(options.object));

			//set up the data stream
			this.datastream.setStream(
				options.object,
				options.settings,
				options.appname 
			);

			//set up the session

			this.WebsocketClient.run(
				'createSession',
				[
					options.appname,
					options.devices,
					options.settings.keys
				],
				this.id,
				this.socketId,
				callback
			)
		}
	}

	subscribeToSession(
		options={},
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1) {

		}
	}

	removeSession(
		id, 
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1) {

		}
	}
	
}

//Brains@Play session streaming functions
//OLD
class streamUtils {
    constructor(userinfo, socket) {
        this.state = new StateManager({
			commandResult: {},
			sessionInfo: undefined,
		});

        this.deviceStreams = [];

        this.info = {
            nDevices:0,
            _id:'user',
            apps:[],
            subscriptions:[],
            connected:false
        }
        if(userinfo)
            Object.assign(this.info,userinfo);

        this.id = Math.floor(Math.random() * 10000) // Give the session an ID
		this.socket = socket;
		this.streamObj = new streamSession(socket);
		this.streamObj.deviceStreams = this.deviceStreams; //reference the same object

    }

    //Input an object that will be updated with app data along with the device stream.
	streamAppData(propname = 'data', props = {}, sessionId = undefined, onData = (newData) => { }) {

		let id = `${propname}`//${Math.floor(Math.random()*100000000)}`;

		this.state.addToState(id, props, onData);

		this.state.data[id + "_flag"] = true;

		// Add New Data from Self into Game State
		let sub = this.state.subscribeTrigger(id, (newData) => {

			this.state.data[id + "_flag"] = true;
			if (sessionId) {
				if (!this.state.data[sessionId]) this.state.data[sessionId] = { id: sessionId, userData: { id: this.info._id } };
				if (this.state.data[sessionId].userData) {
					let o = this.state.data[sessionId].userData
					if (o.id === this.info._id) {
						o[id] = newData;
						return true;
					} else if (Array.isArray(o)) o.push({ id: this.info._id, [id]: newData });
				}
			}
		});

		let newStreamFunc = () => {
			if (this.state.data[id + "_flag"] === true) {
				this.state.data[id + "_flag"] = false;
				return this.state.data[id];
			}
			else return undefined;
		}

		this.addStreamFunc(id, newStreamFunc);

		return id, sub; //this.state.unsubscribeAll(id) when done

	}

	//Remove arbitrary data streams made with streamAppData
	removeStreaming(id, responseIdx, manager = this.state, type) {
		if (responseIdx == null) {
			manager.removeState(id, type)
			manager.removeState(id + "_flag", type)
			this.streamObj.removeStreamFunc(id); //remove streaming function by name
			let idx = this.streamObj.info.appStreamParams.findIndex((v, i) => v.join('_') === id)
			if (idx != null) this.streamObj.info.appStreamParams.splice(idx, 1)
		} else {
			if (type === 'sequential') manager.unsubscribeSequential(id, responseIdx); //unsub state
			else if (type === 'trigger') manager.unsubscribeTrigger(id, responseIdx); //unsub state
			else manager.unsubscribeTrigger(id, responseIdx); //unsub state
		}
	}

	//Add functions for gathering data to send to the server
	addStreamFunc(name, callback, manager = this.state) {

		if (typeof name === 'string' && typeof callback === 'function') {

			// Artificially add to state (for streaming functions)
			let _callback = () => {
				let data = callback()
				if (data != undefined) manager.data[name] = data
				return data
			}

			// Run so that solo users get their own data back
			this.streamObj.streamLoop();

			this.streamObj.addStreamFunc(name, _callback);

			if (manager === this.state) {
				this.addStreamParams([[name]]);
			} else {
				this.addStreamParams([[name, undefined, 'ignore']]);
			}

		} else { console.error("addStreamFunc error"); }
	}

	//add a parameter to the stream based on available callbacks [['function','arg1','arg2',etc][stream function 2...]]
	addStreamParams(params = []) {
		params.forEach((p, i) => {
			if (Array.isArray(p)) {
				let found = this.deviceStreams.find((d) => {
					if (p[0].indexOf(d.info.deviceType) > -1) {
						if (d.info.deviceType === 'eeg') {
							d.atlas.data.eegshared.eegChannelTags.find((o) => {
								if (o.tag === p[1] || o.ch === p[1]) {
									this.streamObj.info.deviceStreamParams.push(p);
									return true;
								}
							})
						}
						else {
							this.streamObj.info.deviceStreamParams.push(p);
						}

						return true;
					}
				});
				if (!found) this.streamObj.info.appStreamParams.push(p);
			}
		});
	}

    processSocketMessage(parsed = {}) {
		
		if (!parsed.msg) {
			//console.log(parsed);
			return;
		}

		if (parsed.msg === 'userData') {
			for (const prop in parsed.userData) {
				this.state.updateState("userData_" + parsed.id + "_" + prop, parsed.userData[prop])
			}
		} else {
			if (parsed.msg === 'sessionData' || parsed.msg === 'getSessionDataResult') {

				let thisuser = this.state.data[parsed.id]?.userData?.find((o) => { if (o.id === this.info._id) return true; });
				let settings = this.state.data[parsed.id]?.settings;
				this.state.data[parsed.id] = parsed;
				if (thisuser) this.state.data[parsed.id].userData.push(thisuser);
				if (settings) this.state.data[parsed.id].settings = settings;

				parsed.userData.forEach((o, i) => {
					let user = o.id
					if (user != this.info._id) {
						for (const prop in o) {
							if (prop !== 'username' && prop !== 'id') this.state.updateState(`${parsed.id}_${user}_${prop}`, o[prop])
						}
					}
				});


				if (parsed.userLeft) {
					for (const prop in this.state.data) {
						if (prop.indexOf(parsed.userLeft) > -1) {
							this.state.removeState(prop)
						}
					}
				}
			}
			else if (parsed.msg === 'getUsersResult') {
			}
			else if (parsed.msg === 'getSessionInfoResult') {
				this.state.data.sessionInfo = parsed.sessionInfo;
				if (this.state.data[parsed.session] && parsed.sessionInfo.settings) this.state.data[parsed.id].settings = parsed.sessionInfo.settings;
			}
			else if (parsed.msg === 'getSessionsResult') {
			}
			else if (parsed.msg === 'sessionCreated') {
			}
			else if (parsed.msg === 'subscribedToUser') {
			}
			else if (parsed.msg === 'userNotFound') {
			}
			else if (parsed.msg === 'userSubscriptionInfo') {
			}
			else if (parsed.msg === 'subscribedToSession') {
			}
			else if (parsed.msg === 'leftSession') {
			}
			else if (parsed.msg === 'sessionDeleted') {
			}
			else if (parsed.msg === 'unsubscribed') {
			}
			else if (parsed.msg === 'appNotFound' || parsed.msg === 'sessionNotFound') {
			} else if (parsed.msg === 'resetUsername') {
			} else if (parsed.msg === 'getUserDataResult') {
			}

			// Generic Brainstorm Messages
			else if (parsed.msg === 'userAdded') {
			}
			else if (parsed.msg === 'userLeft') {
			}



			// OSC
			else if (parsed.msg === 'oscError') {
			} else if (parsed.msg === 'oscInfo') {
			} else if (parsed.msg === 'oscData') {
				console.log(parsed.oscData)
				// for (const prop in parsed.userData) {
				// 	this.state.data["userData_" + parsed.username + "_" + prop] = parsed.userData[prop];
				// }
			}
			else {
				//console.log('no specific command', parsed);
			}

			let updateObj = {}
			updateObj[`commandResult`] = parsed;
			this.state.setState(updateObj);
		}

	}

	subscribeToUser(id = '', userProps = [], onsuccess = (newResult) => { }) { // if successful, props will be available in state under this.state.data['username_prop']
		//check if user is subscribable
		if (this.socket !== null && this.socket.readyState === 1) {
			this.socket.send(JSON.stringify({cmd:'getUserData',args:[id]}));
			userProps.forEach((prop) => {
				let p = prop;
				if (Array.isArray(p)) p = prop.join("_"); //if props are given like ['eegch','FP1']
				this.state.updateState(id + "_" + p, null)
			});
			//wait for result, if user found then add the user
			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (typeof newResult === 'object') {
					if (newResult.msg === 'getUserDataResult') {
						if (newResult.id === id) {
							this.socket.send(JSON.stringify({cmd:'subscribeToUser',args:[id,userProps]}));
							for (const [prop, value] of Object.entries(newResult.userData.props)) {
								this.state.updateState("userData_" + id + "_" + prop, value)
							}
						}
						onsuccess(newResult.userData);
						this.state.unsubscribeTrigger('commandResult', sub);
					}
					else if (newResult.msg === 'userNotFound' && newResult.id === id) {
						this.state.unsubscribeTrigger('commandResult', sub);
						console.log("User not found: ", id);
					}
				}
			});
		}
	}

	unsubscribeFromUser(id = '', userProps = null, onsuccess = (newResult) => { }) { //unsubscribe from user entirely or just from specific props
		//send unsubscribe command
		if (this.socket !== null && this.socket.readyState === 1) {
			this.socket.send(JSON.stringify({cmd:'unsubscribeFromUser',args:[id,userProps]}));

			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (newResult.msg === 'unsubscribed' && newResult.id === id) {
					for (const prop in this.state.data) {
						if (prop.indexOf(id) > -1) {
							this.state.removeState(prop)
						}
					}
					onsuccess(newResult);
					this.state.unsubscribeTrigger('commandResult', sub);
				}
			});
		}
	}

	getUsers(appname, onsuccess = (newResult) => { }) {
		if (this.socket !== null && this.socket.readyState === 1) {
			this.socket.send(JSON.stringify({cmd:'getUsers',args:[appname]}));
			//wait for response, check result, if session is found and correct props are available, then add the stream props locally necessary for session
			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (typeof newResult === 'object') {
					if (newResult.msg === 'getUsersResult') {// && newResult.appname === appname) {						
						onsuccess(newResult.userData); //list userData, then subscribe to session by id
						this.state.unsubscribeTrigger('commandResult', sub);
						return newResult.userData
					}
				}
				else if (newResult.msg === 'usersNotFound') {//} & newResult.appname === appname) {
					this.state.unsubscribeTrigger('commandResult', sub);
					console.log("Users not found: ", appname);
					return []
				}
			});
		}
	}

	startOSC(localAddress = "127.0.0.1", localPort = 57121, remoteAddress = null, remotePort = null, onsuccess = (newResult) => { }) {

		// Read and Write to the Same Address if Unspecified
		if (remoteAddress == null) remoteAddress = localAddress
		if (remotePort == null) remotePort = localPort

		this.socket.send(JSON.stringify({cmd:'startOSC',args:[localAddress, localPort, remoteAddress, remotePort]}));
		let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
			if (typeof newResult === 'object') {
				if (newResult.msg === 'oscInfo') {
					onsuccess(newResult.oscInfo);
					this.state.unsubscribeTrigger('commandResult', sub);
					return newResult.oscInfo
				}
			}
			else if (newResult.msg === 'oscError') {
				this.state.unsubscribeTrigger('commandResult', sub);
				console.log("OSC Error", newResult.oscError);
				return []
			}
		});
	}

	// stopOSC(localAddress="127.0.0.1",localPort=57121, onsuccess = (newResult) => { }){

	// }



	getSessions(appname, onsuccess = (newResult) => { }) {

		if (this.socket !== null && this.socket.readyState === 1) {
			this.socket.send(JSON.stringify({cmd:'getSessions',args:[appname]}));
			//wait for response, check result, if session is found and correct props are available, then add the stream props locally necessary for session
			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (typeof newResult === 'object') {
					if (newResult.msg === 'getSessionsResult' && newResult.appname === appname) {
						onsuccess(newResult);
						this.state.unsubscribeTrigger('commandResult', sub);
						return newResult.sessions
					}
				}
				else if (newResult.msg === 'appNotFound' & newResult.appname === appname) {
					this.state.unsubscribeTrigger('commandResult', sub);
					console.log("App not found: ", appname);
					return [];
				}
			});
		}
	}

	//connect using the unique id of the subscription
	subscribeToSession(sessionid, spectating = false, onsuccess = (newResult) => { }) {
		if (this.socket !== null && this.socket.readyState === 1 && !this.info.subscriptions.includes(sessionid)) {
			this.socket.send(JSON.stringify({cmd:'getSessionInfo',args:[sessionid]}));
			//wait for response, check result, if session is found and correct props are available, then add the stream props locally necessary for session
			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (typeof newResult === 'object') {
					this.state.unsubscribeTrigger('commandResult', sub);
					if (newResult.msg === 'getSessionInfoResult' && newResult.sessioninfo._id === sessionid) {
						let configured = true;
						if (spectating === false) {
							//check that this user has the correct streaming configuration with the correct connected device
							let streamParams = [];
							newResult.sessionInfo.propnames.forEach((prop) => {
								streamParams.push(prop.split("_"));
							});
							configured = this.configureStreamForSession(newResult.sessionInfo.devices, streamParams); //Expected propnames like ['eegch','FP1','eegfft','FP2']
							// this.streamObj
						}

						if (configured === true) {
							this.socket.send(JSON.stringify({cmd:'subscribeToSession',args:[sessionid, spectating]}));
							this.state.data[newResult.sessioninfo._id] = newResult.sessionInfo;
							this.info.subscriptions.push(sessionid)
							onsuccess(newResult);
						}
					}
					else if (newResult.msg === 'sessionNotFound' & newResult.id === sessionid) {
						this.state.unsubscribeTrigger('commandResult', sub);
						console.log("Session not found: ", sessionid);
					}
				}
			});
		}
	}

	setUserStreamSettings(id, settings) {
		this.socket.send(JSON.stringify({cmd:'setUserStreamSettings',args:[id, settings]}));
	}

	setSessionSettings(id, settings) {
		this.socket.send(JSON.stringify({cmd:'setSessionSettings',args:[id, settings]}));
	}

	setHostSessionSettings(id, settings) {
		this.socket.send(JSON.stringify({cmd:'setHostSessionSettings',args:[id, settings]}));
	}

	unsubscribeFromSession(sessionid = '', onsuccess = (newResult) => { }) {
		//send unsubscribe command
		if (this.socket !== null && this.socket.readyState === 1) {
			this.socket.send(JSON.stringify({cmd:'leaveSession',args:[sessionid]}));
			let sub = this.state.subscribeTrigger('commandResult', (newResult) => {
				if (newResult.msg === 'leftSession' && newResult.id === sessionid) {
					for (const prop in this.state.data) {
						if (prop.indexOf(sessionid) > -1) {
							this.state.removeState(prop)
							delete this.info.subscriptions[this.info.subscriptions.indexOf(sessionid)];
						}
					}
					onsuccess(newResult);
					this.state.unsubscribeTrigger('commandResult', sub);
				}
			});
		}
	}

}

