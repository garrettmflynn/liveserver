import { MessageType } from '../types/Core.types';
export declare class Websocket {
    url: string;
    sendBuffer: any[];
    callbacks: Map<string, (data: object) => any>;
    ready: boolean;
    ws?: WebSocket;
    constructor(url: string | undefined, protocols: {
        auth?: string;
        services?: string[];
        [x: string]: any;
    });
    _onopen: () => void;
    _onclose: () => void;
    _onerror: (e: Event) => Event;
    _onmessage: (res: MessageType) => void;
    onopen: (arg?: any) => any;
    onclose: (arg?: any) => any;
    onerror: (arg?: any) => any;
    onmessage: (arg?: any) => any;
    addEventListener: (name: string, callback: (val: object) => any) => void;
    close: () => void;
    send: (data: object, service?: string) => Promise<unknown>;
}
