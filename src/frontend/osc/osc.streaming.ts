import StateManager from 'anotherstatemanager'
import { Service } from '@brainsatplay/liveserver-common';
import { MessageObject } from 'src/common/general.types';

//OSC stream frontend calls
export class OSCClient extends Service{

	name = 'osc'
	state = new StateManager();

	// Responses to Monitor
	routes = [
			{
				route: 'oscData',
				callback: (message:any) => {
					this.state.setState(message.address+'_'+message.port, message.oscData); //update state
				}
			},
			{
				route: 'oscInfo',
				callback: (message:any) => {
					this.state.setState('oscInfo', message); //update state
				}
			},
			{
				route: 'oscClosed',
				callback: (message:any) => {
					this.state.setState('oscClosed', message); //update state
				}
			},
			{
				route: 'oscError',
				callback: (message:any) => {
					this.state.setState('oscError', message); //update state
				}
			}
		]

	constructor() {

		super()

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
		let info = await this.notify({route: 'startOSC', message: [localAddress, localPort, remoteAddress, remotePort]})
		callback(info)

		if(info.message === true) {
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
		
		return await this.notify({route: 'sendOSC', message: [message, localAddress, localPort, remoteAddress, remotePort]})
	}

	async stopOSC(
		localAddress = "127.0.0.1",
		localPort = 57121,
		remoteAddress = undefined,
		remotePort = undefined
	) {

		if(!remoteAddress) remoteAddress = localAddress;
		if(!remotePort) remotePort = localPort;
		
		let info = await this.notify({route: 'stopOSC', message: [localAddress, localPort, remoteAddress, remotePort]})
		
		if(info.message) {
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

		let result: {
			updateSub?: string
			frameSub?: string
		} = {};
		
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
				if (newResult.message === 'oscInfo') {
					onsuccess(newResult.oscInfo);
					this.state.unsubscribeTrigger('commandResult', sub);
					return newResult.oscInfo
				}
			}
			else if (newResult.message === 'oscError') {
				this.state.unsubscribeTrigger('commandResult', sub);
				console.log("OSC Error", newResult.oscError);
				return []
			}
		});
	}

	// stopOSC(localAddress="127.0.0.1",localPort=57121, onsuccess = (newResult) => { }){

	// }

 */