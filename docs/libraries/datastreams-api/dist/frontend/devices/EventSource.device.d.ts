import { Device } from './Device';
import { DeviceConstraintsType } from '../types/Devices.types';
export declare type customCallback = {
    tag: string;
    callback: () => {};
};
export declare class EventSourceDevice<T = any> extends Device<T> {
    url: string;
    source?: EventSource;
    customCallbacks: customCallback[];
    api: {
        [x: string]: Function;
    };
    constructor(constraints: DeviceConstraintsType<T>);
    newPostCommand(name?: string, url?: string | undefined, data?: undefined, user?: undefined, pass?: undefined): () => void;
    send: (body: any, url?: string) => Promise<Response>;
    connect: () => Promise<void>;
    _disconnect: () => Promise<void>;
    onconnect: (e: any) => Promise<void>;
    onerror: (e: any) => Promise<void>;
    createEventListeners: () => void;
    removeEventListeners: () => void;
}
