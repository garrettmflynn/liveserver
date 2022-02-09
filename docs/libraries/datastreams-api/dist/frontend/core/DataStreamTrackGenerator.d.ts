/**
 *
 * Create a WritableStream of sensor data modeled after the Insertable Streams API
 *
 */
import { DataStreamTrack } from "./DataStreamTrack";
export declare class DataStreamTrackGenerator extends DataStreamTrack {
    writable: WritableStream;
    constructor();
    start: () => void;
    write: (chunk: any) => void;
    close: () => void;
    abort: (reason: any) => void;
}
