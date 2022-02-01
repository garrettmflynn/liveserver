import StateManager from 'anotherstatemanager'
import { MessageObject, SettingsObject } from '../../common/general.types';
import { DataStreaming } from '../stream/stream.frontend';
import { Service } from '../../router/Service'

//Joshua Brewster, Garrett Flynn AGPL v3.0
export class SessionsClient extends Service {
	
	name = 'sessions'
	service = 'sessions'
	
	user: any
	state = new StateManager();
	apps = new Map();
	subscriptions = new Map();
	protocols = {
		websocket: true
	}

	constructor(router, userinfo={_id:'user'+Math.floor(Math.random()*10000000000)}) {
		
		super(router)
		
		this.user = userinfo;
		
		this.services.datastream = new DataStreaming(userinfo);

		//  Pass Datastream Values to the UsersClient
		this.services.datastream.subscribe((o) => {
			this.notify(o)
		})
		
		// Add Routes to Listen For
		this.routes.push({
			route: 'sessionData',
			callback: (self, args)=>{
				if(args[0]) {
					this.state.setState(args[0],args[1]); // id, message
				}
			},
		})
	}

	async getUser(userId,callback=(result)=>{}) {
		let res = await this.notify({route: 'getUserStreamData', message: [userId]})
		callback(res)
		return res
	}

	async getUsersInSession(sessionId,callback=(result)=>{}) {
		let res = await this.notify({route: 'getSessionUsers', message: [sessionId]})
		callback(res)
		return res
	}

	async getSessionsFromServer(appname,callback=(result)=>{}) {
		let res = await this.notify({route: 'getSessions', message: [appname]})
		callback(res)
		return res
	}

	async getSessionData(sessionId,callback=(result)=>{}) {
		let res = await this.notify({route: 'getSessionData', message: [sessionId]})
		callback(res)
		return res
	}

	//create and subscribe to a live data session
	async createSession(
		options: SettingsObject = {
			type:'room', //'user','room','hostroom'
			appname:`app${Math.floor(Math.random()*1000000000000)}`,
			//id:'user123', //alternatively supply a user id to subscribe to
			object:{},  //data structure the outgoing datastream (see DataStreaming class)
			settings:{} //settings for the outgoing datastream (see DataStreaming class)
		}, 
		callback=(result)=>{}, 	//runs once on return
		onupdate=undefined, 	//per-update responses e.g. sequential data operations
		onframe=undefined   	//frame tick responses e.g. frontend updates
	) {
		//first some idiotproofing
		if(!options.appname && options.type !== 'user') options.appname=`app${Math.floor(Math.random()*1000000000000)}`;
		else if (!options.id && options.type === 'user') return false;
		if(!options.type) options.type = 'room';
		if(!options.object) options.object = {test:0};
		if(!options.settings) options.settings = {};
		if(!options.settings.keys) options.settings.keys = Array.from(Object.keys(options.object));

		//set up the data stream
		this.services.datastream.setStream(
			options.object,
			options.settings,
			options.appname 
		);

		//set up the session
		let sessionSettings = {
			propnames:options.settings.keys
		};

		for(const prop in options) {
			if(prop !== 'object' && prop !== 'type' && prop !== 'settings')
				sessionSettings[prop] = options[prop]; //add arbitrary settings
		}

		if(options.type === 'room' || options.type === 'hostedroom') {
			let info = await this.notify({route: 'createSession', message: [
				options.appname,
				options.type,
				sessionSettings
			]})
			callback(info)

			if(info?.message?.id) 
			{	
				this.state.setState(info.message.id,info.message);
				if(typeof onupdate === 'function') this.state.subscribeTrigger(info.message.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.message.id, onframe);
			}
			return info;
		}
		else if (options.type === 'user') {
			return await this.subscribeToUser(
				options.id,
				options.propnames,
				callback,
				onupdate,
				onframe
			);
		}
		
	}

	async subscribeToUser(
		userId, //id of user to subscribe to
		propnames=[], //props of the user to listen to
		callback=(result)=>{}, //one-off callback
		onupdate=undefined,  //per-update responses e.g. sequential data operations
		onframe=undefined //frame tick responses e.g. frontend updates
	) {

		let info = await this.notify({route: 'subscribeToUser', message: [
			userId,
			propnames
		]})
		callback(info)
		if(info.message?.id) 
		{	
			this.state.setState(info.message.id,info.message);
			if(typeof onupdate === 'function') this.state.subscribeTrigger(info.message.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.message.id, onframe);
		}
		return info;
	}

	//subscribe to a game session
	async subscribeToSession(
		sessionId,				//id of the session you are subscribing to
		defaultStreamSetup=true, //default streaming setup (All Latest Values supplied to object)
		callback=(result)=>{}, //runs once on return
		onupdate=undefined, //per-update responses e.g. sequential data operations
		onframe=undefined, //frame tick responses e.g. frontend updates
		
	) {
		let info = await this.notify({route: 'subscribeToSession', message: [sessionId]})
		callback(info)
	
		if(info.message?.id) 
		{	

			if(defaultStreamSetup) {
				let object = {};
				for(const prop in info.message.propnames) {
					object[prop] = undefined;
				}

				//set up the data stream
				this.services.datastream.setStream(
					object,
					{
						keys:info.message.propnames
					},
					info.message.appname 
				);

				//do this.services.datastream.updateStreamData(info.message.appname, {propname:'newdata'})
			}

			this.state.setState(info.message.id,info.message);
			if(typeof onupdate === 'function') this.state.subscribeTrigger(info.message.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.message.id, onframe);
		}
		return info;
	}

	async unsubscribeFromSession( //can kick yourself or another user from a session
		sessionId, //session id to unsubscribe from
		userId=this.user._id, //user id to unsubscribe from session (yours by default)
		callback=(result)=>{}
	) {
		let result = await this.notify({route: 'unsubscribeFromSession', message: [userId, sessionId]})
		callback(result)
		if(result.message) {
			this.state.unsubscribeAll(sessionId);
		}
		
	}

	//alias
	kick = this.unsubscribeFromSession

	//set values in a session, careful not to overwrite important stuff
	async setSessionSettings(
		sessionId,
		settings={}, //e.g. {propnames:['abc']}
		callback=(result)=>{}
	) {
		let res = await this.notify({route: 'setSessionSettings', message: [sessionId, settings]})
		callback(res)
		return res
	}

	//delete a user or room session
	async deleteSession(
		sessionId, 
		callback=(res)=>{}
	) {
		if(!sessionId) return undefined;
		let res = await this.notify({route: 'deleteSession', message: [sessionId]})
		callback(res)

		if(res.message) {
			this.state.unsubscribeAll(sessionId);
		}

		return res;
	}

	async makeHost( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'makeHost', message: [userId, sessionId]})
		callback(res)
		return res
	}

	//admins can make mods or kick and ban, only owners can make admins
	async makeAdmin( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'makeAdmin', message: [userId, sessionId]})
		callback(res)
		return res
	}

	//mods can kick and ban or make more mods
	async makeModerator( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'makeModerator', message: [userId, sessionId]})
		callback(res)
		return res
	}

	async makeOwner( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'makeOwner', message: [userId, sessionId]})
		callback(res)
		return res
	}

	async removeAdmin( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'removeAdmin', message: [userId, sessionId]})
		callback(res)
		return res
	}

	async removeModerator( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'removeModerator', message: [userId, sessionId]})
		callback(res)
		return res
	}	

	//user will not be able to rejoin
	async banUser( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'banUser', message: [userId, sessionId]})
		callback(res)
		return res
	}

	async unbanUser( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		let res = await this.notify({route: 'unbanUser', message: [userId, sessionId]})
		callback(res)
		return res
	}
	
	//manual stream updates if the server isn't looping automatically, ignore otherwise
	async updateUserStream( 
		sessionId,
		callback=(result)=>{}
	) {
		if(!sessionId) return undefined;
		let res = await this.notify({route: 'updateUserStream', message: [sessionId]})
		callback(res)
		return res
	}
		
	async updateSessionUsers( 
		sessionId,
		callback=(result)=>{}
	) {
		if(!sessionId) return undefined;
		let res = await this.notify({route: 'updateSessionUsers', message: [sessionId]})
		callback(res)
		return res
	}
}
