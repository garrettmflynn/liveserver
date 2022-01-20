import StateManager from 'anotherstatemanager'
import { DataStreaming } from '../datastream/data.streaming.js';

//Joshua Brewster, Garrett Flynn AGPL v3.0
export class SessionStreaming {
	constructor(WebsocketClient, userinfo={_id:'user'+Math.floor(Math.random()*10000000000)}, socketId) {
		
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
		
		this.state = new StateManager();

        this.id = Math.floor(Math.random() * 10000000000); // Give the session an ID
		
		this.apps 		   = new Map();
		this.subscriptions = new Map();

		this.datastream = new DataStreaming(WebsocketId,this.socketId,userinfo);

		this.WebsocketClient.addCallback('SessionStreaming',(res)=>{
			if(res.cmd === 'sessionData' && res.output.id) {
				this.state.setState(res.output.id,res.output);
			}
		})

	}

	async getUser(userId,callback=(result)=>{}) {
		return await this.WebsocketClient.run(
			'getUserStreamData',
			[userId],
			this.id,
			this.socketId,
			callback
		);	
	}

	async getUsersInSession(sessionId,callback=(result)=>{}) {
		return await this.WebsocketClient.run(
			'getSessionUsers',
			[sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	async getSessionsFromServer(appname,callback=(result)=>{}) {
		return await this.WebsocketClient.run(
			'getSessions',
			[appname],
			this.id,
			this.socketId,
			callback
		);
	}

	async getSessionData(sessionId,callback=(result)=>{}) {
		return await this.WebsocketClient.run(
			'getSessionData',
			[sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	//create and subscribe to a live data session
	async createSession(
		options={
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
		this.datastream.setStream(
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
			let info = await this.WebsocketClient.run(
				'createSession',
				[
					options.appname,
					options.type,
					sessionSettings
				],
				this.id,
				this.socketId,
				callback
			)
			if(info.output?.id) 
			{	
				this.state.setState(info.output.id,info.output);
				if(typeof onupdate === 'function') this.state.subscribeTrigger(info.output.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.output.id, onframe);
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
		let info = await this.WebsocketClient.run( //subscribes you to a user stream by their id
			'subscribeToUser',
			[
				userId,
				propnames
			],
			this.id,
			this.socketId,
			callback
		)
		if(info.output?.id) 
		{	
			this.state.setState(info.output.id,info.output);
			if(typeof onupdate === 'function') this.state.subscribeTrigger(info.output.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.output.id, onframe);
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
		let info = await this.WebsocketClient.run(
			'subscribeToSession',
			[sessionId],
			this.id,
			this.socketId,
			callback
		)
		if(info.output?.id) 
		{	

			if(defaultStreamSetup) {
				let object = {};
				for(const prop in info.output.propnames) {
					object[prop] = undefined;
				}

				//set up the data stream
				this.datastream.setStream(
					object,
					{
						keys:info.output.propnames
					},
					info.output.appname 
				);

				//do this.datastream.updateStreamData(info.output.appname, {propname:'newdata'})
			}

			this.state.setState(info.output.id,info.output);
			if(typeof onupdate === 'function') this.state.subscribeTrigger(info.output.id, onupdate);
			if(typeof onframe === 'function') this.state.subscribe(info.output.id, onframe);
		}
		return info;
	}

	async unsubscribe( //can kick yourself or another user from a session
		sessionId, //session id to unsubscribe from
		userId=this.user._id, //user id to unsubscribe from session (yours by default)
		callback=(result)=>{}
	) {
		let result = await this.WebsocketClient.run(
			'unsubscribeFromSession',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);

		if(result.output) {
			this.state.unsubscribeAll(sessionId);
		}
		
	}

	//alias
	kick = this.unsubscribe

	//set values in a session, careful not to overwrite important stuff
	async setSessionSettings(
		sessionId,
		settings={}, //e.g. {propnames:['abc']}
		callback=(result)=>{}
	) {
		return await this.WebsocketClient.run(
			'setSessionSettings',
			[sessionId, settings],
			this.id,
			this.socketId,
			callback
		);
	}

	//delete a user or room session
	async deleteSession(
		sessionId, 
		callback=(result)=>{}
	) {
		if(!sessionId) return undefined;
		let result = await this.WebsocketClient.run(
			'deleteSession',
			[sessionId],
			this.id,
			this.socketId,
			callback
		);

		if(result.output) {
			this.state.unsubscribeAll(sessionId);
		}

		return result;
	}

	async makeHost( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'makeHost',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
		
	}

	//admins can make mods or kick and ban, only owners can make admins
	async makeAdmin( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'makeAdmin',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	//mods can kick and ban or make more mods
	async makeModerator( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'makeModerator',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	async makeOwner( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'makeOwner',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	async removeAdmin( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'removeAdmin',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	async removeModerator( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'removeModerator',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}	

	//user will not be able to rejoin
	async banUser( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'banUser',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}

	async unbanUser( 
		userId,
		sessionId,
		callback=(result)=>{}
	) {
		if(!userId || !sessionId) return undefined;
		return await this.WebsocketClient.run(
			'unbanUser',
			[userId, sessionId],
			this.id,
			this.socketId,
			callback
		);
	}
	
	//manual stream updates if the server isn't looping automatically, ignore otherwise
	async updateUserStream( 
		sessionId,
		callback=(result)=>{}
	) {
		if(!sessionId) return undefined;
		return await this.WebsocketClient.run(
			'updateUserStream',
			[sessionId],
			this.id,
			this.socketId,
			callback
		);
	}
		
	async updateSessionUsers( 
		sessionId,
		callback=(result)=>{}
	) {
		if(!sessionId) return undefined;
		return await this.WebsocketClient.run(
			'updateSessionUsers',
			[sessionId],
			this.id,
			this.socketId,
			callback
		);
	}
}
