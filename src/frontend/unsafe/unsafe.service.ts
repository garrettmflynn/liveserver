import StateManager from 'anotherstatemanager'
import { Service } from '@brainsatplay/liveserver-common';
import { MessageObject } from 'src/common/general.types';

//OSC stream frontend calls
export class UnsafeClient extends Service{

	name = 'unsafe'
	routes = []

	constructor() {

		super()

	}

}

