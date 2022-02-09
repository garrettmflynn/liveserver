import { Websocket } from "../utils/WebSocket";
import { PipeTypes, PipeSettingsType, PipeCallbackType } from '../types/Pipes.types';
export declare class Pipe extends EventTarget {
    get [Symbol.toStringTag](): string;
    id: string;
    type: PipeTypes;
    settings: PipeSettingsType;
    socket?: Websocket;
    callback: PipeCallbackType;
    constructor(type?: PipeTypes, settings?: PipeSettingsType);
    process: (data: any) => Promise<any>;
    subscribe: (callback: PipeCallbackType) => void;
    unsubscribe: () => void;
    ondata: (data: any) => void;
}
