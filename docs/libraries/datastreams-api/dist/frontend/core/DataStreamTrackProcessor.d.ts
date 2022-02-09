import { DataStreamTrack } from "./DataStreamTrack";
/**
 *
 * Create a ReadableStream of sensor data modeled after the Insertable Streams API
 *
 */
export declare class DataStreamTrackProcessor {
    track: DataStreamTrack;
    subid?: string;
    readable: ReadableStream;
    constructor(o: {
        track: DataStreamTrack;
    });
    start: (controller: ReadableStreamController<any>) => void;
    pull: () => void;
    cancel: () => void;
}
