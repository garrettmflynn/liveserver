import { DataStreamTrack } from "./DataStreamTrack";
export declare class DataChannel extends DataStreamTrack {
    id: string;
    label: string;
    parent: RTCDataChannel;
    constructor(parent: RTCDataChannel);
    send: (data: any) => void;
    sendMessage: (_: any) => any;
}
