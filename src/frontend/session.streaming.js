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
				'getUserStreamData',
				[userId],
				this.id,
				this.socketId,
				callback
			);
		}		
	}

	getUsersInSession(sessionId,callback=(result)=>{}) {
		if (this.socket?.readyState === 1) {
			this.WebsocketClient.run(
				'getSessionUsers',
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
	async createSession(
		options={
			type:'room', //'user','room','hostroom'
			appname:`app${Math.floor(Math.random()*1000000000000)}`,
			//id:'user123', //alternatively supply a user id to subscribe to
			object:{},
			settings:{}
		}, 
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1) {
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
				this.WebsocketClient.run(
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
				.then(info => {

				})
				.catch(err => console.error(err));
			}
			else if (options.type === 'user') {
				this.WebsocketClient.run( //subscribes you to a user stream by their id
					'subscribeToUser',
					[
						options.id,
						options.propnames
					],
					this.id,
					this.socketId,
					callback
				)
				.then(info => {

				})
				.catch(err => console.error(err));
			}
		}
	}

	subscribeToSession(
		id,
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1 && id) {

		}
	}

	removeSession(
		id, 
		callback=(result)=>{}
	) {
		if (this.socket?.readyState === 1 && id) {

		}
	}

	//TODO: implement the rest of the backend commands


}
