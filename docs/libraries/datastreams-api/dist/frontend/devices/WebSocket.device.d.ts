import { Device } from "./Device";
import { DeviceConstraintsType } from '../types/Devices.types';
import { Websocket } from '../utils/WebSocket';
export declare class WebSocketDevice<T = any> extends Device<T> {
    socket?: Websocket;
    constructor(constraints: DeviceConstraintsType);
    _connect: () => Promise<void>;
    _disconnect: () => Promise<void>;
    send: (msg: object) => Promise<unknown>;
}
