import {StateManager} from 'anotherstatemanager'
//Joshua Brewster, Garrett Flynn AGPL v3.0

//Allows you to stream data asynchronously with automatic buffering settings
//This hooks in with functions on the remote service backend.
export class remoteStreaming {
	constructor(socket, userinfo) {

		this.socket = socket;
		this.user = userinfo;

		this.LOOPING = true;
		this.delay = 50; //ms update throttle

		this.state = new StateManager(
			{
				commandResult: {},
				sessionInfo: undefined,
			},
			undefined,
			false
		); //triggered-only state
	
		this.streamSettings = {};

		this.STREAMLATEST = 0;
			
	//	 stream1:{
	// 		object:{},
	// 		keys:['key'],
	// 		settings:{
	//      	mode:0,
	//			key:{
	//				mode:0
	// 				lastRead:0,	
	//			}
	//	 }
		
	}

	addStream(name,object={},keys=[],settings={}) {

		for(const prop in settings) {
			settings[prop].lastRead = 0;
			if(!settings[prop].mode) settings.mode = this.STREAMLATEST; //streams all the latest buffered data for the key
			
		}
		
		this.streamSettings[name] = {
			object,
			keys,
			settings
		};

	}

	streamLoop() {
		if(this.LOOPING) {

			
			setTimeout(()=>{this.streamLoop()},this.delay);
		}
	}

}

//Brains@Play session streaming functions
export class streamUtils {
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
					return []
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


export class streamSession {
	constructor(socket) {

		this.deviceStreams = [];

		this.info = {
			subscriptions: info.subscriptions,
			streaming: false,
			deviceStreamParams: [],
			nDevices: 0,
			appStreamParams: [],
			streamCt: 0,
			streamLoopTiming: 50
		};

		this.streamTable = []; //tags and callbacks for streaming
		this.socket = socket;

		this.configureDefaultStreamTable();
	}

	configureDefaultStreamTable(params = []) {
		//Stream table default parameter callbacks to extract desired data from the data atlas
		let getEEGChData = (device, channel, nSamples = 'all') => {
			let get = nSamples;
			if (device?.info?.useAtlas === true) {
				let coord = false;
				if (typeof channel === 'number') {
					coord = device.atlas.getEEGDataByChannel(channel);
				}
				else {
					coord = device.atlas.getEEGDataByTag(channel);
				}
				if (coord !== undefined) {
					if (get === 'all') {
						if (coord.count === 0) return undefined;
						get = coord.count - coord.lastRead;
						coord.lastRead = coord.count; //tracks count of last reading for keeping up to date
						if (get === 0) return undefined;
					}
					if (coord.filtered.length > 0) {
						let times = coord.times.slice(coord.times.length - get, coord.times.length);
						let samples = coord.filtered.slice(coord.filtered.length - get, coord.filtered.length);
						return { times: times, samples: samples };
					}
					else if (coord.raw.length > 0) {
						let times = coord.times.slice(coord.times.length - get, coord.times.length);
						let samples = coord.raw.slice(coord.raw.length - get, coord.raw.length);
						return { times: times, samples: samples };
					}
					else {
						return undefined;
					}
				}
				else {
					return undefined;
				}
			}
		}

		let getEEGFFTData = (device, channel, nArrays = 'all') => {
			let get = nArrays;
			if (device?.info?.useAtlas === true) {
				let coord = false;
				if (typeof channel === 'number') {
					coord = device.atlas.getEEGFFTData(channel);
				}
				else {
					coord = device.atlas.getEEGDataByTag(channel);
				}
				if (coord !== undefined) {
					if (get === 'all') {
						if (coord.fftCount === 0) return undefined;
						get = coord.fftCount - coord.lastReadFFT;
						coord.lastReadFFT = coord.fftCount;
						if (get === 0) return undefined;
					}
					let fftTimes = coord.fftTimes.slice(coord.fftTimes.length - get, coord.fftTimes.length);
					let ffts = coord.ffts.slice(coord.ffts.length - get, coord.ffts.length);
					return { times: fftTimes, ffts: ffts };
				}
				else {
					return undefined;
				}
			}
		}

		let getEEGBandpowerMeans = (device, channel) => {
			if (device?.info?.useAtlas === true) {
				let coord = false;

				coord = device.atlas.getLatestFFTData(channel)[0];

				if (coord !== undefined) {
					return { time: coord.time, bandpowers: coord.mean };
				}
				else {
					return undefined;
				}
			}
		}

		let getEEGCoherenceBandpowerMeans = (device, channel) => {
			if (device?.info?.useAtlas === true) {
				let coord = false;

				coord = device.atlas.getLatestCoherenceData(channel);

				if (coord !== undefined) {
					return { time: coord.time, bandpowers: coord.mean };
				}
				else {
					return undefined;
				}
			}
		}

		let getEEGBandpowerSlices = (device, channel) => {
			if (device?.info?.useAtlas === true) {
				let coord = false;

				coord = device.atlas.getLatestFFTData(channel)[0];

				if (coord !== undefined) {
					return { time: coord.time, bandpowers: coord.slice };
				}
				else {
					return undefined;
				}
			}
		}

		let getEEGCoherenceBandpowerSlices = (device, channel) => {
			if (device?.info?.useAtlas === true) {
				let coord = false;

				coord = device.atlas.getLatestCoherenceData(channel)[0];

				if (coord !== undefined) {
					return { time: coord.time, bandpowers: coord.slice };
				}
				else {
					return undefined;
				}
			}
		}

		let getCoherenceData = (device, tag, nArrays = 'all') => {
			let get = nArrays;
			if (device?.info?.useAtlas === true) {
				let coord = device.atlas.getCoherenceByTag(tag);
				if (coord !== undefined) {
					if (get === 'all') {
						if (coord.fftCount === 0) return undefined;
						get = coord.fftCount - coord.lastRead;
						coord.lastRead = coord.fftCount;
						if (get === 0) return undefined;
					}
					let cohTimes = coord.times.slice(coord.fftTimes.length - get, coord.fftTimes.length);
					let ffts = coord.ffts.slice(coord.ffts.length - get, coord.ffts.length);
					return { times: cohTimes, ffts: ffts };
				}
				else {
					return undefined;
				}
			}
		}

		let getHEGData = (device, tag = 0, nArrays = 'all', prop = undefined) => {
			let get = nArrays;
			if (device?.info?.useAtlas === true) {
				let coord = device.atlas.getDeviceDataByTag('heg', tag);
				if (get === 'all') {
					get = coord.count - coord.lastRead;
					coord.lastRead = coord.count;
					if (get <= 0) return undefined;
				}
				if (coord !== undefined) {
					if (prop !== undefined) {
						let times = coord.times.slice(coord.times.length - get, coord.times.length);
						let data = coord[prop].slice(coord.ffts.length - get, coord.ffts.length);
						let obj = { times: times }; obj[prop] = data;
						return obj;
					}
					else return coord;
				}
				else {
					return undefined;
				}
			}
		}

		this.streamTable = [
			{ prop: 'eegch', callback: getEEGChData },
			{ prop: 'eegfft', callback: getEEGFFTData },
			{ prop: 'eegcoherence', callback: getCoherenceData },
			{ prop: 'eegfftbands', callback: getEEGBandpowerMeans },
			{ prop: 'eegcoherencebands', callback: getEEGCoherenceBandpowerMeans },
			{ prop: 'eegfftbandslices', callback: getEEGBandpowerSlices },
			{ prop: 'eegcoherencebandslices', callback: getEEGCoherenceBandpowerSlices },
			{ prop: 'hegdata', callback: getHEGData }
		];

		if (params.length > 0) {
			this.streamTable.push(...params);
		}
	}

	addStreamFunc(name = '', callback = () => { }) {
		this.streamTable.push({ prop: name, callback: callback });
	}

	removeStreamFunc(name = '') {
		this.streamTable.find((o, i) => {
			if (o.prop === name) {
				return this.streamTable.splice(i, 1);
			}
		})
	}

	configureStreamParams(params = [['prop', 'tag']]) { //Simply defines expected data parameters from the user for server-side reference
		let propsToSend = [];
		params.forEach((param, i) => {
			propsToSend.push(param.join('_'));
		});
		this.socket.send(JSON.stringify({cmd:'addProps',args:[propsToSend]}));
	}

	//pass array of arrays defining which datasets you want to pull from according to the available
	// functions and additional required arguments from the streamTable e.g.: [['eegch','FP1'],['eegfft','FP1']]
	getDataForSocket = (device = undefined, params = [['prop', 'tag', 'arg1']]) => {
		let userData = {};
		params.forEach((param, i) => {
			this.streamTable.find((option, i) => {
				if (param[0] === option.prop) {
					let args;
					if (device) args = [device, ...param.slice(1)];
					else args = param.slice(1);
					let result = (args.length !== 0) ? option.callback(...args) : option.callback()
					if (result !== undefined) {
						if (param[2] !== 'ignore'
						) {
							userData[param.join('_')] = result;
						}
					}
					return true;
				}
			});
		});

		return userData;
		// if(Object.keys(streamObj.userData).length > 0) {
		// 	this.socket.send(JSON.stringify(streamObj));
		// }
	}

	streamLoop = (prev = {}) => {
		let streamObj = {
			id: this.id,
			userData: {}
		}
		if (this.info.streaming === true && this.socket.readyState === 1) {

			this.deviceStreams.forEach((d) => {
				if (this.info.nDevices < this.deviceStreams.length) {
					if (!streamObj.userData.devices) streamObj.userData.devices = [];
					streamObj.userData.devices.push(d.info.deviceName);
					this.info.nDevices++;
				}
				let params = [];
				this.info.deviceStreamParams.forEach((param, i) => {
					if (this.info.deviceStreamParams.length === 0) { console.error('No stream parameters set'); return false; }
					if (param[0].indexOf(d.info.deviceType) > -1) {
						params.push(param);
					}
				});
				if (params.length > 0) {
					Object.assign(streamObj.userData, this.getDataForSocket(d, params));
				}
			});
			Object.assign(streamObj.userData, this.getDataForSocket(undefined, this.info.appStreamParams));
			//if(params.length > 0) { this.sendDataToSocket(params); }

			if (this.info.subscriptions.length > 0) { // Only stream if subscription is established
				if (Object.keys(streamObj.userData).length > 0) {
					this.socket.send(JSON.stringify(streamObj));
				}
			}

			this.info.streamCt++;
			setTimeout(() => { this.streamLoop(); }, this.info.streamLoopTiming);
		}
		else {
			this.getDataForSocket(undefined, this.info.appStreamParams)
			this.info.streamCt = 0;
			setTimeout(() => { this.streamLoop(); }, this.info.streamLoopTiming);
		}
	}
}