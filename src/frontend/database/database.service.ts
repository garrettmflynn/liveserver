import StateManager from 'anotherstatemanager'
import { Service } from 'liveserver-router';
import { MessageObject } from 'src/common/general.types';

//OSC stream frontend calls
export class DatabaseClient extends Service{

	name = 'database'
	routes = []

	constructor() {

		super()

	}

}

