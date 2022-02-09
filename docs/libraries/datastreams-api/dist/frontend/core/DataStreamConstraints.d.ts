import { DataTrackConstraints } from "./DataTrackConstraints";
export declare class DataStreamConstraints {
    audio: boolean | DataTrackConstraints;
    video: boolean | DataTrackConstraints;
    peerIdentity: null | string;
    constructor();
}
