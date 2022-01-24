import StateManager from 'anotherstatemanager'
import { Service } from '@brainsatplay/liveserver-common/Service';
import { MessageObject } from 'src/common/general.types';

//OSC stream frontend calls
export class DebugService extends Service{

	name = 'debug'
	routes = [
		{
			route: 'log',
			callback: (self, args, id) => {
				console.log(self, args, id)
			}
		}
	]

	constructor() {

		super()

	}

}

