//OSC stream frontend calls
export class WebsocketOSCStreaming {
	constructor(WebsocketClient, socketId) {
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
		
		this.state = new StateManager();

        this.id = Math.floor(Math.random() * 10000000000); // Give the session an ID

		this.WebsocketClient.addCallback('OSCStreaming',(result) => {
			if(result.oscData){
				this.setState(result.address+'_'+result.port, result.oscData); //update state
			}
			if(result.oscError){
				this.setState('oscError', result.oscError); //update state
			}
			if(result.oscInfo){
				this.setState('oscInfo', result.oscInfo); //update state
			}
		})
		
	}

	async startOSC(
		localAddress = "127.0.0.1",
		localPort = 57121,
		remoteAddress = undefined,
		remotePort = undefined,
		callback=(result)=>{},
		onupdate=undefined,
		onframe=undefined
	) {
		if (!remoteAddress) remoteAddress = localAddress
		if (!remotePort) remotePort = localPort

		let info = await this.WebsocketClient.run(
			'startOSC',
			[localAddress, localPort, remoteAddress, remotePort],
			this.id,
			this.socketId,
			callback
		);

		if(info.output === true) {
			if(typeof onupdate === 'function') this.state.subscribeTrigger(remoteAddress+'_'+remotePort,onupdate);
			if(typeof onframe === 'function') this.state.subscribe(remoteAddress+'_'+remotePort,onframe);
		}
	}

	async sendOSC(
		message='test',
		localAddress = "127.0.0.1",
		localPort = 57121,
		remoteAddress = undefined,
		remotePort = undefined
	) {

		if(!remoteAddress) remoteAddress = localAddress;
		if(!remotePort) remotePort = localPort;
		
		await this.WebsocketClient.run(
			'sendOSC',
			[message, localAddress, localPort, remoteAddress, remotePort],
			this.id,
			this.socketId,
			callback
		);

		return true;
	}

	async stopOSC(
		localAddress = "127.0.0.1",
		localPort = 57121,
		remoteAddress = undefined,
		remotePort = undefined
	) {

		if(!remoteAddress) remoteAddress = localAddress;
		if(!remotePort) remotePort = localPort;
		
		let info = await this.WebsocketClient.run(
			'stopOSC',
			[localAddress, localPort, remoteAddress, remotePort],
			this.id,
			this.socketId,
			callback
		);

		if(info.output) {
			this.state.unsubscribeAll(remoteAddress+'_'+remotePort);
		}
	}

	subscribeToUpdates(
		remoteAddress,
		remotePort,
		onupdate=undefined,
		onframe=undefined
	) {
		if(!remoteAddress || !remotePort) return undefined;

		let sub1,sub2;
		if(typeof onupdate === 'function') sub1 = this.state.subscribeTrigger(remoteAddress+'_'+remotePort,onupdate);
		if(typeof onframe === 'function') sub2 = this.state.subscribe(remoteAddress+'_'+remotePort,onframe);

		let result = {};
		if(sub1) result.updateSub = sub1;
		if(sub2) result.frameSub = sub2;

		if(Object.keys(result).length > 0)
			return result;
		else return undefined;
	}

	unsubscribeAll(
		remoteAddress,
		remotePort
	) {
		this.state.unsubscribeAll(remoteAddress+'_'+remotePort);
		return true;
	}

}


/**
 * 
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

 */