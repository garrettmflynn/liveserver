import StateManager from 'anotherstatemanager'
import { Service } from '@brainsatplay/liveserver-common/Service';
import { MessageObject } from 'src/common/general.types';

//OSC stream frontend calls
export class UnsafeService extends Service{

	name = 'unsafe'
	routes = []

	constructor() {

		super()

	}

}

