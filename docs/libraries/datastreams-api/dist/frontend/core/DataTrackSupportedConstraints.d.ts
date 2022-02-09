import { DataDevices } from "./DataDevices";
export declare class DataTrackSupportedConstraints {
    deviceId?: boolean;
    groupId?: boolean;
    autoGainControl?: boolean;
    channelCount?: boolean;
    echoCancellation?: boolean;
    latency?: boolean;
    noiseSuppression?: boolean;
    sampleRate?: boolean;
    sampleSize?: boolean;
    volume?: boolean;
    aspectRatio?: boolean;
    facingMode?: boolean;
    frameRate?: boolean;
    height?: boolean;
    width?: boolean;
    resizeMode?: boolean;
    cursor?: boolean;
    displaySurface?: boolean;
    logicalSurface?: boolean;
    constructor(stream: DataDevices);
}
