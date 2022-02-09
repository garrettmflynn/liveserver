import { Websocket } from '../utils/WebSocket';
import { DataStream } from '../core/DataStream';
import { DataChannel } from '../core';
export declare type PipeTypes = 'server' | 'stream' | 'gpu' | 'device';
export declare type PipeCallbackType = (data: any) => any;
export declare type PipeSettingsType = {
    callback?: PipeCallbackType;
    socket?: Websocket;
    server?: string;
    auth?: string;
    source?: DataStream;
    element?: HTMLVideoElement;
    function?: (args: any[]) => {};
};
export declare type DataChannelInfoType = {
    name?: string;
    peer?: string;
    reciprocated?: boolean;
    channel?: DataChannel | RTCDataChannel;
    callback?: DataChannelCallbackType;
};
export declare type DataChannelCallbackType = (msg: any, channel: DataChannel) => void;
