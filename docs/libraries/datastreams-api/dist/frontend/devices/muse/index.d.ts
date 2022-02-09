import * as musejs from 'muse-js';
import { Device } from '../Device';
export declare const device: typeof musejs.MuseClient;
export declare const onconnect: (dataDevice: Device<musejs.MuseClient>) => Promise<void>;
