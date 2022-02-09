import { DataStreamTrack } from "./DataStreamTrack";
export declare class DataStream extends MediaStream {
    tracks: Map<(string | number), (MediaStreamTrack | DataStreamTrack)>;
    onaddtrack: any;
    addTrack: (track: DataStreamTrack | MediaStreamTrack) => DataStreamTrack | MediaStreamTrack;
    _addTrack: Function;
    _getTracks: Function;
    _removeTrack: Function;
    get [Symbol.toStringTag](): string;
    constructor(arg?: DataStream | DataStreamTrack[] | MediaStream | MediaStreamTrack[]);
    getDataTracks: () => (DataStreamTrack | MediaStreamTrack)[];
}
